var async = require("async");
var getChannelPageList = require('../middlewares/channelObjectList');
var configAuth = require('../config/auth');
var UserActivity = require('../models/userActivity');
var profile = require('../models/profiles');
var exports = module.exports = {};
var objectType = require('../models/objectTypes');
var randomString = require('randomstring');
var User = require('../models/user');
var utilityFunctions = require('../helpers/utility');

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
                    "customerId": req.customerId,
                    "channelName": req.channelName,
                    "hasNoAccess": false
                }
            }
            else if (req.code === configAuth.channels.mailChimp) {
                setData = {
                    "accessToken": newAccessToken,
                    "refreshToken": newRefreshToken,
                    'updated': updated,
                    'dataCenter': req.dataCenter,
                    "expiresIn": req.expiresIn ? req.expiresIn : '',
                    "channelName": req.channelName,
                    "hasNoAccess": false
                }
            }
            else if (req.code === configAuth.channels.aweber) {
                setData = {
                    "accessToken": newAccessToken,
                    //  "refreshToken": newRefreshToken,
                    'updated': updated,
                    tokenSecret: req.tokenSecret,
                    //'dataCenter': req.dataCenter,
                    "expiresIn": req.expiresIn ? req.expiresIn : '',
                    "channelName": req.channelName,
                    "hasNoAccess": false
                }
            }
            else {
                setData = {
                    "accessToken": newAccessToken,
                    "refreshToken": newRefreshToken,
                    'updated': updated,
                    "expiresIn": req.expiresIn ? req.expiresIn : '',
                    "channelName": req.channelName,
                    "hasNoAccess": false
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
            newProfile.channelName = req.channelName;

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
            if (req.code === configAuth.channels.aweber) {
                newProfile.token = tokens.access_token;

                newProfile.tokenSecret = req.tokenSecret;
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
                                if (req.canManageClients === false) done(null, profileDetail)
                                else if (req.code != configAuth.channels.pinterest && req.code != configAuth.channels.instagram && req.code !== configAuth.channels.youtube && req.code !== configAuth.channels.twitter) {
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
                                                done(null, 'success')
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
                                    done(null, profileDetail)
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

exports.checkUserExist = function (req, res, done) {
    User.findOne({email: req.query.email}, function (err, user) {
        if (err)
            done(err)
        else if (!user)
            done(null, {isExist: false, mailId: req.query.email})
        else done(null, {isExist: true, mailId: req.query.email})
    })
}
exports.verifyToken = function (req, res, done) {
    var verificationToken = req.query.token;
    User.findOne({
        'passwordReset.tokenId': verificationToken,
        'passwordReset.used': false,
        //'passwordReset.expires': {'$lte': moment(new Date()).format("YYYY-MM-DD HH:mm:ss")}
    }, function (err, user) {
        if (err)
            return res.status(500).json({error: err});
        else if (!user) done(null, {isTokenValid: configAuth.emailVerification.inValid});
        else if (user.passwordReset.expires < new Date()) done(null, {isTokenValid: false});
        else done(null, {isTokenValid: true, user: user});
    })
};
exports.generateToken = function (req, res, done) {
    User.findOne({email: req.userEmail}, function (err, userDetail) {
        if (err)
            return res.status(500).json({error: err});
        else if (!userDetail)
            return res.status(204).json({error: 'No records found'});
        else {
            var tokenId = userDetail.orgId + new Date().getTime() + randomString.generate({
                    length: configAuth.emailVerification.length,
                    charset: configAuth.emailVerification.charSet
                }) + new Date().getMilliseconds();
            var now = new Date;
            var tokenExpiry = now.addHours(configAuth.emailVerification.validityForForgotPassword);
            Date.prototype.addHours = function (h) {
                this.setTime(this.getTime() + (h * 60 * 60 * 1000));
                return this;
            }

            User.update({email: req.userEmail}, {
                $set: {
                    'passwordReset.tokenId': tokenId,
                    'passwordReset.expires': tokenExpiry,
                    'passwordReset.used': false
                }
            }, function (err, user) {
                if (err) return res.status(500).json({error: 'Internal Server Error'});
                else if (!user) return res.status(501).json({error: 'Not implemented'});
                else {
                    var verificationUrl = configAuth.emailVerification.redirectVerifyUserToken + tokenId;
                    var mailOptions = {
                        from: 'Datapoolt Team <configAuth.emailVerification.username>',
                        to: req.userEmail,
                        subject: userDetail.name + ",we've received your request to reset password",

                        // HTML Version
                        html: '<p style="align-content: center;font-weight: bold">Welcome to Datapoolt</p>' + '<br>' + '<div style="font-family: Helvetica,Arial,sans-serif">' + '<span>Hi </span>' + '' + '<span>' + userDetail.name + ',' + '</span>' +

                        '<br>' + '<p>We have received your request to reset password.</p>' + '<p> Click the link below to reset your password.</p>' + '</div>' + '</b>' + '<button style="text-decoration: none;color: #FFF;background-color: #1a8bb3;border: solid #1a8bb3;border-width: 1px 10px;line-height: 2;font-weight: bold;text-align: center;cursor: pointer;display: inline-block;border-radius: 5px;background-color: #1a8bb3 ;border-radius: 12px;color:#fff;font-size: 14px;height: 33px;"><a style="text-decoration: none;color:#fff" href="' + verificationUrl + '">Click Here</a></button>'

                    };
                    utilityFunctions.sendVerificationMail(mailOptions, function (err, mail) {
                        if (err) done(err)
                        else done(null, {mailId: req.userEmail})
                    })

                }
            })
        }

    })


};
exports.updateNewPassword = function (req, res, done) {
    var newUser = new User();
    User.update({email: req.query.email}, {
        $set: {
            pwdHash: newUser.generateHash(req.query.newPassword),
            'passwordReset.used': true
        }
    }, function (err, user) {
        if (err)
            return res.status(500).json({error: 'Internal server error'})
        else if (!user)
            return res.status(501).json({error: 'Not implemented'})
        else {
            User.findOne({email: req.query.email}, function (err, user) {
                if (err) return res.status(500).json({error: 'Internal server error'})
                else if (!user) return res.status(501).json({error: 'Not implemented'})
                else done(null, {user: user})
            })
        }
    })
}
