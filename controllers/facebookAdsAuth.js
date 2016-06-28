var profile = require('../models/profiles');
var configAuth = require ('../config/auth');
var channels = require('../models/channels');
var request = require('request');
var  FB = require('fb');
var graph = require ('fbgraph');
var user = require('../helpers/user');

module.exports = function(app) {

    var oauth2 = require('simple-oauth2')({
        clientID: configAuth.facebookAdsAuth.clientID,
        clientSecret: configAuth.facebookAdsAuth.clientSecret,
        grant_type: configAuth.facebookAdsAuth.grant_type,
        site: configAuth.facebookAdsAuth.site,
        tokenPath: configAuth.facebookAdsAuth.tokenPath,
        authorizationPath: configAuth.facebookAdsAuth.authorizationPath
    });

    // Authorization uri definition
    var authorization_uri = oauth2.authCode.authorizeURL({
        redirect_uri: configAuth.facebookAdsAuth.redirect_uri,
        scope: configAuth.facebookAdsAuth.scope,
        state: configAuth.facebookAdsAuth.state
    });

    // Initial page redirecting to Github
    app.get(configAuth.facebookAdsAuth.localCallingURL, function (req, res) {
        res.redirect(authorization_uri);
    });
    
    // Callback service parsing the authorization token and asking for the access token
    app.get(configAuth.facebookAdsAuth.localCallbackURL, function (req, res) {
        var code = req.query.code;
        oauth2.authCode.getToken({
            code: code,
            redirect_uri: configAuth.facebookAdsAuth.redirect_uri
        }, saveToken);
        function saveToken(error, result) {
            var getExpiresInValue = 5097600;
            if (error) {
                return res.status(401).json({error: 'Authentication required to perform this action'});
            }
            token = oauth2.accessToken.create(result);
            var obj = token.token;
            var accessToken = result.substr(result.indexOf('=') + 1);
            var indexExpires = accessToken.indexOf('&');
            if (indexExpires === -1) {
                accessToken = result.substr(result.indexOf('=') + 1);
            }
            else {
                var expires = accessToken.substr(indexExpires);
                var getExpiresIn = accessToken.indexOf('expires=');
                var expiresInValue = accessToken.substr(getExpiresIn);
                var getExpiresInValue=expiresInValue.substr(expiresInValue.indexOf('=') + 1);
                var accessToken = accessToken.substr(0,indexExpires);
            }
            //Store the token and expired time into DB
            request(configAuth.facebookAdsAuth.accessTokenURL + accessToken, function (error, response, body) {
                if (!error && response.statusCode == 200) {
                    //parse the body data
                    var parsedData = JSON.parse(body);
                    //set the body into userdata
                    req.userId = parsedData.id;
                    req.profileName = parsedData.name;
                    //set token details to tokens
                    req.tokens = accessToken;
                    var numdays = (Math.floor(getExpiresInValue / 86400)-1);
                    var currentdate = new Date();
                    currentdate.setDate(currentdate.getDate() +numdays);
                    channels.findOne({code: configAuth.channels.facebookAds}, function (err, channelList) {
                        req.channelId = channelList._id;
                        req.channelCode = '3';
                        FB.setAccessToken(accessToken);//Set access token
                        req.expiresIn = currentdate;
                        FB.api(req.userId, {fields: ['id', 'name', 'email']}, function (profile) {
                            if (!profile || profile.error) {
                                //console.log(!profile ? 'error occurred' : profile.error);
                                return;
                            }
                            else {
                                req.userEmail = profile.email;
                                //Call the helper to store user details
                                user.storeProfiles(req, function (err, response) {
                                    if (err)
                                        res.json('Error');
                                    else {
                                        /* specfic_user = res.userDetails.userId;*/
                                        /*getAccount(tokenAccess,'v2.5/me/adaccounts',specfic_user);*/
                                        res.render('successAuthentication');
                                        //If response of the storeProfiles function is success then redirect it to successAuthentication page
                                    }
                                });
                            }
                        });
                    })
                }
            });
        }
    });
};