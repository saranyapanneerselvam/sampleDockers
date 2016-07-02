var exports = module.exports = {};
var referenceWidgetsList = require('../models/referenceWidgets');
/**
 Function to get the reference widget's details such as metrics,name,description based on the widgetType..
 */
exports.referenceWidgets = function (req, res, next) {
    //Set object in req to send the query response to controller
    req.showMetric = {};
    /**
     * Query to find the metric list
     * @params req.params.channelId channel id from request
     * @params err - error response
     * @params metrics - query response
     * callback next which returns response to controller
     */
    referenceWidgetsList.find({widgetType: req.params.widgetType}, function (err, referenceWidgets) {
        req.showMetric.referenceWidgets = referenceWidgets;
        next();
    })
};