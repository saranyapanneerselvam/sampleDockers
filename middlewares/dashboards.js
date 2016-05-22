var mongoose = require('../node_modules/mongoose/lib');
var dashboardList = require('../models/dashboards');
var exports = module.exports = {};
var dashboards = require('../models/profiles');
var User = require('../models/user');

/**
 Function to get the profiles's details such as name,access token,refresh token..
 @params 1.req contains the app user details i.e. username,email,orgId etc
 2.res have the query response

 */
exports.getDashboardList = function (req, res, next) {
    console.log('user in dashboard', req.user);
    //req.showMetric = {};
    if (!req.user) {
        return res.status(401).json({error: 'Authentication required to perform this action'})
    }
    else {
        dashboardList.find({orgId: req.user.orgId}, function (err, dashboard) {
            if (err)
                return res.status(500).json({error: 'Internal server error'});
            else if (dashboard.length == 0)
                return res.status(204).json({error: 'No records found'});
            else {
                req.app.result = dashboard;
                next();
            }
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
    if (req.user) {
        dashboardList.findOne({'_id': dashboardId}, function (err, dashboardDetails) {
            if (err)
                return res.status(500).json({error: 'Internal server error'});
            else if (!dashboardDetails)
                return res.status(204).json({error: 'No records found'});
            else{
                req.app.result = dashboardDetails;
                next();
            }
        })
    }
    else
        return res.status(401).json({error:'Authentication required to perform this action'})
};

/**
 * To store the dashboard details in database
 * @param req - user details
 * @param res
 * @param next - callback
 */
exports.storeDashboards = function (req, res, next) {
    var getDashboards;
    var storeAllDashboards = [];
    var dashboardObjects = {};
    if (!req.user) {
        console.log('if');
        return res.status(401).json({error: 'Authentication required to perform this action'})
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
                    User.findOne({_id: req.user._id}, function (err, user) {
                        if (err)
                            return res.status(500).json({error: 'Internal server error'});
                        else if (!user)
                            return res.status(204).json({error: 'No records found'});
                        else {
                            if (user.dashboards.length){
                                getDashboards = user.dashboards;
                                getDashboards.forEach(function (item) {
                                    storeAllDashboards.push(item);
                                });
                            }

                            dashboardObjects = {
                                dashboardId: dashboard.id,
                                view: true,
                                edit: true
                            };
                            storeAllDashboards.push(dashboardObjects);
                            var now = new Date();
                            User.update({_id: req.user._id},
                                {
                                    $set: {dashboards: storeAllDashboards, updated: now}
                                }
                                //{ $push: { dashboards: [{key:1}, {key:2}, {key:3}] } }
                                //{"$pushAll" : {dashboards : [{key:1}, {key:2}, {key:3}]}}
                                // { $addToSet: {dashboards: [{key:1}, {key:2}, {key:3}] } }
                                , function (err, response) {
                                    console.log('err', err, response);
                                    if (err)
                                        return res.status(500).json({error: 'Internal server error'});
                                    else if (response == 0)
                                        return res.status(501).json({error: 'Not implemented'});
                                    else{
                                        req.app.result =  dashboard._id;
                                        next();
                                    }

                                })
                        }
                    })

                }
                else
                    return res.status(501).json({error: 'Not implemented'})

            });
        }

        //To update already existing database
        else {

            // set all of the user data that we need
            var name = req.body.name == undefined ? '' : req.body.name;
            var updated = new Date();
            var _id = new mongoose.Schema.ObjectId(req.body.dashboardId).path;

            // update the dashboard data
            dashboardList.update({_id: _id}, {
                $set: {'name': name,  updated: updated}
            }, {upsert: true}, function (err,response) {
                if (err)
                    return res.status(500).json({error: 'Internal server error'})
                else if (response == 0)
                    return res.status(501).json({error: 'Not implemented'})
                else{
                    req.app.result =  _id;
                    next();
                }
            });
        }
    }
};