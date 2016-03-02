var exports = module.exports = {};
var googleapis = require('googleapis');//To use google api's
var profile = require('../models/profiles');//load up the user model
var metrics = require('../models/metrics');
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

exports.listAccounts = function (req, res, next) {
    console.log('metric name', req.params.metricName);
    req.showMetric = {};
    var accountWebpropertList = [];
    var webPropertyViewIdList = [];
    req.showMetric.webPropertyViewIdList = [];

    profile.find({
        'email': 'metroweddingsindia@gmail.com',
        'channelId': '56d52c07e4b0196c549033b6'
    }, function (err, user) {
        req.showMetric.user = user;
        passUserDetails(req, req.showMetric.user);
    });
    function passUserDetails(req, userDetails) {
        console.log('userDetails', userDetails);
        oauth2Client.setCredentials({
            access_token: userDetails[0].accessToken,
            refresh_token: userDetails[0].refreshToken
        });
        getMetricResults(req, req.showMetric.user[0], next);
        function refreshingAccessToken(userDetails) {
            oauth2Client.refreshAccessToken(function (err, tokens) {
                // your access_token is now refreshed and stored in oauth2Client
                // store these new tokens in a safe place (e.g. database)
                var userDetails = {};
                userDetails.token = tokens.access_token;
                getMetricResults(req, userDetails);
                profile.update({'email': req.showMetric.user[0].email}, {$set: {"accessToken": tokens.access_token}}, {upsert: true}, function (err, updateResult) {
                    if (err || !updateResult)console.log('failure');
                    else console.log('Update success');
                })
            });
        }

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

    function getWebPropertView(i, j, response, result, next) {
        analytics.management.profiles.list({
            'accountId': result.items[i].id,
            'webPropertyId': response.items[j].id
        }, function (err, getProperty) {
            for (var k = 0; k < getProperty.items.length; k++) {
                webPropertyViewIdList.push({
                    'accountId': result.items[i].id,
                    'webProperty': response.items[j].id,
                    'webPropertyName': response.items[j].name,
                    'viewId': getProperty.items[k].id,
                    'viewName': getProperty.items[k].name
                });
                if (!err) {
                    //To get API Nomenclature value for metric name
                    metrics.find({name: req.params.metricName}, function (err, response) {
                        /*  //To find the day difference between start and end date

                         for(var i=0;i++;i<1){

                         }*/
                        if (response.length) {
                            analytics.data.ga.get({
                                reportType: 'ga',
                                'ids': 'ga:109151059',
                                'start-date': '5daysAgo',
                                'end-date': 'today',
                                'metrics': response[0].meta.gaMetricName,
                                prettyPrint: true
                            }, function (err, result) {
                                req.showMetric.result = result;
                                next();
                                // return req.showMetric.result;
                            });
                        }
                        else {
                            req.showMetric.error = {'message': 'No data found'};
                            next();
                        }
                    })

                }
            }
        })
    }

    // next();
    //console.log('global object',req);

}


