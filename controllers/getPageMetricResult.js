var channelMiddleWare = require('../middlewares/getChannels');
var getChannelMetricData = require('../middlewares/getChannelData');
var getChannelPageList = require('../middlewares/channelObjectList');

/**
 * This is the middleware to get the list of channels based on orgId
 * @param app - loading the app which is for using express ,etc
 * @param req - request from client - contains urls,inputs ..
 * @callback dashboard - result from db call
 */
module.exports = function (app) {

    /**
     * To get the google account,property,views detatail based on account detail
     */
    app.get('/api/v1/channel/profiles/objectsList/:profileId', getChannelPageList.listAccounts, function (req, res) {
            res.json( req.app.result);
    });


    // To get the google data based on metric name
    app.post('/api/v1/widgets/data/:widgetId', getChannelMetricData.getChannelData, function (req, res) {
        var getChannelData = req.app.result;
            res.json(getChannelData);
    });



};