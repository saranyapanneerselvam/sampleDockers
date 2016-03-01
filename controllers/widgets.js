var widgetsList = require('../middlewares/getWidget');

/**
 * This is the middleware to get the list of metrics based on channels
 * @param app - loading the app which is for using express ,etc
 * @param req - request from client - contains urls,inputs ..
 * @callback dashboard - result from db call
 */
module.exports = function (app) {
    app.get('/api/v1/get/widgets/:dashboardId', widgetsList.widgets, function (req, res) {
        var widgets = req.showMetric.widgets;
        if (widgets)
            res.json({widgetsList: widgets});
        else
            res.status(500).send({error: ""});
    });
};