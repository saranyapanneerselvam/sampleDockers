var exports = module.exports = {};

//To load the data model
var customData = require('../models/data');


exports.saveCustomChannelData = function (req, res, next) {
    console.log(req.body);
    var createCustomData = new customData();
        //To store the customData
        createCustomData.widgetId = req.params.widgetId;
        createCustomData.metricsCount= req.body.metricsCount;
        createCustomData.chartType= req.body.chartType;
        createCustomData.intervalType= req.body.intervalType;
        var json = req.body.data;
        var newJson = json.replace(/([a-zA-Z0-9]+?):/g, '"$1":');
        newJson = newJson.replace(/'/g, '"');
        var data = JSON.parse(newJson);
        createCustomData.data= data;
        createCustomData.created = new Date();
        createCustomData.updated = new Date();
        console.log('New custom data created');
        console.log(createCustomData);
        createCustomData.save(function (err, dataResponse) {
            if (!err)
                req.app.result = {'status': '200', 'message': dataResponse};
            else
                req.app.result = {'status': '302'};
            next();
        });

};
