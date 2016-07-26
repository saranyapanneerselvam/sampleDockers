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
    app.get(configAuth.instagramAuth.localCallingURL, function (req, res) {
        res.redirect(ig.get_authorization_url(redirect_uri, {
            scope: configAuth.instagramAuth.scope
        }));
    });


    //Callback navigation after successful authentication - dev
    app.get(configAuth.instagramAuth.localCallbackURL, function (req, res) {
        ig.authorize_user(req.query.code, redirect_uri, function (err, result) {
            //If authorization Error occurs - dev
            if (err)
                return res.status(401).json({error: 'Authentication required to perform this action'});
            //On successful authentication - dev
            else {
                req.tokens = result.access_token;
                var token = req.tokens;
                req.userId = result.user.id;
                var profileId = req.userId;
                req.profileName = result.user.full_name;
                var profileName = req.profileName;
                res.render('successAuthentication');
                var code = req.query.code;

                //Query to find instagram channelId which is to be stored in profile table - dev
                channels.findOne({code: configAuth.channels.instagram}, function (err, channelDetails) {
                    req.channelId = channelDetails._id;
                    req.accessToken = token;
                    req.code = channelDetails.code;

                    //Store profile details - dev
                    user.storeProfiles(req,res, function (err, response) {
                        //If storage error occurs - dev
                        if (err)
                            res.json('Error', err);

                        else {
                            //Find objects in objects table based on profileId which is to be stored in profile table - dev
                            objects.findOne({profileId: response._id}, function (err, object) {
                                if (err)
                                    return res.status(500).json({error: err});
                                else if (!object) {
                                    //Find objectType in objectType table based on channelId - dev
                                    objectType.find({'channelId': response.channelId}, function (err, objectType) {
                                        //Create an object for channel and Insert object in profile table - dev
                                        var objectList = new objects();
                                        objectList.channelId = objectType[0].channelId;
                                        objectList.profileId = response._id;
                                        objectList.objectTypeId = objectType[0]._id;
                                        objectList.name = response.name;
                                        objectList.updated = new Date();
                                        objectList.created = new Date();

                                        //Query to save profile details - dev
                                        objectList.save(function (err, user) {
                                            if (!err)
                                                res.render('successAuthentication');
                                            else
                                                return res.status(500).json({error: err});
                                        });
                                    });
                                }
                                else
                                    res.render('successAuthentication');
                            });
                        }
                    });
                });
            }
        });
    });
};