var getDashboards = require('../middlewares/dashboards');

/**
 * This is the middleware to get the list of dashboards based on orgId
 * @param app - loading the app which is for using express ,etc
 * @param req - request from client - contains urls,inputs ..
 * @callback dashboard - result from db call
 */
module.exports = function (app) {
    app.get('/api/v1/get/dashboardList', getDashboards.getDashboardList, function (req, res) {
        res.json({dashboardList: req.app.result});
    });

    //Create/update a dashboard
    app.post('/api/v1/create/dashboards', getDashboards.storeDashboards, function (req, res) {
        res.json(req.app.result);
    });

    //To get dashboard details based on dashboard id
    app.get('/api/v1/get/dashboards/:dashboardId', getDashboards.getDashboardDetails, function (req, res) {
        res.json(req.app.result);

    });

    //To delete the dashboard
    app.post('/api/v1/delete/userDashboards/:dashboardId', getDashboards.removeDashboardFromUser, function (req, res) {
        res.json(req.app.result);
    });
};