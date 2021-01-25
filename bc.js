const bcrypt = require("bcryptjs");
let { genSalt, hash, compare } = bcrypt;
const { promisify } = require("util");

genSalt = promisify(genSalt);
hash = promisify(hash);
compare = promisify(compare);

module.exports.compare = compare;
module.exports.hash = (plainTextPw) =>
    genSalt().then((salt) => hash(plainTextPw, salt));

////////// DEMO OF HOW THE BCYRPT FUNCTIONS WORK ////////////
//genSalt generates a random string of characters that we refer to as a salt!
// genSalt()
//     .then((salt) => {
//         console.log("salt:", salt);
//         // hash expects two parameters, first a clear text PW, second a salt
//         return hash("123456", salt);
//     })
//     .then((hashedPw) => {
//         console.log("hashed Pw with salt is:", hashedPw); // returns propertly hashed PW
//         // compar expects two parameters, first a clear text PW (the one the user claims to be correct), second a hashed Pw to compare to,
//         return compare("1234567", hashedPw);
//     })
//     .then((matchValueOfCompare) => {
//         console.log("do the passwords match ;):", matchValueOfCompare); // compare returns to us a boolean value of whether or not clear PW and hash are a match
//     });
