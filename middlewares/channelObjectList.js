var channels = require('../models/channels');
var exports = module.exports = {};
var FB = require('fb');//Importing the fb module
var googleapis = require('googleapis');//To use google api's
var graph = require('fbgraph');//Importing the fbgraph module
var profile = require('../models/profiles');//To load up the user model
var metrics = require('../models/metrics');//To load the metrics model
var dataCollection = require('../models/data');//To load the data model
var objectCollection = require('../models/objects');//To load the data model
var objectTypeCollection = require('../models/objectTypes');//To load the data model
var userCollection = require('../models/user');
var OAuth2 = googleapis.auth.OAuth2;//Set OAuth
var configAuth = require('../config/auth');//Load the auth file
var oauth2Client = new OAuth2(configAuth.googleAuth.clientID, configAuth.googleAuth.clientSecret, configAuth.googleAuth.callbackURL);//set credentials in OAuth2
var analytics = googleapis.analytics({version: 'v3', auth: oauth2Client});// set auth as a global default

/**
 * middleware to get the account details based on user account

 */
exports.listAccounts = function (req, res, next) {

    //Array to hold web property list
    var accountWebpropertList = [];

    //Array to hold view list
    var webPropertyViewIdList = [];

    //array to hold google data
    req.app.webPropertyViewIdList = [];

    //Query to find channel
    profile.findOne({'_id': req.params.profileId}, {
        accessToken: 1,
        refreshToken: 1,
        channelId: 1,
        userId: 1
    }, function (err, profileInfo) {
        console.log('profile', profileInfo);
        if (err)
            req.app.result = {error: err, message: 'Database error'};
        else if (!profileInfo)
            req.app.result = {status: 302, message: 'No record found'};
        else {
            channels.findOne({'_id': profileInfo.channelId}, {code: 1}, function (err, channelDetails) {
                req.app.result = profileInfo;

                //To check the channel
                switch (channelDetails.code) {
                    case 'googleanalytics':
                        console.log('googleanalytics');
                        selectGAObjectType(profileInfo, channelDetails);
                        break;
                    case 'facebook':
                        console.log('facebook');
                        selectFbObjectType(profileInfo, channelDetails);
                        break;
                }
            })
        }
    })

    function selectGAObjectType(profileInfo, channelDetails) {
        console.log('page',req.query);

        //To select which object type
        switch (req.query.objectType) {
            case 'page':
                console.log('channel');
                getGAPageList(profileInfo, channelDetails);
                break;
            case 'post':
                console.log('google');
                getFBPageList(profileInfo, channelDetails);
                break;
        }
    }

    //function to get the list of ga pages
    function getGAPageList(profileInfo, channelDetails) {
        console.log('user details', profileInfo);
        oauth2Client.setCredentials({
            access_token: profileInfo.accessToken,
            refresh_token: profileInfo.refreshToken
        });
        getMetricResults(profileInfo, channelDetails, next);

    }

    //Function to referesh the access token
    function refreshingAccessToken(profileInfo) {
        oauth2Client.refreshAccessToken(function (err, tokens) {

            // your access_token is now refreshed and stored in oauth2Client
            // store these new tokens in a safe place (e.g. database)
            var userDetails = {};
            profileInfo.token = tokens.access_token;
            getMetricResults(profileInfo, next);
            profile.update({'email': profileInfo.email}, {$set: {"accessToken": tokens.access_token}}, {upsert: true}, function (err, updateResult) {
                if (err || !updateResult)console.log('failure');
                else console.log('Access token Update success');
            })
        });
    }

    //function to get the account list
    function getMetricResults(profileInfo, channelDetails, next) {
        length = 0;
        analytics.management.accounts.list({
            access_token: profileInfo.accessToken,
            auth: oauth2Client
        }, function (err, result) {
            if (!err) {
                for (var i = 0; i < result.items.length; i++) {

                    getWebProperty(i, result,profileInfo);
                }
            }
            else {
                console.log('else refresh token', profileInfo);
                refreshingAccessToken(profileInfo);
            }
        })

    }

    //function to get property list
    function getWebProperty(i, result,profileInfo) {
        analytics.management.webproperties.list({
            'accountId': result.items[i].id,
        }, function (err, response) {
            for (var j = 0; j < response.items.length; j++) {
                accountWebpropertList.push({'accountId': result.items[i].id, webPropertyId: response.items[j].id});
                if (!err) {
                    getWebPropertView(i, j, response, result,profileInfo, next);
                }
            }
        })
    }

    //function to get the views list
    function getWebPropertView(i, j, response, result,profileInfo, next) {
        analytics.management.profiles.list({
            'accountId': result.items[i].id,
            'webPropertyId': response.items[j].id
        }, function (err, getProperty) {
            for (var k = 0; k < getProperty.items.length; k++) {
                if (!err) {
                    req.app.viewSelected = false;
                    webPropertyViewIdList.push({
                        'accountId': result.items[i].id,
                        'webProperty': response.items[j].id,
                        'webPropertyName': response.items[j].name,
                        'viewId': getProperty.items[k].id,
                        'viewName': getProperty.items[k].name
                    });
                }
            }
            length = length + getProperty.items.length;
            if (result.items.length - 1 == i) {
                console.log('webPropertyViewIdList', webPropertyViewIdList, result.items.length - 1);
                var storeObjectLists = objectCollection();
                console.log('profile',profileInfo);



                req.app.result = webPropertyViewIdList;
                next();
            }
        })
    }

    /**
     Function to get the user's all owned pages of facebook user
     @params 1.req contains the facebook user details i.e. username,token,email etc
     2.res have the query response
     @event pageList is used to send & receive the list of pages result
     */
    function selectFbObjectType(profileInfo, channelDetails) {


        //To select which object type
        switch (req.query.objectType) {
            case 'page':
                console.log('channel');
                var query = "/" + profileInfo.userId + "/accounts";
                getFbPageList(profileInfo, channelDetails, query);
                break;
            case 'post':
                console.log('facebook');
                getFBPageList(profileInfo, channelDetails);
                break;
        }
    }

    function getFbPageList(profileInfo, channelDetails, query) {
        var channelObjectDetails = [];

        //To get the object type id from database
        objectTypeCollection.findOne({
                'type': req.query.objectType,
                'channelId': profileInfo.channelId
            }, function (err, res) {
                if (!err) {
                    objectCollection.find({'profileId': profileInfo._id}).sort({updated: -1}).exec(function (err, objectList) {
                        if (err)
                            req.app.result = {error: err, message: 'Database error'};
                        else {
                            //Set access token
                            FB.setAccessToken(profileInfo.accessToken);
                            FB.api(
                                query,
                                function (pageList) {
                                    var length = pageList.data.length;
                                    req.app.result = pageList;
                                    for (var i = 0; i < length; i++) {
                                        var objectsResult = new objectCollection();
                                        var profileId = profileInfo._id;
                                        var objectTypeId = res._id;
                                        var channelObjectId = pageList.data[i].id;
                                        var name = pageList.data[i].name;
                                        var created = new Date();
                                        var updated = new Date();
                                        //To store once
                                        objectCollection.update({
                                            profileId: profileInfo._id,
                                            channelObjectId: pageList.data[i].id
                                        }, {
                                            $setOnInsert: {created: created}, $set: {name: name, objectTypeId:objectTypeId,updated: updated}
                                        }, {upsert: true}, function (err) {
                                            if (!err) {
                                                objectCollection.find({'profileId': profileInfo._id}, function (err, objectList) {
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

