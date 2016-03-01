var channelMiddleWare = require('../middlewares/getChannels');

/**
 * This is the middleware to get the list of channels based on orgId
 * @param app - loading the app which is for using express ,etc
 * @param req - request from client - contains urls,inputs ..
 * @callback dashboard - result from db call
 */
module.exports = function (app) {
    app.get('/api/v1/get/channels', channelMiddleWare.getChannels, function (req, res) {
        var channelsList = req.showMetric.channelList;

        //Checks if channelList is not empty
        if (channelsList)
            res.json({channelList: req.showMetric.channelList});

        //Checks if there is any database error
        else if (req.showMetric.error) {
            var status = req.showMetric.error;
            res.status(status.status).send({error: status.message});
        }

        //Checks no channelList from database
        else {
            var status = req.showMetric.status;
            res.json(status);
            res.status(status.status).send({error: status.message});
        }
    });
};