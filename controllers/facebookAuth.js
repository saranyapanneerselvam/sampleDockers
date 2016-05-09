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
        site: 'https://www.facebook.com/dialog/',
        tokenPath: 'https://graph.facebook.com/oauth/access_token',
        authorizationPath: 'oauth'
    });
    console.log('config details', configAuth.facebookAuth.clientID);
// Authorization uri definition
    var authorization_uri = oauth2.authCode.authorizeURL({
        redirect_uri: configAuth.facebookAuth.callbackURL,
        state: configAuth.facebookAuth.state,
        scope: configAuth.facebookAuth.scope,
        profileFields: configAuth.facebookAuth.profileFields
    });

// Initial page redirecting to Github
    app.get('/api/v1/auth/facebook', function (req, res) {

        res.redirect(authorization_uri);
        console.log('res',res);
    });

// Callback service parsing the authorization token and asking for the access token
    app.get('/auth/facebook/callback', function (req, res) {
        console.log('callback');
        var code = req.query.code;
        //console.log('code', res);
        oauth2.authCode.getToken({
            code: code,
            redirect_uri: 'http://localhost:8080/auth/facebook/callback'
        }, saveToken);

        function saveToken(error, result) {
            if (error) {
                console.log('Access Token Error', error);
            }
            else {
                token = oauth2.accessToken.create(result);
                var accessToken = result.substr(result.indexOf('=') + 1);
                var indexExpires = accessToken.indexOf('&');
                if(indexExpires===-1)
                    var accessToken = result.substr(result.indexOf('=') + 1);
                else{
                    console.log('expires',accessToken);
                    var expires = accessToken.substr(indexExpires);
                    var accessToken = accessToken.substr(0,indexExpires);
                }


                //console.log('access token', accessToken);

                //To get logged user's userId ,email..
                request('https://graph.facebook.com/me?access_token=' + accessToken, function (error, response, body) {
                    console.log('response', body);
                    if (!error && response.statusCode == 200) {

                        //parse the body data
                        var parsedData = JSON.parse(body);

                        //set the body into userdata
                        req.userId = parsedData.id;
                        req.profileName = parsedData.name;

                        console.log('id', parsedData);
                        //set token details to tokens
                        req.tokens = accessToken;
                        channels.findOne({code: configAuth.channels.facebook}, function (err, channelDetails) {
                            console.log('parse',req.userId,accessToken);
                            req.channelId = channelDetails._id;
                            req.channelName = channelDetails.name;
                            req.channelCode = '2';
                            FB.setAccessToken(accessToken);//Set access token
                            FB.api(req.userId, {fields: ['id', 'name', 'email']}, function (profile) {
                                console.log('profile',profile);
                                if (!profile || profile.error) {
                                    console.log(!profile ? 'error occurred' : profile.error);
                                    return;
                                }
                                else {
                                    req.userEmail = profile.email;
                                    console.log('email', req.userEmail);
                                    req.userId = profile.id;
                                    //Call the helper to store user details
                                    user.storeProfiles(req, function (err, response) {
                                        console.log('stored');
                                        if (err)
                                            res.json('Error');
                                        else {
                                            //If response of the storeProfiles function is success then close the authentication window
                                            res.render('successAuthentication');
                                        }
                                    });
                                }
                            });
                        })

                    }
                })
            }
        }
    });
};
