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
        get_channel: ['get_profile', 'metric', getChannel],
        get_channel_data_remote: ['get_channel', getChannelDataRemote],
        store_final_data: ['get_channel_data_remote', storeFinalData],
        get_channel_objects_db: ['get_channel_data_remote', getChannelDataDB]
    }, function (err, results) {
        console.log('error = ', err);
        console.log('Entire result = ', results.get_channel_objects_db);
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

        async.concatSeries(results.widget.charts, getEachData, callback);
    }

    function getEachData(results, callback) {
        var wholeData={}
        Data.findOne({
            'objectId': results.metrics[0].objectId,
            'metricId': results.metrics[0].metricId
        }, function(err,data){
            wholeData={data:data,metricId:results.metrics[0].metricId}
            checkNullData(callback(null,wholeData))
        });
    }

    //Function to get the data in metric collection
    function getMetricIdsFromRefWidget(results, callback) {

        async.concatSeries(results.widget.charts, getAllRefidgetId, callback)


    }

    //Function to get all  reference ids
    function getAllRefidgetId(results, callback) {

        refWidget.findById(results.refWidgetId, checkNullObject(callback))
    }

    //Function to get the data in metric collection
    function getMetric(results, callback) {
        async.concatSeries(results.widget.charts, findEachMetrics, callback);

    }

    //Function to get each metric details
    function findEachMetrics(results, callback) {
        Metric.find({
            _id: results.metrics[0].metricId,
            objectTypes: {$elemMatch: {objectTypeId: results.metrics[0].objectTypeId}}
        }, checkNullObject(callback))
    }


    //Function to get the data in widget collection
    function getWidget(callback) {
        Widget.findOne({'_id': req.params.widgetId}, {charts: 1, widgetType: 1}, checkNullObject(callback));
    }

    //Function to get the data in object collection
    function getObject(results, callback) {
        async.concatSeries(results.widget.charts, getEachObject, callback);
    }

    //Function to get each object details
    function getEachObject(results, callback) {
        Object.find({'_id': results.metrics[0].objectId}, {
            profileId: 1,
            channelObjectId: 1,
            objectTypeId: 1
        }, checkNullObject(callback));
    }

    //Function to get the data in profile collection
    function getProfile(results, callback) {
        async.concatSeries(results.object, getEachProfile, callback)
    }

    //Function to get all profile details
    function getEachProfile(results, callback) {
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
        async.concatSeries(results.get_profile, getEachChannel, callback);
    }

    //Function to get all channels detail
    function getEachChannel(results, callback) {
        channels.findOne({'_id': results.channelId}, {code: 1}, checkNullObject(callback));
    }

    //To call the respective function based on channel
    function getChannelDataRemote(initialResults, callback) {
        async.auto({
            get_each_channel_data: getEachChannelData
        }, function (err, results) {
            console.log('err = ', err);
            console.log('get data rem = ', results);
            if (err) {
                return callback(err, null);
            }
            callback(null, results);
        });
        function getEachChannelData(callback) {
            if (initialResults.widget.widgetType == 'fusion'){
                console.log('Inside IF statement of geteachchanneldata');
                async.concatSeries(initialResults.get_channel, dataForEachChannel, callback);
            }
            else {
                console.log('Inside ELSE statement of geteachchanneldata');
                var newChannelArray = [];
                newChannelArray.push(initialResults.get_channel[0]);
                async.concatSeries(newChannelArray, dataForEachChannel, callback);

            }

        }

        function dataForEachChannel(results, callback) {
            console.log('Inside DATAFOREACHCHANNEL');
            //To check the channel
            switch (results.code) {
                case configAuth.channels.googleAnalytics:
                    initializeGa(initialResults, callback);
                    break;
                case configAuth.channels.facebook:
                    getFBPageData(initialResults, callback);
                    break;
                case configAuth.channels.facebookAds:
                    getFBadsinsightsData(initialResults, callback);
                    break;
                case configAuth.channels.twitter:
                    getTweetData(initialResults);
                    break;
            }
        }
    }


    //Function to get facebook data
    function getFBPageData(initialResults, callback) {
        graph.setAccessToken(initialResults.get_profile[0].accessToken);
        async.auto({
            get_start_end_dates: getDates,
            get_object_list: ['get_start_end_dates', passQueryToGraphApi]

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
            console.log('getdates')
            work(initialResults.data, initialResults.metric, callback);
            function work(data, metric, done) {
                async.times(Math.min(data.length, metric.length), function (j, next) {
                    var d = new Date();
                    var queryObject = {};

                    //check already there is one year data in db
                    if (data[j].data != null) {
                        data[j].data.updated.setDate(data[j].data.updated.getDate());
                        d.setDate(d.getDate());
                        var updated = formatDate(data[j].data.updated);
                        var now = formatDate(new Date());
                        if (updated < now) {

                            //for(var i=0;i<)
                            var query = initialResults.object[0].channelObjectId + "/insights/" + metric[j].objectTypes[0].meta.fbMetricName + "?since=" + updated + "&until=" + now;
                            queryObject = {query:query,metricId:metric[j]._id};
                            next(null, queryObject);
                        }
                        else{
                            queryObject = {query:'DataFromDb'};
                            next(null,queryObject);
                        }

                    }

                    //To four queries to get one year data
                    else {
                        var d = new Date();
                        async.map([93, 93, 93, 86], setStartEndDate, function (err, query) {

                            next(null, query);
                        });

                    }


                    //To form query based on start end date for getting one year data
                    function setStartEndDate(n, callback) {
                        d.setDate(d.getDate());
                        var endDate = formatDate(d);
                        d.setDate(d.getDate() - n);
                        var startDate = formatDate(d);
                        var query = initialResults.object[0].channelObjectId + "/insights/" + metric[j].objectTypes[0].meta.fbMetricName + "?since=" + startDate + "&until=" + endDate;
                        queryObject = {query:query,metricId:metric[j]._id};
                        callback('', queryObject);
                    }
                }, done);

            }

            //async.concat(initialResults.data, getDatesForAllMetrics, callback);
        }


        //To pass the query to graph api
        function passQueryToGraphApi(results, callback) {
            console.log('results.get_start_end_dates',results.get_start_end_dates)
            async.concatSeries(results.get_start_end_dates, getDataForEachQuery, callback);
        }

        //To get facebook data
        function getDataForEachQuery(query, callback) {
            console.log('geteachdata query',query)
            if (typeof query.query == 'string')
                async.map([query], getDataForAllQuery, callback);
            else
                async.map(query, getDataForAllQuery, callback);

        }

        function getDataForAllQuery(query, callback) {
            if (query.query == 'DataFromDb')
                callback(null, 'DataFromDb');
            else {
                var queryResponse = {};
                console.log('Query for FB',query);
                graph.get(query.query, function (err, res) {
                    queryResponse = {res:res,metricId:query.metricId}
                    callback('', queryResponse);
                })
            }

        }


    }

    //To store the final result in db
    function storeFinalData(results, callback) {

        if (results.get_channel[0].code == configAuth.channels.googleAnalytics) {
            storeDataForGA(results.get_channel_data_remote.get_each_channel_data[0].call_get_analytic_data, results.data, results.widget.charts, callback);
            function storeDataForGA(dataFromRemote, dataFromDb, widget, done) {

                async.times(Math.min(dataFromRemote.length, dataFromDb.length), function (j, next) {
                    console.log('dataFromRemote', dataFromRemote[j])
                    if (dataFromRemote[j] === 'DataFromDb')
                        next(null, 'DataFromDb');
                    else {
                        var storeGoogleData = [];
                        var dimensionList = [];
                        var dimension;
                        if (req.body.dimensionList != undefined) {
                            dimensionList = req.body.dimensionList;
                            dimension = results.get_channel_data_remote.get_each_channel_data.get_dimension;
                        }
                        else {
                            dimensionList.push({'name': 'ga:date'});
                            dimension = results.get_channel_data_remote.get_each_channel_data.get_dimension;
                        }

                        //google analytics
                        //calculating the result length
                        var resultLength = dataFromRemote[j].data.rows.length;
                        var resultCount = dataFromRemote[j].data.rows[0].length - 1;
                        //console.log('resultLength', results)
                        //loop to store the entire result into an array
                        for (var i = 0; i < resultLength; i++) {
                            var obj = {};

                            //loop generate array dynamically based on given dimension list
                            for (var m = 0; m < dimensionList.length; m++) {
                                if (m == 0) {

                                    //date value is coming in the format of 20160301 so splitting like yyyy-mm--dd format
                                    var year = dataFromRemote[j].data.rows[i][0].substring(0, 4);
                                    var month = dataFromRemote[j].data.rows[i][0].substring(4, 6);
                                    var date = dataFromRemote[j].data.rows[i][0].substring(6, 8);
                                    obj[dimensionList[m].name.substr(3)] = [year, month, date].join('-');
                                    //obj['metricName'] = metricName;
                                    obj['total'] = dataFromRemote[j].data.rows[i][resultCount];
                                }
                                else {
                                    obj[dimensionList[m].name.substr(3)] = dataFromRemote[j].data.rows[i][m];
                                    //obj['metricName'] = metricName;
                                    obj['total'] = dataFromRemote[j].data.rows[i][resultCount];
                                }
                            }
                            storeGoogleData.push(obj);

                        }
                        // console.log('storeGoogleData',storeGoogleData)
                        // callback(null, storeGoogleData);

                        var now = new Date();
                        console.log(dataFromRemote[j].metricId, dataFromDb[j], 'dadadb', widget, widget[0], widget[0], 'dadafrom');
                        var wholeResponse = [];
                        if (dataFromDb[j].data != null) {
                            var metricId;
                            metricId = dataFromDb[j].metricId;

                            var finalData = [];
                            for (var r = 0; r < dataFromDb[j].data.data.length; r++) {

                                //merge old data with new one
                                wholeResponse.push(dataFromDb[j].data.data[r]);
                            }
                            for (var metricIndex in dataFromDb) {
                                for (var data in storeGoogleData) {
                                    // for (var metricIndex in dataFromDb) {
                                    console.log('ifremote', dataFromDb[j].metricId,dataFromRemote[j].metricId)
                                    // console.log('dbmetric',widget[metricIndex].metrics[0].metricId,'remotemetric',dataFromRemote[j].metricId,'index',metricIndex)
                                    if(dataFromRemote[j].metricId === dataFromDb[j].metricId){
                                        console.log('ifremote', dataFromRemote[j].metricId, dataFromDb[metricIndex].metricId)
                                        wholeResponse.push(storeGoogleData[data]);
                                    }

                                }

                            }
                            console.log('wholeResponselen', wholeResponse.length)
                        }

                        else {
                            console.log('elsedataa', dataFromRemote[j])
                            for (data in storeGoogleData)
                                wholeResponse.push(storeGoogleData[data]);
                            metricId = dataFromDb[j].metricId;

                        }
                        console.log('updatequery', metricId)
                        var now = new Date();

                        //Updating the old data with new one
                        Data.update({
                            'objectId': widget[j].metrics[0].objectId,
                            'metricId': dataFromRemote[j].metricId
                        }, {
                            $setOnInsert: {created: now},
                            $set: {data: wholeResponse, updated: now}
                        }, {upsert: true}, function (err) {
                            if (err) console.log("User not saved");
                            else {
                                next(null, 'success')
                            }
                        })
                    }


                }, done);
            }

        }

        else if (results.get_channel[0].code == configAuth.channels.facebook) {
            console.log('res1', results.data.length, results.widget.charts.length, 'widgetdata', results.get_channel_data_remote.get_each_channel_data.length, 'data1', results.get_channel_data_remote.get_each_channel_data[0])
            storeDataForFB(results.get_channel_data_remote.get_each_channel_data, results.data, results.widget.charts, results.metric, callback);
            function storeDataForFB(dataFromRemote, dataFromDb, widget, metric, done) {


                console.log('works', widget)
                async.times(Math.min(widget.length, dataFromDb.length), function (j, next) {
                    console.log('dataFromRemote[j]', j, dataFromRemote)
                   // console.log('data from server', dataFromRemote[j])
                    //Array to hold the final result
                    var finalData = [];
                    for (var key in dataFromRemote) {
                      //  console.log('dataFromRemote[key]', dataFromRemote[key])
                        if (dataFromRemote[key] === 'DataFromDb')
                            finalData.push();
                        else {
                            for (var index in dataFromRemote[key].res.data[0].values) {
                                var value = {};
                                value = {
                                    total: dataFromRemote[key].res.data[0].values[index].value,
                                    date: dataFromRemote[key].res.data[0].values[index].end_time.substr(0, 10)
                                };

//                                console.log('metricc',metric[j].objectTypes[0].meta.fbMetricName, dataFromRemote.res[key].data[0].name,dataFromRemote[key]);
                                //if (metric[j].objectTypes[0].meta.fbMetricName == dataFromRemote[key].data[0].name)
                                if (metric[j]._id == dataFromRemote[key].metricId){
                                    console.log('remote metric check',metric[j]._id,dataFromRemote[key].metricId)
                                    finalData.push(value);
                                }

                            }

                        }
                    }

                    //console.log(finalData, 'datadb')
                    if (dataFromRemote[j] != 'DataFromDb') {
                        if (dataFromDb[j].data !=null) {


                            if (metric[j]._id == dataFromRemote[j].metricId){

                                //merge the old data with new one and update it in db
                                for (var key = 0; key < dataFromDb[j].data.data.length; key++) {
                                    finalData.push(dataFromDb[j].data.data[key]);
                                }
                                var metricId = metric._id;
                            }



                        }
                      //  console.log('finalDatafinalData', metricId)
                        var now = new Date();

                       /* for (var metricIndex in dataFromDb) {
                        //    console.log('ifremote',metric[metricIndex]._id, dataFromRemote[j].data[0].name, dataFromDb[metricIndex].metricId)
                            // console.log('dbmetric',widget[metricIndex].metrics[0].metricId,'remotemetric',dataFromRemote[j].metricId,'index',metricIndex)
                            if(metric[j]._id == dataFromRemote[j].metricId ){

                                var metricId = metric[j]._id;
                                console.log('metric id',metricId,)
                            }

                        }*/
                        //Updating the old data with new one
                        Data.update({
                            'objectId': widget[j].metrics[0].objectId,
                            'metricId': metric[j]._id
                        }, {
                            $setOnInsert: {created: now},
                            $set: {data: finalData, updated: now}
                        }, {upsert: true}, function (err) {
                            if (err) console.log("User not saved");
                            else
                                next(null, 'success')
                        });
                    }
                    else
                        next(null, 'success')
                }, done);


            }

        }
        else if (results.get_channel[0].code == configAuth.channels.facebookAds) {
            console.log('fbads results', results.get_channel_data_remote.get_each_channel_data[0].get_fb_ads_data_from_remote)
            storeDataForFBAds(results.get_channel_data_remote.get_each_channel_data[0].get_fb_ads_data_from_remote, results.data, results.widget.charts,results.metric,callback);
            function storeDataForFBAds(dataFromRemote, dataFromDb, widget,metric, done) {
                async.times(Math.min(dataFromRemote.length, dataFromDb.length), function (j, next) {
                    var finalData = [];
                    console.log('dataFromRemote', metric,dataFromRemote[j])
                    if (dataFromRemote[j].data === 'DataFromDb')
                        next(null, 'DataFromDb');
                    else {
                        console.log('else datad',metric[j],metric[j].objectTypes[0].meta.fbMetricName,dataFromRemote[j].metricId)
                        //if (dataFromDb[j].data != null) {


                        for (var data in dataFromRemote[j].data) {
                            if (metric[j]._id == dataFromRemote[j].metricId)
                            finalData.push(dataFromRemote[j].data[data]);

                            /*if (metric[j].objectTypes[0].meta.fbAdsMetricName == dataFromRemote[j].metricId)
                             finalData.push(dataFromRemote[j].data[data]);*/
                            /* if (dataFromRemote[j].metricId == dataFromDb[j].metricId)
                             finalData.push(dataFromRemote[j].data[data]);*/
                        }

                    }
                    /* else {
                     for (data in dataFromRemote[j].data)
                     finalData.push(dataFromRemote[j].data[data]);

                     }*/
                    if (dataFromRemote[j] != 'DataFromDb') {
                        if (dataFromDb[j].data != null) {
                            for (var r = 0; r < dataFromDb[j].data.data.length; r++) {

                                //merge old data with new one
                                finalData.push(dataFromDb[j].data.data[r]);
                            }
                        }

                        console.log('fbads data', finalData)
                        var now = new Date();


                        //Updating the old data with new one
                        Data.update({
                            'objectId': widget[j].metrics[0].objectId,
                            'metricId': dataFromRemote[j].metricId
                        }, {
                            $setOnInsert: {created: now}, $set: {data: finalData, updated: now}
                        }, {upsert: true}, function (err) {
                            if (err) console.log("User not saved");
                            else
                                next(null, 'success')

                        });

                    }
                    else
                        next(null,'success')
                }, done);
            }
        }


    }


    //Get the data from db
    function getChannelDataDB(results, callback) {
        // work(results.widget.charts, callback);
        console.log('results.widget.charts', results.widget.charts.length)
        async.concatSeries(results.widget.charts, getEachDataFromDb, callback);
        /*function work(widget, done) {
         async.times(widget.length, function (j, next) {
         console.log('work', widget[j].metrics[0].objectId,'metricid',widget[j].metrics[0].metricId)


         }, done);
         }*/
    }

    function getEachDataFromDb(widget, callback) {
        console.log('getdata')
        Data.aggregate([
                // Unwind the array to denormalize
                {"$unwind": "$data"},
                // Match specific array elements
                {
                    "$match": {
                        $and: [{"data.date": {$gte: req.body.startDate}}, {"data.date": {$lte: req.body.endDate}},
                            {"objectId": widget.metrics[0].objectId},
                            {"metricId": widget.metrics[0].metricId}]
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
                }]
            , function (err, response) {
                console.log('err', err, 'resposne', response);
                callback(null, response)
            })
    }

    //set oauth credentials and get object type details
    function initializeGa(results, callback) {
        console.log('ga', results);
        oauth2Client.setCredentials({
            access_token: results.get_profile[0].accessToken,
            refresh_token: results.get_profile[0].refreshToken
        });

        googleDataEntireFunction(results, callback);
    }

    //to get google analtic data
    function googleDataEntireFunction(results, callback) {


        async.auto({
            get_dimension: getDimension,
            check_data_exist: ['get_dimension', checkDataExist],
            call_get_analytic_data: ['check_data_exist', analyticData]
        }, function (err, results) {
            // console.log('err = ', err);
            //console.log('result in switch = ', results.call_get_analytic_data);
            if (err) {
                return callback(err, null);
            }
            callback(null, results);
        });

        function getDimension(callback) {
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
                callback(null, dimension);
            }

            //if user didn't specify any dimension
            else {
                dimensionList.push({'name': 'ga:date'});
                dimension = 'ga:date';
            }
            callback(null, dimension);
        }

        function checkDataExist(dimension, callback) {
            var data = results.data;
            var metric = results.metric;
            var object = results.object;
            var widget = results.widget.charts;
            oauth2Client.refreshAccessToken(function (err, tokens) {
                console.log('tokens', tokens)
                profile.token = tokens.access_token;
                oauth2Client.setCredentials({
                    access_token: tokens.access_token,
                    refresh_token: tokens.refresh_token
                });
                console.log('oauth2Client', results);
                work(data, metric, object, widget, callback);
                function work(data, metric, object, widget, done) {
                    var allObjects = {};
                    async.times(metric.length, function (i, next) {

                        // var metricName = results.metric[0].objectTypes[0].meta.gaMetricName;
                        console.log('data[i] != ', metric[i]._id,data[i].metricId)
                        var d = new Date();

                        if (data[i].data != null ) {
                            console.log('metricdataa',  metric[i], i, Math.min(widget.length, metric.length))
                            console.log('ifdd', data[i])
                            var startDate = formatDate(data[i].data.updated);
                            var endDate = formatDate(d);
                            console.log('startdates', startDate, 'end.', endDate);
                            if (startDate < endDate) {
                                console.log('if data', data[i].metricId, startDate, endDate)
                                //async.concat(results.metric, setEachMetric, callback);
                                // function setEachMetric(metric, callback) {
                                allObjects = {
                                    oauth2Client: oauth2Client,
                                    object: object[i],
                                    dimension: dimension,
                                    metricName: metric[i].objectTypes[0].meta.gaMetricName,
                                    startDate: startDate,
                                    endDate: endDate,
                                    response: results.response,
                                    data: results.data,
                                    results: results,
                                    metricId: data[i].metricId
                                };
                                //var dataResultDetails = analyticData(oauth2Client, results.object, dimension.get_dimension, metric.objectTypes[0].meta.gaMetricName, startDate, endDate, results.response, results.data, results);
                                next(null, allObjects);
                            }
                            else
                            {
                                console.log('metricdataa', metric[i], i, Math.min(widget.length, metric.length))
                                next(null, 'DataFromDb');
                            }

                        }
                        else {
                            console.log('elsedd', metric[i]._id)
                            //call google api
                            d.setDate(d.getDate() - 365);
                            var startDate = formatDate(d);
                            var endDate = formatDate(new Date());
                            // async.concat(results.metric, setEachMetric, callback);
                            // function setEachMetric(metric, callback) {

                            allObjects = {
                                oauth2Client: oauth2Client,
                                object: object[i],
                                dimension: dimension,
                                metricName: metric[i].objectTypes[0].meta.gaMetricName,
                                startDate: startDate,
                                endDate: endDate,
                                response: results.response,
                                data: data[i],
                                results: results,
                                metricId: data[i].metricId
                            };
                            next(null, allObjects);

                        }
                    }, done);
                }
            });
            console.log('oauth2Client1', oauth2Client)


        }

        //to get the final google analytic data
        function analyticData(allObjects, callback) {
            console.log('pass query', allObjects);
            console.log('allobjects array', allObjects)
            async.concatSeries(allObjects.check_data_exist, getAllMetricData, callback);

        }

        function getAllMetricData(allObjects, callback) {
            var finalData = {};
            console.log('allmetrics', allObjects);
            if (allObjects === 'DataFromDb')
                callback(null, 'DataFromDb');
            else {
                var dimensionList;
                var dimension;
                if (req.body.dimensionList != undefined) {
                    dimensionList = req.body.dimensionList;
                    dimension = allObjects.dimension;
                }
                else {
                    dimensionList = allObjects.dimension;
                    dimension = 'ga:date';
                }

                /**Method to call the google api
                 * @param oauth2Client - set credentials
                 */
                analytics.data.ga.get({
                        'auth': allObjects.oauth2Client,
                        'ids': 'ga:' + allObjects.object.channelObjectId,
                        'start-date': allObjects.startDate,
                        'end-date': allObjects.endDate,
                        'dimensions': dimension,
                        'metrics': allObjects.metricName,
                        prettyPrint: true
                    }, function (err, result) {
                        if (err) {
                            console.log('if error', err);
                            googleDataEntireFunction(allObjects.results, callback);

                        }
                        else {

                            finalData = {metricId: allObjects.metricId, data: result};
                            console.log('else api', finalData);
                            callback(null, finalData);
                        }
                    }
                );
            }
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
    function getFBadsinsightsData(initialResults, callback) {
        async.auto({
            call_fb_ads_data: callFetchFBadsData,
            get_fb_ads_data_from_remote: ['call_fb_ads_data', fetchFBadsData],
        }, function (err, results) {
            console.log('err = ', err);
            console.log('get data rem = ', results);
            if (err) {
                return callback(err, null);
            }
            callback(null, results);
        });
        function callFetchFBadsData(callback) {
            work(initialResults.data, initialResults.object, initialResults.get_profile, callback);
            function work(data, object, profile, done) {

                async.times(Math.min(data.length, object.length), function (j, next) {
                    console.log('work', data[j])
                    var adAccountId = initialResults.object[j].channelObjectId;
                    d = new Date();
                    var allObjects = {};

                    //to form query based on start end date
                    function setStartEndDate(n) {
                        d.setDate(d.getDate() + 1);
                        var endDate = calculateDate(d);
                        d.setDate(d.getDate() - n);
                        var startDate = calculateDate(d);
                        var query = "v2.5/" + adAccountId + "/insights?limit=5&time_increment=1&fields=" + initialResults.metric[0].objectTypes[0].meta.fbAdsMetricName + '&time_range[since]=' + startDate + '&time_range[until]=' + endDate;
                        //var query = pageId + "/insights/" + response.meta.fbAdsMetricName + "?since=" + startDate + "&until=" + endDate;
                        allObjects = {
                            profile: initialResults.get_profile[j],
                            query: query,
                            widget: initialResults.metric[j],
                            dataResult: data[j],
                            startDate: startDate,
                            endDate: endDate
                        }
                        next(null, allObjects);
                        //fetchFBadsData(initialResults.get_profile[0], query, initialResults, initialResults.data, startDate, endDate);
                    }

                    if (data[j].data != null) {
                        console.log('data no empty data')
                        var updated = calculateDate(data[j].data.updated);
                        var currentDate = calculateDate(new Date());
                        d.setDate(d.getDate() + 1);
                        var startDate = calculateDate(d);
                        var oneDay = 24 * 60 * 60 * 1000; // hours*minutes*seconds*milliseconds
                        if (updated < currentDate) {
                            var query = "v2.5/" + adAccountId + "/insights?limit=5&time_increment=1&fields=" + initialResults.metric[0].objectTypes[0].meta.fbAdsMetricName + '&time_range[since]=' + updated + '&time_range[until]=' + startDate;
                            //var query = pageId + "/insights/" + response.meta.fbMetricName + "?since=" + updated + "&until=" + endDate;
                            allObjects = {
                                profile: initialResults.get_profile[j],
                                query: query,
                                widget: initialResults.metric[j],
                                dataResult: data[j].data,
                                startDate: updated,
                                endDate: currentDate
                            }
                            next(null, allObjects);
                            //fetchFBadsData(initialResults.get_profile[0], query, initialResults, initialResults.data, updated, currentDate);
                        }
                        else
                            next(null, 'DataFromDb');
                    }
                    else {
                        setStartEndDate(365);
                    }

                }, done)
            }
        }


    }

    //To get data based on start date ,end date
    function getFbAdsData(widget) {
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
    function fetchFBadsData(allObjects, callback) {


        console.log('fetchfbads data', allObjects.call_fb_ads_data);
        work(allObjects, callback);
        function work(allObjects, done) {
            console.log('allobj', allObjects)
            async.times(allObjects.call_fb_ads_data.length, function (times, next) {
                console.log('allla',allObjects.call_fb_ads_data[times])
                if (allObjects.call_fb_ads_data[times] === 'DataFromDb')
                    next(null, 'DataFromDb');
                else {
                    var storeDefaultValues = [];
                    FB.setAccessToken(allObjects.call_fb_ads_data[times].profile.accessToken);
                    var tot_metric = [];
                    var finalData = {};
                    var query = allObjects.call_fb_ads_data[times].query;
                    console.log('queryy', query)
                    Adsinsights(query);
                    function Adsinsights(query) {
                        FB.api(query, function (res) {
                            console.log('adsdataquery', res)
                            var wholeData = [];
                            var storeMetricName = allObjects.call_fb_ads_data[times].widget._id;
                            //controlled pagination Data

                            if (res.paging && res.paging.next) {
                                for (var key in res.data)
                                    tot_metric.push({
                                        total: res.data[key][storeMetricName],
                                        date: res.data[key].date_start
                                    });
                                var nextPage = res.paging.next;
                                var str = nextPage;
                                var recallApi = str.replace("https://graph.facebook.com/", " ").trim();
                                Adsinsights(recallApi);
                            }

                            else {
                                console.log('dadd',res)
                                for (var key in res.data)
                                    tot_metric.push({
                                        total: res.data[key][storeMetricName],
                                        date: res.data[key].date_start
                                    });

                                var obj_metric = tot_metric.length;
                                for (var j = 0; j < obj_metric; j++) {
                                    //console.log('data', wholeData)
                                    wholeData.push({date: tot_metric[j].date, total: tot_metric[j].total});
                                }
                                if (allObjects.call_fb_ads_data[times].dataResult != 'No data')   console.log('after if');
                                var storeStartDate = new Date(allObjects.call_fb_ads_data[times].startDate);
                                var storeEndDate = new Date(allObjects.call_fb_ads_data[times].endDate);

                                var timeDiff = Math.abs(storeEndDate.getTime() - storeStartDate.getTime());
                                var diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24));
                                for (var i = 0; i < diffDays; i++) {
                                    var finalDate = calculateDate(storeStartDate);
                                    storeDefaultValues.push({date: finalDate, total: 0});
                                    storeStartDate.setDate(storeStartDate.getDate() + 1);
                                }

                                //To replace the missing dates in whole data with empty values
                                var validData = wholeData.length;
                                for (var j = 0; j < validData; j++) {
                                    for (var k = 0; k < storeDefaultValues.length; k++) {
                                        if (wholeData[j].date === storeDefaultValues[k].date)
                                            storeDefaultValues[k].total = wholeData[j].total;
                                    }

                                }

                                finalData = {
                                    metricId: storeMetricName,
                                    data: storeDefaultValues
                                };
                                console.log('finalDatametricname', storeMetricName)
                                next(null, finalData);
                                /*  var now = new Date();

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

                                 });*/
                            }

                        })
                    }
                }
            }, done)
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
            //console.log('responsee', response)
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
                var metricType = response[0].name;
                if (dataResult != 'No data') {
                    var updated = calculateDate(dataResult.updated);
                    var currentDate = calculateDate(new Date());
                    d.setDate(d.getDate() + 1);
                    var endDate = calculateDate(d);
                    //if (updated < currentDate) {
                    var query = response[0].objectTypes[0].meta.TweetMetricName;
                    console.log('queryyy', metricType);
                    fetchTweetData(results.get_profile[0], metricType, query, results.widget, dataResult, response, results);
                    // }
                    /* else
                     sendFinalData(dataResult, response);*/
                }
                else {
                    console.log('metricTypemetricType', metricType)
                    var query = response[0].objectTypes[0].meta.TweetMetricName;
                    fetchTweetData(results.get_profile[0], metricType, query, results.widget, dataResult, response, results);
                }

            }
        });
    }

    //Fetch twitter data based on metrics
    function fetchTweetData(profile, metricType, query, widget, dataResult, metric, results) {
        // console.log('fetchdata', results)
        var wholetweetData = [];
        var dataResult = results.data;
        if (dataResult != 'No data') {

            var createdAt = new Date(Date.parse(dataResult.data[dataResult.data.length - 1].created_at.replace(/( +)/, ' UTC$1')));
            console.log('createdat', createdAt, new Date(req.body.startDate));
            var totalCount = getDaysDifference(calculateDate(createdAt), calculateDate(new Date(req.body.startDate)));
            var startDateFromClient = new Date(req.body.startDate);
            console.log('if caltweetapi result', totalCount, createdAt, new Date(req.body.startDate));
            if (startDateFromClient > createdAt) {
                console.log('total', totalCount)
                callTweetApi(query, profile, totalCount, wholetweetData, widget, metric, dataResult, results, '', '', '', metricType, '', '');
            }

            else
                sendFinalData(dataResult, metric)
            //callTweetApi(query, profile, totalCount, wholetweetData, widget, metric, dataResult, results, metricType);
        }
        else {
            var initialCount = 200;
            //console.log('else data', results)
            callTweetApi(query, profile, initialCount, wholetweetData, widget, metric, dataResult, results, '', '', '', metricType, '', '');
        }

        updated = new Date();

    }

    //Updating the old data with new one
    function storeTweetData(wholetweetData, results, metric, noTweet, data) {
        console.log('wholetweetData[wholetweetData.length-1].created_at', wholetweetData[0].created_at, wholetweetData[wholetweetData.length - 1].created_at, 'noTweet', noTweet)
        var storeDefaultValues = [];
        var defaultTweetValues = {};
        var defaultTweetDataArray = [];
        // console.log('results storeTweetData', wholetweetData);

        if (metric[0].name == configAuth.twitterMetric.Keywordmentions) {
            var storeStartDate = new Date(Date.parse(wholetweetData.statuses[0].created_at.replace(/( +)/, ' UTC$1')));
            var storeEndDate = new Date(req.body.startDate);
            if (storeStartDate > storeEndDate) {
                console.log('date')
                var storeStartDate = new Date(Date.parse(wholetweetData.statuses[wholetweetData.statuses.length - 1].created_at.replace(/( +)/, ' UTC$1')));

            }
            else {
                var storeStartDate = new Date(Date.parse(wholetweetData.statuses[0].created_at.replace(/( +)/, ' UTC$1')));

            }
            var storeEndDate = new Date(req.body.startDate);
            storeEndDate.setDate(storeEndDate.getDate() + 1);
        }
        else {
            var storeStartDate = new Date(Date.parse(wholetweetData[0].created_at.replace(/( +)/, ' UTC$1')));
            var storeEndDate = new Date(req.body.startDate);
            if (storeStartDate > storeEndDate) {
                console.log('datee')
                var storeStartDate = new Date(Date.parse(wholetweetData[wholetweetData.length - 1].created_at.replace(/( +)/, ' UTC$1')));

            }
            else {
                var storeStartDate = new Date(Date.parse(wholetweetData[0].created_at.replace(/( +)/, ' UTC$1')));

            }


            storeEndDate.setDate(storeEndDate.getDate() + 1);
        }


        //var storeStartDate = new Date(Date.parse(dataResult.data[dataResult.data.length - 1].created_at.replace(/( +)/, ' UTC$1')));
        //var storeEndDate = new Date(endDate);

        var timeDiff = Math.abs(storeEndDate.getTime() - storeStartDate.getTime());
        var diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24));
        // var d = new Date(day, month, date, hours, minutes, seconds, year);
        //  console.log('dd',d);

        console.log('start date', storeStartDate, storeStartDate, 'diff', diffDays, 'end date', storeEndDate);

        var d = new Date();
        var customFormat = d.toString().slice(0, 7) + ' ' +              //Day and Month
            d.getDate() + ' ' +                          //Day number
            d.toTimeString().slice(0, 8) + ' ' +          //HH:MM:SS
            /\(.*\)/g.exec(d.toString())[0].slice(1, -1)  //TimeZone
            + ' ' + d.getFullYear();                    //Year
        //console.log('d', customFormat);

        defaultTweetDataArray.push(defaultTweetValues);
        //console.log('default', defaultTweetDataArray)
        for (var i = 0; i < diffDays; i++) {

            var finalDate = calculateDate(storeStartDate);
            defaultTweetValues = {
                created_at: finalDate,
                text: 'No data for this date',
                user: {statuses_count: 0, friends_count: 0, listed_count: 0, followers_count: 0, favourites_count: 0},
                retweet_count: 0,
                favorite_count: 0
            }
            storeDefaultValues.push(defaultTweetValues);
            //storeDefaultValues.push(defaultTweetDataArray);
            storeStartDate.setDate(storeStartDate.getDate() + 1);
        }

        // console.log('storeDefaultValues',storeDefaultValues,' wholetweetData.length', wholetweetData.length)
        //To replace the missing dates in whole data with empty values
        var validData = wholetweetData.length;
        //console.log('validta',validData,'storeDefaultValues.length',storeDefaultValues)
        for (var j = 0; j < validData; j++) {
            for (var k = 0; k < storeDefaultValues.length; k++) {

                if (metric[0].name == configAuth.twitterMetric.Keywordmentions)
                    var tweetCreatedAt = calculateDate(new Date(Date.parse(wholetweetData.statuses[j].created_at.replace(/( +)/, ' UTC$1'))));
                else
                    var tweetCreatedAt = calculateDate(new Date(Date.parse(wholetweetData[j].created_at.replace(/( +)/, ' UTC$1'))));
                //console.log('tweetcreatedatt',tweetCreatedAt,storeDefaultValues[k].created_at)
                if (tweetCreatedAt === storeDefaultValues[k].created_at) {
                    storeDefaultValues[k] = wholetweetData[j];
                    // console.log('data store default values',storeDefaultValues[k],wholetweetData[j])
                }

            }

        }
        console.log('storeDefaultValues1', storeDefaultValues[0]);

        var now = new Date();
        Data.update({
            'objectId': results.widget.charts[0].metrics[0].objectId,
            'metricId': results.widget.charts[0].metrics[0].metricId
        }, {
            $set: {data: storeDefaultValues, updated: now}
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

    function checkMentionsInClientInput(until, count, tweets, mentionsProfile) {
        console.log('until', until)

        //To check whether the metric is mention or not
        if (req.body.mentions != undefined) {
            if (tweets != undefined && tweets != '') {
                if (until == 1)
                    var inputs = {screen_name: mentionsProfile, count: count, since_id: tweets[0].id};
                else
                    var inputs = {screen_name: mentionsProfile, count: count};
            }
            else {
                if (until == 1)
                    var inputs = {screen_name: mentionsProfile, count: count, since_id: tweets[0].id};
                else
                    var inputs = {screen_name: mentionsProfile, count: count};
            }


        }
        else {
            if (until == 1)
                var inputs = {count: count, since_id: tweets[0].id};
            else
                var inputs = {count: count};
        }
        return inputs;
    }

    //To get user timeline,tweets based on date range
    function callTweetApi(query, profile, count, wholetweetData, widget, metric, data, results, until, tweets, tempCount, metricType, tempCount, i) {
        console.log('dataquery1', tweets[0])
        if (data != undefined && data != 'No data') {

            // console.log('data reslt', data)
            for (var index = 0; index < data.data.length; index++)
                wholetweetData.push(data.data[index])
        }
        console.log('noo data');
        if (metric[0].name === configAuth.twitterMetric.Keywordmentions) {
            if (tweets != undefined && tweets != '') {
                if (until == 1)
                    var inputs = {
                        q: '%23' + profile.name,
                        count: count,
                        since_id: tweets.statuses[0].id
                    };
                else
                    var inputs = {q: '%23' + profile.name, count: count};
            }
            /* else
             return res.status(500).json({error: 'Error'});*/

        }
        else if (metric[0].name === configAuth.twitterMetric.Mentions || metricType === configAuth.twitterMetric.HighEngagementtweets) {
            console.log('else mentions');
            if (tweets != undefined && tweets != '') {
                var inputs = checkMentionsInClientInput(until, count, tweets)

            }
            //To check whether the metric is mention or not
            if (req.body.mentions != undefined) {

                var inputs = checkMentionsInClientInput(until, count, tweets, req.body.mentions)
            }
            else {
                var inputs = checkMentionsInClientInput(until, count, tweets)
            }
        }
        else
            var inputs = checkMentionsInClientInput(until, count, tweets, profile.name)


        if (data != 'No data' || tweets != '') {
            console.log('no data', results);
            if (tweets != undefined && tweets != '') {
                var TweetObject;
                for (var i = 0; i < tweets.length; i++) {
                    TweetObject = tweets[i];
                    wholetweetData.push(TweetObject);

                }
                console.log('tweets length', wholetweetData.length);
                var createdAt = new Date(Date.parse(tweets[0].created_at.replace(/( +)/, ' UTC$1')));
                // console.log('store results', results);
                //   storeTweetData(wholetweetData, results, metric, tempCount);
            }
            else {

                var createdAt = new Date(Date.parse(data.data[data.data.length - 1].created_at.replace(/( +)/, ' UTC$1')));
                console.log('else', createdAt)
            }
            console.log('temp count', tempCount)
            if (tempCount - 1 == i || tempCount == undefined || tempCount == '') {
                console.log('temp count', createdAt, new Date(req.body.startDate), tempCount, 'i', i)
                if (new Date(req.body.startDate) > createdAt) {
                    var totalCount = getDaysDifference(createdAt, new Date(req.body.startDate));
                    console.log('total count', totalCount, createdAt, new Date(req.body.startDate))
                    callTweetApiBasedCondition(query, profile, totalCount, wholetweetData, widget, metric, data, results, until, tweets, createdAt, inputs);
                }

                else
                //call data from db
                    sendFinalData(data, metric);
            }


        }
        else {
            // console.log('dataquery elsee', results)
            //var createdAt = new Date(Date.parse(tweets[tweets.length - 1].created_at.replace(/( +)/, ' UTC$1')));
            callTweetApiBasedCondition(query, profile, 200, wholetweetData, widget, metric, data, results, until, tweets, '', inputs)
        }

    }

    function callTweetApiBasedCondition(query, profile, totalCount, wholetweetData, widget, metric, data, results, until, tweets, createdAt, inputs) {
        console.log('query', query, 'inputs', wholetweetData.length)
        client.get(query, inputs, function (error, tweets, response) {
            console.log('total tweets for high ', query, tweets)


            if (error)
                return res.status(500).json({});
            else if (tweets.length == 0) {
                console.log('tweets', tweets.length, 'else if')
                storeTweetData(wholetweetData, results, metric, 1);
            }


            // return res.status(500).json({});
            else {
                if (data == 'No data') {
                    if (metric[0].name == configAuth.twitterMetric.Keywordmentions) {
                        var createdAt = new Date(Date.parse(tweets.statuses[0].created_at.replace(/( +)/, ' UTC$1')));
                    }
                    else
                        var createdAt = new Date(Date.parse(tweets[0].created_at.replace(/( +)/, ' UTC$1')));

//                var totalCount = getDaysDifference(createdAt, new Date(req.body.startDate));
                }
                else {

                    var createdAt = data.updated;

//                var totalCount = getDaysDifference(createdAt, new Date(req.body.startDate));
                }
                console.log('new Date(req.body.startDate) > createdAt', new Date(req.body.startDate), createdAt);
                if (new Date(req.body.startDate) > createdAt && createdAt.setDate(createdAt.getDate() + 1) != new Date()) {

                    console.log('tweet if', totalCount, req.body.startDate, createdAt)
                    var totalCount = getDaysDifference(createdAt, new Date(req.body.startDate));
                    if (new Date(req.body.startDate) > createdAt) {
                        if (totalCount < 200)
                            callTweetApi(query, profile, totalCount, wholetweetData, widget, metric, data, results, 1, tweets);
                        else {
                            console.log('looping else');
                            var count = totalCount % 200;
                            //if (count == 0) {
                            var tempCount = totalCount / 200;
                            console.log('temp count', tempCount);
                            if (tempCount > 0) {
                                for (var i = 0; i < tempCount; i++) {
                                    console.log('i count', i, tweets.length)
                                    callTweetApi(query, profile, totalCount, wholetweetData, widget, metric, data, results, 1, tweets, tempCount, i);
                                }

                            }
                            // }
                            /* else
                             callTweetApi(query, profile, totalCount, wholetweetData, widget, metric, data, results, 1, tweets);*/
                        }
                    }

                }
                var TweetObject;
                for (var i = 0; i < tweets.length; i++) {
                    TweetObject = tweets[i];
                    wholetweetData.push(TweetObject);

                }

                storeTweetData(wholetweetData, results, metric, data);
                //console.log('storersult',wholetweetData.length,'tweets.length',tweets.length,wholetweetData[0].created_at);

            }

        });
    }

    //To send format the data from db and send to client
    function sendFinalData(response, metric) {
        console.log('send final data')
        var param = [];
        var finaldataArray = [];
        var finalTweetResult = [];
        var storeTweetDetails = [];
        if (metric[0].code == configAuth.twitterMetric.tweets)
            param.push('statuses_count');
        else if (metric[0].name == 'Following')
            param.push('friends_count');
        else if (metric[0].name == 'Listed')
            param.push('listed_count');
        else if (metric[0].name == 'Followers')
            param.push('followers_count');
        else if (metric[0].name == 'Favourites')
            param.push('favourites_count');
        else if (metric[0].name == 'Retweets of your tweets')
            param.push('retweet_count');
        else if (metric[0].name == 'Mentions' || 'Keyword mentions')
            param.push('retweet_count', 'favorite_count');
        else
            param.push('retweet_count', 'favorite_count');
        if (response.data.length != 0) {

            for (var key = 0; key < response.data.length; key++) {
                var totalArray = [];

                //To format twitter date
                var createdAt = new Date(Date.parse(response.data[key].created_at.replace(/( +)/, ' UTC$1')));
                var date = formatDate(createdAt);

                for (var index = 0; index < param.length; index++) {
                    if (param.length > 1) {

                        var total = response.data[key][param[index]];
                        var text = response.data[key].text;
                        totalArray.push(total);

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
            if (metric[0].code == configAuth.twitterMetric.tweets)
                getTotalTweetsPerDay(storeTweetDetails, response);

            else {
                finaldataArray.push({metricId: response.metricId, objectId: response.objectId});
                finalTweetResult.push({
                    metricId: response.metricId,
                    objectId: response.objectId,
                    data: storeTweetDetails
                });
                console.log('finalTweetResult', finalTweetResult)
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