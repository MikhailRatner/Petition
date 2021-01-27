// this module holds all the queries we'll using to talk to our database

const spicedPg = require("spiced-pg");

/* let db;
if (process.env.DATABASE_URL) {
    db = spicedPg(process.env.DATABASE_URL);
} else {
    const { dbuser, dbpass } = require("../secrets.json");
    db = spicedPg(`postgres:${dbuser}:${dbpass}@localhost:5432/petition`);
} */

const db = spicedPg(
    process.env.DATABSE_URL ||
        `postgres:postgres:postgres@localhost:5432/petition`
);

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
    const q = `SELECT users.first, users.last, user_profiles.age, user_profiles.city, user_profiles.url, signatures.signature
    FROM users 
    JOIN user_profiles
    ON users.id = user_profiles.user_id
    JOIN signatures
    ON users.id = signatures.user_id`;
    return db.query(q);
};

module.exports.getAllSignersByCity = (city) => {
    const q = `SELECT users.first, users.last, user_profiles.age, user_profiles.city, user_profiles.url
    FROM users 
    JOIN user_profiles
    ON users.id = user_profiles.user_id
    WHERE user_profiles.city = ($1)`;
    const params = [city];
    return db.query(q, params);
};

module.exports.getAllUserData = (userID) => {
    const q = `SELECT users.first, users.last, users.email, users.password, user_profiles.age, user_profiles.city, user_profiles.url
    FROM users 
    LEFT JOIN user_profiles
    ON users.id = user_profiles.user_id
    WHERE users.id = ($1)`;
    const params = [userID];
    return db.query(q, params);
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

module.exports.updateUserNoPw = (firstName, lastName, email, userID) => {
    const q = `INSERT INTO users (first, last, email)
    VALUES ($1,$2,$3)
    ON CONFLICT (id)
    DO UPDATE SET first = ($1), last = ($2), email = ($3)
    WHERE id = ($4)`;
    const params = [firstName, lastName, email, userID];
    return db.query(q, params);
};

module.exports.updateUserWithPw = (
    firstName,
    lastName,
    email,
    password,
    userID
) => {
    const q = `INSERT INTO users (first, last, email, password)
    VALUES ($1,$2,$3,$4)
    ON CONFLICT (id)
    DO UPDATE SET first = ($1), last = ($2), email = ($3), password = ($4)
    WHERE id = ($5)`;
    const params = [firstName, lastName, email, password, userID];
    return db.query(q, params);
};

module.exportsupdateUserProfile = (age, city, homepage, userID) => {
    const q = `INSERT INTO user_profiles (age, city, homepage)
    VALUES ($1,$2,$3)
    ON CONFLICT (user_id)
    DO UPDATE SET age = ($1), city = ($2), homepage = ($3)
    WHERE id = ($4)`;
    const params = [age, city, homepage, userID];
    return db.query(q, params);
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
