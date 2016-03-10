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
 * middleware to get the list email users from database
 * @param req - contains user details i.e google : accesstoken,user id,email etc
 * @param res
 * @param next
 */
exports.checkAccountCount = function (req, res, next) {
    req.showMetric = {};
    profile.find({email: 'dheepika.sk@gmail.com'}, function (err, user) {
        req.showMetric.userDetails = user;
        next();
        return req.showMetric.userDetails;
    });
}

/**
 * middleware to get the account details based on user account

 */
exports.listAccounts = function (req, res, next) {
    console.log('req', req.query.email);

    //create showmetric object in req
    req.showMetric = {};

    //Array to hold web property list
    var accountWebpropertList = [];

    //Array to hold view list
    var webPropertyViewIdList = [];

    //array to hold google data
    req.showMetric.webPropertyViewIdList = [];

    //To check the channel
    switch (req.query.channelCode) {
        case '1':
            console.log('channel');
            getGAPageList();
            break;
        case '2':
            getFBPageList();
            break;
    }

    //function to get the list of ga pages
    function getGAPageList() {
        var channelId = '56d52c07e4b0196c549033b6';

        //Query to find profile details
        profile.findOne({
            'email': req.query.email,
            'channelId': channelId
        }, function (err, user) {
            if (!err)
                passUserDetails(req, user);
        });
    }

//Function to set the credentials & call the next functions
    function passUserDetails(req, userDetails) {
        console.log('user details', userDetails);
        oauth2Client.setCredentials({
            access_token: userDetails.accessToken,
            refresh_token: userDetails.refreshToken
        });
        getMetricResults(req, userDetails, next);

        //Function to referesh the access token
        function refreshingAccessToken(userDetails) {
            oauth2Client.refreshAccessToken(function (err, tokens) {

                // your access_token is now refreshed and stored in oauth2Client
                // store these new tokens in a safe place (e.g. database)
                var userDetails = {};
                userDetails.token = tokens.access_token;
                getMetricResults(req, userDetails, next);
                profile.update({'email': req.query.email}, {$set: {"accessToken": tokens.access_token}}, {upsert: true}, function (err, updateResult) {
                    if (err || !updateResult)console.log('failure');
                    else console.log('Update success');
                })
            });
        }

        //function to get the account list
        function getMetricResults(req, userDetails, next) {
            length = 0;
            analytics.management.accounts.list({
                access_token: userDetails.accessToken,
                auth: oauth2Client
            }, function (err, result) {
                if (!err) {
                    for (var i = 0; i < result.items.length; i++) {

                        getWebProperty(i, result);
                    }
                }
                else {
                    console.log('else refresh token', userDetails);
                    refreshingAccessToken(userDetails);
                }
            })

        }
    }

    //function to get property list
    function getWebProperty(i, result) {
        analytics.management.webproperties.list({
            'accountId': result.items[i].id,
        }, function (err, response) {
            for (var j = 0; j < response.items.length; j++) {
                accountWebpropertList.push({'accountId': result.items[i].id, webPropertyId: response.items[j].id});
                if (!err) {
                    getWebPropertView(i, j, response, result, next);
                }
            }
        })
    }

    //function to get the views list
    function getWebPropertView(i, j, response, result, next) {
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
            if(result.items.length-1==i){
                console.log('webPropertyViewIdList', webPropertyViewIdList,result.items.length-1);
                req.showMetric.pageLists = webPropertyViewIdList;
                next();
            }



        })
        console.log(req.showMetric.webPropertyViewIdList);
    }

    /**
     Function to get the user's all owned pages of facebook user
     @params 1.req contains the facebook user details i.e. username,token,email etc
     2.res have the query response
     @event pageList is used to send & receive the list of pages result
     */
    function getFBPageList() {
        var channelId = '56d52c7ae4b0196c549033ca';

        //Query to find profile details
        profile.findOne({
            'email': req.query.email,
            'channelId': channelId
        }, function (err, profile) {
            if (!err)
                passUserDetails(profile);
        });
        function passUserDetails(userProfile) {
            var channelObjectDetails = [];

            //To get the object type id from database
            objectTypeCollection.findOne({'type': 'page', 'channelId': channelId}, function (err, res) {
                var typeId = '56dd573fe4b0c05f88d0229b';
                if (!err) {
                    FB.setAccessToken(userProfile.accessToken);//Set access token
                    FB.api(
                        "/" + userProfile.userId + "/accounts",
                        function (pageList) {
                            var length = pageList.data.length;
                            req.showMetric.result = pageList;
                            for (var i = 0; i < length; i++) {
                                var objectsResult = new objectCollection();
                                objectsResult.profileId = userProfile._id;
                                objectsResult.objectTypeId = typeId;
                                objectsResult.channelObjectId = pageList.data[i].id;
                                objectsResult.name = pageList.data[i].name
                                objectsResult.save(function (err, result) {
                                    if (!err) {
                                        channelObjectDetails.push({
                                            'result': result
                                        })
                                        if (pageList.data.length == channelObjectDetails.length) {
                                            req.showMetric.pageLists = pageList;
                                            next();
                                        }
                                    }
                                })
                            }
                        }
                    );
                }
            })
        }
    }
}
/**
 * middleware to to get the google analytic data based on profile,metric,view,dates
 * @param req req from controller
 * @param res
 * @param next callback to send response back to controller
 */
exports.getGoogleAnalyticData = function (req, res, next) {
    switch (req.body.channelCode) {
        case '1':
            console.log('channel');
            getGAPageData();
            break;
        case '2':
            getFBPageData();
            break;
    }
    function getFBPageData() {
        var channelId = '56d52c7ae4b0196c549033ca';

        //Query to find profile details
        profile.findOne({
            'email': req.body.email,
            'channelId': channelId
        }, function (err, profile) {
            //console.log('user', profile);
            //check error status

            passUserDetails(profile);
        });
        function passUserDetails(profile) {

            var email = req.body.email;
            var pageId = req.body.pageId;

            graph.setAccessToken(profile.accessToken);
            metrics.findById(req.body.metricId, function (err, response) {
                if (!err) {

                    //To get objectId from database based on profile&pageId
                    objectCollection.find({
                        'channelObjectId': req.body.pageId,
                        'profileId': profile._id
                    }, function (err, objectResult) {
                        if (!err) {
                            dataCollection.find({'objectId': objectResult[0]._id}, function (err, dataResult) {
                                function calculateDate(d) {
                                    month = '' + (d.getMonth() + 1),
                                        day = '' + d.getDate(),
                                        year = d.getFullYear();

                                    if (month.length < 2) month = '0' + month;
                                    if (day.length < 2) day = '0' + day;
                                    var startDate = [year, month, day].join('-');
                                    return startDate;
                                }

                                if (dataResult.length) {
                                    userCollection.find().sort({lastLoggedIn: -1}).exec(function (err, result) {
                                        console.log('result', result);
                                        var date = calculateDate(result[1].lastLoggedIn);
                                        console.log('start', date);
                                    });
                                    //get date from database
                                    //check date in data collection if date<now the set start date as date and end date as now merge the result into data in collection
                                    var query = pageId + "/insights/" + response.meta.fbMetricName + "/day";
                                    // fetchFBData(query, objectResult);

                                }
                                else {
                                    //call the facebook api & store one year data
                                    //ex end date = 09/03/2016 start date = 09/03/2015
                                    var d = new Date();

                                    function setStartEndDate(n, count) {

                                        var endDate = calculateDate(d);
                                        d.setDate(d.getDate() - n);
                                        var startDate = calculateDate(d);
                                        var query = pageId + "/insights/" + response.meta.fbMetricName + "?since=" + startDate + "&until=" + endDate;
                                        fetchFBData(query, objectResult, count);
                                    }

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
    }

    /*
     function to execute the query and get impression details of a chosen single metric
     */
    function fetchFBData(query, response, count) {

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
                saveResult.objectId = response[0]._id;
                saveResult.metricId = req.body.metricId;
                saveResult.created = new Date();
                saveResult.updated = new Date();
                finalData.push({'impressionCount': totalImpressions[i], 'date': totalDates[i]});
                saveResult.data = finalData;

            }

            console.log('finaldata', finalData, 'length', finalData.length);


            // save the user

            if (count == 3) {
                saveResult.save(function (err, saved) {
                    if (err || !saved) console.log("User not saved");
                    else {
                        console.log('saved');
                        dataCollection.find({'objectId': response[0]._id}, function (err, response) {
                            if (!err) {
                                req.app.result = response;
                                next();
                            }
                        })

                    }
                });
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
console.log('storeGoogleData',storeGoogleData);
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


