var FB = require('fb');
var _ = require('lodash');
var async = require("async");
var configAuth = require('../config/auth');
var moment = require('moment');
//Importing the request module
var request = require('request');

//Define exports
var exports = module.exports = {};


exports.getInsights = function (req, res, done) {
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
                    d.setDate(d.getDate() - 14);

                    //Store start date
                    var startDate = moment(d).format('YYYY-MM-DD');
                    var query = configAuth.apiVersions.FBInsightsUpdated + '/' + req.query.pageId + '?fields=posts.until(' + endDate + ').since(' + startDate + ')&access_token=' + accessToken;
                    async.auto({
                        get_all_posts: callGetPostApi,
                        get_all_reactions: ['get_all_posts', getAllReactions],
                        store_final_data:['get_all_reactions',storedFinalData]
                    }, function (err, results) {
                        if (err)
                            return res.status(500).json({error: 'Internal server error', id: req.params.widgetId})
                        var finalObject = [],
                            finalObject =  results.store_final_data
                        req.app.result = finalObject;
                        done(null,finalObject);
                    })
                    //to get the list of posts for a given page id
                    function callGetPostApi(callback) {
                        getPostList(query);
                        function getPostList(query) {
                            /* make the API call */
                            FB.api(
                                query,
                                function (postList) {
                                    if(postList.error) return res.status(500).json({error: 'Internal server error'})
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

                    //To get the comment details
                    // function getCommentData(results, callback) {
                    //     console.log('getCommentData')
                    //     var finalCommentList = [];
                    //     async.concatSeries(results.get_all_posts, getTotalCommentsForEachPost, callback);
                    //     function getTotalCommentsForEachPost(postDetail, callback) {
                    //         var query = configAuth.apiVersions.FBInsightsUpdated + '/' + postDetail.postId + '/comments?limit=3000&access_token=' + accessToken;
                    //         getAllCommentsWithPagination(query);
                    //         function getAllCommentsWithPagination(commentQuery) {
                    //             // make the API call
                    //             FB.api(
                    //                 commentQuery,
                    //                 function (commentList) {
                    //                     if(commentList.error) return res.status(500).json({error: 'Internal server error'})
                    //                     //To check the next in data array
                    //                     if (commentList.data.length && commentList.paging.next) {
                    //
                    //                         //To get the query from next param
                    //                         var query = commentList.paging.next.substr(commentList.paging.next.indexOf('v'));
                    //                         for (var key in commentList.data)
                    //                             finalCommentList.push({
                    //                                 id: commentList.data[key].id,
                    //                                 name: commentList.data[key].from.name,
                    //                                 postId: postDetail.postId,
                    //                                 postName: postDetail.postName
                    //                             });
                    //                         return getAllCommentsWithPagination(query);
                    //                     }
                    //                     else if (commentList.data.length && commentList.paging.next == undefined) {
                    //                         for (var key in commentList.data)
                    //                             finalCommentList.push({
                    //                                 id: commentList.data[key].id,
                    //                                 name: commentList.data[key].from.name,
                    //                                 postId: postDetail.postId,
                    //                                 postName: postDetail.postName
                    //                             });
                    //                     }
                    //                     else {
                    //                         for (var key in commentList.data) {
                    //                             finalCommentList.push({
                    //                                 id: commentList.data[key].id,
                    //                                 name: commentList.data[key].from.name,
                    //                                 postId: postDetail.postId,
                    //                                 postName: postDetail.postName
                    //                             });
                    //                         }
                    //                     }
                    //                     callback(null, finalCommentList);
                    //                 }
                    //             );
                    //         }
                    //     }
                    // }

                    //To get the like details
                    // function getLikeData(results, callback) {
                    //     console.log('getLikeData')
                    //     var finalLikeList = [];
                    //     async.concatSeries(results.get_all_posts, getTotalLikesForEachPost, callback);
                    //     function getTotalLikesForEachPost(postDetail, callback) {
                    //         var likeQuery = configAuth.apiVersions.FBInsightsUpdated + '/' + postDetail.postId + '/likes?limit=3000&access_token=' + accessToken;
                    //         getAllLikesWithPagination(likeQuery);
                    //         function getAllLikesWithPagination(query) {
                    //
                    //             // make the API call
                    //             FB.api(
                    //                 query,
                    //                 function (likeDetails) {
                    //                     if(likeDetails.error) return res.status(500).json({error: 'Internal server error'})
                    //                     //To check the next in data array
                    //                     if (likeDetails.data.length && likeDetails.paging.next) {
                    //
                    //                         //To get the query from next param
                    //                         var query = likeDetails.paging.next.substr(likeDetails.paging.next.indexOf('v'));
                    //                         for (var key in likeDetails.data)
                    //                             finalLikeList.push({
                    //                                 id: likeDetails.data[key].id,
                    //                                 name: likeDetails.data[key].id,
                    //                                 postId: postDetail.postId,
                    //                                 postName: postDetail.postName
                    //                             });
                    //                         return getAllLikesWithPagination(query);
                    //                     }
                    //                     else if (likeDetails.data.length && likeDetails.paging.next == undefined) {
                    //                         for (var key in likeDetails.data)
                    //                             finalLikeList.push({
                    //                                 id: likeDetails.data[key].id,
                    //                                 name: likeDetails.data[key].id,
                    //                                 postId: postDetail.postId,
                    //                                 postName: postDetail.postName
                    //                             });
                    //                     }
                    //                     else {
                    //                         for (var key in likeDetails.data)
                    //                             finalLikeList.push({
                    //                                 id: likeDetails.data[key].id,
                    //                                 name: likeDetails.data[key].id,
                    //                                 postId: postDetail.postId,
                    //                                 postName: postDetail.postName
                    //                             });
                    //                     }
                    //                     callback(null, finalLikeList);
                    //                 }
                    //             );
                    //         }
                    //     }
                    // }
                    //
                    // function getShares(results, callback) {
                    //     console.log('getShares')
                    //     async.concatSeries(results.get_all_posts, getTotalSharesEachPost, callback);
                    //     function getTotalSharesEachPost(postDetail, callback) {
                    //         var shareList = [];
                    //         var shareQuery = configAuth.apiVersions.FBInsightsUpdated + '/' + postDetail.postId + '?fields=shares&access_token=' + accessToken;
                    //         FB.api(
                    //             shareQuery,
                    //             function (shareDetails) {
                    //                 if(shareDetails.error) return res.status(500).json({error: 'Internal server error'})
                    //                 if (!shareDetails.shares) {
                    //                     shareList.push({
                    //                         shares: 0,
                    //                         postId: postDetail.postId,
                    //                         postName: postDetail.postName
                    //                     })
                    //                 }
                    //                 else {
                    //                     shareList.push({
                    //                         shares: shareDetails.shares.count,
                    //                         postId: postDetail.postId,
                    //                         postName: postDetail.postName
                    //                     })
                    //                 }
                    //                 callback(null, shareList);
                    //             })
                    //     }
                    // }
                    //
                    // //To get reactions for each post
                    // function combineAllImpressions(results, callback) {
                    //     var totalComments = [];
                    //     var totalLikes = [];
                    //     var postLength = results.get_all_posts.length;
                    //     var groupedComments = _.groupBy(results.get_all_comments, 'postId');
                    //     var groupedLikes = _.groupBy(results.get_all_likes, 'postId');
                    //     for (var i = 0; i < postLength; i++) {
                    //         for (var key in groupedComments) {
                    //             if (key === results.get_all_posts[i].postId) {
                    //                 totalComments.push({
                    //                     comments: groupedComments[key].length,
                    //                     postId: results.get_all_posts[i].postId,
                    //                     postName: results.get_all_posts[i].postName,
                    //
                    //                 })
                    //             }
                    //         }
                    //     }
                    //     for (var i = 0; i < postLength; i++) {
                    //         for (var key in groupedLikes) {
                    //             if (key === results.get_all_posts[i].postId) {
                    //                 totalLikes.push({
                    //                     likes: groupedLikes[key].length,
                    //                     postId: results.get_all_posts[i].postId,
                    //                     postName: results.get_all_posts[i].postName
                    //                 })
                    //             }
                    //         }
                    //     }
                    //     for (var j = 0; j < postLength; j++) {
                    //         var findCommentIndex = _.findIndex(totalComments, function (o) {
                    //             return o.postId == results.get_all_posts[j].postId;
                    //         });
                    //         if (findCommentIndex === -1) {
                    //             totalComments.push({
                    //                 comments: 0,
                    //                 postId: results.get_all_posts[j].postId,
                    //                 postName: results.get_all_posts[j].postName
                    //             })
                    //         }
                    //         var findLikeIndex = _.findIndex(totalLikes, function (o) {
                    //             return o.postId == results.get_all_posts[j].postId;
                    //         });
                    //         if (findLikeIndex === -1) {
                    //             totalLikes.push({
                    //                 likes: 0,
                    //                 postId: results.get_all_posts[j].postId,
                    //                 postName: results.get_all_posts[j].postName
                    //             })
                    //         }
                    //     }
                    //     var finalCount = totalComments.concat(totalLikes);
                    //     var finalImpressionObject = finalCount.concat(results.get_shares);
                    //     var groupedComments = _.groupBy(finalImpressionObject, 'postId');
                    //     var finalValue;
                    //     var finalImpressionArray = [];
                    //     for (var key = 0; key < results.get_all_posts.length; key++) {
                    //         finalValue = groupedComments[results.get_all_posts[key].postId][0]
                    //         for (var i = 1; i < groupedComments[results.get_all_posts[key].postId].length; i++) {
                    //             finalValue = _.merge(finalValue, groupedComments[results.get_all_posts[key].postId][i]);
                    //         }
                    //         finalImpressionArray.push(finalValue)
                    //     }
                    //     var impressions = [];
                    //     for (var i = 0; i < finalImpressionArray.length; i++) {
                    //         impressions.push({
                    //             postId: finalImpressionArray[i].postId,
                    //             postName: finalImpressionArray[i].postName,
                    //             count: {
                    //                 comments: finalImpressionArray[i].comments,
                    //                 likes: finalImpressionArray[i].likes,
                    //                 shares: finalImpressionArray[i].shares
                    //             }
                    //         })
                    //     }
                    //     callback(null, impressions)
                    // }

                    function getAllReactions(results, callback) {
                        var finalReactionList = [];
                        var totalReactions = [];
                        async.concatSeries(results.get_all_posts, getEachPostReactions, function (err, responseCb) {
                            callback(null, _.uniqBy(responseCb, 'postId'))
                        })
                        function getEachPostReactions(postDetail, callback) {
                            var reactionsQuery = configAuth.apiVersions.FBInsightsUpdated + '/?' +'id=' +postDetail.postId + '&fields=reactions.limit(3000)&access_token=' + accessToken;
                            getAllReactionsWithPagination(reactionsQuery);
                            function getAllReactionsWithPagination(query) {
                                FB.api(
                                    query,
                                    function (reactionDetails) {
                                        if(reactionDetails.error) return res.status(500).json({error: 'Internal server error'})
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
                    function storedFinalData(results, callback) {
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
                            }
                            ;                        results.get_all_reactions.forEach(function (item) {
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
        }
    );
}