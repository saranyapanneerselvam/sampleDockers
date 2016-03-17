var FB = require('fb');//Importing the fb module
var request = require('request');
var exports = module.exports = {};
var getEvents = require('events');//To require events module
var event = new getEvents.EventEmitter();//To create event object to use

/**
 Function to get post's comments,likes,user's details
 @params 1.req contains the  user request i.e page id
 2.next callback

 */
exports.getPageInsights = function (req) {
    var accessToken = 'CAACEdEose0cBAHscIUUbZCNXRdWKsqcAp2kyyIsxjYEajwBhK1kCjtyLC1C42IhVSryr8CHiOEv3VNkuCc6u9hzG8jq4IuXVKi7RbKv3lWLc0invdUbDEti4c1Ew9wgjBmAstAInEX8s3peQXXgzn4ZBGhjL5drtMr4dFT5RZAW1ZC0bt4ZAD3xua0DkwCiUZD';
    var finalPageList = [];
    var d = new Date();
    var endDate = calculateDate(d);
    d.setDate(d.getDate() - 180);
    var startDate = calculateDate(d);
    console.log('start', startDate, 'end', endDate)

    //For testing start& end date is hard coded it will be replaced by startDate & endDate
    var query = 'v2.5/436080606450092?fields=posts.until( 2016-03-17).since(2016-03-07)&access_token=' + accessToken;
    callGetPostApi(query);

    //to get the list of posts for a given keyword
    function callGetPostApi(query) {

        /* make the API call */
        FB.api(
            query,
            function (postList) {
                if (postList.posts != undefined) {
                    var query = postList.posts.paging.next.substr(postList.posts.paging.next.indexOf('v'));
                    for (key in postList.posts.data) {
                        finalPageList.push(postList.posts.data[key].id);
                    }
                    return callGetPostApi(query);
                }
                else if (postList.posts == undefined && postList.data.length) {
                    var query = postList.paging.next.substr(postList.paging.next.indexOf('v'));
                    for (key in postList.data) {
                        finalPageList.push(postList.data[key].id);
                    }
                    // req.app.result = finalPageList;
                   return callGetPostApi(query);
                }
                else {
                    console.log('pagelist', finalPageList.length);
                    getPostData(finalPageList);
                }
            }
        );
    }

    //To form the comment query for each post
    function getPostData(postList) {
        var length = postList.length;
        var finalCommentList = [];
        var finalLikeList = [];
        for (var i = 0; i < length; i++) {
            var likesRes = 0;
            var commentsRes = 0;
            var commentLikedUserList=[];
            var finalUserList=[];
            error = false; //not used now
            var commentQuery = 'v2.5/' + postList[i] + '/comments?access_token=CAACEdEose0cBAHscIUUbZCNXRdWKsqcAp2kyyIsxjYEajwBhK1kCjtyLC1C42IhVSryr8CHiOEv3VNkuCc6u9hzG8jq4IuXVKi7RbKv3lWLc0invdUbDEti4c1Ew9wgjBmAstAInEX8s3peQXXgzn4ZBGhjL5drtMr4dFT5RZAW1ZC0bt4ZAD3xua0DkwCiUZD';
            var likeQuery = 'v2.5/' + postList[i] + '/likes?access_token=CAACEdEose0cBAHscIUUbZCNXRdWKsqcAp2kyyIsxjYEajwBhK1kCjtyLC1C42IhVSryr8CHiOEv3VNkuCc6u9hzG8jq4IuXVKi7RbKv3lWLc0invdUbDEti4c1Ew9wgjBmAstAInEX8s3peQXXgzn4ZBGhjL5drtMr4dFT5RZAW1ZC0bt4ZAD3xua0DkwCiUZD';

            //to call getCommentData to get comments details
            getCommentData(commentQuery, finalCommentList,function(err,commentsData){
                commentsRes++;
                if(commentsRes==length){
                    for(var key in commentsData){
                        commentLikedUserList.push(commentsData[key]);
                    }
                    //console.log('commentsRes',commentsData.length);
                    console.log('final',commentLikedUserList.length);
                    callToGetTopFans(commentLikedUserList,finalUserList,'fromComment');

                }
            });

            //to call getLikeData to get likes details
            getLikeData(likeQuery, finalLikeList, function (err, response) {
                likesRes++;
                if(likesRes==length){
                    for(var key in response){
                        commentLikedUserList.push(response[key]);
                    }
                    callToGetTopFans(commentLikedUserList,finalUserList,'fromLike');
                }
            });
        }
    }
    function callToGetTopFans(commentLikedUserList,finalUserList,type){
        for(var key in commentLikedUserList){
            finalUserList.push(commentLikedUserList[key]);

        }
        console.log('total users',type,finalUserList.length);
    }

    //To get the like details
    function getLikeData(commentQuery, finalLikeList,callback) {

        // make the API call
        FB.api(
            commentQuery,
            function (likeDetails) {

                //To check the next in data array
                if (likeDetails.data.length && likeDetails.paging.next) {
                    var query = likeDetails.paging.next.substr(likeDetails.paging.next.indexOf('v'));

                    for (var key in likeDetails.data) {
                        finalLikeList.push(likeDetails.data[key]);
                    }
                    return getLikeData(query, finalLikeList,callback);
                }
                else if (likeDetails.data.length && likeDetails.paging.next == undefined) {
                    for (var key in likeDetails.data) {
                        finalLikeList.push(likeDetails.data[key]);
                    }
                }
                else {
                    for (var key in likeDetails.data) {
                        finalLikeList.push(likeDetails.data[key]);
                    }
                    req.app.result = finalLikeList;
                }
                callback(null,finalLikeList);
            }
        );
    }

    //To get the comment details
    function getCommentData(commentQuery, finalCommentList,callback) {

        // make the API call
        FB.api(
            commentQuery,
            function (pageList) {

                //To check the next in data array
                if (pageList.data.length && pageList.paging.next) {
                    var query = pageList.paging.next.substr(pageList.paging.next.indexOf('v'));
                    for (var key in pageList.data) {
                        finalCommentList.push({id:pageList.data[key].id,name:pageList.data[key].from.name});
                    }
                   return getCommentData(query,callback);
                }
                else if (pageList.data.length && pageList.paging.next == undefined) {
                    for (var key in pageList.data) {
                        finalCommentList.push({id:pageList.data[key].id,name:pageList.data[key].from.name});
                    }
                    // req.app.result = finalPageList;
                    //getPostData(finalPageList);
                }
                else {
                    for (var key in pageList.data) {
                        finalCommentList.push({id:pageList.data[key].id,name:pageList.data[key].from.name});
                    }
                }
                callback(null,finalCommentList);
            }
        );
    }


    //To format the date
    function calculateDate(d) {
        month = '' + (d.getMonth() + 1),
            day = '' + d.getDate(),
            year = d.getFullYear();
        if (month.length < 2) month = '0' + month;
        if (day.length < 2) day = '0' + day;
        var startDate = [year, month, day].join('-');
        return startDate;
    }
}

/*
 *

 N posts

 likesRes=0;
 commentsRes=0;
 error=false;

 for{
 getLikeData(a,b,c,d,function(err,likes){
 if(err)
 error=true;
 likesRes++;
 if(likesRes==N && commentsRes==N){

 if(error){
 }else{
 // your array is complete.
 req.app.data = data;
 }
 }
 })
 }

 getLikeData:
 10 likes // push to array
 10 likes// push to array
 5 likes// push to array
 = 25 likes
 callback(err)
 callback(null)


 *
 *
 * */