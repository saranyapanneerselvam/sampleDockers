var Channel = require('../models/channels');
var exports = module.exports = {};
var FB = require('fb');//Importing the fb module
var googleapis = require('googleapis');//To use google api's
var graph = require('fbgraph');//Importing the fbgraph module
var Profile = require('../models/profiles');//To load up the user model
var metrics = require('../models/metrics');//To load the metrics model
var dataCollection = require('../models/data');//To load the data model
var Object = require('../models/objects');//To load the data model
var Objecttype = require('../models/objectTypes');//To load the data model
var userCollection = require('../models/user');
var OAuth2 = googleapis.auth.OAuth2;//Set OAuth
var configAuth = require('../config/auth');//Load the auth file
var oauth2Client = new OAuth2(configAuth.googleAuth.clientID, configAuth.googleAuth.clientSecret, configAuth.googleAuth.callbackURL);//set credentials in OAuth2
var analytics = googleapis.analytics({version: 'v3', auth: oauth2Client});// set auth as a global default

/**
 * middleware to get the account details based on user account

 */
exports.listAccounts = function (req, res, next) {
    console.log('inside google page list', req.query.objectType);

    //Array to hold web property list
    var accountWebpropertList = [];

    //Array to hold view list
    var webPropertyViewIdList = [];
    var totalAccounts = 0;
    var totalProperties = 0;
    var totalAccountCall = 0;
    var totalPropertyCall = 0;
    var propertyError = false;
    var accountError = false;
    //array to hold google data
    req.app.webPropertyViewIdList = [];

    //Query to find object type details
    Objecttype.findOne({type: req.query.objectType}, function (err, objecttype) {
        if (err)
            req.app.result = {error: err, message: 'Database error'};
        else if (!objecttype)
            req.app.result = {status: 302, message: 'No record found'};
        else {
            //Query to find channel
            Profile.findOne({'_id': req.params.profileId}, {
                accessToken: 1,
                refreshToken: 1,
                channelId: 1,
                userId: 1,
                email: 1
            }, function (err, profile) {
                console.log('profile', profile);
                if (err)
                    req.app.result = {error: err, message: 'Database error'};
                else if (!profile)
                    req.app.result = {status: 302, message: 'No record found'};
                else {
                    Channel.findOne({'_id': profile.channelId}, {code: 1}, function (err, channel) {
                        req.app.result = profile;

                        //To check the channel
                        switch (channel.code) {
                            case 'googleanalytics':
                                console.log('googleanalytics');
                                selectGAObjectType(profile, channel, objecttype);
                                break;
                            case 'facebook':
                                console.log('facebook');
                                selectFbObjectType(profile, channel, objecttype);
                                break;
                        }
                    })
                }
            })
        }
    })


    function selectGAObjectType(profile, channel, objecttype) {

        //To select which object type
        switch (req.query.objectType) {
            case 'view':
                initializeGa(profile, channel, objecttype);
                break;
        }
    }

    //function to get the list of ga pages
    function initializeGa(profile, channel, objecttype) {
        oauth2Client.setCredentials({
            access_token: profile.accessToken,
            refresh_token: profile.refreshToken
        });
        getAccounts(profile, channel, objecttype);

    }

    //Function to referesh the access token
    function refreshingAccessToken(profile) {
        oauth2Client.refreshAccessToken(function (err, tokens) {

            // your access_token is now refreshed and stored in oauth2Client
            // store these new tokens in a safe place (e.g. database)
            var userDetails = {};
            profile.token = tokens.access_token;
            getAccounts(profile);
            var updated = new Date();

            Profile.update({
                'email': profile.email,
                channelId: profile.channelId
            }, {$set: {"accessToken": tokens.access_token, updated: updated}}, function (err, updateResult) {
                if (err || !updateResult)console.log('failure');
                else console.log('Access token Update success');
            })
        });
    }

    //function to get the account list
    function getAccounts(profile, channel, objecttype) {
        analytics.management.accounts.list({
            access_token: profile.accessToken,
            auth: oauth2Client
        }, function (err, account) {
            if (!err) {
                var accountsLength = account.items.length;
                for (var i = 0; i < accountsLength; i++) {
                    getWebProperty(i, account, profile, channel, objecttype);
                }
            }
            else {
                accountError = true;
                refreshingAccessToken(profile);
            }
        })

    }

    //function to get property list
    function getWebProperty(i, account, profile, channel, objecttype) {
        totalAccountCall++;
        analytics.management.webproperties.list({
            'accountId': account.items[i].id,
        }, function (err, webProperty) {
            if (!err) {
                totalProperties = webProperty.items.length + totalProperties;
                for (var j = 0; j < webProperty.items.length; j++) {
                    accountWebpropertList.push({
                        'accountId': account.items[i].id,
                        webPropertyId: webProperty.items[j].id
                    });
                    if (!err) {
                        getWebPropertyView(i, j, webProperty, account, profile, channel, objecttype);
                    }
                }
            }
            else
                propertyError = true;
        })
    }

    //function to get the views list
    function getWebPropertyView(i, j, webProperty, account, profile, channel, objecttype) {
        analytics.management.profiles.list({
            'accountId': account.items[i].id,
            'webPropertyId': webProperty.items[j].id
        }, function (err, view) {
            totalPropertyCall++;
            for (var k = 0; k < view.items.length; k++) {
                if (!err) {
                    var created = new Date();
                    var updated = new Date();
                    //req.app.viewSelected = false;
                    webPropertyViewIdList.push({
                        'accountId': account.items[i].id,
                        'channelObjectId': view.items[k].id,
                        objectTypeId: objecttype._id,
                        'viewName': view.items[k].name,
                        meta: {webPropertyName: webProperty.items[j].name, webPropertyId: webProperty.items[j].id}
                    });

                }
            }

            if (accountError == false && totalAccountCall == account.items.length) {
                if (totalAccountCall == account.items.length && totalPropertyCall == totalProperties && propertyError == false) {
                    req.app.result = webPropertyViewIdList;
                    for(var key in webPropertyViewIdList){
                        Object.update({
                            profileId: profile._id,
                            channelObjectId: webPropertyViewIdList[key].channelObjectId
                        }, {
                            $setOnInsert: {created: created},
                            $set: {name: webPropertyViewIdList[key].viewName, objectTypeId: objecttype._id,meta: {webPropertyName: webPropertyViewIdList[key].meta.webPropertyName, webPropertyId: webPropertyViewIdList[key].meta.webPropertyId}, updated: updated}
                        }, {upsert: true}, function (err) {

                        })
                    }
                    next();
                }
                else if (propertyError == true) {
                    req.app.result = {status: 500, message: 'Error'};
                    next();
                }
            }
            /* else {
             req.app.result = {status: 500, message: 'Error'};
             next();
             }*/


        })
    }

    /**
     Function to get the user's all owned pages of facebook user
     @params 1.req contains the facebook user details i.e. username,token,email etc
     2.res have the query response
     @event pageList is used to send & receive the list of pages result
     */
    function selectFbObjectType(profile, channel) {


        //To select which object type
        switch (req.query.objectType) {
            case 'page':
                console.log('channel');
                var query = "/" + profile.userId + "/accounts";
                getFbPageList(profile, channel, query);
                break;
            case 'post':
                console.log('facebook');
                getFBPageList(profile, channel);
                break;
        }
    }

    function getFbPageList(profile, channel, query) {
        var channelObjectDetails = [];

        //To get the object type id from database
        Objecttype.findOne({
                'type': req.query.objectType,
                'channelId': profile.channelId
            }, function (err, res) {
                if (!err) {
                    Object.find({'profileId': profile._id}).sort({updated: -1}).exec(function (err, objectList) {
                        if (err)
                            req.app.result = {error: err, message: 'Database error'};
                        else {
                            //Set access token
                            FB.setAccessToken(profile.accessToken);
                            FB.api(
                                query,
                                function (pageList) {
                                    var length = pageList.data.length;
                                    req.app.result = pageList;
                                    for (var i = 0; i < length; i++) {
                                        var objectsResult = new Object();
                                        var profileId = profile._id;
                                        var objectTypeId = res._id;
                                        var channelObjectId = pageList.data[i].id;
                                        var name = pageList.data[i].name;
                                        var created = new Date();
                                        var updated = new Date();
                                        //To store once
                                        Object.update({
                                            profileId: profile._id,
                                            channelObjectId: pageList.data[i].id
                                        }, {
                                            $setOnInsert: {created: created},
                                            $set: {name: name, objectTypeId: objectTypeId, updated: updated}
                                        }, {upsert: true}, function (err) {
                                            if (!err) {
                                                Object.find({'profileId': profile._id}, function (err, objectList) {
                                                    channelObjectDetails.push({
                                                        'result': objectList
                                                    })
                                                    if (pageList.data.length == channelObjectDetails.length) {
                                                        req.app.result = objectList;
                                                        console.log('er');
                                                        next();
                                                    }
                                                })

                                            }
                                        })
                                    }
                                })
                        }
                    });
                }
            }
        );
    }


}

