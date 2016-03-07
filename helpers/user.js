var profile = require('../models/profiles');
var exports = module.exports = {};

/**
 Function to store the logged in user's details..
 @params 1.req contains the facebook user details i.e. username,token,email etc
 2.res have the query response
 */
exports.storeProfiles = function (req, done) {
    req.showMetric = {};
    var tokens = req.tokens;

    profile.findOne({'email': req.userEmail, 'channelId': req.channelId}, function (err, profileDetails) {
        console.log('profile', profileDetails,'length');
        // if there are any errors, return the error
        if (err)
            done(err);

        // check to see if theres already a user with that email
        else if (profileDetails) {
            req.showMetric.status = 302;
            done(null, {status: 302});
        }
        else {


            // if there is no profile with that email
            // create the profile
            var newProfile = new profile();

            // set the user's local credentials
            newProfile.email = req.userEmail;
            newProfile.name = req.profileName;
            newProfile.channelId = req.channelId;

            //Facebook doesn't have refresh token,store refresh token if the channel is google
            if (req.channelCode == '1') {
                newProfile.accessToken = tokens.access_token;
                newProfile.refreshToken = tokens.refresh_token;
            }

            //Store the refresh token for facebook
            else
                newProfile.accessToken = tokens;

            newProfile.orgId = req.user.orgId;
            newProfile.userId = req.userId;
            newProfile.created = new Date();
            newProfile.updated = new Date();

            // save the user
            newProfile.save(function (err, user) {
                console.log('user',user);
                    if (err)
                        done(err);
                    else {
                        done(null, {userDetails: user, status: 200});
                    }
                }
            );
        }
    });
}