//BatchJobs - Used to update the channel data periodically
var _ = require('lodash');
//job scheduling library
var Agenda = require('agenda');
//set googleAdwords node module
var googleAds = require('./lib/googleAdwords');
var spec = {host: 'https://adwords.google.com/api/adwords/reportdownload/v201601'};
googleAds.GoogleAdwords(spec);
var request = require('request');
//To use google api's
//importing pinterest node module
var PDK = require('node-pinterest');
var googleapis = require('googleapis');
var semaphore = require('semaphore')(1);
//Load the auth file
var configAuth = require('./config/auth');
//Set OAuth
var OAuth2 = googleapis.auth.OAuth2;

//set credentials in OAuth2
var oauth2Client = new OAuth2(configAuth.googleAuth.clientID, configAuth.googleAuth.clientSecret, configAuth.googleAuth.callbackURL);

//load async module
var async = require("async");
var mongoConnectionString = configAuth.batchJobs.dataBase;
var FB = require('fb');
//db connection for storing agenda jobs
var agenda = new Agenda({db: {address: mongoConnectionString}});
var Channels = require('./models/channels');

//Importing the fbgraph module
var graph = require('fbgraph');

//set Twitter module
var Twitter = require('twitter');

var client = new Twitter({
    consumer_key: configAuth.twitterAuth.consumerKey,
    consumer_secret: configAuth.twitterAuth.consumerSecret,
    access_token_key: configAuth.twitterAuth.AccessToken,
    access_token_secret: configAuth.twitterAuth.AccessTokenSecret
});
//load aweber node module
var NodeAweber = require('aweber-api-nodejs');
//set credentials in NodeAweber
var NA = new NodeAweber(configAuth.aweberAuth.clientID, configAuth.aweberAuth.clientSecret,configAuth.aweberAuth.callbackURL);

//set moz module
var moz = require('mozscape-request')({
    accessId: configAuth.batchJobsMoz.accessId,
    secret: configAuth.batchJobsMoz.secret,
    expires: configAuth.batchJobsMoz.expires
});
//To load the data model
var Data = require('./models/data');

//Importing instagram node module - dev
var ig = require('instagram-node').instagram();

//To load the metric model
var Metric = require('./models/metrics');

var moment = require('moment');
var nodemailer = require('nodemailer');

//To load the data model
var Object = require('./models/objects');

//To load the profile model
var Profile = require('./models/profiles');
var mongoose = require('mongoose');
mongoose.connect(mongoConnectionString);//Connection with mongoose
mongoose.set('debug', false);
var Alert = require('./models/alert');

//set Twitter module
var Twitter = require('twitter');
var utility = require('./helpers/utility');
var transporter = nodemailer.createTransport({
    service: 'Zoho',
    auth: {
        user: configAuth.batchJobs.mail.user,
        pass:configAuth.batchJobs.mail.password
    }
});
var errorDataList = [];
agenda.define('Update channel data', function (job, done) {
    init();
    function init() {

        //async's one of the method to run tasks ,one task may or may not depend on the other
        async.auto({
            data: getData,
            metric: ['data', getMetric],
            object: ['data', 'metric', getObject],
            get_profile: ['data', 'object', getProfile],
            get_channel: ['get_profile', 'metric', getChannel],
            get_channel_data_remote: ['get_channel', getChannelDataRemote],
            merge_all_final_data: ['get_channel_data_remote', 'get_channel', mergeAllFinalData],
            store_final_data: ['merge_all_final_data', 'get_channel_data_remote', storeFinalData]

        }, function (err, results) {
            done(err)
        });

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

        function getData(callback) {
            Data.find({
                bgFetch: true
            }, checkNullObject(callback));
        }

        function getMetric(results, callback) {
            async.concatSeries(results.data, findEachMetrics, callback);
        }

        //Function to get each metric details
        function findEachMetrics(results, callback) {
            Metric.find({
                _id: results.metricId
            }, checkNullObject(callback))
        }

        function getObject(results, callback) {
            async.concatSeries(results.data, getEachObject, callback);
        }

        //Function to get each object details
        function getEachObject(results, callback) {
            Object.find({'_id': results.objectId}, {
                profileId: 1,
                channelObjectId: 1,
                objectTypeId: 1,
                name: 1,
                channelId: 1,
                meta:1,
            }, checkNullObject(callback));
        }

        //Function to get the data in profile collection
        function getProfile(results, callback) {
            async.concatSeries(results.object, getEachProfile, callback)
            //Function to get all profile details
            function getEachProfile(channelResults, callback) {
                //skipping profile for moz
                if (String(channelResults.channelId) === String(results.metric[0].channelId))
                    callback(null, ([{channelId: results.metric[0].channelId}]));
                else
                    Profile.findOne({'_id': channelResults.profileId}, {
                        accessToken: 1,
                        refreshToken: 1,
                        channelId: 1,
                        userId: 1,
                        email: 1,
                        tokenSecret: 1,
                        name: 1,
                        dataCenter: 1
                    }, checkNullObject(callback));
            }
        }


        //Function to get the data in channel collection
        function getChannel(results, callback) {
            if (String(results.object.channelId) === String(results.metric.channelId))
                async.concatSeries(results.get_profile, getEachChannel, callback);
            else
                async.concatSeries(results.get_profile, getEachChannel, callback);
        }


        //Function to get all channels detail
        function getEachChannel(results, callback) {
            Channels.findOne({'_id': results.channelId}, {code: 1}, checkNullObject(callback));
        }


        function getChannelDataRemote(results, callback) {
            callEachChannel(results.data, results.get_profile, results.get_channel, results.metric, results.object);
            function callEachChannel(data, profile, channel, metric, object) {
                async.timesSeries(data.length, function (j, next) {
                    if (String(profile) != undefined) {
                        var allResultData = {
                            data: data[j],
                            profile: profile[j],
                            channel: channel[j],
                            metric: metric[j],
                            object: object[j]
                        }
                    }
                    else {
                        var allResultData = {
                            data: data[j],
                            channel: channel[j],
                            metric: metric[j],
                            object: object[j]
                        }
                    }
                    //To check the channel
                    switch (allResultData.channel.code) {
                        case configAuth.channels.twitter:
                            getTweetData(allResultData, next);
                            break;
                        case configAuth.channels.instagram:
                            selectInstagram(allResultData, next);
                            break;
                        case configAuth.channels.facebook:
                            getFBPageData(allResultData, next);
                            break;
                        case configAuth.channels.facebookAds:
                            getFBadsinsightsData(allResultData, next);
                            break;
                        case configAuth.channels.googleAnalytics:
                            initializeGa(allResultData, next);
                            break;
                        case configAuth.channels.googleAdwords:
                            selectAdwordsObjectType(allResultData, next);
                            break;
                        case configAuth.channels.mailChimp:
                            selectMailChimp(allResultData, next);
                            break;
                        case configAuth.channels.youtube:
                            initializeGa(allResultData, next);
                            break;
                        case configAuth.channels.linkedIn:
                            selectLinkedInObjectType(allResultData, next);
                            break;
                        case configAuth.channels.pinterest:
                            selectPinterest(allResultData, next);
                            break;
                        case configAuth.channels.aweber:
                            selectAweber(allResultData, next);
                            break;
                        case configAuth.channels.moz:
                            getMozData(allResultData, next);
                            break;
                        case configAuth.channels.vimeo:
                            selectVimeo(allResultData, next);
                            break;
                        default:
                            next('error')
                    }
                }, callback)
            }


        }


        function selectVimeo(initialResults, callback) {
            async.auto({
                get_vimeo_queries: getVimeoQueries,
                get_vimeo_data_from_remote: ['get_vimeo_queries', getVimeoDataFromRemote]

            }, function (err, results) {
                if (err) {
                    return callback(null);
                }
                callback(null, results.get_vimeo_data_from_remote);
            });


            function getVimeoQueries(callback) {
                d = new Date();
                var allObjects = {};


                var updatedDb = moment(initialResults.data.updated).format('YYYY-MM-DD')
                if (initialResults.data != null) {
                    var updated = initialResults.data.updated

                    if (updated < new Date()) {
                        var currentDate = moment(new Date()).format('YYYY-MM-DD')
                        updated = moment(updated).format('YYYY-MM-DD');
                        if (updated == currentDate) {
                            updated = updatedDb;
                        }
                        else {
                            updated = moment(initialResults.data.updated).add(1, 'days').format('YYYY-MM-DD');
                        }
                        var query = configAuth.vimeoAuth.common + '/' + initialResults.metric.objectTypes[0].meta.endpoint[0] + '/' + initialResults.object.channelObjectId + '/' + initialResults.metric.objectTypes[0].meta.endpoint[1];

                        allObjects = {
                            profile: initialResults.get_profile,
                            query: query,
                            widget: initialResults.metric,
                            dataResult: initialResults.data.data,
                            startDate: updated,
                            endDate: currentDate,
                            metricId: initialResults.metric._id,
                            endpoint: initialResults.metric.objectTypes[0].meta.endpoint,
                            metricCode: initialResults.metric.code
                        }
                        callback(null, allObjects);
                    }
                    else
                        callback(null, 'DataFromDb');
                }


            }


            function getVimeoDataFromRemote(allObjects, callback) {
                var actualFinalApiData = {};


                if (allObjects.get_vimeo_queries == 'DataFromDb') {
                    actualFinalApiData = {
                        apiResponse: 'DataFromDb',
                        queryResults: initialResults,
                        channelId: initialResults.metric.channelId
                    }
                    callback(null, actualFinalApiData);
                }
                else {
                    callVimeoApiForMetrics(allObjects.get_vimeo_queries, callback);

                }

            }


            function callVimeoApiForMetrics(result, callback) {

                //Set access token for hitting api access - dev
                var storeMetric;
                var tot_metric = [];
                var page = 1
                var actualFinalApiData = [];

                var access_token = initialResults.profile.accessToken;
                request(result.query + '?access_token=' + access_token + '&page=' + page, function (err, results, body) {

                        var parsedData = JSON.parse(body);
                        if (results.statusCode != 200) return callback(null)
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
                                var finalDate = moment(storeStartDate).format('YYYY-MM-DD');
                                tot_metric.push({date: finalDate, total: storeMetric});
                                storeStartDate.setDate(storeStartDate.getDate() + 1);

                                /* if (result.endDate === tot_metric[i].date) {
                                 tot_metric[i] = {
                                 total: storeMetric,
                                 date: result.endDate
                                 };
                                 }*/
                            }
                        }
                        actualFinalApiData = {
                            apiResponse: tot_metric,
                            metricId: result.metricId,
                            queryResults: initialResults,
                            channelId: initialResults.metric.channelId
                        }
                        callback(null, actualFinalApiData);

                    }
                )


            }
        }

        function getTweetData(results, callback) {
            async.auto({
                get_tweet_queries: getTweetQueries,
                get_tweet_data_from_remote: ['get_tweet_queries', getTweetDataFromRemote]

            }, function (err, results) {
                if (err)
                    return callback(null);
                callback(null, results.get_tweet_data_from_remote);
            });

            function getTweetQueries(callback) {

                var queries = {};
                var query = results.metric.objectTypes[0].meta.TweetMetricName;
                var metricType = results.metric.code;
                if (results.data != null) {
                    var updated = results.data.updated;
                    var currentDate = new Date();
                    if (updated > currentDate) {
                        queries = {
                            inputs: 'DataFromDb',
                            query: '',
                            metricId: results.metric._id,
                            channelId: results.metric.channelId,
                            metricCode: metricType
                        };
                        callback(null, queries);
                    }
                    else if (results.data.updated < new Date())
                        setTweetQuery();

                    else {
                        queries = {
                            inputs: 'DataFromDb',
                            query: '',
                            metricId: results.metric._id,
                            channelId: results.metric.channelId,
                            metricCode: metricType
                        };
                        callback(null, queries);
                    }
                }
                else
                    setTweetQuery();
                function setTweetQuery() {

                    if (metricType === configAuth.twitterMetric.keywordMentions)
                        var inputs = {q: '%23' + results.profile.name, count: count};

                    else if (metricType === configAuth.twitterMetric.mentions)
                        var inputs = {screen_name: results.profile.name, count: 200};
                    else
                        var inputs = {screen_name: results.profile.name, count: 200};

                    queries = {
                        inputs: inputs,
                        query: query,
                        metricId: results.metric._id,
                        channelId: results.metric.channelId,
                        metricCode: metricType
                    };
                    callback(null, queries);
                }

            }

            //To get tweet data from tweet api
            function getTweetDataFromRemote(queries, callback) {
                var wholeTweetObjects = [];
                var finalTwitterResponse = [];
                if (queries.get_tweet_queries.inputs === 'DataFromDb') {
                    finalTwitterResponse = {
                        data: 'DataFromDb',
                        metricId: queries.get_tweet_queries.metricId,
                        channelId: queries.get_tweet_queries.channelId,
                        queryResults: results
                    }
                    callback(null, finalTwitterResponse);
                }

                else {
                    var finalTwitterResponse = {}
                    callTwitterApi(queries, wholeTweetObjects, function (err, response) {
                        if (err) {
                            finalTwitterResponse = {
                                data: 'DataFromDb',
                                metricId: queries.get_tweet_queries.metricId,
                                channelId: queries.get_tweet_queries.channelId,
                                queryResults: results
                            }
                           return  callback(null, response);
                        }
                        else {
                            callback(null, response);
                        }
                    });
                }


                // }, callback)
            }

            function callTwitterApi(queries, wholeTweetObjects, callback) {
                var finalTwitterResponse = {};
                var finalHighEngagedTweets = [];
                var query = queries.get_tweet_queries.query;
                var inputs = queries.get_tweet_queries.inputs;
                var highEngagedTweetsCount = [];
                var sortedTweetsArray = [];
                var storeTweetDate;
                var storeDefaultValues = [];
                client.get(query, inputs, function (error, tweets, response) {
                    if (error || tweets.length === 0) {
                        finalTwitterResponse = {
                            data: 'DataFromDb',
                            metricId: queries.get_tweet_queries.metricId,
                            channelId: queries.get_tweet_queries.channelId,
                            queryResults: results
                        };
                      return  callback(null, response);
                    }
                    else {
                        if (queries.get_tweet_queries.metricCode === configAuth.twitterMetric.tweets || queries.get_tweet_queries.metricCode === configAuth.twitterMetric.followers || queries.get_tweet_queries.metricCode === configAuth.twitterMetric.following || queries.get_tweet_queries.metricCode === configAuth.twitterMetric.favourites || queries.get_tweet_queries.metricCode === configAuth.twitterMetric.listed || queries.get_tweet_queries.metricCode === configAuth.twitterMetric.retweets_of_your_tweets) {

                            finalTwitterResponse = {
                                data: tweets,
                                metricId: queries.get_tweet_queries.metricId,
                                channelId: queries.get_tweet_queries.channelId,
                                queryResults: results
                            };
                            callback(null, finalTwitterResponse);
                        }
                        else {
                            var lastCreatedAt = moment(new Date(Date.parse(tweets[tweets.length - 1].created_at.replace(/( +)/, ' UTC$1')))).format('YYYY-MM-DD');
                            var maxId = tweets[tweets.length - 1].id;
                            if (lastCreatedAt >= req.body.startDate) {
                                tweets.forEach(function (value, index) {
                                    storeTweetDate = moment(new Date(Date.parse(value.created_at.replace(/( +)/, ' UTC$1')))).format('YYYY-MM-DD');
                                    wholeTweetObjects.push({total: value, date: storeTweetDate});
                                });

                                queries.get_tweet_queries.inputs = {
                                    screen_name: queries.get_tweet_queries.inputs.screen_name,
                                    count: queries.get_tweet_queries.inputs.count,
                                    max_id: maxId
                                };
                                callTwitterApi(queries, wholeTweetObjects, callback);
                            }
                            else {
                                tweets.forEach(function (value) {
                                    storeTweetDate = moment(new Date(Date.parse(value.created_at.replace(/( +)/, ' UTC$1')))).format('YYYY-MM-DD');
                                    wholeTweetObjects.push({total: value, date: storeTweetDate});

                                });
                                var storeStartDate = new Date(req.body.startDate);
                                var storeEndDate = new Date(req.body.endDate);
                                var timeDiff = Math.abs(storeEndDate.getTime() - storeStartDate.getTime());
                                var diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24));
                                for (var i = 0; i < diffDays; i++) {
                                    var finalDate = moment(storeStartDate).format('YYYY-MM-DD');
                                    storeDefaultValues.push({
                                        date: finalDate,
                                        total: {retweet_count: 0, favorite_count: 0}
                                    });
                                    storeStartDate.setDate(storeStartDate.getDate() + 1);
                                }

                                //To replace the missing dates in whole data with empty values
                                var validData = wholeTweetObjects.length;
                                for (var m = 0; m < validData; m++) {
                                    for (var k = 0; k < storeDefaultValues.length; k++) {
                                        if (wholeTweetObjects[m].date === storeDefaultValues[k].date)
                                            storeDefaultValues[k] = wholeTweetObjects[m];
                                    }

                                }

                                //find sum
                                storeDefaultValues.forEach(function (value, index) {
                                    var count = value.total.retweet_count + value.total.favorite_count;
                                    highEngagedTweetsCount.push({count: count, date: value.date, total: value.total})
                                });
                                sortedTweetsArray = _.sortBy(highEngagedTweetsCount, ['count']);
                                for (var index = 1; index <= 20; index++) {
                                    finalHighEngagedTweets.push(sortedTweetsArray[sortedTweetsArray.length - index]);
                                }
                                finalTwitterResponse = {
                                    data: finalHighEngagedTweets,
                                    metricId: queries.get_tweet_queries.metricId,
                                    channelId: queries.get_tweet_queries.channelId,
                                    queryResults: results
                                };
                                callback(null, finalTwitterResponse);
                            }
                        }
                    }
                })
            }
        }

        function selectInstagram(initialResults, callback) {
            async.auto({
                get_instagram_queries: getInstagramQueries,
                get_instagram_data_from_remote: ['get_instagram_queries', getInstagramDataFromRemote]

            }, function (err, results) {
                if (err) {
                    return callback(null);
                }
                callback(null, results.get_instagram_data_from_remote);
            });

            function getInstagramQueries(callback) {
                d = new Date();
                var allObjects = {};
                if (initialResults.data != null) {
                    var updatedDb = moment(initialResults.data.updated).format('YYYY-MM-DD')

                    if (initialResults.data.updated < new Date()) {
                        var updated = moment(initialResults.data.updated).format('YYYY-MM-DD');
                        var currentDate = moment(new Date()).format('YYYY-MM-DD');
                        if (updated != currentDate) {
                            var updated = initialResults.data.updated;
                            var oneDay = 24 * 60 * 60 * 1000; // hours*minutes*seconds*milliseconds
                            updated.setTime(updated.getTime() + oneDay);
                            updated = moment(updated).format('YYYY-MM-DD');
                        }
                        var query = initialResults.metric.objectTypes[0].meta.igMetricName;
                        allObjects = {
                            profile: initialResults.profile,
                            query: query,
                            widget: initialResults.metric,
                            dataResult: initialResults.data.data,
                            startDate: updated,
                            endDate: currentDate,
                            metricCode: initialResults.metric.code,
                            metricId: initialResults.metric._id,
                            endpoint: initialResults.metric.objectTypes[0].meta.endpoint
                        };
                        callback(null, allObjects);
                    }
                    else
                        callback(null, 'DataFromDb');
                }

            }

            function getInstagramDataFromRemote(allObjects, callback) {
                var actualFinalApiData = {};
                if (allObjects.get_instagram_queries === 'DataFromDb') {
                    actualFinalApiData = {
                        apiResponse: 'DataFromDb',
                        queryResults: initialResults,
                        channelId: initialResults.metric.channelId
                    };
                    callback(null, actualFinalApiData);
                }
                else {
                    if (allObjects.get_instagram_queries == 'DataFromDb') {
                        actualFinalApiData = {
                            apiResponse: 'DataFromDb',
                            queryResults: initialResults,
                            channelId: initialResults.metric.channelId
                        };
                        callback(null, actualFinalApiData);
                    }
                    else
                        callInstagramApiForMetrics(allObjects.get_instagram_queries, callback);
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
                if (result.query === 'user') {
                    ig.user(result.profile.userId, function (err, results, remaining, limit) {
                        if (err) {
                            actualFinalApiData = {
                                apiResponse: tot_metric,
                                metricId: result.metricId,
                                queryResults: initialResults,
                                channelId: initialResults.metric.channelId
                            };
                            return callback(null, actualFinalApiData);
                        }
                        else {
                            var endPointMetric = {};
                            endPointMetric = {items: result.endpoint};
                            var storeStartDate = new Date(result.startDate);
                            var storeEndDate = new Date(result.endDate);
                            var timeDiff = Math.abs(storeEndDate.getTime() - storeStartDate.getTime());
                            var diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24)); //adding plus one so that today also included
                            if (endPointMetric.items[0].indexOf("/") > -1)
                                endPointMetric = endPointMetric.items[0].split("/");
                            var count = endPointMetric[0];
                            var item = endPointMetric[1];
                            var temp = results[count];
                            storeMetric = temp[item];
                            for (var i = 0; i <= diffDays; i++) {
                                var finalDate = moment(storeStartDate).format('YYYY-MM-DD');
                                if (finalDate <= moment(storeStartDate).format('YYYY-MM-DD')) {
                                    tot_metric.push({date: finalDate, total: storeMetric});
                                    storeStartDate.setDate(storeStartDate.getDate() + 1);
                                }
                            }
                            actualFinalApiData = {
                                apiResponse: tot_metric,
                                metricId: result.metricId,
                                queryResults: initialResults,
                                channelId: initialResults.metric.channelId
                            };
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
                                        var like = 'likes';
                                        var count = 'count';
                                        var comments = 'comments';
                                        var tempLikes = 0;
                                        var tempComments = 0;
                                        for (var j = 0; j < uniqueDate[key].length; j++) {
                                            var date = uniqueDate[key][j].date;
                                            tempLikes += uniqueDate[key][j].total[like][count];
                                            tempComments += uniqueDate[key][j].total[comments][count];
                                        }
                                        if (result.metricCode === 'likes') {
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
                                        var finalDate = moment(storeStartDate).format('YYYY-MM-DD');
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
                                        channelId: initialResults.metric.channelId
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
                                        var dateString = moment(storeDate).format("YYYY-MM-DD");
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
                                        channelId: initialResults.metric.channelId
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

        //Function to get facebook data
        function getFBPageData(initialResults, callback) {
            graph.setAccessToken(initialResults.profile.accessToken);
            async.auto({
                get_start_end_dates: getDates,
                get_object_list: ['get_start_end_dates', passQueryToGraphApi]
            }, function (err, results) {
                if (err) {
                    return callback(null);
                }
                callback(null, results.get_object_list[0]);
            });

            //To get the start date ,end date required for query
            function getDates(callback) {
                var d = new Date();
                var queryObject = {};

                //check already there is one year data in db
                if (initialResults.data != null) {
                    d.setDate(d.getDate());
                    if (initialResults.data.updated < new Date()) {
                        var endDate = initialResults.data.updated;
                        if (moment(endDate).format('YYYY-MM-DD') == moment(new Date()).format('YYYY-MM-DD')) endDate.setDate(endDate.getDate());
                        else
                            endDate.setDate(endDate.getDate() + 1);
                        var updated = moment(endDate).format('YYYY-MM-DD');
                        d.setDate(d.getDate() + 1);
                        var now = moment(d).format('YYYY-MM-DD');
                        var query = initialResults.object.channelObjectId + "/insights/" + initialResults.metric.objectTypes[0].meta.fbMetricName + "?since=" + updated + "&until=" + now;
                        queryObject = {
                            query: query, metricId: initialResults.metric._id, metric: initialResults.metric,
                            startDate: updated,
                            endDate: now
                        };
                        callback(null, queryObject);
                    }
                    else {
                        var endDate = initialResults.data.updated;
                        endDate.setDate(endDate.getDate() + 1);
                        var updated = moment(endDate).format('YYYY-MM-DD');
                        d.setDate(d.getDate());
                        var now = moment(d).format('YYYY-MM-DD');
                        queryObject = {
                            query: 'DataFromDb', metricId: initialResults.metric._id, metric: initialResults.metric,
                            startDate: updated,
                            endDate: now
                        };
                        callback(null, queryObject);
                    }
                }
            }

            //To pass the query to graph api
            function passQueryToGraphApi(query, callback) {
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
                        channelId: initialResults.metric.channelId,
                        startDate: query.startDate,
                        endDate: query.endDate,
                        metric: initialResults.metric
                    };
                    callback(null, queryResponse);
                }
                else {
                    graph.get(query.query, function (err, fbQueryRes) {
                        if (err) return callback(null)

                        else {
                            queryResponse = {
                                res: fbQueryRes,
                                metricId: query.metricId,
                                queryResults: initialResults,
                                channelId: initialResults.metric.channelId,
                                metric: initialResults.metric,
                                startDate: query.startDate,
                                endDate: query.endDate,
                            };
                            callback('', queryResponse);
                        }
                    })
                }
            }
        }

        //To get FacebookAds Insights Data
        function getFBadsinsightsData(initialResults, callback) {
            async.auto({
                call_fb_ads_data: callFetchFBadsData,
                get_fb_ads_data_from_remote: ['call_fb_ads_data', fetchFBadsData],
            }, function (err, results) {
                if (err) {
                    return callback(null);
                }
                callback(null, results.get_fb_ads_data_from_remote[0]);
            });
            function callFetchFBadsData(callback) {
                var adAccountId = initialResults.object.channelObjectId;
                d = new Date();
                var allObjects = {};
                if (initialResults.data.data != null) {

                    if (initialResults.data.updated < new Date()) {
                        var updated = initialResults.data.updated;
                        if (moment(updated).format('YYYY-MM-DD') === moment(new Date).format('YYYY-MM-DD'))
                            updated.setDate(updated.getDate());
                        else
                            updated.setDate(updated.getDate() + 1);
                        updated = moment(updated).format('YYYY-MM-DD');
                        var currentDate = moment(new Date()).format('YYYY-MM-DD');
                        d.setDate(d.getDate() + 1);
                        var startDate = moment(d).format('YYYY-MM-DD');
                        var query = configAuth.apiVersions.FBADs + "/" + adAccountId + "/insights?limit=365&time_increment=1&fields=" + initialResults.metric.objectTypes[0].meta.fbAdsMetricName + '&time_range[since]=' + updated + '&time_range[until]=' + startDate;
                        allObjects = {
                            profile: initialResults.profile,
                            query: query,
                            widget: initialResults.metric,
                            dataResult: initialResults.data.data,
                            startDate: updated,
                            endDate: currentDate,
                            metricId: initialResults.metric._id,
                            metricName: initialResults.metric.objectTypes[0].meta.fbAdsMetricName
                        };
                        callback(null, [allObjects]);
                    }
                    else {
                        var updated = initialResults.data.updated;
                        updated.setDate(updated.getDate() + 1);
                        updated = moment(updated).format('YYYY-MM-DD');
                        var currentDate = moment(new Date()).format('YYYY-MM-DD');
                        d.setDate(d.getDate() + 1);
                        var startDate = moment(d).format('YYYY-MM-DD');
                        allObjects = {
                            profile: initialResults.profile,
                            query: query,
                            widget: initialResults.metric,
                            dataResult: 'DataFromDb',
                            startDate: updated,
                            endDate: currentDate,
                            metricId: initialResults.metric._id,
                            channelId: initialResults.metric.channelId,
                            metricName: initialResults.metric.objectTypes[0].meta.fbAdsMetricName
                        };
                        callback(null, allObjects);
                    }
                }
            }


            function fetchFBadsData(allObjects, callback) {
                var entireObjects = [];
                if (allObjects.call_fb_ads_data.dataResult === 'DataFromDb') {
                    entireObjects.push({
                        profile: initialResults.profile,
                        query: '',
                        widget: initialResults.metric,
                        data: 'DataFromDb',
                        startDate: '',
                        endDate: '',
                        metricId: allObjects.call_fb_ads_data.metricId,
                        channelId: allObjects.call_fb_ads_data.channelId
                    });
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
                    };
                    callback(null, queryResponse);
                }

                else {
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
                            if (apiResult.error) callback(null)
                            else {
                                var wholeData = [];
                                var storeMetricName = results.metricName;
                                var storeStartDate = new Date(results.startDate);
                                var storeEndDate = new Date(results.endDate);
                                var timeDiff = Math.abs(storeEndDate.getTime() - storeStartDate.getTime());


                                //controlled pagination Data
                                if (apiResult.data.length != 0) {
                                    if (results.widget.objectTypes[0].meta.endpoint.length)
                                        var storeDefaultValues = findDaysDifference(storeStartDate, storeEndDate, results.metric.objectTypes[0].endpoint);
                                    else {
                                        if (results.widget.objectTypes[0].meta.responseType === 'object')
                                            var storeDefaultValues = findDaysDifference(storeStartDate, storeEndDate, undefined, 'noEndPoint');
                                        else var storeDefaultValues = findDaysDifference(storeStartDate, storeEndDate, undefined);
                                    }
                                    if (apiResult.paging && apiResult.paging.next) {
                                        for (var key in apiResult.data)
                                            tot_metric.push({
                                                total: apiResult.data[key][storeMetricName],
                                                date: apiResult.data[key].date_start
                                            });
                                        var nextPage = apiResult.paging.next;
                                        var str = nextPage;
                                        var recallApi = str.replace("https://graph.facebook.com/", " ").trim();
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
                                            if (storeDefaultValues.length) {
                                                for (var k = 0; k < storeDefaultValues.length; k++) {
                                                    if (wholeData[j].date === storeDefaultValues[k].date)
                                                        storeDefaultValues[k].total = wholeData[j].total;
                                                }
                                            }
                                            else storeDefaultValues = wholeData;

                                        }
                                    }
                                }
                                else {
                                    if (results.widget.objectTypes[0].meta.endpoint.length) {
                                        if (results.startDate === results.endDate) {
                                            var totalObject = {};
                                            var storeDefaultValues = [];
                                            for (var j = 0; j < endPoint.length; j++) {
                                                totalObject[endPoint[j]] = 0;
                                            }
                                            storeDefaultValues.push({date: results.startDate, total: totalObject});
                                        }

                                        else var storeDefaultValues = findDaysDifference(storeStartDate, storeEndDate, results.metric.objectTypes[0].endpoint);
                                    }
                                    else {
                                        if (results.widget.objectTypes[0].responseType === 'object') {
                                            if (results.startDate === results.endDate) {
                                                storeDefaultValues.push({
                                                    date: results.startDate,
                                                    total: {}
                                                })
                                            }
                                            else
                                                var storeDefaultValues = findDaysDifference(storeStartDate, storeEndDate, undefined, 'noEndPoint');
                                        }
                                        else {
                                            if (results.startDate === results.endDate) {
                                                var storeDefaultValues = [];
                                                storeDefaultValues.push({
                                                    date: results.startDate,
                                                    total: 0
                                                })
                                            }
                                            else
                                                var storeDefaultValues = findDaysDifference(storeStartDate, storeEndDate, undefined);
                                        }
                                    }
                                }
                            }
                            finalData = {
                                metricId: metricId,
                                data: storeDefaultValues
                            };
                            queryResponse = {
                                data: storeDefaultValues,
                                metricId: metricId,
                                queryResults: initialResults,
                                channelId: initialResults.metric.channelId
                            };
                            callback(null, queryResponse);
                        })
                    }
                }
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
                if (err) return callback(null);
                allDataObject = {
                    data: results.call_get_analytic_data,
                    results: results,
                    queryResults: results.call_get_analytic_data.queryResults,
                    channelId: results.call_get_analytic_data.channelId
                };
                callback(null, allDataObject);
            });

            function getDimension(callback) {
                var dimension;
                var dimensionArray = [];
                var dimensionList = [];
                dimensionList.push({'name': 'ga:date'});
                dimension = 'ga:date';
                callback(null, dimension);
            }

            function checkDataExist(dimension, callback) {
                var data = results.data;
                var metric = results.metric;
                var object = results.object;
                var profile = results.profile;
                if (results.metric.objectTypes[0].meta.api === configAuth.googleApiTypes.youtubeApi) {
                    //set credentials in OAuth2
                    var oauth2Client = new OAuth2(configAuth.youTubeAuth.clientID, configAuth.youTubeAuth.clientSecret, configAuth.youTubeAuth.callbackURL);
                }
                else var oauth2Client = new OAuth2(configAuth.googleAuth.clientID, configAuth.googleAuth.clientSecret, configAuth.googleAuth.callbackURL);
                oauth2Client.setCredentials({
                    access_token: results.profile.accessToken,
                    refresh_token: results.profile.refreshToken
                });
                oauth2Client.refreshAccessToken(function (err, tokens) {
                    if (err)
                        return callback(null);
                    else {
                        profile.token = tokens.access_token;
                        oauth2Client.setCredentials({
                            access_token: tokens.access_token,
                            refresh_token: tokens.refresh_token
                        });
                        var allObjects = {};
                        var d = new Date();
                        var dimensionArray = [];
                        var dimensionList = metric.objectTypes[0].meta.dimension;
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
                        if (metric.objectTypes[0].meta.api === configAuth.googleApiTypes.mcfApi)
                            var metricName = metric.objectTypes[0].meta.gMcfMetricName;
                        else if (metric.objectTypes[0].meta.api === configAuth.googleApiTypes.youtubeApi)
                            var metricName = metric.objectTypes[0].meta.youtubeMetricName;
                        else
                            var metricName = metric.objectTypes[0].meta.gaMetricName;
                        if (data.data != null) {
                            if (data.updated < new Date()) {
                                var startDate = data.updated;
                                if (moment(startDate).format('YYYY-MM-DD') == moment(new Date()).format('YYYY-MM-DD')) startDate.setDate(startDate.getDate());
                                else
                                    startDate.setDate(startDate.getDate() + 1);
                                startDate = moment(startDate).format('YYYY-MM-DD');
                                var endDate = moment(new Date()).format('YYYY-MM-DD');
                                allObjects = {
                                    oauth2Client: oauth2Client,
                                    object: object,
                                    dimension: dimension,
                                    metricName: metricName,
                                    startDate: startDate,
                                    endDate: endDate,
                                    response: results.response,
                                    data: results.data,
                                    results: results,
                                    metricId: data.metricId,
                                    api: metric.objectTypes[0].meta.api,
                                    metric: metric
                                };
                                callback(null, allObjects);
                            }
                            else {
                                allObjects = {metricId: data.metricId, data: 'DataFromDb', metric: metric}
                                callback(null, allObjects);
                            }
                        }
                    }
                });
            }

            //to get the final google analytic data
            function analyticData(allObjects, callback) {
                allObjects = allObjects.check_data_exist;
                var finalData = {};
                if (allObjects.data === 'DataFromDb') {
                    finalData = {
                        metricId: allObjects.metricId,
                        data: 'DataFromDb',
                        queryResults: results,
                        channelId: results.metric.channelId
                    };
                    callback(null, finalData);
                }
                else {
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
                        var analytics = googleapis.analytics({
                            version: 'v3',
                            auth: allObjects.oauth2Client
                        }).data.mcf.get;
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
                        var analytics = googleapis.analytics({version: 'v3', auth: oauth2Client}).data.ga.get;
                        callGoogleApi(apiQuery);
                    }
                    /**Method to call the google api
                     * @param oauth2Client - set credentials
                     */
                    var googleResult = [];

                    function callGoogleApi(apiQuery) {
                        analytics(apiQuery, function (err, result) {
                            if (err)
                               return callback(null)
                            else {
                                if (result.rows != undefined) {
                                    for (var i = 0; i < result.rows.length; i++) {
                                        googleResult.push(result.rows[i]);
                                    }
                                }
                                else
                                    googleResult = 'No Data';
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
                                        channelId: results.metric.channelId,
                                        startDate: allObjects.startDate,
                                        endDate: allObjects.endDate,
                                        metric: allObjects.metric
                                    };
                                    callback(null, finalData);
                                }
                            }
                        });
                    }
                }
            }
        }

        function selectAdwordsObjectType(initialResults, callback) {
            async.auto({
                call_adword_data: fetchAdwordsQuery,
                get_google_adsword_data_from_remote: ['call_adword_data', fetchGoogleAdwordsData]
            }, function (err, results) {
                if (err)
                    return callback(null);
                else
                    return callback(null, results.get_google_adsword_data_from_remote);
            });
            function fetchAdwordsQuery(callback) {
                var adAccountId = initialResults.object.channelObjectId
                d = new Date();
                var allObjects = {};
                if (initialResults.data != null) {
                    var updated = initialResults.data.updated;
                    var startDate = moment(new Date()).format('YYYY-MM-DD');
                    var newEndDate = startDate.replace(/-/g, "");
                    startDate = newEndDate;
                    if (initialResults.data.updated < new Date()) {
                       var updated=moment(updated).format('YYYY-MM-DD');
                        var currentDate=moment(new Date()).format('YYYY-MM-DD');
                        if(updated!=currentDate) {
                            var updated = initialResults.data.updated;
                            var oneDay = 24 * 60 * 60 * 1000; // hours*minutes*seconds*milliseconds
                            updated.setTime(updated.getTime() + oneDay);
                            updated = moment(updated).format('YYYY-MM-DD');
                            var newStartDate = updated.replace(/-/g, "");
                            updated = newStartDate;
                        }
                        else{
                            var newStartDate = updated.replace(/-/g, "");
                            updated = newStartDate;
                        }

                        if(configAuth.objectType.googleAdwordAdGrouptypeId == String(initialResults.object.objectTypeId)){
                            var query ='AdGroupId,' +'Date,' + initialResults.metric.objectTypes[0].meta.gAdsMetricName;
                            var performance='ADGROUP_PERFORMANCE_REPORT';
                            var clientId=initialResults.object. meta.accountId;
                            var objects="AdGroupId="+initialResults.object.channelObjectId;
                        }
                        else if(configAuth.objectType.googleAdwordCampaigntypeId == String(initialResults.object.objectTypeId)){
                            var query ='CampaignId,' +'Date,' + initialResults.metric.objectTypes[0].meta.gAdsMetricName;
                            var performance='CAMPAIGN_PERFORMANCE_REPORT';
                            var clientId=initialResults.object. meta.accountId;
                            var objects="CampaignId="+initialResults.object.channelObjectId;
                        }
                        else if(configAuth.objectType.googleAdwordsAdtypeId == String(initialResults.object.objectTypeId)){
                            var query = 'Id,'+'Date,' + initialResults.metric.objectTypes[0].meta.gAdsMetricName;
                            var performance='AD_PERFORMANCE_REPORT';
                            var clientId=initialResults.object.meta.accountId;
                            var objects="Id="+initialResults.object.channelObjectId;
                        }
                        else{
                            var query = 'Date,' + initialResults.metric.objectTypes[0].meta.gAdsMetricName;
                            var performance='ACCOUNT_PERFORMANCE_REPORT';
                            var clientId=initialResults.object.channelObjectId;
                            var objects=""
                        }
                        allObjects = {
                            profile: initialResults.profile,
                            query: query,
                            widget: initialResults.metric,
                            dataResult: initialResults.data,
                            startDate: updated,
                            objects: objects,
                            endDate: startDate,
                            metricId:initialResults.metric._id,
                            metricCode: initialResults.metric.code,
                            clientId: clientId,
                            performance: performance
                        }

                        callback(null, allObjects);
                    }
                    else
                        callback(null, 'DataFromDb');
                }

            }

            // This Function executed to get insights data like(impression,clicks)
            function fetchGoogleAdwordsData(allObjects, callback) {
                var count = 0;
                var actualFinalApiData = {};
                if (allObjects.call_adword_data == 'DataFromDb') {
                        actualFinalApiData = {
                            apiResponse: 'DataFromDb',
                            queryResults: initialResults,
                            channelId: initialResults.metric.channelId
                        };
                        callback(null, actualFinalApiData);
                    }
                    else {
                        getAdwordsDataForEachMetric(allObjects.call_adword_data, callback);
                    }

            }

            function getAdwordsDataForEachMetric(results, callback) {
                semaphore.take(function () {
                    var errorCount = 0;
                    var during = results.startDate + ',' + results.endDate;
                    googleAds.use({
                        clientID: configAuth.googleAdwordsAuth.clientID,
                        clientSecret: configAuth.googleAdwordsAuth.clientSecret,
                        developerToken: configAuth.googleAdwordsAuth.developerToken
                    });
                    googleAds.use({
                        accessToken: results.profile.accessToken,
                        //tokenExpires: 1424716834341, // Integer: Unix Timestamp of expiration time
                        refreshToken: results.profile.refreshToken,
                        clientCustomerID: results.clientId

                    });
                    googleAds.awql({
                            select: results.query,
                            from: results.performance,
                            where: results.objects,
                            during: during
                        })
                        .send().then(function (response) {
                            storeAdwordsFinalData(results, response.data);
                            semaphore.leave();
                        })
                        .catch(function (error) {
                            semaphore.leave();
                            callback(null);
                        });
                });

                //To store the final result in db
                function storeAdwordsFinalData(results, data) {
                    var actualFinalApiData = {};
                    if (data.error) {
                       callback(null);
                    }

                    //Array to hold the final result
                    var param = [];
                    if (results.metricCode === configAuth.googleAdwordsMetric.clicks)
                        param.push('clicks');
                    else if (results.metricCode === configAuth.googleAdwordsMetric.cost)
                        param.push('cost');
                    else if (results.metricCode === configAuth.googleAdwordsMetric.conversionRate)
                        param.push('conv. rate');
                    else if (results.metricCode === configAuth.googleAdwordsMetric.conversions)
                        param.push('conversions');
                    else if (results.metricCode === configAuth.googleAdwordsMetric.impressions)
                        param.push('impressions');
                    else if (results.metricCode === configAuth.googleAdwordsMetric.clickThroughRate)
                        param.push('ctr')
                    else if (results.metricCode === configAuth.googleAdwordsMetric.costPerClick)
                        param.push('avg. cpc');
                    else if (results.metricCode === configAuth.googleAdwordsMetric.costPerThousandImpressions)
                        param.push('avg. cpm');
                    else
                        param.push('cost / conv.');
                    var finalData = [];
                    var totalValue;
                    for (var prop = 0; prop < data.length; prop++) {
                        if (results.metricCode === configAuth.googleAdwordsMetric.costPerConversion || results.metricCode === configAuth.googleAdwordsMetric.costPerClick || results.metricCode === configAuth.googleAdwordsMetric.costPerThousandImpressions || results.metricCode === configAuth.googleAdwordsMetric.cost)
                            totalValue = parseFloat((data[prop][param] / 1000000).toFixed(2));
                        else
                            totalValue = parseFloat(data[prop][param]);
                        var value = {};
                        value = {
                            total: totalValue,
                            date: data[prop].day
                        };
                        finalData.push(value);
                    }

                        actualFinalApiData = {
                            apiResponse: finalData,
                            metricId: results.metricId,
                            queryResults: initialResults,
                            channelId: initialResults.metric.channelId
                        }
                        callback(null, actualFinalApiData);



                }
            }
        }

        function selectMailChimp(initialResults, callback) {
            async.auto({
                get_mailChimp_queries: getMailChimpQueries,
                get_mailChimp_data_from_remote: ['get_mailChimp_queries', getMailChimpDataFromRemote]

            }, function (err, results) {
                if (err) {
                    return callback(null);
                }
                callback(null, results.get_mailChimp_data_from_remote);
            });

            function getMailChimpQueries(callback) {
                d = new Date();
                var allObjects = {};
                if (initialResults.data != null) {
                    var updatedDb = moment(initialResults.data.updated).format('YYYY-MM-DD')
                    var updated = initialResults.data.updated;
                    var currentDate = moment(new Date()).format('YYYY-MM-DD');
                    if (initialResults.data.updated < new Date()) {
                        if (initialResults.metric.objectTypes[0].meta.endpoint[0] === configAuth.mailChimpQueryVariables.lists) {
                            var query = 'https://' + initialResults.profile.dataCenter + configAuth.mailChimpQueryVariables.listQuery + initialResults.object.channelObjectId + '?count=100';
                        }
                        else {
                            var query = 'https://' + initialResults.profile.dataCenter + configAuth.mailChimpQueryVariables.campaignQuery + initialResults.object.channelObjectId + '?count=100';
                        }
                        updated = moment(initialResults.data.updated).format('YYYY-MM-DD');
                        if (updated == currentDate) {
                            updated = updatedDb;
                        }
                        else {
                            updated = moment(initialResults.data.updated).add(1, 'days').format('YYYY-MM-DD');
                        }
                        allObjects = {
                            profile: initialResults.profile,
                            query: query,
                            widget: initialResults.metric,
                            dataResult: initialResults.data.data,
                            startDate: updated,
                            endDate: currentDate,
                            metricId: initialResults.metric._id,
                            metricCode: initialResults.metric.code,
                            endpoint: initialResults.metric.objectTypes[0].meta.endpoint[0]
                        }
                        callback(null, allObjects);
                    }
                    else
                        callback(null, 'DataFromDb');
                }
            }

            function getMailChimpDataFromRemote(allObjects, callback) {
                var actualFinalApiData = {};
                if (allObjects.get_mailChimp_queries === 'DataFromDb') {
                    actualFinalApiData = {
                        apiResponse: 'DataFromDb',
                        queryResults: initialResults,
                        channelId: initialResults.metric.channelId
                    }
                    callback(null, actualFinalApiData);
                }
                else {
                    callMailchimpForMetrics(allObjects.get_mailChimp_queries, callback);
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
                    if (err) callback(null)
                    else {
                        var mailChimpResponse = JSON.parse(body);
                        var storeStartDate = new Date(result.startDate);
                        var storeEndDate = new Date(result.endDate);
                        var timeDiff = Math.abs(storeEndDate.getTime() - storeStartDate.getTime());
                        var diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24)); //adding plus one so that today also included
                        var item = result.widget.objectTypes[0].meta.mailChimpsMetricName;
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
                                var finalDate = moment(storeStartDate).format('YYYY-MM-DD');
                                tot_metric.push({date: finalDate, total: storeMetric});
                                storeStartDate.setDate(storeStartDate.getDate() + 1);
                                /* if (result.endDate === tot_metric[i].date) {
                                 tot_metric[i] = {
                                 total: storeMetric,
                                 date: result.endDate
                                 };
                                 }*/
                            }
                        }
                        actualFinalApiData = {
                            apiResponse: tot_metric,
                            metricId: result.metricId,
                            queryResults: initialResults,
                            channelId: initialResults.metric.channelId
                        }
                        callback(null, actualFinalApiData)
                    }
                });


            }

        }

        function selectAweber(initialResults, callback) {

            async.auto({
                get_aweber_queries: getAweberQueries,
                get_aweber_data_from_remote: ['get_aweber_queries', getAweberDataFromRemote]

            }, function (err, results) {
                if (err) {
                    return callback(null);
                }
                callback(null, results.get_aweber_data_from_remote);
            });

            function getAweberQueries(callback) {
                d = new Date();
                var allObjects = {};
                if (initialResults.data != null) {
                    var updatedDb = moment(initialResults.data.updated).format('YYYY-MM-DD');
                    var updated = initialResults.data.updated;
                    var currentDate = moment(new Date()).format('YYYY-MM-DD');
                    var oneDay = 24 * 60 * 60 * 1000; // hours*minutes*seconds*milliseconds
                    updated.setTime(updated.getTime() + oneDay);
                    updated = moment(updated).format('YYYY-MM-DD');
                    if (initialResults.data.updated < new Date()) {
                        // query for getting subscribers and unsubscribers count in all the lists in a profile

                        if (initialResults.metric.objectTypes[0].meta.endpoint[0] === configAuth.aweberStatic.endPoints.aweberMainList)
                            var query = 'accounts/' + initialResults.profile.userId + '/lists/' + initialResults.object.channelObjectId;
                        //query for getting open rate & click rates in listwise

                        else if (initialResults.metric.objectTypes[0].meta.endpoint[0] === configAuth.aweberStatic.endPoints.aweberList)
                            var query = 'accounts/' + initialResults.profile.userId + '/lists/' + initialResults.object.channelObjectId + '/campaigns';

                        //query for getting open rate & click rates in campaignwise


                        else if (initialResults.metric.objectTypes[0].meta.endpoint[0] === configAuth.aweberStatic.endPoints.aweberCampaigns)
                            var query = 'accounts/' + initialResults.profile.userId + '/lists/' + initialResults.object.meta.listId + '/campaigns/' + initialResults.object.meta.campaignType + initialResults.object.channelObjectId;


                        allObjects = {
                            profile: initialResults.profile,
                            query: query,
                            widget: initialResults.metric,
                            dataResult: initialResults.data.data,
                            startDate: updated,
                            endDate: currentDate,
                            metricId: initialResults.metric._id,
                            metricCode: initialResults.metric.code,
                            endpoint: initialResults.metric.objectTypes[0].meta.endpoint[0]
                        }
                        callback(null, allObjects);
                    }
                    else
                        callback(null, 'DataFromDb');
                }
            }

            function getAweberDataFromRemote(allObjects, callback) {
                var actualFinalApiData = {};
                if (allObjects.get_aweber_queries === 'DataFromDb') {
                    actualFinalApiData = {
                        apiResponse: 'DataFromDb',
                        queryResults: initialResults,
                        channelId: initialResults.metric.channelId
                    }
                    callback(null, actualFinalApiData);
                }
                else {
                    callAweberForMetrics(allObjects.get_aweber_queries, actualFinalApiData, callback);
                }

            };

            function callAweberForMetrics(result, actualFinalApiData, callback) {
                var token = result.profile.accessToken;
                var tokenSecret = result.profile.tokenSecret;
                var query = result.query;

                var apiClient = NA.api(token, tokenSecret);
                apiClient.request('get', query, {}, function (err, response) {
                    if (err) {
                        return callback(null);
                    }
                    else {

                        var storeMetric;
                        var tot_metric = [];
                        var storeStartDate = new Date(result.startDate);
                        var storeEndDate = new Date(result.endDate);
                        var timeDiff = Math.abs(storeEndDate.getTime() - storeStartDate.getTime());

                        var diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24)); //adding plus one so that today also included
                        if (result.metricCode === configAuth.aweberStatic.metricCode.subscribers)
                            storeMetric = response.total_subscribed_subscribers;

                        else if (result.metricCode === configAuth.aweberStatic.metricCode.unSubscribers)
                            storeMetric = response.total_unsubscribed_subscribers;

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
                        else if (result.metricCode === configAuth.aweberStatic.metricCode.open_rateCampaigns)
                            storeMetric = Math.round(response.total_opens / response.total_sent);

                        else if (result.metricCode === configAuth.aweberStatic.metricCode.click_rateCampaigns)
                            storeMetric = Math.round(response.total_clicks / response.total_sent);

                        else if (result.metricCode === configAuth.aweberStatic.metricCode.total_opensCampaigns)
                            storeMetric = response.total_opens;

                        else if (result.metricCode === configAuth.aweberStatic.metricCode.total_clicksCampaigns)
                            storeMetric = response.total_clicks;

                        else if (result.metricCode === configAuth.aweberStatic.metricCode.total_sentCampaigns)
                            storeMetric = response.total_sent;


                        for (var i = 0; i <= diffDays; i++) {
                            var finalDate = moment(storeStartDate).format('YYYY-MM-DD');
                            tot_metric.push({date: finalDate, total: storeMetric});
                            storeStartDate.setDate(storeStartDate.getDate() + 1);

                            /* if (result.endDate === tot_metric[i].date) {
                             tot_metric[i] = {
                             total: storeMetric,
                             date: result.endDate
                             };
                             }*/
                        }


                        actualFinalApiData = {
                            apiResponse: tot_metric,
                            metricId: result.metricId,
                            queryResults: initialResults,
                            channelId: initialResults.metric.channelId
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
                if (err) return callback(null);
                callback(null, results.get_linkedIn_data_from_remote);
            });

            function getLinkedInQueries(callback) {
                var channelObjectId = initialResults.object.channelObjectId;
                d = new Date();
                var allObjects = {};
                if (initialResults.data != null) {
                    var updatedDb = initialResults.data.updated;
                    var updated = initialResults.data.updated;
                    var currentDate = new Date();

                    if (updatedDb < currentDate) {

                        if (initialResults.metric.objectTypes[0].meta.endpoint[0] === configAuth.linkedInMetrics.endPoints.followers) {
                            updated = moment(initialResults.data.updated).format('YYYY-MM-DD');
                            currentDate = moment(currentDate).format('YYYY-MM-DD');
                            if (updated == currentDate) {
                                updated = moment(initialResults.data.updated).format('YYYY-MM-DD');
                            }
                            else {
                                updated = moment(initialResults.data.updated).add(1, 'days').format('YYYY-MM-DD');
                            }
                            var query = 'https://api.linkedin.com/v1/companies/' + channelObjectId + '/num-followers?oauth2_access_token=' + initialResults.profile.accessToken + '&format=json';
                        }
                        else {
                            if (initialResults.metric.code === configAuth.linkedInMetrics.highestEngagementUpdatesLinkedIn) {
                                var query = 'https://api.linkedin.com/v1/companies/' + channelObjectId + '/updates?oauth2_access_token=' + initialResults.profile.accessToken + '&count=200&format=json';
                            }
                            else {
                                var openDate = moment(updated).format('YYYY-MM-DD');
                                var startDate = +moment(openDate);
                                var closeDate = moment(currentDate).format('YYYY-MM-DD');
                                var oneDay = 24 * 60 * 60 * 1000;
                                var endDate = +moment(closeDate);
                                endDate = (endDate + oneDay);
                                var query = 'https://api.linkedin.com/v1/companies/' + channelObjectId + '/historical-status-update-statistics:(time,like-count,impression-count,share-count,click-count,comment-count)?oauth2_access_token=' + initialResults.profile.accessToken + '&time-granularity=day&start-timestamp=' + startDate + '&end-timestamp=' + endDate + '&format=json';
                            }
                        }

                        allObjects = {
                            profile: initialResults.profile,
                            query: query,
                            widget: initialResults.metric,
                            dataResult: initialResults.data.data,
                            startDate: updated,
                            endDate: currentDate,
                            metricId: initialResults.metric._id,
                            metricMeta: initialResults.metric.objectTypes[0].meta.linkedInMetricName,
                            objectId: channelObjectId,
                            metricCode: initialResults.metric.code,
                            endpoint: initialResults.metric.objectTypes[0].meta
                        }
                        callback(null, allObjects);
                    }
                    else
                        callback(null, 'DataFromDb');
                }

            }

            function getLinkedInDataFromRemote(allObjects, callback) {
                var actualFinalApiData = {};
                if (allObjects.get_linkedIn_queries === 'DataFromDb') {
                    actualFinalApiData = {
                        apiResponse: 'DataFromDb',
                        queryResults: initialResults,
                        channelId: initialResults.metric.channelId
                    }
                    callback(null, actualFinalApiData);
                }
                else {
                    callLinkedInForMetrics(allObjects.get_linkedIn_queries, actualFinalApiData, callback);
                }

            }

            function callLinkedInForMetrics(result, actualFinalApiData, callback) {
                var storeMetric;
                var tot_metric = [];
                var actualMetric = [];
                request(result.query,
                    function (err, response, body) {
                        if (err || response.statusCode != 200) return callback(null);
                        else {
                            storeMetric = JSON.parse(body);
                            if (storeMetric._total == 0) {
                                var storeStartDate = new Date(result.startDate);
                                var storeEndDate = new Date(result.endDate);
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
                                if (result.endpoint.endpoint[0] ==configAuth.linkedInMetrics.endPoints.followers) {
                                    var storeStartDate = new Date(result.startDate);
                                    var storeEndDate = new Date(result.endDate);
                                    var timeDiff = Math.abs(storeEndDate.getTime() - storeStartDate.getTime());
                                    var diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24)); //adding plus one so that today also included
                                    for (var i = 0; i <= diffDays; i++) {
                                        var finalDate = moment(storeStartDate).format('YYYY-MM-DD');
                                        var endDate = moment(result.endDate).format('YYYY-MM-DD');
                                        tot_metric.push({date: finalDate, total: storeMetric});
                                        storeStartDate.setDate(storeStartDate.getDate() + 1);
                                        /*if (endDate === tot_metric[i].date) {
                                         tot_metric[i] = {
                                         total: storeMetric,
                                         date: endDate
                                         };
                                         }*/
                                    }
                                    actualFinalApiData = {
                                        apiResponse: tot_metric,
                                        metricId: result.metricId,
                                        queryResults: initialResults,
                                        channelId: initialResults.metric.channelId
                                    }
                                    callback(null, actualFinalApiData);
                                }
                                else {
                                    if (result.metricCode === configAuth.linkedInMetrics.highestEngagementUpdatesLinkedIn) {
                                        var loopCount = 0;
                                        for (var i = 0; i < storeMetric.values.length; i++) {
                                            loopCount++;
                                            var openDate = result.startDate;
                                            var startDate = +moment(openDate);
                                            var closeDate = result.endDate;
                                            var endDate = +moment(closeDate);
                                            var updateKey = storeMetric.values[i].updateKey;
                                            var dataDate = storeMetric.values[i].timestamp;
                                            if (dataDate >= startDate && dataDate <= endDate) {
                                                tot_metric.push(storeMetric.values[i]);
                                            }


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
                                                channelId: initialResults.metric.channelId
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
                                            channelId: initialResults.metric.channelId
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
                                    if (err) return callback(null)
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
                                                channelId: initialResults.metric.channelId
                                            }
                                            callback(null, actualFinalApiData);

                                        }


                                    }


                                });

                        }
                    });

            }
        }

        function getMozData(results, callback) {
            async.auto({
                get_moz_queries: getMozQueries,
                get_moz_data_from_remote: ['get_moz_queries', getMozDataFromRemote]

            }, function (err, results) {
                if (err) return callback(null);
                callback(null, results.get_moz_data_from_remote);
            });
            //creating queries for moz
            function getMozQueries(callback) {
                var queries = {};
                var metricType = results.metric.code;
                if (results.data != null) {
                    var updated = moment(results.data.updated);
                    var endDate = moment(new Date);
                    if (updated < endDate) {
                        updated = moment(updated).format("YYYY-MM-DD");
                        endDate = moment(endDate).format("YYYY-MM-DD");
                        if (updated == endDate) {
                            updated = updated;
                        }
                        else {
                            updated = moment(results.data.updated).add(1, "days").format("YYYY-MM-DD");
                        }

                        var query = moz.newQuery('url-metrics')
                            .target(results.object.name)
                            .cols([results.metric.code]);
                        queries = {
                            query: query,
                            metricId: results.metric._id,
                            channelId: results.metric.channelId,
                            metricCode: metricType,
                            startDate: updated,
                            endDate: endDate,
                        };
                        callback(null, queries);
                    }
                    else {
                        queries = {
                            data: 'DataFromDb',
                            query: '',
                            metricId: results.metric._id,
                            channelId: results.metric.channelId,
                            metricCode: metricType
                        };
                        callback(null, queries);
                    }

                }
            }

            function getMozDataFromRemote(queries, callback) {
                var finalMozResponse = [];
                if (queries.get_moz_queries.data === 'DataFromDb') {
                    finalMozResponse = {
                        data: 'DataFromDb',
                        metricId: queries.get_moz_queries.metricId,
                        channelId: queries.get_moz_queries.channelId,
                        queryResults: results
                    }
                    callback(null, finalMozResponse)
                }
                else {
                    callMozApi(queries, function (err, response) {
                        if (err)
                            callback(null)
                        else {
                            callback(null, response);
                        }
                    });
                }

            }

            //getting data for moz from api
            function callMozApi(queries, callback) {
                var query = queries.get_moz_queries.query;
                moz.send(query, function (err, result) {
                    if (err) {
                        callback(null)
                    }
                    else {
                        var storeMetric = [];
                        var finalMozResponse;
                        if (queries.get_moz_queries.metricCode === configAuth.mozStatic.rank)
                            storeMetric.push({date: queries.get_moz_queries.endDate, total: result.umrp});
                        else if (queries.get_moz_queries.metricCode === configAuth.mozStatic.links)
                            storeMetric.push({date: queries.get_moz_queries.endDate, total: result.uid});
                        else if (queries.get_moz_queries.metricCode === configAuth.mozStatic.page_authority)
                            storeMetric.push({date: queries.get_moz_queries.endDate, total: result.upa});
                        else if (queries.get_moz_queries.metricCode === configAuth.mozStatic.domain_authority)
                            storeMetric.push({date: queries.get_moz_queries.endDate, total: result.pda});
                        else
                            storeMetric.push({date: queries.get_moz_queries.endDate, total: result.ueid});

                        finalMozResponse = {
                            metricId: queries.get_moz_queries.metricId,
                            data: storeMetric,
                            queryResults: results,
                            channelId: queries.get_moz_queries.channelId,
                            startDate: queries.get_moz_queries.startDate,
                            endDate: queries.get_moz_queries.endDate
                        };
                        callback(null, finalMozResponse);
                    }
                });
            }

        }

        function selectPinterest(initialResults, callback) {
            async.auto({
                get_pinterest_queries: getPinterestQueries,
                get_pinterest_data_from_remote: ['get_pinterest_queries', getPinterestDataFromRemote]

            }, function (err, results) {
                if (err) return callback(null);
                callback(null, results.get_pinterest_data_from_remote);
            });

            function getPinterestQueries(callback) {
                var adAccountId = initialResults.object.channelObjectId;
                d = new Date();
                var allObjects = {};
                if (initialResults.data != null) {
                    var updatedDb = moment(initialResults.data.updated).format('YYYY-MM-DD')
                    var updated = initialResults.data.updated;
                    var currentDate = moment(new Date()).format('YYYY-MM-DD');
                    updated = moment(updated).format('YYYY-MM-DD');
                    if (initialResults.data.updated < new Date()) {
                        if (updated == currentDate) {
                            updated = updatedDb;
                        }
                        else {
                            updated = moment(initialResults.data.updated).add(1, 'days').format('YYYY-MM-DD');
                        }
                        var query = initialResults.metric.objectTypes[0].meta.pinMetricName;
                        allObjects = {
                            profile: initialResults.profile,
                            query: query,
                            widget: initialResults.metric,
                            dataResult: initialResults.data.data,
                            startDate: updated,
                            endDate: currentDate,
                            metricId: initialResults.metric._id,
                            metricCode: initialResults.metric.code,
                            endpoint: initialResults.metric.objectTypes[0].meta.endpoint[0]
                        };
                        callback(null, allObjects);
                    }
                    else
                        callback(null, 'DataFromDb');
                }
            }

            function getPinterestDataFromRemote(allObjects, callback) {
                var actualFinalApiData = {};
                if (allObjects.get_pinterest_queries === 'DataFromDb') {
                    actualFinalApiData = {
                        apiResponse: 'DataFromDb',
                        queryResults: initialResults,
                        channelId: initialResults.metric.channelId
                    };
                    callback(null, actualFinalApiData);
                }
                else
                    callPinterestApiForMetrics(allObjects.get_pinterest_queries, callback);
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
                            fields: "counts,id,name,created_at,url"
                        }
                    };
                    pinterest.api(result.query, params).then(function (response) {
                            var endPointMetric;
                            endPointMetric = result.endPoint;
                            if (endPointMetric.indexOf("/") > -1) {
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
                                var temp = arrayOfResponse[i][count];
                                arrayOfBoards.push({
                                    date: response.data[i].name,
                                    total: {pins: temp[pins], collaborators: temp[collaborate], followers: temp[followers]}
                                })
                            }
                            var MediasArray = _.sortBy(arrayOfBoards, ['total.followers']);
                            var collectionBoard = _.orderBy(MediasArray, ['total.followers', 'total.pins'], ['desc', 'asc']);
                            for (var j = 0; j < 10; j++) {
                                topTenBoard.push(collectionBoard[j]);
                            }
                            actualFinalApiData = {
                                apiResponse: topTenBoard,
                                metricId: result.metricId,
                                queryResults: initialResults,
                                channelId: initialResults.metric[0].channelId
                            };

                            callback(null, actualFinalApiData);

                        })
                        .catch(function (error) {
                            callback(null);
                        });
                }
                else if (result.metricCode ===  configAuth.pinterestMetrics.engagementRate) {
                    var params = {
                        qs: {
                            limit: 100,
                            fields: "id,board,created_at,counts"
                        }
                    };
                    var query = result.query;
                    var date = new Date();
                    var endDate = moment(date).unix();
                    var d = new Date();
                    d.setDate(d.getDate() - 31);
                    var startDate = moment(d).unix();
                    paginationCallApi(query, params);
                    function paginationCallApi(query, params) {
                        pinterest.api(query, params).then(function (response) {
                            for (var index in response.data) {
                                var dateString = response.data[index].created_at;
                                var split = dateString.split('T');
                                var createDate = moment(dateString).unix();
                                if (createDate > startDate && createDate < endDate) {
                                    arrayOfResponse.push(response.data[index]);
                                }
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
                            callback(null);
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
                                    arrayOfBoards.push({
                                        boardId: arrayOfResponse[k][board][id],
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
                            channelId: initialResults.metric.channelId
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
                        var endPointMetric;
                        var storeStartDate = new Date(result.startDate);
                        var storeEndDate = new Date(result.endDate);
                        var timeDiff = Math.abs(storeEndDate.getTime() - storeStartDate.getTime());
                        var diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24));
                        endPointMetric = result.endpoint;
                        if (endPointMetric.indexOf("/") > -1) {
                            endPointMetric = endPointMetric.split("/");
                        }
                        var count = endPointMetric[0];
                        var item = endPointMetric[1];
                        var temp = response.data[count];
                        storeMetric = temp[item];
                        for (var i = 0; i <= diffDays; i++) {
                            var finalDate = moment(storeStartDate).format('YYYY-MM-DD');
                            tot_metric.push({date: finalDate, total: storeMetric});
                            storeStartDate.setDate(storeStartDate.getDate() + 1);

                           /* if (result.endDate === tot_metric[i].date) {
                                tot_metric[i] = {
                                    total: storeMetric,
                                    date: result.endDate
                                };
                            }*/


                        }
                        actualFinalApiData = {
                            apiResponse: tot_metric,
                            metricId: result.metricId,
                            queryResults: initialResults,
                            channelId: initialResults.metric.channelId
                        };
                        callback(null, actualFinalApiData);

                    }, function (error) {
                        callback(null);
                    });
                }
            }
        }

        function mergeAllFinalData(results, callback) {
            var loopCount = results.data.length;
            iterateEachChannelData(results.get_channel, results.get_channel_data_remote, results.metric, results.data, callback);
            function iterateEachChannelData(channel, dataFromRemote, metric, dataFromDb, callback) {
                async.timesSeries(loopCount, function (j, next) {
                    if (channel[j].code === configAuth.channels.twitter) {
                        var currentDate = moment(new Date()).format('YYYY-MM-DD');
                        var param = [];
                        var storeTweetDetails = [];
                        var storeRemoteData = [];
                        var wholeTweetResponse = [];
                        var uniqueChannelArray = [];
                        if (dataFromRemote[j] === null) {
                            next(null, {
                                'error': {
                                    'metricId': dataFromDb[j].metricId,
                                    'objectId': dataFromDb[j].objectId
                                }
                            })
                        }
                        else if (dataFromRemote[j].data === 'DataFromDb') next(null, 'DataFromDb')
                        else {
                            if (metric[j].code === configAuth.twitterMetric.tweets || metric[j].code === configAuth.twitterMetric.followers || metric[j].code == configAuth.twitterMetric.following || metric[j].code === configAuth.twitterMetric.favourites || metric[j].code === configAuth.twitterMetric.listed || metric[j].code === configAuth.twitterMetric.retweets_of_your_tweets) {
                                if (dataFromRemote.length != 0) {
                                    if (dataFromRemote[j].data === 'DataFromDb') {

                                    }
                                    else {
                                        if (String(metric[j]._id) == String(dataFromRemote[j].metricId)) {
                                            wholeTweetResponse.push({
                                                date: currentDate,
                                                total: dataFromRemote[j].data[0]
                                            });
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
                                    else if (metric[j].keywordMentions == configAuth.twitterMetric.retweets_of_your_tweets || results.metric[0].code == configAuth.twitterMetric.mentions)
                                        param.push('retweet_count', 'favorite_count');
                                    else
                                        param.push('retweet_count', 'favorite_count');
                                    var dataFromRemoteLength = dataFromRemote[j].data.length;
                                    if (dataFromRemoteLength != 0) {
                                        var totalArray = [];
                                        for (var index = 0; index < param.length; index++) {
                                            if (param.length > 1) {
                                                var total = dataFromRemote[j].data[0][param[index]];
                                                var text = dataFromRemote[j].data[0].text;
                                                totalArray.push(total);
                                                if (totalArray.length > 1) {
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
                                                        tempDate.push({date: moment(new Date(Date.parse(tweetCount[i].created_at.replace(/( +)/, ' UTC$1')))).format('YYYY-MM-DD')});
                                                    }
                                                    var tempDateCount = _.uniqBy(tempDate, 'date')
                                                    for (var m = 0; m < tempDateCount.length; m++) {
                                                        storeTweetDetails.push({date: tempDateCount[m].date, total: 0});
                                                    }
                                                    for (var m = 0; m < storeTweetDetails.length; m++) {
                                                        for (var k = 0; k < tweetCount.length; k++) {
                                                            var responseDate = moment(new Date(Date.parse(tweetCount[k].created_at.replace(/( +)/, ' UTC$1')))).format('YYYY-MM-DD')
                                                            if (storeTweetDetails[m].date === responseDate)
                                                                duplicateRetweetCount += tweetCount[k].retweet_count;
                                                        }
                                                        storeRemoteData.push({
                                                            total: duplicateRetweetCount,
                                                            date: currentDate
                                                        })
                                                        //Get the required data based on date range
                                                        storeTweetDetails[m].total = (duplicateRetweetCount);
                                                        var duplicateRetweetCount = 0;
                                                    }
                                                }
                                                else {
                                                    var total = dataFromRemote[j].data[0].user[param[index]];
                                                    totalArray.push({total: total, date: currentDate});
                                                    storeRemoteData.push({total: total, date: currentDate})
                                                    storeTweetDetails.push({
                                                            total: total,
                                                            date: currentDate
                                                        }
                                                    );
                                                }
                                            }
                                        }
                                    }
                                    else {
                                        req.app.result = {Error: '500'};
                                        next();
                                    }
                                    if (dataFromDb[j].data != null) {
                                        var startDate = dataFromDb[j].updated;
                                        if (dataFromDb[j].updated < new Date()) {
                                            if (moment(dataFromDb[j].updated).format('YYYY-MM-DD') != moment(new Date()).format('YYYY-MM-DD')) {
                                                startDate.setDate(startDate.getDate() + 1);
                                                var daysDifference = populateDefaultData(startDate, currentDate, 1);
                                            }
                                        }
                                    }
                                    else {
                                        var d = new Date();
                                        d.setDate(d.getDate() - 365);
                                        var startDate = moment(new Date()).format('YYYY-MM-DD');
                                        var daysDifference = populateDefaultData(startDate, currentDate);
                                    }
                                    function populateDefaultData(startDate, currentDate, updated) {
                                        var daysDifference = findDaysDifference(startDate, currentDate);
                                        var defaultArrayLength = daysDifference.length;
                                        var tweetsLength = storeTweetDetails.length;
                                        for (var i = 0; i < defaultArrayLength; i++) {
                                            for (var k = 0; k < tweetsLength; k++) {
                                                if (daysDifference[i].date === storeTweetDetails[k].date) {
                                                    daysDifference[i] = storeTweetDetails[k]
                                                }
                                                else
                                                    daysDifference[i].total = storeTweetDetails[k].total;
                                            }

                                        }
                                        storeTweetDetails = daysDifference;
                                    }

                                    if (dataFromDb[j].data != 'DataFromDb') {
                                        if (dataFromDb[j].data != null) {
                                            var dataLength = dataFromDb[j].data.length
                                            for (var key = 0; key < dataLength; key++) {
                                                storeTweetDetails.push(dataFromDb[j].data[key]);
                                            }
                                        }
                                        uniqueChannelArray = _.uniqBy(storeTweetDetails, 'date');
                                        storeTweetDetails = uniqueChannelArray
                                        var findDuplicate = _.findIndex(storeTweetDetails, function (o) {
                                            return o.date == storeRemoteData[0].date;
                                        });
                                        if (findDuplicate >= 0) storeTweetDetails[findDuplicate] = storeRemoteData[0];
                                        else
                                            storeTweetDetails.push(storeRemoteData[0]);
                                        next(null, storeTweetDetails);
                                    }
                                }
                                else {
                                    req.app.result = {Error: '500'};
                                    next('error');
                                }
                            }
                            else if (results.metric[0].code === configAuth.twitterMetric.highEngagementTweets) next(null, results.get_channel_data_remote[j]);
                            else  next('error');
                        }
                    }
                    else if (channel[j].code === configAuth.channels.instagram) {
                        var finalData = [];
                        if (metric[j].code === configAuth.instagramStaticVariables.recentPost)
                            next(null, dataFromRemote[j])
                        else {
                            if (dataFromRemote[j] === null) {
                                next(null, {
                                    'error': {
                                        'metricId': dataFromDb[j].metricId,
                                        'objectId': dataFromDb[j].objectId
                                    }
                                })
                            }
                            else if (dataFromRemote[j].apiResponse != 'DataFromDb') {

                                //Array to hold the final result
                                for (var key in dataFromRemote) {
                                    if (String(metric[j]._id) == String(dataFromRemote[key].metricId))
                                        finalApiData = dataFromRemote[key].apiResponse;
                                }
                                
                                if (dataFromDb[j].data != null) {

                                    //merge the old data with new one and update it in db
                                    finalData = dataFromDb[j].data
                                    for (var key = 0; key < finalApiData.length; key++) {
                                        var findCurrentDate = _.findIndex(finalData, function (o) {
                                            return o.date == finalApiData[key].date;
                                        });
                                        if (findCurrentDate != -1) {
                                            finalData[findCurrentDate] = finalApiData[key];
                                        }
                                        else {
                                            finalData.push(finalApiData[key]);
                                        }

                                    }
                                }
                                next(null, finalData)
                            }
                            else
                                next(null, 'DataFromDb')
                        }
                    }
                    else if (channel[j].code === configAuth.channels.facebook) {
                        var beforeReplaceEmptyData = [];
                        var finalData = [];
                        var finalData1 = [];
                        if (dataFromRemote[j] === null) {
                            next(null, {
                                'error': {
                                    'metricId': dataFromDb[j].metricId,
                                    'objectId': dataFromDb[j].objectId
                                }
                            })
                        }
                        else if (dataFromRemote[j].res != 'DataFromDb') {
                            var startDate = new Date(dataFromRemote[j].startDate);
                            startDate.setDate(startDate.getDate());
                            startDate = moment(startDate).format('YYYY-MM-DD');
                            var endDate = new Date(dataFromRemote[j].endDate);
                            endDate.setDate(endDate.getDate() - 1);
                            endDate = moment(endDate).format('YYYY-MM-DD');
                            if (dataFromRemote[j].res.data.length) {

                                //Array to hold the final result
                                for (var index in dataFromRemote[j].res.data[0].values) {
                                    var value = {};
                                    value = {
                                        total: dataFromRemote[j].res.data[0].values[index].value,
                                        date: dataFromRemote[j].res.data[0].values[index].end_time.substr(0, 10)
                                    };
                                    if (String(metric[j]._id) === String(dataFromRemote[j].metricId)) {
                                        if (dataFromRemote[j].res.data[0].values[index].end_time.substr(0, 10) <= endDate)
                                            beforeReplaceEmptyData.push(value);
                                    }
                                }
                                if (dataFromRemote[j].metric.objectTypes[0].meta.endpoint.length)
                                    finalData1 = findDaysDifference(startDate, endDate, dataFromRemote[j].metric.objectTypes[0].meta.endpoint);
                                else {
                                    if (dataFromRemote[j].metric.objectTypes[0].meta.responseType === 'object')
                                        finalData1 = findDaysDifference(startDate, endDate, undefined, 'noEndPoint');
                                    else
                                        finalData1 = findDaysDifference(startDate, endDate, undefined);
                                }
                                var finalReplacedData = replaceEmptyData(finalData1, beforeReplaceEmptyData);
                                finalReplacedData.forEach(function (value) {
                                    finalData.push(value)
                                })
                            }
                            else {
                                if (dataFromRemote[j].metric.objectTypes[0].meta.endpoint.length)
                                    finalData = findDaysDifference(startDate, endDate, dataFromRemote[j].metric.objectTypes[0].meta.endpoint);
                                else {
                                    if (dataFromRemote[j].metric.objectTypes[0].meta.responseType === 'object')
                                        finalData = findDaysDifference(startDate, endDate, undefined, 'noEndPoint');
                                    else
                                        finalData = findDaysDifference(startDate, endDate, undefined);
                                }
                            }
                            var findCurrentDate = _.findIndex(finalData, function (o) {
                                return o.date == moment(new Date).format('YYYY-MM-DD');
                            });
                            if (dataFromDb[j].data != null) {
                                var dataArray = dataFromDb[j].data;
                                //merge the old data with new one and update it in db
                                for (var key = 0; key < finalData.length; key++) {
                                    var findCurrentDate = _.findIndex(dataArray, function (o) {
                                        return o.date == finalData[key].date;
                                    });

                                    if (findCurrentDate === -1) dataArray.push(finalData[key]);
                                    else dataArray[findCurrentDate] = finalData[key];
                                }
                                finalData = dataArray
                            }
                            if (typeof finalData[0].total == 'object') {
                                for (var data = 0; data < finalData.length; data++) {
                                    var jsonObj = {}, tempKey;
                                    for (var items in finalData[data].total)
                                        jsonObj[items.replace(/[$.]/g, '/')] = finalData[data].total[items];
                                    finalData[data].total = jsonObj;
                                }
                            }
                            next(null, finalData)
                        }
                        else next(null, 'DataFromDb')
                    }
                    else if (channel[j].code === configAuth.channels.moz) {

                        var beforeReplaceEmptyData = [];
                        var finalData1 = [];
                        if (dataFromRemote[j] === null) {
                            next(null, {
                                'error': {
                                    'metricId': dataFromDb[j].metricId,
                                    'objectId': dataFromDb[j].objectId
                                }
                            })
                        }
                        //add empty data for  daysdifference
                        else if (dataFromRemote[j].data != 'DataFromDb') {
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
                                            var finalData = findReplaceEmptyData(finalData1, beforeReplaceEmptyData);
                                        }
                                    }
                                }
                            }
                            //updating final db data
                            if (dataFromDb[j].data != null) {
                                var DbData = dataFromDb[j].data;
                                for (var i in finalData) {
                                    var index = _.findIndex(DbData, function (o) {
                                        return o.date == finalData[i].date;
                                    });
                                    if (index == -1)
                                        DbData.push(finalData[i]);
                                    else
                                        DbData[index] = finalData[i];
                                }
                            }
                            next(null, DbData)
                        }
                        else next(null, 'DataFromDb')
                    }
                    else if (channel[j].code === configAuth.channels.facebookAds) {
                        var finalData = [];
                        if (dataFromRemote[j] === null) {
                            next(null, {
                                'error': {
                                    'metricId': dataFromDb[j].metricId,
                                    'objectId': dataFromDb[j].objectId
                                }
                            })
                        }
                        else if (dataFromRemote[j].data != 'DataFromDb') {

                            //Array to hold the final result
                            for (var data in dataFromRemote[j].data) {

                                finalData.push(dataFromRemote[j].data[data]);
                            }
                            var findCurrentDate = _.findIndex(finalData, function (o) {
                                return o.date == moment(new Date).format('YYYY-MM-DD');
                            });
                            if (dataFromDb[j].data != null) {
                                //merge the old data with new one and update it in db
                                for (var key = 0; key < dataFromDb[j].data.length; key++) {
                                    if (dataFromDb[j].data[key].date === moment(new Date).format('YYYY-MM-DD')) {
                                        // if (findCurrentDate != -1) finalData[findCurrentDate] = finalData[findCurrentDate];
                                        if (findCurrentDate === -1) finalData.push(dataFromDb[j].data[key]);
                                    }
                                    else finalData.push(dataFromDb[j].data[key]);
                                }
                            }
                            next(null, finalData)
                        }
                        else next(null, 'DataFromDb')
                    }
                    else if (channel[j].code === configAuth.channels.googleAnalytics || channel[j].code == configAuth.channels.youtube) {
                        if (dataFromRemote[j] === null) {
                            next(null, {
                                'error': {
                                    'metricId': dataFromDb[j].metricId,
                                    'objectId': dataFromDb[j].objectId
                                }
                            })
                        }
                        else if (dataFromRemote[j].data.data != 'DataFromDb') {
                            var storeGoogleData = [];
                            var replacedGoogleData = [];
                            var dimensionList = metric[j].objectTypes[0].meta.dimension;
                            if (dimensionList[0].name === "ga:date" || dimensionList[0].name === "mcf:conversionDate" || dimensionList[0].name === 'day') {
                                if (dataFromRemote[j].data.metric.objectTypes[0].meta.endpoint.length)
                                    finalData = findDaysDifference(dataFromRemote[j].data.startDate, dataFromRemote[j].data.endDate, dataFromRemote[j].data.metric.objectTypes[0].meta.endpoint);
                                else {
                                    if (dataFromRemote[j].data.metric.objectTypes[0].meta.responseType === 'object')
                                        finalData = findDaysDifference(dataFromRemote[j].data.startDate, dataFromRemote[j].data.endDate, undefined, 'noEndPoint');
                                    else
                                        finalData = findDaysDifference(dataFromRemote[j].data.startDate, dataFromRemote[j].data.endDate, undefined);
                                }
                            }

                            //Check empty data from query response
                            if (dataFromRemote[j].data.data === 'No Data')
                                storeGoogleData = finalData;
                            else {

                                //calculating the result length
                                var resultLength = dataFromRemote[j].data.data.length;
                                var resultCount = dataFromRemote[j].data.data[0].length - 1;
                                //loop to store the entire result into an array
                                for (var i = 0; i < resultLength; i++) {
                                    var obj = {};

                                    //loop generate array dynamically based on given dimension list
                                    for (var m = 0; m < dimensionList.length; m++) {
                                        if (m == 0) {

                                            //date value is coming in the format of 20160301 so splitting like yyyy-mm--dd format
                                            //obj['metricName'] = metricName;
                                            if (metric[j].objectTypes[0].meta.api === configAuth.googleApiTypes.mcfApi) {
                                                var year = dataFromRemote[j].data.data[i][0].primitiveValue.substring(0, 4);
                                                var month = dataFromRemote[j].data.data[i][0].primitiveValue.substring(4, 6);
                                                var date = dataFromRemote[j].data.data[i][0].primitiveValue.substring(6, 8);
                                                obj[dimensionList[m].storageName] = [year, month, date].join('-');
                                                obj['total'] = dataFromRemote[j].data.data[i][resultCount].primitiveValue;
                                            }
                                            else if (metric[j].objectTypes[0].meta.api === configAuth.googleApiTypes.youtubeApi) {
                                                obj[dimensionList[m].storageName] = dataFromRemote[j].data.data[i][0];
                                                obj['total'] = dataFromRemote[j].data.data[i][resultCount];
                                            }
                                            else {
                                                var year = dataFromRemote[j].data.data[i][0].substring(0, 4);
                                                var month = dataFromRemote[j].data.data[i][0].substring(4, 6);
                                                var date = dataFromRemote[j].data.data[i][0].substring(6, 8);
                                                obj[dimensionList[m].name.substr(3)] = [year, month, date].join('-');
                                                obj['total'] = dataFromRemote[j].data.data[i][resultCount];
                                            }
                                        }
                                        else {
                                            obj[dimensionList[m].name.substr(3)] = dataFromRemote[j].data.data[i][m];
                                            if (metric[j].objectTypes[0].meta.api === configAuth.googleApiTypes.mcfApi)
                                                obj['total'] = dataFromRemote[j].data.data[i][resultCount].primitiveValue;
                                            else
                                                obj['total'] = dataFromRemote[j].data.data[i][resultCount];
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
                                            for (var d = initD; d < dimensionList.length; d++) {
                                                for (var g = 0; g < groupedData[i].data.length; g++) {
                                                    var dimensionData = groupedData[i].data[g][dimensionList[1].name.substr(3)]
                                                    if (initD === 1)
                                                        var finalDimensionData = dimensionData;

                                                    else
                                                        var finalDimensionData = dimensionData + '/' + groupedData[i].data[g][dimensionList[d].name.substr(3)];
                                                    var replacedValue = finalDimensionData.split('.').join('002E');
                                                    objToStoreFinalData[replacedValue] = groupedData[i].data[g].total;
                                                }
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
                                    var daysDifference = findDaysDifference(dataFromRemote[j].data.startDate, dataFromRemote[j].data.endDate, undefined, 'noEndPoint');
                                    var defaultArrayLength = daysDifference.length;
                                    var googleDataLength = storeGoogleData.length;
                                    for (var i = 0; i < defaultArrayLength; i++) {
                                        for (var k = 0; k < googleDataLength; k++) {
                                            if (daysDifference[i].date === storeGoogleData[k].date) {
                                                daysDifference[i] = storeGoogleData[k]
                                            }
                                        }
                                    }
                                    storeGoogleData = daysDifference;
                                }


                            }
                            var finalReplacedData = replaceEmptyData(finalData, storeGoogleData);
                            finalReplacedData.forEach(function (value) {
                                replacedGoogleData.push(value)
                            })
                            if (dataFromDb[j].data != null) {
                                var dataArray = dataFromDb[j].data;
                                //merge the old data with new one and update it in db
                                for (var key = 0; key < replacedGoogleData.length; key++) {
                                    var findCurrentDate = _.findIndex(dataArray, function (o) {
                                        return o.date == replacedGoogleData[key].date;
                                    });

                                    if (findCurrentDate === -1) dataArray.push(replacedGoogleData[key]);
                                    else dataArray[findCurrentDate] = replacedGoogleData[key];
                                }
                                storeGoogleData = dataArray
                            }

                            next(null, storeGoogleData)
                        }
                        else next(null, 'DataFromDb')
                    }
                    else if (channel[j].code === configAuth.channels.googleAdwords) {
                        var finalData = [];
                        if (dataFromRemote[j] === null) {
                            next(null, {
                                'error': {
                                    'metricId': dataFromDb[j].metricId,
                                    'objectId': dataFromDb[j].objectId
                                }
                            })
                        }
                        else if (dataFromRemote[j].apiResponse != 'DataFromDb') {
                            if (String(metric[j]._id) == String(dataFromRemote[j].metricId))
                                finalData = dataFromRemote[j].apiResponse;
                            if (dataFromDb[j].data != null) {
                                if (dataFromRemote[j].metricId == dataFromDb[j].metricId) {
                                    //merge the old data with new one and update it in db
                                    var dataArray = dataFromDb[j].data;
                                    for (var key = 0; key < finalData.length; key++) {
                                        var findCurrentDate = _.findIndex(dataArray, function (o) {
                                            return o.date == finalData[key].date;
                                        });
                                        if (findCurrentDate === -1) dataArray.push(finalData[key]);
                                        else dataArray[findCurrentDate] = finalData[key];
                                    }

                                }
                            }
                            next(null, dataArray)
                        }
                        else next(null, 'DataFromDb')
                    }
                    else if (channel[j].code === configAuth.channels.mailChimp) {
                        var finalDbData = [];
                        var finalApiData = [];
                        if (dataFromRemote[j] === null) {
                            next(null, {
                                'error': {
                                    'metricId': dataFromDb[j].metricId,
                                    'objectId': dataFromDb[j].objectId
                                }
                            })
                        }
                        else if (dataFromRemote[j].apiResponse != 'DataFromDb') {


                            //Array to hold the final result
                            for (var key in dataFromRemote) {
                                if (String(metric[j]._id) == String(dataFromRemote[key].metricId))
                                    finalApiData = dataFromRemote[key].apiResponse;
                            }

                            if (dataFromDb[j].data != null) {

                                //merge the old data with new one and update it in db
                                finalDbData = dataFromDb[j].data
                                for (var key = 0; key < finalApiData.length; key++) {
                                    var findCurrentDate = _.findIndex(finalDbData, function (o) {
                                        return o.date == finalApiData[key].date;
                                    });
                                    if (findCurrentDate != -1) {
                                        finalDbData[findCurrentDate] = finalApiData[key];
                                    }
                                    else {
                                        finalDbData.push(finalApiData[key]);
                                    }

                                }

                            }
                            next(null, finalDbData)

                        }
                        else
                            next(null, 'DataFromDb')
                    }
                    else if (channel[j].code === configAuth.channels.aweber) {
                        var finalDbData = [];
                        var finalApiData = [];
                        if (dataFromRemote[j] === null) {
                            next(null, {
                                'error': {
                                    'metricId': dataFromDb[j].metricId,
                                    'objectId': dataFromDb[j].objectId
                                }
                            })
                        }
                        else if (dataFromRemote[j].apiResponse != 'DataFromDb') {
                            //Array to hold the final result
                            for (var key in dataFromRemote) {
                                if (String(metric[j]._id) == String(dataFromRemote[key].metricId))
                                    finalApiData = dataFromRemote[key].apiResponse;
                            }

                            if (dataFromDb[j].data != null) {

                                //merge the old data with new one and update it in db
                                finalDbData = dataFromDb[j].data
                                for (var key = 0; key < finalApiData.length; key++) {
                                    var findCurrentDate = _.findIndex(finalDbData, function (o) {
                                        return o.date == finalApiData[key].date;
                                    });
                                    if (findCurrentDate != -1) {
                                        finalDbData[findCurrentDate] = finalApiData[key];
                                    }
                                    else {
                                        finalDbData.push(finalApiData[key]);
                                    }

                                }

                            }
                            next(null, finalDbData)

                        }
                        else
                            next(null, 'DataFromDb')
                    }
                    else if (channel[j].code === configAuth.channels.linkedIn) {

                        var finalApiData = [];
                        var finalDbData = [];
                        if (dataFromRemote[j] === null) {
                            next(null, {
                                'error': {
                                    'metricId': dataFromDb[j].metricId,
                                    'objectId': dataFromDb[j].objectId
                                }
                            })
                        }
                        else if (dataFromRemote[j].apiResponse != 'DataFromDb') {

                            //Array to hold the final result
                            for (var key in dataFromRemote) {
                                if (String(metric[j]._id) == String(dataFromRemote[key].metricId))
                                    finalApiData = dataFromRemote[key].apiResponse;
                            }

                            if (dataFromDb[j].data != null) {
                                finalDbData = dataFromDb[j].data;
                                for (var n = 0; n < finalApiData.length; n++) {
                                    var findCurrentDate = _.findIndex(finalDbData, function (o) {
                                        return o.date == finalApiData[n].date;
                                    });

                                    if (findCurrentDate != -1) {
                                        finalDbData[findCurrentDate] = finalApiData[n];
                                    }
                                    else
                                        finalDbData.push(finalApiData[n]);
                                }
                            }
                            next(null, finalDbData)

                        }
                        else
                            next(null, 'DataFromDb')
                    }
                    else if (channel[j].code === configAuth.channels.vimeo) {
                        var apiData = [];
                        if (dataFromRemote[j].apiResponse != 'DataFromDb') {

                            for (var key in dataFromRemote) {
                                if (String(metric[j]._id) == String(dataFromRemote[key].metricId))
                                    apiData = dataFromRemote[key].apiResponse;
                            }
                            if (dataFromDb[j].data != null) {
                                var dbData = dataFromDb[j].data
                                for (var key in apiData) {

                                    var findSameIndex = _.findIndex(dataFromDb[j].data, function (o) {
                                        return o.date == moment(apiData[key].date).format('YYYY-MM-DD');
                                    });


                                    if (findSameIndex != -1) {

                                        dbData[findSameIndex] = apiData[key];


                                    }
                                    else {
                                        dbData.push(apiData[key]);
                                    }

                                }


                                //merge the old data with new one and update it in db
                                ;


                            }


                            next(null, dbData)
                        }
                        else
                            next(null, 'DataFromDb')

                    }
                    else if (channel[j].code === configAuth.channels.pinterest) {
                        var finalDbData = [];
                        var finalApiData = [];
                        if (dataFromRemote[j] === null) {
                            next(null, {
                                'error': {
                                    'metricId': dataFromDb[j].metricId,
                                    'objectId': dataFromDb[j].objectId
                                }
                            })
                        }
                        else if (dataFromRemote[j].apiResponse != 'DataFromDb') {


                            //Array to hold the final result
                            for (var key in dataFromRemote) {
                                if (String(metric[j]._id) == String(dataFromRemote[key].metricId))
                                    finalApiData = dataFromRemote[key].apiResponse;
                            }

                            if (dataFromDb[j].data != null) {

                                //merge the old data with new one and update it in db
                                finalDbData = dataFromDb[j].data
                                for (var key = 0; key < finalApiData.length; key++) {
                                    var findCurrentDate = _.findIndex(finalDbData, function (o) {
                                        return o.date == finalApiData[key].date;
                                    });
                                    if (findCurrentDate != -1) {
                                        finalDbData[findCurrentDate] = finalApiData[key];
                                    }
                                    else {
                                        finalDbData.push(finalApiData[key]);
                                    }

                                }

                            }
                            next(null, finalDbData)

                        }
                        else
                            next(null, 'DataFromDb')
                    }
                }, callback)
            }
        }

        function findReplaceEmptyData(daysDifference, finalData) {
            var defaultArrayLength = daysDifference.length;
            var dataLength = finalData.length;
            for (var i = 0; i < defaultArrayLength; i++) {
                for (var k = 0; k < dataLength; k++) {
                    if (daysDifference[i].date === finalData[k].date)
                        daysDifference[i] = finalData[k]
                    else {
                        daysDifference[i].total = finalData[k].total;
                    }

                }
            }
            return daysDifference;
        }

        //This function is to update the data in bulk
        function storeFinalData(results, callback) {
            var updatedFinalData = results.merge_all_final_data;
            var bulk = Data.collection.initializeOrderedBulkOp();
            var bulkExecute;
            var now = new Date();

            //set the update parameters for query
            bulkExecute = false;
            for (var i = 0; i < updatedFinalData.length; i++) {

                //next(null,{'error':{'metricId':dataFromDb[j].data.metricId,'objectId':dataFromDb[j].data.objectId}})
                if (results.merge_all_final_data[i].error) {
                    //bulkExecute = false;
                    var mailOptions = {
                        from: 'Datapoolt Team <rajalakshmi.c@habile.in>',
                        to: 'rajalakshmi.c@habile.in',
                        subject: 'Error alert for the metric' + results.merge_all_final_data[i].error.metricId + 'and object id' + results.merge_all_final_data[i].error.objectId,

                        // HTML Version
                        // html: '<span>The data has crossed the limit of <b>' + thresholdValue + '</b></span>' + '<span> for the metric  <b>' + metric.name + '</b></span>' + '<span> in  <b>' + object.name + '</b></span>'

                    };
                    utility.sendEmail(mailOptions, '', function (err, response) {
                        callback(null, 'success');
                    });
                    errorDataList.push(results.merge_all_final_data[i].error)
                }
                else if (results.merge_all_final_data[i] != 'DataFromDb' && !results.merge_all_final_data[i].error) {
                    bulkExecute = true;

                    //set query condition
                    var query = {
                        'objectId': results.data[i].objectId,
                        'metricId': results.data[i].metricId
                    };

                    //set the values
                    var update = {
                        $setOnInsert: {created: now},
                        $set: {
                            data: results.merge_all_final_data[i],
                            updated: now
                        }
                    };

                    //form the query
                    bulk.find(query).upsert().update(update);
                }
            }
            if (bulkExecute === true) {

                //Doing the bulk update
                bulk.execute(function (err, response) {
                    callback(err, 'success');
                });
            }
            else  callback(null, 'success');
        }

        //Function to find days difference
        function findDaysDifference(startDate, endDate, endPoint, noEndPoint) {
            var storeDefaultValues = [];
            var storeStartDate = new Date(startDate);
            var storeEndDate = new Date(endDate);
            var timeDiff = Math.abs(storeEndDate.getTime() - storeStartDate.getTime());
            var diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24));
            for (var i = 0; i <= diffDays; i++) {
                if (moment(storeStartDate).format('YYYY-MM-DD') <= moment(new Date).format('YYYY-MM-DD')) {
                    var finalDate = moment(storeStartDate).format('YYYY-MM-DD');
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
            if (daysDifference < finalData) {
                var defaultArrayLength = daysDifference.length;
                var dataLength = finalData.length;
                daysDifference = finalData;
                finalData = daysDifference;
            }
            else {
                var dataLength = daysDifference.length;
                var defaultArrayLength = finalData.length;
            }

            for (var i = 0; i < defaultArrayLength; i++) {
                for (var k = 0; k < dataLength; k++) {
                    if (daysDifference[k].date === finalData[i].date) daysDifference[k] = finalData[i]
                }
            }
            return daysDifference;
        }
    }
});
agenda.define(configAuth.batchJobs.alertName, function (job, done) {
    var now = new Date();
    var storeOperator;
    var thresholdValue;
    async.auto({
        get_alert: getAlert,
        data: ['get_alert', getData]
    }, function (err, results) {
        done(err)
    });

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

    function getAlert(callback) {
        Alert.find({}, checkNullObject(callback));
    }

    function getData(results, callback) {
        async.concatSeries(results.get_alert, evaluateData, callback)
    }

    function evaluateData(results, callback) {
        var alert = results;
        var weekday = [];
        weekday[0] = configAuth.dayNames.Sunday;
        weekday[1] = configAuth.dayNames.Monday;
        weekday[2] = configAuth.dayNames.Tuesday;
        weekday[3] = configAuth.dayNames.Wednesday;
        weekday[4] = configAuth.dayNames.Thursday;
        weekday[5] = configAuth.dayNames.Friday;
        weekday[6] = configAuth.dayNames.Saturday;
        var utcTime = alert.lastEvaluatedTime === null ? null : moment(alert.lastEvaluatedTime).format('YYYY-MM-DD');
        var time = moment(now).format('YYYY-MM-DD');
        var currentDayName = weekday[now.getDay()];
        var operators = {
            '>': function (a, b) {
                return a > b
            },
            '<': function (a, b) {
                return a < b
            }
        };
        //check interval if,daily check threshold,else check today is friday
        if (utcTime < time || utcTime === null) {
            Data.findOne({
                'objectId': alert.objectId,
                'metricId': alert.metricId,
                data: {$elemMatch: {date: time}},
            }, function (err, data) {
                if (err || !data)
                   return callback(null, 'success')
                else {
                    Metric.findOne({_id: alert.metricId}, function (err, metric) {
                        if (err || !data)
                          return  callback(null, 'success');
                        else {
                            Object.findOne({_id: alert.objectId}, function (err, object) {
                                if (err || !object)
                                 return   callback(null, 'success')
                                else {
                                    var dataArray = data.data;
                                    var chosenValue = _.find(dataArray, function (o) {
                                        return o.date === time;
                                    });
                                    if (typeof chosenValue.total === 'object' && chosenValue.total != null)
                                        var valueToCheck = chosenValue.total[alert.endPoint];
                                    else
                                        var valueToCheck = chosenValue.total;
                                    for (var key in alert.threshold) {
                                        storeOperator = key == 'gt' ? '>' : '<';
                                        thresholdValue = alert.threshold[key]
                                    }
                                    var checkingThreshold = operators[storeOperator](valueToCheck, thresholdValue);
                                    // Email Setup
                                    var mailOptions = {
                                        from: 'Datapoolt Team <rajalakshmi.c@habile.in>',
                                        to: alert.mailingId.email,
                                        subject: 'The alert ' + alert.name + ' has been triggered',

                                        // HTML Version
                                        html: '<span>The data has crossed the limit of <b>' + thresholdValue + '</b></span>' + '<span> for the metric  <b>' + metric.name + '</b></span>' + '<span> in  <b>' + object.name + '</b></span>'

                                    };
                                    if (alert.interval === configAuth.interval.setDaily) {
                                        if (checkingThreshold === true) {
                                            utility.sendEmail(mailOptions, alert._id, function (err, response) {
                                              return  callback(null, 'success');
                                            });
                                        }
                                        else return callback(null, 'success');
                                    }
                                    else if (alert.interval === configAuth.interval.setWeekly) {
                                        if (checkingThreshold === true && currentDayName === configAuth.dayNames.Friday) {
                                            utility.sendEmail(mailOptions, alert._id, function (err, response) {
                                               return callback(null, 'success');
                                            });
                                        }
                                        else return callback(null, 'success');
                                    }
                                    else return callback(null)
                                }
                            })
                        }
                    })
                }
            })
        }
        else callback(null, 'success')
    }
})
agenda.on('ready', function () {
    agenda.processEvery('2 hours', configAuth.batchJobs.alertJobName);
    agenda.start();
    agenda.on(configAuth.batchJobs.successBatchJobMessage, function (job) {
        if (job) {
            agenda.now(configAuth.batchJobs.alertName)
            agenda.start();
        }
    });
});
agenda.on('start', function (job) {
    console.log("Job %s starting", job.attrs.name);
});