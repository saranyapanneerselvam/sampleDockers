var _ = require('lodash');
var Alert = require('../models/alert');
var channelHelper = require('../helpers/getChannelDetails');
var objectList = require('../models/objects');
var configAuth = require('../config/auth');
var subscription = require('../models/subscriptionType');
var organization = require('../models/organizations');
var nodemailer = require('nodemailer');
var transporter = nodemailer.createTransport({
    service: configAuth.batchJobs.mail.serviceNameInUtility,
    auth: {
        user: configAuth.batchJobs.mail.user,
        pass: configAuth.batchJobs.mail.password
    }
});
var User = require('../models/user');
var Widget = require('../models/widgets');
var dashboards = require('../models/dashboards')

//To check whether the user has required permission to get the widget data
var self = module.exports = {
    checkUserPermission: function (req, res, done) {
        Widget.findOne({_id: req.params.widgetId}, {
            dashboardId: 1,
            charts: 1,
            widgetType: 1
        }, function (err, response) {
            if (err)
                return res.status(500).json({error: 'Internal server error'});
            else if (!response)
                return res.status(204).json({error: 'No records found'});
            else {
                req.dashboardId = response.dashboardId;
                if (req.user)
                    self.checkUserAccess(req, res, done);
                else
                    return res.status(401).json({error: 'User must be logged in'});

            }


        });
    },
    checkUserAccess: function (req, res, done) {
        User.findOne({
            _id: req.user._id,
            dashboards: {$elemMatch: {dashboardId: req.dashboardId}}
        }, function (err, user) {
            if (err)
                return res.status(500).json({error: 'Internal Server Error'});
            else if (!user)
                return res.status(401).json({error: 'Authentication required to perform this action'});
            else
                done(null, user);
        })
    },
    findObjectsForProfile: function (req, res, done) {
        var metaString = {};
        var condition;
        for (var index in req.query.metaCondition) {
            metaString[index] = req.query.metaCondition[index];
        }
        metaString.profileId = req.params.profileID;
        if (req.query.metaCondition === undefined && req.query.objectTypeId != undefined) condition = metaString;
        else if (req.query.metaCondition != undefined) condition = metaString;
        else condition = metaString;
        objectList.find(condition, function (err, objects) {
            if (err) done(err);
            else if (objects != null && objects.length > 0) {
                req.profileId = objects[0].profileId;
                channelHelper.getChannelDetails(req, res, function (err, channel) {
                    if (err)
                        return res.status(500).json({error: 'Internal server error'});
                    else {
                        if (channel.code === configAuth.channels.googleAnalytics) {
                            var result = _.chain(objects)
                                .groupBy("meta.webPropertyName")
                                .toPairs()
                                .map(function (currentItem) {
                                    return _.zipObject(["webPropertyName", "metricDetails"], currentItem);
                                })
                                .value();
                            req.app.objects = result;
                            done(null, result);
                        }
                        else {
                            req.app.objects = objects;
                            done(null, objects);
                        }
                    }
                })
            } else {
                req.app.objects = [];
                done(null, []);
            }
        })
    },
    sendEmail: function (mailOptions, alertId, done) {
        // Send
        transporter.sendMail(mailOptions, function (error, info) {
            if (error) done(null, 'success')
            else {
                Alert.update({_id: alertId}, {$set: {lastEvaluatedTime: new Date()}}, function (err, alertUpdate) {
                    done(null, 'success')
                })
            }
        });
    },
    dashboardList: function (req, res, done) {
        dashboards.find({orgId: req.user.orgId}, {
            _id: 1
        }, function (err, dashboards) {
            if (err)
                return res.status(500).json({error: 'Internal Server Error'});
            else if (!dashboards)
                return res.status(204).json({error: 'No record found'});
            else {
                //the array only the dashboards ids
                var dashboardsArray = [];
                for (var i = 0; i < dashboards.length; i++) {
                    dashboardsArray.push(dashboards[i]._id)
                }
                done(null, dashboardsArray)
            }
        })
    },
    widgetsList: function (req, res, done) {
        if (req.query.requestType !== configAuth.limitRequestType.alert) {
            var query = {dashboardId: {$in: req.dashboards}, widgetType: req.query.requestType}
        }
        else {
            var query = {dashboardId: {$in: req.dashboards}}
        }
        Widget.find(query, {
            _id: 1
        }, function (err, widgets) {
            if (err)
                return res.status(500).json({error: 'Internal Server Error'});
            else if (!widgets)
                return res.status(204).json({error: 'No record found'});
            else {
                var widgetsArray = [];
                for (var i = 0; i < widgets.length; i++) {
                    widgetsArray.push(widgets[i]._id)
                }
                done(null, widgetsArray)
            }
        })
    },
    alertsList: function (req, res, done) {
        Alert.find({widgetId: {$in: req.widgets}},
            {
                _id: 1
            }, function (err, alerts) {
                if (err)
                    return res.status(500).json({error: 'Internal Server Error'});
                else if (!alerts)
                    return res.status(204).json({error: 'No record found'});
                else {
                    done(null, alerts)
                }
            })
    },
    getSubscriptionType: function (req, res, done) {
        organization.findOne({_id: req.user.orgId}, function (err, subscriptionType) {
            if (err)
                return res.status(500).json({error: 'Internal Server Error'});
            else if (!subscriptionType.subscriptionTypeId)
                return res.status(204).json({error: 'No record found'});
            else {
                subscription.findOne({_id: subscriptionType.subscriptionTypeId}, function (err, response) {
                    if (err)
                        return res.status(500).json({error: 'Internal Server Error'});
                    else if (!response)
                        return res.status(204).json({error: 'No record found'});
                    else {
                        done(null, response)
                    }
                })
            }
        })
    },

    getObjectsBasedAccountId: function (req, res, done) {
        objectList.findOne({profileId: req.profileId, channelObjectId: req.getObjectId}, function (err, object) {
            if (err) return res.status(500).json({error: err});
            else if (!object) return res.status(204).json({error: 'No records found'});
            else done(null, object)
        });
    }
};

