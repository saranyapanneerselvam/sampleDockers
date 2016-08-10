module.exports = function (app) {
    var request = require('request');
        var PDK = require('node-pinterest');
    var channels = require('../models/channels');
    var configAuth = require('../config/auth');
    var user = require('../helpers/user');
    var objectType = require('../models/objectTypes');
    var objects = require('../models/objects');
    var oauth2 = require('simple-oauth2')({
        clientID: configAuth.pinterest.clientID,
        clientSecret: configAuth.pinterest.clientSecret,
        site: 'https://api.pinterest.com/',
        tokenPath: 'https://api.pinterest.com/v1/oauth/token',
        grant_type: 'authorization_code',
        authorizationPath: 'oauth'
    });

    // Authorization uri definition
    var authorization_uri = oauth2.authCode.authorizeURL({
        redirect_uri: configAuth.pinterest.redirect_uri,
        response_type: 'code',
        scope: configAuth.pinterest.scope,
        state: '768uyFys',
        approval_prompt: 'force',
        access_type: 'offline'
    });

    app.get('/api/auth/pinterest', function (req, res) {
        res.redirect(authorization_uri);
    });
    app.get('/auth/pinterest/callback', function (req, res) {
        var code = req.query.code;
        console.log('code', code);
        oauth2.authCode.getToken({
            code: code,
            redirect_uri: configAuth.pinterest.redirect_uri
        }, saveToken);

        function saveToken(error, result) {
            console.log('token')
            if (error) {
                console.log('Access Token Error', error);
            }
            else {
                token = oauth2.accessToken.create(result);
                var accessToken = token.token.access_token;
                // console.log('access token', accessToken);
                var expires = token.token.expires;
                var pinterest = PDK.init(accessToken);
                pinterest.api('me').then(function (response) {
                    // console.log('response',response);
                    if (response) {
                        //parse the body data
                        var parsedData = response.data;

                        //set the body into userdata
                        req.userId = parsedData.id;
                        req.profileName = parsedData.first_name + parsedData.last_name;

                        //set token details to tokens
                        req.tokens = accessToken;
                        channels.findOne({code: configAuth.channels.pinterest}, function (err, channelDetails) {
                            console.log('parse', req.userId, channelDetails);
                            req.channelId = channelDetails._id;
                            req.channelName = channelDetails.name;
                            req.code=channelDetails.code;
                            user.storeProfiles(req,res, function (err, responseUser) {
                                console.log('responseUser', responseUser);
                                //If storage error occurs - dev
                                if (err)
                                    res.json('Error');

                                else {
                                    console.log('respone id', responseUser._id);
                                    //Find objects in objects table based on profileId which is to be stored in profile table - dev
                                    objects.findOne({profileId: responseUser._id}, function (err, object) {
                                        console.log('objectCreated', object);
                                        //If object find error for profileId occurs - dev
                                        if (object) {
                                            console.log('Object available for this user');
                                            res.render('../public/successAuthentication');
                                        }
                                        else {
                                            console.log('responseChannel', responseUser.channelId);
                                            //Find objectType in objectType table based on channelId - dev
                                            objectType.find({'channelId': responseUser.channelId}, function (err, objectType) {
                                                console.log('objectType find response', objectType);
                                                //Create an object for channel and Insert object in profile table - dev
                                                var objectList = new objects();
                                                var objectList = new objects();
                                                objectList.profileId = responseUser._id;
                                                objectList.objectTypeId = objectType[0]._id;
                                                objectList.name = "pinterest";
                                                objectList.updated = new Date();
                                                objectList.created = new Date();

                                                //Query to save profile details - dev
                                                objectList.save(function (err, user) {
                                                    if (!err) {
                                                        console.log('ObjectList Created', user);
                                                        res.render('../public/successAuthentication');
                                                    }
                                                });

                                            });

                                        }
                                    });

                                }
                            });

                        })
                    }
                });

            }
        }
    });
};