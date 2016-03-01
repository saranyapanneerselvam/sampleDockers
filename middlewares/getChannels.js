var channels = require('../models/channels');
var exports = module.exports = {};
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
    channels.find({}, function (err, channelDetails) {
        if (err)
            req.showMetric.error = {error: err, message: 'Database error'};
        else if (!channelDetails.length)
            req.showMetric.status = {status: 302, message: 'No record found'};
        else
            req.showMetric.channelList = channelDetails;
        next();

    })

}