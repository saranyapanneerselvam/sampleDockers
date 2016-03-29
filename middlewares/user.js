var user = require('../models/user');
var profile = require('../models/profiles');
var exports = module.exports = {};

/**
 Function to get the user's details such as organization id,name ..
 @params 1.req contains the facebook user details i.e. username,token,email etc
 2.res have the query response
 @event pageList is used to send & receive the list of pages result
 */
exports.getUserDetails = function (req, res, next) {
    req.showMetric = {};
    user.find({_id: req.user._id}, function (err, response) {
        req.showMetric.userDetails = response;
        next();
    });

};



