var Channel = require('../models/channels');
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
    var channel = new Channel();
    channel.name = "CustomData";
    channel.code = "CustomData";
    channel.created = new Date();
    channel.updated = new Date();
    channel.save(function (err, channel) {
        if (err)
            return res.status(500).json({error: 'Internal server error'});
        else if (!channel)
            return res.status(204).json({error: 'No records found'});
        else {
            req.app.result = {newChannelId:channel._id};
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
    req.showMetric = {};
    /**Find list of channels from channel collection
     * @params err - is null if no error else will have error message details
     * @params channelDetails - response from collection(list of channels)
     */
    Channel.find({}, function (err, channel) {
        if (err)
            req.app.result = {error: err, message: 'Database error'};
        else if (!channel.length)
            req.app.result = {status: 302, message: 'No record found'};
        else
            req.app.result = channel;
        next();
    })
};

/*
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

};
*/