var exports = module.exports = {};
var getObjects = require('../helpers/utility');

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