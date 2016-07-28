module.exports = function (app) {
    var request = require('request');
    var user = require('../helpers/user');
    var Object = require('../models/objects');
    var ObjectType = require('../models/objectTypes');

    // load the auth variables
    var configAuth = require('../config/auth');
    var AdWords = require('../lib/googleads-node-lib');
    var channels = require('../models/channels');
    var oauth2 = require('simple-oauth2')({
        clientID: configAuth.googleAdwordsAuth.clientID,
        clientSecret: configAuth.googleAdwordsAuth.clientSecret,
        site: configAuth.googleAdwordsAuth.site,
        tokenPath: configAuth.googleAdwordsAuth.tokenPath,
        authorizationPath: configAuth.googleAdwordsAuth.authorizationPath
    });

    // Authorization uri definition
    var authorization_uri = oauth2.authCode.authorizeURL({
        redirect_uri: configAuth.googleAdwordsAuth.callbackURL,
        state: configAuth.googleAdwordsAuth.state,
        scope: configAuth.googleAdwordsAuth.scope,
        approval_prompt: configAuth.googleAdwordsAuth.approvalPrompt,
        access_type: configAuth.googleAdwordsAuth.accessType
    });

    // Initial page redirecting to Github
    app.get(configAuth.googleAdwordsAuth.localCallingURL, function (req, res) {
        res.redirect(authorization_uri);
    });

    // Callback service parsing the authorization token and asking for the access token
    app.get(configAuth.googleAdwordsAuth.localCallbackURL, function (req, res) {
        var code = req.query.code;
        oauth2.authCode.getToken({
            code: code,
            redirect_uri: configAuth.googleAdwordsAuth.callbackURL
        }, saveToken);

        function saveToken(error, result) {
            if (error) {
                return res.status(401).json({error: 'Authentication required to perform this action'});
            }
            else {
                token = oauth2.accessToken.create(result);
                var accessToken = token.token.access_token;
                var refreshToken = token.token.refresh_token;
                //To get logged user's userId ,email..
                request('https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=' + token.token.access_token, function (error, response, body) {
                    if (!error && response.statusCode == 200) {

                        //To get the profile name .. based on access token
                        request('https://www.googleapis.com/oauth2/v2/userinfo?access_token=' + token.token.access_token, function (err, responseData, result) {
                            if (!err) {

                                //To parse the access token details
                                var parsedBodyResult = JSON.parse(body);

                                //To parse profile result
                                var parsedResult = JSON.parse(result);

                                //set the body into userdata
                                req.userEmail = parsedBodyResult.email;
                                req.userId = parsedBodyResult.user_id;
                                req.profileName = parsedResult.name;

                                //set token details to tokens
                                req.tokens = token.token;
                                channels.findOne({code: configAuth.channels.googleAdwords}, function (err, channelDetails) {
                                    req.channelId = channelDetails._id;
                                    req.channelName = channelDetails.name;
                                    req.channelCode = channelDetails._id;
                                    req.code = channelDetails.code;
                                    var customerService = new AdWords.CustomerService({
                                        ADWORDS_CLIENT_ID: configAuth.googleAdwordsAuth.clientID,
                                        ADWORDS_DEVELOPER_TOKEN: configAuth.googleAdwordsAuth.developerToken,
                                        ADWORDS_REFRESH_TOKEN: token.token.refresh_token,
                                        ADWORDS_SECRET: configAuth.googleAdwordsAuth.clientSecret,
                                        ADWORDS_USER_AGENT: configAuth.googleAdwordsAuth.userAgent
                                    });
                                    customerService.getCustomer(token.token.access_token, function (err, clientResponse) {
                                        if (err)
                                            return res.status(401).json({error: err});
                                        else {
                                            req.canManageClients = clientResponse.rval.canManageClients;
                                            req.customerId = clientResponse.rval.customerId;
                                            //Calling the storeProfiles middleware to store the data
                                            user.storeProfiles(req,res, function (err, response) {
                                                if (err)
                                                    res.json('Error');
                                                else {
                                                    if (clientResponse.rval.canManageClients === false) {
                                                        //If response of the storeProfiles function is success then render the successAuthentication page
                                                        Object.findOne({'profileId': response._id}, function (err, object) {
                                                            if (object != null) {
                                                                res.render('../public/successAuthentication');
                                                            }
                                                            else {
                                                                ObjectType.findOne({'channelId': response.channelId}, function (err, objectTypeList) {
                                                                    if (!err) {
                                                                        var storeObject = new Object();
                                                                        storeObject.profileId = response._id;
                                                                        storeObject.channelObjectId = clientResponse.rval.customerId;
                                                                        storeObject.name = response.name;
                                                                        storeObject.objectTypeId = objectTypeList._id;
                                                                        storeObject.updated = new Date();
                                                                        storeObject.created = new Date();
                                                                        storeObject.save(function (err, objectListItem) {
                                                                            if (!err) {
                                                                                res.render('../public/successAuthentication');
                                                                            }
                                                                        });
                                                                    }
                                                                });
                                                            }
                                                        });
                                                    }
                                                    else res.render('../public/successAuthentication');
                                                }
                                            });
                                        }
                                    });
                                });
                            }
                            else
                                return res.status(401).json({error: 'Authentication required to perform this action'});
                        })
                    }
                })
            }
        }
    });
};
