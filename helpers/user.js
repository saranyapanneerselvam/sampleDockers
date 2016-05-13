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
    profile.findOne({'userId': req.userId, 'channelId': req.channelId}, function (err, profileDetails) {

        // if there are any errors, return the error
        if (err)
            done(err);

        // check to see if theres already a user with that email
        else if (profileDetails) {
            var updated = new Date();
            var newAccessToken, newRefreshToken;
            //Facebook doesn't have refresh token,store refresh token if the channel is google
            if (req.channelCode == req.channelId) {
                newAccessToken = tokens.access_token;
                newRefreshToken = tokens.refresh_token;
            }
            //Store the refresh token for facebook
            else {
                newAccessToken = tokens;
                newRefreshToken = "";
            }

            profile.update({'userId': req.userId,'channelId': req.channelId}, {
                $set: {
                    "accessToken": newAccessToken,
                    "refreshToken": newRefreshToken,
                    'updated': updated
                }
            }, {upsert: true}, function (err, updateResult) {
                if (!err) {
                    profile.findOne({'userId': req.userId,'channelId': req.channelId}, function(err,profileDetail){
                        if(!err){
                            done(null, profileDetail);
                        }
                    });
                }
                else {
                    done(null, {status: 302});
                }
            })
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
            if (req.channelCode == req.channelId) {
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
                    if (err)
                        done(err);
                    else {
                        profile.findOne({'userId': user.userId,'channelId': user.channelId}, function(err,profileDetail){
                            if(!err){
                                console.log('profile',profileDetail)
                                done(null, profileDetail);
                            }
                        });
                    }
                }
            );
        }
    });
}