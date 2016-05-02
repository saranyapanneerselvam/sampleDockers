var channels = require('../models/channels');
var objectType = require('../models/objectTypes');
var exports = module.exports = {};



/**
 Function to store a channel
 @params 1.req contains the channel name
 2.res have the query response
 */

/**
 * To store the channel details in database
 * @param req - channel name
 * @param res
 * @param next - callback
 */
exports.storeChannel = function (req, res, next) {

    var channel = new channels();
    channel.name = "CustomData";
    channel.code = "CustomData";
    channel.created = new Date();
    channel.updated = new Date();
    channel.save(function (err, data) {
        if (!err) {
            req.app.result = {'status': '200', 'newChannelId': data._id};
            next();
        }
        else {
            req.app.result = {'status': '302'};
            next();
        }
    });

};

/**
 Function to get the channel's details such as name,logo,code..
 @params 1.req contains the facebook user details i.e. username,email etc
 2.res have the query response

 */
exports.getChannels = function (req, res, next) {

    /**Find list of channels from channel collection
     * @params err - is null if no error else will have error message details
     * @params channelDetails - response from collection(list of channels)
     */
    channels.find({}, function (err, channelDetails) {
        if (err)
            req.app.result = {error: err, message: 'Database error'};
        else if (!channelDetails.length)
            req.app.result = {status: 302, message: 'No record found'};
        else
            req.app.result = channelDetails;
        next();

    })

}

//To get the list of object types for a channel
exports.getObjectTypes = function (req, res, next) {
    objectType.find({'channelId':req.params.channelId}, function (err, types) {
        if(err)
            req.app.result = {'error': err};
        else if (types.length)
            req.app.result = {'status': '200', 'objectTypes': types};
        else
            req.app.result = {'status': '301'};
        next();
    });

}