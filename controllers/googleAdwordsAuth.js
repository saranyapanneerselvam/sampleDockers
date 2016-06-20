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
        site: 'https://accounts.google.com/o/',
        tokenPath: 'https://accounts.google.com/o/oauth2/token',
        authorizationPath: 'oauth2/auth'
    });

    // Authorization uri definition
    var authorization_uri = oauth2.authCode.authorizeURL({
        redirect_uri: configAuth.googleAdwordsAuth.callbackURL,
        state: configAuth.googleAdwordsAuth.state,
        scope: configAuth.googleAdwordsAuth.scope,
        approval_prompt: 'force',
        access_type: 'offline'
    });

// Initial page redirecting to Github
    app.get('/api/auth/adwords', function (req, res) {

        res.redirect(authorization_uri);
        //console.log('res',res);
    });

// Callback service parsing the authorization token and asking for the access token
    app.get('/auth/adwords/callback', function (req, res) {
        console.log('callback');
        var code = req.query.code;
        //console.log('code', res);
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
                console.log(token);
                accessToken = token.token.access_token;
                refreshToken = token.token.refresh_token;
                console.log(accessToken ,refreshToken );
                //To get logged user's userId ,email..
                request('https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=' + token.token.access_token, function (error, response, body) {
                    if (!error && response.statusCode == 200) {

                        //To get the profile name .. based on access token
                        request('https://www.googleapis.com/oauth2/v2/userinfo?access_token=' + token.token.access_token, function (err, responseData, result) {
                            if (!err) {


                                //To parse the access token details
                                var parsedBodyResult = JSON.parse(body);
                                console.log('Parsed Body Result',parsedBodyResult);


                                //To parse profile result
                                var parsedResult = JSON.parse(result);

                                //set the body into userdata
                                req.userEmail = parsedBodyResult.email;
                                req.userId = parsedBodyResult.user_id;
                                req.profileName = parsedResult.name;

                                //set token details to tokens
                                req.tokens = token.token;
                                channels.findOne({code: configAuth.channels.googleAdwords}, function (err, channelDetails) {
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
        }
    });
}
