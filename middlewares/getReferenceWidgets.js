var exports = module.exports = {};
var referenceWidgetsList = require('../models/referenceWidgets');
/**
 Function to get the reference widget's details such as metrics,name,description based on the widgetType..
 */
exports.referenceWidgets = function (req, res, next) {

    /**
     * Query to find the metric list
     * @params req.params.channelId channel id from request
     * @params err - error response
     * @params metrics - query response
     * callback next which returns response to controller
     */
    referenceWidgetsList.find({widgetType: req.params.widgetType}, function (err, referenceWidgets) {
        if (err)
            return res.status(500).json({error: err});
        else if (!referenceWidgets.length)
            return res.status(204).json({error: 'No records found'});
        else{
            req.app.referenceWidgets = referenceWidgets;
            next();
        }

    })
};