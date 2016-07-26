var async = require("async");
var getChannelPageList = require('../middlewares/channelObjectList');
var configAuth = require('../config/auth');
var UserActivity = require('../models/userActivity');
var profile = require('../models/profiles');
var exports = module.exports = {};
var objectType = require('../models/objectTypes');

/**
 Function to store the logged in user's details..
 @params 1.req contains the facebook user details i.e. username,token,email etc
 2.res have the query response
 */
exports.storeProfiles = function (req, res, done) {
    var setData = {};
    var tokens = req.tokens;
    profile.findOne({
        'userId': req.userId,
        'channelId': req.channelId,
        'orgId': req.user.orgId
    }, function (err, profileDetails) {
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
            if (req.code === configAuth.channels.googleAdwords) {
                setData = {
                    "accessToken": newAccessToken,
                    "refreshToken": newRefreshToken,
                    'updated': updated,
                    "expiresIn": req.expiresIn ? req.expiresIn : '',
                    "canManageClients": req.canManageClients,
                    "customerId": req.customerId
                }
            }
            else if (req.code === configAuth.channels.mailChimp) {
                setData = {
                    "accessToken": newAccessToken,
                    "refreshToken": newRefreshToken,
                    'updated': updated,
                    'dataCenter': req.dataCenter,
                    "expiresIn": req.expiresIn ? req.expiresIn : ''
                }
            }
            else {
                setData = {
                    "accessToken": newAccessToken,
                    "refreshToken": newRefreshToken,
                    'updated': updated,
                    "expiresIn": req.expiresIn ? req.expiresIn : ''
                }
            }
            profile.update({
                'userId': req.userId,
                'channelId': req.channelId,
                'orgId': req.user.orgId
            }, {
                $set: setData
            }, {upsert: true}, function (err, updateResult) {
                if (!err) {
                    profile.findOne({
                        'userId': req.userId,
                        'channelId': req.channelId,
                        'orgId': req.user.orgId
                    }, function (err, profileDetail) {
                        if (!err) {
                            done(null, profileDetail);
                        }
                        else done(err);
                    });
                }
                else {
                    done(null, {status: 302});
                }
            });
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
            if (req.code == configAuth.channels.mailChimp) {
                newProfile.dataCenter = req.dataCenter;
            }
            newProfile.orgId = req.user.orgId;
            newProfile.userId = req.userId;
            newProfile.created = new Date();
            newProfile.updated = new Date();
            newProfile.expiresIn = req.expiresIn;
            if (req.code === configAuth.channels.googleAdwords) {
                newProfile.canManageClients = req.canManageClients;
                newProfile.customerId = req.customerId;
            }

            // save the user
            newProfile.save(function (err, user) {
                    if (err)
                        done(err);
                    else {
                        profile.findOne({
                            'userId': user.userId,
                            'channelId': user.channelId,
                            'orgId': req.user.orgId

                        }, function (err, profileDetail) {
                            if (!err) {
                                if(req.canManageClients===false) done(null,profileDetail)
                                else if (req.code != configAuth.channels.instagram && req.code !== configAuth.channels.youtube  && req.code !== configAuth.channels.twitter) {
                                    async.auto({
                                        object_types: getObjectType,
                                        get_remote_objects: ['object_types', getRemoteObjects]
                                    }, function (err, results) {
                                        if (err)
                                            return res.status(500).json({});
                                        done(null, results.get_remote_objects);
                                    })
                                    function getObjectType(callback) {
                                        //Find objectType in objectType table based on channelId - dev
                                        objectType.find({
                                            'channelId': user.channelId, autoSave: true
                                        }, function (err, objectType) {
                                            if (err)
                                                return res.status(500).json({error: err});
                                            else if (!objectType.length)
                                                done(null,'success')
                                            else callback(null, objectType)
                                        })
                                    }

                                    function getRemoteObjects(objectTypesFromDb, callback) {
                                        async.concatSeries(objectTypesFromDb.object_types, getObjectsForEachObjectType, callback)
                                    }

                                    function getObjectsForEachObjectType(eachObjectType, callback) {
                                        req.params.profileId = profileDetail._id;
                                        req.query.objectType = eachObjectType.type;
                                        getChannelPageList.listAccounts(req, res, function (err, getObjectList) {
                                            callback(null, req.app.result);
                                        })
                                    }
                                }
                                else {
                                    done(null,profileDetail)
                                }
                            }
                            else {
                                done(err);
                            }
                        });
                    }
                }
            );
        }
    });
};

exports.saveUserActivity = function (req, res, done) {
    var userActivityCobject = new UserActivity();
    userActivityCobject.email = req.user.email;
    userActivityCobject.loggedInTime = new Date();
    userActivityCobject.userId = req.user._id;
    userActivityCobject.save(function (err, userActivity) {
        done(err, userActivity)
    })
}