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
var widgetCollection = require('../models/widgets');


/**
 * middleware to to get the google analytic data based on profile,metric,view,dates
 * @param req req from controller
 * @param res
 * @param next callback to send response back to controller
 */
exports.getChannelData = function (req, res, next) {

    //Query to find objectId,metricId
    widgetCollection.findOne({'_id': req.params.widgetId}, {metrics: 1}, function (err, widgetDetails) {
        if (err)
            req.app.result = {error: err, message: 'Database error'};
        else if (!widgetDetails)
            req.app.result = {status: 302, message: 'No record found'};
        else {
            console.log('widget', widgetDetails);

            //Query to find the profile id
            objectCollection.findOne({'_id': widgetDetails.metrics[0].objectId}, {
                profileId: 1,
                channelObjectId: 1,
                objectTypeId: 1
            }, function (err, objectDetails) {
                console.log('objectDetails', objectDetails);
                if (err)
                    req.app.result = {error: err, message: 'Database error'};
                else if (!objectDetails)
                    req.app.result = {status: 302, message: 'No record found'};
                else {
                    console.log('objectDetails', objectDetails);

                    //Query to find channel
                    profile.findOne({'_id': objectDetails.profileId}, {
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
                                console.log('channelDetails', channelDetails);

                                //To check the channel
                                switch (channelDetails.code) {
                                    case 'googleanalytics':
                                        console.log('googleanalytics');
                                        selectGAObjectType(profileInfo, channelDetails);
                                        break;
                                    case 'facebook':
                                        console.log('facebook');
                                        selectFBObjectType(profileInfo, channelDetails, widgetDetails, objectDetails);
                                        break;
                                }
                            })
                        }
                    })
                }
            })
        }
    });

    function selectFBObjectType(profileInfo, channelDetails, widgetDetails, objectDetails) {

        //select object type
        objectTypeCollection.findOne({'_id': objectDetails.objectTypeId}, {type: 1}, function (err, objectType) {
            if (err)
                req.app.result = {error: err, message: 'Database error'};
            else if (!profileInfo)
                req.app.result = {status: 302, message: 'No record found'};
            else {

                //To select which object type
                switch (objectType.type) {
                    case 'page':
                        console.log('channel');
                        var pageId = objectDetails.channelObjectId;
                        getFBPageData(profileInfo, channelDetails, widgetDetails, objectDetails, pageId);
                        break;
                    case 'post':
                        console.log('google');
                        getFBPageList(profileInfo, channelDetails);
                        break;
                }
            }
        })


    }

    function getFBPageData(profileInfo, channelDetails, widgetDetails, objectDetails, pageId) {


        graph.setAccessToken(profileInfo.accessToken);
        metrics.findById(widgetDetails.metrics[0].metricId, function (err, response) {
            if (!err) {

                //To get objectId from database based on profile&pageId
                objectCollection.find({
                    'channelObjectId': objectDetails.channelObjectId,
                    'profileId': profileInfo._id
                }, function (err, objectResult) {
                    console.log('objectResult', objectResult, objectDetails, profileInfo);
                    if (!err) {
                        dataCollection.findOne({
                            'objectId': widgetDetails.metrics[0].objectId,
                            'metricId': widgetDetails.metrics[0].metricId
                        }, function (err, dataResult) {
                            console.log('dataResult', dataResult, widgetDetails);
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
                            function setStartEndDate(n, count) {
                                d.setDate(d.getDate() + 1);
                                var endDate = calculateDate(d);
                                d.setDate(d.getDate() - n);
                                var startDate = calculateDate(d);
                                var query = pageId + "/insights/" + response.meta.fbMetricName + "?since=" + startDate + "&until=" + endDate;
                                fetchFBData(query, objectResult, count, widgetDetails, dataResult);
                            }


                            if (dataResult) {
                                var updated = calculateDate(dataResult.updated);
                                var currentDate = calculateDate(new Date());
                                d.setDate(d.getDate() + 1);
                                var endDate = calculateDate(d);
                                var oneDay = 24 * 60 * 60 * 1000; // hours*minutes*seconds*milliseconds
                                if (updated <= currentDate) {
                                    console.log('if', updated, currentDate, Math.round(Math.abs((dataResult.updated.getTime() - new Date().getTime()) / (oneDay))));
                                    var query = pageId + "/insights/" + response.meta.fbMetricName + "?since=" + updated + "&until=" + endDate;
                                    fetchFBData(query, objectResult, 3, widgetDetails, dataResult, 1);
                                }
                                else
                                    console.log('else');
                                //get date from database
                                //check date in data collection if date<now the set start date as date and end date as now merge the result into data in collection
                                var query = pageId + "/insights/" + response.meta.fbMetricName + "/day";
                                // fetchFBData(query, objectResult);

                            }
                            else {
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
        })
    }

    /*
     function to execute the query and get impression details of a chosen single metric
     */
    function fetchFBData(query, objectResult, count, widgetDetails, dataResult, data) {

        var impressions = [];
        var dates = [];
        var finalData = [];
        totalImpressions = [];
        totalDates = [];
        graph.get(query, function (err, res) {
            for (i = 0; i < res.data[0].values.length; i++) {
                impressions.push(res.data[0].values[i].value);
                dates.push(res.data[0].values[i].end_time);
            }
            for (var k = 0; k < impressions.length; k++) {
                totalImpressions.push(impressions[k]);
                totalDates.push(dates[k]);

            }

            // create the impression object
            var saveResult = new dataCollection();
            var length = totalImpressions.length;
            for (var i = 0; i < length; i++) {
                // set the page's impressions

                // saveResult.pageName = pageName;
                // saveResult.profileName = profileName;
                //saveResult.userId = userId;
                saveResult.objectId = widgetDetails.metrics[0].objectId;
                saveResult.metricId = widgetDetails.metrics[0].metricId;
                saveResult.created = new Date();
                saveResult.updated = new Date();
                finalData.push({'impressionCount': totalImpressions[i], 'date': totalDates[i]});


            }


            console.log('finaldata', finalData, 'length', finalData.length);


            // save the user

            if (count == 3) {
               var wholeResponse = [];
                console.log('data', data);
                if (data) {

                    for (var r = 0; r < dataResult.data.length; r++) {
                        //merge old data with new one
                        wholeResponse.push(dataResult.data[r]);

                    }
                    console.log('wholeResponse',dataResult.data[0], wholeResponse);

                    for (data in finalData) {
                        wholeResponse.push(finalData[data]);
                    }

                    console.log('dataResult', wholeResponse);
                    saveResult.data = wholeResponse[0];
                    updated = new Date();
                    dataCollection.update({
                        'objectId': widgetDetails.metrics[0].objectId
                    }, {
                        $set: {data: wholeResponse, updated: updated}
                    }, {upsert: true}, function (err) {
                        console.log('err', err);
                        if (err) console.log("User not saved");
                        else {

                            dataCollection.find({'objectId': widgetDetails.metrics[0].objectId}, function (err, response) {
                                console.log('saved');


                                //console.log(' wholeResponse', wholeResponse);
                                if (!err) {
                                    req.app.result = response;
                                    next();
                                }
                            })

                        }
                    });
                }
                else {
                    saveResult.data = finalData;
                    console.log('final', finalData);
                    saveResult.save(function (err, saved) {

                        if (err || !saved) console.log("User not saved");
                        else {

                            dataCollection.find({'objectId': widgetDetails.metrics[0].objectId}, function (err, response) {
                                console.log('saved');

                                wholeResponse.push(saved);
                                wholeResponse.push(response);
                                //console.log(' wholeResponse', wholeResponse);
                                if (!err) {
                                    req.app.result = response;
                                    next();
                                }
                            })

                        }
                    });
                }
            }
            //});
            //  })


        })


    }

    function getGAPageData() {
        var channelId = '56d52c07e4b0196c549033b6';
        req.app = {};

        //Query to get the user details based on profile info
        profile.findOne({
            'email': req.body.email,
            'channelId': channelId
        }, function (err, profile) {

            if (!err) {
                //check error status
                oauth2Client.setCredentials({
                    access_token: profile.accessToken,
                    refresh_token: profile.refreshToken
                });
                googleDataEntireFunction();
            }

        })
    }


    /**
     * function to calculate the total days and process to find the google analytic data
     */
    function googleDataEntireFunction() {
        console.log('msg', req.body);
        //To get API Nomenclature value for metric name
        metrics.find({name: req.body.metricName}, function (err, response) {
            if (response.length) {

                //To find the day's difference between start and end date
                var startDate = new Date(req.body.startDate);
                var endDate = new Date(req.body.endDate);
                var timeDiff = Math.abs(endDate.getTime() - startDate.getTime());
                var totalDays = Math.ceil(timeDiff / (1000 * 3600 * 24));
                var metricName = response[0].meta.gaMetricName;
                req.app.noOfRequest = totalDays;
                var totalRequest = req.app.noOfRequest;
                var dimensionArray = [];
                var dimensionList = req.body.dimensionList;

                //Array to hold the final google data
                var storeGoogleData = [];
                //This is for testing now hard coded
                // dimensionList.push({'name': 'ga:date'}, {'name': 'ga:year'}, {'name': 'ga:month'}, {'name': 'ga:day'}, {'name': 'ga:year'}, {'name': 'ga:week'});
                var getDimension = dimensionList[0].name;
                var dimensionListLength = dimensionList.length;

                //Dynamically form the dimension object like {ga:}
                for (var k = 1; k < dimensionListLength; k++) {
                    getDimension = getDimension + ',' + dimensionList[k].name;
                    dimensionArray.push({'dimension': getDimension});
                }

                /**Method to call the google api
                 * @param oauth2Client - set credentials
                 */
                analytics.data.ga.get({
                    'auth': oauth2Client,
                    'ids': 'ga:' + req.body.pageId,
                    'start-date': req.body.startDate,
                    'end-date': req.body.endDate,
                    'dimensions': dimensionArray[dimensionArray.length - 1].dimension,
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
                                }
                                else {
                                    obj[dimensionList[m].name.substr(3)] = result.rows[i][m];
                                    obj['metricName'] = metricName;
                                    obj['total'] = result.rows[i][resultCount];
                                }
                            }
                            storeGoogleData.push(obj)
                            if (storeGoogleData.length == totalRequest) {
                                req.app.result = storeGoogleData;

                                //Save the result to data collection
                                //input channelId,channelObjId,metricId
                                var data = new dataCollection();
                                data.metricId = response[0]._id;
                                data.data = storeGoogleData;
                                console.log('storeGoogleData', storeGoogleData);
                                data.save(function saveData(err, googleData) {
                                    if (!err)
                                        next();
                                })

                            }
                        }
                    }
                    //If there is error, then refresh the access token
                    else {
                        oauth2Client.refreshAccessToken(function (err, tokens) {
                        });
                        googleDataEntireFunction();
                    }
                });
            }

            //If empty response from database set the error message
            else {
                req.app.error = {'message': 'No data found'};
                next();
            }
        })
    }
}


