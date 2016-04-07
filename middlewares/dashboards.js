var mongoose = require('../node_modules/mongoose/lib');
var dashboardList = require('../models/dashboards');
var exports = module.exports = {};
var dashboards = require('../models/profiles');
/**
 Function to get the profiles's details such as name,access token,refresh token..
 @params 1.req contains the app user details i.e. username,email,orgId etc
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

};

/**
 * To get the dashboard details based on dashboard id
 * @param req contains the dashboard id
 */
exports.getDashboardDetails = function (req, res, next) {
    console.log('cookies', req.user, req.session);
    var dashboardId = req.params.dashboardId;
    dashboardList.findOne({'_id': dashboardId}, function (err, dashboardDetails) {
        console.log('app', req.app, dashboardDetails);
        if (err)
            req.app.result = {error: err, message: 'Database error'};
        else if (!dashboardDetails)
            req.app.result = {status: 302, message: 'No record found'};
        else
            req.app.result = {status: 200, data: dashboardDetails};
        next();

    })

};

/**
 * To store the dashboard details in database
 * @param req - user details
 * @param res
 * @param next - callback
 */
exports.storeDashboards = function (req, res, next) {
    if (!req.user) {
        console.log('if');
        req.app.error = 500;
        next();
    }
    else {
        var createDashboard = new dashboardList();

        //To check whether new dashboard or not
        if (req.body.dashboardId == undefined) {
            createDashboard.created = new Date();
            createDashboard.updated = new Date();
            createDashboard.orgId = req.user.orgId;
            createDashboard.save(function (err, dashboard) {
                if (!err) {
                    req.app.result = {'status': '200', 'id': dashboard._id};
                    next();
                }
                else {
                    req.app.result = {'status': '302'};
                    next();
                }
            });
        }

        //To update already existing database
        else {

            // set all of the user data that we need
            var name = req.body.name == undefined ? ' ' : req.body.name;
            var dashboardId = req.body.dashboardId == undefined ? '' : req.body.dashboardId;
            var orgId = req.user.orgId;
            var order = req.body.type == undefined ? ' ' : req.body.order;
            var type = req.body.type == undefined ? ' ' : req.body.type;
            var updated = new Date();
            var _id = new mongoose.Schema.ObjectId(dashboardId).path;

            // update the dashboard data
            dashboardList.update({_id: _id}, {
                $set: {'name': name, orgId: orgId, order: order, type: type, updated: updated}
            }, {upsert: true}, function (err) {
                if (!err) {
                    req.app.result = {'status': '200', 'dashboardId': _id};
                    next();
                }
                else {
                    req.app.result = {'status': '302'};
                    next();
                }
            });
        }
    }
};