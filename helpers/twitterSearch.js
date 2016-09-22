//To get the page list based on search keyword

var configAuth = require('../config/auth');
//Define exports
var exports = module.exports = {};
var Twitter = require('twitter');
var client = new Twitter({
    consumer_key: configAuth.twitterAuth.consumerKey,
    consumer_secret: configAuth.twitterAuth.consumerSecret,
    access_token_key: configAuth.twitterAuth.AccessToken,
    access_token_secret: configAuth.twitterAuth.AccessTokenSecret
});
exports.searchPages = function (req,res,done) {
    var searchResult=[];
    client.get(configAuth.twitterQuery.userSearch, {q:req.query.keyWord}, function (error, pages, response) {

        pages.forEach(function (value) {
            searchResult.push({name:value.screen_name,link:'https://twitter.com/'+value.screen_name,picture:{data:{url:value.profile_image_url_https}},id:value.id});
        })
        done(null,searchResult)
        
    })
}