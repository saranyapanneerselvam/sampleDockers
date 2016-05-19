var exports = module.exports = {};
var recommendedDashboard = require('../models/recommendedDashboard.js');
var referenceWidget = require('../models/referenceWidgets.js');
var channels = require('../models/channels.js');
var async = require("async");
/** Function to get the recommendedDashboard's details such as pages */
exports.recommendDashboard = function (req, res, next) {
    req.showMetric = {};
    var groupByDashboard = [];
    var uniqueChannel= [];

    //async's one of the method to run tasks ,one task may or may not depend on the other
    async.auto({
        recommendedDashboard: getRecommendedDashboard,
        referenceWidget : ['recommendedDashboard',getReferenceWidget],
        channel:['recommendedDashboard','referenceWidget',getUniqueChannels]
    }, function (err, results) {
        if (err) {
            console.log(err);
            return res.status(500).json({});
        }

        var getData = {};
        for(var i=0; i<groupByDashboard.length;i++){
            getData[i] = {
                dashboard: groupByDashboard[i].dashboard,
                referenceWidgets: groupByDashboard[i].referenceWidgets,
                channels: groupByDashboard[i].channels
            };
        }
        req.showMetric.dashboardsDetails = getData;
        next();
    });

    function  getRecommendedDashboard(callback){
        recommendedDashboard.find({},checkNullObject(callback) );
    }

    function getReferenceWidget(results,callback){
        //console.log('results',results);
        for(var i=0;i<results.recommendedDashboard.length;i++){
            groupByDashboard[i] = [];
            groupByDashboard[i].dashboard = results.recommendedDashboard[i];
            //console.log(groupByDashboard[i].dashboard);
        }
        async.concatSeries(results.recommendedDashboard,callReferenceWidget,callback);
    }

    function callReferenceWidget(dashboard,callback){
        //console.log('finalreferenceData',dashboard);
        var index = indexByKeyValue(groupByDashboard,'_id',dashboard._id);
        function indexByKeyValue(arraytosearch, key, valuetosearch) {
            for (var i = 0; i < arraytosearch.length; i++) {
                if (arraytosearch[i].dashboard[key] == valuetosearch) {
                    return i;
                }
            }
            return null;
        }
        groupByDashboard[index].referenceWidgets = [];

        async.times(dashboard.widgets.length, function(n,next) {
            referenceWidget.findOne({_id: dashboard.widgets[n]}, function(err,referenceWidgets){
                if(!err) {
                    groupByDashboard[index].referenceWidgets[n] = referenceWidgets;
                    //console.log('PrintingGroupByDashboard',groupByDashboard);
                    next(null,referenceWidgets);
                }
            });
        },callback);
    }


    function getUniqueChannels(results,callback){
        var channelsToBeFetched = [];
        for(var i=0;i<groupByDashboard.length;i++){
            uniqueChannel[i] = [];
            groupByDashboard[i].channels = [];
            for(var j=0;j<groupByDashboard[i].referenceWidgets.length;j++){
                for(var k=0;k<groupByDashboard[i].referenceWidgets[j].charts.length;k++){
                    //console.log('Inside the for loop');
                    if (uniqueChannel[i].indexOf(groupByDashboard[i].referenceWidgets[j].charts[k].channelId) == -1) {
                        uniqueChannel[i].push(groupByDashboard[i].referenceWidgets[j].charts[k].channelId);
                    }
                    if (channelsToBeFetched.indexOf(groupByDashboard[i].referenceWidgets[j].charts[k].channelId) == -1) {
                        channelsToBeFetched.push(groupByDashboard[i].referenceWidgets[j].charts[k].channelId);
                    }
                }
            }
        }
        async.concatSeries(channelsToBeFetched,finalChannel,callback);
    }

    function fetchChannels(channelsToBeFetched,callback){
        async.concatSeries(channelsToBeFetched,finalChannel,callback);
    }

    function sortListChannel(uniqueChannel,callback){
        var uniqueChannel= [];
        if (uniqueChannel.indexOf(results.channelId) == -1) {
            uniqueChannel.push(results);
        }
        //console.log('uniqueChannel',uniqueChannel);
        async.concatSeries(uniqueChannel,finalChannel,callback);
    }

    function finalChannel(channelsToBeFetched,callback){
        channels.findOne({'_id': channelsToBeFetched}, function(err,channelDetails){
            if(!err) {
                for(var i=0;i<uniqueChannel.length;i++){
                    for(var j=0;j<uniqueChannel[i].length;j++){
                        if(channelDetails._id == uniqueChannel[i][j]){
                            groupByDashboard[i].channels.push(channelDetails);
                            //console.log('FinalGroupByDashboard',groupByDashboard);
                        }
                    }
                }
                callback(null,channelDetails);
            }
        });
    }

    //Function to handle all queries result here
    function checkNullObject(callback) {
        return function (err, object) {

            if (err)
                callback('Database error: ' + err, null);
            else if (!object)
                callback('No record found', '');
            else
                callback(null, object);
        }
    }


};