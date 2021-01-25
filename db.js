// this module holds all the queries we'll using to talk to our database

const spicedPg = require("spiced-pg");

const db = spicedPg("postgres:postgres:postgres@localhost:5432/petition");
// spicedPg('whoDoWeWantToTalkTo:whichUserShouldBeRunningOurQueries:whatPasswordDoesThisUserHave@WhereDoesThisCommuncationHappen:specifiedPortForCommunication/NameOfOurDatabase)

module.exports.addUser = (firstName, lastName, email, password) => {
    const q = `INSERT INTO users (first, last, email, password)
    VALUES ($1,$2,$3,$4) RETURNING id, email`;
    const params = [firstName, lastName, email, password];
    return db.query(q, params);
};

module.exports.showUserByMail = (email) => {
    const q = `SELECT first, last FROM users WHERE email = ($1)`;
    const params = [email];
    return db.query(q, params);
};

module.exports.addSignature = (signature, userID) => {
    const q = `INSERT INTO signatures (signature, user_id)
    VALUES ($1,$2,$3) RETURNING id`;
    const params = [signature, userID];
    return db.query(q, params);
};

module.exports.showSignature = (idParam) => {
    const q = `SELECT signature FROM signatures WHERE user_id = ($1)`;
    const params = [idParam];
    return db.query(q, params);
};

module.exports.showAmount = () => {
    const q = `SELECT id FROM signatures`;
    return db.query(q).length;
};

/* module.exports.getActors = () => {
    const q = `SELECT * FROM actors`;
    return db.query(q); //db.query takes potentially two arguments, the 1st being a query we want to run on our db, the 2nd we'll see in a minute ;)
};

module.exports.addActor = (actorName, actorAge) => {
    const q = `INSERT INTO actors (name, age)
    VALUES ($1,$2)`;
    const params = [actorName, actorAge];
    return db.query(q, params);
};

module.exports.showNames = () => {
    const q = `SELECT first, last FROM users`;
    return db.query(q);
};

*/

/*             .then(({ rows }) => {
                db.numSignatures({ rows })
                    .then(({ rows }) => {
                        res.render("thanks", {
                            title: "Thanks Page",
                            layout: "main",
                            rows,
                        });
                    })
 */
