var configAuth = require ('../config/auth');
var channels = require('../models/channels');
var objects = require('../models/objects');
var objectType = require('../models/objectTypes');
var request = require('request');
var user = require('../helpers/user');
module.exports = function(app) {

    var oauth2 = require('simple-oauth2')({
        clientID: configAuth.vimeoAuth.clientID,
        clientSecret: configAuth.vimeoAuth.clientSecret,
        site: configAuth.vimeoAuth.site,
        tokenPath: configAuth.vimeoAuth.tokenPath,
        authorizationPath: configAuth.vimeoAuth.authorizationPath
    });

    var authorization_uri = oauth2.authCode.authorizeURL({
        redirect_uri: configAuth.vimeoAuth.redirect_uri,
        scope: configAuth.vimeoAuth.scope,
        state: configAuth.vimeoAuth.state
    });


    app.get(configAuth.vimeoAuth.localCallingURL, function (req, res) {
        res.redirect(authorization_uri);
    });

    app.get(configAuth.vimeoAuth.localCallbackURL, function (req, res) {

        var code = req.query.code;
        oauth2.authCode.getToken({
            code: code,
            redirect_uri: configAuth.vimeoAuth.redirect_uri
        }, saveToken);



        function saveToken(error, result) {


            if (error) {
                return res.status(401).json({error: 'Authentication required to perform this action'});
            }

            var accessToken = result.access_token;

            request(configAuth.vimeoAuth.accessTokenURL + accessToken, function (error, response, body) {

                if (!error && response.statusCode == 200) {
                    var parsedData = JSON.parse(body);

                    req.userId = parsedData.uri.split("/")[2];
                    req.profileName = parsedData.name;
                    req.userEmail=parsedData.name;
                    req.tokens = accessToken;

                    channels.findOne({code: configAuth.channels.vimeo}, function (err, channelDetails) {

                        if (err)
                            return res.status(500).json({error: err});
                        else if (!channelDetails)
                            return res.status(204).json({error: 'No records found'});
                        else {
                            req.channelId = channelDetails._id;
                            req.channelName = channelDetails.name;
                            req.channelCode = channelDetails.code;
                            req.code = channelDetails.code;
                            // req.userEmail = profile.email;
                           // req.userId = profile.id;

                            user.storeProfiles(req, res, function (err, response) {
                                if (err) res.json('Error');
                                else {
                                    res.render('../public/successAuthentication');
                                }
                            });

                        }


                    })

                }
                else {
                    return res.status(401).json({error: 'Authentication required to perform this action'});
                }


            })


        }



    })

}










