module.exports = function (app) {
    var request = require('request');
    var querystring = require('querystring');
    var user = require('../helpers/user');
    var channels = require('../models/channels');
    var objectType = require('../models/objectTypes');
    var Object = require('../models/objects');
    var formurlencoded = require('form-urlencoded');
    // load the auth variables
    var configAuth = require('../config/auth');
    var MailChimpAPI = require('mailchimp').MailChimpAPI;
    var MailChimpOAuth = require('mailchimp').MailChimpOAuth;
    var orgId;
    var options = {
        clientId: configAuth.mailChimp.clientID,
        clientSecret: configAuth.mailChimp.clientSecret,
        redirectUri: configAuth.mailChimp.redirect_uri,
        ownServer: false
    };
    var oauth2 = new MailChimpOAuth(options);

    // Authorization uri definition
    var authorization_uri = oauth2.getAuthorizeUri();

// Initial page redirecting to Github
    app.get('/api/auth/mailchimp', function (req, res) {
        orgId = req.user;
        res.redirect(authorization_uri);
    });

// Callback service parsing the authorization token and asking for the access token
    app.get('/auth/mailchimp/callback', function (req, res) {
        oauth2.on('error', function (error) {
            return res.status(401).json({error: 'Authentication required to perform this action'});
        });
        var param = {
            grant_type: 'authorization_code',
            client_id: configAuth.mailChimp.clientID,
            client_secret: configAuth.mailChimp.clientSecret,
            code: req.query.code,
            redirect_uri: configAuth.mailChimp.redirect_uri
        };
        var options = {
            url: 'https://login.mailchimp.com/oauth2/token',
            gzip: true,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: formurlencoded(param)
        };
        request.post(options, function (error, response, body) {
            var parsedBodyResult = JSON.parse(body);
            //set token details to tokens
            req.tokens = parsedBodyResult.access_token;
            req.user = orgId;
            var token = parsedBodyResult.access_token;
            if (!error) {
                request({
                    uri: 'https://login.mailchimp.com/oauth2/metadata',
                    headers: {
                        'User-Agent': 'node-mailchimp/1.2.0',
                        'Authorization': 'OAuth ' + token
                    }
                }, function (err, response, body) {
                    var parsedResponse;
                    if (response.statusCode != 200)
                        return res.status(401).json({error: 'Authentication required to perform this action'});
                    else {
                        parsedResponse = JSON.parse(body);
                        var dc = parsedResponse.dc;
                        req.userEmail = parsedResponse.login.email;
                        req.userId = parsedResponse.user_id;
                        req.profileName = parsedResponse.login.login_name;
                        req.dataCenter = parsedResponse.dc;
                        channels.findOne({code: configAuth.channels.mailChimp}, function (err, channelDetails) {
                            console.log('channelDetails',channelDetails)
                            if (err)
                                return res.status(500).json({error: err});
                            else if (!channelDetails)
                                return res.status(204).json({error: 'No records found'});
                            else {
                                req.channelId = channelDetails._id;
                                req.channelName = channelDetails.name;
                                req.code = channelDetails.code;
                                //Calling the storeProfiles middleware to store the data
                                user.storeProfiles(req,res,function (err, responses) {
                                    if (err)
                                        return res.status(500).json({error: err});
                                    else res.render('successAuthentication');

                                });
                            }
                        });
                    }
                })
            }
            else  res.status(401).json({error: 'Authentication required to perform this action'});
        });
    })
};