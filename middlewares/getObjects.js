var exports = module.exports = {};
var getObjects = require('../helpers/utility');
var ObjectType = require('../models/objectTypes');
var Object = require('../models/objects');
/**
 Function to get the object's details such as pages, views inside a chosen profile..
 */

exports.objects = function (req, res, next) {
    if (req.query.campaignId != undefined) {
        if (req.query.accountId != undefined)  req.query.metaCondition = {accountId:req.query.accountId,campaignId: req.query.campaignId}
        else  req.query.metaCondition = {campaignId: req.query.campaignId}
    }
    else if (req.query.adSetId != undefined) {
        if (req.query.accountId != undefined)  req.query.metaCondition = {accountId:req.query.accountId,adSetId:req.query.adSetId}
        else  req.query.metaCondition = {adSetId: req.query.adSetId}
    }

    else if(req.query.accountId!=undefined) req.query.metaCondition = {accountId:req.query.accountId}

  getObjects.findObjectsForProfile(req, res, function (err, object) {
    if (err)
      return res.status(500).json({error: 'Internal server error'});
    else {
      req.app.objects = object;
      next();
    }
  });
};

exports.objectTypes = function (req, res, next) {
  ObjectType.findOne({_id:req.params.objectTypeId},function (err,objectType) {
    if (err)
      return res.status(500).json({error: 'Internal Server Error'});
    else if (!objectType)
      return res.status(401).json({error: 'Authentication required to perform this action'});
    else{
      req.app.result = objectType;
      next();
    }
  })
};

exports.objectTypesForChannel = function (req, res, next) {
  ObjectType.find({channelId:req.params.channelId},function (err,objectType) {
    if (err)
      return res.status(500).json({error: 'Internal Server Error'});
    else if (!objectType)
      return res.status(401).json({error: 'Authentication required to perform this action'});
    else{
      req.app.result = objectType;
      next();
    }
  })
};
//updating moz objects in db
exports.mozObjectStore = function (req, res, next) {
    var objectTypeId = req.body.mozObjectTypeId;
    var mozname = req.body.mozObject;
    var channelId = req.body.channelId;
    var now = new Date();
    Object.update({
        name: mozname
    }, {
        $setOnInsert: {created: now},
        $set: {objectTypeId: objectTypeId, name: mozname, channelId: channelId, updated: now}
    }, {upsert: true}, function (err, res) {
        if (err)
            return res.status(500).json({error: 'Internal server error'})
        else if (res == 0)
            return res.status(501).json({error: 'Not implemented'})
        else {
            Object.find({'name': mozname}, function (err, objectList) {
                if (err)
                    return res.status(500).json({error: 'Internal server error'})
                else if (objectList.length == 0)
                    return res.status(204).json({error: 'No records found'})
                else {
                    req.app.result = objectList;
                    next();
                }
            })
        }
    })

}
