var request = require('request');
var configAuth = require('../config/auth');
module.exports = function (app) {
    var OAuth = require('oauth').OAuth;
    var oa = new OAuth(
        "https://api.twitter.com/oauth/request_token",
        "https://api.twitter.com/oauth/access_token",
        configAuth.twitterAuth.consumerKey,//Consumer key
        configAuth.twitterAuth.consumerSecret,//Consumer key secret
        "1.0",
        configAuth.twitterAuth.callbackURL,//Callback url
        "HMAC-SHA1"
    );

    app.get('/api/v1/auth/twitter', function (req, res) {
        oa.getOAuthRequestToken(function (error, oauth_token, oauth_token_secret, results) {
            if (error) {
                console.log(error);
                res.send("yeah no. didn't work.")
            }
            else {
                req.session.oauth = {};
                req.session.oauth.token = oauth_token;
                console.log('oauth.token: ' + oauth_token);
                req.session.oauth.token_secret = oauth_token_secret;
                console.log('oauth.token_secret: ' + oauth_token_secret);
                res.redirect('https://twitter.com/oauth/authenticate?oauth_token=' + oauth_token)
            }
        });
    });
    app.get('/auth/twitter/callback', function (req, res, next) {
       // console.log('session', req.session);
        if (req.session.oauth) {
            req.session.oauth.verifier = req.query.oauth_verifier;
            var oauth = req.session.oauth;

            oa.getOAuthAccessToken(oauth.token, oauth.token_secret, oauth.verifier,
                function (error, oauth_access_token, oauth_access_token_secret, results) {
                    if (error) {
                        console.log(error);
                        res.send("yeah something broke.");
                    } else {
                        req.session.oauth.access_token = oauth_access_token;
                        req.session.oauth, access_token_secret = oauth_access_token_secret;
                        console.log(results);
                        request('https://api.twitter.com/1.1/users/show.json?screen_name=' + results.screen_name, function (err, response, body) {
                            console.log('response',response,'body', body);
                        })
                        res.send("worked. nice one.");
                    }
                }
            );
        } else
            next(new Error("you're not supposed to be here."))
    });
}