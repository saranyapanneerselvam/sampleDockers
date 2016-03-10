var channels = require('../models/channels');
var objectType = require('../models/objectTypes');
var exports = module.exports = {};

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

exports.getObjectTypes = function (req, res, next) {
console.log('channelId',req.params.channelId);
    objectType.find({'channelId':req.params.channelId}, function (err,objectTypes) {
        console.log('types',objectTypes);
    })

}