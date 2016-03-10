var getDashboards = require('../middlewares/dashboards')

/**
 * This is the middleware to get the list of dashboards based on orgId
 * @param app - loading the app which is for using express ,etc
 * @param req - request from client - contains urls,inputs ..
 * @callback dashboard - result from db call
 */
module.exports = function (app) {
    app.get('/api/v1/get/dashboards', getDashboards.getDashboards, function (req, res) {
        console.log('user', req);
        if (req.showMetric.error)
            res.status(500).send({error: "User is not logged in"});
        else {
            var dashboard = req.showMetric.dashboard
            console.log('dashboard', dashboard, 'err');
            if (dashboard)
                res.json({dashboardList: dashboard});
            else
                res.json(404);
        }

    })

    //Create/update a dashboard
    app.post('/api/v1/create/dashboards',getDashboards.storeDashboards, function (req, res) {
        res.json(req.app.result);
    })

    //To get dashboard details based on dashboard id
    app.get('/api/v1/get/dashboards/:dashboardId', getDashboards.getDashboardDetails, function (req, res) {
        var result  = req.app.result;
        res.json(result);

    })
};