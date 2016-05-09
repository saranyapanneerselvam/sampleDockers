//var user = require('../models/user');
var exports = module.exports = {};
var objectList = require('../models/objects.js');
/**
 Function to get the object's details such as pages, views inside a chosen profile..

 */
exports.objects = function (req, res, next) {
    req.showMetric = {};
    objectList.find({profileId: req.params.profileID}, function (err, objects) {
        req.showMetric.objects = objects;
        next();
    })
};


