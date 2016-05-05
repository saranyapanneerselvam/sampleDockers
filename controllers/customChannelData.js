var customChannelData = require('../middlewares/customChannelData');

module.exports = function (app) {
    /**
     *  to store / get the list of data for custom widgets
     * @param app - loading the app which is for using express ,etc
     * @param req - request from client - contains urls,inputs ..
     * @callback dashboard - result from db call
     */

    //To store the customChannel Data
    app.post('/api/v1/create/customdata/:widgetId', customChannelData.saveCustomChannelData, function (req, res) {
        var customDataResult = req.app.result;
        if (customDataResult)
            res.json(customDataResult);
        else
            res.status(500).send({error: ""});
    });


    app.get('/api/v1/customWidgetData/:widgetId', customChannelData.customWidgetDataInfo, function (req, res) {
        if (req.showMetric.error)
            res.status(500).send({error: "error in getting customData"});
        else {
            var customWidgetData = req.showMetric.customWidgetData;
            if (customWidgetData)
                res.json(customWidgetData);
            else
                res.json(404);
        }
    });


    app.post('/api/v1/customWidget/data/:widgetId', customChannelData.getCustomChannelWidgetData, function (req, res) {
        var getCustomChannelData = req.app.result;
        res.json(getCustomChannelData);
    });

};