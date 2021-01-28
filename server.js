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

///////////////////////////////
//////////HOMEPAGE/////////////
///////////////////////////////

app.get("/", (req, res) => {
    res.render("home", {
        pageTitel: "Home",
    });
});

///////////////////////////////
//////////REGISTER/////////////
///////////////////////////////

app.get("/register", (req, res) => {
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

app.get("/login", (req, res) => {
    res.render("login", {
        pageTitel: "Login",
    });
});

app.post("/login", (req, res) => {
    console.log("INPUT EMAIL: ", req.body.email);
    db.getUserDataByMail(req.body.email)
        .then((dbFeedback) => {
            //console.log("DB FEEDBACK PASSWORD: ", dbFeedback.rows[0].password);
            compare(req.body.inputPw, dbFeedback.rows[0].password).then(
                (match) => {
                    console.log("VALUE FROM COMPARE: ", match);
                    if (match == true) {
                        req.session.userID = dbFeedback.rows[0].id;
                        console.log(req.session.userID);
                        res.redirect("/petition");
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
    /*     if ((password = userPassword)) {
        if (signature) {
            res.redirect("/thanks");
        } else {
            res.redirect("/petition");
        }
    } */
});

///////////////////////////////
//////////PROFILE/////////////
///////////////////////////////

app.get("/profile", (req, res) => {
    if (!req.session.userID) {
        res.redirect("/login");
    } else {
        res.render("profile", {
            pageTitel: "profile",
            /* logut: "logoutButton", */
        });
    }
});

app.post("/profile", (req, res) => {
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
});

///////////////////////////////
//////////PETITION/////////////
///////////////////////////////

app.get("/petition", (req, res) => {
    if (!req.session.userID) {
        res.redirect("/register");
    } else {
        db.showSignature(req.session.userID)
            .then((userSignature) => {
                console.log("results from show Signature: ", userSignature);
                /* I TESTED THIS BUT IT ALSO DOES NOT WORK: if (req.session.signatureId)  */
                if (
                    req.session.signatureId ||
                    userSignature.rows[0].signature == undefined ||
                    userSignature.rows[0].signature != null
                ) {
                    res.redirect("/thanks");
                } else {
                    res.render("petition", {
                        //layout: "main",
                        pageTitel: "Petition signing",
                    });
                }
            })
            .catch((err) => {
                console.log("error in showSignature:", err);
                res.render("petition", {
                    err: true,
                });
            });
    }
});

app.post("/petition", (req, res) => {
    console.log("START PETITION: ", req.body); //gives an object, so we have to look for the row property
    db.addSignature(req.body.signature, req.session.userID)
        .then((dbFeedback) => {
            req.session.signatureId = dbFeedback.rows[0].id;
            console.log("SIGNATURE ID: ", req.session.signatureId);
            res.redirect("/thanks");
        })
        .catch((err) => {
            console.log("error in addSignature:", err);
            res.render("petition", {
                err: true,
            });
        });
});

///////////////////////////////
////////// THANKS /////////////
///////////////////////////////

app.get("/thanks", (req, res) => {
    console.log("SHOW SIGN ID IN THANKS: ", req.session.signatureId);
    if (req.session.userID) {
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
    } else {
        res.redirect("/register");
    }
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

app.get("/signers", (req, res) => {
    if (!req.session.userID) {
        res.redirect("/login");
    } else {
        db.getAllSignersData()
            .then((allData) => {
                //console.log(allData.rows);
                res.render("signers", {
                    pageTitel: `signers`,
                    signedNames: allData.rows,
                });
            })
            .catch((err) => {
                console.log("error in getAllSignersData:", err);
            });
    }
});

app.get(`/signers/:city`, (req, res) => {
    if (!req.session.userID) {
        res.redirect("/login");
    }
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

app.get("/edit", (req, res) => {
    console.log("COOKIE: ", req.session.userID);
    if (!req.session.userID) {
        res.redirect("/login");
    }

    db.getAllUserData(req.session.userID)
        .then((allUserData) => {
            //console.log(allUserData.rows[0]);
            res.render("editProfile", {
                pageTitel: `Edit`,
                firstName: allUserData.rows[0].first,
                lastName: allUserData.rows[0].last,
                email: allUserData.rows[0].email,
                age: allUserData.rows[0].age,
                city: allUserData.rows[0].city,
                homepage: allUserData.rows[0].url,
            });
        })
        .catch((err) => {
            console.log("error in getAllSignersData:", err);
        });
});

app.post("/edit", (req, res) => {
    console.log("COOKIE: ", req.session);
    console.log(req.body);

    if (req.body.inputPw) {
        db.updateUserWithPw(
            req.body.firstName,
            req.body.lastName,
            req.body.email,
            req.body.inputPw,
            req.session.userID
        ).then(() => {
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
                    console.log("error in updateUser:", err);
                });
        });
    } else {
        db.updateUserNoPw(
            req.body.firstName,
            req.body.lastName,
            req.body.email,
            req.session.userID
        ).then(() => {
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
                    console.log("error in updateUser:", err);
                });
        });
    }
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
