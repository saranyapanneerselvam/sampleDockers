//"use strict";
var _ = require('lodash');
var async = require("async");
var AdwordsReport = require('node-adwords').AdwordsReport
var channels = require('../models/channels');
var FB = require('fb');
var exports = module.exports = {};
var request = require('request');

//To use google api's
var googleapis = require('googleapis');

//Importing the fbgraph module
var graph = require('fbgraph');

//To load up the user model
var profile = require('../models/profiles');
var User = require('../models/user');

//To load the metrics model
var Metric = require('../models/metrics');

var moment = require('moment');
moment().format();

//To load the data model
var Data = require('../models/data');

//To load the data model
var Object = require('../models/objects');
var objectType = require('../models/objectTypes');

//Set OAuth
var OAuth2 = googleapis.auth.OAuth2;

var semaphore = require('semaphore')(1);
//set Twitter module
var Twitter = require('twitter');

//Importing instagram node module - dev
var ig = require('instagram-node').instagram();

//importing pinterest node module
var PDK = require('node-pinterest');

//Load the auth file
var configAuth = require('../config/auth');

//set googleAdwords node module
//var googleAds = require('../lib/googleAdwords');
//var spec = {host: configAuth.googleAdwordsStatic.host};
//googleAds.GoogleAdwords(spec);
//aweber
var NodeAweber = require('aweber-api-nodejs');
var NA = new NodeAweber(configAuth.aweberAuth.clientID, configAuth.aweberAuth.clientSecret, configAuth.aweberAuth.callbackURL);
var Widget = require('../models/widgets');
var client = new Twitter({
    consumer_key: configAuth.twitterAuth.consumerKey,
    consumer_secret: configAuth.twitterAuth.consumerSecret,
    access_token_key: configAuth.twitterAuth.AccessToken,
    access_token_secret: configAuth.twitterAuth.AccessTokenSecret
});
//set moz module
var moz = require('mozscape-request')({
    accessId: configAuth.batchJobsMoz.accessId,
    secret: configAuth.batchJobsMoz.secret,
    expires: configAuth.batchJobsMoz.expires
});
//To get the channel data
exports.getChannelData = function (req, res, next) {

    //Function to find days difference
    function findDaysDifference(startDate, endDate, endPoint, noEndPoint) {
        var storeDefaultValues = [];
        var storeStartDate = new Date(startDate);
        var storeEndDate = new Date(endDate);
        var timeDiff = Math.abs(storeEndDate.getTime() - storeStartDate.getTime());
        var diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24));
        for (var i = 0; i <= diffDays; i++) {
            if (moment(storeStartDate).format('YYYY-MM-DD') <= moment(new Date).format('YYYY-MM-DD')) {
                var finalDate = calculateDate(storeStartDate);
                if (endPoint != undefined) {
                    var totalObject = {};
                    for (var j = 0; j < endPoint.length; j++) {
                        totalObject[endPoint[j]] = 0;
                    }
                    storeDefaultValues.push({date: finalDate, total: totalObject});
                }
                else if (noEndPoint) storeDefaultValues.push({date: finalDate, total: {}});
                else storeDefaultValues.push({date: finalDate, total: 0});
                storeStartDate.setDate(storeStartDate.getDate() + 1);
            }
        }
        return storeDefaultValues;
    }

    function replaceEmptyData(daysDifference, finalData) {
        var defaultArrayLength = daysDifference.length;
        var dataLength = finalData.length;
        for (var i = 0; i < defaultArrayLength; i++) {
            for (var k = 0; k < dataLength; k++) {
                if (daysDifference[i].date === finalData[k].date)
                    daysDifference[i] = finalData[k]
            }
        }
        return daysDifference;
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

    function getDaysDifference(startDate, endDate) {
        var storeStartDate = new Date(startDate);
        var storeEndDate = new Date(endDate);
        var timeDiff = Math.abs(storeEndDate.getTime() - storeStartDate.getTime());
        var diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24));
        return diffDays;
    }

    //To check whether the user has required permission to get the widget data
    Widget.findOne({_id: req.params.widgetId}, {dashboardId: 1, charts: 1, widgetType: 1}, function (err, response) {
        var dashboardId = response.dashboardId;
        if (req.user) {
            User.findOne({
                _id: req.user._id,
                dashboards: {$elemMatch: {dashboardId: dashboardId}}
            }, function (err, user) {
                if (err)
                    return res.status(500).json({error: 'Internal Server Error', id: req.params.widgetId});
                else if (!user)
                    return res.status(401).json({error: 'User not found', id: req.params.widgetId});
                else
                    callEntireDataFunction();
            })
        }
        else if (req.body.params) {
            callEntireDataFunction()
        }
        else
            return res.status(401).json({error: 'User must be logged in', id: req.params.widgetId})
    });
    function callEntireDataFunction() {
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
            get_channel_objects_db: ['store_final_data', 'get_channel_data_remote', getChannelDataDB]
        }, function (err, results) {
            if (err)
                return res.status(500).json({error: 'Internal server error', id: req.params.widgetId})
            req.app.result = results.get_channel_objects_db;
            next();
        });
    }

    //Function to handle all queries result here
    function checkNullObject(callback) {
        return function (err, object) {
            if (err)
                callback('Database error: ' + err, null);
            else if (!object || object.length === 0)
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
        var wholeData = {}
        Data.findOne({
            'objectId': results.metrics[0].objectId,
            'metricId': results.metrics[0].metricId
        }, function (err, data) {
            wholeData = {data: data, metricId: results.metrics[0].metricId}
            checkNullData(callback(null, wholeData))
        });
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
            objectTypeId: 1,
            name: 1,
            channelId: 1,
            meta: 1
        }, checkNullObject(callback));
    }

    //Function to get the data in profile collection
    function getProfile(results, callback) {
        //skipping profile for moz
        if (results.object[0].channelId == results.metric[0].channelId) return callback(null);
        else async.concatSeries(results.object, getEachProfile, callback)
    }

    //Function to get all profile details
    function getEachProfile(results, callback) {
        profile.findOne({'_id': results.profileId}, {
            accessToken: 1,
            refreshToken: 1,
            channelId: 1,
            userId: 1,
            email: 1,
            dataCenter: 1,
            tokenSecret: 1,
            name: 1,
            customerId: 1
        }, checkNullObject(callback));
    }

    //Function to get the data in channel collection
    function getChannel(results, callback) {
        if (results.object[0].channelId == results.metric[0].channelId) {

            async.concatSeries(results.object, getEachChannel, callback);
        }
        else
            async.concatSeries(results.get_profile, getEachChannel, callback);
    }

    //Function to get all channels detail
    function getEachChannel(results, callback) {
        channels.findOne({'_id': results.channelId}, {code: 1}, checkNullObject(callback));
    }

    //Get the unique channel list
    function getUniqueChannel(channel, uniqueChannelArray) {
        uniqueChannelArray = _.uniqBy(channel, 'code');
        return uniqueChannelArray;
    }

    //To call the respective function based on channel
    function getChannelDataRemote(initialResults, callback) {
        async.auto({
            get_each_channel_data: getEachChannelData
        }, function (err, results) {
            if (err) {
                return callback(err, null);
            }
            callback(null, results);
        });
        function getEachChannelData(callback) {
            var uniqueChannelArray = [];
            if (initialResults.widget.widgetType == 'fusion') {
                var channel = initialResults.get_channel;
                var uniqueChannel = getUniqueChannel(channel, uniqueChannelArray);
                async.concatSeries(uniqueChannel, dataForEachChannel, callback);
            }
            else {
                var newChannelArray = [];
                newChannelArray.push(initialResults.get_channel[0]);
                async.concatSeries(newChannelArray, dataForEachChannel, callback);
            }
        }

        function dataForEachChannel(results, callback) {

            //To check the channel
            switch (results.code) {
                case configAuth.channels.googleAnalytics:
                    setDataBasedChannelCode(results, function (err, result) {
                        if (err)
                            return res.status(500).json({error: 'Internal server error', id: req.params.widgetId})
                        else
                            initializeGa(result, callback);
                    });
                    break;
                case configAuth.channels.facebook:
                    setDataBasedChannelCode(results, function (err, result) {
                        if (err)
                            return res.status(500).json({error: 'Internal server error', id: req.params.widgetId})
                        else
                            getFBPageData(result, callback);
                    });
                    break;
                case configAuth.channels.facebookAds:
                    setDataBasedChannelCode(results, function (err, result) {
                        if (err)
                            return res.status(500).json({error: 'Internal server error', id: req.params.widgetId})
                        else
                            getFBadsinsightsData(result, callback);
                    });
                    break;
                case configAuth.channels.twitter:
                    setDataBasedChannelCode(results, function (err, result) {
                        if (err)
                            return res.status(500).json({error: 'Internal server error', id: req.params.widgetId})
                        else
                            getTweetData(result, callback);
                    });
                    break;
                case configAuth.channels.googleAdwords:
                    setDataBasedChannelCode(results, function (err, result) {
                        if (err)
                            return res.status(500).json({error: 'Internal server error', id: req.params.widgetId})
                        else
                            selectAdwordsObjectType(result, callback);
                    });
                    break;
                case configAuth.channels.instagram:
                    setDataBasedChannelCode(results, function (err, result) {
                        if (err)
                            return res.status(500).json({error: 'Internal server error', id: req.params.widgetId})
                        else
                            selectInstagram(result, callback);
                    });
                    break;
                case configAuth.channels.youtube:
                    setDataBasedChannelCode(results, function (err, result) {
                        if (err)
                            return res.status(500).json({error: 'Internal server error'})
                        else
                            initializeGa(result, callback);
                    });
                    break;
                case configAuth.channels.pinterest:
                    setDataBasedChannelCode(results, function (err, result) {
                        if (err)
                            return res.status(500).json({});
                        else
                            selectPinterest(result, callback);
                    });
                    break;
                case configAuth.channels.mailChimp:
                    setDataBasedChannelCode(results, function (err, result) {
                        if (err)
                            return res.status(500).json({});
                        else
                            selectMailChimp(result, callback);
                    });
                    break;
                case configAuth.channels.linkedIn:
                    setDataBasedChannelCode(results, function (err, result) {
                        if (err)
                            return res.status(500).json({error: 'Internal server error', id: req.params.widgetId})
                        else
                            selectLinkedInObjectType(result, callback);
                    });
                    break;
                case configAuth.channels.aweber:
                    setDataBasedChannelCode(results, function (err, result) {
                        if (err)
                            return res.status(500).json({error: 'Internal server error'});
                        else
                            selectaweber(result, callback);
                    });
                    break;
                case configAuth.channels.moz:
                    setDataBasedChannelCode(results, function (err, result) {
                        if (err)
                            return res.status(500).json({error: 'Internal server error', id: req.params.widgetId})
                        else
                            getMozData(result, callback);
                    });
                    break;
                case configAuth.channels.vimeo:
                    setDataBasedChannelCode(results, function (err, result) {
                        if (err)
                            return res.status(500).json({error: 'Internal server error', id: req.params.widgetId})
                        else
                            selectVimeoObjectType(result, callback);
                    });
                    break;
                default:
                    callback('error')
            }
        }

        //Group data based on channel
        function setDataBasedChannelCode(results, callback) {
            var wholeObject = {};
            async.auto({
                group_profile: groupProfile,
                group_channel_objects: ['group_profile', groupChannelObjects],
                group_metrics: ['group_channel_objects', groupMetrics],
                group_data: ['group_metrics', groupData],
                group_charts: ['group_data', groupCharts]
            }, function (err, results) {
                if (err)
                    return callback(err, null);
                wholeObject = {
                    widget: results.group_charts,
                    data: results.group_data,
                    metric: results.group_metrics,
                    object: results.group_channel_objects,
                    get_profile: results.group_profile,
                    channels: results
                };
                callback(null, wholeObject);
            });

            //function to group profiles based on channel id
            function groupProfile(callback) {
                var profile = [];
                var profilesList = initialResults.get_profile;
                if (profilesList == null) {

                    return callback(null);
                }
                else {
                    for (var i = 0; i < profilesList.length; i++) {
                        if (results._id == profilesList[i].channelId)
                            profile.push(profilesList[i]);
                    }
                    callback(null, profile);
                }
            }

            //function to group the channel objects based on profile id
            function groupChannelObjects(results, callback) {
                var channelObjects = [];
                var objects = initialResults.object;
                if (results.group_profile == null) {
                    for (var i = 0; i < objects.length; i++) {
                        if (String(initialResults.get_channel[0]._id) === String(objects[i].channelId))
                            channelObjects.push(objects[i]);
                    }
                    callback(null, channelObjects)
                }
                else {
                    for (var i = 0; i < objects.length; i++) {
                        if (String(results.group_profile[0]._id) === String(objects[i].profileId))
                            channelObjects.push(objects[i]);
                    }
                    callback(null, channelObjects)
                }
            }

            //function to group metrics based on channel id
            function groupMetrics(objects, callback) {
                var channelMetrics = [];
                var metrics = initialResults.metric;
                for (var i = 0; i < metrics.length; i++) {
                    if (results._id == metrics[i].channelId)
                        channelMetrics.push(metrics[i]);
                }
                callback(null, channelMetrics);
            }

            //function to group data based on metric
            function groupData(metrics, callback) {
                var channelData = [];
                var metricList = metrics.group_metrics;
                var data = initialResults.data;
                for (var i = 0; i < data.length; i++) {
                    for (var j = 0; j < metricList.length; j++) {
                        if (String(metricList[j]._id) === String(data[i].metricId))
                            channelData.push(data[i]);
                    }
                }
                callback(null, channelData);
            }

            //function to group charts inside widgets based on channel id
            function groupCharts(data, callback) {
                var chartsArray = [];
                var widgetArray = [];
                var charts = initialResults.widget.charts;
                for (var i = 0; i < charts.length; i++) {
                    if (String(results._id) === String(charts[i].channelId))
                        chartsArray.push(charts[i]);
                }
                widgetArray.push({
                    _id: initialResults.widget._id,
                    widgetType: initialResults.widget.widgetType,
                    charts: chartsArray
                });
                callback(null, widgetArray)
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
            if (err)
                return callback(err, null);
            callback(null, results.get_object_list);
        });

        //To get the start date ,end date required for query
        function getDates(callback) {
            loopGetDates(initialResults.data, initialResults.metric, callback);
            function loopGetDates(data, metric, done) {
                async.timesSeries(Math.min(data.length, metric.length), function (j, next) {
                    var d = new Date();
                    d.setDate(d.getDate() + 1);
                    var queryObject = {};

                    //check already there is one year data in db
                    if (data[j].data != null) {
                        var updated = new Date(data[j].data.updated);
                        updated= updated.setHours(updated.getHours() + configAuth.dataValidityInHours);
                        updated=new Date(updated);
                        var now = new Date();
                        if (updated < now) {
                            var updated = formatDate(data[j].data.updated);
                            var now = new Date();
                            now.setDate(now.getDate() + 1);
                            now = moment(now).format('YYYY-MM-DD');
                            var query = initialResults.object[0].channelObjectId + "/insights/" + metric[j].objectTypes[0].meta.fbMetricName + "?since=" + updated + "&until=" + now;
                            queryObject = {
                                query: query,
                                metricId: metric[j]._id,
                                metric: metric[j],
                                startDate: updated,
                                endDate: now
                            };
                            next(null, queryObject);
                        }
                        else {
                            queryObject = {
                                query: 'DataFromDb',
                                metricId: metric[j]._id,
                                metric: metric[j],
                                startDate: updated,
                                endDate: now
                            };
                            next(null, queryObject);
                        }
                    }

                    //To four queries to get one year data
                    else {
                        async.concatSeries([93, 93, 93, 86], setStartEndDate, function (err, query) {
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
                        queryObject = {
                            query: query,
                            metricId: metric[j]._id,
                            metric: metric[j],
                            startDate: startDate,
                            endDate: endDate
                        };
                        callback('', queryObject);
                    }
                }, done);
            }
        }

        //To pass the query to graph api
        function passQueryToGraphApi(results, callback) {
            async.concatSeries(results.get_start_end_dates, getDataForEachQuery, callback);
        }

        //To get facebook data
        function getDataForEachQuery(query, callback) {
            if (typeof query.query == 'string')
                async.map([query], getDataForAllQuery, callback);
            else
                async.map(query, getDataForAllQuery, callback);
        }

        //Get final data for all queries
        function getDataForAllQuery(query, callback) {
            var queryResponse = {};
            if (query.query == 'DataFromDb') {
                queryResponse = {
                    res: 'DataFromDb',
                    metricId: query.metricId,
                    queryResults: initialResults,
                    channelId: initialResults.metric[0].channelId,
                    startDate: query.startDate,
                    endDate: query.endDate,
                    metric: query.metric
                }
                callback(null, queryResponse);
            }
            else {
                graph.get(query.query, function (err, fbQueryRes) {
                    if (err) {
                        if (err.code === 190){
                            profile.update({_id: initialResults.get_profile[0]._id}, {
                                hasNoAccess:true
                            }, function(err, response) {
                                if(!err){
                                    return res.status(401).json({
                                        error: 'Authentication required to perform this action',
                                        id: req.params.widgetId,
                                        errorstatusCode:1003
                                    });
                                }
                                else
                                    return res.status(500).json({error: 'Internal server error', id: req.params.widgetId});
                            })
                        }

                        else if (err.code === 4)
                            return res.status(4).json({error: 'Forbidden Error', id: req.params.widgetId})
                        else
                            return res.status(500).json({error: 'Internal server error', id: req.params.widgetId})
                    }
                    else {
                        queryResponse = {
                            res: fbQueryRes,
                            metricId: query.metricId,
                            queryResults: initialResults,
                            channelId: initialResults.metric[0].channelId,
                            startDate: query.startDate,
                            endDate: query.endDate,
                            metric: query.metric
                        }
                        callback('', queryResponse);
                    }
                })
            }
        }
    }

    //To store the final result in db
    function storeFinalData(results, callback) {
        var uniqueChannelArray = [];
        var uniqueChannelDetails = [];
        var channelWithCode = [];
        var groupAllChannelData;
        var allChannels = results.get_channel;
        var wholeQueryResult = results.get_channel_data_remote.get_each_channel_data;
        var uniqueChannelFromDb = getUniqueChannel(allChannels, uniqueChannelArray);
        groupAllChannelData = _.groupBy(wholeQueryResult, 'channelId');
        if (results.widget.widgetType == 'fusion') {
            uniqueChannelDetails = _.uniqBy(wholeQueryResult, 'channelId');
            uniqueChannelDetails.forEach(function (value, index) {
                if (String(uniqueChannelFromDb[index]._id) === String(uniqueChannelDetails[index].channelId)) {
                    channelWithCode.push({
                        channel: uniqueChannelFromDb[index],
                        allData: uniqueChannelDetails[index].queryResults
                    });
                }
            })
        }
        else
            channelWithCode.push({channel: uniqueChannelFromDb[0], allData: wholeQueryResult[0].queryResults});
        async.concatSeries(channelWithCode, storeEachChannelData, callback);
        function storeEachChannelData(allQueryResult, callback) {
            if (allQueryResult.channel.code == configAuth.channels.googleAnalytics || allQueryResult.channel.code == configAuth.channels.youtube) {
                function storeDataForGA(dataFromRemote, dataFromDb, widget, metric, done) {
                    async.times(dataFromDb.length, function (j, next) {
                        var finalData;
                        if (dataFromRemote[j].data === 'DataFromDb')
                            next(null, 'DataFromDb');
                        else {
                            var storeGoogleData = [];
                            var replacedGoogleData = [];
                            var dbFinalData=[];
                            var dimensionList = [];
                            var dimension;
                            var dimensionArray = [];
                            if(metric[j].name === configAuth.googleAnalytics.topPages)
                                var dimensionList = dataFromRemote[j].Dimension;
                            else
                            var dimensionList = metric[j].objectTypes[0].meta.dimension;
                            if (dimensionList[0].name === "ga:date" || dimensionList[0].name === "mcf:conversionDate" || dimensionList[0].name === 'day') {
                                if (dataFromRemote[j].metric.objectTypes[0].meta.endpoint.length)
                                    finalData = findDaysDifference(dataFromRemote[j].startDate, dataFromRemote[j].endDate, dataFromRemote[j].metric.objectTypes[0].meta.endpoint);
                                else {
                                    if (dataFromRemote[j].metric.objectTypes[0].meta.responseType === 'object')
                                        finalData = findDaysDifference(dataFromRemote[j].startDate, dataFromRemote[j].endDate, undefined, 'noEndPoint');
                                    else
                                        finalData = findDaysDifference(dataFromRemote[j].startDate, dataFromRemote[j].endDate, undefined);
                                }
                            }
                            //Check empty data from query response
                            if (dataFromRemote[j].data === 'No Data')
                                storeGoogleData = finalData;
                            else {

                                //calculating the result length
                                var resultLength = dataFromRemote[j].data.length;
                                var resultCount = dataFromRemote[j].data[0].length - 1;

                                //loop to store the entire result into an array
                                for (var i = 0; i < resultLength; i++) {
                                    var obj = {};

                                    //loop generate array dynamically based on given dimension list
                                    for (var m = 0; m < dimensionList.length; m++) {
                                        if (m == 0) {
                                            //date value is coming in the format of 20160301 so splitting like yyyy-mm--dd format
                                            if (metric[j].objectTypes[0].meta.api === configAuth.googleApiTypes.mcfApi) {
                                                var year = dataFromRemote[j].data[i][0].primitiveValue.substring(0, 4);
                                                var month = dataFromRemote[j].data[i][0].primitiveValue.substring(4, 6);
                                                var date = dataFromRemote[j].data[i][0].primitiveValue.substring(6, 8);
                                                obj[dimensionList[m].storageName] = [year, month, date].join('-');
                                                obj['total'] = dataFromRemote[j].data[i][resultCount].primitiveValue;
                                            }
                                            else if (metric[j].objectTypes[0].meta.api === configAuth.googleApiTypes.youtubeApi) {
                                                obj[dimensionList[m].storageName] = dataFromRemote[j].data[i][0];
                                                obj['total'] = dataFromRemote[j].data[i][resultCount];
                                            }
                                            else {
                                                var year = dataFromRemote[j].data[i][0].substring(0, 4);
                                                var month = dataFromRemote[j].data[i][0].substring(4, 6);
                                                var date = dataFromRemote[j].data[i][0].substring(6, 8);
                                                obj[dimensionList[m].name.substr(3)] = [year, month, date].join('-');
                                                obj['total'] = dataFromRemote[j].data[i][resultCount];
                                            }
                                        }
                                        else {
                                            obj[dimensionList[m].name.substr(3)] = dataFromRemote[j].data[i][m];
                                            if (metric[j].objectTypes[0].meta.api === configAuth.googleApiTypes.mcfApi)
                                                obj['total'] = dataFromRemote[j].data[i][resultCount].primitiveValue;
                                            else
                                                obj['total'] = dataFromRemote[j].data[i][resultCount];
                                        }
                                    }
                                    storeGoogleData.push(obj);
                                }

                                if (dimensionList.length > 1) {
                                    if (metric[j].objectTypes[0].meta.endpoint.length) {
                                        var result = _.chain(storeGoogleData)
                                            .groupBy("date")
                                            .toPairs()
                                            .map(function (currentItem) {
                                                return _.zipObject(["date", "data"], currentItem);
                                            })
                                            .value();
                                        var storeFinalData = [];
                                        var groupedData = result;
                                        var objToStoreFinalData = {};
                                        var initD;
                                        for (var i = 0; i < groupedData.length; i++) {
                                            if (dimensionList.length === 2)
                                                initD = 1;
                                            else
                                                initD = 2;
                                            for (var g = 0; g < groupedData[i].data.length; g++) {
                                                var finalDimensionData = groupedData[i].data[g][dimensionList[1].name.substr(3)];
                                                for (var d = initD; d < dimensionList.length; d++) {
                                                    if (initD === 1)
                                                        finalDimensionData = finalDimensionData;
                                                    else
                                                        finalDimensionData = finalDimensionData + '/' + groupedData[i].data[g][dimensionList[d].name.substr(3)];
                                                    var replacedValue = finalDimensionData.split('.').join('002E');
                                                }
                                                objToStoreFinalData[replacedValue] = groupedData[i].data[g].total;
                                                storeFinalData.push({
                                                    total: objToStoreFinalData,
                                                    date: groupedData[i].date
                                                })
                                            }
                                            var objToStoreFinalData = {};
                                        }
                                        storeGoogleData = storeFinalData;
                                    }
                                    else {
                                        var result = _.chain(storeGoogleData)
                                            .groupBy("date")
                                            .toPairs()
                                            .map(function (currentItem) {
                                                return _.zipObject(["date", "total"], currentItem);
                                            })
                                            .value();
                                        storeGoogleData = result;
                                    }
                                }

                                var now = new Date();
                                var wholeResponse = [];

                            }
                            var finalReplacedData = replaceEmptyData(finalData, storeGoogleData);
                            finalReplacedData.forEach(function (value) {
                                replacedGoogleData.push(value)
                            })
                            if (dataFromDb[j].data != null) {
                                var metricId;
                                for (var r = 0; r < dataFromDb[j].data.data.length; r++) {
                                    if (dataFromRemote[j].metricId === dataFromDb[j].metricId) {
                                        //merge old data with new one
                                        dbFinalData.push(dataFromDb[j].data.data[r]);
                                    }
                                }
                                for (var n = 0; n<replacedGoogleData.length; n++) {
                                    var findCurrentDate = _.findIndex(dbFinalData, function (o) {
                                        return o.date == replacedGoogleData[n].date;
                                    });
                                    if (findCurrentDate === -1) dbFinalData.push(replacedGoogleData[n]);
                                    else dbFinalData[findCurrentDate] = replacedGoogleData[n];
                                }
                                replacedGoogleData=[];
                                for (var k = 0; k <dbFinalData.length; k++) {
                                    replacedGoogleData.push(dbFinalData[k]);
                                }
                            }
                            var now = new Date();
                            //Updating the old data with new one
                            Data.update({
                                'objectId': widget[j].metrics[0].objectId,
                                'metricId': dataFromRemote[j].metricId
                            }, {
                                $setOnInsert: {created: now},
                                $set: {
                                    data: replacedGoogleData,
                                    updated: now,
                                    bgFetch: metric[j].bgFetch,
                                    fetchPeriod: metric[j].fetchPeriod
                                }
                            }, {upsert: true}, function (err, data) {
                                if (err)
                                    return res.status(500).json({
                                        error: 'Internal server error',
                                        id: req.params.widgetId
                                    })
                                else if (data == 0)
                                    return res.status(501).json({error: 'Not implemented', id: req.params.widgetId})
                                else next(null, 'success')
                            })
                        }
                    }, done);
                }

                storeDataForGA(groupAllChannelData[allQueryResult.channel._id][0].results.call_get_analytic_data, allQueryResult.allData.data, allQueryResult.allData.widget[0].charts, allQueryResult.allData.metric, callback);
            }
            else if (allQueryResult.channel.code == configAuth.channels.facebook) {
                storeDataForFB(groupAllChannelData[allQueryResult.channel._id], allQueryResult.allData.data, allQueryResult.allData.widget[0].charts, allQueryResult.allData.metric, callback);
                function storeDataForFB(dataFromRemote, dataFromDb, widget, metric, done) {
                    async.timesSeries(Math.min(widget.length, dataFromDb.length), function (j, next) {
                        var beforeReplaceEmptyData = [];
                        var finalData = [];
                        var finalData1 = [];
                        var dbFinalData=[];

                        //Array to hold the final result
                        for (var key in dataFromRemote) {
                            if (String(dataFromRemote[key].channelId) === String(metric[0].channelId)) {
                                if (dataFromRemote[key].res === 'DataFromDb') {

                                }
                                else {
                                    var d = new Date(dataFromRemote[key].endDate);
                                    d.setDate(d.getDate() - 1);
                                    d = moment(d).format('YYYY-MM-DD');
                                    if (dataFromRemote[key].res.data.length) {
                                        var dataLength = dataFromRemote[key].res.data[0].values.length;
                                        var fbDataLength = dataFromRemote[key].res.data[0].values.length;
                                        for (var index in dataFromRemote[key].res.data[0].values) {
                                            var value = {};
                                            value = {
                                                total: dataFromRemote[key].res.data[0].values[index].value,
                                                date: dataFromRemote[key].res.data[0].values[index].end_time.substr(0, 10)
                                            };
                                            if (String(metric[j]._id) === String(dataFromRemote[key].metricId)) {
                                                beforeReplaceEmptyData.push(value);
                                                var metricId = dataFromRemote[key].metricId;
                                            }
                                        }
                                        if (String(metric[j]._id) === String(dataFromRemote[key].metricId)) {
                                            if (dataFromRemote[key].metric.objectTypes[0].meta.endpoint.length)
                                                finalData1 = findDaysDifference(dataFromRemote[key].startDate, d, dataFromRemote[key].metric.objectTypes[0].meta.endpoint);
                                            else {
                                                if (dataFromRemote[key].metric.objectTypes[0].meta.responseType === 'object')
                                                    finalData1 = findDaysDifference(dataFromRemote[key].startDate, d, undefined, 'noEndPoint');
                                                else
                                                    finalData1 = findDaysDifference(dataFromRemote[key].startDate, d, undefined);
                                            }
                                            var finalReplacedData = replaceEmptyData(finalData1, beforeReplaceEmptyData);
                                            finalReplacedData.forEach(function (value) {
                                                finalData.push(value)
                                            })
                                        }
                                    }
                                    else {
                                        if (String(metric[j]._id) === String(dataFromRemote[key].metricId)) {
                                            if (dataFromRemote[key].metric.objectTypes[0].meta.endpoint.length)
                                                finalData = findDaysDifference(dataFromRemote[key].startDate, d, dataFromRemote[key].metric.objectTypes[0].meta.endpoint);
                                            else {
                                                if (dataFromRemote[key].metric.objectTypes[0].meta.responseType === 'object')
                                                    finalData = findDaysDifference(dataFromRemote[key].startDate, d, undefined, 'noEndPoint');
                                                else
                                                    finalData = findDaysDifference(dataFromRemote[key].startDate, d, undefined);
                                            }
                                        }
                                    }
                                }
                            }
                        }
                        if (dataFromRemote[j].res != 'DataFromDb') {
                            if (dataFromDb[j].data != null) {

                                //merge the old data with new one and update it in db
                                for (var r = 0; r < dataFromDb[j].data.data.length; r++) {
                                    //merge old data with new one
                                    dbFinalData.push(dataFromDb[j].data.data[r]);
                                }

                                for (var r = 0; r <finalData.length; r++) {
                                    var findCurrentDate = _.findIndex(dbFinalData, function (o) {
                                        return o.date == finalData[r].date;
                                    });
                                    if (findCurrentDate === -1) dbFinalData.push(finalData[r]);
                                    else dbFinalData[findCurrentDate] = finalData[r];
                                }
                                finalData=[];
                                for (var k = 0; k <dbFinalData.length; k++) {
                                    finalData.push(dbFinalData[k]);
                                }
                                var metricId = dataFromRemote[j].metricId;
                            }
                            if (typeof finalData[0].total == 'object') {
                                for (var data in finalData) {
                                    var jsonObj = {}, tempKey;
                                    for (var items in finalData[data].total)
                                        jsonObj[items.replace(/[$.]/g, '/')] = finalData[data].total[items];
                                    finalData[data].total = jsonObj;
                                }
                            }
                            var now = new Date();
                            //Updating the old data with new one
                            Data.update({
                                'objectId': widget[j].metrics[0].objectId,
                                'metricId': metricId
                            }, {
                                $setOnInsert: {created: now},
                                $set: {
                                    data: finalData,
                                    updated: now,
                                    bgFetch: metric[j].bgFetch,
                                    fetchPeriod: metric[j].fetchPeriod
                                }
                            }, {upsert: true}, function (err, data) {
                                if (err)
                                    return res.status(500).json({
                                        error: 'Internal server error',
                                        id: req.params.widgetId
                                    })
                                else if (data == 0)
                                    return res.status(501).json({error: 'Not implemented', id: req.params.widgetId})
                                else next(null, 'success')
                            });
                        }
                        else
                            next(null, 'success')
                    }, done);
                }
            }
            else if (allQueryResult.channel.code == configAuth.channels.moz) {
                storeDataForMoz(groupAllChannelData[allQueryResult.channel._id], allQueryResult.allData.data, allQueryResult.allData.widget[0].charts, allQueryResult.allData.metric, callback);
                function storeDataForMoz(dataFromRemote, dataFromDb, widget, metric, done) {
                    async.timesSeries(Math.min(widget.length, dataFromDb.length), function (j, next) {
                        var beforeReplaceEmptyData = [];
                        var finalData1 = [];
                        var dbFinalData=[];

                        //Array to hold the final result
                        for (var key in dataFromRemote) {
                            if (String(dataFromRemote[key].channelId) === String(metric[0].channelId)) {
                                if (dataFromRemote[key].data.length) {
                                    var value = {};
                                    value = {
                                        total: parseFloat(dataFromRemote[key].data[0].total).toFixed(2),
                                        date: dataFromRemote[key].data[0].date
                                    };
                                    if (String(metric[j]._id) === String(dataFromRemote[key].metricId)) {
                                        beforeReplaceEmptyData.push(value);
                                        var metricId = dataFromRemote[key].metricId;
                                    }
                                    if (String(metric[j]._id) === String(dataFromRemote[key].metricId)) {
                                        finalData1 = findDaysDifference(dataFromRemote[key].startDate, dataFromRemote[key].endDate, undefined);
                                        var finalData = replaceEmptyData(finalData1, beforeReplaceEmptyData);
                                    }
                                }
                            }
                        }
                        if (dataFromRemote[j].data != 'DataFromDb') {
                            if (dataFromDb[j].data != null) {
                                //merge the old data with new one and update it in db
                                for (var r = 0; r < dataFromDb[j].data.data.length; r++) {
                                    //merge old data with new one
                                    dbFinalData.push(dataFromDb[j].data.data[r]);
                                }

                                for (var r = 0; r < finalData.length; r++) {
                                    var findCurrentDate = _.findIndex(dbFinalData, function (o) {
                                        return o.date == finalData[r].date;
                                    });
                                    if (findCurrentDate === -1) dbFinalData.push(finalData[r]);
                                    else dbFinalData[findCurrentDate] = finalData[r];
                                }
                                finalData = [];
                                for (var k = 0; k < dbFinalData.length; k++) {
                                    finalData.push(dbFinalData[k]);
                                }
                                var metricId = dataFromRemote[j].metricId;
                            }
                            var now = new Date();

                            //Updating the old data with new one
                            Data.update({
                                'objectId': widget[j].metrics[0].objectId,
                                'metricId': metricId
                            }, {
                                $setOnInsert: {created: now},
                                $set: {
                                    data: finalData,
                                    updated: now,
                                    bgFetch: metric[j].bgFetch,
                                    fetchPeriod: metric[j].fetchPeriod
                                }
                            }, {upsert: true}, function (err, data) {
                                if (err)
                                    return res.status(500).json({
                                        error: 'Internal server error',
                                        id: req.params.widgetId
                                    });
                                else if (data == 0)
                                    return res.status(501).json({error: 'Not implemented', id: req.params.widgetId});
                                else
                                    next(null, 'success');

                            });
                        }
                        else
                            next(null, 'success')
                    }, done);
                }
            }
            else if (allQueryResult.channel.code == configAuth.channels.facebookAds) {
                storeDataForFBAds(groupAllChannelData[allQueryResult.channel._id], allQueryResult.allData.data, allQueryResult.allData.widget[0].charts, allQueryResult.allData.metric, callback);
                function storeDataForFBAds(dataFromRemote, dataFromDb, widget, metric, done) {
                    async.timesSeries(dataFromDb.length, function (j, next) {
                        var finalData = [];
                        var dbFinalData=[];
                        for (var index = 0; index < dataFromRemote.length; index++) {
                            if (dataFromRemote[index].data === 'DataFromDb') {
                            }
                            else {
                                for (var data in dataFromRemote[index].data) {
                                    if (metric[j]._id == dataFromRemote[index].metricId)
                                        finalData.push(dataFromRemote[index].data[data]);
                                }
                            }
                        }
                        if (dataFromRemote[index] != 'DataFromDb') {
                            if (dataFromDb[j].data != null) {
                                for (var r = 0; r < dataFromDb[j].data.data.length; r++) {

                                    //merge old data with new one
                                    dbFinalData.push(dataFromDb[j].data.data[r]);
                                }

                                for (var r = 0; r < finalData.length; r++) {
                                    var findCurrentDate = _.findIndex(dbFinalData, function (o) {
                                        return o.date == finalData[r].date;
                                    });
                                    if (findCurrentDate === -1) dbFinalData.push(finalData[r]);
                                    else dbFinalData[findCurrentDate] = finalData[r];
                                }
                                finalData = [];
                                for (var k = 0; k < dbFinalData.length; k++) {
                                    finalData.push(dbFinalData[k]);
                                }
                            }

                            var now = new Date();

                            //Updating the old data with new one
                            Data.update({
                                'objectId': widget[j].metrics[0].objectId,
                                'metricId': metric[j]._id
                            }, {
                                $setOnInsert: {created: now},
                                $set: {
                                    data: finalData,
                                    updated: now,
                                    bgFetch: metric[j].bgFetch,
                                    fetchPeriod: metric[j].fetchPeriod
                                }
                            }, {upsert: true}, function (err, data) {
                                if (err)
                                    return res.status(500).json({
                                        error: 'Internal server error',
                                        id: req.params.widgetId
                                    })
                                else if (data == 0)
                                    return res.status(501).json({error: 'Not implemented', id: req.params.widgetId})
                                else next(null, 'success');
                            });
                        }
                        else
                            next(null, 'success')
                    }, done);
                }
            }
            else if (allQueryResult.channel.code == configAuth.channels.googleAdwords) {
                storeDataForAdwords(groupAllChannelData[allQueryResult.channel._id], allQueryResult.allData.data, allQueryResult.allData.widget[0].charts, allQueryResult.allData.metric, callback);
                function storeDataForAdwords(dataFromRemote, dataFromDb, widget, metric, done) {
                    async.times(metric.length, function (j, next) {
                        var finalData = [];
                        var dbFinalData=[];

                        //Array to hold the final result
                        for (var key in dataFromRemote) {
                            if (dataFromRemote[key].apiResponse === 'DataFromDb') {
                            }
                            else {
                                if (String(metric[j]._id) == String(dataFromRemote[key].metricId))
                                    finalData = dataFromRemote[key].apiResponse;
                            }
                        }
                        if (dataFromRemote[j].apiResponse != 'DataFromDb') {
                            if (dataFromDb[j].data != null) {
                                if (dataFromRemote[j].metricId == dataFromDb[j].metricId) {

                                    //merge the old data with new one and update it in db
                                    for (var key = 0; key < dataFromDb[j].data.data.length; key++) {
                                        dbFinalData.push(dataFromDb[j].data.data[key]);
                                    }
                                    for (var r = 0; r < finalData.length; r++) {
                                        var findCurrentDate = _.findIndex(dbFinalData, function (o) {
                                            return o.date == finalData[r].date;
                                        });
                                        if (findCurrentDate === -1) dbFinalData.push(finalData[r]);
                                        else dbFinalData[findCurrentDate] = finalData[r];
                                    }
                                    finalData = [];
                                    for (var k = 0; k < dbFinalData.length; k++) {
                                        finalData.push(dbFinalData[k]);
                                    }
                                }
                            }
                            var now = new Date();

                            //Updating the old data with new one
                            Data.update({
                                'objectId': widget[j].metrics[0].objectId,
                                'metricId': metric[j]._id
                            }, {
                                $setOnInsert: {created: now},
                                $set: {
                                    data: finalData,
                                    updated: now,
                                    bgFetch: metric[j].bgFetch,
                                    fetchPeriod: metric[j].fetchPeriod
                                }
                            }, {upsert: true}, function (err, data) {
                                if (err)
                                    return res.status(500).json({
                                        error: 'Internal server error',
                                        id: req.params.widgetId
                                    })
                                else if (data == 0)
                                    return res.status(501).json({error: 'Not implemented', id: req.params.widgetId})
                                else next(null, 'success')
                            });
                        }
                        else
                            next(null, 'success')
                    }, done);
                }
            }
            else if (allQueryResult.channel.code == configAuth.channels.instagram) {
                storeDataForInstagram(groupAllChannelData[allQueryResult.channel._id], allQueryResult.allData.data, allQueryResult.allData.widget[0].charts, allQueryResult.allData.metric, callback);
                function storeDataForInstagram(dataFromRemote, dataFromDb, widget, metric, done) {
                    async.times(metric.length, function (j, next) {
                        var finalData = [];
                        var dbFinalData=[];
                        if (metric[j].code === configAuth.instagramStaticVariables.recentPost) {
                            callback(null, dataFromRemote[j]);
                        }
                        else {

                            //Array to hold the final result
                            for (var key in dataFromRemote) {
                                if (dataFromRemote[key].apiResponse === 'DataFromDb') {
                                }
                                else {
                                    if (String(metric[j]._id) == String(dataFromRemote[key].metricId))
                                        finalData = dataFromRemote[key].apiResponse;
                                }
                            }
                            if (dataFromRemote[j].apiResponse != 'DataFromDb') {
                                if (dataFromDb[j].data != null) {
                                    if (dataFromRemote[j].metricId == dataFromDb[j].metricId) {

                                        //merge the old data with new one and update it in db
                                        for (var key = 0; key < dataFromDb[j].data.data.length; key++) {
                                            dbFinalData.push(dataFromDb[j].data.data[key]);
                                        }
                                        for (var r = 0; r <finalData.length; r++) {
                                            var findCurrentDate = _.findIndex(dbFinalData, function (o) {
                                                return o.date == finalData[r].date;
                                            });
                                            if (findCurrentDate === -1) dbFinalData.push(finalData[r]);
                                            else dbFinalData[findCurrentDate] = finalData[r];
                                        }
                                        finalData=[];
                                        for (var k = 0; k <dbFinalData.length; k++) {
                                            finalData.push(dbFinalData[k]);
                                        }
                                    }
                                }
                                var now = new Date();

                                //Updating the old data with new one
                                Data.update({
                                    'objectId': widget[j].metrics[0].objectId,
                                    'metricId': metric[j]._id
                                }, {
                                    $setOnInsert: {created: now},
                                    $set: {
                                        data: finalData,
                                        updated: now,
                                        bgFetch: metric[j].bgFetch,
                                        fetchPeriod: metric[j].fetchPeriod
                                    }
                                }, {upsert: true}, function (err, data) {
                                    if (err)
                                        return res.status(500).json({
                                            error: 'Internal server error',
                                            id: req.params.widgetId
                                        })
                                    else if (data == 0)
                                        return res.status(501).json({error: 'Not implemented', id: req.params.widgetId})
                                    else next(null, 'success');
                                });
                            }
                            else
                                next(null, 'success')
                        }
                    }, done);
                }
            }
            else if (allQueryResult.channel.code == configAuth.channels.twitter) {
                storeDataForTwitter(groupAllChannelData[allQueryResult.channel._id], allQueryResult.allData.data, allQueryResult.allData.widget[0].charts, allQueryResult.allData.metric, callback);
                function storeDataForTwitter(dataFromRemote, dataFromDb, widget, metric, done) {
                    async.times(Math.min(widget.length, dataFromDb.length), function (j, next) {
                        var currentDate = formatDate(new Date());
                        var param = [];
                        var finalTweetResult;
                        var storeTweetDetails = [];
                        var dbFinalData=[];
                        var wholeTweetResponseFromDb = [];
                        var wholeTweetResponse = [];
                        if (metric[j].code === configAuth.twitterMetric.tweets || metric[j].code === configAuth.twitterMetric.followers || metric[j].code == configAuth.twitterMetric.following || metric[j].code === configAuth.twitterMetric.favourites || metric[j].code === configAuth.twitterMetric.listed || metric[j].code === configAuth.twitterMetric.retweets_of_your_tweets) {
                            for (var key in dataFromRemote) {
                                if (dataFromRemote[key].data === 'DataFromDb') {

                                }
                                else {
                                    if (String(metric[j]._id) == String(dataFromRemote[key].metricId)) {
                                        wholeTweetResponse.push({
                                            date: currentDate,
                                            total: dataFromRemote[key].data[0]
                                        });
                                    }
                                }
                            }
                            if (metric[j].code == configAuth.twitterMetric.tweets)
                                param.push('statuses_count');
                            else if (metric[j].code == configAuth.twitterMetric.following)
                                param.push('friends_count');
                            else if (metric[j].code == configAuth.twitterMetric.listed)
                                param.push('listed_count');
                            else if (metric[j].code == configAuth.twitterMetric.followers)
                                param.push('followers_count');
                            else if (metric[j].code == configAuth.twitterMetric.favourites)
                                param.push('favourites_count');
                            else if (metric[j].code == configAuth.twitterMetric.retweets_of_your_tweets)
                                param.push('retweet_count');
                            else if (metric[j].keywordMentions == configAuth.twitterMetric.retweets_of_your_tweets || metric[0].code == configAuth.twitterMetric.mentions)
                                param.push('retweet_count', 'favorite_count');
                            else
                                param.push('retweet_count', 'favorite_count');
                            var dataFromRemoteLength = dataFromRemote[j].data.length;
                            if (dataFromRemoteLength != 0) {
                                if (dataFromRemote[key].data === 'DataFromDb') {

                                }
                                else {
                                    var totalArray = [];
                                    for (var index = 0; index < param.length; index++) {
                                        if (param.length > 1) {
                                            var total = dataFromRemote[j].data[0][param[index]];
                                            var text = dataFromRemote[j].data[0].text;
                                            totalArray.push(total);
                                            if (totalArray.length > 1) {
                                                var title = param[index];
                                                storeTweetDetails.push({
                                                    date: currentDate,
                                                    text: text,
                                                    retweet_count: totalArray[0],
                                                    favourite_count: totalArray[1]
                                                });
                                            }
                                        }
                                        else {
                                            var duplicateData = [];
                                            var tempDate = [];
                                            var duplicateRetweetCount = 0;
                                            if (metric[j].code == configAuth.twitterMetric.retweets_of_your_tweets) {
                                                var tweetCount = dataFromRemote[j].data;
                                                for (var i = 0; i < tweetCount.length; i++) {
                                                    tempDate.push({date: formatDate(new Date(Date.parse(tweetCount[i].created_at.replace(/( +)/, ' UTC$1'))))});
                                                }
                                                var tempDateCount = _.uniqBy(tempDate, 'date')
                                                for (var m = 0; m < tempDateCount.length; m++) {
                                                    storeTweetDetails.push({date: tempDateCount[m].date, total: 0});
                                                }
                                                for (var m = 0; m < storeTweetDetails.length; m++) {
                                                    for (var k = 0; k < tweetCount.length; k++) {
                                                        var responseDate = formatDate(new Date(Date.parse(tweetCount[k].created_at.replace(/( +)/, ' UTC$1'))))
                                                        if (storeTweetDetails[m].date === responseDate)
                                                            duplicateRetweetCount += tweetCount[k].retweet_count;
                                                    }
                                                    //Get the required data based on date range
                                                    storeTweetDetails[m].total = (duplicateRetweetCount);
                                                    var duplicateRetweetCount = 0;
                                                }
                                            }
                                            else {
                                                var total = dataFromRemote[j].data[0].user[param[index]];
                                                totalArray.push({total: total, date: currentDate});

                                                //Get the required data based on date range
                                                storeTweetDetails.push({
                                                        total: total,
                                                        date: currentDate
                                                    }
                                                );
                                            }
                                        }
                                    }
                                }
                            }
                            else {
                                return res.status(500).json({error: 'Internal server error', id: req.params.widgetId});
                            }
                            if (dataFromDb[j].data != null) {
                                var updated = new Date(dataFromDb[j].data.updated);
                                updated= updated.setHours(updated.getHours() + configAuth.dataValidityInHours);
                                updated=new Date(updated);
                                var now = new Date();
                                if (updated < now) {
                                    var updated = formatDate(dataFromDb[j].data.updated);
                                    var daysDifference = populateDefaultData(updated, currentDate);
                                }
                            }
                            else {
                                var d = new Date();
                                d.setDate(d.getDate() - 365);
                                var startDate = formatDate(d);
                                var daysDifference = populateDefaultData(startDate, currentDate);
                            }
                            function populateDefaultData(startDate, currentDate) {
                                var daysDifference = findDaysDifference(startDate, currentDate);
                                var defaultArrayLength = daysDifference.length;
                                var tweetsLength = storeTweetDetails.length;
                                for (var i = 0; i < defaultArrayLength; i++) {
                                    for (var k = 0; k < tweetsLength; k++) {
                                        if (daysDifference[i].date === storeTweetDetails[k].date) {
                                            daysDifference[i] = storeTweetDetails[k]
                                        }
                                    }
                                }
                                storeTweetDetails = daysDifference;
                            }
                            if (dataFromRemote[j].data != 'DataFromDb') {
                                if (dataFromDb[j].data != null) {
                                    dataFromDb[j].data.data.forEach(function (value, index) {
                                        if (String(metric[j]._id) == String(dataFromRemote[j].metricId))
                                            dbFinalData.push(value);
                                    })

                                    for (var r = 0; r < storeTweetDetails.length; r++) {
                                        var findCurrentDate = _.findIndex(dbFinalData, function (o) {
                                            return o.date == storeTweetDetails[r].date;
                                        });
                                        if (findCurrentDate === -1) dbFinalData.push(storeTweetDetails[r]);
                                        else dbFinalData[findCurrentDate] = storeTweetDetails[r];
                                    }
                                    storeTweetDetails = [];
                                    for (var k = 0; k < dbFinalData.length; k++) {
                                        storeTweetDetails.push(dbFinalData[k]);
                                    }
                                }
                                var now = new Date();
                                Data.update({
                                    'objectId': widget[j].metrics[0].objectId,
                                    'metricId': dataFromRemote[j].metricId
                                }, {
                                    $setOnInsert: {created: now},
                                    $set: {
                                        data: storeTweetDetails,
                                        updated: now,
                                        bgFetch: metric[j].bgFetch,
                                        fetchPeriod: metric[j].fetchPeriod
                                    }
                                }, {upsert: true}, function (err, data) {
                                    if (err)
                                        return res.status(500).json({
                                            error: 'Internal server error',
                                            id: req.params.widgetId
                                        })
                                    else if (data == 0)
                                        return res.status(501).json({error: 'Not implemented', id: req.params.widgetId})
                                    else next(null, 'success')
                                });
                            }
                            else
                                next(null, 'success')
                        }
                        else if (metric[j].code === configAuth.twitterMetric.highEngagementTweets) {
                            next(null, dataFromRemote[j]);
                        }
                        else next('error')
                    }, done)
                }
            }
            else if (allQueryResult.channel.code == configAuth.channels.mailChimp) {
                storeDataFormailchimp(groupAllChannelData[allQueryResult.channel._id], allQueryResult.allData.data, allQueryResult.allData.widget[0].charts, allQueryResult.allData.metric, callback);
                function storeDataFormailchimp(dataFromRemote, dataFromDb, widget, metric, done) {
                    async.times(metric.length, function (j, next) {
                        var finalData = [];
                        var dbFinalData=[];

                        //Array to hold the final result
                        for (var key in dataFromRemote) {
                            if (dataFromRemote[key].apiResponse === 'DataFromDb') {
                            }
                            else {
                                if (String(metric[j]._id) == String(dataFromRemote[key].metricId))
                                    finalData = dataFromRemote[key].apiResponse;
                            }
                        }
                        if (dataFromRemote[j].apiResponse != 'DataFromDb') {
                            if (dataFromDb[j].data != null) {
                                if (dataFromRemote[j].metricId == dataFromDb[j].metricId) {

                                    //merge the old data with new one and update it in db
                                    //merge the old data with new one and update it in db
                                    for (var key = 0; key < dataFromDb[j].data.data.length; key++) {
                                        dbFinalData.push(dataFromDb[j].data.data[key]);
                                    }
                                    for (var r = 0; r <finalData.length; r++) {
                                        var findCurrentDate = _.findIndex(dbFinalData, function (o) {
                                            return o.date == finalData[r].date;
                                        });
                                        if (findCurrentDate === -1) dbFinalData.push(finalData[r]);
                                        else dbFinalData[findCurrentDate] = finalData[r];
                                    }
                                    finalData=[];
                                    for (var k = 0; k <dbFinalData.length; k++) {
                                        finalData.push(dbFinalData[k]);
                                    }
                                }
                            }
                            var now = new Date();

                            //Updating the old data with new one
                            Data.update({
                                'objectId': widget[j].metrics[0].objectId,
                                'metricId': metric[j]._id
                            }, {
                                $setOnInsert: {created: now},
                                $set: {
                                    data: finalData,
                                    updated: now,
                                    bgFetch: metric[j].bgFetch,
                                    fetchPeriod: metric[j].fetchPeriod
                                }
                            }, {upsert: true}, function (err, data) {
                                if (err)
                                    return res.status(500).json({
                                        error: 'Internal server error',
                                        id: req.params.widgetId
                                    })
                                else if (data == 0)
                                    return res.status(501).json({error: 'Not implemented', id: req.params.widgetId})
                                else next(null, 'success')
                            });
                        }
                        else
                            next(null, 'success')
                    }, done);
                }
            }
            else if (allQueryResult.channel.code == configAuth.channels.pinterest) {
                storeDataForpinterest(groupAllChannelData[allQueryResult.channel._id], allQueryResult.allData.data, allQueryResult.allData.widget[0].charts, allQueryResult.allData.metric, callback);
                function storeDataForpinterest(dataFromRemote, dataFromDb, widget, metric, done) {
                    async.times(metric.length, function (j, next) {
                        var finalData = [];
                        var dbFinalData=[];
                        if (metric[j].code === configAuth.pinterestMetrics.boardsLeaderBoard || metric[j].code === configAuth.pinterestMetrics.engagementRate) return callback(null, dataFromRemote[j])
                        else {
                            //Array to hold the final result
                            for (var key in dataFromRemote) {
                                if (dataFromRemote[key].apiResponse === 'DataFromDb') {
                                }
                                else {
                                    if (String(metric[j]._id) == String(dataFromRemote[key].metricId)) {
                                        finalData = dataFromRemote[key].apiResponse;
                                    }
                                }
                            }

                            if (dataFromRemote[j].apiResponse != 'DataFromDb') {
                                if (dataFromDb[j].data != null) {
                                    if (dataFromRemote[j].metricId == dataFromDb[j].metricId) {
                                        //merge the old data with new one and update it in db
                                        for (var key = 0; key < dataFromDb[j].data.data.length; key++) {
                                            dbFinalData.push(dataFromDb[j].data.data[key]);
                                        }
                                        for (var r = 0; r < finalData.length; r++) {
                                            var findCurrentDate = _.findIndex(dbFinalData, function (o) {
                                                return o.date == finalData[r].date;
                                            });
                                            if (findCurrentDate === -1) dbFinalData.push(finalData[r]);
                                            else dbFinalData[findCurrentDate] = finalData[r];
                                        }
                                        finalData = [];
                                        for (var k = 0; k < dbFinalData.length; k++) {
                                            finalData.push(dbFinalData[k]);
                                        }
                                        var metricId = metric._id;
                                    }
                                }
                                var now = new Date();

                                //Updating the old data with new one
                                Data.update({
                                    'objectId': widget[j].metrics[0].objectId,
                                    'metricId': metric[j]._id
                                }, {
                                    $setOnInsert: {created: now},
                                    $set: {
                                        data: finalData,
                                        updated: now,
                                        bgFetch: metric[j].bgFetch,
                                        fetchPeriod: metric[j].fetchPeriod
                                    }
                                }, {upsert: true}, function (err, data) {
                                    if (err)
                                        return res.status(500).json({
                                            error: 'Internal server error',
                                            id: req.params.widgetId
                                        });
                                    else if (data == 0)
                                        return res.status(501).json({
                                            error: 'Not implemented',
                                            id: req.params.widgetId
                                        });
                                    else next(null, 'success')
                                });
                            }
                            else
                                next(null, 'success')
                        }
                    }, done);
                }
            }
            else if (allQueryResult.channel.code == configAuth.channels.linkedIn) {
                storeDataForlinkedIn(groupAllChannelData[allQueryResult.channel._id], allQueryResult.allData.data, allQueryResult.allData.widget[0].charts, allQueryResult.allData.metric, callback);
                function storeDataForlinkedIn(dataFromRemote, dataFromDb, widget, metric, done) {
                    async.times(metric.length, function (j, next) {
                        var finalData = [];
                        var dbFinalData=[];
                        if (metric[j].code === configAuth.linkedInMetrics.highestEngagementUpdatesLinkedIn) {
                            callback(null, dataFromRemote[j]);
                        }
                        else {
                            //Array to hold the final result
                            for (var key in dataFromRemote) {
                                if (dataFromRemote[key].apiResponse === 'DataFromDb') {
                                }
                                else {
                                    if (String(metric[j]._id) == String(dataFromRemote[key].metricId))
                                        finalData = dataFromRemote[key].apiResponse;
                                }
                            }
                            if (dataFromRemote[j].apiResponse != 'DataFromDb') {
                                if (dataFromDb[j].data != null) {
                                    if (dataFromRemote[j].metricId == dataFromDb[j].metricId) {

                                        //merge the old data with new one and update it in db
                                        for (var key = 0; key < dataFromDb[j].data.data.length; key++) {
                                            dbFinalData.push(dataFromDb[j].data.data[key]);
                                        }
                                        for (var r = 0; r <finalData.length; r++) {
                                            var findCurrentDate = _.findIndex(dbFinalData, function (o) {
                                                return o.date == finalData[r].date;
                                            });
                                            if (findCurrentDate === -1) dbFinalData.push(finalData[r]);
                                            else dbFinalData[findCurrentDate] = finalData[r];
                                        }
                                        finalData=[];
                                        for (var k = 0; k <dbFinalData.length; k++) {
                                            finalData.push(dbFinalData[k]);
                                        }
                                    }
                                }
                                var now = new Date();

                                //Updating the old data with new one
                                Data.update({
                                    'objectId': widget[j].metrics[0].objectId,
                                    'metricId': metric[j]._id
                                }, {
                                    $setOnInsert: {created: now},
                                    $set: {
                                        data: finalData,
                                        updated: now,
                                        bgFetch: metric[j].bgFetch,
                                        fetchPeriod: metric[j].fetchPeriod
                                    }
                                }, {upsert: true}, function (err, data) {
                                    if (err)
                                        return res.status(500).json({
                                            error: 'Internal server error',
                                            id: req.params.widgetId
                                        })
                                    else if (data == 0)
                                        return res.status(501).json({error: 'Not implemented', id: req.params.widgetId})
                                    else next(null, 'success')
                                });
                            }
                            else
                                next(null, 'success')
                        }
                    }, done);
                }
            }
            else if (allQueryResult.channel.code == configAuth.channels.vimeo) {
                storeDataForVimeo(groupAllChannelData[allQueryResult.channel._id], allQueryResult.allData.data, allQueryResult.allData.widget[0].charts, allQueryResult.allData.metric, callback);
                function storeDataForVimeo(dataFromRemote, dataFromDb, widget, metric, done) {
                    async.times(metric.length, function (j, next) {
                        var finalData = [];
                        var dbFinalData=[];
                        if (metric[j].code === configAuth.vimeoMetric.vimeohighengagement)
                            callback(null, dataFromRemote[j]);
                        else {
                            //Array to hold the final result
                            for (var key in dataFromRemote) {
                                if (dataFromRemote[key].apiResponse === 'DataFromDb') {
                                }
                                else {
                                    if (String(metric[j]._id) == String(dataFromRemote[key].metricId))
                                        finalData = dataFromRemote[key].apiResponse;
                                }
                            }
                            if (dataFromRemote[j].apiResponse != 'DataFromDb') {
                                if (dataFromDb[j].data != null) {
                                    if (dataFromRemote[j].metricId == dataFromDb[j].metricId) {

                                        //merge the old data with new one and update it in db
                                        for (var key = 0; key < dataFromDb[j].data.data.length; key++) {
                                            dbFinalData.push(dataFromDb[j].data.data[key]);
                                        }
                                        for (var r = 0; r <finalData.length; r++) {
                                            var findCurrentDate = _.findIndex(dbFinalData, function (o) {
                                                return o.date == finalData[r].date;
                                            });
                                            if (findCurrentDate === -1) dbFinalData.push(finalData[r]);
                                            else dbFinalData[findCurrentDate] = finalData[r];
                                        }
                                        finalData=[];
                                        for (var k = 0; k <dbFinalData.length; k++) {
                                            finalData.push(dbFinalData[k]);
                                        }                                    }
                                }
                                var now = new Date();
                                //Updating the old data with new one
                                Data.update({
                                    'objectId': widget[j].metrics[0].objectId,
                                    'metricId': metric[j]._id
                                }, {
                                    $setOnInsert: {created: now},
                                    $set: {
                                        data: finalData,
                                        updated: now,
                                        bgFetch: metric[j].bgFetch,
                                        fetchPeriod: metric[j].fetchPeriod
                                    }
                                }, {upsert: true}, function (err, data) {
                                    if (err)
                                        return res.status(500).json({
                                            error: 'Internal server error',
                                            id: req.params.widgetId
                                        })
                                    else if (data == 0)
                                        return res.status(501).json({error: 'Not implemented', id: req.params.widgetId})
                                    else next(null, 'success');
                                });
                            }
                            else
                                next(null, 'success')

                        }
                    }, done);
                }
            }
            else if (allQueryResult.channel.code == configAuth.channels.aweber) {
                storeDataForaweber(groupAllChannelData[allQueryResult.channel._id], allQueryResult.allData.data, allQueryResult.allData.widget[0].charts, allQueryResult.allData.metric, callback);
                function storeDataForaweber(dataFromRemote, dataFromDb, widget, metric, done) {
                    async.times(metric.length, function (j, next) {
                        var finalData = [];
                        var dbFinalData=[];
                        //Array to hold the final result
                        for (var key in dataFromRemote) {
                            if (dataFromRemote[key].apiResponse === 'DataFromDb') {
                            }
                            else {
                                if (String(metric[j]._id) == String(dataFromRemote[key].metricId))
                                    finalData = dataFromRemote[key].apiResponse;
                            }
                        }
                        if (dataFromRemote[j].apiResponse != 'DataFromDb') {
                            if (dataFromDb[j].data != null) {
                                if (dataFromRemote[j].metricId == dataFromDb[j].metricId) {

                                    //merge the old data with new one and update it in db
                                    for (var key = 0; key < dataFromDb[j].data.data.length; key++) {
                                        dbFinalData.push(dataFromDb[j].data.data[key]);
                                    }
                                    for (var r = 0; r <finalData.length; r++) {
                                        var findCurrentDate = _.findIndex(dbFinalData, function (o) {
                                            return o.date == finalData[r].date;
                                        });
                                        if (findCurrentDate === -1) dbFinalData.push(finalData[r]);
                                        else dbFinalData[findCurrentDate] = finalData[r];
                                    }
                                    finalData=[];
                                    for (var k = 0; k <dbFinalData.length; k++) {
                                        finalData.push(dbFinalData[k]);
                                    }
                                }
                            }
                            var now = new Date();

                            //Updating the old data with new one
                            Data.update({
                                'objectId': widget[j].metrics[0].objectId,
                                'metricId': metric[j]._id
                            }, {
                                $setOnInsert: {created: now},
                                $set: {
                                    data: finalData,
                                    updated: now,
                                    bgFetch: metric[j].bgFetch,
                                    fetchPeriod: metric[j].fetchPeriod
                                }
                            }, {upsert: true}, function (err, data) {
                                if (err)
                                    return res.status(500).json({
                                        error: 'Internal server error'
                                    })
                                else if (data == 0)
                                    return res.status(501).json({error: 'Not implemented'})
                                else next(null, 'success')
                            });
                        }
                        else
                            next(null, 'success')
                    }, done);
                }
            }
        }
    }

    //Get the data from db
    function getChannelDataDB(results, callback) {
        getGraphDataFromDb(results.widget.charts, results.metric, callback)
        function getGraphDataFromDb(widget, metric, done) {
            async.times(widget.length, function (k, next) {
                var wholeData = {};
                if (metric[k].code === configAuth.twitterMetric.highEngagementTweets) {
                    wholeData = {
                        "data": results.store_final_data[0].data,
                        "metricId": results.store_final_data[0].metricId,
                        "objectId": results.store_final_data[0].queryResults.object[0]._id
                    }
                    next(null, wholeData)
                }
                else if (metric[k].code === configAuth.instagramStaticVariables.recentPost) {
                    wholeData = {
                        "data": results.store_final_data[0].apiResponse,
                        "metricId": results.store_final_data[0].metricId,
                        "objectId": results.store_final_data[0].queryResults.object[0]._id
                    };
                    next(null, wholeData);
                }
                else if (metric[k].code === configAuth.pinterestMetrics.boardsLeaderBoard || metric[k].code === configAuth.pinterestMetrics.engagementRate) {
                    wholeData = {
                        "data": results.store_final_data[0].apiResponse,
                        "metricId": results.store_final_data[0].metricId,
                        "objectId": results.store_final_data[0].queryResults.object[0]._id
                    };
                    next(null, wholeData);
                }
                else if (metric[k].code === configAuth.linkedInMetrics.highestEngagementUpdatesLinkedIn) {
                    wholeData = {
                        "data": results.store_final_data[0].apiResponse,
                        "metricId": results.store_final_data[0].metricId,
                        "objectId": results.store_final_data[0].queryResults.object[0]._id
                    };
                    next(null, wholeData);

                }
                else if (metric[k].code === configAuth.vimeoMetric.vimeohighengagement) {
                    wholeData = {
                        "data": results.store_final_data[0].apiResponse,
                        "metricId": results.store_final_data[0].metricId,
                        "objectId": results.store_final_data[0].queryResults.object[0]._id
                    };
                    next(null, wholeData);
                }
                else {
                    Data.aggregate([

                            // Unwind the array to denormalize
                            {"$unwind": "$data"},

                            // Match specific array elements
                            {
                                "$match": {
                                    $and: [{"data.date": {$gte: req.body.startDate}}, {"data.date": {$lte: req.body.endDate}},
                                        {"objectId": widget[k].metrics[0].objectId},
                                        {"metricId": widget[k].metrics[0].metricId}]
                                }
                            },

                            // Sort in ascending order
                            {
                                $sort: {
                                    'data.date': 1
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
                            var finalDataArray = [];
                            if (err) {
                                return res.status(500).json({error: 'Internal server error', id: req.params.widgetId});
                            }
                            else if (!response.length) {
                                finalDataArray.push({
                                    metricId: widget[k].metrics[0].metricId,
                                    objectId: widget[k].metrics[0].objectId,
                                    data: response
                                })
                                next(null, finalDataArray)
                            }
                            else {
                                var storeTotal = [];
                                response.forEach(function (value, index) {
                                    value.data.forEach(function (dataValue, dataIndex) {
                                        if (typeof dataValue.total === 'object') {
                                            var total = dataValue.total;
                                            var newObjForTotal = {};
                                            for (var key in dataValue.total) {
                                                var replacedValue = key.split('002E').join('.');
                                                newObjForTotal[replacedValue] = dataValue.total[key];
                                            }
                                            storeTotal.push({total: newObjForTotal, date: dataValue.date})
                                        }
                                    })
                                })
                                if (typeof response[0].data[0].total === 'object') {
                                    finalDataArray.push({
                                        data: storeTotal,
                                        metricId: response[0].metricId,
                                        objectId: response[0].objectId,
                                        updated: response[0].updated,
                                        created: response[0].created
                                    })
                                }
                                else finalDataArray = response
                                next(null, finalDataArray[0]);
                            }
                        })
                }
            }, done)
        }
    }

    //set oauth credentials and get object type details
    function initializeGa(results, callback) {
        googleDataEntireFunction(results, callback);
    }

    //to get google analtic data
    function googleDataEntireFunction(results, callback) {
        var allDataObject = {};
        async.auto({
            get_dimension: getDimension,
            check_data_exist: ['get_dimension', checkDataExist],
            call_get_analytic_data: ['check_data_exist', analyticData]
        }, function (err, results) {
            if (err)
                return callback(err, null);
            allDataObject = {
                results: results,
                queryResults: results.call_get_analytic_data[0].queryResults,
                channelId: results.call_get_analytic_data[0].channelId
            }
            callback(null, allDataObject);
        });

        function getDimension(callback) {
            var dimension;
            var dimensionArray = [];
            var dimensionList = [];

            //Array to hold the final google data
            if (req.body.dimensionList != undefined) {
                dimensionList = req.body.dimensionList;
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
            if (results.metric[0].objectTypes[0].meta.api === configAuth.googleApiTypes.youtubeApi) {

                //set credentials in OAuth2
                var oauth2Client = new OAuth2(configAuth.youTubeAuth.clientID, configAuth.youTubeAuth.clientSecret, configAuth.youTubeAuth.callbackURL);
            }
            else var oauth2Client = new OAuth2(configAuth.googleAuth.clientID, configAuth.googleAuth.clientSecret, configAuth.googleAuth.callbackURL);
            oauth2Client.setCredentials({
                access_token: results.get_profile[0].accessToken,
                refresh_token: results.get_profile[0].refreshToken
            });
            oauth2Client.refreshAccessToken(function (err, tokens) {
                if (err) {
                    if (err.code === 400)
                    { profile.update({_id: results.get_profile[0]._id}, {
                        hasNoAccess:true
                    }, function(err, response) {
                        if(!err){
                            return res.status(401).json({
                                error: 'Authentication required to perform this action',
                                id: req.params.widgetId,
                                errorstatusCode:1003
                            });
                        }
                        else
                            return res.status(500).json({error: 'Internal server error', id: req.params.widgetId});
                    })}
                    else if (err.code === 403)
                        return res.status(403).json({error: 'Forbidden Error', id: req.params.widgetId})
                    else
                        return res.status(500).json({error: 'Internal server error', id: req.params.widgetId})
                }
                else {
                    profile.token = tokens.access_token;
                    oauth2Client.setCredentials({
                        access_token: tokens.access_token,
                        refresh_token: tokens.refresh_token
                    });
                    work(data, metric, object, widget, callback);
                    function work(data, metric, object, widget, done) {
                        var allObjects = {};
                        async.times(metric.length, function (i, next) {
                            var d = new Date();
                            var dimensionArray = [];
                            var dimensionList = metric[i].objectTypes[0].meta.dimension;
                            var getDimension = dimensionList[0].name;
                            var dimensionListLength = dimensionList.length;
                            if (dimensionList.length === 1)
                                dimensionArray.push({'dimension': getDimension});
                            else {

                                //Dynamically form the dimension object like {ga:}
                                for (var k = 1; k < dimensionListLength; k++) {
                                    getDimension = getDimension + ',' + dimensionList[k].name;
                                    dimensionArray.push({'dimension': getDimension});
                                }
                            }
                            dimension = dimensionArray[dimensionArray.length - 1].dimension;
                            if (metric[i].objectTypes[0].meta.api === configAuth.googleApiTypes.mcfApi)
                                var metricName = metric[i].objectTypes[0].meta.gMcfMetricName;
                            else if (metric[i].objectTypes[0].meta.api === configAuth.googleApiTypes.youtubeApi)
                                var metricName = metric[i].objectTypes[0].meta.youtubeMetricName;
                            else
                                var metricName = metric[i].objectTypes[0].meta.gaMetricName;
                            if (data[i].data != null) {
                                var updated = new Date(data[i].data.updated);
                                updated= updated.setHours(updated.getHours() + configAuth.dataValidityInHours);
                                startDate=new Date(updated);
                                var endDate = new Date();
                                if (startDate < endDate) {
                                    startDate = data[i].data.updated;
                                    //startDate.setDate(startDate.getDate() + 1);
                                    startDate = moment(startDate).format('YYYY-MM-DD');
                                    endDate=moment(endDate).format('YYYY-MM-DD');
                                    allObjects = {
                                        oauth2Client: oauth2Client,
                                        object: object[i],
                                        dimension: dimension,
                                        metricName: metricName,
                                        startDate: startDate,
                                        endDate: endDate,
                                        response: results.response,
                                        data: results.data,
                                        results: results,
                                        metricId: data[i].metricId,
                                        api: metric[i].objectTypes[0].meta.api,
                                        metric: metric[i]
                                    };
                                    next(null, allObjects);
                                }
                                else {
                                    allObjects = {metricId: data[i].metricId, data: 'DataFromDb', metric: metric[i]}
                                    next(null, allObjects);
                                }
                            }
                            else {

                                //call google api
                                d.setDate(d.getDate() - 365);
                                var startDate = formatDate(d);
                                var endDate = formatDate(new Date());
                                allObjects = {
                                    oauth2Client: oauth2Client,
                                    object: object[i],
                                    dimension: dimension,
                                    metricName: metricName,
                                    startDate: startDate,
                                    endDate: endDate,
                                    response: results.response,
                                    data: data[i],
                                    results: results,
                                    metricId: data[i].metricId,
                                    api: metric[i].objectTypes[0].meta.api,
                                    metric: metric[i]
                                };
                                next(null, allObjects);
                            }
                        }, done);
                    }
                }
            });
        }

        //to get the final google analytic data
        function analyticData(allObjects, callback) {
            async.concatSeries(allObjects.check_data_exist, getAllMetricData, callback);
        }

        function getAllMetricData(allObjects, callback) {
            var finalData = {};
            if (allObjects.data === 'DataFromDb') {
                finalData = {
                    metricId: allObjects.metricId,
                    data: 'DataFromDb',
                    queryResults: results,
                    channelId: results.metric[0].channelId
                };
                callback(null, finalData);
            }
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

                var apiCallingMethod;
                var apiQuery = {}
                if (allObjects.api === configAuth.googleApiTypes.mcfApi) {
                    apiQuery = {
                        'key': configAuth.googleAuth.clientSecret,
                        'ids': 'ga:' + allObjects.object.channelObjectId,
                        'start-date': allObjects.startDate,
                        'end-date': allObjects.endDate,
                        'dimensions': allObjects.dimension,
                        'metrics': allObjects.metricName,
                        prettyPrint: true,
                    }
                    var analytics = googleapis.analytics({version: 'v3', auth: allObjects.oauth2Client}).data.mcf.get;
                    callGoogleApi(apiQuery);
                }
                else if (allObjects.api === configAuth.googleApiTypes.youtubeApi) {
                    apiQuery = {
                        'access_token': allObjects.oauth2Client.credentials.access_token,
                        'ids': 'channel==' + allObjects.object.channelObjectId,
                        'start-date': allObjects.startDate,
                        'end-date': allObjects.endDate,
                        'dimensions': allObjects.dimension,
                        'metrics': allObjects.metricName,
                        prettyPrint: true,
                    }
                    var analytics = googleapis.youtubeAnalytics({
                        version: 'v1',
                        auth: allObjects.oauth2Client
                    }).reports.query;
                    callGoogleApi(apiQuery);
                }
                else {
                    apiQuery = {
                        'auth': allObjects.oauth2Client,
                        'ids': 'ga:' + allObjects.object.channelObjectId,
                        'start-date': allObjects.startDate,
                        'end-date': allObjects.endDate,
                        'dimensions': allObjects.dimension,
                        'metrics': allObjects.metricName,
                        prettyPrint: true
                    }
                    var analytics = googleapis.analytics({version: 'v3', auth: allObjects.oauth2Client}).data.ga.get;
                    callGoogleApi(apiQuery);
                }
                /**Method to call the google api
                 * @param oauth2Client - set credentials
                 */
                var googleResult = [];

                function callGoogleApi(apiQuery) {
                    analytics(apiQuery, function (err, result) {
                        if (err) {
                            if (err.code === 400)
                            { profile.update({_id: results.get_profile[0]._id}, {
                                hasNoAccess:true
                            }, function(err, response) {
                                if(!err){
                                    return res.status(401).json({
                                        error: 'Authentication required to perform this action',
                                        id: req.params.widgetId,
                                        errorstatusCode:1003
                                    });
                                }
                                else
                                    return res.status(500).json({error: 'Internal server error', id: req.params.widgetId});
                            })
                            }
                            else
                                return res.status(500).json({error: 'Internal server error', id: req.params.widgetId})
                        }
                        else {
                            var analyticsDimension=[]
                            if(result.columnHeaders != undefined)
                                 analyticsDimension=result.columnHeaders;
                            if (result.rows != undefined) {
                                for (var i = 0; i < result.rows.length; i++)
                                    googleResult.push(result.rows[i]);
                            }
                            else googleResult = 'No Data';
                            if (result.nextLink != undefined) {
                                var splitRequiredQueryData = result.nextLink.split('&');
                                if (allObjects.api === configAuth.googleApiTypes.mcfApi) {
                                    apiQuery = {
                                        'key': configAuth.googleAuth.clientSecret,
                                        'ids': 'ga:' + allObjects.object.channelObjectId,
                                        'start-date': splitRequiredQueryData[3].substr(splitRequiredQueryData[3].indexOf('=') + 1),
                                        'end-date': splitRequiredQueryData[4].substr(splitRequiredQueryData[4].indexOf('=') + 1),
                                        'start-index': splitRequiredQueryData[5].substr(splitRequiredQueryData[5].indexOf('=') + 1),
                                        'dimensions': allObjects.dimension,
                                        'metrics': allObjects.metricName,
                                        prettyPrint: true,
                                    }
                                }
                                else if (allObjects.api === configAuth.googleApiTypes.youtubeApi) {
                                    apiQuery = {
                                        'key': configAuth.youTubeAuth.clientSecret,
                                        'ids': 'channel==' + allObjects.object.channelObjectId,
                                        'start-date': splitRequiredQueryData[3].substr(splitRequiredQueryData[3].indexOf('=') + 1),
                                        'end-date': splitRequiredQueryData[4].substr(splitRequiredQueryData[4].indexOf('=') + 1),
                                        'start-index': splitRequiredQueryData[5].substr(splitRequiredQueryData[5].indexOf('=') + 1),
                                        'dimensions': allObjects.dimension,
                                        'metrics': allObjects.metricName,
                                        prettyPrint: true,
                                    }
                                }
                                else {
                                    apiQuery = {
                                        'auth': allObjects.oauth2Client,
                                        'ids': 'ga:' + allObjects.object.channelObjectId,
                                        'start-date': splitRequiredQueryData[3].substr(splitRequiredQueryData[3].indexOf('=') + 1),
                                        'end-date': splitRequiredQueryData[4].substr(splitRequiredQueryData[4].indexOf('=') + 1),
                                        'start-index': splitRequiredQueryData[5].substr(splitRequiredQueryData[5].indexOf('=') + 1),
                                        'dimensions': allObjects.dimension,
                                        'metrics': allObjects.metricName,
                                        prettyPrint: true
                                    }
                                }
                                callGoogleApi(apiQuery);
                            }
                            else {
                                finalData = {
                                    metricId: allObjects.metricId,
                                    data: googleResult,
                                    queryResults: results,
                                    channelId: results.metric[0].channelId,
                                    startDate: allObjects.startDate,
                                    endDate: allObjects.endDate,
                                    metric: allObjects.metric,
                                    Dimension:analyticsDimension
                                };
                                callback(null, finalData);
                            }
                        }
                    });
                }
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
            if (err) {
                return callback(err, null);
            }
            callback(null, results.get_fb_ads_data_from_remote);
        });
        function callFetchFBadsData(callback) {
            work(initialResults.data, initialResults.object, initialResults.metric, callback);
            function work(data, object, metric, done) {
                async.timesSeries(object.length, function (j, next) {
                    var adAccountId = initialResults.object[j].channelObjectId;
                    d = new Date();
                    var allObjects = {};

                    //to form query based on start end date
                    function setStartEndDate(n, callback) {
                        d.setDate(d.getDate() + 1);
                        var endDate = calculateDate(d);
                        d.setDate(d.getDate() - n);
                        var startDate = calculateDate(d);
                        var query = configAuth.apiVersions.FBADs + "/" + adAccountId + "/insights?limit=365&time_increment=1&fields=" + initialResults.metric[j].objectTypes[0].meta.fbAdsMetricName + '&time_range[since]=' + startDate + '&time_range[until]=' + endDate;
                        allObjects = {
                            profile: initialResults.get_profile[j],
                            query: query,
                            widget: metric[j],
                            dataResult: data[j],
                            startDate: startDate,
                            endDate: endDate,
                            metricId: metric[j]._id,
                            metricName: initialResults.metric[j].objectTypes[0].meta.fbAdsMetricName,
                            metric: metric[j]
                        }
                        callback(null, allObjects);
                    }

                    if (data[j].data != null) {
                        var updated = new Date(data[j].data.updated);
                        updated= updated.setHours(updated.getHours() + configAuth.dataValidityInHours);
                        updated=new Date(updated);
                        var currentDate = new Date();
                        if (updated < currentDate) {
                            updated = data[j].data.updated;
                            // updated.setDate(updated.getDate() + 1);
                            updated = moment(updated).format('YYYY-MM-DD');
                            currentDate = moment(new Date()).format('YYYY-MM-DD');
                            var query = configAuth.apiVersions.FBADs + "/" + adAccountId + "/insights?limit=365&time_increment=1&fields=" + initialResults.metric[j].objectTypes[0].meta.fbAdsMetricName + '&time_range[since]=' + updated + '&time_range[until]=' + currentDate;
                            allObjects = {
                                profile: initialResults.get_profile[j],
                                query: query,
                                widget: metric[j],
                                dataResult: data[j].data,
                                startDate: updated,
                                endDate: currentDate,
                                metricId: metric[j]._id,
                                metricName: initialResults.metric[j].objectTypes[0].meta.fbAdsMetricName,
                                metric: metric[j]
                            }
                            next(null, [allObjects]);
                        }
                        else {
                            allObjects = {
                                profile: initialResults.get_profile[j],
                                query: query,
                                widget: metric[j],
                                dataResult: 'DataFromDb',
                                startDate: updated,
                                endDate: currentDate,
                                metricId: metric[j]._id,
                                channelId: metric[j].channelId,
                                metricName: initialResults.metric[j].objectTypes[0].meta.fbAdsMetricName,
                                metric: metric[j]
                            }
                            next(null, allObjects);
                        }
                    }
                    else {
                        var d = new Date();
                        async.map([365], setStartEndDate, function (err, query) {
                            next(null, query);
                        });
                    }
                }, done)
            }
        }

        // This Function executed to get insights data like(impression,clicks)
        function fetchFBadsData(allObjects, callback) {
            var entireObjects = {};
            if (allObjects.call_fb_ads_data.dataResult === 'DataFromDb') {
                entireObjects = {
                    profile: '',
                    query: query,
                    widget: '',
                    dataResult: 'DataFromDb',
                    startDate: updated,
                    endDate: '',
                    metricId: allObjects.call_fb_ads_data.metricId,
                    channelId: allObjects.call_fb_ads_data.channelId
                }
                callback(null, entireObjects);
            }
            else
                async.concatSeries(allObjects.call_fb_ads_data, getFbAdsForAllMetrics, callback);

        }

        function getFbAdsForAllMetrics(results, callback) {
            var queryResponse = {};
            if (results.dataResult === 'DataFromDb') {
                queryResponse = {
                    data: 'DataFromDb',
                    metricId: results.metricId,
                    queryResults: initialResults,
                    channelId: initialResults.metric[0].channelId
                }
                callback(null, queryResponse);
            }

            else {
                async.concatSeries(results, getFbAdsForEachMetric, callback);
            }
        }

        function getFbAdsForEachMetric(results, callback) {
            var queryResponse = {};
            var storeDefaultValues = [];
            FB.setAccessToken(results.profile.accessToken);
            var tot_metric = [];
            var finalData = {};
            var query = results.query;
            Adsinsights(query);
            function Adsinsights(query) {
                var metricId = results.metricId;
                FB.api(query, function (apiResult) {
                    if (apiResult.error) {
                        if (apiResult.error.code === 190)
                        {
                            profile.update({_id: results.profile._id}, {
                                hasNoAccess:true
                            }, function(err, response) {
                                if(!err){
                                    return res.status(401).json({
                                        error: 'Authentication required to perform this action',
                                        id: req.params.widgetId,
                                        errorstatusCode:1003
                                    });
                                }
                                else
                                    return res.status(500).json({error: 'Internal server error', id: req.params.widgetId});
                            })
                        }
                        else if (apiResult.error.code === 4)
                            return res.status(4).json({error: 'Forbidden Error', id: req.params.widgetId})
                        else
                            return res.status(500).json({error: 'Internal server error', id: req.params.widgetId})

                    }
                    else {
                        var wholeData = [];
                        var storeMetricName = results.metricName;
                        var storeStartDate = new Date(results.startDate);
                        var storeEndDate = new Date(results.endDate);
                        /*                        var timeDiff = Math.abs(storeEndDate.getTime() - storeStartDate.getTime());
                         var diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24));*/
                        if (results.metric.objectTypes[0].meta.endpoint.length)
                            var storeDefaultValues = findDaysDifference(storeStartDate, storeEndDate, results.metric.objectTypes[0].endPoint);
                        else {
                            if (results.metric.objectTypes[0].meta.responseType === 'object')
                                var storeDefaultValues = findDaysDifference(storeStartDate, storeEndDate, undefined, 'noEndPoint');
                            else var storeDefaultValues = findDaysDifference(storeStartDate, storeEndDate, undefined);
                        }

                        //controlled pagination Data
                        if (apiResult.data.length != 0) {
                            if (apiResult.paging && apiResult.paging.next) {
                                for (var key in apiResult.data)
                                    tot_metric.push({
                                        total: apiResult.data[key][storeMetricName],
                                        date: apiResult.data[key].date_start
                                    });
                                var nextPage = apiResult.paging.next;
                                var str = nextPage;
                                var recallApi = str.replace(configAuth.facebookSite.site, " ").trim();
                                Adsinsights(recallApi);
                            }
                            else {
                                for (var key in apiResult.data)
                                    tot_metric.push({
                                        total: apiResult.data[key][storeMetricName],
                                        date: apiResult.data[key].date_start
                                    });
                                var obj_metric = tot_metric.length;
                                for (var j = 0; j < obj_metric; j++) {
                                    wholeData.push({date: tot_metric[j].date, total: tot_metric[j].total});
                                }

                                //To replace the missing dates in whole data with empty values
                                var validData = wholeData.length;
                                for (var j = 0; j < validData; j++) {
                                    for (var k = 0; k < storeDefaultValues.length; k++) {
                                        if (wholeData[j].date === storeDefaultValues[k].date)
                                            storeDefaultValues[k].total = wholeData[j].total;
                                    }

                                }
                            }
                        }
                        else {
                            if (results.metric.objectTypes[0].meta.responseType === 'object')
                                var storeDefaultValues = findDaysDifference(storeStartDate, storeEndDate, undefined, 'noEndPoint');
                            else var storeDefaultValues = findDaysDifference(storeStartDate, storeEndDate, undefined);
                        }
                        finalData = {
                            metricId: metricId,
                            data: storeDefaultValues
                        };
                        queryResponse = {
                            data: storeDefaultValues,
                            metricId: metricId,
                            queryResults: initialResults,
                            channelId: initialResults.metric[0].channelId
                        }
                        callback(null, queryResponse);

                    }


                })

            }
        }
    }

    function selectAdwordsObjectType(initialResults, callback) {
        async.auto({
            call_adword_data: fetchAdwordsQuery,
            get_google_adsword_data_from_remote: ['call_adword_data', fetchGoogleAdwordsData]
        }, function (err, results) {
            if (err) {
                return callback(err, null);
            }
            callback(null, results.get_google_adsword_data_from_remote);
        });
        function fetchAdwordsQuery(callback) {
            work(initialResults.data, initialResults.object, initialResults.metric, callback);
            function work(data, object, metric, done) {
                async.timesSeries(metric.length, function (j, next) {
                    var adAccountId = initialResults.object[j].channelObjectId;
                    d = new Date();
                    objectType.findOne({
                        '_id':initialResults.object[j].objectTypeId ,
                    }, function (err, objectType) {
                        if (err)
                            return res.status(500).json({error: err});
                        else {
                            var allObjects = {};
                            if (data[j].data != null) {
                                var updated = new Date(data[j].data.updated);
                                updated= updated.setHours(updated.getHours() + configAuth.dataValidityInHours);
                                updated=new Date(updated);
                                var currentDate = new Date();
                                console.log('diffime',updated,currentDate);
                                if (updated < currentDate) {
                                    var updated = data[j].data.updated;
                                    var oneDay = 24 * 60 * 60 * 1000; // hours*minutes*seconds*milliseconds
                                    updated = moment(updated).format('YYYY-MM-DD');
                                    var startDate = moment(new Date()).format('YYYY-MM-DD');
                                    // var newStartDate = updated.replace(/-/g, "");
                                    if (configAuth.objectType.googleAdwordAdGroup == objectType.type) {
                                        var query = [configAuth.googleAdwordsStatic.adGroupId , configAuth.googleAdwordsStatic.date , initialResults.metric[j].objectTypes[0].meta.gAdsMetricName];
                                        var performance = configAuth.googleAdwordsStatic.ADGROUP_PERFORMANCE_REPORT;
                                        var clientId = initialResults.object[j].meta.accountId;
                                        var objects =[{field:configAuth.googleAdwordsStatic.adGroupIdEqual,operator:"EQUALS",values:[initialResults.object[j].channelObjectId]}]  ;
                                    }
                                    else if (configAuth.objectType.googleAdwordCampaign == objectType.type) {
                                        var query = [configAuth.googleAdwordsStatic.campaignId , configAuth.googleAdwordsStatic.date , initialResults.metric[j].objectTypes[0].meta.gAdsMetricName];
                                        var performance = configAuth.googleAdwordsStatic.CAMPAIGN_PERFORMANCE_REPORT;
                                        var clientId = initialResults.object[j].meta.accountId;
                                        var objects =[{field:configAuth.googleAdwordsStatic.campaignEqual,operator:"EQUALS",values:[initialResults.object[j].channelObjectId]}]  ;
                                    }
                                    else if (configAuth.objectType.googleAdwordAd == objectType.type) {
                                        var query = [configAuth.googleAdwordsStatic.id , configAuth.googleAdwordsStatic.date , initialResults.metric[j].objectTypes[0].meta.gAdsMetricName];
                                        var performance = configAuth.googleAdwordsStatic.AD_PERFORMANCE_REPORT;
                                        var clientId = initialResults.object[j].meta.accountId;
                                        var objects =[{field:configAuth.googleAdwordsStatic.idEquals,operator:"EQUALS",values:[initialResults.object[j].channelObjectId]}]  ;
                                    }
                                    else {
                                        var query = [configAuth.googleAdwordsStatic.date , initialResults.metric[j].objectTypes[0].meta.gAdsMetricName];
                                        var performance = configAuth.googleAdwordsStatic.ACCOUNT_PERFORMANCE_REPORT;
                                        var clientId = initialResults.object[j].channelObjectId;
                                        var objects = ""
                                    }
                                    allObjects = {
                                        profile: initialResults.get_profile[j],
                                        query: query,
                                        widget: metric[j],
                                        dataResult: data[j].data,
                                        startDate: updated,
                                        objects: objects,
                                        endDate: startDate,
                                        metricId: metric[j]._id,
                                        metricCode: metric[j].code,
                                        clientId: clientId,
                                        performance: performance
                                    }
                                    next(null, allObjects);
                                }
                                else
                                    next(null, 'DataFromDb');
                            }
                            else {
                                var d = new Date();
                                //call google api
                                d.setDate(d.getDate() - 365);
                                var startDate = formatDate(d);
                                // var newStr = startDate.replace(/-/g, "");
                                // startDate = newStr;
                                var endDate = formatDate(new Date());
                                // var newEndDate = endDate.replace(/-/g, "");
                                // var endDate = newEndDate;
                                if (configAuth.objectType.googleAdwordAdGroup == objectType.type) {

                                    var query = [configAuth.googleAdwordsStatic.adGroupId , configAuth.googleAdwordsStatic.date , initialResults.metric[j].objectTypes[0].meta.gAdsMetricName];
                                    var performance = configAuth.googleAdwordsStatic.ADGROUP_PERFORMANCE_REPORT;
                                    var clientId = initialResults.object[j].meta.accountId;
                                    var objects =[{field:configAuth.googleAdwordsStatic.adGroupIdEqual,operator:"EQUALS",values:[initialResults.object[j].channelObjectId]}]  ;
                                }
                                else if (configAuth.objectType.googleAdwordCampaign == objectType.type) {
                                    var query = [configAuth.googleAdwordsStatic.campaignId , configAuth.googleAdwordsStatic.date , initialResults.metric[j].objectTypes[0].meta.gAdsMetricName];
                                    var performance = configAuth.googleAdwordsStatic.CAMPAIGN_PERFORMANCE_REPORT;
                                    var clientId = initialResults.object[j].meta.accountId;
                                    var objects =[{field:configAuth.googleAdwordsStatic.campaignEqual,operator:"EQUALS",values:[initialResults.object[j].channelObjectId]}]  ;
                                    // var objects = configAuth.googleAdwordsStatic.campaignEqual + initialResults.object[j].channelObjectId;
                                }
                                else if (configAuth.objectType.googleAdwordAd == objectType.type) {
                                    var query = [configAuth.googleAdwordsStatic.id , configAuth.googleAdwordsStatic.date , initialResults.metric[j].objectTypes[0].meta.gAdsMetricName];
                                    var performance = configAuth.googleAdwordsStatic.AD_PERFORMANCE_REPORT;
                                    var clientId = initialResults.object[j].meta.accountId;
                                    var objects =[{field:configAuth.googleAdwordsStatic.idEquals,operator:"EQUALS",values:[initialResults.object[j].channelObjectId]}]  ;

                                    // var objects = configAuth.googleAdwordsStatic.idEquals + initialResults.object[j].channelObjectId;
                                }
                                else {
                                    var query = [configAuth.googleAdwordsStatic.date , initialResults.metric[j].objectTypes[0].meta.gAdsMetricName];
                                    var performance = configAuth.googleAdwordsStatic.ACCOUNT_PERFORMANCE_REPORT;
                                    var clientId = initialResults.object[j].channelObjectId;
                                    var objects = ""
                                }
                                allObjects = {
                                    profile: initialResults.get_profile[j],
                                    query: query,
                                    widget: metric[j],
                                    dataResult: data[j].data,
                                    clientId: clientId,
                                    objects: objects,
                                    startDate: startDate,
                                    performance: performance,
                                    endDate: endDate,
                                    metricId: metric[j]._id,
                                    metricCode: metric[j].code
                                };
                                next(null, allObjects);
                            }
                        }
                    })
                }, done)
            }
        }

        // This Function executed to get insights data like(impression,clicks)
        function fetchGoogleAdwordsData(allObjects, callback) {
            var count = 0;
            var actualFinalApiData = {};
            async.concatSeries(allObjects.call_adword_data, checkDbData, callback);
            function checkDbData(result, callback) {
                count++;
                if (result == 'DataFromDb') {
                    actualFinalApiData = {
                        apiResponse: 'DataFromDb',
                        // metricId: results.metricId,
                        queryResults: initialResults,
                        channelId: initialResults.metric[0].channelId
                    };
                    callback(null, actualFinalApiData);
                }
                else {
                    getAdwordsDataForEachMetric(result, callback);
                }
            }
        }

        function getAdwordsDataForEachMetric(results, callback) {
            semaphore.take(function () {
                var errorCount = 0;
                var during = results.startDate + ',' + results.endDate;
                var report = new AdwordsReport({
                    developerToken: configAuth.googleAdwordsAuth.developerToken,
                    userAgent: configAuth.googleAdwordsAuth.userAgent,//your adwords developerToken
                    clientCustomerId: results.clientId, //the Adwords Account id (e.g. 123-123-123)
                    client_id: configAuth.googleAdwordsAuth.clientID, //this is the api console client_id
                    client_secret: configAuth.googleAdwordsAuth.clientSecret,
                    refresh_token: results.profile.refreshToken
                });
                report.getReport('v201605', {
                        reportName: 'Custom Adgroup Performance Report',
                        reportType: results.performance,
                        fields: results.query,
                        filters: results.objects,
                        startDate: new Date(results.startDate),
                        endDate: new Date(results.endDate),
                        format: 'TSV'
                    }, function(error, report) {
                        if (error) {
                            semaphore.leave();
                            if (error.code === 400) {
                                profile.update({_id: results.profile._id}, {
                                    hasNoAccess:true
                                }, function(err, response) {
                                    if(!err){
                                        return res.status(401).json({
                                            error: 'Authentication required to perform this action',
                                            id: req.params.widgetId,
                                            errorstatusCode:1003
                                        });
                                    }
                                    else
                                        return res.status(500).json({error: 'Internal server error', id: req.params.widgetId});
                                })
                            }
                            else
                                return res.status(500).json({error: 'Internal server error', id: req.params.widgetId});
                        }
                        else {
                            semaphore.leave();
                            data = tsvJSON(report);
                            // console.log("data",data)
                            function tsvJSON(tsv) {
                                var lines = tsv.split("\n");
                                var result = [];
                                var headers = lines[1].split("\t");
                                for (var i = 2; i < lines.length - 2; i++) {
                                    var obj = {};
                                    var currentline = lines[i].split("\t");
                                    for (var j = 0; j < headers.length; j++) {
                                        obj[headers[j]] = currentline[j];
                                    }
                                    result.push(obj);
                                }
                                return (result); //JSON
                            }
                            storeAdwordsFinalData(results, data)
                        }
                    }
                )
            })
            //To store the final result in db
            function storeAdwordsFinalData(results, data) {
                var actualFinalApiData = {};
                if (data.error) {
                    return res.status(500).json({error: 'Internal server error', id: req.params.widgetId});
                }

                //Array to hold the final result
                var param = [];
                if (results.metricCode === configAuth.googleAdwordsMetric.clicks)
                    param.push('Clicks');
                else if (results.metricCode === configAuth.googleAdwordsMetric.cost)
                    param.push('Cost');
                else if (results.metricCode === configAuth.googleAdwordsMetric.conversionRate)
                    param.push('Conv. rate');
                else if (results.metricCode === configAuth.googleAdwordsMetric.conversions)
                    param.push('Conversions');
                else if (results.metricCode === configAuth.googleAdwordsMetric.impressions)
                    param.push('Impressions');
                else if (results.metricCode === configAuth.googleAdwordsMetric.clickThroughRate)
                    param.push('CTR')
                else if (results.metricCode === configAuth.googleAdwordsMetric.costPerClick)
                    param.push('Avg. CPC');
                else if (results.metricCode === configAuth.googleAdwordsMetric.costPerThousandImpressions)
                    param.push('Avg. CPM');
                else
                    param.push('Cost / conv.');
                var finalData = [];
                var sampleArray = [];
                var totalValue;
                for (var prop = 0; prop < data.length; prop++) {
                    if (results.metricCode === configAuth.googleAdwordsMetric.costPerConversion || results.metricCode === configAuth.googleAdwordsMetric.costPerClick || results.metricCode === configAuth.googleAdwordsMetric.costPerThousandImpressions || results.metricCode === configAuth.googleAdwordsMetric.cost)
                        totalValue = parseFloat((data[prop][param] / 1000000).toFixed(2));
                    else
                        totalValue = parseFloat(data[prop][param]);
                    var value = {};
                    value = {
                        total: totalValue,
                        date: data[prop].Day
                    };
                    sampleArray.push(value);
                }
                var storeStartDate = new Date(results.startDate);
                var storeEndDate = new Date(results.endDate);
                var timeDiff = Math.abs(storeEndDate.getTime() - storeStartDate.getTime());
                var diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24));
                for (var i = 0; i <= diffDays; i++){
                    var finalDate = formatDate(storeStartDate);
                    finalData.push({
                        total: 0,
                        date: finalDate
                    })
                    storeStartDate.setDate(storeStartDate.getDate() + 1);
                }
                for (var key = 0; key < finalData.length; key++) {
                    var findCurrentDate = _.findIndex(sampleArray, function (o) {
                        return o.date == finalData[key].date;
                    });
                    if(findCurrentDate !== -1){
                        finalData[key]=sampleArray[findCurrentDate];
                    }
                }
                if (results.dataResult != null) {

                    //merge the old data with new one and update it in db
                    for (var key = 0; key < results.dataResult.length; key++) {
                        finalData.push(results.dataResult[key]);
                    }
                    actualFinalApiData = {
                        apiResponse: finalData,
                        metricId: results.metricId,
                        queryResults: initialResults,
                        channelId: initialResults.metric[0].channelId
                    }
                    callback(null, actualFinalApiData);

                }
                else {
                    actualFinalApiData = {
                        apiResponse: finalData,
                        metricId: results.metricId,
                        queryResults: initialResults,
                        channelId: initialResults.metric[0].channelId
                    }
                    callback(null, actualFinalApiData);
                }
            }
        }
    }

    function getTweetData(results, callback) {
        async.auto({
            get_tweet_queries: getTweetQueries,
            get_tweet_data_from_remote: ['get_tweet_queries', getTweetDataFromRemote]

        }, function (err, results) {
            if (err) {
                return callback(err, null);
            }
            callback(null, results.get_tweet_data_from_remote);
        });

        function getTweetQueries(callback) {
            var queries = {};
            formTweetQuery(results.metric, results.data, results.get_profile, callback);
            function formTweetQuery(metric, data, profile, callback) {
                async.timesSeries(metric.length, function (j, next) {
                    var query = metric[j].objectTypes[0].meta.TweetMetricName;
                    var metricType = metric[j].code;
                    if (data[j].data != null) {
                        var updated = new Date(data[j].data.updated);
                        updated= updated.setHours(updated.getHours() + configAuth.dataValidityInHours);
                        updated=new Date(updated);
                        var endDate=new Date();
                        if (updated > endDate) {
                            queries = {
                                inputs: 'DataFromDb',
                                query: '',
                                metricId: metric[j]._id,
                                channelId: metric[j].channelId,
                                metricCode: metricType
                            };
                            next(null, queries);
                        }
                        else if ( updated < endDate)
                            setTweetQuery();
                        else {
                            queries = {
                                inputs: 'DataFromDb',
                                query: '',
                                metricId: metric[j]._id,
                                channelId: metric[j].channelId,
                                metricCode: metricType
                            };
                            next(null, queries);
                        }

                    }
                    else
                        setTweetQuery();
                    function setTweetQuery() {

                        if (metricType === configAuth.twitterMetric.keywordMentions)
                            var inputs = {q: '%23' + profile[j].name, count: count};

                        else if (metricType === configAuth.twitterMetric.mentions)
                            var inputs = {screen_name: profile[j].name, count: 200};
                        else
                            var inputs = {screen_name: profile[j].name, count: 200};

                        queries = {
                            inputs: inputs,
                            query: query,
                            metricId: metric[j]._id,
                            channelId: metric[j].channelId,
                            metricCode: metricType
                        };
                        next(null, queries);
                    }


                }, callback)
            }

        }

        //To get tweet data from tweet api
        function getTweetDataFromRemote(queries, callback) {
            var finalTwitterResponse = [];
            var wholeTweetObjects = [];
            var index = 0;
            var oldMaxId;
            async.timesSeries(queries.get_tweet_queries.length, function (j, next) {
                if (queries.get_tweet_queries[j].inputs === 'DataFromDb') {
                    finalTwitterResponse = {
                        data: 'DataFromDb',
                        metricId: queries.get_tweet_queries[j].metricId,
                        channelId: queries.get_tweet_queries[j].channelId,
                        queryResults: results
                    }
                    next(null, finalTwitterResponse)
                }
                else {
                    callTwitterApi(queries, j, wholeTweetObjects, oldMaxId, index, function (err, response) {
                        if (err)
                            return res.status(500).json({error: 'Internal server error', id: req.params.widgetId});
                        else {
                            next(null, response);
                        }
                    });
                }


            }, callback)
        }

        function callTwitterApi(queries, j, wholeTweetObjects, oldMaxId, index, callback) {
            var finalTwitterResponse = {};
            var finalHighEngagedTweets = [];
            var query = queries.get_tweet_queries[j].query;
            var inputs = queries.get_tweet_queries[j].inputs;
            var highEngagedTweetsCount = [];
            var sortedTweetsArray = [];
            var storeTweetDate;
            var storeDefaultValues = [];
            var removeDuplicate = [];

            client.get(query, inputs, function (error, tweets, response) {
                if (error) {
                    return res.status(500).json({error: 'Internal server error', id: req.params.widgetId});
                }
                else {
                    if (queries.get_tweet_queries[j].metricCode === configAuth.twitterMetric.tweets || queries.get_tweet_queries[j].metricCode === configAuth.twitterMetric.followers || queries.get_tweet_queries[j].metricCode === configAuth.twitterMetric.following || queries.get_tweet_queries[j].metricCode === configAuth.twitterMetric.favourites || queries.get_tweet_queries[j].metricCode === configAuth.twitterMetric.listed || queries.get_tweet_queries[j].metricCode === configAuth.twitterMetric.retweets_of_your_tweets) {

                        finalTwitterResponse = {
                            data: tweets,
                            metricId: queries.get_tweet_queries[j].metricId,
                            channelId: queries.get_tweet_queries[j].channelId,
                            queryResults: results
                        };
                        callback(null, finalTwitterResponse);
                    }
                    else {
                        if (index == 0 && tweets.length == 0) {
                            finalTwitterResponse = {
                                data: tweets,
                                metricId: queries.get_tweet_queries[j].metricId,
                                channelId: queries.get_tweet_queries[j].channelId,
                                queryResults: results
                            };
                            callback(null, finalTwitterResponse);
                        }

                        else if (index == 0 && tweets.length != 0) {
                            oldMaxId = tweets[tweets.length - 1].id;
                            tweets.forEach(function (value, index) {
                                storeTweetDate = formatDate(new Date(Date.parse(value.created_at.replace(/( +)/, ' UTC$1'))));
                                wholeTweetObjects.push({total: value, date: storeTweetDate});
                            });

                            queries.get_tweet_queries[j].inputs = {
                                screen_name: queries.get_tweet_queries[j].inputs.screen_name,
                                count: queries.get_tweet_queries[j].inputs.count,
                                max_id: oldMaxId
                            };
                            index++;
                            callTwitterApi(queries, j, wholeTweetObjects, oldMaxId, index, callback);
                        }
                        else if (index != 0 && tweets.length != 0) {
                            if (oldMaxId === tweets[tweets.length - 1].id) {
                                tweets.forEach(function (value, index) {
                                    storeTweetDate = formatDate(new Date(Date.parse(value.created_at.replace(/( +)/, ' UTC$1'))));
                                    wholeTweetObjects.push({total: value, date: storeTweetDate});
                                });
                                storingProcess(wholeTweetObjects);
                            }
                            else {
                                oldMaxId = tweets[tweets.length - 1].id;
                                var maxId = tweets[tweets.length - 1].id;
                                tweets.forEach(function (value, index) {
                                    storeTweetDate = formatDate(new Date(Date.parse(value.created_at.replace(/( +)/, ' UTC$1'))));
                                    wholeTweetObjects.push({total: value, date: storeTweetDate});
                                });
                                queries.get_tweet_queries[j].inputs = {
                                    screen_name: queries.get_tweet_queries[j].inputs.screen_name,
                                    count: queries.get_tweet_queries[j].inputs.count,
                                    max_id: maxId
                                };
                                callTwitterApi(queries, j, wholeTweetObjects, oldMaxId, index, callback);
                            }
                        }
                        else if (index != 0 && tweets.length == 0)
                            storingProcess(wholeTweetObjects)

                        function storingProcess(wholeTweetObjects) {
                            for (var i = 0; i < wholeTweetObjects.length; i++) {
                                var lastCreatedAt = formatDate(new Date(Date.parse(wholeTweetObjects[i].total.created_at)));
                                var changeFormatCreateAt = moment.utc(lastCreatedAt).unix();
                                var startDate = moment.utc(req.body.startDate).unix();
                                var endDate = moment.utc(req.body.endDate).unix();

                                if (changeFormatCreateAt >= startDate && changeFormatCreateAt <= endDate) {
                                    var count = wholeTweetObjects[i].total.retweet_count + wholeTweetObjects[i].total.favorite_count;
                                    highEngagedTweetsCount.push({
                                        count: count,
                                        total: wholeTweetObjects[i].total,
                                        date: moment.utc(wholeTweetObjects[i].date).unix()
                                    });
                                }
                            }
                            var sortedTweetsReverse = [];
                            storeDefaultValues = _.sortBy(highEngagedTweetsCount, ['count', 'date']);
                            sortedTweetsArray = _.orderBy(storeDefaultValues, ['count'], ['desc']);

                            for (var i = 0; i < sortedTweetsArray.length; i++) {
                                if (i == 0) {
                                    removeDuplicate[i] = {
                                        count: sortedTweetsArray[i].count,
                                        date: moment.unix(sortedTweetsArray[i].date).format("YYYY/MM/DD"),
                                        total: sortedTweetsArray[i].total
                                    };
                                }
                                else if (removeDuplicate[i - 1].count === sortedTweetsArray[i].count) {
                                    var UnsortedDate = new Date(Date.parse(removeDuplicate[i - 1].total.created_at.replace(/( \+)/, ' UTC$1')));
                                    var SortedDate = new Date(Date.parse(sortedTweetsArray[i].total.created_at.replace(/( \+)/, ' UTC$1')));
                                    var removeDuplicateDate = moment.utc(UnsortedDate).unix();
                                    var sortedTweetsArrayDate = moment.utc(SortedDate).unix();

                                    if (removeDuplicateDate < sortedTweetsArrayDate) {
                                        var beforValue = removeDuplicate[i - 1];
                                        removeDuplicate[i - 1] = {
                                            count: sortedTweetsArray[i].count,
                                            date: moment.unix(sortedTweetsArray[i].date).format("YYYY/MM/DD"),
                                            total: sortedTweetsArray[i].total
                                        };
                                        removeDuplicate[i] = beforValue;
                                    }
                                    else {
                                        removeDuplicate[i] = {
                                            count: sortedTweetsArray[i].count,
                                            date: moment.unix(sortedTweetsArray[i].date).format("YYYY/MM/DD"),
                                            total: sortedTweetsArray[i].total
                                        };
                                    }
                                }
                                else {
                                    removeDuplicate[i] = {
                                        count: sortedTweetsArray[i].count,
                                        date: moment.unix(sortedTweetsArray[i].date).format("YYYY/MM/DD"),
                                        total: sortedTweetsArray[i].total
                                    };
                                }

                            }

                            var showEngagementList= _.uniqBy(removeDuplicate,'total.id');
                            if (showEngagementList.length > 20) {
                                for (var index = 1; index < 20; index++) {
                                    finalHighEngagedTweets.push(showEngagementList[index]);
                                }
                            }
                            else {
                                for (var index = 0; index < showEngagementList.length; index++) {
                                    finalHighEngagedTweets.push(showEngagementList[index]);
                                }
                            }
                            finalTwitterResponse = {
                                data: finalHighEngagedTweets,
                                metricId: queries.get_tweet_queries[j].metricId,
                                channelId: queries.get_tweet_queries[j].channelId,
                                queryResults: results
                            };
                            callback(null, finalTwitterResponse);
                        }
                    }
                }
            })
        }
    }

    //Updating the old data with new one
    function storeTweetData(wholetweetData, results, metric, noTweet, data) {
        var storeDefaultValues = [];
        var defaultTweetValues = {};
        var defaultTweetDataArray = [];

        if (metric[0].name == configAuth.twitterMetric.keywordMentions) {
            var storeStartDate = new Date(Date.parse(wholetweetData.statuses[0].created_at.replace(/( +)/, ' UTC$1')));
            var storeEndDate = new Date(req.body.startDate);
            if (storeStartDate > storeEndDate) {
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
                var storeStartDate = new Date(Date.parse(wholetweetData[wholetweetData.length - 1].created_at.replace(/( +)/, ' UTC$1')));

            }
            else
                var storeStartDate = new Date(Date.parse(wholetweetData[0].created_at.replace(/( +)/, ' UTC$1')));
            storeEndDate.setDate(storeEndDate.getDate() + 1);
        }
        var timeDiff = Math.abs(storeEndDate.getTime() - storeStartDate.getTime());
        var diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24));

        var d = new Date();
        var customFormat = d.toString().slice(0, 7) + ' ' +              //Day and Month
            d.getDate() + ' ' +                          //Day number
            d.toTimeString().slice(0, 8) + ' ' +          //HH:MM:SS
            /\(.*\)/g.exec(d.toString())[0].slice(1, -1)  //TimeZone
            + ' ' + d.getFullYear();                    //Year

        defaultTweetDataArray.push(defaultTweetValues);
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
            storeStartDate.setDate(storeStartDate.getDate() + 1);
        }

        //To replace the missing dates in whole data with empty values
        var validData = wholetweetData.length;
        for (var j = 0; j < validData; j++) {
            for (var k = 0; k < storeDefaultValues.length; k++) {
                if (metric[0].name == configAuth.twitterMetric.keywordMentions)
                    var tweetCreatedAt = calculateDate(new Date(Date.parse(wholetweetData.statuses[j].created_at.replace(/( +)/, ' UTC$1'))));
                else
                    var tweetCreatedAt = calculateDate(new Date(Date.parse(wholetweetData[j].created_at.replace(/( +)/, ' UTC$1'))));
                if (tweetCreatedAt === storeDefaultValues[k].created_at) {
                    storeDefaultValues[k] = wholetweetData[j];
                }

            }

        }

        var now = new Date();
        Data.update({
            'objectId': results.widget.charts[0].metrics[0].objectId,
            'metricId': results.widget.charts[0].metrics[0].metricId
        }, {
            $set: {data: storeDefaultValues, updated: now}
        }, {upsert: true}, function (err, data) {
            if (err)
                return res.status(500).json({error: 'Internal server error', id: req.params.widgetId})
            else if (data == 0)
                return res.status(501).json({error: 'Not implemented', id: req.params.widgetId})
            else {
                Data.findOne({
                    'objectId': results.widget.charts[0].metrics[0].objectId,
                    'metricId': results.widget.charts[0].metrics[0].metricId
                }, function (err, response) {
                    if (err) return res.status(500).json({error: 'Internal server error', id: req.params.widgetId});
                    else if (!response)
                        return res.status(204).json({error: 'No records found', id: req.params.widgetId});
                    else sendFinalData(response, metric);
                })
            }
        });
    }

    function checkMentionsInClientInput(until, count, tweets, mentionsProfile) {

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
    function callTweetApi(query, profile, count, wholetweetData, widget, metric, data, results, until, tweets, tempCount, metricType, i) {
        if (data != undefined && data != null) {
            for (var index = 0; index < data.data.length; index++)
                wholetweetData.push(data.data[index])
        }
        if (metric[0].name === configAuth.twitterMetric.keywordMentions) {
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
        }
        else if (metric[0].name === configAuth.twitterMetric.mentions || metricType === configAuth.twitterMetric.highEngagementTweets) {
            if (tweets != undefined && tweets != '') {
                var inputs = checkMentionsInClientInput(until, count, tweets)

            }
            //To check whether the metric is mention or not
            if (req.body.mentions != undefined) var inputs = checkMentionsInClientInput(until, count, tweets, req.body.mentions)
            else var inputs = checkMentionsInClientInput(until, count, tweets)
        }
        else var inputs = {screen_name: profile.name, since_id: '718324934175563800'};
        if (data != null || tweets != '') {
            if (tweets != undefined && tweets != '') {
                var TweetObject;
                for (var i = 0; i < tweets.length; i++) {
                    TweetObject = tweets[i];
                    wholetweetData.push(TweetObject);

                }
                var createdAt = new Date(Date.parse(tweets[0].created_at.replace(/( +)/, ' UTC$1')));
            }
            else var createdAt = new Date(Date.parse(data.data[data.data.length - 1].created_at.replace(/( +)/, ' UTC$1')));
            if (tempCount - 1 == i || tempCount == undefined || tempCount == '') {
                if (new Date(req.body.startDate) > createdAt) {
                    var totalCount = getDaysDifference(createdAt, new Date(req.body.startDate));
                    callTweetApiBasedCondition(query, profile, totalCount, wholetweetData, widget, metric, data, results, until, tweets, createdAt, inputs);
                }
                else
                //call data from db
                    sendFinalData(data, metric);
            }

        }
        else
            callTweetApiBasedCondition(query, profile, 200, wholetweetData, widget, metric, data, results, until, tweets, '', inputs)
    }

    function callTweetApiBasedCondition(query, profile, totalCount, wholetweetData, widget, metric, data, results, until, tweets, createdAt, inputs) {
        client.get(query, inputs, function (error, tweets, response) {
            if (error)
                return res.status(500).json({error: 'Internal server error', id: req.params.widgetId});
            else if (tweets.length == 0)
                storeTweetData(wholetweetData, results, metric, 1);
            else {
                if (data == null) {
                    if (metric[0].name == configAuth.twitterMetric.keywordMentions) var createdAt = new Date(Date.parse(tweets.statuses[0].created_at.replace(/( +)/, ' UTC$1')));
                    else var createdAt = new Date(Date.parse(tweets[0].created_at.replace(/( +)/, ' UTC$1')));
                }
                else var createdAt = data.updated;
                if (new Date(req.body.startDate) > createdAt && createdAt.setDate(createdAt.getDate() + 1) != new Date()) {
                    var totalCount = getDaysDifference(createdAt, new Date(req.body.startDate));
                    if (new Date(req.body.startDate) > createdAt) {
                        if (totalCount < 200)
                            callTweetApi(query, profile, totalCount, wholetweetData, widget, metric, data, results, 1, tweets);
                        else {
                            var count = totalCount % 200;
                            var tempCount = totalCount / 200;
                            if (tempCount > 0) {
                                for (var i = 0; i < tempCount; i++) {
                                    callTweetApi(query, profile, totalCount, wholetweetData, widget, metric, data, results, 1, tweets, tempCount, i);
                                }

                            }
                        }
                    }

                }
                var TweetObject;
                for (var i = 0; i < tweets.length; i++) {
                    TweetObject = tweets[i];
                    wholetweetData.push(TweetObject);

                }

                storeTweetData(wholetweetData, results, metric, data);

            }

        });
    }

    //To send format the data from db and send to client
    function sendFinalData(response, metric) {
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
        }
        else {
            return res.status(500).json({error: 'Internal server error', id: req.params.widgetId});
        }

    }

    function selectInstagram(initialResults, callback) {
        async.auto({
            get_instagram_queries: getInstagramQueries,
            get_instagram_data_from_remote: ['get_instagram_queries', getInstagramDataFromRemote]

        }, function (err, results) {
            if (err) {
                return callback(err, null);
            }
            callback(null, results.get_instagram_data_from_remote);
        });

        function getInstagramQueries(callback) {
            work(initialResults.data, initialResults.object, initialResults.metric, callback);
            function work(data, object, metric, done) {
                async.timesSeries(metric.length, function (j, next) {
                    var adAccountId = initialResults.object[j].channelObjectId;
                    d = new Date();
                    var allObjects = {};
                    if (data[j].data != null) {
                        var updated = new Date(data[j].data.updated);
                        updated= updated.setHours(updated.getHours() + configAuth.dataValidityInHours);
                        updated=new Date(updated);
                        var currentDate = new Date();
                        if (updated < currentDate) {
                            currentDate = calculateDate(new Date());
                            // d.setDate(d.getDate() + 1);
                            var startDate = calculateDate(updated);
                            var query = metric[j].objectTypes[0].meta.igMetricName;
                            allObjects = {
                                profile: initialResults.get_profile[j],
                                query: query,
                                widget: metric[j],
                                dataResult: data[j].data,
                                startDate: startDate,
                                endDate: currentDate,
                                metricCode: metric[j].code,
                                metricId: metric[j]._id,
                                endpoint: metric[j].objectTypes[0].meta.endpoint
                            }
                            next(null, allObjects);
                        }
                        else
                            next(null, 'DataFromDb');
                    }
                    else {

                        //call google api
                        d.setDate(d.getDate() - 365);
                        var startDate = formatDate(d);
                        var endDate = formatDate(new Date());
                        var query = metric[j].objectTypes[0].meta.igMetricName;
                        if (metric[j].code === 'likes' || metric[j].code === 'comments') {
                            allObjects = {
                                profile: initialResults.get_profile[j],
                                query: query,
                                widget: metric[j],
                                dataResult: data[j].data,
                                startDate: req.body.startDate,
                                endDate: req.body.endDate,
                                metricId: metric[j]._id,
                                metricCode: metric[j].code,
                                endpoint: metric[j].objectTypes[0].meta.endpoint
                            };
                        }
                        else {
                            allObjects = {
                                profile: initialResults.get_profile[j],
                                query: query,
                                widget: metric[j],
                                dataResult: data[j].data,
                                startDate: startDate,
                                endDate: endDate,
                                metricId: metric[j]._id,
                                metricCode: metric[j].code,
                                endpoint: metric[j].objectTypes[0].meta.endpoint
                            };
                        }
                        next(null, allObjects);

                    }

                }, done)
            }

        }

        function getInstagramDataFromRemote(allObjects, callback) {
            var actualFinalApiData = {};
            async.concatSeries(allObjects.get_instagram_queries, checkDbData, callback);
            function checkDbData(result, callback) {
                if (result == 'DataFromDb') {
                    actualFinalApiData = {
                        apiResponse: 'DataFromDb',
                        queryResults: initialResults,
                        channelId: initialResults.metric[0].channelId
                    }
                    callback(null, actualFinalApiData);
                }
                else {
                    callInstagramApiForMetrics(result, callback);

                }
            }
        }

        function callInstagramApiForMetrics(result, callback) {
            //Set access token for hitting api access - dev
            var storeMetric;
            var tot_metric = [];
            var sorteMediasArray = [];
            var storeData = [];
            var actualFinalApiData = [];
            var userMediaRecent = [];
            var recentMedia = [];
            ig.use({access_token: result.profile.accessToken});
            if (result.query === configAuth.instagramStaticVariables.user) {
                ig.user(result.profile.userId, function (err, results, remaining, limit) {
                    if (err) {
                        if(err.code === 400){
                            profile.update({_id: result.profile._id}, {
                                hasNoAccess:true
                            }, function(err, response) {
                                if(!err){
                                    return res.status(401).json({
                                        error: 'Authentication required to perform this action',
                                        id: req.params.widgetId,
                                        errorstatusCode:1003
                                    });
                                }
                                else
                                    return res.status(500).json({error: 'Internal server error', id: req.params.widgetId});
                            })
                        }
                        else
                            return res.status(500).json({error: 'Internal server error', id: req.params.widgetId});
                    }
                    else {
                        var endPointMetric = {};
                        endPointMetric = {items: result.endpoint};
                        var storeStartDate = new Date(result.startDate);
                        var storeEndDate = new Date(result.endDate);
                        var timeDiff = Math.abs(storeEndDate.getTime() - storeStartDate.getTime());
                        var diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24)); //adding plus one so that today also included
                        if (endPointMetric.items[0].indexOf("/") > -1) {
                            endPointMetric = endPointMetric.items[0].split("/");
                        }
                        var count = endPointMetric[0];
                        var item = endPointMetric[1];
                        var temp = results[count];
                        storeMetric = temp[item];
                        for (var i = 0; i <= diffDays; i++) {
                            var finalDate = moment(storeStartDate).format('YYYY-MM-DD');
                            if (finalDate <= moment(new Date()).format('YYYY-MM-DD')) {
                                tot_metric.push({date: finalDate, total: 0});
                                storeStartDate.setDate(storeStartDate.getDate() + 1);

                                if (result.endDate === tot_metric[i].date) {
                                    tot_metric[i] = {
                                        total: storeMetric,
                                        date: result.endDate
                                    };
                                }
                            }
                        }
                        actualFinalApiData = {
                            apiResponse: tot_metric,
                            metricId: result.metricId,
                            queryResults: initialResults,
                            channelId: initialResults.metric[0].channelId
                        }
                        callback(null, actualFinalApiData);
                    }
                });
            }
            else {
                var callApi = function (err, medias, pagination, remaining, limit) {
                    if (result.metricCode === configAuth.instagramStaticVariables.likes || result.metricCode === configAuth.instagramStaticVariables.comments) {
                        for (var key in medias) {
                            userMediaRecent.push(medias[key])
                        }
                        if (pagination) {
                            if (pagination.next) {
                                pagination.next(callApi); // Will get second page results
                            }
                            else {
                                for (var i = 0; i < userMediaRecent.length; i++) {
                                    var storeDate = userMediaRecent[i].created_time;
                                    var startDate = moment(result.startDate).unix();
                                    var endDate = moment(result.endDate).unix();
                                    if (storeDate >= startDate && storeDate <= endDate) {
                                        var formateDate = moment.unix(storeDate).format('YYYY-MM-DD');
                                        storeData.push({date: formateDate, total: userMediaRecent[i]})
                                    }
                                }
                                var uniqueDate = _.groupBy(storeData, 'date')
                                for (var key in uniqueDate) {
                                    var like = configAuth.instagramStaticVariables.likes;
                                    var count = configAuth.instagramStaticVariables.count;
                                    var comments = configAuth.instagramStaticVariables.comments;
                                    var tempLikes = 0;
                                    var tempComments = 0;
                                    for (var j = 0; j < uniqueDate[key].length; j++) {
                                        var date = uniqueDate[key][j].date;
                                        tempLikes += uniqueDate[key][j].total[like][count];
                                        tempComments += uniqueDate[key][j].total[comments][count];
                                    }
                                    if (result.metricCode === configAuth.instagramStaticVariables.likes) {
                                        recentMedia.push({date: date, total: tempLikes})
                                    }
                                    else {
                                        recentMedia.push({date: date, total: tempComments})
                                    }
                                    tempLikes = 0;
                                    tempComments = 0;
                                }
                                var storeStartDate = new Date(result.startDate);
                                var storeEndDate = new Date(result.endDate);
                                var timeDiff = Math.abs(storeEndDate.getTime() - storeStartDate.getTime());
                                var diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24));
                                for (var i = 0; i <= diffDays; i++) {
                                    var finalDate = formatDate(storeStartDate);
                                    tot_metric.push({date: finalDate, total: 0});
                                    storeStartDate.setDate(storeStartDate.getDate() + 1);
                                    for (var n = 0; n < recentMedia.length; n++) {
                                        if (recentMedia[n].date === tot_metric[i].date) {
                                            tot_metric[i] = {
                                                total: recentMedia[n].total,
                                                date: recentMedia[n].date
                                            };
                                        }
                                    }
                                }

                                actualFinalApiData = {
                                    apiResponse: tot_metric,
                                    metricId: result.metricId,
                                    queryResults: initialResults,
                                    channelId: initialResults.metric[0].channelId
                                };

                                callback(null, actualFinalApiData);
                            }
                        }
                    }
                    else {
                        for (var key in medias) {
                            userMediaRecent.push(medias[key]);
                        }
                        if (pagination) {
                            if (pagination.next) {
                                pagination.next(callApi); // Will get second page results
                            }
                            else {
                                for (var i = 0; i < userMediaRecent.length; i++) {
                                    var storeDate = userMediaRecent[i].created_time;
                                    var dateString = moment.unix(storeDate).format("YYYY-MM-DD");

                                    storeData.push({date: dateString, total: userMediaRecent[i]})
                                }
                                storeData.forEach(function (value, index) {
                                    var count = value.total.likes.count + value.total.comments.count;
                                    recentMedia.push({count: count, date: value.date, total: value.total})
                                });
                                var MediasArray = _.sortBy(recentMedia, ['count']);
                                sorteMediasArray = MediasArray.reverse();
                                actualFinalApiData = {
                                    apiResponse: sorteMediasArray,
                                    metricId: result.metricId,
                                    queryResults: initialResults,
                                    channelId: initialResults.metric[0].channelId
                                };

                                callback(null, actualFinalApiData);
                            }
                        }
                    }
                };
                ig.user_media_recent(result.profile.userId, {count: 25}, callApi)
            }
        }
    }


    function selectPinterest(initialResults, callback) {
        async.auto({
            get_pinterest_queries: getPinterestQueries,
            get_pinterest_data_from_remote: ['get_pinterest_queries', getPinterestDataFromRemote]

        }, function (err, results) {
            if (err) {
                return callback(err, null);
            }
            callback(null, results.get_pinterest_data_from_remote);
        });

        function getPinterestQueries(callback) {
            work(initialResults.data, initialResults.object, initialResults.metric, callback);
            function work(data, object, metric, done) {
                async.timesSeries(metric.length, function (j, next) {
                    var adAccountId = initialResults.object[j].channelObjectId;
                    d = new Date();
                    var allObjects = {};
                    if (data[j].data != null) {
                        var updated = new Date(data[j].data.updated);
                        updated= updated.setHours(updated.getHours() + configAuth.dataValidityInHours);
                        updated=new Date(updated);
                        var currentDate = new Date();
                        if (updated < currentDate) {
                            var updated = calculateDate(data[j].data.updated);
                            var currentDate = calculateDate(new Date());
                            var query = metric[j].objectTypes[0].meta.pinMetricName;
                            allObjects = {
                                profile: initialResults.get_profile[j],
                                query: query,
                                widget: metric[j],
                                dataResult: data[j].data,
                                startDate: updated,
                                endDate: currentDate,
                                metricId: metric[j]._id,
                                endPoint: metric[j].objectTypes[0].meta.endpoint[0]
                            }
                            next(null, allObjects);
                        }
                        else
                            next(null, 'DataFromDb');
                    }
                    else {

                        //call google api
                        d.setDate(d.getDate() - 365);
                        var startDate = formatDate(d);
                        var endDate = formatDate(new Date());
                        var query = metric[j].objectTypes[0].meta.pinMetricName;
                        allObjects = {
                            profile: initialResults.get_profile[j],
                            query: query,
                            widget: metric[j],
                            dataResult: data[j].data,
                            startDate: startDate,
                            endDate: endDate,
                            metricId: metric[j]._id,
                            metricCode: metric[j].code,
                            endPoint: metric[j].objectTypes[0].meta.endpoint[0]
                        };
                        next(null, allObjects);

                    }

                }, done)
            }
        }

        function getPinterestDataFromRemote(allObjects, callback) {
            var actualFinalApiData = {};
            async.concatSeries(allObjects.get_pinterest_queries, checkDbData, callback);
            function checkDbData(result, callback) {
                if (result === 'DataFromDb') {
                    actualFinalApiData = {
                        apiResponse: 'DataFromDb',
                        queryResults: initialResults,
                        channelId: initialResults.metric[0].channelId
                    }
                    callback(null, actualFinalApiData);
                }
                else
                    callPinterestApiForMetrics(result, callback);
            }
        }

        function callPinterestApiForMetrics(result, callback) {
            var storeMetric;
            var tot_metric = [];
            var actualFinalApiData = [];
            var arrayOfResponse = [];
            var arrayOfBoards = [];
            var storeBoard = [];
            var removeDuplicateBoard = [];
            var storePin = [];
            var topTenBoard = [];
            var pinterest = PDK.init(result.profile.accessToken);
            if (result.metricCode === configAuth.pinterestMetrics.boardsLeaderBoard) {
                var params = {
                    qs: {
                        fields: "counts,id,name,created_at,url",
                    }
                };
                pinterest.api(result.query, params).then(function (response) {
                    var endPointMetric = {}
                    endPointMetric = {items: result.endPoint};
                    if (endPointMetric.items.indexOf("/") > -1) {
                        endPointMetric = endPointMetric.items.split("/");
                    }
                    var count = endPointMetric[0];
                    var pins = endPointMetric[1];
                    var collaborate = endPointMetric[2];
                    var followers = endPointMetric[3];
                    for (var key in response.data) {
                        arrayOfResponse.push(response.data[key]);
                    }
                    for (var i = 0; i < arrayOfResponse.length; i++) {
                        var created_at = arrayOfResponse[i].created_at
                        var split = created_at.split('T');
                        var createDate = split[0];
                        var temp = arrayOfResponse[i][count];
                        arrayOfBoards.push({
                            date: createDate,
                            url: arrayOfResponse[i].url,
                            name: response.data[i].name,
                            total: {pins: temp[pins], collaborators: temp[collaborate], followers: temp[followers]}
                        })
                    }
                    var MediasArray = _.sortBy(arrayOfBoards, ['total.followers']);
                    var collectionBoard = _.orderBy(MediasArray, ['total.followers', 'total.pins'], ['desc', 'asc']);
                    if(collectionBoard.length>=10) {
                        for (var j = 0; j < 10; j++) {
                            topTenBoard.push(collectionBoard[j]);
                        }
                    }
                    else
                    {
                        for (var j = 0; j <collectionBoard.length ; j++) {
                            topTenBoard.push(collectionBoard[j]);
                        }
                    }
                    actualFinalApiData = {
                        apiResponse: topTenBoard,
                        metricId: result.metricId,
                        queryResults: initialResults,
                        channelId: initialResults.metric[0].channelId
                    }

                    callback(null, actualFinalApiData);

                }, function (error) {
                    return res.status(500).json({error: 'Internal server error', id: req.params.widgetId});
                })

            }
            else if (result.metricCode === configAuth.pinterestMetrics.engagementRate) {
                var params = {
                    qs: {
                        limit: 100,
                        fields: "id,board,created_at,counts",
                    }
                };
                var query = result.query;
                var date = new Date();
                var endDate = moment.utc(req.body.endDate).unix();
                var d = new Date();
                d.setDate(d.getDate() - 31);
                var startDate = moment.utc(req.body.startDate).unix();
                paginationCallApi(query, params);
                function paginationCallApi(query, params) {
                    pinterest.api(query, params).then(function (response) {
                        for (var index in response.data) {
                            var dateString = response.data[index].created_at;
                            var split = dateString.split('T');
                            var createDate = moment(dateString).unix();
                            if (createDate > startDate && createDate < endDate)
                                arrayOfResponse.push(response.data[index]);
                            if (response.page.cursor != null && response.page.next != null) {
                                if (response.data.length === (parseInt(index) + 1) && createDate > startDate && createDate < endDate) {
                                    query = response.page.next;
                                    paginationCallApi(query, params);
                                }
                                else if (response.data.length === (parseInt(index) + 1)) {
                                    storeFinalData(arrayOfResponse);
                                }
                            } else if (response.data.length === (parseInt(index) + 1)) {
                                storeFinalData(arrayOfResponse);
                            }
                        }
                    }, function (error) {
                        return res.status(500).json({error: 'Internal server error', id: req.params.widgetId});
                    })

                }

                function storeFinalData(arrayOfResponse) {
                    var endPointMetric = {}
                    endPointMetric = {items: result.endPoint};
                    if (endPointMetric.items.indexOf("/") > -1) {
                        endPointMetric = endPointMetric.items.split("/");
                    }

                    var count = endPointMetric[0];
                    var board = endPointMetric[1];
                    var name = endPointMetric[2];
                    var id = endPointMetric[4]
                    var like = endPointMetric[5];
                    var comment = endPointMetric[6];
                    var repin = endPointMetric[7];
                    var url = endPointMetric[8];
                    var removeDuplicate = _.groupBy(arrayOfBoards, 'board.name')
                    for (var k = 0; k < arrayOfResponse.length; k++) {
                        if (arrayOfResponse[k][board] != null) {
                            var isUnique = true;
                            for (items in arrayOfBoards) {
                                if (arrayOfBoards[items].boardId == arrayOfResponse[k][board][id]) {
                                    isUnique = false;
                                }
                            }
                            if (isUnique == true) {
                                var created_at = arrayOfResponse[k].created_at
                                var split = created_at.split('T');
                                var createDate = split[0];
                                arrayOfBoards.push({
                                    date: created_at,
                                    boardId: arrayOfResponse[k][board][id],
                                    url: arrayOfResponse[k][board][url],
                                    name: arrayOfResponse[k][board][name],
                                    total: ({likes: 0, comments: 0, repins: 0})
                                });
                            }
                        }
                    }
                    for (var k = 0; k < arrayOfBoards.length; k++) {
                        var likesCount = 0;
                        var commentCount = 0;
                        var repinsCount = 0;
                        for (var j = 0; j < arrayOfResponse.length; j++) {
                            if (arrayOfBoards[k].boardId === arrayOfResponse[j][board][id]) {

                                likesCount += arrayOfResponse[j][count][like];
                                commentCount += arrayOfResponse[j][count][comment];
                                repinsCount += arrayOfResponse[j][count][repin];


                            }
                        }
                        arrayOfBoards[k].total = ({likes: likesCount, comments: commentCount, repins: repinsCount});

                        var likesCount = 0;
                        var commentCount = 0;
                        var repinsCount = 0;

                    }
                    actualFinalApiData = {
                        apiResponse: arrayOfBoards,
                        metricId: result.metricId,
                        queryResults: initialResults,
                        channelId: initialResults.metric[0].channelId
                    }
                    callback(null, actualFinalApiData);

                }
            }
            else {
                var params = {
                    qs: {
                        fields: "id,first_name,created_at,username,counts,last_name",
                    }
                };
                pinterest.api(result.query, params).then(function (response) {
                    var endPointMetric = {}
                    endPointMetric = {items: result.endPoint};
                    var storeStartDate = new Date(result.startDate);
                    var storeEndDate = new Date(result.endDate);
                    var timeDiff = Math.abs(storeEndDate.getTime() - storeStartDate.getTime());
                    var diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24));
                    if (endPointMetric.items.indexOf("/") > -1) {
                        endPointMetric = endPointMetric.items.split("/");
                    }
                    var count = endPointMetric[0];
                    var item = endPointMetric[1];
                    var temp = response.data[count];
                    storeMetric = temp[item];
                    for (var i = 0; i <= diffDays; i++) {
                        var finalDate = formatDate(storeStartDate);
                        tot_metric.push({date: finalDate, total: 0});
                        storeStartDate.setDate(storeStartDate.getDate() + 1);

                        if (result.endDate === tot_metric[i].date) {
                            tot_metric[i] = {
                                total: storeMetric,
                                date: result.endDate
                            };
                        }

                    }
                    actualFinalApiData = {
                        apiResponse: tot_metric,
                        metricId: result.metricId,
                        queryResults: initialResults,
                        channelId: initialResults.metric[0].channelId
                    }
                    callback(null, actualFinalApiData);

                }, function (error) {
                    return res.status(500).json({error: 'Internal server error', id: req.params.widgetId});
                })

            }
        }
    }

    function selectMailChimp(initialResults, callback) {
        async.auto({
            get_mailChimp_queries: getMailChimpQueries,
            get_mailChimp_data_from_remote: ['get_mailChimp_queries', getMailChimpDataFromRemote]

        }, function (err, results) {
            if (err)
                return callback(err, null);
            callback(null, results.get_mailChimp_data_from_remote);
        });

        function getMailChimpQueries(callback) {
            work(initialResults.data, initialResults.object, initialResults.metric, callback);
            function work(data, object, metric, done) {
                async.timesSeries(metric.length, function (j, next) {
                    var channelObjectId = initialResults.object[j].channelObjectId;
                    d = new Date();
                    var allObjects = {};
                    if (data[j].data != null) {
                        var updated = new Date(data[j].data.updated);
                        updated= updated.setHours(updated.getHours() + configAuth.dataValidityInHours);
                        updated=new Date(updated);
                        var currentDate = new Date();
                        if (updated < currentDate) {
                            updated=calculateDate(updated);
                            var currentDate = calculateDate(new Date());
                            if (metric[j].objectTypes[0].meta.endpoint[0] === 'lists')
                                var query = 'https://' + initialResults.get_profile[j].dataCenter + '.api.mailchimp.com/3.0/lists/' + channelObjectId + '/?count=100';
                            else
                                var query = 'https://' + initialResults.get_profile[j].dataCenter + '.api.mailchimp.com/3.0/campaigns/' + channelObjectId + '/?count=100';
                            allObjects = {
                                profile: initialResults.get_profile[j],
                                query: query,
                                widget: metric[j],
                                dataResult: data[j].data,
                                startDate: updated,
                                endDate: currentDate,
                                metricId: metric[j]._id,
                                endpoint: metric[j].objectTypes[0].meta.endpoint[0]
                            }
                            next(null, allObjects);
                        }
                        else
                            next(null, 'DataFromDb');
                    }
                    else {

                        //call google api
                        d.setDate(d.getDate() - 365);
                        var startDate = formatDate(d);
                        var endDate = formatDate(new Date());
                        if (metric[j].objectTypes[0].meta.endpoint[0] === configAuth.mailChimpQueryVariables.lists)
                            var query = 'https://' + initialResults.get_profile[j].dataCenter + configAuth.mailChimpQueryVariables.listQuery + channelObjectId + '/?count=100';
                        else
                            var query = 'https://' + initialResults.get_profile[j].dataCenter + configAuth.mailChimpQueryVariables.campaignQuery + channelObjectId + '/?count=100';
                        allObjects = {
                            profile: initialResults.get_profile[j],
                            query: query,
                            widget: metric[j],
                            dataResult: data[j].data,
                            startDate: startDate,
                            endDate: endDate,
                            metricId: metric[j]._id,
                            metricCode: metric[j].code,
                            endpoint: metric[j].objectTypes[0].meta.endpoint[0]
                        };
                        next(null, allObjects);
                    }
                }, done)
            }
        }

        function getMailChimpDataFromRemote(allObjects, callback) {
            var actualFinalApiData = {};
            async.concatSeries(allObjects.get_mailChimp_queries, checkDbData, callback);
            function checkDbData(result, callback) {
                if (result === 'DataFromDb') {
                    actualFinalApiData = {
                        apiResponse: 'DataFromDb',
                        queryResults: initialResults,
                        channelId: initialResults.metric[0].channelId
                    }
                    callback(null, actualFinalApiData);
                }
                else
                    callMailchimpForMetrics(result, callback);
            }

        };

        function callMailchimpForMetrics(result, callback) {
            var actualFinalApiData = [];
            request({
                uri: result.query,
                headers: {
                    'User-Agent': 'node-mailchimp/1.2.0',
                    'Authorization': 'OAuth ' + result.profile.accessToken
                }
            }, function (err, response, body) {
                var parsedResponse;
                var storeMetric;
                var tot_metric = [];
                if (response.statusCode != 200){
                    if(response.statusCode == 401){
                        profile.update({_id: result.profile._id}, {
                            hasNoAccess:true
                        }, function(err, response) {
                            if(!err){
                                return res.status(401).json({
                                    error: 'Authentication required to perform this action',
                                    id: req.params.widgetId,
                                    errorstatusCode:1003
                                });
                            }
                            else
                                return res.status(500).json({error: 'Internal server error', id: req.params.widgetId});
                        })
                    }
                    else
                        callback(response.statusCode);
                }

                else {
                    var mailChimpResponse = JSON.parse(body);
                    var storeStartDate = new Date(result.startDate);
                    var storeEndDate = new Date(result.endDate);
                    var timeDiff = Math.abs(storeEndDate.getTime() - storeStartDate.getTime());
                    var diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24)); //adding plus one so that today also included
                    var stats = configAuth.mailChimpQueryVariables.stats;
                    var item = result.widget.objectTypes[0].meta.mailChimpsMetricName;
                    if (!mailChimpResponse.id)
                        return res.status(500).json({error: 'Internal server error', id: req.params.widgetId});

                    else {
                        if (result.endpoint === configAuth.mailChimpQueryVariables.campaign) {
                            if (result.metricCode === configAuth.mailChimpQueryVariables.emailSend) {
                                storeMetric = parseInt(mailChimpResponse[item]);
                            }
                            else {
                                if (!mailChimpResponse.report_summary)
                                    storeMetric = null;
                                else
                                    storeMetric = parseInt(mailChimpResponse.report_summary[item]);
                            }
                        }
                        else {
                            if (!mailChimpResponse.stats)
                                storeMetric = null;
                            else
                                storeMetric = parseInt(mailChimpResponse.stats[item]);
                        }
                        if (storeMetric != null) {
                            for (var i = 0; i <= diffDays; i++) {
                                var finalDate = formatDate(storeStartDate);
                                tot_metric.push({date: finalDate, total: 0});
                                storeStartDate.setDate(storeStartDate.getDate() + 1);

                                if (result.endDate === tot_metric[i].date) {
                                    tot_metric[i] = {
                                        total: storeMetric,
                                        date: result.endDate
                                    };
                                }
                            }
                        }
                        actualFinalApiData = {
                            apiResponse: tot_metric,
                            metricId: result.metricId,
                            queryResults: initialResults,
                            channelId: initialResults.metric[0].channelId
                        }
                        callback(null, actualFinalApiData)
                    }
                }
            });
        }
    }

    function selectaweber(initialResults, callback) {


        async.auto({
            get_aweber_queries: getAweberQueries,
            get_aweber_data_from_remote: ['get_aweber_queries', getaweberDataFromRemote]

        }, function (err, results) {
            if (err)
                return callback(err, null);
            callback(null, results.get_aweber_data_from_remote);
        });

        function getAweberQueries(callback) {

            work(initialResults.data, initialResults.object, initialResults.metric, callback);

            function work(data, object, metric, done) {


                async.timesSeries(metric.length, function (j, next) {
                    var channelObjectId = initialResults.object[j].channelObjectId;
                    var channellistId = initialResults.object[j].listId;
                    d = new Date();
                    var allObjects = {};
                    if (data[j].data != null) {
                        var updated = new Date(data[j].data.updated);
                        updated= updated.setHours(updated.getHours() + configAuth.dataValidityInHours);
                        updated=new Date(updated);
                        var currentDate = new Date();
                        if (updated < currentDate) {
                            var updated = calculateDate(data[j].data.updated);
                            var currentDate = calculateDate(new Date());
                            if (metric[j].objectTypes[0].meta.endpoint[0] === configAuth.aweberStatic.aweberMainList) {
                                var query = 'accounts/' + initialResults.get_profile[j].userId + '/lists/' + object[j].channelObjectId;

                            }

                            else if (metric[j].objectTypes[0].meta.endpoint[0] === 'lists') {
                                var query = 'accounts/' + initialResults.get_profile[j].userId + '/lists/' + object[j].channelObjectId + '/campaigns';

                            }

                            else if (metric[j].objectTypes[0].meta.endpoint[0] === 'campaigns') {
                                var query = 'accounts/' + initialResults.get_profile[j].userId + '/lists/' + object[j].meta.listId + '/campaigns/' + initialResults.object[j].meta.campaignType + initialResults.object[j].channelObjectId;

                            }


                            allObjects = {
                                profile: initialResults.get_profile[j],
                                query: query,
                                widget: metric[j],
                                dataResult: data[j].data,
                                startDate: updated,
                                endDate: currentDate,
                                metricId: metric[j]._id,
                                metricCode: metric[j].code,
                                endpoint: metric[j].objectTypes[0].meta.endpoint[0]
                            }
                            next(null, allObjects);
                        }
                        else
                            next(null, 'DataFromDb');
                    }
                    else {
                        //call google api
                        d.setDate(d.getDate() - 365);
                        var startDate = formatDate(d);
                        var endDate = formatDate(new Date());
                        if (metric[j].objectTypes[0].meta.endpoint[0] === configAuth.aweberStatic.endPoints.aweberMainList) {
                            var query = 'accounts/' + initialResults.get_profile[j].userId + '/lists/' + initialResults.object[j].channelObjectId;

                        }

                        else if (metric[j].objectTypes[0].meta.endpoint[0] === configAuth.aweberStatic.endPoints.aweberLists) {
                            var query = 'accounts/' + initialResults.get_profile[j].userId + '/lists/' + initialResults.object[j].channelObjectId + '/campaigns';

                        }
                        else if (metric[j].objectTypes[0].meta.endpoint[0] === configAuth.aweberStatic.endPoints.aweberCampaigns) {
                            var query = 'accounts/' + initialResults.get_profile[j].userId + '/lists/' + initialResults.object[j].meta.listId + '/campaigns/' + initialResults.object[j].meta.campaignType + initialResults.object[j].channelObjectId;

                        }


                        allObjects = {
                            profile: initialResults.get_profile[j],
                            query: query,
                            widget: metric[j],
                            dataResult: data[j].data,
                            startDate: startDate,
                            endDate: endDate,
                            metricId: metric[j]._id,
                            metricCode: metric[j].code,
                            endpoint: metric[j].objectTypes[0].meta.endpoint[0]
                        };
                        next(null, allObjects);
                    }
                }, done)
            }
        }

        function getaweberDataFromRemote(allObjects, callback) {
            var actualFinalApiData = {};

            async.concatSeries(allObjects.get_aweber_queries, checkDbData, callback);
            function checkDbData(result, callback) {
                if (result === 'DataFromDb') {
                    actualFinalApiData = {
                        apiResponse: 'DataFromDb',
                        queryResults: initialResults,
                        channelId: initialResults.metric[0].channelId
                    }
                    callback(null, actualFinalApiData);
                }

                else
                    callaweberForMetrics(result, actualFinalApiData, callback);
            }

        };

        function callaweberForMetrics(result, actualFinalApiData, callback) {
            var token = result.profile.accessToken;
            var tokenSecret = result.profile.tokenSecret;
            var query = result.query;
            var apiClient = NA.api(token, tokenSecret);
            apiClient.request('get', query, {}, function (err, response) {
                if (err) {
                    if(err.error.status == 401){

                        profile.update({_id: result.profile._id}, {
                            hasNoAccess:true
                        }, function(err, response) {
                            if(!err){
                                return res.status(401).json({
                                    error: 'Authentication required to perform this action',
                                    id: req.params.widgetId,
                                    errorstatusCode:1003
                                });
                            }
                            else
                                return res.status(500).json({error: 'Internal server error', id: req.params.widgetId});
                        })
                    }
                    else
                        return res.status(500).json({error: 'Internal server error'});
                }
                else {

                    var storeMetric;
                    var tot_metric = [];
                    var storeStartDate = new Date(result.startDate);
                    var storeEndDate = new Date(result.endDate);
                    var timeDiff = Math.abs(storeEndDate.getTime() - storeStartDate.getTime());

                    var diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24)); //adding plus one so that today also included
                    if (result.metricCode === configAuth.aweberStatic.metricCode.subscribers) {
                        storeMetric = response.total_subscribed_subscribers;
                    }
                    else if (result.metricCode === configAuth.aweberStatic.metricCode.unSubscribers) {
                        storeMetric = response.total_unsubscribed_subscribers;
                    }
                    else if (result.metricCode === configAuth.aweberStatic.metricCode.listOpen_rate) {
                        var total_opens = 0, total_sent = 0, open_rate;
                        for (var i = 0; i < response.total_size; i++) {
                            if (response.entries[i].campaign_type == 'b') {
                                total_opens = total_opens + response.entries[i].total_opens;
                                total_sent = total_sent + response.entries[i].total_sent;
                            }
                        }
                        open_rate = Math.round(total_opens / total_sent);
                        storeMetric = open_rate;
                    }
                    else if (result.metricCode === configAuth.aweberStatic.metricCode.listClick_rate) {
                        var total_clicks = 0, total_sent = 0, click_rate;
                        for (var i = 0; i < response.total_size; i++) {
                            if (response.entries[i].campaign_type == 'b') {
                                total_clicks = total_clicks + response.entries[i].total_clicks;
                                total_sent = total_sent + response.entries[i].total_sent;
                            }
                        }
                        click_rate = Math.round(total_clicks / total_sent);
                        storeMetric = click_rate;
                    }
                    else if (result.metricCode === configAuth.aweberStatic.metricCode.open_rateCampaigns) {
                        storeMetric = Math.round(response.total_opens / response.total_sent);
                    }
                    else if (result.metricCode === configAuth.aweberStatic.metricCode.click_rateCampaigns) {
                        storeMetric = Math.round(response.total_clicks / response.total_sent);
                    }
                    else if (result.metricCode === configAuth.aweberStatic.metricCode.total_opensCampaigns) {
                        storeMetric = response.total_opens;
                    }
                    else if (result.metricCode ===configAuth.aweberStatic.metricCode.total_clicksCampaigns) {
                        storeMetric = response.total_clicks;
                    }
                    else if (result.metricCode === configAuth.aweberStatic.metricCode.total_sentCampaigns) {
                        storeMetric = response.total_sent;
                    }
                    for (var i = 0; i <= diffDays; i++) {
                        var finalDate = formatDate(storeStartDate);
                        if (finalDate <= moment(new Date).format('YYYY-MM-DD')) {
                            tot_metric.push({date: finalDate, total: 0});
                            storeStartDate.setDate(storeStartDate.getDate() + 1);
                            if (result.endDate === tot_metric[i].date) {
                                tot_metric[i] = {
                                    total: storeMetric,
                                    date: result.endDate
                                };
                            }
                        }
                    }

                    actualFinalApiData = {
                        apiResponse: tot_metric,
                        metricId: result.metricId,
                        queryResults: initialResults,
                        channelId: initialResults.metric[0].channelId
                    }
                    callback(null, actualFinalApiData)

                }

            });


        }
    }

    function selectLinkedInObjectType(initialResults, callback) {
        async.auto({
            get_linkedIn_queries: getLinkedInQueries,
            get_linkedIn_data_from_remote: ['get_linkedIn_queries', getLinkedInDataFromRemote]

        }, function (err, results) {
            if (err) {
                return callback(err, null);
            }
            callback(null, results.get_linkedIn_data_from_remote);
        });

        function getLinkedInQueries(callback) {
            work(initialResults.data, initialResults.object, initialResults.metric, callback);
            function work(data, object, metric, done) {
                async.timesSeries(metric.length, function (j, next) {
                    var channelObjectId = initialResults.object[j].channelObjectId;
                    d = new Date();
                    var allObjects = {};
                    if (data[j].data != null) {
                        var updated = new Date(data[j].data.updated);
                        updated= updated.setHours(updated.getHours() + configAuth.dataValidityInHours);
                        updated=new Date(updated);
                        var currentDate = new Date();
                        if (updated < currentDate) {
                            var updatedDb = calculateDate(data[j].data.updated);
                            var currentDate = calculateDate(new Date());
                            if (metric[j].objectTypes[0].meta.endpoint[0] === configAuth.linkedInMetrics.endPoints.followers) {
                                var query = 'https://api.linkedin.com/v1/companies/' + channelObjectId + '/num-followers?oauth2_access_token=' + initialResults.get_profile[j].accessToken + '&format=json';

                            }
                            else {
                                if (metric[j].code === configAuth.linkedInMetrics.highestEngagementUpdatesLinkedIn) {
                                    var query = 'https://api.linkedin.com/v1/companies/' + channelObjectId + '/updates?oauth2_access_token=' + initialResults.get_profile[j].accessToken + '&count=200&format=json';
                                }
                                else {
                                    var openDate = moment(data[j].data.updated).format('YYYY-MM-DD');
                                    var startDate = +moment(openDate);
                                    var closeDate = moment(new Date()).format('YYYY-MM-DD');
                                    var oneDay = 24 * 60 * 60 * 1000;
                                    var endDate = +moment(closeDate);
                                    endDate = (endDate + oneDay);
                                    var query = 'https://api.linkedin.com/v1/companies/' + channelObjectId + '/historical-status-update-statistics:(time,like-count,impression-count,share-count,click-count,comment-count)?oauth2_access_token=' + initialResults.get_profile[j].accessToken + '&time-granularity=day&start-timestamp=' + startDate + '&end-timestamp=' + endDate + '&format=json';
                                }
                            }
                            allObjects = {
                                profile: initialResults.get_profile[j],
                                query: query,
                                widget: metric[j],
                                dataResult: data[j].data,
                                startDate: updatedDb,
                                endDate: currentDate,
                                metricId: metric[j]._id,
                                objectId: channelObjectId,
                                metricCode: metric[j].code,
                                metricMeta: metric[j].objectTypes[0].meta.linkedInMetricName,
                                endpoint: metric[j].objectTypes[0].meta.endpoint
                            }
                            next(null, allObjects);
                        }
                        else
                            next(null, 'DataFromDb');
                    }
                    else {

                        //call google api
                        d.setDate(d.getDate() - 365);
                        var startDate = formatDate(d);
                        var endDate = formatDate(new Date());
                        if (metric[j].objectTypes[0].meta.endpoint[0] === configAuth.linkedInMetrics.endPoints.followers) {
                            var query = 'https://api.linkedin.com/v1/companies/' + channelObjectId + '/num-followers?oauth2_access_token=' + initialResults.get_profile[j].accessToken + '&format=json';
                        }
                        else {
                            if (metric[j].code === configAuth.linkedInMetrics.highestEngagementUpdatesLinkedIn) {
                                var query = 'https://api.linkedin.com/v1/companies/' + channelObjectId + '/updates?oauth2_access_token=' + initialResults.get_profile[j].accessToken + '&count=200&format=json';
                            }
                            else {
                                var openDate = startDate;
                                var startDate = +moment(openDate);
                                var closeDate = endDate;
                                var oneDay = 24 * 60 * 60 * 1000;
                                var endDate = +moment(closeDate);
                                endDate = (endDate + oneDay);
                                var query = 'https://api.linkedin.com/v1/companies/' + channelObjectId + '/historical-status-update-statistics:(time,like-count,impression-count,share-count,click-count,comment-count)?oauth2_access_token=' + initialResults.get_profile[j].accessToken + '&time-granularity=day&start-timestamp=' + startDate + '&end-timestamp=' + endDate + '&format=json';
                            }
                        }
                        allObjects = {
                            profile: initialResults.get_profile[j],
                            query: query,
                            widget: metric[j],
                            dataResult: data[j].data,
                            startDate: startDate,
                            endDate: endDate,
                            metricId: metric[j]._id,
                            objectId: channelObjectId,
                            metricCode: metric[j].code,
                            metricMeta: metric[j].objectTypes[0].meta.linkedInMetricName,
                            endpoint: metric[j].objectTypes[0].meta.endpoint
                        };
                        next(null, allObjects);

                    }

                }, done)
            }
        }

        function getLinkedInDataFromRemote(allObjects, callback) {
            var actualFinalApiData = {};
            async.concatSeries(allObjects.get_linkedIn_queries, checkDbData, callback);
            function checkDbData(result, callback) {
                if (result === 'DataFromDb') {
                    actualFinalApiData = {
                        apiResponse: 'DataFromDb',
                        queryResults: initialResults,
                        channelId: initialResults.metric[0].channelId
                    }
                    callback(null, actualFinalApiData);
                }
                else {
                    callLinkedInForMetrics(result, actualFinalApiData, callback);
                }
            }
        }

        function callLinkedInForMetrics(result, actualFinalApiData, callback) {
            var storeMetric;
            var tot_metric = [];
            var actualMetric = [];
            request(result.query,
                function (err, response, body) {
                    if (err || response.statusCode !== 200) {
                        if(response.statusCode == 401){
                            profile.update({_id: result.profile._id}, {
                                hasNoAccess:true
                            }, function(err, response) {
                                if(!err){
                                    return res.status(401).json({
                                        error: 'Authentication required to perform this action',
                                        id: req.params.widgetId,
                                        errorstatusCode:1003
                                    });
                                }
                                else
                                    return res.status(500).json({error: 'Internal server error', id: req.params.widgetId});
                            })
                        }
                        else
                            return res.status(500).json({error: 'Internal server error'});
                    }
                    else {
                        storeMetric = JSON.parse(body);
                        if (storeMetric._total == 0) {
                            var storeStartDate = new Date(req.body.startDate);
                            var storeEndDate = new Date(req.body.endDate);
                            var timeDiff = Math.abs(storeEndDate.getTime() - storeStartDate.getTime());
                            var diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24)); //adding plus one so that today also included
                            for (var i = 0; i <= diffDays; i++) {
                                var finalDate = formatDate(storeStartDate);
                                tot_metric.push({date: finalDate, total: 0});
                                storeStartDate.setDate(storeStartDate.getDate() + 1);
                            }
                            actualFinalApiData = {
                                apiResponse: tot_metric,
                                metricId: result.metricId,
                                queryResults: initialResults,
                                channelId: initialResults.metric[0].channelId
                            }
                            callback(null, actualFinalApiData);
                        }
                        else {
                            if (result.endpoint[0] == configAuth.linkedInMetrics.endPoints.followers) {
                                var storeStartDate = new Date(result.startDate);
                                var storeEndDate = new Date(result.endDate);
                                var timeDiff = Math.abs(storeEndDate.getTime() - storeStartDate.getTime());
                                var diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24)); //adding plus one so that today also included
                                for (var i = 0; i <= diffDays; i++) {
                                    var finalDate = formatDate(storeStartDate);
                                    tot_metric.push({date: finalDate, total: 0});
                                    storeStartDate.setDate(storeStartDate.getDate() + 1);
                                    if (result.endDate === tot_metric[i].date) {
                                        tot_metric[i] = {
                                            total: storeMetric,
                                            date: result.endDate
                                        };
                                    }
                                }
                                actualFinalApiData = {
                                    apiResponse: tot_metric,
                                    metricId: result.metricId,
                                    queryResults: initialResults,
                                    channelId: initialResults.metric[0].channelId
                                }
                                callback(null, actualFinalApiData);
                            }
                            else {
                                if (result.metricCode === configAuth.linkedInMetrics.highestEngagementUpdatesLinkedIn) {
                                    var loopCount = 0;
                                    for (var i = 0; i < storeMetric.values.length; i++) {
                                        loopCount++;
                                        var openDate = req.body.startDate;
                                        var startDate = +moment(openDate);
                                        var closeDate = req.body.endDate;
                                        var endDate = +moment(closeDate);
                                        var updateKey = storeMetric.values[i].updateKey;
                                        var dataDate = storeMetric.values[i].timestamp;
                                        if (dataDate >= startDate && dataDate <= endDate)
                                            tot_metric.push(storeMetric.values[i]);
                                    }
                                    if (tot_metric != null && tot_metric.length > 0) {
                                        for (var m = 0; m < tot_metric.length; m++) {
                                            var commentText = tot_metric[m].updateContent.companyStatusUpdate.share.comment;
                                            var companyId = 'https://www.linkedin.com/company/' + tot_metric[m].updateContent.company.id;
                                            var changeDate = moment.unix(dataDate / 1000).format("YYYY-MM-DD");
                                            var queryMakingForHistory = 'https://api.linkedin.com/v1/companies/' + result.objectId + '/historical-status-update-statistics:(time,like-count,impression-count,share-count,click-count,comment-count)?oauth2_access_token=' + result.profile.accessToken + '&time-granularity=day&start-timestamp=' + startDate + '&end-timestamp=' + endDate + '&update-key=' + updateKey + '&format=json&format=json-get&format=json';
                                            var store = callLinkedInCompanyHistory(queryMakingForHistory, changeDate, commentText, companyId);
                                        }
                                    }
                                    else {
                                        actualFinalApiData = {
                                            apiResponse: tot_metric,
                                            metricId: result.metricId,
                                            queryResults: initialResults,
                                            channelId: initialResults.metric[0].channelId
                                        }
                                        callback(null, actualFinalApiData);
                                    }

                                }
                                else {
                                    for (var i = 0; i < storeMetric.values.length; i++) {
                                        var dataDate = storeMetric.values[i].time;
                                        var changeDate = moment.unix(dataDate / 1000).format("YYYY-MM-DD");
                                        actualMetric.push({
                                            date: changeDate,
                                            total: storeMetric.values[i][result.metricMeta]
                                        });
                                    }
                                    actualFinalApiData = {
                                        apiResponse: actualMetric,
                                        metricId: result.metricId,
                                        queryResults: initialResults,
                                        channelId: initialResults.metric[0].channelId
                                    }
                                    callback(null, actualFinalApiData);

                                }
                            }
                        }
                    }
                    function callLinkedInCompanyHistory(queryMakingForHistory, changeDate, commentText, companyId) {
                        //actualMetric.push({date: changeDate,text:commentText, total:({likes:0,comments:0,shares:0,clicks:0,impressions:0})});
                        request(queryMakingForHistory,
                            function (err, response, linkedIn) {
                                if (err) {
                                    return res.status(500).json({error: 'Internal server error'});
                                }
                                else {
                                    var linkedInHistory = JSON.parse(linkedIn);
                                    var likesCount = 0, impressionsCount = 0, commentsCount = 0, sharesCount = 0, clicksCount = 0;
                                    var companylength = linkedInHistory._total;
                                    for (var k = 0; k < companylength; k++) {
                                        likesCount += linkedInHistory.values[k].likeCount;
                                        impressionsCount += linkedInHistory.values[k].impressionCount;
                                        commentsCount += linkedInHistory.values[k].commentCount;
                                        sharesCount += linkedInHistory.values[k].shareCount;
                                        clicksCount += linkedInHistory.values[k].clickCount;

                                    }
                                    actualMetric.push({
                                        date: changeDate,
                                        total: ({
                                            url: companyId,
                                            text: commentText,
                                            likes: likesCount,
                                            comments: commentsCount,
                                            shares: sharesCount,
                                            clicks: clicksCount,
                                            impressions: impressionsCount
                                        })
                                    });
                                    likesCount = 0;
                                    impressionsCount = 0;
                                    commentsCount = 0;
                                    sharesCount = 0;
                                    clicksCount = 0;
                                    var metricArray = _.sortBy(actualMetric, ['total.clicks']);
                                    if (tot_metric.length == actualMetric.length) {
                                        var metricArray = _.sortBy(actualMetric, ['total.clicks']);
                                        var collectionMetric = _.orderBy(metricArray, ['total.clicks', 'total.shares', 'total.likes', 'total.impressions'], ['desc', 'asc', 'asc', 'desc               ']);
                                        actualFinalApiData = {
                                            apiResponse: collectionMetric,
                                            metricId: result.metricId,
                                            queryResults: initialResults,
                                            channelId: initialResults.metric[0].channelId
                                        }
                                        callback(null, actualFinalApiData);
                                    }
                                }
                            }
                        );
                    }
                });
        }
    }

    function getMozData(results, callback) {
        async.auto({
            get_moz_queries: getMozQueries,
            get_moz_data_from_remote: ['get_moz_queries', getMozDataFromRemote]

        }, function (err, results) {
            if (err) {
                return callback(err, null);
            }
            callback(null, results.get_moz_data_from_remote);
        });
        //creating queries for moz
        function getMozQueries(callback) {
            var queries = {};
            formMozQuery(results.metric, results.data, results.object, callback);
            function formMozQuery(metric, data, object, callback) {
                async.timesSeries(metric.length, function (j, next) {
                    var metricType = metric[j].code;
                    if (data[j].data != null) {
                        var updated = new Date(data[j].data.updated);
                        updated= updated.setHours(updated.getHours() + configAuth.dataValidityInHours);
                        updated=new Date(updated);
                        var endDate = new Date();
                        if (updated < endDate) {
                            var newDate = moment(updated).format('YYYY-MM-DD');
                            var endDate=moment(new Date()).format('YYYY-MM-DD')
                            var query = moz.newQuery('url-metrics')
                                .target(object[0].name)
                                .cols([metric[j].code]);
                            queries = {
                                query: query,
                                metricId: metric[j]._id,
                                channelId: metric[j].channelId,
                                metricCode: metricType,
                                startDate: newDate,
                                endDate: endDate,
                            };
                            next(null, queries);
                        }
                        else {
                            queries = {
                                data: 'DataFromDb',
                                query: '',
                                metricId: metric[j]._id,
                                channelId: metric[j].channelId,
                                metricCode: metricType
                            };
                            next(null, queries);
                        }

                    }
                    else {
                        var query = moz.newQuery('url-metrics')
                            .target(object[0].name)
                            .cols([metric[j].code]);
                        var startDate = moment(new Date).subtract(365, "days").format("YYYY-MM-DD");
                        var endDate = moment(new Date).format('YYYY-MM-DD');
                        queries = {
                            query: query,
                            metricId: metric[j]._id,
                            channelId: metric[j].channelId,
                            metricCode: metricType,
                            startDate: startDate,
                            endDate: endDate
                        };

                        next(null, queries);
                    }


                }, callback)
            }

        }

        function getMozDataFromRemote(queries, callback) {
            var finalMozResponse = [];
            async.timesSeries(queries.get_moz_queries.length, function (j, next) {
                if (queries.get_moz_queries[j].data === 'DataFromDb') {
                    finalMozResponse = {
                        data: 'DataFromDb',
                        metricId: queries.get_moz_queries[j].metricId,
                        channelId: queries.get_moz_queries[j].channelId,
                        queryResults: results
                    }
                    next(null, finalMozResponse)
                }
                else {
                    callMozApi(queries, j, function (err, response) {
                        if (err)
                            return res.status(500).json({error: 'Internal server error', id: req.params.widgetId});
                        else {
                            next(null, response);
                        }
                    });
                }

            }, callback)
        }

//getting moz data from api
        function callMozApi(queries, j, callback) {
            var query = queries.get_moz_queries[j].query;
            moz.send(query, function (err, result) {
                if (err) {
                    return res.status(500).json({error: 'Internal server error'});
                }
                else {
                    var storeMetric = [];
                    var finalMozResponse;
                    if (queries.get_moz_queries[j].metricCode === configAuth.mozStatic.rank)
                        storeMetric.push({date: queries.get_moz_queries[j].endDate, total: result.umrp});
                    else if (queries.get_moz_queries[j].metricCode === configAuth.mozStatic.links)
                        storeMetric.push({date: queries.get_moz_queries[j].endDate, total: result.uid});
                    else if (queries.get_moz_queries[j].metricCode === configAuth.mozStatic.page_authority)
                        storeMetric.push({date: queries.get_moz_queries[j].endDate, total: result.upa});
                    else if (queries.get_moz_queries[j].metricCode === configAuth.mozStatic.domain_authority)
                        storeMetric.push({date: queries.get_moz_queries[j].endDate, total: result.pda});
                    else
                        storeMetric.push({date: queries.get_moz_queries[j].endDate, total: result.ueid});

                    finalMozResponse = {
                        metricId: queries.get_moz_queries[j].metricId,
                        data: storeMetric,
                        queryResults: results,
                        channelId: queries.get_moz_queries[j].channelId,
                        startDate: queries.get_moz_queries[j].startDate,
                        endDate: queries.get_moz_queries[j].endDate
                    };
                    callback(null, finalMozResponse);
                }
            });
        }

    }

    function selectVimeoObjectType(initialResults, callback) {
        async.auto({
            get_vimeo_queries: getVimeoQueries,
            get_vimeo_data_from_remote: ['get_vimeo_queries', getVimeoDataFromRemote]

        }, function (err, results) {
            if (err) {
                return callback(err, null);
            }
            callback(null, results.get_vimeo_data_from_remote);
        });


        function getVimeoQueries(callback) {
            work(initialResults.data, initialResults.object, initialResults.metric, callback);
            function work(data, object, metric, done) {

                async.timesSeries(metric.length, function (j, next) {
                    var id = initialResults.object[j].channelObjectId;
                    var play = metric[j].objectTypes[0].meta.play;


                    var query = configAuth.vimeoAuth.common + '/' + metric[j].objectTypes[0].meta.endpoint[0] + '/' + initialResults.object[j].channelObjectId + '/' + metric[j].objectTypes[0].meta.endpoint[1];


                    d = new Date();
                    var allObjects = {};
                    if (data[j].data != null) {
                        var updated = new Date(data[j].data.updated);
                        updated= updated.setHours(updated.getHours() + configAuth.dataValidityInHours);
                        updated=new Date(updated);
                        var currentDate = new Date();
                        if (updated < currentDate) {
                            var updated = calculateDate(data[j].data.updated);
                            var currentDate = calculateDate(new Date());
                            allObjects = {
                                profile: initialResults.get_profile[j],
                                query: query,
                                widget: metric[j],
                                dataResult: data[j].data,
                                startDate: updated,
                                endDate: currentDate,
                                metricId: metric[j]._id,

                            }
                            next(null, allObjects);
                        }
                        else
                            next(null, 'DataFromDb');
                    }
                    else {

                        //call google api
                        d.setDate(d.getDate() - 365);
                        var startDate = formatDate(d);
                        var endDate = formatDate(new Date());
                        var query = configAuth.vimeoAuth.common + '/' + metric[j].objectTypes[0].meta.endpoint[0] + '/' + id + '/' + metric[j].objectTypes[0].meta.endpoint[1];
                        allObjects = {
                            profile: initialResults.get_profile[j],
                            query: query,

                            widget: metric[j],
                            dataResult: data[j].data,
                            startDate: startDate,
                            endDate: endDate,
                            metricId: metric[j]._id,
                            metricCode: metric[j].code,

                        };
                        next(null, allObjects);

                    }

                }, done)
            }

        }


        function getVimeoDataFromRemote(allObjects, callback) {
            var actualFinalApiData = {};

            async.concatSeries(allObjects.get_vimeo_queries, checkDbData, callback);
            function checkDbData(result, callback) {
                if (result == 'DataFromDb') {
                    actualFinalApiData = {
                        apiResponse: 'DataFromDb',
                        queryResults: initialResults,
                        channelId: initialResults.metric[0].channelId
                    }
                    callback(null, actualFinalApiData);
                }
                else {
                    callVimeoApiForMetrics(result, callback);

                }
            }
        }


        function callVimeoApiForMetrics(result, callback) {
            //Set access token for hitting api access - dev
            var storeMetric;
            var tot_metric = [];
            var page = 1
            var sampledata = [];

            var actualFinalApiData = [];


            var access_token = result.profile.accessToken;


            callrequest();

            function callrequest() {
                request(result.query + '?access_token=' + access_token + '&page=' + page + '&per_page=2', function (err, results, body) {
                    if (results.statusCode != 200) {
                        if(results.statusCode == 401){
                            profile.update({_id: result.profile._id}, {
                                hasNoAccess:true
                            }, function(err, response) {
                                if(!err){
                                    return res.status(401).json({
                                        error: 'Authentication required to perform this action',
                                        id: req.params.widgetId,
                                        errorstatusCode:1003
                                    });
                                }
                                else
                                    return res.status(500).json({error: 'Internal server error', id: req.params.widgetId});
                            })

                        }
                        else
                            return res.status(500).json({error: 'Internal server error', id: req.params.widgetId});
                    }
                    else {
                        var parsedData = JSON.parse(body);
                        var Tempstore = [];
                        if (configAuth.vimeoMetric.vimeohighengagement == result.metricCode) {
                            for (var i = 0; i < parsedData.data.length; i++) {
                                var datadate = formatDate(new Date(Date.parse(parsedData.data[i].created_time.replace(/( +)/, ' UTC$1'))))
                                var lastCreatedAt = formatDate(new Date(Date.parse(datadate)));
                                var changeFormatCreateAt = moment.utc(lastCreatedAt).unix();
                                var startDate = moment.utc(req.body.startDate).unix();
                                var endDate = moment.utc(req.body.endDate).unix();

                                if (changeFormatCreateAt >= startDate && changeFormatCreateAt <= endDate) {
                                    sampledata.push({
                                        date: datadate,
                                        data: parsedData.data[i],
                                        likes: parsedData.data[i].metadata.connections.likes.total,
                                        comments: parsedData.data[i].metadata.connections.comments.total,
                                        views: parsedData.data[i].stats.plays
                                    });
                                }

                            }
                            if (parsedData.paging.next != null) {
                                page++;
                                callrequest();
                            }
                            else {

                                Tempstore = _.sortBy(sampledata, ['likes', 'comments']);
                                Tempstore = _.reverse(Tempstore)
                                for (var t = 0; t < Tempstore.length; t++) {
                                    tot_metric.push({date: Tempstore[t].date, total: Tempstore[t].data});

                                }
                                actualFinalApiData = {
                                    apiResponse: tot_metric,
                                    metricId: result.metricId,
                                    queryResults: initialResults,
                                    channelId: initialResults.metric[0].channelId
                                }
                                callback(null, actualFinalApiData);
                            }


                        }
                        else {
                            var storeStartDate = new Date(result.startDate);
                            var storeEndDate = new Date(result.endDate);
                            var timeDiff = Math.abs(storeEndDate.getTime() - storeStartDate.getTime());
                            var diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24));

                            if (configAuth.vimeoMetric.vimeoviews == result.metricCode) {
                                storeMetric = parsedData.stats.plays;
                            }
                            else {
                                storeMetric = parsedData.total;
                            }


                            for (var i = 0; i <= diffDays; i++) {
                                var finalDate = formatDate(storeStartDate);
                                tot_metric.push({date: finalDate, total: 0});
                                storeStartDate.setDate(storeStartDate.getDate() + 1);

                                if (result.endDate === tot_metric[i].date) {
                                    tot_metric[i] = {
                                        total: storeMetric,
                                        date: result.endDate
                                    };
                                }
                            }
                            actualFinalApiData = {
                                apiResponse: tot_metric,
                                metricId: result.metricId,
                                queryResults: initialResults,
                                channelId: initialResults.metric[0].channelId
                            }

                            callback(null, actualFinalApiData);
                        }


                    }

                    /* if (pagination) {
                     if (pagination.next) {
                     pagination.next(callVimeoApi); // Will get second page results
                     }
                     }*/

                })
            }


        }


    };


};