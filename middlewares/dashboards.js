var mongoose = require('../node_modules/mongoose/lib');
var dashboardList = require('../models/dashboards');
var exports = module.exports = {};
var dashboards = require('../models/profiles');
var User = require('../models/user');
var Widget = require('../models/widgets');
var userPermission = require('../helpers/utility');
var Q = require("q");
var _ = require('lodash');

/**
 Function to get the profiles's details such as name,access token,refresh token..
 @params 1.req contains the app user details i.e. username,email,orgId etc
 2.res have the query response

 */
exports.getDashboardList = function (req, res, next) {
    if (!req.user) {
        return res.status(401).json({error: 'Authentication required to perform this action'})
    }
    else {
        var userDashboard = [];
        User.findOne({_id: req.user._id}, function (err, UserCollection) {
            if (err)
                return res.status(500).json({error: 'Internal server error'});
            else if (!UserCollection)
                return res.status(204).json({error: 'No records found'});
            else {
                for (var i = 0; i < UserCollection.dashboards.length; i++) {
                    userDashboard.push(getDashboard(UserCollection.dashboards[i].dashboardId));
                }
                Q.all(userDashboard).then(function successCallback(userDashboard) {
                    if (!userDashboard) {
                        return res.status(501).json({error: 'Not implemented'})
                    }
                    else {

                        req.app.result = _.without(userDashboard,null);
                        next();
                    }
                }, function errorCallback(err) {
                    return res.status(500).json({error: 'Internal server error'});
                });
            }
        });

        function getDashboard(UserCollection) {
            var deferred = Q.defer();
            dashboardList.findOne({_id: UserCollection}, function (err, dashboard) {
                if (err)
                    deferred.reject(new Error(err));
                else
                    deferred.resolve(dashboard);
            });
            return deferred.promise;
        }
    }
};

/**
 * To get the dashboard details based on dashboard id
 * @param req contains the dashboard id
 */
exports.getDashboardDetails = function (req, res, next) {
    var dashboardId = req.params.dashboardId;
    if (req.user) {
        dashboardList.findOne({'_id': dashboardId}, function (err, dashboardDetails) {
            if (err)
                return res.status(500).json({error: 'Internal server error'});
            else if (!dashboardDetails)
                return res.status(204).json({error: 'No records found'});
            else {
                req.app.result = dashboardDetails;
                next();
            }
        })
    }
    else
        return res.status(401).json({error: 'Authentication required to perform this action'})
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
        return res.status(401).json({error: 'Authentication required to perform this action'})
    }
    else {
        var createDashboard = new dashboardList();
        //To check whether new dashboard or not
        if (req.body.dashboardId == undefined) {
            createDashboard.created = new Date();
            createDashboard.updated = new Date();
            createDashboard.orgId = req.user.orgId;
            createDashboard.name = req.body.name;
            createDashboard.startDate=req.body.startDate;
            createDashboard.endDate=req.body.endDate;
            createDashboard.save(function (err, dashboard) {
                if (err)
                    return res.status(500).json({error: 'Internal server error'});
                else if (!dashboard)
                    return res.status(204).json({error: 'No records found'});
                else {
                    User.findOne({_id: req.user._id}, function (err, user) {
                        if (err)
                            return res.status(500).json({error: 'Internal server error'});
                        else if (!user)
                            return res.status(204).json({error: 'No records found'});
                        else {
                            if (user.dashboards) {
                                if (user.dashboards.length) {
                                    getDashboards = user.dashboards;
                                    getDashboards.forEach(function (item) {
                                        storeAllDashboards.push(item);
                                    });
                                }
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
                                    if (err)
                                        return res.status(500).json({error: 'Internal server error'});
                                    else if (response == 0)
                                        return res.status(501).json({error: 'Not implemented'});
                                    else {
                                        req.app.result = dashboard._id;
                                        next();
                                    }

                                })
                        }
                    })
                }
            });
        }

        //To update already existing database
        else {
            // set all of the user data that we need
            var updated = new Date();
            if(req.body.name!=undefined) {
                var name = req.body.name == undefined ? '' : req.body.name;
                var updateData={
                    'name': name,
                    updated: updated
                }
            }
            else{
                var startDate= req.body.startDate;
                var endDate=req.body.endDate;
                var updateData={
                    'startDate':startDate,
                    'endDate':endDate,
                    updated: updated
                }
            }

            var _id = new mongoose.Schema.ObjectId(req.body.dashboardId).path;

            // update the dashboard data
            dashboardList.update({_id: _id}, {
                $set: updateData
            }, {upsert: true}, function (err, response) {
                if (err)
                    return res.status(500).json({error: 'Internal server error'})
                else if (response == 0)
                    return res.status(501).json({error: 'Not implemented'})
                else {
                    req.app.result = _id;
                    next();
                }
            });
        }
    }
};
exports.removeDashboardFromUser = function (req, res, next) {
    req.dashboardId = req.params.dashboardId;
    var tempDashboardId = [];
    if (req.user) {
        userPermission.checkUserAccess(req, res, function (err, response) {
            if (err)
                return res.status(500).json({error: 'Internal server error'});
            else {
                for (var i = 0; i < response.dashboards.length; i++) {
                    if (response.dashboards[i].dashboardId != req.params.dashboardId) {
                        tempDashboardId.push(response.dashboards[i]);
                    }
                }
                if (response.lastDashboardId === req.params.dashboardId) {
                    if (tempDashboardId.length === 0) {
                        User.update({'_id': req.user._id}, {
                            $set: {
                                'lastDashboardId': '',
                                'dashboards': tempDashboardId
                            }
                        }, function (err, updateDashboard) {

                            if (err)
                                return res.status(500).json({error: 'Internal server error'})
                            else if (updateDashboard == 0)
                                return res.status(501).json({error: 'Not implemented'})
                            else removeWidget();
                        })
                    } 
                    else {
                        User.update({'_id': req.user._id}, {
                            $set: {
                                'lastDashboardId': tempDashboardId[0].dashboardId,
                                'dashboards': tempDashboardId
                            }
                        }, function (err, updateDashboard) {
                            if (err)
                                return res.status(500).json({error: 'Internal server error'})
                            else if (updateDashboard == 0)
                                return res.status(501).json({error: 'Not implemented'})
                            else removeWidget();
                        })
                    }
                }
                else {
                    User.update({'_id': req.user._id}, {$set: {'dashboards': tempDashboardId}}, function (err, updateDashboard) {
                        if (err)
                            return res.status(500).json({error: 'Internal server error'})
                        else if (tempDashboardId == 0)
                            return res.status(501).json({error: 'Not implemented'})
                        else removeWidget();
                    })
                }
            }
        });
        function removeWidget() {
            Widget.remove({'dashboardId': req.params.dashboardId}, function (err, widget) {
                if (err)
                    return res.status(500).json({error: 'Internal server error'})

                else
                    removeDashboard();
            })
        }

        function removeDashboard() {
            dashboardList.remove({'_id': req.params.dashboardId}, function (err, dashboard) {
                if (err)
                    return res.status(500).json({error: 'Internal server error'});
                else if (dashboard != 1)
                    return res.status(501).json({error: 'Not implemented'});
                else {
                    req.app.result = req.params.dashboardId;
                    next();
                }
            })
        }
    }
    else return res.status(401).json({error: 'Authentication required to perform this action'});
};

//To get dashboard details based on reportid
exports.getDashboardDetailsFromReportId = function (req, res, done) {
    dashboardList.findOne({reportId: req.reportId}, function (err, dashboardDetails) {
            if (err)
                return res.status(500).json({error: 'Internal server error'});
            else if (!dashboardDetails)
                return res.status(204).json({error: 'No records found'});
            else {
                Widget.find({dashboardId: dashboardDetails._id}, function (err, widget) {
                    if (err)
                        return res.status(500).json({error: 'Internal server error'});
                    else if (!widget.length)
                        return res.status(204).json({error: 'No records found'});
                    else {
                        done(null,{widget:widget,dashboardDetails:dashboardDetails});
                    }
                })

            }
        })
};