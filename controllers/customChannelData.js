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

    //To update the existing customChannel Data
    app.put('/api/v1/create/customdata/:widgetId', customChannelData.updateCustomChannelData, function (req, res) {
        console.log(req.app.result);
        var customDataResult = req.app.result;
        if (customDataResult)
            res.json(customDataResult);
        else
            res.status(500).send({error: ""});
    });

    app.post('/api/v1/customWidget/data/:widgetId', customChannelData.getCustomChannelWidgetData, function (req, res) {
        var getCustomChannelData = req.app.result;
        res.json(getCustomChannelData);
    });

};