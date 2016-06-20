//var user = require('../models/user');
var _ = require('lodash');
var channelHelper = require('../helpers/getChannelDetails');
var exports = module.exports = {};
var objectList = require('../models/objects.js');
var configAuth = require('../config/auth');

/**
 Function to get the object's details such as pages, views inside a chosen profile..
 */

exports.objects = function (req, res, next) {

    req.app = {};

    objectList.find({profileId: req.params.profileID}, function (err, objects) {
        if(objects != null && objects.length > 0){
            req.profileId = objects[0].profileId;

            channelHelper.getChannelDetails(req, function (err, channel) {
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
                        next();
                    }
                    else{
                        req.app.objects = objects;
                        next();
                    }
                }
            })
        } else {
            req.app.objects = [];
            next();
        }
    })
};