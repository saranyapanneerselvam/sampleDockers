var widgetsList = require('../middlewares/getWidget');


module.exports = function (app) {
    /**
     *  to get the list of widgets based on dashboard
     * @param app - loading the app which is for using express ,etc
     * @param req - request from client - contains urls,inputs ..
     * @callback dashboard - result from db call
     */
    app.get('/api/v1/dashboards/widgets/:dashboardId', widgetsList.widgets, function (req, res) {
        var widgets = req.showMetric.widgets;
        if (widgets)
            res.json({widgetsList: widgets});
        else
            res.status(500).send({error: ""});
    });

    //To store the widgets
    app.post('/api/v1/widgets', widgetsList.saveWidgets, function (req, res) {
        var widgets = req.app.result;
        if (widgets)
            res.json({widgetsList: widgets});
        else
            res.status(500).send({error: ""});
    });

    //To store the custom widgets
    app.post('/api/v1/create/customwidgets', widgetsList.saveCustomWidgets, function (req, res) {
        var customWidgets = req.app.result;
        if (customWidgets)
            res.json({widgetsList: customWidgets});
        else
            res.status(500).send({error: ""});
    });

    //To delete the widgets
    app.post('/api/v1/delete/widgets/:widgetId', widgetsList.deleteWidgets, function (req, res) {
        var widgets = req.app.result;
        if (widgets)
            res.json({widgetsList: widgets});
        else
            res.status(500).send({error: ""});
    });

};