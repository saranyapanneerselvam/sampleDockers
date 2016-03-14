var updateWidgetData = require('../middlewares/updateWidgetData');

//To update the widget data
module.exports = function(app){

    //To update the data in specified dashboard's widgets
    app.get('/api/v1/update/dashboard/widgetData', updateWidgetData.dashboardWidgetData, function (req, res) {
        var googleAnalyticData = req.app.result;
        if (googleAnalyticData)
            res.json({'result': googleAnalyticData});
        else
            res.json({'message': req.app.error.message});
    });
};