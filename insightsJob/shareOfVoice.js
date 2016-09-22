
var FB = require('fb');//Importing the fb module
var request = require('request');
var async = require("async");
var Object = require('../models/objects');
// load the auth variables
var configAuth = require('../config/auth');
var exports = module.exports = {};
var _ = require('lodash');
var Data=require('../models/insightData');


/**
 Function to list the pages based on user request
 @params 1.req contains the  user request i.e search key
 2.done callback
 */
module.exports = function(agenda) {
agenda.define('shareOfVoice', function(job, done) {
    init();
    init
    {
        var app_access_token;
        var finalPostList = [];
        var findFinalResult = [];
        var postCallCount = 0;
        var commentsCallCount = 0;
        var d = new Date();
        d.setDate(d.getDate() - 30);
        var startDate = moment(d).format('YYYY-MM-DD');
        var endDate = moment(new Date()).format('YYYY-MM-DD');

        function generateApp_access_token(callback) {
            FB.api(
                "oauth/access_token",
                {
                    client_id: configAuth.facebookAuth.clientID,
                    client_secret: configAuth.facebookAuth.clientSecret,
                    grant_type: "client_credentials",
                    redirect_uri: configAuth.facebookAuth.callbackURL
                },
                function (response) {
                    app_access_token = response.access_token;
                    callAsyncFunction();
                });
        }

        generateApp_access_token();
        function callAsyncFunction() {
            async.auto({
                get_object: getObject,
                get_all_pages: ['get_object', callCompetitorsPages],
                get_all_posts: ['get_all_pages', getPosts],
                get_all_comments: ['get_all_pages', 'get_all_posts', getCommentData],
                get_merge_function: ['get_all_pages', 'get_all_posts', 'get_all_comments', getPostsCommentsMergeFunction],
                store_In_Db: ['get_all_pages', 'get_all_posts', 'get_all_comments', 'get_merge_function', storeFinalDataInDb]
            }, function (err, results) {
                done(err);
            });
        }

        //Function to get the data in object collection
        function getObject(results, callback) {
            async.concatSeries(results.widget.charts, getEachObject, callback);
        }

//Function to get each object details
        function getEachObject(callback) {
            Object.find({'_id': job.attrs.data.widget[0].objectId}, {
                profileId: 1,
                channelObjectId: 1,
                objectTypeId: 1,
                name: 1,
                channelId: 1,
                meta: 1
            }, checkNullObject(callback));
        }

        function callCompetitorsPages(results, callback) {
            var pageIds = [];
            for (var i = 0; i < job.attrs.data.widget[0].competitors.length; i++) {
                pageIds.push({
                    id: job.attrs.data.widget[0].competitors[i].remoteObjectId,
                    name: job.attrs.data.widget[0].competitors[i].name
                });
            }
            pageIds.push({
                id: results.get_object[0].channelObjectId,
                name: results.get_object[0].name
            });
            callback(null, pageIds);
        }

        function storeFinalDataInDb(results, callback) {

            var now = new Date();

            //Updating the old data with new one
            Data.update({
                'widgetId': job.attrs.data.widgetId,
                'objectId': results.get_object[0]._id
            }, {
                $setOnInsert: {saveTime: now},
                $set: {
                    data: results.get_merge_function,
                    updated: now,
                    created: now

                }
            }, {upsert: true}, function (err, data) {
                if (err)
                    return res.status(500).json({
                        error: 'Internal server error'
                    })
                else if (data == 0)
                    return res.status(501).json({error: 'Not implemented'})
                else callback(null, 'success')
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


        function getPosts(result, callback) {
            async.concatSeries(result.get_all_pages, getPostForPages, callback);
        }

        function getPostForPages(result, callback) {
            var apiQuery = configAuth.apiVersions.FBInsightsUpdated + '/' + result.id + '/posts?until=' + endDate + '&since=' + startDate + '&access_token=' + app_access_token;
            getPostList(apiQuery);
            function getPostList(query) {
                /* make the API call */

                FB.api(
                    query,
                    function (postList) {
                        postCallCount++;
                        if (postList.error) {
                            callback(null)
                        }
                        //First time data array will come inside posts object
                        if (postList.paging != undefined) {
                            //To get the query from next param
                            if (postList.paging.next) {
                                var query = postList.paging.next.substr(postList.paging.next.indexOf('v'));
                                for (var key in postList.data) {
                                    finalPostList.push({
                                        postId: postList.data[key].id,
                                        postName: postList.data[key].message,
                                        pageId: result.id,
                                        pageName: result.name
                                    });
                                }

                                return getPostList(query);
                            }
                            else if (postList.paging.next == undefined && postList.paging.previous) {
                                for (var key in postList.data) {
                                    finalPostList.push({
                                        postId: postList.data[key].id,
                                        postName: postList.data[key].message,
                                        pageId: result.id,
                                        pageName: result.name
                                    });
                                }
                                callback(null, finalPostList);
                            }
                        }
                        else {

                            finalPostList.push({
                                postId: null,
                                postName: null,
                                pageId: result.id,
                                pageName: result.name
                            });
                            if (finalPostList.length > 1) {
                                var removedNullFromFinaldata = _.filter(finalPostList, function (o) {
                                    return o.postId != null;
                                });
                                callback(null, removedNullFromFinaldata);
                            }
                            else {
                                callback(null, finalPostList);
                            }
                        }
                    }
                );
            }
        }

        function getCommentData(results, callback) {
            var finalCommentList = [];
            async.concatSeries(results.get_all_posts, getTotalCommentsForEachPost, callback);
            function getTotalCommentsForEachPost(postDetail, callback) {
                var query = configAuth.apiVersions.FBInsightsUpdated + '/' + postDetail.postId + '/comments?limit=100&access_token=' + app_access_token;
                getAllCommentsWithPagination(query);

                function getAllCommentsWithPagination(commentQuery) {
                    if (postDetail.postId != null) {
                        // make the API call
                        FB.api(
                            commentQuery,
                            function (commentList) {
                                commentsCallCount++
                                if (commentList.error) {
                                    callback(null)
                                }
                                //To check the next in data array
                                if (commentList.data.length && commentList.paging.next) {

                                    //To get the query from next param
                                    var query = commentList.paging.next.substr(commentList.paging.next.indexOf('v'));
                                    for (var key in commentList.data)
                                        finalCommentList.push({
                                            comments: commentList.data[key].message,
                                            postId: postDetail.postId,
                                            postName: postDetail.postName,
                                            pageId: postDetail.pageId,
                                            pageName: postDetail.pageName
                                        });
                                    return getAllCommentsWithPagination(query);
                                }
                                else if (commentList.data.length && commentList.paging.next == undefined) {
                                    for (var key in commentList.data)
                                        finalCommentList.push({
                                            comments: commentList.data[key].message,
                                            postId: postDetail.postId,
                                            postName: postDetail.postName,
                                            pageId: postDetail.pageId,
                                            pageName: postDetail.pageName
                                        });

                                    callback(null, finalCommentList);
                                }
                                else {
                                    if (!commentList.data.length) {
                                        finalCommentList.push({
                                            comments: 'null',
                                            postId: postDetail.postId,
                                            postName: postDetail.postName,
                                            pageId: postDetail.pageId,
                                            pageName: postDetail.pageName
                                        });
                                    }
                                    else {
                                        for (var key in commentList.data) {
                                            finalCommentList.push({
                                                comments: commentList.data[key].message,
                                                postId: postDetail.postId,
                                                postName: postDetail.postName,
                                                pageId: postDetail.pageId,
                                                pageName: postDetail.pageName
                                            });
                                        }
                                    }
                                    callback(null, finalCommentList);
                                }
                            }
                        );
                    }
                    else {
                        finalCommentList.push({
                            comments: null,
                            postId: null,
                            postName: postDetail.postId,
                            pageId: postDetail.pageId,
                            pageName: postDetail.pageName
                        });
                        callback(null, finalCommentList);
                    }
                }
            }
        }

        function getPostsCommentsMergeFunction(results, callback) {
            var stringToSearch = [];
            var actualFinalData = [];
            var postMessage = results.get_all_posts;
            var PostComments = results.get_all_comments;
            var groupByPageId = _.groupBy(PostComments, 'pageId');
            for (var objKey in groupByPageId) {
                for (objIndex in groupByPageId[objKey]) {
                    if (groupByPageId[objKey][objIndex].postId != null) {
                        var concatString = groupByPageId[objKey][objIndex].comments + groupByPageId[objKey][objIndex].postName;
                        if (String(objKey) === String(groupByPageId[objKey][objIndex].pageId)) {
                            stringToSearch.push({
                                stringService: concatString,
                                postId: groupByPageId[objKey][objIndex].postId,
                                pageId: groupByPageId[objKey][objIndex].pageId,
                                pageName: groupByPageId[objKey][objIndex].pageName
                            })
                        }
                    }
                    else {
                        if (String(objKey) === String(groupByPageId[objKey][objIndex].pageId)) {
                            stringToSearch.push({
                                stringService: 'null',
                                postId: groupByPageId[objKey][objIndex].postId,
                                pageId: groupByPageId[objKey][objIndex].pageId,
                                pageName: groupByPageId[objKey][objIndex].pageName

                            })
                        }
                    }
                }
            }
            var groupingToSearch = _.groupBy(stringToSearch, 'pageId');
            for (var objKey in groupingToSearch) {
                var keyword = req.query.widgetDetails.charts[0].keyWord;
                var services = [keyword];
                var result = _.map(services, function (service) {
                    var length = _.reject(groupingToSearch[objKey], function (el) {
                        return (el.stringService.indexOf(service) < 0);
                    }).length;
                    return {id: service, count: length};
                });
                actualFinalData.push({
                    pageId: objKey,
                    total: result[0].count,
                    pageName: groupingToSearch[objKey][0].pageName
                });
            }
            callback(null, actualFinalData);
        }
    }
})

}