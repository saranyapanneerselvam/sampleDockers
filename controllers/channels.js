var channelMiddleWare = require('../middlewares/getChannels');

/**
 * This is the middleware to get the list of channels based on orgId
 * @param app - loading the app which is for using express ,etc
 * @param req - request from client - contains urls,inputs ..
 * @callback dashboard - result from db call
 */
module.exports = function (app) {

    //To get list of channels
    app.get('/api/v1/get/channels', channelMiddleWare.getChannels, function (req, res) {
        res.json(req.app.result);
    });

    //To get object types
    app.get('/api/v1/channels/:channelId', channelMiddleWare.getObjectTypes, function (req, res) {
        res.json(req.app.result);
    });
};