var dashboardList = require('../models/dashboards');
var exports = module.exports = {};
var dashboards = require('../models/profiles');
/**
 Function to get the profiles's details such as name,access token,refresh token..
 @params 1.req contains the facebook user details i.e. username,email etc
 2.res have the query response

 */
exports.getDashboards = function (req, res, next) {
    req.showMetric = {};
    if (!req.user) {
        req.showMetric.error = 500;
        next();
    }
    else {
        dashboardList.find({orgId: req.user.orgId}, function (err, dashboard) {
            console.log('result', req.params.channelId, dashboard);
            req.showMetric.dashboard = dashboard;
            next();
        })
    }

}
exports.storeDashboards = function (req, res, next) {
    req.showMetric = {};

    if (!req.user) {
        console.log('if');
        req.showMetric.error = 500;
        next();
    }
    else {
        console.log('inside dashboard');
        var createDashboard = new dashboardList();

        // set all of the user data that we need
        createDashboard.name = profile.id;
        createDashboard.orgId = req.user.orgId;
        createDashboard.order = '';
        createDashboard.type = '';
        createDashboard.created = new Date();
        createDashboard.updated = new Date();

        // save the user
        createDashboard.save(function (err, dashboard) {
            console.log('dashboard', dashboard);


        });
    }

}


