var exports = module.exports = {};

//To load the data model
var customData = require('../models/data');


exports.saveCustomChannelData = function (req, res, next) {
    console.log(req.body);
    var isSendPost = 1;
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

        var pattern =/^([0-9]{2})\/([0-9]{2})\/([0-9]{4})$/; // DD/MM/YYYY or MM/DD/YYYY

        for(getChcekValue in data){
            console.log("Valid Date Check : "+pattern.test(data[getChcekValue].date));
            if(pattern.test(data[getChcekValue].date)==false){
                isSendPost=0;
            }
        }
        console.log("Is Send Post : "+isSendPost);
        createCustomData.data= data;
        createCustomData.created = new Date();
        createCustomData.updated = new Date();
        if(isSendPost==1){
            createCustomData.save(function (err, dataResponse) {
                if (!err)
                    req.app.result = {'status': '200', 'message': 'New custom data created'};
                else
                    req.app.result = {'status': '302'};
                next();
            });
            isSendPost="";
        }
        else{
            isSendPost="";
            req.app.result = {'status': 'Error', 'message':'Input Date format is incorrect. Allowed Date Format is DD/MM/YYYY or MM/DD/YYYY'};
            next();
        }

};


exports.customWidgetDataInfo = function (req, res, next) {

    req.showMetric = {};
    if (!req.user) {
        req.showMetric.error = 500;
        next();
    }
    else {
        customData.find({widgetId: req.params.widgetId}, function (err, result) {
            console.log('result', req.params.widgetId, result);
            req.showMetric.customWidgetData = result;
            next();
        })
    }

};