module.exports = function (app) {

// load the auth variables
    var configAuth = require('../config/auth');
    var oauth2 = require('simple-oauth2')({
        clientID: configAuth.facebookAuth.clientID,
        clientSecret: configAuth.facebookAuth.clientSecret,
        site: 'https://www.facebook.com/dialog/',
        tokenPath: 'https://graph.facebook.com/oauth/access_token',
        authorizationPath: 'oauth',
        profileFields: ["emails", "displayName"]
    });
    console.log('config details', configAuth.facebookAuth.clientID);
// Authorization uri definition
    var authorization_uri = oauth2.authCode.authorizeURL({
        redirect_uri: 'http://localhost:8080/auth/facebook/callback',
        state: '3832$',
        scope: 'email',

    });

// Initial page redirecting to Github
    app.get('/auth/facebook', function (req, res) {

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

        function saveToken(error, result, profile1) {
            if (error) {
                console.log('Access Token Error', error);
            }
            //console.log('token',result);
            token = oauth2.accessToken.create(result);
            console.log('res', token);

        }

        res.redirect('/');
    });

    // });


}
