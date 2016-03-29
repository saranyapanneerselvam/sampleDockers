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
        redirect_uri: 'http://localhost:8080/auth/facebook/callback',
        state: '3832$',
        scope: ['email', 'manage_pages,', 'read_insights'],
        profileFields: ["emails", "displayName"]

    });

// Initial page redirecting to Github
    app.get('/api/v1/auth/facebook', function (req, res) {

        res.redirect(authorization_uri);
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
                var expires = accessToken.substr(indexExpires);
                console.log('expires',expires);
                if(expires){
                    var accessToken = accessToken.substr(0,indexExpires);
                    console.log('accesstoken',accessToken)
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
                        req.channelId = '56d52c7ae4b0196c549033ca';
                        req.channelCode = '2';
                        FB.setAccessToken(accessToken);//Set access token
                        FB.api(req.userId, {fields: ['id', 'name', 'email']}, function (profile) {
                            if (!profile || profile.error) {
                                console.log(!profile ? 'error occurred' : profile.error);
                                return;
                            }
                            else {
                                req.userEmail = profile.email;
                                console.log('email', req.userEmail);
                                //Call the helper to store user details
                                user.storeProfiles(req, function (err, response) {
                                    if (err)
                                        res.json('Error');
                                    else {

                                        //If response of the storeProfiles function is success then redirect it to profile page
                                        res.redirect('/profile');
                                    }
                                });
                            }
                        });
                    }
                })
            }
        }
    });
};
