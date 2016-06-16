/**
 * Created by user on 07-Jun-16.
 */
var moment = require('moment')
var Alert = require('../models/alert');
var exports = module.exports = {};
exports.createUpdateAlert = function (req, done) {
    console.log('alert from client',req.body)
    var createAlert = new Alert();
    var updateValue = {};
    var now = new Date();

    //To check whether new dashboard or not
    if (req.body.alertId == undefined) {
        createAlert.name = req.body.name;
        createAlert.operation = req.body.operation;
        createAlert.threshold = req.body.threshold;
        createAlert.interval = req.body.interval;
        createAlert.widgetId = req.body.widgetId;
        createAlert.metricId = req.body.metricId;
        createAlert.objectId = req.body.objectId;
        createAlert.mute = req.body.mute;
        createAlert.endPoint = req.body.endPoint;
        createAlert.mailingId = req.body.mailingId;
        createAlert.lastEvaluatedTime = req.body.lastEvaluatedTime;
        createAlert.created = now;
        createAlert.updated = now;
        createAlert.lastEvaluatedTime = now;
        req.body.updated = now;
        var objectLength = Object.keys(req.body).length;
        var myDate = '2016-06-07T12:35:59.443Z';
        var localTime  = moment.utc(myDate).toDate();
        var utcTime = moment(localTime).format('YYYY-MM-DD HH:mm:ss');
        var time = moment(now).format('YYYY-MM-DD HH:mm:ss');
        console.log(utcTime,'time',time);
        for(var index in req.body){
            console.log('index',index);
            if(req.body[index] !=undefined)
                updateValue[index] = req.body[index];

        }

        console.log(updateValue);
        createAlert.save(function (err, alert) {
            if (err)
                return res.status(500).json({error: 'Internal server error'});
            else if (!alert)
                return res.status(204).json({error: 'No records found'});
            else {
                req.app.result = alert;
                done();
            }
        })

    }


    //To update already existing database
    else {
        req.body.updated = now;
        req.body.lastEvaluatedTime = now;
        for(var index in req.body){
            console.log('index',index);
            if(req.body[index] !=undefined)
                updateValue[index] = req.body[index];

        }

        // update the dashboard data
        Alert.update({_id: req.body.alertId}, {
            $set: updateValue
        }, {upsert: true}, function (err, alert) {
            if (err)
                return res.status(500).json({error: 'Internal server error'})
            else if (alert == 0)
                return res.status(501).json({error: 'Not implemented'})
            else {
                req.app.result = alert;
                done();
            }
        });
    }
}

exports.getAlertForWidget =function(req, res, next){
    Alert.find({}, function (err, alertDetails) {
        if (err)
            req.app.result = {error: err, message: 'Database error'};
        else if (!alertDetails.length)
            req.app.result = {status: 302, message: 'No record found'};
        else
            req.app.result = alertDetails;
        next();

    })
}

exports.removeAlertForWidget = function(req,res,next){
    Alert.remove({'_id':req.params.widgetId},function(err,alerts){
        console.log('deleteAlerts',alerts);
        if (err)
            return res.status(500).json({error: 'Internal server error'});
        else if (alerts!=1)
            return res.status(501).json({error: 'Not implemented'});
        else {
            req.app.result = req.params.widgetId;
            next();
        }
    })
}