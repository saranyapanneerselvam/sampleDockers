module.exports = function (app) {
    var request = require('request');
    var user = require('../helpers/user');
    var channels = require('../models/channels');
    // load the auth variables
    var configAuth = require('../config/auth');
    var googleapis = require('googleapis');//To use google api'
    var OAuth2 = googleapis.auth.OAuth2;
    var oauth2Client = new OAuth2(configAuth.googleAuth.clientID, configAuth.googleAuth.clientSecret, configAuth.googleAuth.callbackURL);
    var oauth2 = require('simple-oauth2')({
        clientID: configAuth.googleAuth.clientID,
        clientSecret: configAuth.googleAuth.clientSecret,
        site: configAuth.googleAuth.site,
        tokenPath: configAuth.googleAuth.tokenPath,
        authorizationPath: configAuth.googleAuth.authorizationPath
    });

    // Authorization uri definition
    var authorization_uri = oauth2.authCode.authorizeURL({
        redirect_uri: configAuth.googleAuth.callbackURL,
        approval_prompt: configAuth.googleAuth.approvalPrompt,
        access_type: configAuth.googleAuth.accessType,
        scope: configAuth.googleAuth.scope,
        state: configAuth.googleAuth.state
    });

// Initial page redirecting to Github
    app.get(configAuth.googleAuth.localCallingURL, function (req, res) {
        res.redirect(authorization_uri);
    });

// Callback service parsing the authorization token and asking for the access token
    app.get(configAuth.googleAuth.localCallbackURL, function (req, res) {
        var code = req.query.code;
        oauth2.authCode.getToken({
            code: code,
            redirect_uri: configAuth.googleAuth.callbackURL
        }, saveToken);

        function saveToken(error, result) {
            if (error) 
                return res.status(401).json({error: 'Authentication required to perform this action'});
            token = oauth2.accessToken.create(result);

            //To get logged user's userId ,email..
            request(configAuth.googleAuth.requestTokenURL + token.token.access_token, function (error, response, body) {
                if (!error && response.statusCode == 200) {

                    //To get the profile name .. based on access token
                    request(configAuth.googleAuth.accessTokenURL + token.token.access_token, function (err, responseData, result) {
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
                            channels.findOne({code: configAuth.channels.googleAnalytics}, function (err, channelDetails) {
                                req.channelId = channelDetails._id;
                                req.channelName = channelDetails.name;
                                req.channelCode = channelDetails._id;
                                req.code = channelDetails.code;

                                //Calling the storeProfiles middleware to store the data
                                user.storeProfiles(req,res, function (err, response) {
                                    if (err)
                                        res.json('Error');
                                    else {
                                        //If response of the storeProfiles function is success then close the authentication window
                                        res.render('successAuthentication');
                                    }
                                });
                            });
                        }
                        else  return res.status(401).json({error: 'Authentication required to perform this action'});
                    })
                }
            })

        }
    })
};