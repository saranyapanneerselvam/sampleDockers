var async = require("async");

//To load the model
var Object = require('../models/objects');
var Data = require('../models/data');
var Profile = require('../models/profiles');

var exports = module.exports = {};

exports.removeProfile = function (req, res, next) {

    //Using async's auto method for handling asynchronous functions
    async.auto({
        delete_data: deleteData,
        delete_objects: ['delete_data', deleteObjects],
        delete_profile: ['delete_objects','delete_data', deleteProfile]
    }, function (err, results) {
        console.log('err = ', err);
        console.log('results = ', results);
        if (err) {
            req.app.result=err;
        } else
            req.app.result=results;
        next();
    });

    //Handling the database callback
    function checkNullObject(callback) {
        return function (err, object) {
            if (err) {
                console.log('Printing error',err);
                callback('Database error: ' + err, null);
            }
            else if (!object) {
                console.log('Printing null',[]);
                callback('No record found', null);
            }
            else {
                console.log('Printing callback',object);
                callback(null, object);
            }
        }
    }


    function deleteData(callback) {
        var objectResults = [];
        console.log('inside delete data');
        Object.find({profileId: req.params.profileId},function (err,response) {
            if(err) {
                console.log('Error in fetching objects',err);
                next();
            } else {
                console.log('Print result of objects fetch',response);
                for(i=0;i<response.length;i++) {
                    objectResults.push(response[i]._id);
                }
                console.log('objectResults',objectResults);
                async.map(objectResults,dataRemove,callback);

                function dataRemove(objectResults,callback) {
                    Data.remove({objectId: objectResults},callback);
                }
            }
        });
    }

    function deleteObjects(results,callback) {
        console.log('inside delete objects');
        Object.remove({profileId: req.params.profileId}, checkNullObject(callback));
    }

    function deleteProfile(results,callback) {
        console.log('inside delete profile');
        Profile.remove({_id: req.params.profileId}, checkNullObject(callback));
    }

};