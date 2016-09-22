var FB = require('fb');//Importing the fb module
var request = require('request');

// load the auth variables
var configAuth = require('../config/auth');
var exports = module.exports = {};

/**
 Function to list the pages based on user request
 @params 1.req contains the  user request i.e search key
 2.done callback

 */
exports.getSearchResult = function (req, res, next) {

    var finalPageList = [];

    //Get app access token
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
            var query = configAuth.apiVersions.FBInsights+'/search?access_token=' + response.access_token + '&fields=page,name,picture,link&q=' + req.query.keyWord + '&type=page';
            callSearchApi(query);
        }
    );

    //to get the list of pages for a given keyword
    function callSearchApi(query) {

        /* make the API call */
        FB.api(
            query,
            function (pageList) {

                if ( pageList.paging !==undefined && pageList.paging.next  !== undefined) {
                    var query = pageList.paging.next.substr(pageList.paging.next.indexOf('v'));
                    pageList.data.forEach(function(item){
                        finalPageList.push(item);
                    })
                    callSearchApi(query);
                }
                else if (pageList.paging !==undefined && pageList.paging.next == undefined && pageList.paging.previous) {

                    pageList.data.forEach(function(item){
                        finalPageList.push(item);
                    })

                    req.app.result = finalPageList;
                    next();
                }
                else {

                    pageList.data.forEach(function(item){
                        finalPageList.push(item);
                    })
                    req.app.result = finalPageList;
                    next();
                }
            }
        );
    }
}