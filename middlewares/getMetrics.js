var user = require('../models/user');
var exports = module.exports = {};
var metricsList = require('../models/metrics');
/**
 Function to get the metric's details such as channel id,name,desciption ..
 @params 1.req contains the facebook user details i.e. username,token,email etc
 2.res have the query response

 */
exports.metrics = function (req, res, next) {
    //Set object in req to send the query response to controller
    req.showMetric = {};
    /**
     * Query to find the metric list
     * @params req.params.channelId channel id from request
     * @params err - error response
     * @params metrics - query response
     * callback next which returns response to controller
     */
    metricsList.find({channelId: req.params.channelId}, function (err, metrics) {
        console.log('metrics', req.params.channelId, 'err', err, 'metric', metrics);
        req.showMetric.metrics = metrics;
        next();
    })
};


exports.metricDetails = function (req, res, next) {
    //Set object in req to send the query response to controller
    req.showMetric = {};
    /**
     * Query to find the details of a given metric
     * @params req.params.metricId metric id from request
     * @params err - error response
     * @params metricDetails - query response
     * callback next which returns response to controller
     */
    metricsList.find({_id: req.params.metricId}, function (err, metrics) {
        console.log('metric details', req.params.metricId, 'err', err, 'metric details', metrics);
        req.showMetric.metrics = metrics;
        next();
    })
};
