var channels = require('../models/channels');
var exports = module.exports = {};

//To use google api's
var googleapis = require('googleapis');

//Importing the fbgraph module
var graph = require('fbgraph');

//To load up the user model
var profile = require('../models/profiles');

//To load the metrics model
var Metric = require('../models/metrics');

//To load the data model
var Data = require('../models/data');

//To load the data model
var Object = require('../models/objects');

//To load the data model
var Objecttype = require('../models/objectTypes');

//Set OAuth
var OAuth2 = googleapis.auth.OAuth2;

//Load the auth file
var configAuth = require('../config/auth');

//set credentials in OAuth2
var oauth2Client = new OAuth2(configAuth.googleAuth.clientID, configAuth.googleAuth.clientSecret, configAuth.googleAuth.callbackURL);

// set auth as a global default
var analytics = googleapis.analytics({version: 'v3', auth: oauth2Client});
var Widget = require('../models/widgets');


/**
 * middleware to to get the google analytic data based on profile,metric,view,dates
 * @param req req from controller
 * @param res
 * @param next callback to send response back to controller
 */
exports.getChannelData = function (req, res, next) {

    //Query to find objectId,metricId
    Widget.findOne({'_id': req.params.widgetId}, {metrics: 1}, function (err, widget) {
        if (err)
            req.app.result = {error: err, message: 'Database error'};
        else if (!widget)
            req.app.result = {status: 302, message: 'No record found'};
        else {

            //Query to find the profile id
            Object.findOne({'_id': widget.metrics[0].objectId}, {
                profileId: 1,
                channelObjectId: 1,
                objectTypeId: 1
            }, function (err, object) {
                if (err)
                    req.app.result = {error: err, message: 'Database error'};
                else if (!object)
                    req.app.result = {status: 302, message: 'No record found'};
                else {

                    //Query to find channel
                    profile.findOne({'_id': object.profileId}, {
                        accessToken: 1,
                        refreshToken: 1,
                        channelId: 1,
                        userId: 1,
                        name : 1,
                        email: 1
                    }, function (err, profile) {
                        if (err)
                            req.app.result = {error: err, message: 'Database error'};
                        else if (!profile)
                            req.app.result = {status: 302, message: 'No record found'};
                        else {

                            //To find the channel
                            channels.findOne({'_id': profile.channelId}, {code: 1}, function (err, channelDetails) {
                                req.app.result = profile;

                                //To check the channel
                                switch (channelDetails.code) {
                                    case configAuth.channels.googleAnalytics:
                                        initializeGa(profile, channelDetails, widget, object);
                                        break;
                                    case configAuth.channels.facebook:
                                        selectFBObjectType(profile, channelDetails, widget, object);
                                        break;
                                    case configAuth.channels.facebookAds:
                                        selectFBadsObjectType(profile, channelDetails, widget, object);
                                        break;
                                    case configAuth.channels.twitter:
                                        selectTweetObjectType(profile, channelDetails, widget, object);
                                        break;
                                }
                            })
                        }
                    })
                }
            })
        }
    });

    //Redirect to specific function based on object type
    function selectFBObjectType(profile, channelDetails, widget, object) {

        //select object type
        Objecttype.findOne({'_id': object.objectTypeId}, {type: 1}, function (err, objectType) {
            if (err)
                req.app.result = {error: err, message: 'Database error'};
            else if (!profile)
                req.app.result = {status: 302, message: 'No record found'};
            else {

                //To select which object type
                switch (objectType.type) {
                    case configAuth.objectType.facebookPage:
                        var pageId = object.channelObjectId;
                        getFBPageData(profile, widget, object, pageId);
                        break;
                    case configAuth.objectType.facebookPost:
                        getFBPageList(profile, channelDetails);
                        break;
                }
            }
        })


    }
    //Redirect to specific function based on object type
    function selectFBadsObjectType(profile, channelDetails, widget, object) {

        //select object type
        Objecttype.findOne({'_id': object.objectTypeId}, function (err, objectType) {
            if (err)
                req.app.result = {error: err, message: 'Database error'};
            else if (!profile)
                req.app.result = {status: 302, message: 'No record found'};
            else {

                //To select which object type
                switch (objectType.type) {
                    case configAuth.objectType.facebookAds:
                        var adAccountId = object.channelObjectId;
                        getFBadsinsightsData(profile, widget, object, adAccountId);
                        break;

                }
            }
        })


    }
    //To get FacebookAds Insights Data
    function getFBadsinsightsData(profile, widget, object, adAccountId){
         //To Get the Metrice Type throught widget
        //and get metricid and object id from object
        console.log('adAccountId',adAccountId);
        Metric.findById(widget.metrics[0].metricId, function (err, response) {
            console.log('metrictype',response);
            if(!err){
                Object.find({
                    'channelObjectId': object.channelObjectId,
                    'profileId': profile._id
                }, function (err, objectResult) {
                    if (!err) {
                        Data.findOne({
                            'objectId': widget.metrics[0].objectId,
                            'metricId': widget.metrics[0].metricId
                        }, function (err, dataResult) {
                            console.log('dataResult',dataResult);

                            //Function to format the date
                            function calculateDate(d) {
                                month = '' + (d.getMonth() + 1),
                                    day = '' + d.getDate(),
                                    year = d.getFullYear();
                                if (month.length < 2) month = '0' + month;
                                if (day.length < 2) day = '0' + day;
                                var startDate = [year, month, day].join('-');
                                return startDate;
                            }
                            d = new Date();
                            console.log('currentDate',d);

                            //to form query based on start end date
                            function setStartEndDate(n) {
                                d.setDate(d.getDate() + 1);
                                var endDate = calculateDate(d);
                                d.setDate(d.getDate() - n);
                                var startDate = calculateDate(d);
                                console.log('startDate',startDate);
                                console.log('endDate',endDate);
                                console.log('adAccountId',adAccountId);
                                var query = "v2.5/" + adAccountId + "/insights?limit=5&time_increment=1&fields=" + response.meta.fbAdsMetricName + '&time_range[since]=' + startDate+ '&time_range[until]=' + endDate;
                                console.log('query',query);
                                //var query = pageId + "/insights/" + response.meta.fbAdsMetricName + "?since=" + startDate + "&until=" + endDate;
                                fetchFBadsData(profile,query, widget, dataResult);
                            }

                            if (dataResult) {
                                var updated = calculateDate(dataResult.updated);
                                var currentDate = calculateDate(new Date());
                                d.setDate(d.getDate() + 1);
                                var endDate = calculateDate(d);
                                var oneDay = 24 * 60 * 60 * 1000; // hours*minutes*seconds*milliseconds
                                if (updated < currentDate) {
                                    console.log('adAccountId',adAccountId);
                                    var query = "v2.5/" + adAccountId + "/insights?limit=5&time_increment=1&fields=" + response.meta.fbMetricName + '&time_range[since]=' + updated+ '&time_range[until]=' + endDate;
                                    console.log('query',query);
                                    //var query = pageId + "/insights/" + response.meta.fbMetricName + "?since=" + updated + "&until=" + endDate;
                                    fetchFBadsData(profile,query, 3, widget, dataResult, 1);
                                }
                                else {
                                    req.app.result = dataResult;
                                    next();
                                }
                            }
                            else {

                                setStartEndDate(365);

                            }
                        })
                    }
                })

            }
        });
    }

// This Function executed to get insights data like(impression,clicks)
    function fetchFBadsData(profile,query, widget, dataResult, data) {

        FB.setAccessToken(profile.accessToken);
        var tot_metric = [];
        Adsinsights(query);
        function Adsinsights(query) {
            FB.api(query, function (res) {
                console.log('insightsdata', res);
                var wholeData = [];
                //controlled pagination Data

                    if (res.paging && res.paging.next) {
                        console.log("insight if");
                        tot_metric.push(res.data);
                        var nextPage = res.paging.next;
                        var str = nextPage;
                        var recallApi = str.replace("https://graph.facebook.com/", " ").trim();
                        console.log(recallApi);
                        Adsinsights(recallApi);
                    }

                    else {
                        tot_metric.push(res.data);
                        console.log('tot_metric', tot_metric);
                        for (var i = 0; i < tot_metric.length; i++) {
                            var obj_metric = (tot_metric[i]);
                            for (var j = 0; j < obj_metric.length; j++) {
                                wholeData.push(obj_metric[j]);
                            }
                        }
                        console.log('metricType',wholeData);
                        updated = new Date();

                        //Updating the old data with new one
                        Data.update({
                            'objectId': widget.metrics[0].objectId,
                            'metricId' :widget.metrics[0].metricId
                        }, {
                            $set: {data: wholeData, updated: updated}
                        }, {upsert: true}, function (err) {
                            if (err) console.log("User not saved");
                            else {
                                Data.find({'objectId': widget.metrics[0].objectId,'metricId':widget.metrics[0].metricId}, function (err, response) {
                                    if (!err)
                                        req.app.result = response;
                                    else if (!response.length)
                                        req.app.result = {error: err, message: 'Database error'};
                                    else
                                        req.app.result = {status: 302, message: 'No record found'};
                                    next();
                                })
                            }
                        });
                    }

            })
        }
    }
    //To get facebook data
    function getFBPageData(profile, widget, object, pageId) {
        graph.setAccessToken(profile.accessToken);
        Metric.findById(widget.metrics[0].metricId, function (err, response) {
            if (!err) {
                Data.findOne({
                    'objectId': widget.metrics[0].objectId,
                    'metricId': widget.metrics[0].metricId
                }, function (err, dataResult) {

                    //Function to format the date
                    function calculateDate(d) {
                        month = '' + (d.getMonth() + 1),
                            day = '' + d.getDate(),
                            year = d.getFullYear();
                        if (month.length < 2) month = '0' + month;
                        if (day.length < 2) day = '0' + day;
                        var startDate = [year, month, day].join('-');
                        return startDate;
                    }

                    d = new Date();

                    //to form query based on start end date
                    function setStartEndDate(n, count) {
                        d.setDate(d.getDate() + 1);
                        var endDate = calculateDate(d);
                        d.setDate(d.getDate() - n);
                        var startDate = calculateDate(d);
                        var query = pageId + "/insights/" + response.meta.fbMetricName + "?since=" + startDate + "&until=" + endDate;
                        fetchFBData(query, count, widget, dataResult);
                    }
                    if (dataResult) {
                        var updated = calculateDate(dataResult.updated);
                        var currentDate = calculateDate(new Date());
                        d.setDate(d.getDate() + 1);
                        var endDate = calculateDate(d);
                        if (updated < currentDate) {
                            var query = pageId + "/insights/" + response.meta.fbMetricName + "?since=" + updated + "&until=" + endDate;
                            fetchFBData(query, 3, widget, dataResult, 1);
                        }
                        else {
                            req.app.result = dataResult;
                            next();
                        }
                    }
                    else {

                        //fb api is called 4 times to get one year data
                        //call the facebook api & store one year data
                        //ex end date = 09/03/2016 start date = 09/03/2015
                        for (var j = 0; j < 3; j++) {
                            setStartEndDate(93);
                            if (j == 2) {
                                setStartEndDate(86, 3);
                            }
                        }
                    }
                })
            }
        })
    }


    /*
     function to execute the query and get impression details of a chosen single metric
     */
    function fetchFBData(query, count, widget, dataResult, data) {
        var impressions = [];
        var dates = [];
        var finalData = [];
        totalImpressions = [];
        totalDates = [];
        graph.get(query, function (err, res) {
            console.log('Printing query in fetchFBData',query);
            console.log('Printing response in fetchFBData',res);
            console.log('Printing error in fetchFBData',err);
            for (i = 0; i < res.data[0].values.length; i++) {
                impressions.push(res.data[0].values[i].value);
                dates.push(res.data[0].values[i].end_time.substr(0, 10));
            }
            for (var k = 0; k < impressions.length; k++) {
                totalImpressions.push(impressions[k]);
                totalDates.push(dates[k]);
            }

            // create the impression object
            var saveResult = new Data();
            var length = totalImpressions.length;
            for (var i = 0; i < length; i++) {
                saveResult.objectId = widget.metrics[0].objectId;
                saveResult.metricId = widget.metrics[0].metricId;
                saveResult.created = new Date();
                saveResult.updated = new Date();
                finalData.push({'total': totalImpressions[i], 'date': totalDates[i]});
            }

            // save the user
            if (count == 3) {
                var wholeResponse = [];
                if (data) {
                    for (var r = 0; r < dataResult.data.length; r++) {

                        //push the value in db to wholeResponse array
                        wholeResponse.push(dataResult.data[r]);
                    }
                    for (data in finalData) {

                        //merge new data and already existing data
                        wholeResponse.push(finalData[data]);
                    }
                    saveResult.data = wholeResponse[0];
                    var updated = new Date();

                    //Updating the old data with new one
                    Data.update({
                        'objectId': widget.metrics[0].objectId
                    }, {
                        $set: {data: wholeResponse, updated: updated}
                    }, {upsert: true}, function (err) {
                        if (err) console.log("User not saved");
                        else {
                            Data.find({'objectId': widget.metrics[0].objectId}, function (err, response) {
                                if (!err)
                                    req.app.result = response;
                                else if (!response.length)
                                    req.app.result = {error: err, message: 'Database error'};
                                else
                                    req.app.result = {status: 302, message: 'No record found'};
                                next();
                            })
                        }
                    });
                }
                else {
                    saveResult.data = finalData;

                    //One year data will be stored here
                    saveResult.save(function (err, saved) {
                        if (err || !saved) console.log("User not saved");
                        else {
                            Data.findOne({'objectId': widget.metrics[0].objectId}, function (err, response) {
                                if (!err)
                                    req.app.result = response;
                                else if (!response)
                                    req.app.result = {error: err, message: 'Database error'};
                                else
                                    req.app.result = {status: 302, message: 'No record found'};
                                next();
                            })
                        }
                    });
                }
            }
        })
    }

    //set oauth credentials and get object type details
    function initializeGa(profile, channelDetails, widget, object) {
        Objecttype.findOne({'_id': object.objectTypeId}, {type: 1}, function (err, objectType) {
            if (err)
                req.app.result = {error: err, message: 'Database error'};
            else if (!profile)
                req.app.result = {status: 302, message: 'No record found'};
            else {
                oauth2Client.setCredentials({
                    access_token: profile.accessToken,
                    refresh_token: profile.refreshToken
                });

                googleDataEntireFunction(profile, channelDetails, widget, object, oauth2Client);

            }
        })
    }

    //to get google analtic data
    function googleDataEntireFunction(profile, channelDetails, widget, object, oauth2Client) {

        //To get API Nomenclature value for metric name
        Metric.find({'_id': widget.metrics[0].metricId}, function (err, response) {
            if (response.length) {

                //To find the day's difference between start and end date
                var startDate = new Date(req.body.startDate);
                var endDate = new Date(req.body.endDate);
                /* var timeDiff = Math.abs(endDate.getTime() - startDate.getTime());
                 var totalDays = Math.ceil(timeDiff / (1000 * 3600 * 24));
                 var metricName = response[0].meta.gaMetricName;
                 req.app.noOfRequest = totalDays;
                 var totalRequest = req.app.noOfRequest;*/
                var metricName = response[0].meta.gaMetricName;
                var dimension;
                var dimensionArray = [];
                var dimensionList = [];

                //Array to hold the final google data
                var storeGoogleData = [];
                if (req.body.dimensionList != undefined) {
                    dimensionList = req.body.dimensionList;

                    //This is for testing now hard coded
                    // dimensionList.push({'name': 'ga:date'}, {'name': 'ga:year'}, {'name': 'ga:month'}, {'name': 'ga:day'}, {'name': 'ga:year'}, {'name': 'ga:week'});
                    var getDimension = dimensionList[0].name;
                    var dimensionListLength = dimensionList.length;

                    //Dynamically form the dimension object like {ga:}
                    for (var k = 1; k < dimensionListLength; k++) {
                        getDimension = getDimension + ',' + dimensionList[k].name;
                        dimensionArray.push({'dimension': getDimension});
                    }
                    dimension = dimensionArray[dimensionArray.length - 1].dimension;
                }

                //if user didnt specify any dimension
                else {
                    dimensionList.push({'name': 'ga:date'});
                    dimension = 'ga:date';
                }
                var startDate = new Date(req.body.startDate);
                var endDate = new Date(req.body.endDate);

                //get the entire data from db
                Data.findOne({'objectId': widget.metrics[0].objectId}, function (err, dataList) {

                    //Function to format the date
                    function calculateDate(d) {
                        month = '' + (d.getMonth() + 1),
                            day = '' + d.getDate(),
                            year = d.getFullYear();
                        if (month.length < 2) month = '0' + month;
                        if (day.length < 2) day = '0' + day;
                        var startDate = [year, month, day].join('-');
                        return startDate;
                    }

                    var d = new Date();
                    if (dataList) {
                        var startDate = calculateDate(dataList.updated);
                        var endDate = calculateDate(d);
                        if (startDate < endDate) {
                            //set start date end date
                            analyticData(oauth2Client, object, dimension, metricName, startDate, endDate, response, dataList);
                        }
                        else {
                            req.app.result = dataList;
                            next();
                        }
                    }
                    else {
                        console.log('Step 5');
                        //call google api
                        d.setDate(d.getDate() - 365);
                        var startDate = calculateDate(d);
                        var endDate = calculateDate(new Date());
                        analyticData(oauth2Client, object, dimension, metricName, startDate, endDate, response, dataList);
                    }
                })
            }

            //If empty response from database set the error message
            else {
                req.app.error = {'message': 'No data found'};
                next();
            }

            //to get the final google analytic data
            function analyticData(oauth2Client, object, dimension, metricName, startDate, endDate, response, dataList) {
                /**Method to call the google api
                 * @param oauth2Client - set credentials
                 */
                analytics.data.ga.get({
                        'auth': oauth2Client,
                        'ids': 'ga:' + object.channelObjectId,
                        'start-date': startDate,
                        'end-date': endDate,
                        'dimensions': dimension,
                        'metrics': metricName,
                        prettyPrint: true
                    }, function (err, result) {
                        if (!err) {
                            //calculating the result length
                            var resultLength = result.rows.length;
                            var resultCount = result.rows[0].length - 1;

                            //loop to store the entire result into an array
                            for (var i = 0; i < resultLength; i++) {
                                var obj = {};

                                //loop generate array dynamically based on given dimension list
                                for (var m = 0; m < dimensionList.length; m++) {
                                    if (m == 0) {

                                        //date value is coming in the format of 20160301 so splitting like yyyy-mm--dd format
                                        var year = result.rows[i][0].substring(0, 4);
                                        var month = result.rows[i][0].substring(4, 6);
                                        var date = result.rows[i][0].substring(6, 8);
                                        obj[dimensionList[m].name.substr(3)] = [year, month, date].join('-');
                                        //obj['metricName'] = metricName;
                                        obj['total'] = result.rows[i][resultCount];
                                    }
                                    else {
                                        obj[dimensionList[m].name.substr(3)] = result.rows[i][m];
                                        //obj['metricName'] = metricName;
                                        obj['total'] = result.rows[i][resultCount];
                                    }
                                }
                                storeGoogleData.push(obj);
                                if (storeGoogleData.length == resultLength) {
                                    req.app.result = storeGoogleData;

                                    //Save the result to data collection
                                    //input channelId,channelObjId,metricId
                                    var data = new Data();
                                    data.metricId = response[0]._id;
                                    data.objectId = widget.metrics[0].objectId;
                                    data.data = storeGoogleData;
                                    data.created = new Date();
                                    data.updated = new Date();
                                    if (dataList) {
                                        var wholeResponse = [];
                                        var finalData = [];
                                        for (var r = 0; r < dataList.data.length; r++) {

                                            //merge old data with new one
                                            wholeResponse.push(dataList.data[r]);
                                        }
                                        for (data in finalData) {
                                            wholeResponse.push(finalData[data]);
                                        }

                                       var updated = new Date();

                                        //Updating the old data with new one
                                        dataCollection.update({
                                            'objectId': widgetDetails.metrics[0].objectId,
                                            'metricId': widgetDetails.metrics[0].metricId
                                        }, {
                                            $set: {data: wholeResponse, updated: updated}
                                        }, {upsert: true}, function (err) {
                                            if (err) console.log("User not saved");
                                            else {
                                                dataCollection.find({'objectId': widgetDetails.metrics[0].objectId}, function (err, response) {
                                                    if (!err)
                                                        req.app.result = response;
                                                    else if (!response.length)
                                                        req.app.result = {error: err, message: 'Database error'};
                                                    else
                                                        req.app.result = {status: 302, message: 'No record found'};
                                                    next();
                                                })
                                            }
                                        })
                                    }
                                    else {
                                        data.save(function saveData(err, googleData) {
                                            if (!err)
                                                next();
                                        })
                                    }
                                }
                            }
                        }

                        //If there is error in token expiration, then refresh the access token
                        else {
                            oauth2Client.refreshAccessToken(function (err, tokens) {
                                profile.token = tokens.access_token;
                                oauth2Client.setCredentials({
                                    access_token: tokens.access_token,
                                    refresh_token: tokens.refresh_token
                                });
                                googleDataEntireFunction(profile, channelDetails, widget, object, oauth2Client);
                                profile.update({'email': profile.email}, {$set: {"accessToken": tokens.access_token}}, {upsert: true}, function (err, updateResult) {
                                    if (err || !updateResult)console.log('failure');
                                    else console.log('Update success');
                                })
                            });
                        }
                    }
                );
            }
        })
    }
    function selectTweetObjectType(profile, channelDetails, widget, object){
        //select object type
        Objecttype.findOne({'_id': object.objectTypeId}, function (err, objectType) {
            if (err)
                req.app.result = {error: err, message: 'Database error'};
            else if (!profile)
                req.app.result = {status: 302, message: 'No record found'};
            else {

                //To select which object type
                switch (objectType.type) {
                    case configAuth.objectType.twitter:
                        getTweetData(profile, channelDetails, widget, object);
                        break;

                }
            }
        })
    }

    function getTweetData(profile, channelDetails, widget, object){
        //To Get the Metrice Type throught widgetDetails
        //and get metricid and object id from object
        metrics.findById(widget.metrics[0].metricId, function (err, response) {
            console.log('metrictype',response);
            if(!err){
                object.find({
                    'profileId': profile._id
                }, function (err, objectResult) {
                    if (!err) {
                        Data .findOne({
                            'objectId': widget.metrics[0].objectId,
                            'metricId': widget.metrics[0].metricId
                        }, function (err, dataResult) {
                            console.log('dataResult',dataResult);

                            //Function to format the date
                            function calculateDate(d) {
                                month = '' + (d.getMonth() + 1),
                                    day = '' + d.getDate(),
                                    year = d.getFullYear();
                                if (month.length < 2) month = '0' + month;
                                if (day.length < 2) day = '0' + day;
                                var startDate = [year, month, day].join('-');
                                return startDate;
                            }
                            d = new Date();
                            console.log('currentDate',d);
                            if (dataResult) {
                                var updated = calculateDate(dataResult.updated);
                                var currentDate = calculateDate(new Date());
                                d.setDate(d.getDate() + 1);
                                var endDate = calculateDate(d);
                                if (updated < currentDate) {
                                    var query = response.meta.TweetMetricName;
                                    console.log('query',query);
                                    fetchTweetData(profile,query, widget, dataResult);
                                }
                                else {
                                    req.app.result = dataResult;
                                    next();
                                }
                            }
                            else {
                                var metricType = response.name;
                                var query = response.meta.TweetMetricName;
                                console.log('query',query);
                                fetchTweetData(profile, metricType, query, widget, dataResult);

                            }
                        })
                    }
                })

            }
        });
    }
    function fetchTweetData(profile,metricType, query, widget, dataResult){
        var wholetweetData = [];
        var client = new Twitter({
            consumer_key: configAuth.twitterAuth.consumerKey,
            consumer_secret: configAuth.twitterAuth.consumerSecret,
            access_token_key: configAuth.twitterAuth.AccessToken,
            access_token_secret: configAuth.twitterAuth.AccessTokenSecret
        });
        if (metricType === configAuth.twitterMetric.Mentions || metricType === configAuth.twitterMetric.HighEngagementtweets ) {
            console.log('Mentions'+profile.name);
            client.get(query,  function (error, tweets, response) {
                var  TweetObject;
                for (var i = 0; i < tweets.length; i++) {
                    TweetObject = tweets[i];
                    wholetweetData.push(TweetObject);

                }
                storeTweetData(wholetweetData,widget);

            });


        }
        else if(metricType === configAuth.twitterMetric.Keywordmentions){
            console.log('Keyword Mentions')
            client.get(query ,{q:'%23' + profile.name} ,  function (error, tweets, response) {
                console.log('search',tweets);
                console.log(tweets.length);
                var  TweetObject;
                for (var i = 0; i < tweets.length; i++) {
                    TweetObject = tweets[i];
                    wholetweetData.push(TweetObject);
                }

                storeTweetData(wholetweetData,widget);

            });
        }
        else {
            console.log('others'+metricType);
            client.get(query, {screen_name: profile.name}, function (error, tweets, response) {
                console.log(tweets.length);
                var  TweetObject;
                for (var i = 0; i < tweets.length; i++) {
                    TweetObject = tweets[i];
                    wholetweetData.push(TweetObject);

                }
                storeTweetData(wholetweetData,widget);

            });
        }
        console.log('metricType', wholetweetData);
        updated = new Date();

        //Updating the old data with new one
        function storeTweetData(wholetweetData,widget) {
            Data.update({
                'objectId': widget.metrics[0].objectId,
                'metricId' :widget.metrics[0].metricId
            }, {
                $set: {data: wholetweetData, updated: updated}
            }, {upsert: true}, function (err) {
                if (err) console.log("User not saved");
                else {
                    Data.find({
                        'objectId': widget.metrics[0].objectId,
                        'metricId': widget.metrics[0].metricId
                    }, function (err, response) {
                        if (!err)
                            req.app.result = response;
                        else if (!response.length)
                            req.app.result = {error: err, message: 'Database error'};
                        else
                            req.app.result = {status: 302, message: 'No record found'};
                        next();
                    })
                }
            });
        }

    }
};


