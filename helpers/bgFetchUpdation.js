var Data = require('../models/data');
var exports = module.exports = {};
exports.updateBgFetch = function (req, done) {
    Data.update({
        'objectId': req.body.objectId,
        'metricId': req.body.metricId},{$set:{bgFetch:req.body.bgFetch}},function (err,data) {
    })
};