var user = require('../models/user');
var profile = require('../models/profiles');
var exports = module.exports = {};

/**
 Function to get the user's details such as organization id,name ..
 @params 1.req contains the facebook user details i.e. username,token,email etc
 2.res have the query response
 @event pageList is used to send & receive the list of pages result
 */

exports.getDetails = function (req, res, next) {
    console.log('req',req);
    req.showMetric = {};
    user.find({_id: req.user._id}, function (err, response) {
        req.showMetric.userDetails = response;
        next();
    });
};

exports.updateLastDashboardId = function (req,res,next) {
    console.log(req.params.id);
    console.log(req.user._id);
    user.update({'_id': req.user._id}, {$set: {"lastDashboardId": req.params.id, updated: new Date()}},{upsert: true},  function (err) {
        if (!err) {
            req.app.result = {'status': '200', 'dashboardId': req.user._id};
            next();
        }
        else {
            req.app.result = {'status': '302'};
            next();
        }
    });
};

