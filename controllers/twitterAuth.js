var request = require('request');
var configAuth = require('../config/auth');
var profile = require('../models/profiles');
var objects = require('../models/objects');
var objectType = require('../models/objectTypes');
var channels = require('../models/channels');
var user = require('../helpers/user');

module.exports = function (app) {
    var OAuth = require('oauth').OAuth;
    var oa = new OAuth(
        configAuth.twitterAuth.requestTokenURL,
        configAuth.twitterAuth.accessTokenURL,
        configAuth.twitterAuth.consumerKey,//Consumer key
        configAuth.twitterAuth.consumerSecret,//Consumer key secret
        configAuth.twitterAuth.oAuthVersion,
        configAuth.twitterAuth.callbackURL,//Callback url
        configAuth.twitterAuth.otherParams
    );

    app.get(configAuth.twitterAuth.localCallingURL, function (req, res) {
        oa.getOAuthRequestToken(function (error, oauth_token, oauth_token_secret, results) {
            if (error)
                return res.status(401).json({error: 'Authentication required to perform this action'});
            else {
                req.session.oauth = {};
                req.session.oauth.token = oauth_token;
                req.session.oauth.token_secret = oauth_token_secret;
                //If response of the storeProfiles function is success then redirect it to profile page
                res.redirect(configAuth.twitterAuth.authenticationURL + oauth_token)


            }
        });
    });
    app.get(configAuth.twitterAuth.localCallbackURL, function (req, res, next) {
        if (req.session.oauth) {
            req.session.oauth.verifier = req.query.oauth_verifier;
            var oauth = req.session.oauth;

            oa.getOAuthAccessToken(oauth.token, oauth.token_secret, oauth.verifier,
                function (error, oauth_access_token, oauth_access_token_secret, results) {
                    if (error) {
                        return res.status(401).json({error: 'Authentication required to perform this action'});
                    }
                    else {
                        req.session.oauth.access_token = oauth_access_token;
                        req.session.oauth, access_token_secret = oauth_access_token_secret;
                        req.tokens = oauth_access_token;
                        req.userId = results.user_id;
                        req.profileName = results.screen_name;
                        req.userEmail = results.screen_name;
                        tokens = req.tokens;
                        channels.findOne({code: configAuth.channels.twitter}, function (err, channelList) {
                            if (err)
                                return res.status(500).json({error: err});
                            else if (!channelList)
                                return res.status(204).json({error: 'No records found'});
                            else {
                                req.channelId = channelList._id;
                                req.channelCode = '4';
                                user.storeProfiles(req, function (err, response) {
                                    if (err) return res.status(500).json({error: err});
                                    else {
                                        //If response of the storeProfiles function is success then render the successAuthentication page
                                        objects.findOne({'profileId': response._id}, function (err, object) {
                                            if (object != null) {
                                                res.render('successAuthentication');
                                            }
                                            else {
                                                objectType.findOne({'channelId': response.channelId}, function (err, objectTypeList) {
                                                    if (err)
                                                        return res.status(500).json({error: err});
                                                    else if (!objectTypeList)
                                                        return res.status(204).json({error: 'No records found'});
                                                    else {
                                                        var objectItem = new objects();
                                                        objectItem.profileId = response._id;
                                                        objectItem.name = response.name;
                                                        objectItem.objectTypeId = objectTypeList._id;
                                                        objectItem.updated = new Date();
                                                        objectItem.created = new Date();
                                                        objectItem.save(function (err, objectListItem) {
                                                            if (err)
                                                                return res.status(500).json({error: 'Internal server error'});
                                                            else if (!objectListItem)
                                                                return res.status(204).json({error: 'No records found'});
                                                            else res.render('successAuthentication');
                                                        });
                                                    }
                                                });
                                            }
                                        });
                                    }
                                });
                            }

                        });
                    }
                }
            );
        }
        else
            next(new Error("you're not supposed to be here."))
    });
};