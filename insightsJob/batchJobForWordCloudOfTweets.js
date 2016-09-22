var async = require('async');
//Load the auth file
var configAuth = require('../config/auth');
var InsightsData = require('../models/insightData')
//set Twitter module
var Twitter = require('twitter');
var client = new Twitter({
    consumer_key: configAuth.twitterAuth.consumerKey,
    consumer_secret: configAuth.twitterAuth.consumerSecret,
    access_token_key: configAuth.twitterAuth.AccessToken,
    access_token_secret: configAuth.twitterAuth.AccessTokenSecret
});

module.exports = function(agenda) {
    agenda.define('wordCloudOfTweets',function (job,done) {
            var index = 0;
            var oldMaxId;
            var d = new Date();
            //Store the end date
            req.body.endDate = moment(d).format('YYYY-MM-DD');

            //To set start date ,before 6 months
            d.setDate(d.getDate() - 30);
            //Store start date
            req.body.startDate = moment(d).format('YYYY-MM-DD');
            async.auto({
                get_tweets_for_allpages: getTweetForAllPages,
                store_data:['get_tweets_for_allpages',storeDataInDb],
            }, function (err, results) {
                if (err) {
                    return done(err, null);
                }
                done(null, results.get_tweets_for_allpages);
            });
            function getTweetForAllPages(callback) {
                callGetTweets(index, configAuth.twitterQuery.getTweets, callback);
                function callGetTweets(index, query, next) {
                    async.timesSeries(job.attrs.data.widget[0].user.length, function (i, callback) {
                        var remoteObjectId = job.attrs.data.widget[0].user[i].userId;
                        var remoteName = job.attrs.data.widget.user[i].name;
                        var finalTweetsResponse = [];
                        var finalTwitterResponse = [];
                        var tweetsString;
                        var inputs = {
                            user_id: remoteObjectId,
                            screen_name: remoteName,
                            count: configAuth.twitterQuery.count
                        };
                        getTweets(index, query, inputs);
                        function getTweets(index, query, inputs) {
                            client.get(query, inputs, function (error, tweets, response) {
                                if (typeof tweets == 'string') var tweets = JSON.parse(JSON.stringify(tweets))
                                if (index == 0 && tweets.length == 0) {
                                    for (var k = 0; k < tweets.length; k++) {
                                        finalTwitterResponse.push(tweets[k]);
                                    }
                                    storingProcess(finalTwitterResponse);
                                }
                                else if (index == 0 && tweets.length != 0) {
                                    oldMaxId = tweets[tweets.length - 1].id;
                                    tweets.forEach(function (value, index) {
                                        finalTwitterResponse.push(tweets[index]);
                                    });
                                    inputs = {
                                        user_id: remoteObjectId,
                                        screen_name: remoteName,
                                        max_id: oldMaxId,
                                        count: configAuth.twitterQuery.count
                                    };
                                    index++;
                                    getTweets(index, configAuth.twitterQuery.getTweets, inputs);
                                }
                                else if (index != 0 && tweets.length != 0) {
                                    if (oldMaxId === tweets[tweets.length - 1].id) {
                                        tweets.forEach(function (value, index) {
                                            finalTwitterResponse.push(tweets[index]);
                                        });
                                        storingProcess(finalTwitterResponse);
                                    }
                                    else {
                                        oldMaxId = tweets[tweets.length - 1].id;
                                        tweets.forEach(function (value, index) {
                                            finalTwitterResponse.push(tweets[index]);
                                        });
                                        inputs = {
                                            user_id: remoteObjectId,
                                            screen_name: remoteName,
                                            max_id: oldMaxId,
                                            count: configAuth.twitterQuery.count
                                        };
                                        getTweets(index, configAuth.twitterQuery.getTweets, inputs);
                                    }
                                }
                                else if (index != 0 && tweets.length == 0)
                                    storingProcess(finalTwitterResponse)
                                function storingProcess(wholeTweetObjects) {
                                    for (var j = 0; j < wholeTweetObjects.length; j++) {
                                        var changeFormatCreateAt = moment((new Date(Date.parse(wholeTweetObjects[j].created_at)))).format('YYYY-MM-DD');
                                        //var changeFormatCreateAt = moment.utc(lastCreatedAt).unix();
                                        var startDate = moment(req.body.startDate).format('YYYY-MM-DD');
                                        var endDate = moment(req.body.endDate).format('YYYY-MM-DD');
                                        if (changeFormatCreateAt >= startDate && changeFormatCreateAt <= endDate) {
                                            finalTweetsResponse.push(wholeTweetObjects[j]);
                                            tweetsString = tweetsString + wholeTweetObjects[j].text
                                        }
                                    }
                                    var count = 0;
                                    async.concatSeries(finalTweetsResponse, getFinalTweetsArray, function (err, tweetsString) {
                                        callback(null, {tweetsString: tweetsString, remoteObjectId: remoteObjectId,name:remoteName})
                                    });
                                    function getFinalTweetsArray(tweetResponse, callback) {
                                        if (tweetResponse.retweet_count) {
                                            return getReTweets(count, configAuth.twitterQuery.getRetweets + tweetResponse.id_str + '.json', '');
                                        }
                                        else return callback(null, null)
                                        //else storeRetweets(finalTweetsResponse);
                                        function getReTweets(count, getRetweets, inputs) {
                                            client.get(getRetweets, inputs, function (error, reTweets, response) {
                                                //todo error handling
                                                if (typeof reTweets == 'string') var reTweets = JSON.parse(reTweets)
                                                if (count == 0 && reTweets.length == 0 ||reTweets===undefined) {
                                                    for (var i = 0; i < reTweets.length; i++) {
                                                        finalTweetsResponse.push(reTweets[index]);
                                                    }
                                                    storeRetweets(finalTweetsResponse);
                                                }
                                                else if (count == 0 && reTweets.length != 0) {
                                                    oldMaxId = reTweets[reTweets.length - 1].id_str;
                                                    reTweets.forEach(function (value, index) {
                                                        finalTweetsResponse.push(reTweets[index]);
                                                    });
                                                    inputs = {
                                                        max_id: oldMaxId,
                                                        //count: configAuth.twitterQuery.count
                                                    };
                                                    count++;
                                                    getReTweets(count, getRetweets, inputs);
                                                }
                                                else if (count != 0 && reTweets.length != 0) {
                                                    if (oldMaxId == reTweets[reTweets.length - 1].id_str) {
                                                        reTweets.forEach(function (value, index) {
                                                            finalTweetsResponse.push(reTweets[index]);
                                                        });
                                                        storeRetweets(finalTweetsResponse);
                                                    }
                                                    else {
                                                        oldMaxId = reTweets[reTweets.length - 1].id_str;
                                                        reTweets.forEach(function (value, index) {
                                                            finalTweetsResponse.push(reTweets[index]);
                                                        });
                                                        inputs = {
                                                            max_id: oldMaxId,
                                                            //count: configAuth.twitterQuery.count
                                                        };
                                                        getReTweets(count, getRetweets, inputs);
                                                    }
                                                }
                                                else if (count != 0 && reTweets.length == 0) {
                                                    storeRetweets(finalTweetsResponse);
                                                }
                                                else console.log('plain else')
                                                function storeRetweets(wholeTweetObjects) {
                                                    tweetsString = '';
                                                    for (var i = 0; i < wholeTweetObjects.length; i++) {
                                                        tweetsString = tweetsString + wholeTweetObjects[i].text;
                                                    }
                                                    var convertToCommaSeperated = tweetsString.split(" ");
                                                    callback(null, convertToCommaSeperated);
                                                }
                                            })
                                        }
                                    }
                                }
                            })
                        }
                    }, next)
                }
            }
            function storeDataInDb(results, callback) {
                var now= new Date();
                InsightsData.update({widgetId: job.attrs.data.widget.widgetId}, {
                    $setOnInsert: {created: now},
                    $set: {
                        data: results.get_tweets_for_allpages,
                        savedTime: now
                    }
                },{upsert: true}, function (err, data) {
                    if (err) callback(err,null)
                    else if (!data)
                        return res.status(501).json({error: 'Not implemented', id: job.attrs.data.widget.widgetId})
                    else callback(null, 'success')
                })
            }
    })
}
