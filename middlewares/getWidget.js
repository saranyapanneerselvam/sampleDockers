var exports = module.exports = {};
var widgetsList = require('../models/widgets');
/**
 Function to get the widgets's details such as channel id,name,desciption ..
 @params 1.req contains the  user details i.e. username,token,email etc
 2.res have the query response

 */
exports.widgets = function (req, res, next) {
    //Set object in req to send the query response to controller
    req.showMetric = {};
    /**
     * Query to find the widgets list
     * @params req.params.dashboardId channel id from request
     * @params err - error response
     * @params metrics - query response
     * callback next which returns response to controller
     */
    widgetsList.find({dashboardId: req.params.dashboardId}, function (err, widgets) {
        console.log('widgets', req.params.dashboardId, 'err', err);
        req.showMetric.widgets = widgets;
        next();
    })
}


