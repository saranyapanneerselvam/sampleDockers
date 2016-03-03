var exports = module.exports = {};
var googleapis = require('googleapis');//To use google api's
var profile = require('../models/profiles');//To load up the user model
var metrics = require('../models/metrics');//To load the metrics model
var dataCollection = require('../models/data');//To load the data model
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
    showMetric = {};
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

    //create showmetric object in req
    req.showMetric = {};

    //Array to hold web property list
    var accountWebpropertList = [];

    //Array to hold view list
    var webPropertyViewIdList = [];

    //array to hold google data
    req.showMetric.webPropertyViewIdList = [];

    //Query to find profile details
    profile.find({
        'email': 'metroweddingsindia@gmail.com',
        'channelId': '56d52c07e4b0196c549033b6'
    }, function (err, user) {
        //check error status

        req.showMetric.user = user;
        passUserDetails(req, req.showMetric.user);
    });

//Function to set the credentials & call the next functions
    function passUserDetails(req, userDetails) {
        oauth2Client.setCredentials({
            access_token: userDetails[0].accessToken,
            refresh_token: userDetails[0].refreshToken
        });
        getMetricResults(req, req.showMetric.user[0], next);

        //Function to referesh the access token
        function refreshingAccessToken(userDetails) {
            oauth2Client.refreshAccessToken(function (err, tokens) {
                // your access_token is now refreshed and stored in oauth2Client
                // store these new tokens in a safe place (e.g. database)
                var userDetails = {};
                userDetails.token = tokens.access_token;
                getMetricResults(req, userDetails, next);
                profile.update({'email': req.showMetric.user[0].email}, {$set: {"accessToken": tokens.access_token}}, {upsert: true}, function (err, updateResult) {
                    if (err || !updateResult)console.log('failure');
                    else console.log('Update success');
                })
            });
        }

        //function to get the account list
        function getMetricResults(req, userDetails, next) {
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
        })
    }
}
/**
 * middleware to to get the google analytic data based on profile,metric,view,dates
 * @param req req from controller
 * @param res
 * @param next callback to send response back to controller
 */
exports.getGoogleAnalyticData = function (req, res, next) {
    req.app = {};

    //Array to hold the final google data
    var storeGoogleData = [];

    //Query to get the user details based on profile info
    profile.findOne({
        'email': req.body.object.email,
        'channelId': req.body.object.channelId
    }, function (err, profile) {
        //check error status
        // req.showMetric.user = user;
        oauth2Client.setCredentials({
            access_token: profile.accessToken,
            refresh_token: profile.refreshToken
        });
        googleDataEntireFunction();
    });

    /**
     * function to calculate the total days and process to find the google analytic data
     */
    function googleDataEntireFunction() {

        //To get API Nomenclature value for metric name
        metrics.find({name: req.body.object.metricName}, function (err, response) {
            if (response.length) {
                //To find the day's difference between start and end date
                var startDate = new Date(req.body.object.startDate);
                var endDate = new Date(req.body.object.endDate);
                var timeDiff = Math.abs(endDate.getTime() - startDate.getTime());
                var totalDays = Math.ceil(timeDiff / (1000 * 3600 * 24));
                var metricName = response[0].meta.gaMetricName;
                req.app.noOfRequest = totalDays;
                var totalRequest = req.app.noOfRequest;

                var dimensionArray = [];
                var dimensionList = req.body.object.dimensionList;
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
                    'ids': 'ga:'+req.body.object.pageId,
                    'start-date': req.body.object.startDate,
                    'end-date': req.body.object.endDate,
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
                                data.metricId = '56cef57ee4b036a44ac5e0d3';
                                data.data = storeGoogleData;
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


