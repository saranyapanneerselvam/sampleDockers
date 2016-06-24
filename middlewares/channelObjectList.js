var async = require("async");
var Channel = require('../models/channels');
var exports = module.exports = {};

//Importing the fb module
var FB = require('fb');

//To use google api's
var googleapis = require('googleapis');

//To load up the user model
var Profile = require('../models/profiles');

//To load the data model
var Object = require('../models/objects');

//To load the data model
var ObjectType = require('../models/objectTypes');

//Set OAuth
var OAuth2 = googleapis.auth.OAuth2;

//Load the auth file
var configAuth = require('../config/auth');

//set credentials in OAuth2
var oauth2Client = new OAuth2(configAuth.googleAuth.clientID, configAuth.googleAuth.clientSecret, configAuth.googleAuth.callbackURL);

//set credentials in OAuth2
var oauth2AdsClient = new OAuth2(configAuth.googleAdwordsAuth.clientID, configAuth.googleAdwordsAuth.clientSecret, configAuth.googleAdwordsAuth.callbackURL);

//set googleadword node library
var AdWords = require('googleads-node-lib');

// set auth as a global default
var analytics = googleapis.analytics({version: 'v3', auth: oauth2Client});


exports.listAccounts = function (req, res, next) {

    //Using async's auto method for handling asynchronous functions
    async.auto({
        get_objectType: getObjectType,
        get_profile: getProfile,
        get_channel: ['get_objectType', 'get_profile', getChannel],
        get_channel_objects_remote: ['get_channel', getChannelObjectsRemote],
        store_channel_objects: ['get_channel_objects_remote', storeChannelObjects],
        get_channel_objects_db: ['store_channel_objects', getChannelObjectsDB]
    }, function (err, results) {
        console.log('err = ', err);
        console.log('results = ', results);
        if (err) {
            return res.status(500).json({});
        }

        //Final result will be set here
        req.app.result = results.get_channel_objects_db;
        next();
    });

    //Handling the database callback
    function checkNullObject(callback) {
        return function (err, object) {
            if (err)
                callback('Database error: ' + err, null);
            else if (!object)
                callback('No record found', null);
            else
                callback(null, object);
        }
    }

    //To get the object type details from db
    function getObjectType(callback) {
        ObjectType.findOne({type: req.query.objectType}, checkNullObject(callback));
    }

    //To get the profile details from db
    function getProfile(callback) {
        Profile.findOne({'_id': req.params.profileId}, {
            accessToken: 1,
            refreshToken: 1,
            channelId: 1,
            userId: 1,
            name:1,
            email: 1
        }, checkNullObject(callback));
    }

    //To get the channel details from db
    function getChannel(results, callback) {
        Channel.findOne({'_id': results.get_profile.channelId}, {code: 1}, checkNullObject(callback));
    }

    //To select the channel type
    function getChannelObjectsRemote(results, callback) {
        var channel = results.get_channel;
        switch (channel.code) {
            case configAuth.channels.googleAnalytics:
                console.log('googleanalytics');
                getGAChannelObjects(results, callback);
                break;
            case configAuth.channels.facebook:
                console.log('facebook');
                selectFbObjectType(results.get_profile, channel);
                break;
            case configAuth.channels.facebookAds:
                console.log('facebookAds');
                selectFbadsObjectType(results.get_profile, channel);
                break;
            case configAuth.channels.twitter:
                console.log('tweeter');
                selectTweetObjectType(results.get_profile, channel);
                break;
            case configAuth.channels.googleAdwords:
                selectgoogleAdwords(results.get_profile, channel);
                break;
            default:
                callback('Bad Channel Code', null);
        }

    }

    //Call the function based on object type
    function getGAChannelObjects(results, callback) {
        initializeGa(results);
        switch (req.query.objectType) {
            case configAuth.objectType.googleView:
                getAccountsPropsAndViews(results, callback);
                break;
        }
    }

    //To get analytic accounts,properties & views
    function getAccountsPropsAndViews(initialResults, callback) {
        async.auto({
            refresh_token: refreshAccessToken,
            get_accounts: ['refresh_token', getAccounts],
            get_properties: ['get_accounts', getPropertiesForAllAccounts],
            get_views: ['get_properties', getViews],
        }, function (err, results) {
            console.log('err = ', err);
            console.log('results = ', results);
            if (err) {
                return callback(err, null);
            }
            callback(null, results.get_views);
        });

        //To refresh the access token
        function refreshAccessToken(callback) {
            console.log('refreshAccessToken');

            oauth2Client.refreshAccessToken(function (err, tokens) {
                callback(err, tokens);

                if (err) {
                    return;
                }

                // your access_token is now refreshed and stored in oauth2Client
                // store these new tokens in a safe place (e.g. database)

                var profile = initialResults.get_profile;
                profile.token = tokens.access_token;
                var updated = new Date();

                Profile.update({
                    'email': profile.email,
                    channelId: profile.channelId
                }, {$set: {"accessToken": tokens.access_token, updated: updated}}, function (err, updateResult) {
                    if (err || !updateResult) {

                        console.log('failure');
                    }
                    else console.log('Access token Update success');
                })
            });
        }

        //To get the account list of a user
        function getAccounts(results, callback) {
            analytics.management.accounts.list({
                access_token: initialResults.get_profile.accessToken,
                auth: oauth2Client
            }, function (err, response) {
                if (err)
                    return callback(err, '');
                callback(null, response.items);

            });
        }

        //To get the web properties
        function getPropertiesForAllAccounts(results, callback) {

            /**
             * Applies each account in getPropertiesForOneAccount function
             @param results.get_accounts - array to iterate over
             @param getPropertiesForOneAccount -function to apply to each item in results.get_accounts
             @param callback - second param is passed then it will be called
             */
            async.concat(results.get_accounts, getPropertiesForOneAccount, callback);
        }

        //To get the properties for an account one by one
        function getPropertiesForOneAccount(account, callback) {
            analytics.management.webproperties.list({
                'accountId': account.id,
            }, function (err, response) {
                if (err)
                    return callback(err, null);
                for (var i = 0; i < response.items.length; i++) {
                    response.items[i].account = account;
                }
                callback(null, response.items);
            });
        }

        //To get views
        function getViews(results, callback) {
            async.concat(results.get_properties, getViewsForOneProperty, callback);
        }

        //To get the views one by one
        function getViewsForOneProperty(property, callback) {
            analytics.management.profiles.list({
                'accountId': property.account.id,
                'webPropertyId': property.id
            }, function (err, views) {
                if (err)
                    return callback(err, null);
                var dbViews = [];
                for (var i = 0; i < views.items.length; i++) {
                    dbViews.push({
                        'channelObjectId': views.items[i].id,
                        objectTypeId: initialResults.get_objectType._id,
                        'viewName': views.items[i].name,
                        meta: {webPropertyName: property.name, webPropertyId: property.id}
                    });
                }
                callback(null, dbViews);
            });
        }


    }

    //Set tokens
    function initializeGa(results) {
        oauth2Client.setCredentials({
            access_token: results.get_profile.accessToken,
            refresh_token: results.get_profile.refreshToken
        });
    }

    //To store the channel objects in db
    function storeChannelObjects(results, callback) {
        //get_channel_objects
        var views = results.get_channel_objects_remote;
        var bulk = Object.collection.initializeOrderedBulkOp();
        var now = new Date();

        //set the update parameters for query
        for (var i = 0; i < views.length; i++) {

            //set query condition
            var query = {
                profileId: results.get_profile._id,
                channelObjectId: views[i].channelObjectId
            };

            //set the values
            var update = {
                $setOnInsert: {created: now},
                $set: {
                    name: views[i].viewName,
                    objectTypeId: results.get_objectType._id,
                    meta: {
                        webPropertyName: views[i].meta.webPropertyName,
                        webPropertyId: views[i].meta.webPropertyId
                    },
                    updated: now
                }
            };

            //form the query
            bulk.find(query).upsert().update(update);
        }

        //Doing the bulk update
        bulk.execute(function (err) {
            callback(err, 'success');
        });
    }

    //To get the objects from db
    function getChannelObjectsDB(results, callback) {
        console.log('getChannelObjectsDB');
        var query = {
            profileId: results.get_profile._id,
            objectTypeId: results.get_objectType._id
        };
        Object.find(query, callback);
    }

    function getFbAdAccountList(profile, channel, query) {
        var channelObjectDetails = [];
        //To get the object type id from database
        ObjectType.findOne({
            'type': req.query.objectType,
            'channelId': profile.channelId
        }, function (err, res) {
            if (!err) {
                FB.setAccessToken(profile.accessToken);
                FB.api(query,
                    function (adAccount) {
                        console.log(adAccount);
                        var adslength = adAccount.data.length;
                        console.log(adslength);
                        req.app.result = adAccount;
                        for (var i = 0; i < adslength; i++) {
                            var objectsResult = new Object();
                            var profileId = profile._id;
                            var objectTypeId = res._id;
                            var channelObjectId = adAccount.data[i].id;
                            var name = adAccount.data[i].name;
                            var created = new Date();
                            var updated = new Date();
                            console.log('profileInfo._id', profile._id)
                            console.log('channelObjectId', channelObjectId)
                            //To store once
                            Object.update({
                                profileId: profile._id,
                                channelObjectId: adAccount.data[i].id
                            }, {
                                $setOnInsert: {created: created},
                                $set: {name: name, objectTypeId: objectTypeId, updated: updated}
                            }, {upsert: true}, function (err, res) {
                                console.log(err)
                                console.log(res);
                                if (!err) {
                                    Object.find({'profileId': profile._id}, function (err, objectList) {
                                        channelObjectDetails.push({
                                            'result': objectList
                                        })
                                        if (adAccount.data.length == channelObjectDetails.length) {
                                            req.app.result = objectList;
                                            console.log('er');
                                            next();
                                        }
                                    })
                                }
                            })
                        }
                    }
                );
            }
        })
    }

    // This function to get adaccounts who login user
    function selectFbadsObjectType(profile, channel) {
        console.log('insight fbadaccount', req.query.objectType);
        //To select which object type
        switch (req.query.objectType) {
            case configAuth.objectType.facebookAds:
                console.log('fbadaccount');
                var query = "v2.6/" + profile.userId + "/adaccounts?fields=name";
                getFbAdAccountList(profile, channel, query);
                break;
        }
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
            case configAuth.objectType.facebookPage:
                var query = "/" + profile.userId + "/accounts";
                getFbPageList(profile, channel, query);
                break;

        }
    }

    function getFbPageList(profile, channel, query) {
        var channelObjectDetails = [];

        //To get the object type id from database
        ObjectType.findOne({
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
                                                    });
                                                    if (pageList.data.length == channelObjectDetails.length) {
                                                        req.app.result = objectList;
                                                        console.log('er');
                                                        next();
                                                    }
                                                })
                                            }
                                        })
                                    }
                                }
                            )
                        }
                    }
                );
            }
        })
    }



    //This function to create the Object
    function getTweet(profile , channel){
        var channelObjectDetails = [];
        ObjectType.findOne({
            'type': req.query.objectType,
            'channelId': profile.channelId
        },function(err, res){
            console.log(res);
            console.log(res._id);
            var objectsResult = new Object();
            var profileId = profile._id;
            var objectTypeId = res._id;
            var created = new Date();
            var updated = new Date();
            console.log ('profileInfo._id',profile._id);
            console.log ('objectTypeId',objectTypeId);
            //To store once
            Object.update({
                profileId: profile._id
            },{
                $setOnInsert: {created: created}, $set: { objectTypeId:objectTypeId,updated: updated}
            },{upsert: true}, function (err, res) {
                console.log(err)
                console.log(res);
                if (!err) {
                    Object.find({'profileId': profile._id}, function (err, objectList) {
                        channelObjectDetails.push({
                            'result': objectList
                        })
                        if (objectList) {
                            req.app.result = objectList;
                            console.log('twitter',objectList);
                            next();
                        }
                    })
                }
    
            })
        });
    }


    function selectTweetObjectType(profile , channel){
        //console.log('insight fbadaccount',req.query.objectType);
        //To select which object type
        switch (req.query.objectType) {
            case configAuth.objectType.twitter:
                console.log('fbadaccount');
                getTweet(profile, channel);
                break;
        }
    }

    function selectgoogleAdwords(results, callback) {
        switch (req.query.objectType) {
            case configAuth.objectType.googleAdword:
                getAdwordsCustomerId(results, callback);
                break;
        }
    }

    //Get clientCustomerId from managerservices

    function getAdwordsCustomerId(results, callback){
        //To get the object type id from database
        ObjectType.findOne({
            'type': req.query.objectType,
            'channelId': results.channelId
        }, function (err, objectTypeId) {
            if (!err) {
                var service = new AdWords.ManagedCustomerService({
                    ADWORDS_CLIENT_ID: configAuth.googleAdwordsAuth.clientID,
                    ADWORDS_CLIENT_CUSTOMER_ID: configAuth.googleAdwordsAuth.managerClientId,
                    ADWORDS_DEVELOPER_TOKEN: configAuth.googleAdwordsAuth.developerToken,
                    ADWORDS_REFRESH_TOKEN: results.refreshToken,
                    ADWORDS_SECRET: configAuth.googleAdwordsAuth.clientSecret,
                    ADWORDS_USER_AGENT: configAuth.googleAdwordsAuth.userAgent
                });
                var clientCustomerId = configAuth.googleAdwordsAuth.managerClientId;
                var selector = new AdWords.Selector.model({
                    fields: service.selectable,
                    ordering: [{field: 'Name', sortOrder: 'ASCENDING'}],
                    paging: {startIndex: 0, numberResults: 100},
                    predicates: []
                });

                service.get(clientCustomerId, selector, function(err, response) {
                    if (err)
                        console.log(err);
                    else {
                        queryExec(objectTypeId,results,callback,response);
                    }
                });
            }
        });
    }
    function  queryExec(objectTypeId,results,callback,response){
        var model = response.entries.models;
        var lengthOfModel = 0;
        for(var i=0;i<model.length;i++){
            if(model[i].attributes.canManageClients != true)
                lengthOfModel++;
        }
        for (var i = 0; i < model.length; i++) {
            var modelResult = model[i].attributes.canManageClients;
            if (modelResult !== true) {
                var accountName = model[i].attributes.name;
                var customerId = model[i].attributes.customerId;
                var channelObjectDetails =[];
                var objectsResult = new Object();
                var profileId = results._id;
                var channelObjectId = customerId;
                var name = accountName;
                var created = new Date();
                var updated = new Date();
                //To store once
                Object.update({
                    profileId: results._id,
                    channelObjectId: customerId
                }, {
                    $setOnInsert: {created: created},
                    $set: {name: name, objectTypeId: objectTypeId._id, updated: updated}
                }, {upsert: true}, function (err, res) {
                    if (!err) {
                        Object.find({'profileId': results._id}, function (err, objectList) {
                            channelObjectDetails.push({
                                'result': objectList
                            });
                            if (lengthOfModel == channelObjectDetails.length) {
                                req.app.result = objectList;
                                console.log('Adwords',objectList);
                                next();
                            }
                        })
                    }
                });
            }
        }

    }
};

