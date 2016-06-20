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
        site: 'https://accounts.google.com/o/',
        tokenPath: 'https://accounts.google.com/o/oauth2/token',
        authorizationPath: 'oauth2/auth'
    });

    // Authorization uri definition
    var authorization_uri = oauth2.authCode.authorizeURL({
        redirect_uri: configAuth.googleAuth.callbackURL,
        approval_prompt: 'force',
        access_type: 'offline',
        scope: 'https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/analytics.readonly ',
        state: '3832$'
    });

// Initial page redirecting to Github
    app.get('/api/v1/auth/google', function (req, res) {
        // console.log('callback',res);
        res.redirect(authorization_uri);
    });

// Callback service parsing the authorization token and asking for the access token
    app.get('/auth/google/callback', function (req, res) {
        var code = req.query.code;
        oauth2.authCode.getToken({
            code: code,
            redirect_uri: configAuth.googleAuth.callbackURL
        }, saveToken);

        function saveToken(error, result) {
            if (error) {
                console.log('Access Token Error', error.message);
            }
            token = oauth2.accessToken.create(result);

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
                            channels.findOne({code: 'googleanalytics'}, function (err, channelDetails) {
                                console.log('channelDetails', channelDetails);
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
    })
};