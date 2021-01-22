//express is a framework that makes serving websites with Node much easier. Many tasks of involved in HTTP Request Listenere and Portofolio projects are done automatically by Express!
const express = require("express"); //requiring express
const app = express(); //making instance of it

//handlebars is a language for creating templates. In templates we write HTML as you would for static content but leave in it markers where dynamic data should be inserted.
//Express has a built-in mechanism to support server-side templates but does not require any particular template language. express-handlebars is an engine for the handlebars langugage
const hb = require("express-handlebars");
app.engine("handlebars", hb());
app.set("view engine", "handlebars");

// makes sure we serve our static project files:
app.use(express.static("public"));

//const path = require("path"); // dont think we need this?! -> used when you need absolute paths ("normalizing")

/*
We use the cookie-session middleware to prevent our cookies being tampered with. After 'use' it a session object is available on req objects.
Any properties you add to req.session will be available to you on subsequent requests. Before responses are sent, the middleware causes this object to be stringified, base64 encoded, and written to a cookie. When requests are received, the middleware decodes the string, parses it, and attaches it to the request object before your routes run, making it available to you.
Tampering is prevented because of a second cookie that is automatically added. This cookie contains a hash of the data contained in the first one. Any disparity in what was sent and what is subsequently received will be detected.
*/
const cookieSession = require("cookie-session");
app.use(
    cookieSession({
        secret: `I'm not a hacker.`,
        maxAge: 1000 * 60 * 60 * 24 * 356,
    })
);
//takes input which the user entered in input field in a form -> converts it into an object called body. Then i have acces to req.body
app.use(
    express.urlencoded({
        extended: false,
    })
);

const db = require("./db"); // requiring our db module that holds all the db queries we want to run

/* app.use((req, res, next) => {
    if (req.cookies.accepted || req.url == "/thanks") {
        return next();
    }
    if (!req.cookies.url) {
        res.cookie("url", req.url);
    }
    res.redirect("/petition");
}); */

//This would be a good time to add your first route, i.e., tell Express what to do when a request is made for a specific url using a specific HTTP method.
//The use of the get method means that the handler specified as the second argument will only run for GET requests to /petition.
//Route handlers are passed request and response objects that have been enhanced by Express. For example, response objects have a send method. Full descriptions of request and response objects in Express are available here and here.
app.get("/petition", (req, res) => {
    if (req.session.signatureId) {
        res.redirect("/thanks");
    } else {
        res.render("petition", {
            //What res.render will do is first render the template specified by the first argument. It will then render the layout, passing the rendered main template to it as a property named body. The reason {{{body}}} in the layout uses triple curly braces is to tell Handlebars not to escape HTML control characters such as < and >.

            //By default, if you leave out the layout property from the data you pass as the second argument to res.render, Express Handlebars will attempt to use a layout named "main". If you only use one layout and you name it "main.handlebars", you will never have to add a layout property at all.
            //layout: "main",
            pageTitel: "Petition signing",
        });
    }
});

app.post("/petition", (req, res) => {
    //console.log(req.body); //gives an object, so we have to look for the row property
    db.addSignature(req.body.firstName, req.body.lastName, req.body.signature)
        .then((dbFeedback) => {
            //console.log(id);
            req.session.signatureId = dbFeedback.rows[0].id;
            console.log(req.session.signatureId);
            res.redirect("/thanks");
        })
        .catch((err) => {
            console.log("error in addSignature:", err);
        });
});

app.get("/thanks", (req, res) => {
    if (req.session.signatureId) {
        db.showSignature(req.session.signatureId)
            .then((userSignature) => {
                console.log(userSignature);
                res.render("thanks", {
                    pageTitel: `Thank you signor, this is your signature: ${userSignature}`,
                });
            })
            .catch((err) => {
                console.log("error in showSignature:", err);
            });
    } else {
        res.redirect("/petition");
    }

    /* res.send("<!doctype html><title>Sign</title><p>Sign for our petition!"); */
});

app.get("/signers", (req, res) => {
    if (!req.session.signatureId) {
        res.redirect("/petition");
    } else {
        db.showNames()
            .then((names) => {
                console.log(names);
                res.render("signers", {
                    pageTitel: `Below you can see some petition signers: ${names}`,
                });
            })
            .catch((err) => {
                console.log("error in showNames:", err);
            });
        /* res.send("<!doctype html><title>Sign</title><p>Sign for our petition!"); */
    }
});

//Start listening for requests.
app.listen(8080, () => console.log("petition server is listening..."));

/*









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
