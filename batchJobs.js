/**
 * BatchJobs - Used to update the channel data periodically
 */

var _ = require('lodash');

//job scheduling library
var Agenda = require('agenda');

//load async module
var async = require("async");
var mongoConnectionString = "mongodb://showmetric:showmetric@ds013918.mlab.com:13918/showmetric";

//db connection for storing agenda jobs
var agenda = new Agenda({db: {address: mongoConnectionString}});
var Channels = require('./models/channels');


//Load the auth file
var configAuth = require('./config/auth');

//set Twitter module
var Twitter = require('twitter');

var client = new Twitter({
    consumer_key: configAuth.twitterAuth.consumerKey,
    consumer_secret: configAuth.twitterAuth.consumerSecret,
    access_token_key: configAuth.twitterAuth.AccessToken,
    access_token_secret: configAuth.twitterAuth.AccessTokenSecret
});

//To load the data model
var Data = require('./models/data');

//Importing instagram node module - dev
var ig = require('instagram-node').instagram();

//To load the metric model
var Metric = require('./models/metrics');

var moment = require('moment')

//To load the data model
var Object = require('./models/objects');

//To load the profile model
var Profile = require('./models/profiles');
var mongoose = require('mongoose');
mongoose.connect(mongoConnectionString);//Connection with mongoose

//set Twitter module
var Twitter = require('twitter');

var utility = require('./helpers/utility')


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
            store_final_data: ['merge_all_final_data', storeFinalData]

        }, function (err, results) {
            //console.log('final data', results.store_final_data,err)
            if (err) {
                console.log('error', err)
            }

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
                objectTypeId: 1
            }, checkNullObject(callback));
        }

        //Function to get the data in profile collection
        function getProfile(results, callback) {
            async.concatSeries(results.object, getEachProfile, callback)
        }

        //Function to get all profile details
        function getEachProfile(results, callback) {
            Profile.findOne({'_id': results.profileId}, {
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
            Channels.findOne({'_id': results.channelId}, {code: 1}, checkNullObject(callback));
        }


        function getChannelDataRemote(results, callback) {
            callEachChannel(results.data, results.get_profile, results.get_channel, results.metric, results.object);
            function callEachChannel(data, profile, channel, metric, object) {
                async.timesSeries(data.length, function (j, next) {
                    var allResultData = {
                        data: data[j],
                        profile: profile[j],
                        channel: channel[j],
                        metric: metric[j],
                        object: object[j]
                    }
                    console.log('switch', j)
                    //To check the channel
                    switch (allResultData.channel.code) {
                        case configAuth.channels.twitter:
                            getTweetData(allResultData, next);
                            break;
                        case configAuth.channels.instagram:
                            selectInstagram(allResultData, next);
                            break;
                        default:
                            console.log('No channel selected')
                    }
                }, callback)
            }


        }

        function getTweetData(results, callback) {
            async.auto({
                get_tweet_queries: getTweetQueries,
                get_tweet_data_from_remote: ['get_tweet_queries', getTweetDataFromRemote]

            }, function (err, results) {
                //console.log('dbb',err,results);
                if (err) {
                    return callback(err, null);
                }
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
                    else if (results.data.updated < new Date()) {
                        console.log('elseif')
                        setTweetQuery();
                    }

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


                //}, callback)
                //   }

            }

            //To get tweet data from tweet api
            function getTweetDataFromRemote(queries, callback) {
                // console.log('queries;', queries.get_tweet_queries);
                var wholeTweetObjects = [];
                var finalTwitterResponse = [];
                // async.timesSeries(queries.get_tweet_queries.length, function (j, next) {
                if (queries.get_tweet_queries.inputs === 'DataFromDb') {
                    console.log('inside');
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
                        if (err){
                            finalTwitterResponse = {
                                data: 'DataFromDb',
                                metricId: queries.get_tweet_queries.metricId,
                                channelId: queries.get_tweet_queries.channelId,
                                queryResults: results
                            }
                            callback(null, response);
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
                        console.log(error, 'errr', inputs, query)
                    if (error ||tweets.length === 0){
                        finalTwitterResponse = {
                            data: 'DataFromDb',
                            metricId: queries.get_tweet_queries.metricId,
                            channelId: queries.get_tweet_queries.channelId,
                            queryResults: results
                        }
                        callback(null, response);
                    }
                    else {
                        if (queries.get_tweet_queries.metricCode === configAuth.twitterMetric.tweets || queries.get_tweet_queries.metricCode === configAuth.twitterMetric.followers || queries.get_tweet_queries.metricCode === configAuth.twitterMetric.following || queries.get_tweet_queries.metricCode === configAuth.twitterMetric.favourites || queries.get_tweet_queries.metricCode === configAuth.twitterMetric.listed || queries.get_tweet_queries.metricCode === configAuth.twitterMetric.retweets_of_your_tweets) {

                            finalTwitterResponse = {
                                data: tweets,
                                metricId: queries.get_tweet_queries.metricId,
                                channelId: queries.get_tweet_queries.channelId,
                                queryResults: results
                            }
                            callback(null, finalTwitterResponse);
                        }
                        else {
                            //var lastCreatedAt = formatDate(new Date(Date.parse(tweets[tweets.length - 1].created_at.replace(/( +)/, ' UTC$1'))));
                            var lastCreatedAt = moment(new Date(Date.parse(tweets[tweets.length - 1].created_at.replace(/( +)/, ' UTC$1')))).format('YYYY-MM-DD');
                            var maxId = tweets[tweets.length - 1].id;
                            if (lastCreatedAt >= req.body.startDate) {
                                tweets.forEach(function (value, index) {
                                    storeTweetDate = moment(new Date(Date.parse(value.created_at.replace(/( +)/, ' UTC$1')))).format('YYYY-MM-DD');
                                    wholeTweetObjects.push({total: value, date: storeTweetDate});
                                })

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

                                })
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
                                })
                                sortedTweetsArray = _.sortBy(highEngagedTweetsCount, ['count']);
                                for (var index = 1; index <= 20; index++) {
                                    finalHighEngagedTweets.push(sortedTweetsArray[sortedTweetsArray.length - index]);
                                }
                                finalTwitterResponse = {
                                    data: finalHighEngagedTweets,
                                    metricId: queries.get_tweet_queries.metricId,
                                    channelId: queries.get_tweet_queries.channelId,
                                    queryResults: results
                                }
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
                    return callback(err, null);
                }
                callback(null, results.get_instagram_data_from_remote);
            });

            function getInstagramQueries(callback) {

                console.log('Metricloop');
                d = new Date();
                var allObjects = {};
                if (initialResults.data != null) {

                    var updatedDb = moment(initialResults.data.updated).format('YYYY-MM-DD')
                    console.log('updatedDb', updatedDb);
                    var updated = initialResults.data.updated;

                    var currentDate = moment(new Date()).format('YYYY-MM-DD');
                    // d.setDate(d.getDate() + 1);
                    var oneDay = 24 * 60 * 60 * 1000; // hours*minutes*seconds*milliseconds
                    updated.setTime(updated.getTime() + oneDay);

                    var startDate = moment(updated).format('YYYY-MM-DD')
                    console.log('updatedDay', initialResults.data.updated, new Date());
                    if (initialResults.data.updated < new Date()) {
                        console.log('iffff')
                        var query = initialResults.metric.objectTypes[0].meta.igMetricName;
                        allObjects = {
                            profile: initialResults.profile,
                            query: query,
                            widget: initialResults.metric,
                            dataResult: initialResults.data.data,
                            startDate: updated,
                            endDate: currentDate,
                            metricId: initialResults.metric._id,
                            endPoint: initialResults.metric.objectTypes[0].meta.endpoint
                        }
                        console.log('DataIfAllobject');
                        callback(null, allObjects);
                    }
                    else
                        callback(null, 'DataFromDb');
                }

            }

            function getInstagramDataFromRemote(allObjects, callback) {
                var actualFinalApiData = {};
                console.log('allobject');
                if (allObjects.get_instagram_queries === 'DataFromDb') {
                    actualFinalApiData = {
                        apiResponse: 'DataFromDb',
                        queryResults: initialResults,
                        channelId: initialResults.metric.channelId
                    }
                    callback(null, actualFinalApiData);
                }
                else {
                    console.log('elll');
                    if (allObjects.get_instagram_queries == 'DataFromDb') {
                        actualFinalApiData = {
                            apiResponse: 'DataFromDb',
                            queryResults: initialResults,
                            channelId: initialResults.metric.channelId
                        }
                        callback(null, actualFinalApiData);
                    }
                    else {
                        //console.log('wantsResult',result);
                        callInstagramApiForMetrics(allObjects.get_instagram_queries, callback);

                    }
                    //}
                }
            }

            function callInstagramApiForMetrics(result, callback) {
                console.log('bbb');
                //Set access token for hitting api access - dev
                var storeMetric;
                var tot_metric = [];
                var sorteMediasArray = [];
                var actualFinalApiData = [];
                var userMediaRecent = [];
                var recentMedia = [];
                //console.log('callbackResults',result.profile.accessToken,result.profile.userId,result.query)
                ig.use({access_token: result.profile.accessToken});
                if (result.query === 'user') {
                    ig.user(result.profile.userId, function (err, results, remaining, limit) {
                        if (err) {
                            actualFinalApiData = {
                                apiResponse: tot_metric,
                                metricId: result.metricId,
                                queryResults: initialResults,
                                channelId: initialResults.metric.channelId
                            }
                            callback(null, actualFinalApiData);
                        }
                        else {
                            var endPointMetric = {}
                            endPointMetric = {items: result.endPoint};
                            console.log('InstagramResponseData')
                            var storeStartDate = new Date(result.startDate);
                            var storeEndDate = new Date(result.endDate);
                            var timeDiff = Math.abs(storeEndDate.getTime() - storeStartDate.getTime());
                            var diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24)); //adding plus one so that today also included
                            if (endPointMetric.items.indexOf("/") > -1) {
                                endPointMetric = endPointMetric.items.split("/");
                            }
                            var count = endPointMetric[0];
                            var item = endPointMetric[1];
                            var temp = results[count];
                            storeMetric = temp[item];
                            for (var i = 0; i <= diffDays; i++) {
                                var finalDate = moment(storeStartDate).format('YYYY-MM-DD');
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
                                channelId: initialResults.metric.channelId
                            }
                            callback(null, actualFinalApiData);
                        }
                    });
                }
                else {
                    var callApi = function (err, medias, pagination, remaining, limit) {
                        for (var key in medias) {
                            userMediaRecent.push(medias[key])
                        }
                        for (var i = 0; i < userMediaRecent.length; i++) {
                            var storeDate = userMediaRecent[i].created_time;
                            var dateString = moment.unix(storeDate).format("YYYY/MM/DD");
                            actualFinalApiData.push({date: dateString, total: userMediaRecent[i]})
                        }
                        actualFinalApiData.forEach(function (value, index) {
                            var count = value.total.likes.count + value.total.comments.count;
                            recentMedia.push({count: count, date: value.date, total: value.total})
                        })
                        var MediasArray = _.sortBy(recentMedia, ['count']);
                        sorteMediasArray = MediasArray.reverse();
                        actualFinalApiData = {
                            apiResponse: sorteMediasArray,
                            metricId: result.metricId,
                            queryResults: initialResults,
                            channelId: initialResults.metric.channelId
                        }

                        callback(null, actualFinalApiData);
                        if (pagination.next) {
                            pagination.next(callApi); // Will get second page results
                        }
                        //console.log('actualFinalApiDataLength', userMediaRecent.length, userMediaRecent);

                    };
                    ig.user_media_recent(result.profile.userId, {count: 25}, callApi)

                }
            }
        }

        function mergeAllFinalData(results, callback) {

            var loopCount = results.data.length;
            console.log('merge', loopCount)
            iterateEachChannelData(results.get_channel, results.get_channel_data_remote, results.metric, results.data, callback);
            function iterateEachChannelData(channel, dataFromRemote, metric, dataFromDb, callback) {
                async.timesSeries(loopCount, function (j, next) {
                    if (channel[j].code == configAuth.channels.twitter) {
                        console.log('twitter');
                        var currentDate = moment(new Date()).format('YYYY-MM-DD');
                        var param = [];
                        var storeTweetDetails = [];
                        var storeRemoteData = [];
                        var wholeTweetResponse = [];
                        var uniqueChannelArray = [];
                        if (dataFromRemote[j].data === 'DataFromDb') {
                            next(null, 'DataFromDb')
                        }
                        else {
                            //  console.log('metric from', results.get_channel_data_remote)
                            if (metric[j].code === configAuth.twitterMetric.tweets || metric[j].code === configAuth.twitterMetric.followers || metric[j].code == configAuth.twitterMetric.following || metric[j].code === configAuth.twitterMetric.favourites || metric[j].code === configAuth.twitterMetric.listed || metric[j].code === configAuth.twitterMetric.retweets_of_your_tweets) {
                                //console.log('results.get_channel_data_remote',results.get_channel_data_remote)
                                if (dataFromRemote.length != 0) {

                                    //To format twitter date
                                    var createdAt = moment(new Date(Date.parse(dataFromRemote[j].data[0].created_at.replace(/( +)/, ' UTC$1')))).format('YYYY-MM-DD');
                                    //          console.log('createdat', createdAt)
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
                                    //}
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

                                        //for (var key = 0; key < dataFromRemoteLength; key++) {
                                        var totalArray = [];
                                        //  var date = formatDate(createdAt);

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

                                                var total = dataFromRemote[j].data[0].user[param[index]];
                                                totalArray.push({total: total, date: currentDate});
                                                //   console.log('total array', totalArray)
                                                storeRemoteData.push({total: total, date: currentDate})
                                                //Get the required data based on date range
                                                storeTweetDetails.push({
                                                        total: total,
                                                        date: currentDate
                                                    }
                                                );
                                            }
                                        }
                                        //}
                                    }
                                    else {
                                        req.app.result = {Error: '500'};
                                        next();
                                    }
                                    //             console.log('storeTweetDetails', results.data[0].data);
                                    if (dataFromDb[j].data != null) {
                                        /*   results.data[0].data.forEach(function (value, index) {
                                         //if (String(results.metric[0]._id) == String(results.get_channel_data_remote.data.metricId))
                                         storeTweetDetails.push(value);

                                         })*/
                                        var updated = moment(dataFromDb[j].updated).format('YYYY-MM-DD');
                                        var startDate = dataFromDb[j].updated;
                                        if (dataFromDb[j].updated < new Date()) {
                                            if (moment(dataFromDb[j].updated).format('YYYY-MM-DD') != moment(new Date()).format('YYYY-MM-DD')) {

                                                startDate.setDate(startDate.getDate() + 1);
                                                var daysDifference = populateDefaultData(startDate, currentDate, 1);

                                            }
                                            //storeTweetDetails = daysDifference;
                                        }

                                    }
                                    else {
                                        var d = new Date();
                                        d.setDate(d.getDate() - 365);

                                        var startDate = moment(new Date()).format('YYYY-MM-DD');
                                        var daysDifference = populateDefaultData(startDate, currentDate);
                                    }
                                    //Function to find days difference
                                    function findDaysDifference(startDate, endDate) {
                                        var storeDefaultValues = [];
                                        //d.setDate(d.getDate() + 1);
                                        var storeStartDate = new Date(startDate);
                                        var storeEndDate = new Date(endDate);

                                        var timeDiff = Math.abs(storeEndDate.getTime() - storeStartDate.getTime());
                                        var diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24));

                                        for (var i = 0; i <= diffDays; i++) {

                                            var finalDate = moment(storeStartDate).format('YYYY-MM-DD');
                                            storeDefaultValues.push({date: finalDate, total: 0});
                                            storeStartDate.setDate(storeStartDate.getDate() + 1);
                                        }
                                        //  console.log('storeDefaultValues', storeDefaultValues);
                                        return storeDefaultValues;
                                    }

                                    function populateDefaultData(startDate, currentDate, updated) {
                                        var daysDifference = findDaysDifference(startDate, currentDate);
                                        // console.log('daysdiff', daysDifference, startDate, currentDate);
                                        var defaultArrayLength = daysDifference.length;
                                        var tweetsLength = storeTweetDetails.length;
                                        for (var i = 0; i < defaultArrayLength; i++) {
                                            for (var k = 0; k < tweetsLength; k++) {
                                                if (daysDifference[i].date === storeTweetDetails[k].date) {
                                                    console.log('inif');
                                                    daysDifference[i] = storeTweetDetails[k]
                                                }
                                            }
                                        }
                                        storeTweetDetails = daysDifference;
                                        //return daysDifference;

                                    }


                                    if (dataFromDb[j].data != 'DataFromDb') {

                                        if (dataFromDb[j].data != null) {
                                            var dataLength = dataFromDb[j].data.length
                                            console.log('tata', storeTweetDetails.length);
                                            for (var key = 0; key < dataLength; key++) {
                                                storeTweetDetails.push(dataFromDb[j].data[key]);
                                            }
                                        }

                                        //check if dates are equal
                                        //also check if same date is in db  if yes then replace it with storeRemoteData


                                        uniqueChannelArray = _.uniqBy(storeTweetDetails, 'date');
                                        var array = [1, 20, 50, 60, 78, 90];
                                        /*var date = storeTweetDetails[findDuplicate];
                                         console.log('without',_.without(storeTweetDetails, date));*/
                                        storeTweetDetails = uniqueChannelArray
                                        var findDuplicate = _.findIndex(storeTweetDetails, function (o) {
                                            return o.date == storeRemoteData[0].date;
                                        });
                                        console.log('findDuplicate', metric[j]._id, findDuplicate, storeTweetDetails[findDuplicate])
                                        if (findDuplicate >= 0) {
                                            console.log('index');
                                            storeTweetDetails[findDuplicate] = storeRemoteData[0];
                                        }
                                        else
                                            storeTweetDetails.push(storeRemoteData[0])


                                        /*console.log(_.findIndex(storeTweetDetails, function (o) {
                                         return o.date == storeRemoteData[0].date;
                                         }), 'ss')*/
                                        next(null, storeTweetDetails);
                                        /* var now = new Date();
                                         Data.update({
                                         'objectId': results.data[0].objectId,
                                         'metricId': results.data[0].metricId
                                         }, {
                                         $setOnInsert: {created: now},
                                         $set: {data: storeTweetDetails, updated: now}
                                         }, {upsert: true}, function (err) {
                                         if (err) console.log("User not saved", err);
                                         else
                                         callback(null, 'success')
                                         });*/

                                    }

                                }
                                else {
                                    req.app.result = {Error: '500'};
                                    next('error');
                                }
                            }
                            else if (results.metric[0].code === configAuth.twitterMetric.highEngagementTweets) {
                                next(null, results.get_channel_data_remote[j]);
                            }
                            else {
                                console.log('Wrong Metric')
                            }
                        }

                        /*  }, done)
                         }*/
                    }
                    else if (channel[j].code == configAuth.channels.instagram) {

                        var finalData = [];
                        if (metric[j].objectTypes[0].meta.endpoint === 'user_media_recent') {
                            console.log('insideofuser_media_recent')
                            next(null, dataFromRemote[j])

                        }
                        else {
                            if (dataFromRemote[j].apiResponse != 'DataFromDb') {

                                //Array to hold the final result
                                for (var key in dataFromRemote) {
                                    if (String(metric[j]._id) == String(dataFromRemote[key].metricId))
                                        finalData = dataFromRemote[key].apiResponse;
                                }
                                var findCurrentDate = _.findIndex(finalData, function (o) {
                                    return o.date == moment(new Date).format('YYYY-MM-DD');
                                });
                                if (dataFromDb[j].data != null) {

                                    //merge the old data with new one and update it in db
                                    for (var key = 0; key < dataFromDb[j].data.length; key++) {
                                        if (dataFromDb[j].data[key].date === moment(new Date).format('YYYY-MM-DD'))
                                            finalData[findCurrentDate] = dataFromDb[j].data[key];
                                        else
                                            finalData.push(dataFromDb[j].data[key]);
                                    }

                                }
                                next(null, finalData)

                            }
                            else {
                                next(null, 'DataFromDb')
                            }
                        }
                    }
                }, callback)
            }

        }


        //This function is to update the data in bulk
        function storeFinalData(results, callback) {
            console.log('storefinaldata')
            var updatedFinalData = results.merge_all_final_data;
            var bulk = Data.collection.initializeOrderedBulkOp();
            var  bulkExecute;
            var now = new Date();

            //set the update parameters for query
             bulkExecute = false;
            for (var i = 0; i < updatedFinalData.length; i++) {
                if (results.merge_all_final_data[i] != 'DataFromDb') {
                     bulkExecute = true;
                    console.log('forloop', i, updatedFinalData.length, results.data[i].objectId, results.data[i].metricId)

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
            console.log('bulk update', bulk);
            if (bulkExecute === true) {
                //Doing the bulk update
                bulk.execute(function (err, response) {
                    console.log('errr', err, response, response.nMatched, 'nModified', response.nModified, 'nUpserted', response.nUpserted)
                    callback(err, 'success');
                });
            }
        }
    }
});

agenda.on('ready', function () {
    //agenda.every('1 minutes', 'Update channel data');
    agenda.now('Update channel data')
    agenda.start();
});
agenda.on('start', function (job) {
    console.log("Job %s starting", job.attrs.name);
});