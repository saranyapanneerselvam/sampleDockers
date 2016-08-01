var exports = module.exports = {};
var async = require("async");

//To load the data model
var Widget = require('../models/widgets');
var customData = require('../models/data');
exports.saveCustomChannelData = function (req, res, next) {
    var existcustomDataID = 0;
    customData.find({widgetId: req.params.widgetId}, function (err, result) {
        if (err)
            return res.status(500).json({error: err});
        else if (result == "" || result == "[]") {
            var isSendPost = 1;
            var sendMessage = "";
            var createCustomData = new customData();

            //To store the customData
            createCustomData.widgetId = req.params.widgetId;
            createCustomData.metricsCount = req.body.metricsCount;
            createCustomData.chartType = req.body.chartType;
            createCustomData.intervalType = req.body.intervalType;
            createCustomData.data = req.body.data;
            var json = "";
            if (createCustomData.metricsCount == undefined || createCustomData.chartType == undefined || createCustomData.intervalType == undefined || createCustomData.data == undefined) {
                isSendPost = 0;
            }
            else {
                json = req.body.data;
            }

            if (json == "") {
                isSendPost = "";
            }
            else {

                function IsJsonString(str) {
                    try {
                        JSON.parse(str);
                    } catch (e) {
                        return false;
                    }
                    return true;
                }

                if (IsJsonString(json)) {
                    isSendPost = "";
                }
                else {
                    isSendPost = 1;
                    var newJson = json.replace(/([a-zA-Z0-9]+?):/g, '"$1":');
                    newJson = newJson.replace(/'/g, '"');
                    var data = JSON.parse(newJson);

                    var pattern = /^([0-9]{2})\/([0-9]{2})\/([0-9]{4})$/; // DD/MM/YYYY or MM/DD/YYYY
                    var convertDateMMDDYYYY = function (usDate) {
                        var dateParts = usDate.split(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
                        return dateParts[3] + "-" + dateParts[2] + "-" + dateParts[1];
                    }

                    for (getChcekValue in data) {
                        if (pattern.test(data[getChcekValue].date) == false) {
                            isSendPost = "Incorrect Date";
                        }

                        if (data[getChcekValue].name == undefined || data[getChcekValue].date == undefined || data[getChcekValue].values == undefined || data[getChcekValue].name == '' || data[getChcekValue].date == '' || data[getChcekValue].values == '') {
                            isSendPost = 0;
                        }


                        var inDate = data[getChcekValue].date;
                        var outDateMMDDYYYY = convertDateMMDDYYYY(inDate);
                        var date = data[getChcekValue].date;
                        var checkMonthDate = date.split("/");
                        var outDateDDMMYYYY = date.split("/").reverse().join("-");

                        if (checkMonthDate[0] > 12) {
                            data[getChcekValue].date = outDateDDMMYYYY;
                        }
                        else {
                            data[getChcekValue].date = outDateMMDDYYYY;
                        }

                        if (checkMonthDate[0] > 31 && checkMonthDate[1] > 31) {
                            isSendPost = 0;
                        }

                        var inTotal = parseInt(data[getChcekValue].values);
                        data[getChcekValue].values = inTotal;

                    }
                }
            }
            createCustomData.data = data;
            createCustomData.created = new Date();
            createCustomData.updated = new Date();
            if (isSendPost == 1) {
                createCustomData.save(function (err, dataResponse) {
                    if (err)
                        return res.status(500).json({error: 'Internal server error'});
                    else if (!dataResponse)
                        return res.status(204).json({error: 'No records found'});
                    else{
                        req.app.result = {'status': '200', 'message': 'New custom data created successfully'};
                        next();
                    }
                });
                isSendPost = "";
            }
            else {
                if (json != "" && isSendPost == 0 || json == "" && isSendPost == "") {
                    sendMessage = "Incorrect Input Data provided. Kindly refer to the documentation for the correct data.";
                }
                else if (json != "" && isSendPost == "Incorrect Date") {
                    sendMessage = "Input Date format is incorrect. Allowed Date Format is DD/MM/YYYY or MM/DD/YYYY";
                }
                isSendPost = "";
                req.app.result = {'status': 'Error', 'message': sendMessage};
                next();
            }

        }
        else {
            existcustomDataID = result[0]._id;

            var isSendPost = 1;
            var sendMessage = "";
            var createCustomData = new customData();
            createCustomData.data = req.body.data;
            createCustomData.widgetId = req.params.widgetId;
            createCustomData.metricsCount = req.body.metricsCount;
            createCustomData.chartType = req.body.chartType;
            createCustomData.intervalType = req.body.intervalType;
            var json = "";
            if (createCustomData.metricsCount == undefined || createCustomData.chartType == undefined || createCustomData.intervalType == undefined || createCustomData.data == undefined) {
                isSendPost = 0;
            }
            else {
                json = req.body.data;
            }

            if (json == "") {
                isSendPost = "";
            }
            else {

                function IsJsonString(str) {
                    try {
                        JSON.parse(str);
                    } catch (e) {
                        return false;
                    }
                    return true;
                }

                if (IsJsonString(json)) {
                    isSendPost = "";
                }
                else {
                    isSendPost = 1;
                    var newJson = json.replace(/([a-zA-Z0-9]+?):/g, '"$1":');
                    newJson = newJson.replace(/'/g, '"');
                    var data = JSON.parse(newJson);

                    var pattern = /^([0-9]{2})\/([0-9]{2})\/([0-9]{4})$/; // DD/MM/YYYY or MM/DD/YYYY
                    var convertDateMMDDYYYY = function (usDate) {
                        var dateParts = usDate.split(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
                        return dateParts[3] + "-" + dateParts[2] + "-" + dateParts[1];
                    }

                    for (getChcekValue in data) {
                        if (pattern.test(data[getChcekValue].date) == false) {
                            isSendPost = "Incorrect Date";
                        }

                        if (data[getChcekValue].name == undefined || data[getChcekValue].date == undefined || data[getChcekValue].values == undefined || data[getChcekValue].name == '' || data[getChcekValue].date == '' || data[getChcekValue].values == '') {
                            isSendPost = 0;
                        }

                        var inDate = data[getChcekValue].date;
                        var outDateMMDDYYYY = convertDateMMDDYYYY(inDate);
                        var date = data[getChcekValue].date;
                        var checkMonthDate = date.split("/");
                        var outDateDDMMYYYY = date.split("/").reverse().join("-");

                        if (checkMonthDate[0] > 12) {
                            data[getChcekValue].date = outDateDDMMYYYY;
                        }
                        else {
                            data[getChcekValue].date = outDateMMDDYYYY;
                        }

                        if (checkMonthDate[0] > 31 && checkMonthDate[1] > 31) {
                            isSendPost = 0;
                        }

                        var oldValue = 0;
                        var newValue = 0;
                        for (getData in result[0].data) {
                            if (result[0].data[getData].values != undefined) {
                                oldValue = result[0].data[getData].values;
                                var inTotal = parseInt(data[getChcekValue].values);

                                if (data[getChcekValue].date == result[0].data[getData].date && data[getChcekValue].name == result[0].data[getData].name) {
                                    newValue = parseInt(oldValue) + parseInt(inTotal);
                                    data[getChcekValue].values = newValue;
                                }

                            }
                        }
                    }
                }
            }

            if (isSendPost == 1) {
                var updated = new Date();
                customData.update({
                    _id: existcustomDataID
                }, {
                    $set: {
                        "widgetId": req.params.widgetId,
                        "data": data,
                        "metricsCount": req.body.metricsCount,
                        "chartType": req.body.chartType,
                        "intervalType": req.body.intervalType,
                        updated: updated
                    }
                }, function (err, updateResult) {
                    if (err)
                        return res.status(500).json({error: 'Internal server error'})
                    else if (updateResult == 0)
                        return res.status(501).json({error: 'Not implemented'})
                    else {
                        sendMessage = "Custom Data Updated successfully";
                        isSendPost = "";
                        req.app.result = {'status': '200', 'message': sendMessage};
                        next();
                    }

                });

            }
            else {
                if (json != "" && isSendPost == 0 || json == "" && isSendPost == "") {
                    sendMessage = "Incorrect Input Data provided. Kindly refer to the documentation for the correct data.";
                }
                else if (json != "" && isSendPost == "Incorrect Date") {
                    sendMessage = "Input Date format is incorrect. Allowed Date Format is DD/MM/YYYY or MM/DD/YYYY";
                }
                isSendPost = "";
                req.app.result = {'status': 'Error', 'message': sendMessage};
                next();
            }

        }
    })
};


exports.updateCustomChannelData = function (req, res, next) {
    customData.find({widgetId: req.params.widgetId}, function (err, result) {
        if (err)
            return res.status(500).json({error: err});
        else if (!result.length)
            return res.status(204).json({error: 'No records found'});
        else{
            var customDataID = result[0]._id;
            var isSendPost = 1;
            var sendMessage = "";
            var createCustomData = new customData();
            createCustomData.data = req.body.data;
            createCustomData.widgetId = req.params.widgetId;
            createCustomData.metricsCount = req.body.metricsCount;
            createCustomData.chartType = req.body.chartType;
            createCustomData.intervalType = req.body.intervalType;
            var json = "";
            if (createCustomData.metricsCount == undefined || createCustomData.chartType == undefined || createCustomData.intervalType == undefined || createCustomData.data == undefined) {
                isSendPost = 0;
            }
            else {
                json = req.body.data;
            }

            if (json == "") {
                isSendPost = "";
            }
            else {

                function IsJsonString(str) {
                    try {
                        JSON.parse(str);
                    } catch (e) {
                        return false;
                    }
                    return true;
                }

                if (IsJsonString(json)) {
                    isSendPost = "";
                }
                else {
                    isSendPost = 1;
                    var newJson = json.replace(/([a-zA-Z0-9]+?):/g, '"$1":');
                    newJson = newJson.replace(/'/g, '"');
                    var data = JSON.parse(newJson);

                    var pattern = /^([0-9]{2})\/([0-9]{2})\/([0-9]{4})$/; // DD/MM/YYYY or MM/DD/YYYY
                    var convertDateMMDDYYYY = function (usDate) {
                        var dateParts = usDate.split(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
                        return dateParts[3] + "-" + dateParts[2] + "-" + dateParts[1];
                    }

                    for (getChcekValue in data) {
                        if (pattern.test(data[getChcekValue].date) == false) {
                            isSendPost = "Incorrect Date";
                        }

                        if (data[getChcekValue].name == undefined || data[getChcekValue].date == undefined || data[getChcekValue].values == undefined || data[getChcekValue].name == '' || data[getChcekValue].date == '' || data[getChcekValue].values == '') {
                            isSendPost = 0;
                        }

                        var inDate = data[getChcekValue].date;
                        var outDateMMDDYYYY = convertDateMMDDYYYY(inDate);
                        var date = data[getChcekValue].date;
                        var checkMonthDate = date.split("/");
                        var outDateDDMMYYYY = date.split("/").reverse().join("-");

                        if (checkMonthDate[0] > 12) {
                            data[getChcekValue].date = outDateDDMMYYYY;
                        }
                        else {
                            data[getChcekValue].date = outDateMMDDYYYY;
                        }

                        if (checkMonthDate[0] > 31 && checkMonthDate[1] > 31) {
                            isSendPost = 0;
                        }

                        var inTotal = parseInt(data[getChcekValue].values);
                        data[getChcekValue].values = inTotal;
                    }
                }
            }

            if (isSendPost == 1) {
                var updated = new Date();
                customData.update({
                    _id: customDataID
                }, {
                    $set: {
                        "widgetId": req.params.widgetId,
                        "data": data,
                        "metricsCount": req.body.metricsCount,
                        "chartType": req.body.chartType,
                        "intervalType": req.body.intervalType,
                        updated: updated
                    }
                }, function (err, updateResult) {
                    if (err) {
                        sendMessage = "Failed in updating the Custom Data";
                    }
                    else {
                        sendMessage = "Custom Data Updated successfully";
                    }
                    isSendPost = "";
                    req.app.result = {'status': '200', 'message': sendMessage};
                    next();
                });

            }
            else {
                if (json != "" && isSendPost == 0 || json == "" && isSendPost == "") {
                    sendMessage = "Incorrect Input Data provided. Kindly refer to the documentation for the correct data.";
                }
                else if (json != "" && isSendPost == "Incorrect Date") {
                    sendMessage = "Input Date format is incorrect. Allowed Date Format is DD/MM/YYYY or MM/DD/YYYY";
                }
                isSendPost = "";
                req.app.result = {'status': 'Error', 'message': sendMessage};
                next();
            }
        }
    })
};

exports.getCustomChannelWidgetData = function (req, res, next) {

    customData.aggregate([
            // Unwind the array to denormalize
            {"$unwind": "$data"},
            // Match specific array elements
            {
                "$match": {
                    $and: [{"data.date": {$gte: req.body.startDate}}, {"data.date": {$lte: req.body.endDate}}, {"widgetId": req.params.widgetId}]
                }
            },
            // Group back to array form
            {
                "$group": {
                    "_id": "$_id",
                    "data": {"$push": "$data"},
                    "chartType": {"$first": "$chartType"},
                    "updated": {"$first": "$updated"},
                    "created": {"$first": "$created"},
                    "intervalType": {"$first": "$intervalType"},
                    "metricsCount": {"$first": "$metricsCount"},
                    "widgetId": {"$first": "$widgetId"}
                }
            }]
        , function (err, result) {
            if (err)
                return res.status(500).json({error: err});
            else if (!result.length)
                return res.status(204).json({error: 'No records found'});
            else {
                req.app.result = result;
                next();
            }
        })
};