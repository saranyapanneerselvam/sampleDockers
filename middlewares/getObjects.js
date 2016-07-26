var exports = module.exports = {};
var getObjects = require('../helpers/utility');
var ObjectType = require('../models/objectTypes')

/**
 Function to get the object's details such as pages, views inside a chosen profile..
 */

exports.objects = function (req, res, next) {
    getObjects.findObjectsForProfile(req, res, function (err, object) {
        if (err)
            return res.status(500).json({error: 'Internal server error'});
        else {
            req.app.objects = object;
            next();
        }
    });
};

exports.objectTypes = function (req, res, next) {
    ObjectType.findOne({_id:req.params.objectTypeId},function (err,objectType) {
        if (err)
            return res.status(500).json({error: 'Internal Server Error'});
        else if (!objectType)
            return res.status(401).json({error: 'Authentication required to perform this action'});
        else{
            req.app.result = objectType;
            next();
        }
    })
};