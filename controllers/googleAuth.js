module.exports = function (app) {
    var request = require('request');
    var user = require('../helpers/user');
    var getGoogleMetricData = require('../middlewares/googleBasic');
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
        authorizationPath: 'oauth2/auth',
    });
    console.log('config details', configAuth.googleAuth.clientID);
// Authorization uri definition
    var authorization_uri = oauth2.authCode.authorizeURL({
        redirect_uri: 'http://localhost:8080/auth/google/callback',
        approval_prompt: 'force',
        access_type: 'offline',
        scope: 'https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/analytics.readonly https://www.googleapis.com/auth/analytics.manage.users ',
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
            redirect_uri: 'http://localhost:8080/auth/google/callback'
        }, saveToken);

        function saveToken(error, result) {
            if (error) {
                console.log('Access Token Error', error.message);
            }
            token = oauth2.accessToken.create(result);
            console.log('token', token);
            request('https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=' + token.token.access_token, function (error, response, body) {
                console.log('body', body);
                if (!error && response.statusCode == 200) {

                    //set the body into userdata
                    req.userData = body;

                    //set token details to tokens
                    req.tokens = token.token;

                    //Calling the storeProfiles middleware to store the data
                    user.storeProfiles(req, function (err, response) {
                        if (response) {
                            //If response of the storeProfiles function is success then redirect it to profile page
                            res.render('profile.ejs');
                        }
                        else {
                            res.json('Error');
                        }
                    });
                }
            })
        }
    })
    /**
     * To get the google analytic data based on metric name
     */
    app.get('/api/v1/google/data/:metricName', getGoogleMetricData.listAccounts, function (req, res) {
        var googleAnalyticData = req.showMetric.result;
        if(googleAnalyticData)
        res.json({'metricName':googleAnalyticData.columnHeaders[0].name,'totalCount':googleAnalyticData.totalsForAllResults});
        else
        res.json({'message':req.showMetric.error.message});
    });
}
