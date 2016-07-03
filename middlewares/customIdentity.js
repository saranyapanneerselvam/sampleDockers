var mongoose = require('../node_modules/mongoose/lib');
var customIdentityList = require('../models/customIdentity');
var exports = module.exports = {};
/**
 Function to store custom identity details
 @params 1.req contains the app user details i.e. userId
 2.res have the query response
 */

/**
 * To store the customIdentity details in database
 * @param req - user details
 * @param res
 * @param next - callback
 */
exports.storeCustomIdentity = function (req, res, next) {
        var createCustomIdentity = new customIdentityList();
        createCustomIdentity.userId = req.body.userId;
        createCustomIdentity.dashboardId = req.body.dashboardId;
        createCustomIdentity.widgetType = req.body.widgetType;
        createCustomIdentity.created = new Date();
        createCustomIdentity.updated = new Date();
        createCustomIdentity.save(function (err, customData) {
            if (err)
                return res.status(500).json({error: 'Internal server error'});
            else if (!alert)
                return res.status(204).json({error: 'No records found'});
            else {
                    req.app.result = {'status': '200', 'id': customData._id};
                    next();
                }
            });
};


