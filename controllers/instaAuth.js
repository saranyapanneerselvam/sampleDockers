var channels = require('../models/channels');
var http = require('http');
var express = require('express');
var ig = require('instagram-node').instagram();
var app = express();
var configAuth = require('../config/auth');
var user = require('../helpers/user');
var objectType = require('../models/objectTypes');
var objects = require('../models/objects');

module.exports = function (app) {


    //Credentials for accessing the api - dev
    ig.use({
        client_id: configAuth.instagramAuth.clientID,
        client_secret: configAuth.instagramAuth.clientSecret
    });

    //Redirect URL - dev
    var redirect_uri = configAuth.instagramAuth.callbackURL;


    //Intial navigation to signin and validate - dev
    app.get('/api/auth/instagram', function (req, res) {
        res.redirect(ig.get_authorization_url(redirect_uri, {
            scope: configAuth.instagramAuth.scope
        }));
    });


    //Callback navigation after successful authentication - dev
    app.get('/auth/instagram/callback', function (req, res) {
        ig.authorize_user(req.query.code, redirect_uri, function (err, result) {
            //If authorization Error occurs - dev
            if (err) {
                console.log('Error', err);
                res.send('Error');
            }
            //On successful authentication - dev
            else {
                console.log('Access Token is :' + result.access_token);
                req.token = result.access_token;
                var token = req.token;
                req.userId = result.user.id;
                var profileId = req.userId;
                console.log('Profie User Id', profileId);
                req.profileName = result.user.full_name;
                var profileName = req.profileName;
                /*req.email = req.user.email;
                var email = req.email;*/
                console.log('User full name :', profileName);
                console.log('Result is : ', result);
                res.render('successAuthentication');
                console.log(req.token);
                var code = req.query.code;
                console.log('Code : ', code);


                //Query to find instagram channelId which is to be stored in profile table - dev
                channels.findOne({code: configAuth.channels.instagram}, function (err, channelDetails) {
                    console.log('Channel Details', channelDetails);
                    req.channelId = channelDetails._id;
                    req.accessToken = token;
                    //console.log('channel req' ,req);

                    //Store profile details - dev
                    user.storeProfiles(req, function (err, response) {
                        //console.log('stored');

                        //If storage error occurs - dev
                        if (err)
                            res.json('Error');

                        else {
                            console.log('respone id', response._id);
                            //Find objects in objects table based on profileId which is to be stored in profile table - dev
                            objects.findOne({profileId: response._id}, function (err, object) {
                                console.log('objectCreated', object);
                                //If object find error for profileId occurs - dev
                                if (object) {
                                    console.log('Object available for this user');
                                    res.render('successAuthentication');
                                }
                                else {
                                    console.log('responseChannel', response.channelId);
                                    //Find objectType in objectType table based on channelId - dev
                                    objectType.find({'channelId': response.channelId}, function (err, objectType) {
                                        console.log('objectType find response', objectType);
                                        //Create an object for channel and Insert object in profile table - dev
                                        var objectList = new objects();
                                        objectList.channelId = objectType[0].channelId;
                                        objectList.profileId = response._id;
                                        objectList.objectTypeId = objectType[0]._id;
                                        objectList.name = "instagram";
                                        objectList.updated = new Date();
                                        objectList.created = new Date();

                                        //Query to save profile details - dev
                                        objectList.save(function (err, user) {
                                            if (!err) {
                                                console.log('ObjectList Created', user);
                                                res.render('successAuthentication');
                                            }
                                        });

                                    });

                                }
                            });

                        }
                    });

                });
            }
        });
    });

}