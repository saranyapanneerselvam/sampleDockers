//var user = require('../models/user');
var exports = module.exports = {};
var profilesList = require('../models/profiles');
/**
 Function to get the profiles's details such as name,access token,refresh token..
 @params 1.req contains the facebook user details i.e. username,email etc
 2.res have the query response

 */
exports.profiles = function (req, res, next) {
    req.showMetric = {};
    profilesList.find({channelId: req.params.channelId}, function (err, profiles) {
        console.log('profile',req.params)
        req.showMetric.profiles = profiles;
        next();
    })
}


