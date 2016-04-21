var async = require("async");
var channels = require('../models/channels');
var FB = require('fb');
var exports = module.exports = {};
var refWidget = require('../models/referenceWidgets');

//To use google api's
var googleapis = require('googleapis');

//Importing the fbgraph module
var graph = require('fbgraph');

//To load up the user model
var profile = require('../models/profiles');

//To load the metrics model
var Metric = require('../models/metrics');

var moment = require('moment');
moment().format();

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
var client = new Twitter({
    consumer_key: configAuth.twitterAuth.consumerKey,
    consumer_secret: configAuth.twitterAuth.consumerSecret,
    access_token_key: configAuth.twitterAuth.AccessToken,
    access_token_secret: configAuth.twitterAuth.AccessTokenSecret
});

//To get the channel data
exports.getChannelData = function (req, res, next) {

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

    function getDaysDifference(startDate, endDate) {
        var storeStartDate = new Date(startDate);
        var storeEndDate = new Date(endDate);
        var timeDiff = Math.abs(storeEndDate.getTime() - storeStartDate.getTime());
        var diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24));
        return diffDays;
    }

    //async's one of the method to run tasks ,one task may or may not depend on the other
    async.auto({
        widget: getWidget,
        data: ['widget', getData],
        metric: ['widget', 'data', getMetric],
        object: ['widget', 'metric', getObject],
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
        console.log('metrics', results)
        var objectLength = results.widget.charts.length;

        for (var i = 0; i < objectLength; i++) {
            var metricLength = results.widget.charts[i].metrics.length;
            for (var j = 0; j < metricLength; j++) {
                Data.findOne({
                    'objectId': results.widget.charts[i].metrics[j].objectId,
                    'metricId': results.widget.charts[i].metrics[j].metricId
                }, checkNullData(callback));
            }

        }


    }


    //Function to get the data in metric collection
    function getMetricIdsFromRefWidget(results, callback) {
        console.log('ref widget id', results);
        async.concat(results.widget.charts, getAllRefidgetId, callback)


    }

    //Function to get all  reference ids
    function getAllRefidgetId(results, callback) {
        console.log('reference widget details', results)
        refWidget.findById(results.refWidgetId, checkNullObject(callback))
    }

    //Function to get the data in metric collection
    function getMetric(results, callback) {
        console.log('getmetricc', results);
        // console.log('metrics from ref widget id', results.get_metric_ids.charts.metrics, results.get_metric_ids.charts)
        async.concat(results.widget.charts, findEachMetrics, callback);

    }

    //Function to get each metric details
    function findEachMetrics(results, callback) {
        console.log('find each metrics', results);
        Metric.find({
            _id: results.metrics[0].metricId,
            objectTypes: {$elemMatch: {objectTypeId: results.metrics[0].objectTypeId}}
        }, checkNullObject(callback))
    }


    //Function to get the data in widget collection
    function getWidget(callback) {
        Widget.findOne({'_id': req.params.widgetId}, {charts: 1}, checkNullObject(callback));
    }

    //Function to get the data in object collection
    function getObject(results, callback) {
        console.log('getObjects', results);
        async.concat(results.widget.charts, getEachObject, callback);
    }

    //Function to get each object details
    function getEachObject(results, callback) {
        console.log('objects', results);
        Object.find({'_id': results.metrics[0].objectId}, {
            profileId: 1,
            channelObjectId: 1,
            objectTypeId: 1
        }, checkNullObject(callback));
    }

    //Function to get the data in profile collection
    function getProfile(results, callback) {
        console.log('object details', results);
        async.concat(results.object, getEachProfile, callback)
    }

    //Function to get all profile details
    function getEachProfile(results, callback) {
        console.log('inside geteach profile', results);
        profile.findOne({'_id': results.profileId}, {
            accessToken: 1,
            refreshToken: 1,
            channelId: 1,
            userId: 1,
            email: 1,
            name: 1
        }, checkNullObject(callback));
    }

    //Function to get the data in channel collection
    function getChannel(results, callback) {
        console.log('checking profile', results.get_profile);
        async.concat(results.get_profile, getEachChannel, callback);
    }

    //Function to get all channels detail
    function getEachChannel(results, callback) {
        console.log('profile id', results);
        channels.findOne({'_id': results.channelId}, {code: 1}, checkNullObject(callback));
    }

    //To call the respective function based on channel
    function getChannelDataRemote(initialResults, callback) {
        console.log('inside getchannel data remote', initialResults);
        async.auto({
            get_each_channel_data: getEachChannelData
        }, function (err, results) {
            console.log('err = ', err);
            console.log('results = ', results);
            if (err) {
                return callback(err, null);
            }
            callback(null, results.get_views);
        });
        function getEachChannelData(callback) {
            async.concat(initialResults.get_channel, dataForEachChannel, callback)
        }

        function dataForEachChannel(results, callback) {
            console.log('before switch', results)
            //To check the channel
            switch (results.code) {
                case configAuth.channels.googleAnalytics:
                    initializeGa(initialResults);
                    break;
                case configAuth.channels.facebook:
                    getFBPageData(initialResults, callback);
                    break;
                case configAuth.channels.facebookAds:
                    getFBadsinsightsData(initialResults);
                    break;
                case configAuth.channels.twitter:
                    getTweetData(initialResults);
                    break;
            }
        }
    }


    //Function to get facebook data
    function getFBPageData(initialResults, callback) {
        d = new Date();
        console.log('access token', initialResults.get_profile[0].accessToken);
        graph.setAccessToken(initialResults.get_profile[0].accessToken);
        async.auto({
            get_start_end_dates: getDates,
            get_object_list: ['get_start_end_dates', passQueryToGraphApi],
            store_final_data: ['get_object_list', storeFinalData]
        }, function (err, results) {
            // console.log('err = ', err);
            // console.log('result in switch = ', results);
            if (err) {
                return callback(err, null);
            }
            callback(null, results.get_object_list);
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

                    //for(var i=0;i<)
                    var query = initialResults.object.channelObjectId + "/insights/" + initialResults.metric.objectTypes[0].meta.fbMetricName + "?since=" + updated + "&until=" + now;
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
            console.log('inside set start date,end date', initialResults.metric)
            d.setDate(d.getDate() + 1);
            var endDate = formatDate(d);
            d.setDate(d.getDate() - n);
            var startDate = formatDate(d);
            var dates = {startDare: startDate, endDate: endDate};
            var query = initialResults.object[0].channelObjectId + "/insights/" + initialResults.metric[0].objectTypes[0].meta.fbMetricName + "?since=" + startDate + "&until=" + endDate;
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
                console.log('res', res, 'query', query)
                callback('', res);
            })
        }

        //To store the final result in db
        function storeFinalData(results, callback) {
            console.log('results', results, 'initial', initialResults);

            //Array to hold the final result
            var finalData = [];
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
            if (initialResults.data != 'No data') {

                //merge the old data with new one and update it in db
                //  else {
                for (var key = 0; key < initialResults.data.data.length; key++) {
                    finalData.push(initialResults.data.data[key]);
                }


                // }
            }

            var now = new Date();

            //Updating the old data with new one
            Data.update({
                'objectId': initialResults.widget.charts[0].metrics[0].objectId,
                'metricId': initialResults.widget.charts[0].metrics[0].metricId
            }, {
                $setOnInsert: {created: now},
                $set: {data: finalData, updated: now}
            }, {upsert: true}, function (err) {
                if (err) console.log("User not saved");
                else
                    callback(null, 'success')
            });

        }
    }

    //Get the data from db
    function getChannelDataDB(results, callback) {
        console.log('get data db', results)
        Data.aggregate([

            // Unwind the array to denormalize
            {"$unwind": "$data"},


            // Match specific array elements
            {
                "$match": {
                    $and: [{"data.date": {$gte: req.body.startDate}}, {"data.date": {$lte: req.body.endDate}}, {'objectId': results.widget.charts[0].metrics[0].objectId},
                        {'metricId': results.widget.charts[0].metrics[0].metricId}]
                }
            },

            // Group back to array form
            {
                "$group": {
                    "_id": "$_id",
                    "data": {"$push": "$data"},
                    "metricId": {"$first": "$metricId"},
                    "objectId": {"$first": "$objectId"},
                    "updated": {"$first": "$updated"},
                    "created": {"$first": "$created"}

                }
            }
        ], callback)
    }

    //set oauth credentials and get object type details
    function initializeGa(results) {
        oauth2Client.setCredentials({
            access_token: results.get_profile[0].accessToken,
            refresh_token: results.get_profile[0].refreshToken
        });

        googleDataEntireFunction(results, oauth2Client);
    }

    //to get google analtic data
    function googleDataEntireFunction(results, oauth2Client) {
        console.log('metric', results)

        //To get API Nomenclature value for metric name
        if (results.metric) {
            var metricName = results.metric[0].objectTypes[0].meta.gaMetricName;
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

            //if user didn't specify any dimension
            else {
                dimensionList.push({'name': 'ga:date'});
                dimension = 'ga:date';
            }


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
            if (results.data != 'No data') {
                var startDate = formatDate(results.data.updated);
                var endDate = formatDate(d);
                if (startDate < endDate) {
                    //set start date end date
                    analyticData(oauth2Client, results.object, dimension, metricName, startDate, endDate, results.response, results.data, results);
                }
                else {
                    getGAChannelData();
                }
            }
            else {

                //call google api
                d.setDate(d.getDate() - 365);
                var startDate = formatDate(d);
                var endDate = formatDate(new Date());
                analyticData(oauth2Client, results.object, dimension, metricName, startDate, endDate, results.response, results.data, results);
            }

        }

        //If empty response from database set the error message
        else {
            return res.status(500).json({});
        }
        function getGAChannelData() {

            Data.aggregate([

                // Unwind the array to denormalize
                {"$unwind": "$data"},

                // Match specific array elements
                {"$match": {$and: [{"data.date": {$gte: req.body.startDate}}, {"data.date": {$lte: req.body.endDate}}, {'objectId': results.widget.charts[0].metrics[0].objectId}, {'metricId': results.widget.charts[0].metrics[0].metricId}]}},

                // Group back to array form
                {
                    "$group": {
                        "_id": "$_id",
                        "data": {"$push": "$data"},
                        "metricId": {"$first": "$metricId"},
                        "objectId": {"$first": "$objectId"},
                        "updated": {"$first": "$updated"},
                        "created": {"$first": "$created"}
                    }
                }
            ], function (err, data) {
                if (!err) {
                    req.app.result = data;
                    next();
                }
            })
        }

        //to get the final google analytic data
        function analyticData(oauth2Client, object, dimension, metricName, startDate, endDate, response, dataList, results) {
            console.log('obbjects', object)
            /**Method to call the google api
             * @param oauth2Client - set credentials
             */
            analytics.data.ga.get({
                    'auth': oauth2Client,
                    'ids': 'ga:' + object[0].channelObjectId,
                    'start-date': startDate,
                    'end-date': endDate,
                    'dimensions': dimension,
                    'metrics': metricName,
                    prettyPrint: true
                }, function (err, result) {
                    console.log('ga', err, result, oauth2Client);
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
                                //console.log('data', storeGoogleData)

                                //Save the result to data collection
                                //input channelId,channelObjId,metricId
                                var data = new Data();
                                data.metricId = results.widget.charts[0].metrics[0].metricId;
                                data.objectId = results.widget.charts[0].metrics[0].objectId;
                                data.data = storeGoogleData;
                                data.created = new Date();
                                data.updated = new Date();
                                console.log('get datalist', dataList);
                                if (dataList != 'No data') {
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
                                        'objectId': results.widget.charts[0].metrics[0].objectId,
                                        'metricId': results.widget.charts[0].metrics[0].metricId
                                    }, {
                                        $set: {data: wholeResponse, updated: updated}
                                    }, {upsert: true}, function (err) {
                                        if (err) console.log("User not saved");
                                        else {
                                            getGAChannelData();
                                        }
                                    })
                                }
                                else {
                                    data.save(function saveData(err) {
                                        if (!err)
                                            getGAChannelData();
                                        else
                                            return res.status(500).json({});
                                    })
                                }
                            }
                        }
                    }

                    //If there is error in token expiration, then refresh the access token
                    else {
                        oauth2Client.refreshAccessToken(function (err, tokens) {
                            console.log('token', err, tokens);
                            profile.token = tokens.access_token;
                            oauth2Client.setCredentials({
                                access_token: tokens.access_token,
                                refresh_token: tokens.refresh_token
                            });
                            googleDataEntireFunction(results, oauth2Client);
                        });
                    }

                }
            );
        }

    }

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

    //To get FacebookAds Insights Data
    function getFBadsinsightsData(initialResults) {
        console.log('widget', initialResults);
        var adAccountId = initialResults.object[0].channelObjectId;
        d = new Date();

        //to form query based on start end date
        function setStartEndDate(n) {
            d.setDate(d.getDate() + 1);
            var endDate = calculateDate(d);
            d.setDate(d.getDate() - n);
            var startDate = calculateDate(d);
            console.log('start',endDate,startDate)
            var query = "v2.5/" + adAccountId + "/insights?limit=5&time_increment=1&fields=" + initialResults.metric[0].objectTypes[0].meta.fbAdsMetricName + '&time_range[since]=' + startDate + '&time_range[until]=' + endDate;
            //var query = pageId + "/insights/" + response.meta.fbAdsMetricName + "?since=" + startDate + "&until=" + endDate;
            fetchFBadsData(initialResults.get_profile[0], query, initialResults, initialResults.data, startDate, endDate);
        }

        if (initialResults.data != 'No data') {
            var updated = calculateDate(initialResults.data.updated);
            var currentDate = calculateDate(new Date());
            d.setDate(d.getDate() + 1);
            var startDate = calculateDate(d);
            var oneDay = 24 * 60 * 60 * 1000; // hours*minutes*seconds*milliseconds
            console.log('dates',updated,currentDate,startDate)
            if (updated < currentDate) {
                var query = "v2.5/" + adAccountId + "/insights?limit=5&time_increment=1&fields=" + initialResults.metric[0].objectTypes[0].meta.fbAdsMetricName + '&time_range[since]=' + updated + '&time_range[until]=' + startDate;
                //var query = pageId + "/insights/" + response.meta.fbMetricName + "?since=" + updated + "&until=" + endDate;
                fetchFBadsData(initialResults.get_profile[0], query, initialResults, initialResults.data, updated,currentDate);
            }
            else
                getFbAdsData(initialResults);
        }
        else {
            setStartEndDate(365);
        }


    }

    //To get data based on start date ,end date
    function getFbAdsData(widget) {
        console.log('get fb ads data',widget)
        var finalResult = [];
        Data.aggregate([

            // Unwind the array to denormalize
            {"$unwind": "$data"},


            // Match specific array elements
            {
                "$match": {
                    $and: [{"data.date": {$gte: req.body.startDate}}, {"data.date": {$lte: req.body.endDate}}, {'objectId': widget.widget.charts[0].metrics[0].objectId},
                        {'metricId': widget.widget.charts[0].metrics[0].metricId}]
                }
            },

            // Group back to array form
            {
                "$group": {
                    "_id": "$_id",
                    "data": {"$push": "$data"},
                    "metricId": {"$first": "$metricId"},
                    "objectId": {"$first": "$objectId"},
                    "updated": {"$first": "$updated"},
                    "created": {"$first": "$created"}

                }
            }
        ], function (err, response) {
            if (!err)
                req.app.result = response;
            else if (!response.length)
                req.app.result = {error: err, message: 'Database error'};
            else
                req.app.result = {status: 302, message: 'No record found'};
            next();
        })
    }

// This Function executed to get insights data like(impression,clicks)
    function fetchFBadsData(profile, query, widget, dataResult, startDate, endDate) {
        console.log('data result', widget.metric, 'query', query)
        var storeDefaultValues = [];
        FB.setAccessToken(profile.accessToken);
        var tot_metric = [];
        Adsinsights(query);
        function Adsinsights(query) {
            FB.api(query, function (res) {
                console.log('fb ads result', widget.metric[0].objectTypes[0].meta.fbAdsMetricName, 'metric')
                var wholeData = [];
                var storeMetricName = widget.metric[0].objectTypes[0].meta.fbAdsMetricName;
                //controlled pagination Data

                if (res.paging && res.paging.next) {
                    for (var key in res.data)
                        tot_metric.push({total: res.data[key][storeMetricName], date: res.data[key].date_start});
                    var nextPage = res.paging.next;
                    var str = nextPage;
                    var recallApi = str.replace("https://graph.facebook.com/", " ").trim();
                    Adsinsights(recallApi);
                }

                else {
                    for (var key in res.data)
                        tot_metric.push({total: res.data[key][storeMetricName], date: res.data[key].date_start});

                    var obj_metric = tot_metric.length;
                    for (var j = 0; j < obj_metric; j++) {
                        //console.log('data', wholeData)
                        wholeData.push({date: tot_metric[j].date, total: tot_metric[j].total});
                    }
                    console.log('whole data', wholeData)
                    if (dataResult != 'No data') {

                        for (var index = 0; index < dataResult.data.length; index++) {

                            wholeData.push({'date': dataResult.data[index].date, 'total': dataResult.data[index].total})
                        }


                    }
                    console.log('after if');
                    var storeStartDate = new Date(startDate);
                    var storeEndDate = new Date(endDate);
                    console.log('storeStartDate',storeStartDate,'storeEndDate',storeEndDate)
                    var timeDiff = Math.abs(storeEndDate.getTime() - storeStartDate.getTime());
                    var diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24));
                    console.log('diffdays',diffDays)
                    for (var i = 0; i < diffDays; i++) {
                        var finalDate = calculateDate(storeStartDate);
                        storeDefaultValues.push({date: finalDate, total: 0});
                        storeStartDate.setDate(storeStartDate.getDate() + 1);
                        console.log('storeDefaultValues before ', storeDefaultValues)
                    }

                    //To replace the missing dates in whole data with empty values
                    var validData = wholeData.length;
                    for (var j = 0; j < validData; j++) {
                        for (var k = 0; k < storeDefaultValues.length; k++) {
                            if (wholeData[j].date === storeDefaultValues[k].date)
                                storeDefaultValues[k].total = wholeData[j].total;
                        }

                    }
                    console.log('storeDefaultValues', storeDefaultValues)
                    var now = new Date();

                    //Updating the old data with new one
                    Data.update({
                        'objectId': widget.widget.charts[0].metrics[0].objectId,
                        'metricId': widget.widget.charts[0].metrics[0].metricId
                    }, {
                        $setOnInsert: {created: now}, $set: {data: storeDefaultValues, updated: now}
                    }, {upsert: true}, function (err) {
                        if (err) console.log("User not saved");
                        else
                            getFbAdsData(widget);

                    });
                }

            })
        }
    }

    function selectTweetObjectType(intialResults) {
        //select object type

        if (err)
            req.app.result = {error: err, message: 'Database error'};
        else if (!profile)
            req.app.result = {status: 302, message: 'No record found'};
        else {

            //To select which object type
            switch (objectType.type) {
                case configAuth.objectType.twitter:
                    getTweetData(profile, channelDetails, widget, object, results);
                    break;

            }
        }

    }

    function getTweetData(results) {
        console.log('resullts', results.widget.charts[0].metrics);
        var dataResult = results.data;

        //To Get the Metrice Type throught widgetDetails
        //and get metricid and object id from object
        Metric.find({
            _id: results.widget.charts[0].metrics[0].metricId,
            objectTypes: {$elemMatch: {objectTypeId: results.widget.charts[0].metrics[0].objectTypeId}}
        }, function (err, response) {
            console.log('response', response)
            if (!err) {

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
                var metricType = response.name;
                if (dataResult != 'No data') {
                    var updated = calculateDate(dataResult.updated);
                    var currentDate = calculateDate(new Date());
                    d.setDate(d.getDate() + 1);
                    var endDate = calculateDate(d);
                    //if (updated < currentDate) {
                    var query = response[0].objectTypes[0].meta.TweetMetricName;
                    fetchTweetData(results.get_profile[0], metricType, query, results.widget, dataResult, response, results);
                    // }
                    /* else
                     sendFinalData(dataResult, response);*/
                }
                else {
                    var query = response[0].objectTypes[0].meta.TweetMetricName;
                    fetchTweetData(results.get_profile[0], metricType, query, results.widget, dataResult, response, results);
                }

            }
        });
    }

    //Fetch twitter data based on metrics
    function fetchTweetData(profile, metricType, query, widget, dataResult, metric, results) {

        var wholetweetData = [];
        var dataResult = results.data;
        if (metricType === configAuth.twitterMetric.Mentions || metricType === configAuth.twitterMetric.HighEngagementtweets) {
            client.get(query, function (error, tweets, response) {
                console.log('mentions data', tweets)
                var TweetObject;
                for (var i = 0; i < tweets.length; i++) {
                    TweetObject = tweets[i];
                    wholetweetData.push(TweetObject);
                }
                storeTweetData(wholetweetData, results, metric);
            });
        }
        else if (metricType === configAuth.twitterMetric.Keywordmentions) {
            client.get(query, {q: '%23' + profile.name}, function (error, tweets, response) {
                console.log('keyword mentions', tweets)
                var TweetObject;
                for (var i = 0; i < tweets.statuses.length; i++) {
                    TweetObject = tweets.statuses[i];
                    wholetweetData.push(TweetObject);

                }
                storeTweetData(wholetweetData, results, metric);
            });
        }
        else {

            // if (metric.code == configAuth.twitterMetric.tweets) {
            if (dataResult != 'No data') {
                var createdAt = new Date(Date.parse(dataResult.data[dataResult.data.length - 1].created_at.replace(/( +)/, ' UTC$1')));
                var totalCount = getDaysDifference(createdAt, new Date(req.body.startDate));
                callTweetApi(query, profile, totalCount, wholetweetData, widget, metric, dataResult, results);
            }
            else {
                var initialCount = 200;
                callTweetApi(query, profile, initialCount, wholetweetData, widget, metric, dataResult, results);
            }

            // }
            /*else{
             client.get(query, {screen_name: profile.name}, function (error, tweets, response) {
             console.log('tweets',tweets);
             var TweetObject;
             for (var i = 0; i < tweets.length; i++) {
             TweetObject = tweets[i];
             wholetweetData.push(TweetObject);

             }
             // storeTweetData(wholetweetData, widget, metric);

             });
             }*/
        }
        updated = new Date();

        /*//Updating the old data with new one
         function storeTweetData(wholetweetData, widget, metric) {


         Data.update({
         'objectId': widget.metrics[0].objectId,
         'metricId': widget.metrics[0].metricId
         }, {
         $set: {data: wholetweetData, updated: updated}
         }, {upsert: true}, function (err) {
         if (err) console.log("User not saved");
         else {
         Data.findOne({
         'objectId': widget.metrics[0].objectId,
         'metricId': widget.metrics[0].metricId
         }, function (err, response) {
         if (!err) {
         sendFinalData(response, metric);
         }

         else if (!response.length)
         req.app.result = {error: err, message: 'Database error'};
         else
         req.app.result = {status: 302, message: 'No record found'};
         next();
         })
         }
         });
         }*/
    }

    //Updating the old data with new one
    function storeTweetData(wholetweetData, results, metric) {
        console.log('store tweet data', results)
        Data.update({
            'objectId': results.widget.charts[0].metrics[0].objectId,
            'metricId': results.widget.charts[0].metrics[0].metricId
        }, {
            $set: {data: wholetweetData, updated: updated}
        }, {upsert: true}, function (err) {
            if (err) console.log("User not saved");
            else {
                console.log('update');
                Data.findOne({
                    'objectId': results.widget.charts[0].metrics[0].objectId,
                    'metricId': results.widget.charts[0].metrics[0].metricId
                }, function (err, response) {
                    if (!err) {
                        sendFinalData(response, metric);
                    }

                    else if (!response.length)
                        return res.status(500).json({});
                    else
                        return res.status(302).json({});

                })
            }
        });
    }

    //To get user timeline,tweets based on date range
    function callTweetApi(query, profile, count, wholetweetData, widget, metric, data, results, until, tweets) {
        console.log('data', data)
        if (data != undefined && data != 'No data') {
            // console.log('data reslt', data)
            for (var index = 0; index < data.data.length; index++)
                wholetweetData.push(data.data[index])
        }
        if (until == 1)
            var inputs = {screen_name: profile.name, count: count, max_id: tweets[tweets.length - 1].id};
        else
            var inputs = {screen_name: profile.name, count: count};
        client.get(query, inputs, function (error, tweets, response) {
            console.log('query', tweets, 'inputs', inputs)
            if (error)
                return res.status(500).json({});
            else {

                //push tweets into array
                var createdAt = new Date(Date.parse(tweets[tweets.length - 1].created_at.replace(/( +)/, ' UTC$1')));
                if (createdAt > new Date(req.body.startDate)) {
                    var totalCount = getDaysDifference(createdAt, new Date(req.body.startDate));
                    if (totalCount < 200)
                        callTweetApi(query, profile, totalCount, wholetweetData, widget, metric, data, '', 1, tweets);
                    else {
                        var count = totalCount % 200;
                        if (count == 0) {
                            var tempCount = totalCount / 200;
                            if (tempCount > 0) {
                                for (var i = 0; i < tempCount; i++)
                                    callTweetApi(query, profile, totalCount, wholetweetData, widget, metric, data, '', 1, tweets);
                            }
                        }
                        else
                            callTweetApi(query, profile, totalCount, wholetweetData, widget, metric, data, '', 1, tweets);
                    }
                }
                var TweetObject;
                for (var i = 0; i < tweets.length; i++) {
                    TweetObject = tweets[i];
                    wholetweetData.push(TweetObject);

                }
                storeTweetData(wholetweetData, results, metric);
            }

        });
    }

    //To send format the data from db and send to client
    function sendFinalData(response, metric) {
        console.log('final data')
        var param = [];
        var finaldataArray = [];
        var finalTweetResult = [];
        var storeTweetDetails = [];
        if (metric.code == configAuth.twitterMetric.tweets)
            param.push('statuses_count');
        else if (metric.name == 'Following')
            param.push('friends_count');
        else if (metric.name == 'Listed')
            param.push('listed_count');
        else if (metric.name == 'Followers')
            param.push('followers_count');
        else if (metric.name == 'Favourites')
            param.push('favourites_count');
        else if (metric.name == 'Retweets of your tweets')
            param.push('retweet_count');
        else if (metric.name == 'Mentions' || 'Keyword mentions')
            param.push('retweet_count', 'favorite_count');
        else
            param.push('retweet_count', 'favorite_count');
        if (response.data.length != 0) {
            console.log('response data', response.data.length)
            for (var key = 0; key < response.data.length; key++) {
                var totalArray = [];

                //To format twitter date
                var createdAt = new Date(Date.parse(response.data[key].created_at.replace(/( +)/, ' UTC$1')));
                var date = formatDate(createdAt);
                for (var index = 0; index < param.length; index++) {
                    if (param.length > 1) {
                        console.log('other metrics', param)
                        var total = response.data[key][param[index]];
                        var text = response.data[key].text;
                        totalArray.push(total);
                        console.log('total array', totalArray)
                        if (totalArray.length > 1) {
                            var title = param[index];
                            var finalDate = (date >= req.body.startDate && date <= req.body.endDate) ? storeTweetDetails.push({
                                date: date,
                                text: text,
                                retweet_count: totalArray[0],
                                favourite_count: totalArray[1]
                            }) : false;
                        }
                    }
                    else {
                        var total = response.data[key].user[param[index]];
                        totalArray.push({total: total, date: date});

                        //Get the required data based on date range
                        var finalDate = (date >= req.body.startDate && date <= req.body.endDate) ? storeTweetDetails.push({
                                total: total,
                                date: date
                            }
                        ) : false;
                    }
                }
            }
            if (metric.code == configAuth.twitterMetric.tweets)
                getTotalTweetsPerDay(storeTweetDetails, response);

            else {
                finaldataArray.push({metricId: response.metricId, objectId: response.objectId});
                finalTweetResult.push({
                    metricId: response.metricId,
                    objectId: response.objectId,
                    data: storeTweetDetails
                });
                console.log('fintweetdata', finalTweetResult[0].data);
                req.app.result = finalTweetResult;
                next();
            }

        }
        else {
            req.app.result = {Error: '500'};
            next();
        }

    }

    //To get tweet counts
    function getTotalTweetsPerDay(storeTweetDetails, response) {
        var result = {};
        var finalTweetCount = [];
        var finalTweetData = [];

        //To find the number of tweets
        for (var i = 0; i < storeTweetDetails.length; ++i) {
            if (!result[storeTweetDetails[i].date])
                result[storeTweetDetails[i].date] = 0;
            ++result[storeTweetDetails[i].date];
        }

        //Push the final tweet details in array
        for (var key in result) {
            var date = key;
            var total = result[key];
            finalTweetCount.push({date: date, total: total})
        }
        finalTweetData.push({metricId: response.metricId, objectId: response.objectId, data: finalTweetCount})
        req.app.result = finalTweetData;
        next();
    }
};