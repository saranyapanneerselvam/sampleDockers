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
    //var Mailchimp = require('mailchimp-api-v3');
    var orgId;
    //var mailchimp = new Mailchimp(configAuth.mailChimp.apiKey);
    var options = {
        clientId: configAuth.mailChimp.clientID,
        clientSecret: configAuth.mailChimp.clientSecret,
        redirectUri: configAuth.mailChimp.redirect_uri,
        ownServer: false
        //port: '8080',
        //addPort: false
    };
    var oauth2 = new MailChimpOAuth(options);

    // Authorization uri definition
    var authorization_uri = oauth2.getAuthorizeUri();

// Initial page redirecting to Github
    app.get('/api/auth/mailchimp', function (req, res) {
        console.log('checking Cookies', req.user);
        orgId = req.user;
        res.redirect(authorization_uri);
    });

// Callback service parsing the authorization token and asking for the access token
    app.get('/auth/mailchimp/callback', function (req, res) {
        console.log('req.user', orgId);
        oauth2.on('error', function (error) {
            console.log(error.err);
        });
        console.log('code', req.query.code);
        var param = {
            grant_type: 'authorization_code',
            client_id: configAuth.mailChimp.clientID,
            client_secret: configAuth.mailChimp.clientSecret,
            code: req.query.code,
            redirect_uri: configAuth.mailChimp.redirect_uri
        };
        console.log('params', param);
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
                    if (error) {
                        console.log('error');
                    }
                    else {
                        parsedResponse = JSON.parse(body);
                        console.log('PARSEDRESPONSE',parsedResponse);
                        var dc = parsedResponse.dc;
                        req.userEmail = parsedResponse.login.email;
                        req.userId = parsedResponse.user_id;
                        req.profileName = parsedResponse.login.login_name;
                        req.dataCenter = parsedResponse.dc;
                        channels.findOne({code: configAuth.channels.mailChimp}, function (err, channelDetails) {
                            req.channelId = channelDetails._id;
                            req.channelName = channelDetails.name;
                            req.code = channelDetails.code;
                            console.log(' req.channelId', channelDetails._id, channelDetails.name);
                            //Calling the storeProfiles middleware to store the data
                            user.storeProfiles(req, function (err, responses) {
                                if (err)
                                    res.json('Error');
                                else {
                                    //Find objectType in objectType table based on channelId - dev
                                    objectType.find({
                                        'channelId': responses.channelId
                                    }, function (err, objectType) {
                                        //Create an object for channel and Insert object in profile table - dev

                                        for (var key = 0; key < objectType.length; key++) {
                                            if (objectType[key].type === configAuth.objectType.mailChimpList) {
                                                var query = 'https://' + dc + '.api.mailchimp.com/3.0/lists?count=100&fields=lists.name,lists.id,lists.stats,lists.date_created';
                                                getObjectLists(query);
                                            }
                                            else {
                                                var query ='https://' + dc + '.api.mailchimp.com/3.0/campaigns?count=100&fields=campaigns.id,campaigns.settings,campaigns.create_time';
                                                getObjectLists(query);
                                            }
                                            function getObjectLists(query) {
                                                var objectsName = objectType[key].type;
                                                var objectIds = objectType[key]._id;
                                                var channelObjectDetails = [];
                                                request({
                                                    uri: query,
                                                    headers: {
                                                        'User-Agent': 'node-mailchimp/1.2.0',
                                                        'Authorization': 'OAuth ' + token
                                                    }
                                                }, function (err, response, body) {
                                                    var parsedResponse;
                                                    if (err) {
                                                        console.log('error');
                                                    }
                                                    else {
                                                        var objectStoreDetails = JSON.parse(body);
                                                        if(objectStoreDetails[objectsName].length===0){
                                                            console.log('objectsName',objectsName);
                                                            res.render('successAuthentication');
                                                        }
                                                        else {
                                                            for (var i in objectStoreDetails[objectsName]) {
                                                                console.log('listsbody', objectStoreDetails[objectsName][i]);
                                                                var profileId = responses._id;
                                                                var objectTypeId = objectIds;
                                                                var channelObjectId = objectStoreDetails[objectsName][i].id;
                                                                var created = new Date();
                                                                var updated = new Date();
                                                                if (objectsName === configAuth.objectType.mailChimpList) {
                                                                    var name = objectStoreDetails[objectsName][i].name;
                                                                }
                                                                else {
                                                                    var name = objectStoreDetails[objectsName][i].settings.title;
                                                                }
                                                                //To store once
                                                                Object.update({
                                                                    profileId: responses._id,
                                                                    channelObjectId: channelObjectId
                                                                }, {
                                                                    $setOnInsert: {created: created},
                                                                    $set: {
                                                                        name: name,
                                                                        objectTypeId: objectTypeId,
                                                                        updated: updated
                                                                    }
                                                                }, {upsert: true}, function (err, object) {
                                                                    if (err)
                                                                        return res.status(500).json({error: 'Internal server error'})
                                                                    else if (object == 0)
                                                                        return res.status(501).json({error: 'Not implemented'})
                                                                    else {
                                                                        console.log('object', object)
                                                                        res.render('successAuthentication');
                                                                    }
                                                                })
                                                            }
                                                        }
                                                    }
                                                });
                                            }
                                        }
                                    });
                                }
                            });
                        });
                    }
                })
            }
        });
    })
};