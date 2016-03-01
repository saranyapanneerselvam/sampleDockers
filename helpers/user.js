var profile = require('../models/profiles');
var exports = module.exports = {};
/**
 Function to store the logged in user's details..
 @params 1.req contains the facebook user details i.e. username,token,email etc
 2.res have the query response
 */
exports.storeProfiles = function (req, done) {

    req.showMetric = {};

    var userData = JSON.parse(req.userData);
    var tokens = req.tokens;
    console.log('calling function', typeof tokens, userData.email);
    profile.findOne({'email': userData.email}, function (err, userDetails) {
        // if there are any errors, return the error
        if (err)
            return err;
        // check to see if theres already a user with that email
        else if (userDetails) {
            console.log('else if');
            req.showMetric.status = 302;
            done(null, {status: 302});
        }
        else {

            // if there is no profile with that email
            // create the profile
            var newProfile = new profile();
            // set the user's local credentials
            newProfile.email = userData.email;
            newProfile.accessToken = tokens.access_token;
            newProfile.refreshToken = tokens.refresh_token;
            newProfile.orgId = req.user.orgId;
            newProfile.userId = userData.user_id;
            newProfile.created = new Date();
            newProfile.updated = new Date();
            // save the user
            newProfile.save(function (err, user) {
                    if (err)
                        done(err);
                    else {
                        //req.showMetric.status = user;
                        done(null, {userDetails: user, status: 200});
                    }
                }
            );
        }
    });
}