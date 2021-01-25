// this module holds all the queries we'll using to talk to our database

const spicedPg = require("spiced-pg");

const db = spicedPg("postgres:postgres:postgres@localhost:5432/petition");
// spicedPg('whoDoWeWantToTalkTo:whichUserShouldBeRunningOurQueries:whatPasswordDoesThisUserHave@WhereDoesThisCommuncationHappen:specifiedPortForCommunication/NameOfOurDatabase)

module.exports.addUser = (firstName, lastName, email, password) => {
    const q = `INSERT INTO users (first, last, email, password)
    VALUES ($1,$2,$3,$4) RETURNING id`;
    const params = [firstName, lastName, email, password];
    return db.query(q, params);
};

module.exports.addProfile = (age, city, homepage, userID) => {
    const q = `INSERT INTO user_profiles (age, city, url, user_id)
    VALUES ($1,$2,$3, $4)`;
    const params = [age, city, homepage, userID];
    return db.query(q, params);
};

module.exports.getUserDataByMail = (email) => {
    const q = `SELECT * FROM users WHERE email = ($1)`;
    const params = [email];
    return db.query(q, params);
};

module.exports.getAllUsers = () => {
    const q = `SELECT first, last FROM users`;
    return db.query(q);
};

module.exports.getAllSignersData = () => {
    const q = `SELECT first, last, age, city, url, signatures FROM users 
    JOIN user_profiles
    ON users.id = user_profiles.id
    JOIN signatures
    ON users.id = signatures.id`;
    return db.query(q);
};

module.exports.addSignature = (signature, userID) => {
    const q = `INSERT INTO signatures (signature, user_id)
    VALUES ($1,$2) RETURNING id`;
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
