var async = require("async");

//To load the model
var ObjectDb = require('../models/objects');
var Data = require('../models/data');
var Profile = require('../models/profiles');
var Widget = require('../models/widgets')

var exports = module.exports = {};

exports.removeProfile = function (req, res, next) {
    var responseData;
    async.series([
            function (callback) {
                var objectResults = [];
                console.log('inside delete data');
                ObjectDb.find({profileId: req.params.profileId}, function (err, response) {
                    responseData = response;
                    console.log('responseData', responseData)
                    if (err) callback('error', null)
                    else if (!responseData.length) callback('error', null)
                    else {
                        console.log('Print result of objects fetch', responseData);
                        for (var i = 0; i < responseData.length; i++) {
                            objectResults.push(responseData[i]._id);
                        }
                        console.log('objectResults', objectResults);
                        async.map(objectResults, dataRemove, function (err, dataArray) {
                            console.log('dataArray', dataArray)
                            callback(null, dataArray[0]);
                        });

                        function dataRemove(objectResults, callback) {
                            Data.find({objectId: objectResults}, function (err, datadb) {
                                console.log('errdata', err, datadb);
                                if (err)
                                    callback('error', null)
                                else if (!datadb.length) {
                                    console.log('datadberror')
                                    callback(null, {Data: {data: 'No data'}, result: 1})
                                }
                                else {
                                    console.log('dberrro', objectResults)
                                    Data.remove({objectId: objectResults}, function (err, data) {
                                        if (err)
                                            callback('error', null)
                                        else if (data === 0) callback('error', null)
                                        else {
                                            var finalData = {Data: datadb, result: data}
                                            console.log('datadb', finalData)
                                            checkNullData(callback(null, finalData))
                                        }
                                    });
                                }

                            })

                        }
                    }
                });
            },
            function (callback) {
                console.log('inside delete objects');
                ObjectDb.remove({profileId: req.params.profileId}, function (err, object) {
                    if (err)
                        callback('error', null)
                    else if (object == 0)
                        callback('error', null)
                    else {
                        var finalData = {Object: responseData, result: object}
                        console.log('objectdb', finalData)
                        checkNullData(callback(null, finalData));
                    }

                });
            },
            function (callback) {
                console.log('inside delete profile');
                Profile.find({_id: req.params.profileId}, function (err, profile) {
                    if (err)
                        callback('error', null)
                    else if (!profile.length)
                        callback('error', null)
                    else {
                        Profile.remove({_id: req.params.profileId}, function (err, profileRemove) {
                            if (err)
                                callback('error', null)
                            else if (profileRemove === 0)
                                callback('error', null)
                            else {
                                var finalData = {Profile: profile, result: profileRemove}
                                console.log('profiledb', finalData)
                                checkNullData(callback(null, finalData))
                            }

                        });
                    }

                })

            },
            function (callback) {
                var objectResults = [];
                console.log('inside delete objects', responseData);
                for (var i = 0; i < responseData.length; i++) {
                    objectResults.push(responseData[i].id);
                }
                console.log('objectResults', objectResults);
                async.map(objectResults, widgetRemove, callback);
                function widgetRemove(responseData, callback) {
                    console.log('responseData',responseData)
                        Widget.find({'charts.metrics.objectId': responseData}, function (err, widgetData) {
                            console.log('widgetData',widgetData,err)
                            if (err)
                                callback('error', null)
                            else if (!widgetData.length)
                                callback(null, {Widget: {data: 'No data'}, result: 1})
                            else {
                                Widget.remove({
                                    'charts.metrics.objectId': responseData
                                }, function (err, object) {
                                    if (err)
                                        callback('error', null)
                                    else if (object == 0)
                                        callback('error', null)
                                    else {
                                        var finalData = {Widget: widgetData, result: object}
                                        console.log('widgetdb', finalData)
                                        checkNullData(callback(null, finalData));
                                    }
                                });
                            }

                        })

                }

            },
        ],
        function (errs, results) {
            console.log('results', results, errs)
            if (results[0] != null || results[0] != undefined) {
                if (errs) {
                    console.log('errrol', errs)
                    async.each(results, rollback, function (err, res) {
                        console.log('Rollback done.', err, res);
                        req.app.result = {status: 200};
                        next()
                    });
                } else {

                    async.each(results, rollback, function (err, res) {
                        console.log('Rollback done.', res);
                        req.app.result = {status: 200};
                        next()
                    });
                    console.log('Done.');
                }
            }
            else return res.status(500).json({error: 'Internal server error'})
        });
    //Function to handle the data query results
    function checkNullData(callback) {
        return function (err, object) {
            if (err)
                callback('Database error: ' + err, null);
            else if (!object)
                callback('', 'No data');
            else
                callback(null, object);
        }
    }

    function rollback(doc, callback) {
        console.log('doc', doc);

        if (doc != null || doc != undefined) {
            var key = Object.keys(doc)
            if (doc.result === 0) {
                async.mapSeries(doc[key[0]], saveAllData, callback);
                function saveAllData(allData, callback) {
                    if (doc.result === 0) {
                        if (key[0] === 'Object') {
                            console.log('save obj')
                            ObjectDb.update({id: allData._id}, {$set: allData}, {upsert: true}, function (err, savedObject) {
                                if (err)
                                    return res.status(500).json({error: 'Internal server error'})
                                else if (savedObject == 0)
                                    return res.status(501).json({error: 'Not implemented'})
                                else callback(null, 'success')
                            })
                        }

                        else if (key[0] === 'Data') {
                            if (allData.data != 'No data') {
                                Data.update({_id: allData._id}, {$set: allData}, {upsert: true}, function (err, savedObject) {
                                    console.log('datasav', err, savedObject)
                                    if (err)
                                        return res.status(500).json({error: 'Internal server error'})
                                    else if (savedObject == 0)
                                        return res.status(501).json({error: 'Not implemented'})
                                    else callback(null, 'success')
                                })
                            }
                            else callback(null, 'success')
                        }
                        else if (key[0] === 'Profile') {
                            Profile.update({id: allData._id}, {$set: allData}, {upsert: true}, function (err, savedObject) {
                                console.log('prosav', err, savedObject)
                                if (err)
                                    return res.status(500).json({error: 'Internal server error'})
                                else if (savedObject == 0)
                                    return res.status(501).json({error: 'Not implemented'})
                                else callback(null, 'success')
                            })
                        }
                        else {
                            if (allData.data != 'No data') {
                                Widget.update({id: allData._id}, {$set: allData}, {upsert: true}, function (err, savedObject) {
                                    console.log('widsav', err, savedObject)
                                    if (err)
                                        return res.status(500).json({error: 'Internal server error'})
                                    else if (savedObject == 0)
                                        return res.status(501).json({error: 'Not implemented'})
                                    else callback(null, 'success')
                                })
                            }
                            else callback(null, 'success')
                        }

                    }
                    else callback(null, 'success')
                }
            }
            else callback(null, 'success')

        }
        else callback(null, 'success')
    }

};