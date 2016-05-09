var exports = module.exports = {};
var async = require("async");
//To load the data model
var Widget = require('../models/widgets');
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
        var convertDateMMDDYYYY = function(usDate) {
            var dateParts = usDate.split(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
            return dateParts[3] + "-" + dateParts[2] + "-" + dateParts[1];
        }

        for(getChcekValue in data){
            if(pattern.test(data[getChcekValue].date)==false){
                isSendPost=0;
            }

            var inDate = data[getChcekValue].date;
            var outDateMMDDYYYY = convertDateMMDDYYYY(inDate);
            var date = data[getChcekValue].date;
            var checkMonthDate = date.split("/");
            var outDateDDMMYYYY = date.split("/").reverse().join("-");

            if(checkMonthDate[0] > 12){
                data[getChcekValue].date = outDateDDMMYYYY;
            }
            else{
                data[getChcekValue].date = outDateMMDDYYYY;
            }

            var inTotal = parseInt(data[getChcekValue].total);
            data[getChcekValue].total = inTotal;
        }

        console.log("Is Send Post : "+isSendPost);
        console.log(data);
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

exports.getCustomChannelWidgetData = function (req, res, next) {

    customData.find({'widgetId':req.params.widgetId}, function (err, result) {
        if(err)
            req.app.result = {'error': err};
        else if (result.length)
            req.app.result = result;
        else
            req.app.result = {'status': '301', 'message':'No Records Found'};
        next();
    });
};