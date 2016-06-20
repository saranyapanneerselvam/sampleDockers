/**
 * BatchJobs - Used to update the channel data periodically
 */

var _ = require('lodash');

//job scheduling library
var Agenda = require('agenda');

//load async module
var async = require("async");

//To load the data model
var Data = require('./models/data');
var Metric = require('./models/metrics');
var Object = require('./models/objects');

var mongoConnectionString = 'mongodb://admin:admin@ds015334.mlab.com:15334/datapoolt15062016';
var moment = require('moment');
var nodemailer = require('nodemailer');

//Load the auth file
var configAuth = require('./config/auth');

//db connection for storing agenda jobs
var agenda = new Agenda({db: {address: mongoConnectionString}});
var mongoose = require('mongoose');
mongoose.connect(mongoConnectionString);//Connection with mongoose
var Alert = require('./models/alert');
agenda.define('Send Alerts', function (job, done) {
    var now = new Date();
    var storeOperator;
    var thresholdValue;
    async.auto({
        get_alert: getAlert,
        data: ['get_alert', getData]
    }, function (err, results) {
        if (err) console.log('error');
        console.log('final');
    });

    //Function to handle all queries result here
    function checkNullObject(callback) {
        return function (err, object) {
            if (err)
                callback('Database error: ' + err, null);
            else if (!object || object.length === 0)
                callback('No record found', '');
            else
                callback(null, object);
        }
    }

    function getAlert(callback) {
        console.log('getalert')
        Alert.find({}, checkNullObject(callback));
    }

    function getData(results, callback) {
        console.log('getdata');
        async.concatSeries(results.get_alert, evaluateData, callback)
    }

    function evaluateData(results, callback) {
        console.log('eval');
        var alert = results;
        var weekday = [];
        weekday[0] = configAuth.dayNames.Sunday;
        weekday[1] = configAuth.dayNames.Monday;
        weekday[2] = configAuth.dayNames.Tuesday;
        weekday[3] = configAuth.dayNames.Wednesday;
        weekday[4] = configAuth.dayNames.Thursday;
        weekday[5] = configAuth.dayNames.Friday;
        weekday[6] = configAuth.dayNames.Saturday;
        var utcTime = moment(alert.lastEvaluatedTime).format('YYYY-MM-DD');
        var time = moment(now).format('YYYY-MM-DD');
        var currentDayName = weekday[now.getDay()];
        console.log('time',utcTime,time,currentDayName);
        var operators = {
            '>': function (a, b) {
                return a > b
            },
            '<': function (a, b) {
                return a < b
            }
        };
        var transporter = nodemailer.createTransport({
            service: 'Gmail',
            auth: {
                user: 'rajalakshmi.c@habile.in',
                pass: 'habile3238'
            }
        });

        function sendEmail(mail, thresholdValue, metric, object, alertName,alertId) {

            // Email Setup
            var mailOptions = {
                from: 'Datapoolt Team <rajalakshmi.c@habile.in>',
                to: mail,
                subject: 'The alert ' + alertName + ' has been triggered',

                // HTML Version
                html: '<span>The data has crossed the limit of <b>' + thresholdValue + '</b></span>' + '<span> for the metric  <b>' + metric + '</b></span>' + '<span> in  <b>' + object + '</b></span>'

            };
            console.log('mailOptions', mailOptions);

            // Send
            transporter.sendMail(mailOptions, function (error, info) {
                console.log('info',info)
                if (error) {
                    callback(null, 'success')
                } else {
                    Alert.update({_id:alertId},{$set:{lastEvaluatedTime:now}},function (err,alertUpdate) {
                        callback(null, 'success')

                    })

                }
            });
        }

        //check interval if,daily check threshold,else check today is friday
        if (utcTime < time) {
            console.log('alert.objectId,',alert.objectId,alert.metricId,time);
            Data.findOne({
                'objectId': alert.objectId,
                'metricId': alert.metricId,
                data: {$elemMatch: {date: time}},
            }, function (err, data) {
                console.log('data',data)
                if (err || !data)
                    callback(null, 'success')
                else {
                    Metric.findOne({_id: alert.metricId}, function (err, metric) {
                        if (err || !data)
                            callback(null, 'success');
                        else {
                            Object.findOne({_id: alert.objectId}, function (err, object) {
                                if (err || !object)
                                    callback(null, 'success')
                                else {
                                    var dataArray = data.data;
                                    var chosenValue = _.find(dataArray, function (o) {
                                        return o.date === time;
                                    });
                                    console.log('chosenValue',chosenValue,typeof chosenValue.total,alert.endPoint)
                                        if (typeof chosenValue.total === 'object')
                                            var valueToCheck = chosenValue.total[alert.endPoint];
                                        else
                                            var valueToCheck = chosenValue.total;
                                        for (var key in alert.threshold) {
                                            storeOperator = key == 'gt' ? '>' : '<';
                                            thresholdValue = alert.threshold[key]
                                        }
                                    console.log('valueToCheck',valueToCheck)
                                        var checkingThreshold = operators[storeOperator](valueToCheck, thresholdValue);
                                        if (alert.interval === configAuth.interval.setDaily) {
                                            if (checkingThreshold === true) {
                                                console.log('sending daily alert',alert);
                                                sendEmail(alert.mailingId.email, thresholdValue, metric.name, object.name, alert.name,alert._id);
                                                //callback(null, 'success')
                                            }

                                        }
                                        else if (alert.interval === configAuth.interval.setWeekly) {
                                            console.log('inside weekly alert',checkingThreshold);
                                            if (checkingThreshold === true && currentDayName === configAuth.dayNames.Friday) {
                                                console.log('sending weekly alert');
                                                sendEmail(alert.mailingId.email, thresholdValue, metric.name, object.name, alert.name,alert._id);
                                                // callback(null, 'success')
                                            }

                                        }
                                        else {
                                            console.log('No data')
                                        }



                                }


                            })
                        }

                    })
                }

            })

        }
        else callback(null,'success')
    }

    console.log('after alert');
    done();
})

agenda.on('ready', function () {
    //agenda.every('1 minutes', 'Update channel data');
    agenda.now('Send Alerts')
    agenda.start();
});
agenda.on('start', function (job) {
    console.log("Job %s starting", job.attrs.name);
});