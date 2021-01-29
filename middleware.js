module.exports.requireLoggedOutUser = (req, res, next) => {
    if (req.session.userID) {
        res.redirect("/thanks");
    } else {
        next();
    }
};

/* login, register, home */

module.exports.requireLoggedInUser = (req, res, next) => {
    if (!req.session.userID) {
        res.redirect("/register");
    } else {
        next();
    }
};

/* profile, petition, thanks, edit, signers, signer:city */

module.exports.requireSignature = (req, res, next) => {
    if (!req.session.signatureId) {
        res.redirect("/petition");
    } else {
        next();
    }
};

/* thanks, signers, signer:city */

module.exports.requireNoSignature = (req, res, next) => {
    if (req.session.signatureId) {
        res.redirect("/thanks");
    } else {
        next();
    }
};

/* petition */
