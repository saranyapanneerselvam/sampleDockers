var FB = require('fb');//Importing the fb module
var request = require('request');
var exports = module.exports = {};


/**
 Function to get post's comments,likes,user's details
 @params 1.req contains the  user request i.e page id
 2.next callback

 */
exports.getPageInsights = function (req, res, next) {
    console.log('user');
    var accessToken = 'CAACEdEose0cBAG6qM8Xbw8E3hl7DaLtmkbaKSl4H0lIwrbDl6RZCz5sl9YffN1MYMiEZBKhE2pPqGKdeIHZA5OEBtZAc4ZBWMZCC77UwiUGJCZBzFO7ErAubTstz4rzUyuZBSNAweFSNLBhAxRu94HiS79gXObAppFmrCliwtuhxYZCyhbfGHZCU7ki37YOJZCdZCkZCgr71aTjZCmzwZDZD';
    var finalPageList = [];
    var d = new Date();
    var endDate = calculateDate(d);
    d.setDate(d.getDate() - 180);
    var startDate = calculateDate(d);
    console.log('start', startDate, 'end', endDate)
    var query = 'v2.5/436080606450092?fields=posts.until(' + endDate + ').since(' + startDate + ')&access_token=' + accessToken;
    callSearchApi(query);

    //to get the list of pages for a given keyword
    function callSearchApi(query) {

        /* make the API call */
        FB.api(
            query,
            function (pageList) {
               // console.log('pag',pageList);
                if (pageList.posts != undefined) {
                    var query = pageList.posts.paging.next.substr(pageList.posts.paging.next.indexOf('v'));
                    for (key in pageList.posts.data) {
                        finalPageList.push(pageList.posts.data[key].id);
                    }
                    callSearchApi(query);
                }
                else if (pageList.posts == undefined && pageList.data.length) {
                    var query = pageList.paging.next.substr(pageList.paging.next.indexOf('v'));
                    for (key in pageList.data) {
                        finalPageList.push(pageList.data[key].id);
                    }
                    // req.app.result = finalPageList;
                    callSearchApi(query);
                }
                else {
                    console.log('pagelist', finalPageList.length);
                    getPostData(finalPageList);
                }
            }
        );
    }

    //To get each post's comments,user details
    function getPostData(postList) {
        console.log('getpostdata');

        //console.log('post list', postList);
        var length = postList.length;
        var finalCommentList = [];
        console.log('length', length);
        for (var i = 0; i < length; i++) {
            var commentQuery = 'v2.5/' + postList[i] + '/comments?access_token=CAACEdEose0cBAG6qM8Xbw8E3hl7DaLtmkbaKSl4H0lIwrbDl6RZCz5sl9YffN1MYMiEZBKhE2pPqGKdeIHZA5OEBtZAc4ZBWMZCC77UwiUGJCZBzFO7ErAubTstz4rzUyuZBSNAweFSNLBhAxRu94HiS79gXObAppFmrCliwtuhxYZCyhbfGHZCU7ki37YOJZCdZCkZCgr71aTjZCmzwZDZD';
            console.log('comments function', i,postList[i]);
            getCommentData(commentQuery, i,finalCommentList,postList[i]);
        }
    }



    function getCommentData(commentQuery, i,finalCommentList) {
        console.log('i', i);
        /* make the API call */
        FB.api(
            commentQuery,
            function (pageList) {
                console.log('comments', pageList.data.length);
                if (pageList.data.length && pageList.paging.next) {
                    console.log('if');
                    var query = pageList.paging.next.substr(pageList.paging.next.indexOf('v'));

                    for (key in pageList.data) {
                        finalCommentList.push(pageList.data[key]);
                    }
                    console.log('finalCommentList', finalCommentList.length);
                    getCommentData(query);
                    //To check the next in comments array


                }
                else if (pageList.data.length && pageList.paging.next == undefined) {
                    console.log('else if',pageList.data);
                    for (key in pageList.data) {
                        finalCommentList.push(pageList.data[key]);
                    }
                    console.log('finalPageList', finalCommentList.length);
                    // req.app.result = finalPageList;
                    //getPostData(finalPageList);
                }
                else {
                    console.log('elsel');
                    for (key in pageList.data) {
                        finalPageList.push(pageList.data[key]);
                    }
                    req.app.result = finalPageList;
                    //  next();
                }
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