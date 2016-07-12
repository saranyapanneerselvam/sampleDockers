var channels = require('../models/channels');
module.exports = function (app) {
    var request = require('request');
    var user = require('../helpers/user');

// load the auth variables
    var configAuth = require('../config/auth');
    var FB = require('fb');
    var oauth2 = require('simple-oauth2')({
        clientID: configAuth.facebookAuth.clientID,
        clientSecret: configAuth.facebookAuth.clientSecret,
        site: configAuth.facebookAuth.site,
        tokenPath: configAuth.facebookAuth.tokenPath,
        authorizationPath: configAuth.facebookAuth.authorizationPath
    });

// Authorization uri definition
    var authorization_uri = oauth2.authCode.authorizeURL({
        redirect_uri: configAuth.facebookAuth.callbackURL,
        state: configAuth.facebookAuth.state,
        scope: configAuth.facebookAuth.scope,
        profileFields: configAuth.facebookAuth.profileFields
    });

// Initial page redirecting to Github
    app.get(configAuth.facebookAuth.localCallingURL, function (req, res) {
        res.redirect(authorization_uri);
    });

// Callback service parsing the authorization token and asking for the access token
    app.get(configAuth.facebookAuth.localCallbackURL, function (req, res) {
        var code = req.query.code;
        oauth2.authCode.getToken({
            code: code,
            redirect_uri: configAuth.facebookAuth.callbackURL
        }, saveToken);

        function saveToken(error, result) {
            var getExpiresInValue = configAuth.expire.FBAccessExpire;
            if (error) {
                return res.status(401).json({error: 'Authentication required to perform this action'});
            }
            else {
                token = oauth2.accessToken.create(result);
                var accessToken = result.substr(result.indexOf('=') + 1);
                var indexExpires = accessToken.indexOf('&');
                if (indexExpires === -1) {
                    var accessToken = result.substr(result.indexOf('=') + 1);
                }
                else {
                    var expires = accessToken.substr(indexExpires);
                    var getExpiresIn = accessToken.indexOf('expires=');
                    var expiresInValue = accessToken.substr(getExpiresIn);
                    var getExpiresInValue = expiresInValue.substr(expiresInValue.indexOf('=') + 1);
                    var accessToken = accessToken.substr(0, indexExpires);
                }

                //To get logged user's userId ,email..
                request(configAuth.facebookAuth.accessTokenURL + accessToken, function (error, response, body) {
                    if (!error && response.statusCode == 200) {

                        //parse the body data
                        var parsedData = JSON.parse(body);

                        //set the body into userdata
                        req.userId = parsedData.id;
                        req.profileName = parsedData.name;

                        //set token details to tokens
                        req.tokens = accessToken;
                        var numdays = (Math.floor(getExpiresInValue / 86400) - 1);
                        var currentdate = new Date();
                        currentdate.setDate(currentdate.getDate() + numdays);
                        channels.findOne({code: configAuth.channels.facebook}, function (err, channelDetails) {
                            if (err)
                                return res.status(500).json({error: err});
                            else if (!channelDetails)
                                return res.status(204).json({error: 'No records found'});
                            else {
                                req.channelId = channelDetails._id;
                                req.channelName = channelDetails.name;
                                req.channelCode = '2';
                                FB.setAccessToken(accessToken);//Set access token
                                req.expiresIn = currentdate;
                                FB.api(req.userId, {fields: ['id', 'name', 'email']}, function (profile) {
                                    if (!profile || profile.error) {
                                        return res.status(500).json({error: profile.err});
                                    }
                                    else {
                                        req.userEmail = profile.email;
                                        req.userId = profile.id;
                                        //Call the helper to store user details
                                        user.storeProfiles(req, function (err) {
                                            if (err)
                                                res.json('Error', err);
                                            else {
                                                //If response of the storeProfiles function is success then close the authentication window
                                                res.render('successAuthentication');
                                            }
                                        });
                                    }
                                });
                            }
                        })
                    }
                })
            }
        }
    });
};
