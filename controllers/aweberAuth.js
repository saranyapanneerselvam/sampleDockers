//var NodeAweber = require('./index');
var user = require('../helpers/user');
var NodeAweber = require('aweber-api-nodejs');
var channels = require('../models/channels');
var configAuth = require('../config/auth');
var NA = new NodeAweber(configAuth.aweberAuth.clientID, configAuth.aweberAuth.clientSecret,'http://localhost:8080/callback');

module.exports = function(app) {


//In a real app, you'd store this in the user's session or via a websocket client, or something. This is just a global variable, and won't scale past a single user.
    var tokens, tokenSecret;

    app.get('/api/auth/aweber', function (req, res) {
        var requestToken = NA.requestToken(function (err, response) {
            tokenSecret = response.oauth_token_secret;
            res.redirect('https://auth.aweber.com/1.0/oauth/authorize?oauth_token=' + response.oauth_token);
        });
    });

    app.get('/callback', function (req, res) {
        var q = req.query;

        if (q.oauth_token && q.oauth_verifier) {
            var accessToken = NA.accessToken(q.oauth_token, q.oauth_verifier, tokenSecret, function (err, response) {
                tokens = response.oauth_token;
                tokenSecret = response.oauth_token_secret;
                var apiClient = NA.api(tokens,tokenSecret);

                apiClient.request('get', 'accounts', {}, function (err, response) {
                    var accounts = response.entries;
                    if (!err ) {

                        req.userId =response.entries[0].id;

                        req.profileName =response.entries[0].id;

                        channels.findOne({code: configAuth.channels.aweber}, function (err, channelDetails){

                            req.channelId = channelDetails._id;
                            req.code = channelDetails.code;
                            req.tokenSecret=tokenSecret;
                            req.tokens=tokens;
                            req.channelName = channelDetails.name;

                            user.storeProfiles(req,res,function (err){
                                if (err)
                                    res.json('Error', err);
                                else {
                                    //If response of the storeProfiles function is success then close the authentication window
                                    res.render('../public/successAuthentication');
                                }
                            });

                        })
                    }
                    else{
                        return res.status(401).json({error: 'Authentication required to perform this action'});
                    }
                });
            })
        }
        else{
            return res.status(401).json({error: 'Authentication required to perform this action'});
        }
    });

}