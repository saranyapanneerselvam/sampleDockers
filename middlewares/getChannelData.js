var async = require("async");
var channels = require('../models/channels');
var FB = require('fb');
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

//set Twitter module
var Twitter = require('twitter');

//Load the auth file
var configAuth = require('../config/auth');

//set credentials in OAuth2
var oauth2Client = new OAuth2(configAuth.googleAuth.clientID, configAuth.googleAuth.clientSecret, configAuth.googleAuth.callbackURL);

// set auth as a global default
var analytics = googleapis.analytics({version: 'v3', auth: oauth2Client});
var Widget = require('../models/widgets');

exports.getChannelData = function (req, res, next) {

    //async's one of the method to run tasks ,one task may or may not depend on the other
    async.auto({
        widget: getWidget,
        data: ['widget', getData],
        metric: ['widget', getMetric],
        object: ['widget', getObject],
        get_profile: ['object', getProfile],
        get_channel: ['get_profile', getChannel],
        get_channel_data_remote: ['get_channel', getChannelDataRemote],
        get_channel_objects_db: ['get_channel_data_remote', getChannelDataDB]
    }, function (err, results) {
        console.log('error = ', err);
        console.log('results = ', results);
        if (err) {
            return res.status(500).json({});
        }
        req.app.result = results.get_channel_objects_db;
        next();
    });

    //Function to handle all queries result here
    function checkNullObject(callback) {
        return function (err, object) {
            if (err)
                callback('Database error: ' + err, null);
            else if (!object)
                callback('No record found', '');
            else
                callback(null, object);

        }
    }

    //Function to handle the data query results
    function checkNullData(callback) {
        return function (err, object) {
            if (err)
                callback('Database error: ' + err, null);
            else if (!object)
                callback('', 'No data');
            else
                callback(null, object);
        }
    }

    //Function to get the data in data collection
    function getData(results, callback) {
        Data.findOne({
            'objectId': results.widget.metrics[0].objectId,
            'metricId': results.widget.metrics[0].metricId
        }, checkNullData(callback));
    }

    //Function to get the data in metric collection
    function getMetric(results, callback) {
        Metric.findById(results.widget.metrics[0].metricId, checkNullObject(callback));
    }

    //Function to get the data in widget collection
    function getWidget(callback) {
        Widget.findOne({'_id': req.params.widgetId}, {metrics: 1}, checkNullObject(callback));
    }

    //Function to get the data in object collection
    function getObject(results, callback) {
        Object.findOne({'_id': results.widget.metrics[0].objectId}, {
            profileId: 1,
            channelObjectId: 1,
            objectTypeId: 1
        }, checkNullObject(callback));
    }

    //Function to get the data in profile collection
    function getProfile(results, callback) {
        profile.findOne({'_id': results.object.profileId}, {
            accessToken: 1,
            refreshToken: 1,
            channelId: 1,
            userId: 1,
            email: 1
        }, checkNullObject(callback));
    }

    //Function to get the data in channel collection
    function getChannel(results, callback) {
        channels.findOne({'_id': results.get_profile.channelId}, {code: 1}, checkNullObject(callback));
    }

    //To call the respective function based on channel
    function getChannelDataRemote(results, callback) {
        var channel = results.get_channel;

        //To check the channel
        switch (channel.code) {
            case configAuth.channels.googleAnalytics:
                initializeGa(results);
                break;
            case configAuth.channels.facebook:
                getFBPageData(results, callback);
                break;
            case configAuth.channels.facebookAds:
                getFBadsinsightsData(results.get_profile,results.widget,   results.object);
                break;
            case configAuth.channels.twitter:
                selectTweetObjectType(results.get_profile, results.get_channel, results.widget, results.object);
                break;
        }
    }


    //Function to get facebook data
    function getFBPageData(initialResults, callback) {
        d = new Date();
        graph.setAccessToken(initialResults.get_profile.accessToken);
        async.auto({
            get_start_end_dates: getDates,
            get_object_list: ['get_start_end_dates', passQueryToGraphApi],
            store_final_data: ['get_object_list', storeFinalData]
        }, function (err, results) {
            console.log('err = ', err);
            console.log('result in switch = ', results);
            if (err) {
                return callback(err, null);
            }
            callback(null, results.get_views);
        });


        //Function to format the date to yyyy-mm-dd
        function formatDate(d) {
            month = '' + (d.getMonth() + 1),
                day = '' + d.getDate(),
                year = d.getFullYear();
            if (month.length < 2) month = '0' + month;
            if (day.length < 2) day = '0' + day;
            var startDate = [year, month, day].join('-');
            return startDate;
        }

        //To get the start date ,end date required for query
        function getDates(callback) {

            //check already there is one year data in db
            if (initialResults.data != 'No data') {
                initialResults.data.updated.setDate(initialResults.data.updated.getDate() + 1);
                d.setDate(d.getDate() + 1);
                var updated = formatDate(initialResults.data.updated);
                var now = formatDate(d);
                if (updated < now) {
                    var query = initialResults.object.channelObjectId + "/insights/" + initialResults.metric.meta.fbMetricName + "?since=" + updated + "&until=" + now;
                    callback(null, query);
                }
                else
                    callback(null, 1);
            }

            //To four queries to get one year data
            else
                async.map([93, 93, 93, 86], setStartEndDate, callback);
        }

        //To form query based on start end date for getting one year data
        function setStartEndDate(n, callback) {
            d.setDate(d.getDate() + 1);
            var endDate = formatDate(d);
            d.setDate(d.getDate() - n);
            var startDate = formatDate(d);
            var dates = {startDare: startDate, endDate: endDate};
            var query = initialResults.object.channelObjectId + "/insights/" + initialResults.metric.meta.fbMetricName + "?since=" + startDate + "&until=" + endDate;
            callback('', query);
        }

        //To pass the query to graph api
        function passQueryToGraphApi(results, callback) {
            if (typeof results.get_start_end_dates == 'string')
                async.map([results.get_start_end_dates], getDataForEachQuery, callback);
            else
                async.concat(results.get_start_end_dates, getDataForEachQuery, callback);
        }

        //To get facebook data
        function getDataForEachQuery(query, callback) {
            graph.get(query, function (err, res) {
                callback('', res);
            })
        }

        //To store the final result in db
        function storeFinalData(results, callback) {

            //Array to hold the final result
            var finalData = [];
            if (initialResults.data != 'No data') {

                //Checking the data is up to date
                if (!results.get_object_list.length)
                    callback('', 'success');

                //merge the old data with new one and update it in db
                else {
                    for (var key = 0; key < initialResults.data.data.length; key++) {
                        finalData.push(initialResults.data.data[key]);
                    }
                    for (var key in results.get_object_list) {
                        for (var index in results.get_object_list[key].data[0].values) {
                            var value = {};
                            value = {
                                total: results.get_object_list[key].data[0].values[index].value,
                                date: results.get_object_list[key].data[0].values[index].end_time.substr(0, 10)
                            };
                            finalData.push(value);
                        }
                    }
                    var updated = new Date();

                    //Updating the old data with new one
                    Data.update({
                        'objectId': initialResults.widget.metrics[0].objectId,
                        'metricId': initialResults.widget.metrics[0].metricId
                    }, {
                        $set: {data: finalData, updated: updated}
                    }, {upsert: true}, function (err) {
                        if (err) console.log("User not saved");
                        else
                            callback(null, 'success')

                    });
                }
            }
            else {
                for (var key in results.get_object_list) {
                    for (var index in results.get_object_list[key].data[0].values) {
                        var value = {};
                        value = {
                            total: results.get_object_list[key].data[0].values[index].value,
                            date: results.get_object_list[key].data[0].values[index].end_time.substr(0, 10)
                        };
                        finalData.push(value);
                    }

                }
                var data = new Data();
                data.metricId = initialResults.metric._id;
                data.objectId = initialResults.widget.metrics[0].objectId;
                data.data = finalData;
                data.created = new Date();
                data.updated = new Date();
                data.save(function saveData(err) {
                    if (!err)
                        callback(null, 'success')
                })
            }
        }
    }

    //Get the new data from db
    function getChannelDataDB(results, callback) {
        var query = {
            'objectId': results.widget.metrics[0].objectId,
            'metricId': results.widget.metrics[0].metricId
        };
        Data.findOne(query, callback);
    }

    //set oauth credentials and get object type details
    function initializeGa(results) {
        Objecttype.findOne({'_id': results.object.objectTypeId}, {type: 1}, function (err, objectType) {
            if (err)
                req.app.result = {error: err, message: 'Database error'};
            else if (!profile)
                req.app.result = {status: 302, message: 'No record found'};
            else {
                oauth2Client.setCredentials({
                    access_token: results.get_profile.accessToken,
                    refresh_token: results.get_profile.refreshToken
                });

                googleDataEntireFunction(results, oauth2Client);

            }
        })
    }

    //to get google analtic data
    function googleDataEntireFunction(results, oauth2Client) {

        //To get API Nomenclature value for metric name
            if (results.metric) {

                //To find the day's difference between start and end date
                var startDate = new Date(req.body.startDate);
                var endDate = new Date(req.body.endDate);
                var metricName = results.metric.meta.gaMetricName;
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
                Data.findOne({'objectId': results.widget.metrics[0].objectId}, function (err, dataList) {

                    //Function to format the date
                    function formatDate(d) {
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
                        var startDate = formatDate(dataList.updated);
                        var endDate = formatDate(d);
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

                        //call google api
                        d.setDate(d.getDate() - 365);
                        var startDate = formatDate(d);
                        var endDate = formatDate(new Date());
                        analyticData(oauth2Client, results.object, dimension, metricName, startDate, endDate, results.response, dataList,results);
                    }
                })
            }

            //If empty response from database set the error message
            else {
                req.app.error = {'message': 'No data found'};
                next();
            }

            //to get the final google analytic data
            function analyticData(oauth2Client, object, dimension, metricName, startDate, endDate, response, dataList,results) {

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
                                    console.log('data',storeGoogleData)

                                    //Save the result to data collection
                                    //input channelId,channelObjId,metricId
                                    var data = new Data();
                                    data.metricId = results.metric._id;
                                    data.objectId = results.widget.metrics[0].objectId;
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
                                        Data.update({
                                            'objectId': widget.metrics[0].objectId,
                                            'metricId': widget.metrics[0].metricId
                                        }, {
                                            $set: {data: wholeResponse, updated: updated}
                                        }, {upsert: true}, function (err) {
                                            if (err) console.log("User not saved");
                                            else {
                                                Data.find({'objectId': widget.metrics[0].objectId}, function (err, response) {
                                                    console.log('save',response)
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
                                            req.app.result=googleData;
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
                                googleDataEntireFunction(results, oauth2Client);
                                /*profile.update({'email': profile.email}, {$set: {"accessToken": tokens.access_token}}, {upsert: true}, function (err, updateResult) {
                                 if (err || !updateResult)console.log('failure');
                                 else console.log('Update success');
                                 })*/
                            });
                        }
                    }
                );
            }

    }
    //To get FacebookAds Insights Data
    function getFBadsinsightsData(profile, widget, object){
        var adAccountId = object.channelObjectId;

        //To Get the Metrice Type throught widget
        //and get metricid and object id from object
        Metric.findById(widget.metrics[0].metricId, function (err, response) {
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
        Metric.findById(widget.metrics[0].metricId, function (err, response) {
            console.log('metrictype',response);
            if(!err){
                Object.find({
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

}



