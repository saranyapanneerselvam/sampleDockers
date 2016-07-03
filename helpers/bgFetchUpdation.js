var Data = require('../models/data');
var exports = module.exports = {};
exports.updateBgFetch = function (req, done) {
    Data.update({
        'objectId': req.body.objectId,
        'metricId': req.body.metricId},{$set:{bgFetch:req.body.bgFetch}},function (err,data) {
        if (err)
            return res.status(500).json({error: 'Internal server error'})
        else if (data == 0)
            return res.status(501).json({error: 'Not implemented'})
        else {
            req.app.result = data;
            done();
        }
    })
};