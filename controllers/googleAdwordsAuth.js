module.exports = function (app) {
    var request = require('request');
    var user = require('../helpers/user');

    // load the auth variables
    var configAuth = require('../config/auth');
    var AdWords = require('googleads-node-lib');
    var channels = require('../models/channels');

    /* var googleAds = require('../lib/googleAdwords');
    var spec = {host : 'https://adwords.google.com/api/adwords/reportdownload/v201601'};
    googleAds.GoogleAdwords(spec);*/

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
                console.log('Access Token Error', error);
            }
            else {
                token = oauth2.accessToken.create(result);
                accessToken = token.token.access_token;
                refreshToken = token.token.refresh_token;
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

                                    //Calling the storeProfiles middleware to store the data
                                    user.storeProfiles(req, function (err, response) {
                                        if (err)
                                            res.json('Error');
                                        else {
                                            //If response of the storeProfiles function is success then close the authentication window
                                            res.render('successAuthentication');

                                        }
                                    });
                                });
                            }
                        })
                    }
                })
            }
        }
    });
};
