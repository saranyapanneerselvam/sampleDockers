var _ = require('lodash');
var channelHelper = require('../helpers/getChannelDetails');
var objectList = require('../models/objects');
var configAuth = require('../config/auth');
var Widget = require('../models/widgets');
var User = require('../models/user');

//To check whether the user has required permission to get the widget data
var self = module.exports = {
    checkUserPermission: function (req, res, done) {
        Widget.findOne({_id: req.params.widgetId}, {
            dashboardId: 1,
            charts: 1,
            widgetType: 1
        }, function (err, response) {
            req.dashboardId = response.dashboardId;
            if (req.user) 
                self.checkUserAccess(req, res, done);
            else 
                return res.status(401).json({error: 'User must be logged in'});
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
                done(null,user);
        })
    },
    findObjectsForProfile: function (req, res, done) {
        objectList.find({profileId: req.params.profileID}, function (err, objects) {
            if (objects != null && objects.length > 0) {
                req.profileId = objects[0].profileId;

                channelHelper.getChannelDetails(req,res, function (err, channel) {
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
                            done(null,result);
                        }
                        else {
                            req.app.objects = objects;
                            done(null,objects);
                        }
                    }
                })
            } else {
                req.app.objects = [];
                done(null,[]);
            }
        })
    }
};

