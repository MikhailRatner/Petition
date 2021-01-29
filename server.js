///////////////////////////////
////// Require & Use //////////
///////////////////////////////

const express = require("express"); //requiring express
const app = express(); //making instance of it

const hb = require("express-handlebars");
app.engine("handlebars", hb());
app.set("view engine", "handlebars");

app.use(express.static("public")); // makes sure we serve our static project files

let cookie_sec;
if (process.env.cookie_secret) {
    //we are in production
    cookie_sec = process.env.cookie_secret;
}

const cookieSession = require("cookie-session");
app.use(
    cookieSession({
        secret: `I'm not a hacker.`,
        maxAge: 1000 * 60 * 60 * 24 * 356,
    })
);

app.use(
    express.urlencoded({
        extended: false,
    })
);

const csurf = require("csurf");
app.use(csurf());
app.use(function (req, res, next) {
    res.locals.csrfToken = req.csrfToken();
    next();
});

app.use(function (req, res, next) {
    res.setHeader("x-frame-options", "deny");
    next();
});

const { hash, compare } = require("./bc");

const db = require("./db"); // requiring our db module that holds all the db queries we want to run
const {
    requireLoggedOutUser,
    requireLoggedInUser,
    requireSignature,
    requireNoSignature,
} = require("./middleware");

///////////////////////////////
//////////HOMEPAGE/////////////
///////////////////////////////

app.get("/", (req, res) => {
    res.redirect("/home");
});

app.get("/home", (req, res) => {
    res.render("home", {
        pageTitel: "Home",
    });
});

///////////////////////////////
//////////REGISTER/////////////
///////////////////////////////

app.get("/register", requireLoggedOutUser, (req, res) => {
    res.render("register", {
        pageTitel: "Registration",
    });
});

app.post("/register", (req, res) => {
    //console.log("INPUT PW:", req.body.inputPw);
    hash(req.body.inputPw)
        .then((hashedPW) => {
            return db.addUser(
                req.body.firstName,
                req.body.lastName,
                req.body.email,
                hashedPW
            );
        })
        .then((dbFeedback) => {
            //console.log("DB FEEDBACK:", dbFeedback);
            req.session.userID = dbFeedback.rows[0].id;
            //console.log("USER ID: ", req.session.userID);
            res.redirect("/profile");
        })
        .catch((err) => {
            console.log("error in addUser:", err);
            res.render("register", {
                err: true,
            });
        });
});

///////////////////////////////
////////// LOGIN  /////////////
///////////////////////////////

app.get("/login", requireLoggedOutUser, (req, res) => {
    res.render("login", {
        pageTitel: "Login",
    });
});

app.post("/login", (req, res) => {
    //console.log("INPUT : ", req.body);
    db.getUserDataByMail(req.body.email)
        .then((dbFeedback) => {
            //console.log("DB FEEDBACK: ", dbFeedback.rows[0]);
            return compare(req.body.inputPw, dbFeedback.rows[0].password).then(
                (match) => {
                    //console.log("VALUE FROM COMPARE: ", match);
                    if (match == true) {
                        req.session.userID = dbFeedback.rows[0].userid;
                        //console.log("USER ID", req.session.userID);
                        req.session.signatureId = dbFeedback.rows[0].sigid;
                        //console.log("SIGN ID", req.session.signatureId);
                        if (req.session.signatureId) {
                            res.redirect("/thanks");
                        } else {
                            res.redirect("/petition");
                        }
                    } else {
                        res.render("login", {
                            err: true,
                        });
                    }
                }
            );
        })
        .catch((err) => {
            console.log("error in getUserDataByMail:", err);
            res.render("login", {
                err: true,
            });
        });
});

///////////////////////////////
//////////PROFILE/////////////
///////////////////////////////

app.get("/profile", requireLoggedInUser, (req, res) => {
    res.render("profile", {
        pageTitel: "Profile",
    });
});

app.post("/profile", (req, res) => {
    //if url doesn't start with  http or https - clean it up
    // and insert the cleaned up version in the db
    if (!req.body.homepage.startsWith("http") && req.body.homepage.length > 0) {
        req.body.homepage = "http://" + req.body.homepage;
        //console.log("SCRIPT: ", req.body.homepage);
        db.addProfile(
            req.body.age,
            req.body.city,
            req.body.homepage,
            req.session.userID
        )
            .then(() => {
                res.redirect("/petition");
            })
            .catch((err) => {
                console.log("error in addProfile:", err);
                res.render("profile", {
                    err: true,
                });
            });
    } else {
        //console.log("SCRIPT: ", req.body.homepage);
        db.addProfile(
            req.body.age,
            req.body.city,
            req.body.homepage,
            req.session.userID
        )
            .then(() => {
                res.redirect("/petition");
            })
            .catch((err) => {
                console.log("error in addProfile:", err);
                res.render("profile", {
                    err: true,
                });
            });
    }
});

///////////////////////////////
//////////PETITION/////////////
///////////////////////////////

app.get("/petition", requireLoggedInUser, requireNoSignature, (req, res) => {
    res.render("petition", {
        //layout: "main",
        pageTitel: "Petition signing",
    });
});

app.post("/petition", (req, res) => {
    //console.log("START PETITION: ", req.body); //gives an object, so we have to look for the row property
    db.addSignature(req.body.signature, req.session.userID)
        .then((dbFeedback) => {
            req.session.signatureId = dbFeedback.rows[0].id;
            //console.log("SIGNATURE ID: ", req.session.signatureId);
            res.redirect("/thanks");
        })
        .catch((err) => {
            //console.log("error in addSignature:", err);
            res.render("petition", {
                err: true,
            });
        });
});

///////////////////////////////
////////// THANKS /////////////
///////////////////////////////

app.get("/thanks", requireLoggedInUser, requireSignature, (req, res) => {
    //console.log("SHOW SIGN ID IN THANKS: ", req.session.signatureId);
    db.showSignature(req.session.userID)
        .then((userSignature) => {
            //console.log("results from show Signature: ", userSignature);
            res.render("thanks", {
                pageTitel: `Thank you`,
                imgSignatureData: userSignature.rows[0].signature,
            });
        })
        .catch((err) => {
            console.log("error in showSignature:", err);
        });
});

app.post("/thanks", (req, res) => {
    db.deleteSignature(req.session.userID)
        .then(() => {
            req.session.signatureId = null;
            res.redirect("/petition");
        })
        .catch((err) => {
            console.log("error in deleteSignature:", err);
        });
});

///////////////////////////////
//////////SIGNERS /////////////
///////////////////////////////

app.get("/signers", requireLoggedInUser, requireSignature, (req, res) => {
    db.getAllSignersData()
        .then((allData) => {
            //console.log(allData.rows);
            res.render("signers", {
                pageTitel: `Signers`,
                signedNames: allData.rows,
            });
        })
        .catch((err) => {
            console.log("error in getAllSignersData:", err);
        });
});

app.get(`/signers/:city`, requireLoggedInUser, requireSignature, (req, res) => {
    /* console.log("PARAMS: ", req.params.city); */
    const { city } = req.params;
    db.getAllSignersByCity(city).then((allSignersByCity) => {
        //console.log(allSignersByCity.rows);
        res.render("signers", {
            pageTitel: `signers`,
            signedNames: allSignersByCity.rows,
        });
    });
});

///////////////////////////////
//////////  EDIT  /////////////
///////////////////////////////

app.get("/edit", requireLoggedInUser, (req, res) => {
    //console.log("COOKIE: ", req.session.userID);
    db.getAllUserData(req.session.userID)
        .then((allUserData) => {
            //console.log(allUserData.rows[0]);

            res.render("editProfile", {
                pageTitel: `Edit your profile`,
                allD: allUserData.rows,
            });
        })
        .catch((err) => {
            console.log("error in getAllSignersData:", err);
        });
});

app.post("/edit", (req, res) => {
    if (req.body.inputPw) {
        db.updateUserWithPw(
            req.body.firstName,
            req.body.lastName,
            req.body.email,
            req.body.inputPw,
            req.session.userID
        ).then(() => {
            if (
                !req.body.homepage.startsWith("http") &&
                req.body.homepage.length > 0
            ) {
                //console.log(req.body.homepage.length);
                req.body.homepage = "http://" + req.body.homepage;
                //console.log(req.body.homepage);
            }
            db.updateUserProfile(
                req.body.age,
                req.body.city,
                req.body.homepage,
                req.session.userID
            )
                .then(() => {
                    res.redirect("/thanks");
                })
                .catch((err) => {
                    console.log("error in updateUserWithPw:", err);
                });
        });
    } else {
        db.updateUserNoPw(
            req.body.firstName,
            req.body.lastName,
            req.body.email,
            req.session.userID
        ).then(() => {
            if (
                !req.body.homepage.startsWith("http") &&
                req.body.homepage.length > 0
            ) {
                //console.log(req.body.homepage.length);
                req.body.homepage = "http://" + req.body.homepage;
                //console.log(req.body.homepage);
            }
            db.updateUserProfile(
                req.body.age,
                req.body.city,
                req.body.homepage,
                req.session.userID
            )
                .then(() => {
                    res.redirect("/thanks");
                })
                .catch((err) => {
                    console.log("error in updateUserNoPw:", err);
                });
        });
    }
});

app.get("/logout", requireLoggedInUser, (req, res) => {
    req.session = null;
    res.redirect("/home");
});

//Start listening for requests.
app.listen(process.env.PORT || 8080, () =>
    console.log("petition server is listening...")
);

/* ------------------------------------------------------------- */

//express is a framework that makes serving websites with Node much easier. Many tasks of involved in HTTP Request Listenere and Portofolio projects are done automatically by Express!

//handlebars is a language for creating templates. In templates we write HTML as you would for static content but leave in it markers where dynamic data should be inserted.
//Express has a built-in mechanism to support server-side templates but does not require any particular template language. express-handlebars is an engine for the handlebars langugage

//const path = require("path"); // dont think we need this?! -> used when you need absolute paths ("normalizing")

/*
We use the cookie-session middleware to prevent our cookies being tampered with. After 'use' it a session object is available on req objects.
Any properties you add to req.session will be available to you on subsequent requests. Before responses are sent, the middleware causes this object to be stringified, base64 encoded, and written to a cookie. When requests are received, the middleware decodes the string, parses it, and attaches it to the request object before your routes run, making it available to you.
Tampering is prevented because of a second cookie that is automatically added. This cookie contains a hash of the data contained in the first one. Any disparity in what was sent and what is subsequently received will be detected.
*/

//urlencoded takes input which the user entered in input field in a form -> converts it into an object called body. Then i have acces to req.body

//app.get - This would be a good time to add your first route, i.e., tell Express what to do when a request is made for a specific url using a specific HTTP method.
//The use of the get method means that the handler specified as the second argument will only run for GET requests to /petition.
//Route handlers are passed request and response objects that have been enhanced by Express. For example, response objects have a send method. Full descriptions of request and response objects in Express are available here and here.

//What res.render will do is first render the template specified by the first argument. It will then render the layout, passing the rendered main template to it as a property named body. The reason {{{body}}} in the layout uses triple curly braces is to tell Handlebars not to escape HTML control characters such as < and >.

//By default, if you leave out the layout property from the data you pass as the second argument to res.render, Express Handlebars will attempt to use a layout named "main". If you only use one layout and you name it "main.handlebars", you will never have to add a layout property at all.

/*For CSRF:
 make sure that you have in EVERY form this statement:
<input type="hidden" name="_csrf" value="{{csrfToken}}">
so every route which has a form should have it

Then, also check if this is placed after your cookies and urlencoded!
const csurf = require("csurf");
app.use(csurf());
app.use(function (req, res, next) {
    res.locals.csrfToken = req.csrfToken();
    next();
});
within your server.js
*/

/*
For dynamic pages:

app.get(`/signers/:city`

const { city } = req.params;
-> this will get the string at the end of the URL

*/

/*
firstName: allUserData.rows[0].first,
lastName: allUserData.rows[0].last,
email: allUserData.rows[0].email,
age: allUserData.rows[0].age,
city: allUserData.rows[0].city,
homepage: allUserData.rows[0].url,
*/

// CODE WORKED BUT IT IS BETTER TO CHECK EVERYTHING AT ONCE DURING LOGIN, NOT requiering things afterwards
// else {
//     db.showSignature(req.session.userID)
//         .then((userSignature) => {
//             console.log("results from show Signature: ", userSignature);
//             if (typeof userSignature.rows[0] == "undefined") {

//             } /* else if (req.session.signatureId != null) {
//                 res.redirect("/thanks");
//             } */ else {
//                 res.redirect("/thanks");
//             }
//         })
//         .catch((err) => {
//             console.log("error in showSignature:", err);
//             res.render("petition", {
//                 err: true,
//             });
//         });
// }

/* -------------------------------------------------------------
// getting information from our db
app.get("/actors", (req, res) => {
    db.getActors()
        .then((results) => {
            console.log("results from getActors:", results.rows);
        })
        .catch((err) => {
            console.log("error in getActors:", err);
        });
});

// adding information to our db
app.post("/add-actor", (req, res) => {
    console.log("hit POST add-actor route");

    // we have yet to create this db query
    db.addActor("Janelle Monáe", 35)
        .then(() => {
            console.log("yay it worked");
        })
        .catch((err) => {
            console.log("err in addActor", err);
        });
}); */

/* app.get("/thanks", (req, res) => {
    if (req.session.signatureId) {
        res.render("thanks", {
            pageTitel: "Thank you signor",
            yourSignature: "This is your signature: ",
            helpers: {
                showSignature() {
                    console.log(db.showSignature());
                    return db.showSignature();
                },
            },
        });
    } else {
        res.redirect("/petition");
    }


    app.get("/signers", (req, res) => {
    if (!req.session.signatureId) {
        res.redirect("/petition");
    } else {
        res.render("signers", {
            pageTitel: "Petition signers",
            helpers: {
                showNames() {
                    return db.showNames();
                },
            },
        });
        
    }
});

*/

/* const { first, last } = req.body; */

/* res.cookie("authenticated", true);
    const { firstname, lastname, age, subscribe } = req.body;
    if (subscribe) {
        res.send(`
            <h1>Thank you ${firstname} ${lastname} for registering for our newsletter</h1>
            <h2>You are ${age} years old apparently 🤷🏻‍♂️</h2>
        `);
    } else {
        res.send(`
            <h1>We are very sorry ${firstname}, that you didnt subscribe</h1>
            <h2>We will forgive you in maybe ${age} years....😢</h2>
        `);
    } */
