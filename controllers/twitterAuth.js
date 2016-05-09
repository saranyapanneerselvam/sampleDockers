var request = require('request');
var configAuth = require('../config/auth');
var profile = require('../models/profiles');
var channels = require('../models/channels');
var user = require('../helpers/user');
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

    app.get('/api/auth/twitter', function (req, res) {
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
                //If response of the storeProfiles function is success then redirect it to profile page
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
                        req.tokens = oauth_access_token;
                        req.userId = results.user_id;
                        req.profileName =  results.screen_name;
                        req.userEmail = results.screen_name;
                        tokens = req.tokens;
                        console.log('access token: '+ tokens);
                        channels.findOne({code : configAuth.channels.twitter},function(err ,channelList){
                            console.log(channelList);
                            req.channelId =channelList._id ;
                            req.channelCode = '4';
                            user.storeProfiles(req, function (err, response ) {
                                if (err)
                                    res.json('Error');
                                else {
                                    //If response of the storeProfiles function is success then render the successAuthentication page
                                    res.render('successAuthentication');
                                }
                            });
                        });

                    }
                }
            );
        } else
            next(new Error("you're not supposed to be here."))
    });

}