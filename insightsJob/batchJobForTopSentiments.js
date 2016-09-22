var FB = require('fb');
var _ = require('lodash');
var async = require("async");
var Data=require('../models/insightData');
var Widget=require('../models/widgets');
var configAuth = require('../config/auth');
var moment = require('moment');
//Importing the request module
var request = require('request'); 

module.exports = function(agenda) {

    agenda.define('topSentiment', function(job, done) {
        init();
        function init (){
            var pageId=job.attrs.data.widget[0].competitors[0].remoteObjectId;
            var widgetId=job.attrs.data.widgetId;
                FB.api(
                    '/oauth/access_token',
                    'GET',
                    {
                        "client_id": configAuth.facebookAuth.clientID,
                        "client_secret": configAuth.facebookAuth.clientSecret,
                        "": null,
                        "grant_type": "client_credentials",
                        "redirect_uri": configAuth.facebookAuth.callbackURL
                    },
                    function (response) {
                        var accessToken = response.access_token;
                        //Array to hold the list for a given page id
                        var finalPostList = [];
                        var d = new Date();
                        //Store the end date
                        var endDate = moment(d).format('YYYY-MM-DD');
                        //To set start date ,before 2weeks
                        d.setDate(d.getDate() - 30);

                        //Store start date
                        var startDate = moment(d).format('YYYY-MM-DD');
                        var query = configAuth.apiVersions.FBInsightsUpdated + '/' + pageId + '?fields=posts.until(' + endDate + ').since(' + startDate + ')&access_token=' + accessToken;
                        async.auto({
                            get_all_posts: callGetPostApi,
                            get_all_reactions: ['get_all_posts', getAllReactions],
                            format_Remote_data:['get_all_reactions', formatRemoteData],
                            store_final_data:['format_Remote_data', storeFinalData]
                        }, function (err, results) {
                            done(err);
                        })
                        //to get the list of posts for a given page id
                        function callGetPostApi(callback) {
                            getPostList(query);
                            function getPostList(query) {
                                /* make the API call */
                                FB.api(
                                    query,
                                    function (postList) {
                                        if(postList.error){
                                            callback(null)
                                        }
                                        //First time data array will come inside posts object
                                        if (postList.posts != undefined && postList.posts.data != undefined &&postList.posts.paging != undefined) {

                                            //To get the query from next param
                                            var query = postList.posts.paging.next.substr(postList.posts.paging.next.indexOf('v'));
                                            for (var key in postList.posts.data) {
                                                finalPostList.push({
                                                    postId: postList.posts.data[key].id,
                                                    postName: postList.posts.data[key].message
                                                });
                                            }

                                            return getPostList(query);
                                        }
                                        else if (postList.posts == undefined && postList.data && postList.data.length) {

                                            //To get the query from next param
                                            var query = postList.paging.next.substr(postList.paging.next.indexOf('v'));
                                            for (var key in postList.data)
                                                finalPostList.push({
                                                    postId: postList.data[key].id,
                                                    postName: postList.data[key].message
                                                });
                                            return getPostList(query);
                                        }
                                        else
                                            callback(null, finalPostList);
                                    }
                                );
                            }
                        }
                        function getAllReactions(results, callback) {
                            var finalReactionList = [];
                            var totalReactions = [];
                            async.concatSeries(results.get_all_posts, getEachPostReactions, function (err, responseCb) {
                                callback(null, _.uniqBy(responseCb, 'postId'))
                            })
                            function getEachPostReactions(postDetail, callback) {
                                var reactionsQuery = configAuth.apiVersions.FBInsightsUpdated + '/?' +'id=' +postDetail.postId + '&fields=reactions.limit(1500)&access_token=' + accessToken;
                                getAllReactionsWithPagination(reactionsQuery);
                                function getAllReactionsWithPagination(query) {
                                    FB.api(
                                        query,
                                        function (reactionDetails) {
                                            if(reactionDetails.error){
                                             callback(null)
                                            }
                                            if (reactionDetails.reactions != undefined &&reactionDetails.reactions.paging !=undefined && reactionDetails.reactions.paging.next != undefined) {

                                                for (var key in reactionDetails.reactions.data) {
                                                    finalReactionList.push({
                                                        postId: postDetail.postId,
                                                        postName: postDetail.postName,
                                                        id: reactionDetails.reactions.data[key].id,
                                                        name: reactionDetails.reactions.data[key].name,
                                                        type: reactionDetails.reactions.data[key].type,
                                                    });
                                                }
                                                //if (reactionDetails.reactions.paging.next != undefined) {
                                                //To get the query from next param
                                                var query = reactionDetails.reactions.paging.next.substr(reactionDetails.reactions.paging.next.indexOf('v'));
                                                return getAllReactionsWithPagination(query);
                                                //}
                                            }
                                            else if (reactionDetails.reactions == undefined &&reactionDetails.data !=undefined && reactionDetails.data.length && reactionDetails.paging.next !== undefined) {
                                                //To get the query from next param
                                                var query = reactionDetails.paging.next.substr(reactionDetails.paging.next.indexOf('v'));
                                                for (var key in reactionDetails.data)
                                                    finalReactionList.push({
                                                        postId: postDetail.postId,
                                                        postName: postDetail.postName,
                                                        id: reactionDetails.data[key].id,
                                                        name: reactionDetails.data[key].name,
                                                        type: reactionDetails.data[key].type
                                                    });
                                                return getAllReactionsWithPagination(query);
                                            }

                                            else {
                                                if (reactionDetails.reactions != undefined) {
                                                    for (var key in reactionDetails.reactions.data) {
                                                        finalReactionList.push({
                                                            postId: postDetail.postId,
                                                            postName: postDetail.postName,
                                                            id: reactionDetails.reactions.data[key].id,
                                                            name: reactionDetails.reactions.data[key].name,
                                                            type: reactionDetails.reactions.data[key].type,
                                                        });
                                                    }
                                                }
                                                else {
                                                    for (var key in reactionDetails.data) {
                                                        finalReactionList.push({
                                                            postId: postDetail.postId,
                                                            postName: postDetail.postName,
                                                            id: reactionDetails.data[key].id,
                                                            name: reactionDetails.data[key].name,
                                                            type: reactionDetails.data[key].type,
                                                        });
                                                    }
                                                }
                                                var groupedReactionByPosts = _.groupBy(finalReactionList, 'postId');
                                                var countArray = [];
                                                var groupReactionsByType = _.groupBy(groupedReactionByPosts[postDetail.postId], 'type');
                                                var obj = {};
                                                for (var index in groupReactionsByType) {
                                                    var mergedObject;
                                                    obj[index] = groupReactionsByType[index].length;
                                                    mergedObject = obj;
                                                }
                                                countArray.push(obj);
                                                totalReactions.push({
                                                    count: obj,
                                                    postId: postDetail.postId,
                                                    postName: postDetail.postName
                                                })
                                                for (var i = 0; i < totalReactions.length; i++) {
                                                    if (!('LIKE' in totalReactions[i].count )) totalReactions[i].count = _.merge({LIKE: 0}, totalReactions[i].count)
                                                    if (!('LOVE' in totalReactions[i].count )) totalReactions[i].count = _.merge({LOVE: 0}, totalReactions[i].count)
                                                    if (!('HAHA' in totalReactions[i].count )) totalReactions[i].count = _.merge({HAHA: 0}, totalReactions[i].count)
                                                    if (!('WOW' in totalReactions[i].count )) totalReactions[i].count = _.merge({WOW: 0}, totalReactions[i].count)
                                                    if (!('SAD' in totalReactions[i].count )) totalReactions[i].count = _.merge({SAD: 0}, totalReactions[i].count)
                                                    if (!('ANGRY' in totalReactions[i].count )) totalReactions[i].count = _.merge({ANGRY: 0}, totalReactions[i].count)
                                                }
                                                var uniquePostReaction = _.uniqBy(totalReactions, 'postId');
                                                callback(null, uniquePostReaction);
                                            }
                                        })
                                }

                            }
                        }
                        function formatRemoteData(results, callback) {
                            var sampleArray=[];
                            var totalReaction={
                                "ANGRY": 0,
                                "SAD": 0,
                                "WOW": 0,
                                "HAHA": 0,
                                "LOVE": 0,
                                "LIKE":0
                            }
                            var topPostReaction={
                                "ANGRY": 0,
                                "SAD": 0,
                                "WOW": 0,
                                "HAHA": 0,
                                "LOVE": 0,
                                "LIKE":0
                            };
                            results.get_all_reactions.forEach(function (item) {
                                    for(var index in item.count) {
                                        totalReaction[index]  += item.count[index];
                                        if (item.count.hasOwnProperty(index)) {
                                            sampleArray.push({
                                                'key': index,
                                                'value': item.count[index]
                                            });
                                        }
                                    }
                                    sampleArray.sort(function(a, b) {
                                        return a.value - b.value;
                                    });
                                    sampleArray.reverse()
                                    topPostReaction[sampleArray[0].key]++;
                                }
                            )
                            callback(null,topPostReaction,totalReaction)
                        }
                        function storeFinalData(results, callback) {
                            var now=new Date();
                            Data.update({
                                'widgetId':widgetId
                            }, {
                                $setOnInsert: {created: now},
                                $set: {
                                    data: results.format_Remote_data,
                                }
                            }, {upsert: true}, function (err,data) {
                                if (err)
                                    callback(null);
                                else if (data == 0)
                                    callback(null)
                                else{
                                   callback(null,'success')
                                }
                            })
                        }
                    }
                );
        }
    })
}