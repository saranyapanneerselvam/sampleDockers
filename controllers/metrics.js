var getmetricsList = require('../middlewares/getMetrics');

/**
 * This is the middleware to get the list of metrics based on channels
 * @param app - loading the app which is for using express ,etc
 * @param req - request from client - contains urls,inputs ..
 * @callback dashboard - result from db call
 */
module.exports = function (app) {
    app.get('/api/v1/get/metrics/:channelId', getmetricsList.metrics, function (req, res) {
        var metrics = req.showMetric.metrics;
        console.log('Here it comes');
        if (metrics)
            res.json({metricsList: metrics});
        else
            res.status(500).send({error: ""});
    });
};