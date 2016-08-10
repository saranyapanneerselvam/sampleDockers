var async = require("async");
var Channel = require('../models/channels');
var exports = module.exports = {};
var request = require('request');
//Importing the fb module
var FB = require('fb');

//To use google api's
var googleapis = require('googleapis');

var getObjects = require('../helpers/utility');

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
var AdWords = require('../lib/googleads-node-lib');
var NodeAweber = require('aweber-api-nodejs');
var NA = new NodeAweber(configAuth.aweberAuth.clientID, configAuth.aweberAuth.clientSecret, 'http://localhost:8080/callback');

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
        if (err)
            return res.status(500).json({});

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
            name: 1,
            email: 1,
            canManageClients: 1,
            tokenSecret: 1,
            dataCenter: 1,
            customerId: 1
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
                getGAChannelObjects(results, callback);
                break;
            case configAuth.channels.facebook:
                selectFbObjectType(results.get_profile, channel);
                break;
            case configAuth.channels.facebookAds:
                selectFbadsObjectType(results, callback);
                break;
            case configAuth.channels.twitter:
                selectTweetObjectType(results.get_profile, channel);
                break;
            case configAuth.channels.googleAdwords:
                selectgoogleAdwords(results.get_profile, channel);
                break;
            case configAuth.channels.linkedIn:
                selectLinkedInPages(results.get_profile, channel);
                break;
            case configAuth.channels.mailChimp:
                selectMailchimpObject(results.get_profile, channel);
                break;
            case configAuth.channels.vimeo:
                getVimeoChannelList(results.get_profile, channel,callback);
                break;
            case configAuth.channels.aweber:
                selectaweberObject(results,callback );
                break;
            default:
                callback('Bad Channel Code', null);
        }
    }

    function getVimeoChannelList(profile,channel,callback) {
        var channelObjectDetails = [];

        //To get the object type id from database
        ObjectType.findOne({
            'type': req.query.objectType,
            'channelId': profile.channelId
        }, function (err, objecttype) {

            var channelObject=[];
            if (err) {
                return res.status(500).json({error: err});
            }
            else if (!objecttype)
                return res.status(204).json({error: 'No records found'});
            else {
                Object.find({'profileId': profile._id}).sort({updated: -1}).exec(function (err, objectList) {
                        if (err) {

                            return res.status(500).json({error: 'Internal server error'});
                        }
                        else {
                            //Set access token
                        if(req.query.objectType===configAuth.objectType.vimeochannel){
                            var query = "/users/" + profile.userId + "/channels?access_token=";
                        }
                            else{
                            var query = "/users/" +profile.userId + "/videos?access_token=";
                        }
                           var accessToken = profile.accessToken;
                            request(configAuth.vimeoAuth.common+
                                query+accessToken,
                                function (err, result, body) {
                                   // var vimeoObject=[];
                                    var parsedData = JSON.parse(body);
                                    var length =parsedData.data.length;
                                    console.log(parsedData.data)

                                   // req.app.result = parsedData.data;
                                    for (var i = 0; i < length; i++) {
                                        var objectItem = {
                                            profileId : profile._id,
                                            name : parsedData.data[i].name,
                                            objectTypeId :objecttype._id,
                                            channelObjectId : parsedData.data[i].uri.split("/")[2]
                                        };
                                        channelObject.push(objectItem);
                                    }

                                    callback(err, channelObject);

                                }
                            )
                        }
                    }
                );
            }

        })

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
            get_views: ['get_properties', getViews]
        }, function (err, results) {
            if (err)
                return callback(err, null);
            callback(null, results.get_views);
        });

        //To refresh the access token
        function refreshAccessToken(callback) {
            oauth2Client.refreshAccessToken(function (err, tokens) {
                if (err)
                    callback(err, tokens);
                else {
                    // your access_token is now refreshed and stored in oauth2Client; store these new tokens in a safe place (e.g. database)
                    var profile = initialResults.get_profile;
                    profile.token = tokens.access_token;
                    var updated = new Date();
                    Profile.update({
                        'email': profile.email,
                        'channelId': profile.channelId
                    }, {$set: {"accessToken": tokens.access_token, updated: updated}}, function (err, updateResult) {
                        if (err)
                            return res.status(500).json({error: 'Internal server error'})
                        else if (updateResult == 0)
                            return res.status(501).json({error: 'Not implemented'})
                        else callback(null, 'success');
                    })
                }
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
                'accountId': account.id
            }, function (err, response) {
                if (err)
                    return callback(err, null);
                for (var i = 0; i < response.items.length; i++)
                    response.items[i].account = account;
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
                        'objectTypeId': initialResults.get_objectType._id,
                        'viewName': views.items[i].name,
                        'meta': {webPropertyName: property.name, webPropertyId: property.id}
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

        var channel = results.get_channel;
        if (channel.code === configAuth.channels.vimeo) {
            var channelObjectDetails = [];
            console.log('object',results.get_channel_objects_remote);
            var objectArray = results.get_channel_objects_remote;
            for(var i in objectArray){
                var profileId = objectArray[i].profileId;
                var channelObjectId = objectArray[i].channelObjectId;
                var name = objectArray[i].name;
                var objectTypeId = objectArray[i].objectTypeId;
                var created = new Date();
                var updated = new Date();
                Object.update({
                    profileId: profileId,
                    channelObjectId: channelObjectId
                }, {
                    $setOnInsert: {created: created},
                    $set: {name: name, objectTypeId: objectTypeId, updated: updated}
                }, {upsert: true}, function (err, object) {
                    console.log(object)
                    if (err) {
                        console.log("first" + err)
                        return res.status(500).json({error: 'Internal server error'});
                    }
                    else if (object == 0)
                        return res.status(501).json({error: 'Not implemented'});
                    else {
                        Object.find({
                            'profileId': profileId,
                            'objectTypeId': objectTypeId
                        }, function (err, objectList) {
                            console.log(objectList)
                            if (err) {
                                console.log("second" + err)
                                return res.status(500).json({error: err});
                            }
                            else if (!objectList.length)
                                return res.status(204).json({error: 'No records found'});
                            else {
                                channelObjectDetails.push({
                                    'result': objectList
                                });
                                console.log("objectList", objectList);
                                req.app.result = objectList;
                                console.log('length',channelObjectDetails.length,objectArray.length)
                                if(channelObjectDetails.length==objectArray.length){
                                    // return callback( null,req.app.result );
                                    callback(null, 'success')
                                }

                            }
                        })
                    }
                })

            }

        }
        else {
            //get_channel_objects
            var views = results.get_channel_objects_remote;
            var bulk = Object.collection.initializeOrderedBulkOp();
            var now = new Date();

            //set the update parameters for query
            for (var i = 0; i < views.length; i++) {

                if (results.get_channel.code === configAuth.channels.facebookAds) {
                    //set the values
                    var update = {
                        $setOnInsert: {created: now},
                        $set: {
                            profileId: results.get_profile._id,
                            name: views[i].name,
                            objectTypeId: results.get_objectType._id,
                            updated: now
                        }
                    };
                    if (req.query.objectType === configAuth.objectType.facebookAdCampaign) {
                        //set query condition
                        var query = {
                            'meta.accountId': req.query.accountId,
                            channelObjectId: views[i].channelObjectId
                        };
                    }
                    else if (req.query.objectType === configAuth.objectType.facebookAdSet) {
                        //set query condition
                        var query = {
                            'meta.campaignId': req.query.campaignId,
                            channelObjectId: views[i].channelObjectId
                        };
                    }
                    else if (req.query.objectType === configAuth.objectType.facebookAds) {
                        //set query condition
                        var query = {
                            profileId: results.get_profile._id,
                            channelObjectId: views[i].channelObjectId
                        };
                    }
                    else {
                        //set query condition
                        var query = {
                            'meta.adSetId': req.query.adSetId,
                            channelObjectId: views[i].channelObjectId
                        };
                    }
                }
                else if (results.get_channel.code === configAuth.channels.googleAnalytics) {
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
                                'webPropertyName': views[i].meta.webPropertyName,
                                'webPropertyId': views[i].meta.webPropertyId
                            },
                            updated: now
                        }
                    };
                }
                else if (results.get_channel.code === configAuth.channels.aweber) {
                    if (results.get_objectType.type === 'aweberlists') {

                        for (var i = 0; i < views.length; i++) {

                            //set query condition
                            var query = {
                                profileId: results.get_profile._id,
                                channelObjectId: views[i].objectid
                            };

                            //set the values
                            var update = {
                                $setOnInsert: {created: now},
                                $set: {
                                    name: views[i].name,
                                    objectTypeId: results.get_objectType._id,
                                    updated: now
                                }
                            };

                            //form the query
                            bulk.find(query).upsert().update(update);

                        }
                    }
                    else {
                            var query = {
                                profileId: results.get_profile._id,
                                channelObjectId: views[i].campaignid,
                                // listId: views[i].unique_id,
                            };

                            //set the values
                            var update = {
                                $setOnInsert: {created: now},
                                $set: {
                                    name: views[i].subject,
                                    objectTypeId: results.get_objectType._id,
                                    meta: {
                                        'listId': views[i].unique_id,
                                        'campaignType': views[i].campaignType,
                                    },

                                    updated: now
                                }
                            };

                            //form the query
                            bulk.find(query).upsert().update(update);

                    }
                }


                //form the query
                bulk.find(query).upsert().update(update);
            }

            //Doing the bulk update
            bulk.execute(function (err) {
                callback(err, 'success');
            });
        }
    }

    //To get the objects from db
    function getChannelObjectsDB(results, callback) {
        req.params.profileID = req.params.profileId;
        getObjects.findObjectsForProfile(req, res, function (err, object) {
            if (err)
                callback(err, null);
            else {
                req.app.objects = object;
                callback(null, object);
            }
        });
    }

    function getFbAdAccountList(results, query, callback) {
        FB.setAccessToken(results.get_profile.accessToken);
        FB.api(query,
            function (adAccount) {
                var adsLength = adAccount.data.length;
                var adAccountList = [];
                for (var i = 0; i < adsLength; i++) {
                    adAccountList.push({
                        objectTypeId: results.get_objectType._id, profileId: results.get_profile._id,
                        channelObjectId: adAccount.data[i].id, name: adAccount.data[i].name
                    })
                }
                callback(null, adAccountList)
            }
        );
    }

    function getFbAdObjectList(results, query, callback) {
        FB.setAccessToken(results.get_profile.accessToken);
        var objectList = [];
        getObjectList(query);
        function getObjectList(query) {
            FB.api(query,
                function (objects) {
                    if (objects.error) {
                        if (objects.error.code === 190)
                            return res.status(401).json({
                                error: 'Authentication required to perform this action',
                                id: req.params.widgetId
                            })
                        else if (objects.error.code === 4)
                            return res.status(4).json({error: 'Forbidden Error', id: req.params.widgetId})
                        else
                            return res.status(500).json({error: 'Internal server error', id: req.params.widgetId})

                    }
                    else {
                        if (objects.data.length != 0) {
                            if (objects.paging && objects.paging.next) {
                                var objectLength = objects.data.length;
                                for (var key=0;key<objectLength;key++){
                                    objectList.push({
                                        objectTypeId: results.get_objectType._id, profileId: results.get_profile._id,
                                        channelObjectId: objects.data[key].id, name: objects.data[key].name
                                    });
                                }
                                var nextPage = objects.paging.next;
                                var str = nextPage;
                                var recallApi = str.replace("https://graph.facebook.com/", " ").trim();
                                getObjectList(recallApi);
                            }
                            else {
                                var objectLength = objects.data.length;
                                for (var key=0;key<objectLength;key++){
                                    objectList.push({
                                        objectTypeId: results.get_objectType._id,
                                        channelObjectId: objects.data[key].id, name: objects.data[key].name
                                    });
                                }
                                callback(null, objectList)
                            }
                        }
                    }
                });
        }
    }

    // This function to get adaccounts who login user
    function selectFbadsObjectType(results, callback) {
        //To select which object type
        switch (req.query.objectType) {
            case configAuth.objectType.facebookAds:
                var query = configAuth.apiVersions.FBADs + "/" + results.get_profile.userId + "/adaccounts?fields=name";
                getFbAdObjectList(results, query, callback);
                break;
            case configAuth.objectType.facebookAdCampaign:
                var query = configAuth.apiVersions.FBADs + "/" + req.query.accountId + "/campaigns?fields=name&limit=100";
                getFbAdObjectList(results, query, callback);
                break;
            case configAuth.objectType.facebookAdSet:
                var query = configAuth.apiVersions.FBADs + "/" + req.query.campaignId + "/adsets?fields=name&limit=100";
                getFbAdObjectList(results, query, callback);
                break;
            case configAuth.objectType.facebookAdSetAds:
                var query = configAuth.apiVersions.FBADs + "/" + req.query.adSetId + "/ads?fields=name&limit=100";
                getFbAdObjectList(results, query, callback);
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
        }, function (err, objecttype) {
            if (err)
                return res.status(500).json({error: err});
            else if (!objecttype)
                return res.status(204).json({error: 'No records found'});
            else {
                Object.find({'profileId': profile._id}).sort({updated: -1}).exec(function (err, objectList) {
                        if (err)
                            return res.status(500).json({error: 'Internal server error'})
                        else {
                            //Set access token
                            FB.setAccessToken(profile.accessToken);
                            FB.api(
                                query,
                                function (pageList) {
                                    var length = pageList.data.length;
                                    req.app.result = pageList.data;
                                    for (var i = 0; i < length; i++) {
                                        var objectsResult = new Object();
                                        var profileId = profile._id;
                                        var objectTypeId = objecttype._id;
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
                                        }, {upsert: true}, function (err, object) {
                                            if (err)
                                                return res.status(500).json({error: 'Internal server error'});
                                            else if (object == 0)
                                                return res.status(501).json({error: 'Not implemented'});
                                            else {
                                                Object.find({'profileId': profile._id}, function (err, objectList) {
                                                    if (err)
                                                        return res.status(500).json({error: err});
                                                    else if (!objectList.length)
                                                        return res.status(204).json({error: 'No records found'});
                                                    else {
                                                        channelObjectDetails.push({
                                                            'result': objectList
                                                        });
                                                        if (pageList.data.length == channelObjectDetails.length) {
                                                            req.app.result = objectList;
                                                            next();
                                                        }
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
    function getTweet(profile, channel) {
        var channelObjectDetails = [];
        ObjectType.findOne({
            'type': req.query.objectType,
            'channelId': profile.channelId
        }, function (err, res) {
            channelObjectDetails.push({
                'result': objectList
            });
            if (pageList.data.length == channelObjectDetails.length) {
                req.app.result = objectList;
                next();
            }
            else {
                var objectsResult = new Object();
                var profileId = profile._id;
                var objectTypeId = res._id;
                var created = new Date();
                var updated = new Date();

                //To store once
                Object.update({
                    profileId: profile._id
                }, {
                    $setOnInsert: {created: created}, $set: {objectTypeId: objectTypeId, updated: updated}
                }, {upsert: true}, function (err, res) {
                    if (err)
                        return res.status(500).json({error: 'Internal server error'})
                    else if (res == 0)
                        return res.status(501).json({error: 'Not implemented'})
                    else {
                        Object.find({'profileId': profile._id}, function (err, objectList) {
                            if (err)
                                return res.status(500).json({error: 'Internal server error'})
                            else if (objectList == 0)
                                return res.status(501).json({error: 'Not implemented'})
                            else {
                                channelObjectDetails.push({
                                    'result': objectList
                                })
                                if (objectList) {
                                    req.app.result = objectList;
                                    next();
                                }
                            }
                        })
                    }
                })
            }
        });
    }


    function selectTweetObjectType(profile, channel) {

        //To select which object type
        switch (req.query.objectType) {
            case configAuth.objectType.twitter:
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
    function getAdwordsCustomerId(results, callback) {

        //To get the object type id from database
        ObjectType.findOne({
            'type': req.query.objectType,
            'channelId': results.channelId
        }, function (err, objectTypeId) {
            if (err)
                return res.status(500).json({error: err});
            else if (!objectTypeId)
                return res.status(204).json({error: 'No records found'});
            else {
                if (results.canManageClients === true) {
                    var service = new AdWords.ManagedCustomerService({
                        ADWORDS_CLIENT_ID: configAuth.googleAdwordsAuth.clientID,
                        ADWORDS_CLIENT_CUSTOMER_ID: results.customerId,
                        ADWORDS_DEVELOPER_TOKEN: configAuth.googleAdwordsAuth.developerToken,
                        ADWORDS_REFRESH_TOKEN: results.refreshToken,
                        ADWORDS_SECRET: configAuth.googleAdwordsAuth.clientSecret,
                        ADWORDS_USER_AGENT: configAuth.googleAdwordsAuth.userAgent
                    });
                    var clientCustomerId = results.customerId;
                    var selector = new AdWords.Selector.model({
                        fields: service.selectable,
                        ordering: [{field: 'Name', sortOrder: 'ASCENDING'}],
                        paging: {startIndex: 0, numberResults: 100},
                        predicates: []
                    });
                    service.get(clientCustomerId, selector, function (err, response) {
                        if (err)
                            return res.status(401).json({error: 'Authentication required to perform this action'});
                        else {
                            queryExec(objectTypeId, results, callback, response);
                        }
                    });
                }
            }
        });
    }

    function queryExec(objectTypeId, results, callback, response) {
        var model = response.entries.models;
        var lengthOfModel = 0;
        for (var i = 0; i < model.length; i++) {
            if (model[i].attributes.canManageClients != true)
                lengthOfModel++;
        }
        for (var i = 0; i < model.length; i++) {
            var modelResult = model[i].attributes.canManageClients;
            if (modelResult) {
                var accountName = model[i].attributes.name;
                var customerId = model[i].attributes.customerId;
                var channelObjectDetails = [];
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
                    if (err)
                        return res.status(500).json({error: err});
                    else if (!res)
                        return res.status(204).json({error: 'No records found'});
                    else {
                        Object.find({'profileId': results._id}, function (err, objectList) {
                            channelObjectDetails.push({
                                'result': objectList
                            });
                            if (lengthOfModel == channelObjectDetails.length) {
                                req.app.result = objectList;
                                next();
                            }
                        })
                    }
                });
            }
            else next(null, 'success');
        }
    }

    function selectLinkedInPages(results, callback) {
        switch (req.query.objectType) {
            case configAuth.objectType.linkedIn:
                getLinkedInPages(results, callback);
                break;
        }
    }

    function getLinkedInPages(results, callback) {
        var channelObjectDetails = [];
        //To get the object type id from database
        ObjectType.findOne({
            'type': req.query.objectType,
            'channelId': results.channelId
        }, function (err, objectTypeId) {
            if (!err) {
                var objectsType = objectTypeId;
                var parseObject;
                var query = 'https://api.linkedin.com/v1/companies?oauth2_access_token=' + results.accessToken + '&format=json&is-company-admin=true';
                request(query,
                    function (err, response, body) {
                        if (err)
                            return res.status(500).json({error: 'Internal server error'});
                        else {
                            parseObject = JSON.parse(body);
                            if (parseObject._total != 0) {
                                for (var i in parseObject.values) {
                                    var objectsResult = new Object();
                                    var profileId = results._id;
                                    var objectTypeId = objectsType._id;
                                    var channelObjectId = parseObject.values[i].id;
                                    var name = parseObject.values[i].name;
                                    var created = new Date();
                                    var updated = new Date();
                                    //To store once
                                    Object.update({
                                        profileId: results._id,
                                        channelObjectId: parseObject.values[i].id
                                    }, {
                                        $setOnInsert: {created: created},
                                        $set: {name: name, objectTypeId: objectTypeId, updated: updated}
                                    }, {upsert: true}, function (err, object) {
                                        if (err)
                                            return res.status(500).json({error: 'Internal server error'})
                                        else if (object == 0)
                                            return res.status(501).json({error: 'Not implemented'})
                                        else {
                                            Object.find({'profileId': results._id}, function (err, objectList) {
                                                if (err)
                                                    return res.status(500).json({error: err});
                                                else if (!objectList.length)
                                                    return res.status(204).json({error: 'No records found'});
                                                else {
                                                    channelObjectDetails.push({
                                                        'result': objectList
                                                    });
                                                    if (parseObject.values.length == channelObjectDetails.length) {
                                                        req.app.result = objectList;
                                                        next();
                                                    }
                                                }
                                            })
                                        }
                                    })


                                }
                            }
                            else {
                                req.app.result = [];
                                next();
                            }
                        }

                    })
            }
            else {
                return res.status(500).json({error: 'Internal server error'})
            }
        });
    }

    function selectMailchimpObject(results, callback) {
        ObjectType.findOne({
            'type': req.query.objectType,
            'channelId': results.channelId
        }, function (err, objectTypeId) {
            if (err)
                return res.status(500).json({error: err});
            else if (!objectTypeId)
                return res.status(204).json({error: 'No records found'});
            else {
                if (objectTypeId.type === configAuth.objectType.mailChimpList) {
                    var query = 'https://' + results.dataCenter + '.api.mailchimp.com/3.0/lists?count=100&fields=lists.name,lists.id,lists.stats,lists.date_created';
                    getObjectLists(query, results, callback);
                }
                else {
                    var query = 'https://' + results.dataCenter + '.api.mailchimp.com/3.0/campaigns?count=100&fields=campaigns.id,campaigns.settings,campaigns.create_time';
                    getObjectLists(query, results, callback);
                }
                function getObjectLists(query) {
                    var objectsName = objectTypeId.type;
                    var objectIds = objectTypeId._id;
                    var channelObjectDetails = [];
                    request({
                        uri: query,
                        headers: {
                            'User-Agent': 'node-mailchimp/1.2.0',
                            'Authorization': 'OAuth ' + results.accessToken
                        }
                    }, function (err, response, body) {
                        var parsedResponse;
                        if (response.statusCode != 200)
                            return res.status(500).json({error: err});
                        else {
                            var objectStoreDetails = JSON.parse(body);
                            if (objectStoreDetails[objectsName].length === 0) {
                                req.app.result = objectStoreDetails[objectsName];
                                next();
                            }
                            else {
                                for (var i in objectStoreDetails[objectsName]) {
                                    var profileId = results._id;
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
                                        profileId: results._id,
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
                                            Object.find({
                                                'profileId': results._id,
                                                'objectTypeId': objectTypeId
                                            }, function (err, objectList) {
                                                channelObjectDetails.push({
                                                    'result': objectList
                                                });
                                                if (objectStoreDetails[objectsName].length == channelObjectDetails.length) {
                                                    req.app.result = objectList;
                                                    next();
                                                }
                                            })
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

    function selectaweberObject(results, callback) {

        if (req.query.objectType === configAuth.objectType.aweberList) {
            getaweber(results, callback);

        }
        else
            getaweber(results, callback);

    }

    function getaweber(results, callback) {

        if (results.get_objectType.type === configAuth.objectType.aweberList) {
            var listUrl = 'accounts/' + results.get_profile.userId + '/lists';
            getaweberObjectLists(listUrl, results.get_profile, results, callback);
        }
        else {
            var listUrl = 'accounts/' + results.get_profile.userId + '/lists';
            getaweberObjectLists(listUrl, results.get_profile, results, callback);
        }

        function getaweberObjectLists(query, get_profile, results, callback) {

            var channelObjectDetails = [];
            var token = get_profile.accessToken;
            var tokenSecret = get_profile.tokenSecret;


            var apiClient = NA.api(token, tokenSecret);
            apiClient.request('get', listUrl, {}, function (err, response) {

                if (err)
                    return res.status(500).json({error: "internal server Error"});

                else {
                    if (results.get_objectType.type === 'aweberlists') {

                        for (var i = 0; i < response.entries.length; i++) {
                            channelObjectDetails.push({
                                'name': response.entries[i].name,
                                'objectid': response.entries[i].id

                            });
                        }

                        callback(null, channelObjectDetails);
                    }

                    else if (results.get_objectType.type === 'awebercampaigns') {
                        var count = 0;
                        var campaignObjectDetails = [];

                        for (var i = 0; i < response.total_size; i++) {
                            var size = response.total_size;
                            var listUrl = 'accounts/' + results.get_profile.userId + '/lists/' + response.entries[i].id + '/campaigns';
                            var campaigns = call(listUrl, response.entries[i].id);

                            function call(listUrl, listId) {
                                apiClient.request('get', listUrl, {}, function (err, res) {
                                    count++
                                    for (var j = 0; j < res.entries.length; j++) {
                                        campaignObjectDetails.push({
                                            'subject': res.entries[j].subject,
                                            'campaignid': res.entries[j].id,
                                            'unique_id': listId,
                                            'campaignType': res.entries[j].campaign_type

                                        });
                                    }
                                    if (count == size) {
                                        callback(null, campaignObjectDetails);
                                    }
                                });
                            }
                        }
                    }
                }
            });

        }

    }

};