//Importing the fb module
var FB = require('fb');

var configAuth = require('../config/auth');

//Importing the request module
var request = require('request');

//Define exports
var exports = module.exports = {};

/**
 Function to get all posts for a given page id
 @params 1.req contains the  user request i.e page id
 */
exports.getPageInsights = function (req, res, next) {
    var accessToken = 'CAACEdEose0cBAGNkZCMc3dFZAbGrEmFHe5ygfWNMfhHbdoyiwSEgTeBJ86dez6lLqz9vxGLUKCzrnCwDBsBPdNZAYLFqDDHs5xxvR6TzuFxEQvcZChI6mDZBQsthipdZCRz7V2jKPBnIKLzz6Gn7Natut7jUbxvBMR67XtQMVt84baWwsZBl3My1T8oMvZC5Kf4ZBlWb0yxxsnAZDZD';

    //Array to hold the list for a given page id
    var finalPostList = [];
    var d = new Date();

    //Store the end date
    var endDate = calculateDate(d);

    //To set start date ,before 6 months
    d.setDate(d.getDate() - 180);

    //Store start date
    var startDate = calculateDate(d);
    console.log('start', startDate, 'end', endDate)

    //For testing start& end date is hard coded it will be replaced by startDate & endDate
    var query = configAuth.apiVersions.FBInsights+'/' + req.query.pageId + '?fields=posts.until(' + endDate + ').since(' + startDate + ')&access_token=' + accessToken;
    return callGetPostApi(query);

    //to get the list of posts for a given page id
    function callGetPostApi(query) {
        console.log('query');
        /* make the API call */
        FB.api(
            query,
            function (postList) {
                console.log('post list', postList);

                /*  //To handle timeout error
                 if(postList.error.code === 'ETIMEDOUT'){
                 req.app.result = {message:'Timed out error',status:408};
                 next();
                 }*/


                //First time data array will come inside posts object
                if (postList.posts != undefined) {

                    //To get the query from next param
                    var query = postList.posts.paging.next.substr(postList.posts.paging.next.indexOf('v'));
                    for (var key in postList.posts.data)
                        finalPostList.push(postList.posts.data[key].id);
                    return callGetPostApi(query);
                }
                else if (postList.posts == undefined && postList.data.length) {

                    //To get the query from next param
                    var query = postList.paging.next.substr(postList.paging.next.indexOf('v'));
                    for (var key in postList.data)
                        finalPostList.push(postList.data[key].id);
                    return callGetPostApi(query);
                }
                else
                    getPostData(finalPostList);
            }
        );
    }

    //To form the comment query for each post
    function getPostData(postList) {

        //Store the postlist length
        var length = postList.length;

        //Store all comment's details
        var finalCommentList = [];

        //Store all like's details
        var finalLikeList = [];
        var likesRes = 0;
        var commentsRes = 0;
        var typeComment = 0;
        var typeLike = 1;

        //To store all comment's& like's details
        var commentLikedUserList = [];

        //Final user list
        var finalUserList = [];
        for (var i = 0; i < length; i++) {
            var error = false; //not used now

            //access token is hard coded for testing
            var commentQuery = configAuth.apiVersions.FBInsights+'/' + postList[i] + '/comments?access_token=CAACEdEose0cBAGNkZCMc3dFZAbGrEmFHe5ygfWNMfhHbdoyiwSEgTeBJ86dez6lLqz9vxGLUKCzrnCwDBsBPdNZAYLFqDDHs5xxvR6TzuFxEQvcZChI6mDZBQsthipdZCRz7V2jKPBnIKLzz6Gn7Natut7jUbxvBMR67XtQMVt84baWwsZBl3My1T8oMvZC5Kf4ZBlWb0yxxsnAZDZD';
            var likeQuery = configAuth.apiVersions.FBInsights+'/' + postList[i] + '/likes?access_token=CAACEdEose0cBAGNkZCMc3dFZAbGrEmFHe5ygfWNMfhHbdoyiwSEgTeBJ86dez6lLqz9vxGLUKCzrnCwDBsBPdNZAYLFqDDHs5xxvR6TzuFxEQvcZChI6mDZBQsthipdZCRz7V2jKPBnIKLzz6Gn7Natut7jUbxvBMR67XtQMVt84baWwsZBl3My1T8oMvZC5Kf4ZBlWb0yxxsnAZDZD';

            //to call getCommentData to get comments details
            getCommentData(commentQuery, finalCommentList, function (err, commentsData) {
                commentsRes++;
                if (commentsRes == length) {
                    for (var key in commentsData)
                        commentLikedUserList.push(commentsData[key]);
                    return callToGetTopFans(commentLikedUserList, finalUserList, typeComment, next);
                }
            });

            //to call getLikeData to get likes details
            getLikeData(likeQuery, finalLikeList, function (err, response) {
                likesRes++;
                if (likesRes == length) {
                    for (var key in response)
                        commentLikedUserList.push(response[key]);
                    return callToGetTopFans(commentLikedUserList, finalUserList, typeLike, next);
                }
            });
        }
    }

    //To get the like details
    function getLikeData(commentQuery, finalLikeList, callback) {

        // make the API call
        FB.api(
            commentQuery,
            function (likeDetails) {

                /*  //To handle timeout error
                 if(likeDetails.error.code === 'ETIMEDOUT'){
                 req.app.result = {message:'Timed out error',status:408};
                 next();
                 }*/
                console.log('like', likeDetails)
                //To check the next in data array
                if (likeDetails.data.length && likeDetails.paging.next) {

                    //To get the query from next param
                    var query = likeDetails.paging.next.substr(likeDetails.paging.next.indexOf('v'));
                    for (var key in likeDetails.data)
                        finalLikeList.push(likeDetails.data[key]);
                    return getLikeData(query, finalLikeList, callback);
                }
                else if (likeDetails.data.length && likeDetails.paging.next == undefined) {
                    for (var key in likeDetails.data)
                        finalLikeList.push(likeDetails.data[key]);
                }
                else {
                    for (var key in likeDetails.data)
                        finalLikeList.push(likeDetails.data[key]);
                }
                callback(null, finalLikeList);
            }
        );
    }

    //To get the comment details
    function getCommentData(commentQuery, finalCommentList, callback) {

        // make the API call
        FB.api(
            commentQuery,
            function (commentList) {
                console.log('commentList', commentList)

                /* //To handle timeout error
                 if(commentList.error.code === 'ETIMEDOUT'){
                 req.app.result = {message:'Timed out error',status:408};
                 next();
                 }*/


                //To check the next in data array
                if (commentList.data.length && commentList.paging.next) {

                    //To get the query from next param
                    var query = commentList.paging.next.substr(commentList.paging.next.indexOf('v'));
                    for (var key in commentList.data)
                        finalCommentList.push({id: commentList.data[key].id, name: commentList.data[key].from.name});
                    return getCommentData(query, callback);
                }
                else if (commentList.data.length && commentList.paging.next == undefined) {
                    for (var key in commentList.data)
                        finalCommentList.push({id: commentList.data[key].id, name: commentList.data[key].from.name});
                }
                else {
                    for (var key in commentList.data) {
                        finalCommentList.push({id: commentList.data[key].id, name: commentList.data[key].from.name});
                    }
                }
                callback(null, finalCommentList);
            }
        );
    }

    //Combine the results from comment's & like's details
    function callToGetTopFans(commentLikedUserList, finalUserList, type, next) {
        for (var key in commentLikedUserList)
            finalUserList.push(commentLikedUserList[key]);
        if (type == 1)
            getTopFans(finalUserList, next);
    }

    //To get the top ten users
    function getTopFans(sampleset) {

        //To hold the names of the top ten fans ,here names will be duplicated
        var repeatedNames = [];

        //Array to hold list of fan's ids
        var fansList = [];

        //Object to hold the number of occurrences of each user
        var result = {};

        //Array to hold sorted fans list
        var sortable = [];

        //Object to hold the unique name
        var temp = {};

        //Array to store the final result
        var storeFinalResult = [];

        //To find the number of occurrences of an id
        for (var i = 0; i < sampleset.length; ++i) {
            if (!result[sampleset[i].id])
                result[sampleset[i].id] = 0;
            ++result[sampleset[i].id];
        }

        for (var element in result)
            sortable.push([element, result[element]]);

        //To sort the values in sortable array
        sortable.sort(function (a, b) {
            return b[1] - a[1]
        });

        //Push the top 10 fans id list
        for (var i = 0; i < 10; i++) {
            fansList.push(sortable[i][0]);
        }

        //Find the names for matched ids
        for (var j = 0; j < fansList.length; j++) {
            for (var i = 0; i < sampleset.length; i++) {
                if (sampleset[i].id == fansList[j]) {
                    repeatedNames.push(sampleset[i].name);
                }
            }
        }

        //To remove duplicates
        for (var i = 0; i < repeatedNames.length; i++)
            temp[repeatedNames[i]] = true;

        //To store the final result
        for (var k in temp)
            storeFinalResult.push(k);

        req.app.result = storeFinalResult;
        next();
        console.log("Your Top 10 fans are: " + storeFinalResult);
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

