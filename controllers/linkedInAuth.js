module.exports = function (app) {
    var request = require('request');
    var channels = require('../models/channels');
    var configAuth = require('../config/auth');
    var user = require('../helpers/user');
    var formurlencoded = require('form-urlencoded');
    var objectType = require('../models/objectTypes');
    var objects = require('../models/objects');
    var oauth2 = require('simple-oauth2')({
        clientID: configAuth.linkedIn.clientID,
        clientSecret: configAuth.linkedIn.clientSecret,
        site:configAuth.linkedIn.site,
        tokenPath: configAuth.linkedIn.tokenPath,
        authorizationPath: configAuth.linkedIn.authorizationPath
    });

    // Authorization uri definition
    var authorization_uri = oauth2.authCode.authorizeURL({
        redirect_uri: configAuth.linkedIn.redirect_uri,
        grant_type: 'authorization_code',
        response_type: 'code',
        scope: configAuth.linkedIn.scope,
        state: '4853uyFys'
    });

    app.get('/api/auth/linkedin', function (req, res) {
        res.redirect(authorization_uri);
    });
    app.get('/auth/linkedin/callback', function (req, res) {
        var code = req.query.code;
        var param = {
            grant_type: 'authorization_code',
            code: req.query.code,
            redirect_uri: configAuth.linkedIn.redirect_uri,
            client_id: configAuth.linkedIn.clientID,
            client_secret: configAuth.linkedIn.clientSecret,
            scope: configAuth.linkedIn.scope
        };
        var options = {
            url: 'https://www.linkedin.com/oauth/v2/accessToken',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: formurlencoded(param)
        };
        request.post(options, function (error, response, body) {
            var parsedBodyResult = JSON.parse(body);
            if(!parsedBodyResult.error) {
                req.tokens = parsedBodyResult.access_token;
                var access_token = parsedBodyResult.access_token;
                var getExpiresInValue =parsedBodyResult.expires_in;
                var numdays = configAuth.expire.linkedInAccessExpire;
                var currentdate = new Date();
                currentdate.setDate(currentdate.getDate() + numdays);
                req.expiresIn = currentdate;
                request({
                    uri: 'https://api.linkedin.com/v1/people/~?format=json',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + access_token
                    }
                }, function (err, response, body) {
                    var parsedResponse;
                    if (error)
                        return res.status(401).json({error: 'Authentication required to perform this action'});
                    else {
                        var parsedResponse = JSON.parse(body);
                        if(response.statusCode!=200)
                            return res.status(401).json({error: 'Authentication required to perform this action'});
                        else {
                            req.userEmail = parsedResponse.firstName + parsedResponse.lastName;
                            req.userId = parsedResponse.id;
                            req.profileName = parsedResponse.firstName + parsedResponse.lastName;
                            channels.findOne({code: configAuth.channels.linkedIn}, function (err, channelDetails) {
                                if(err){
                                    return res.status(401).json({error: 'Authentication required to perform this action'});
                                }
                                else {
                                    req.channelId = channelDetails._id;
                                    req.channelName = channelDetails.name;
                                    req.code = channelDetails.code

                                    //Calling the storeProfiles middleware to store the data
                                    user.storeProfiles(req,res, function (err, response) {
                                        if (err)
                                            res.json('Error');
                                        else {
                                            res.render('../public/successAuthentication');
                                        }
                                    });
                                }
                            });
                        }
                    }
                });
            }
            else
                return res.status(401).json({error: 'Authentication required to perform this action'});
        });
    });
};