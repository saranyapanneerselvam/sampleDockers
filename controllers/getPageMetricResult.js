var channelMiddleWare = require('../middlewares/getChannels');
var getGoogleMetricData = require('../middlewares/googleBasic');

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
    app.get('/api/v1/channels/objectsList', getGoogleMetricData.listAccounts, function (req, res) {

        var googleAnalyticData = req.showMetric.pageLists;
        console.log('googleAnalyticData',googleAnalyticData);
        if (googleAnalyticData)
            res.json({
                'listOfPages': googleAnalyticData
            });
        else
            res.json({'message': req.showMetric.error.message});
    });


    // To get the google data based on metric name
    app.post('/api/v1/channels/data', getGoogleMetricData.getGoogleAnalyticData, function (req, res) {
        console.log('result');
        var googleAnalyticData = req.app.result;
        if (googleAnalyticData)
            res.json({'result': googleAnalyticData});
        else
            res.json({'message': req.app.error.message});
    });



};