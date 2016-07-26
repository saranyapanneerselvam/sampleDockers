var widgetsList = require('../middlewares/getWidget');


module.exports = function (app) {
    /**
     *  to get the list of widgets based on dashboard
     * @param app - loading the app which is for using express ,etc
     * @param req - request from client - contains urls,inputs ..
     * @callback dashboard - result from db call
     */
    app.get('/api/v1/dashboards/widgets/:dashboardId', widgetsList.widgets, function (req, res) {
            res.json({widgetsList: req.app.result});
    });

    app.get('/api/v1/widget/:widgetId', widgetsList.widgetDetails, function (req, res) {
            res.json(req.app.result);
    });

    //To store the widgets
    app.post('/api/v1/widgets', widgetsList.saveWidgets, function (req, res) {
            res.json({widgetsList: req.app.result});
    });

    //To store the custom widgets
    app.post('/api/v1/create/customwidgets', widgetsList.saveCustomWidgets, function (req, res) {
            res.json({widgetsList: req.app.result});
    });

    //To delete the widgets
    app.post('/api/v1/delete/widgets/:widgetId', widgetsList.deleteWidgets, function (req, res) {
            res.json({widgetsList: req.app.result});
    });

    //To name update the widgets
    app.post('/api/v1/update/widgets', widgetsList.updateNameOfWidgets, function (req, res) {
        res.json({widgetsList: req.app.result});
    });


};