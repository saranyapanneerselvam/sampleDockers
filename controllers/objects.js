var objectList = require('../middlewares/getObjects');

/**
 * This is the middleware to get the list of objects based on chosen profile
 * @param app - loading the app which is for using express ,etc
 * @param req - request from client - contains urls,inputs ..

 */
module.exports = function (app) {
    app.get('/api/v1/get/objects/:profileID', objectList.objects, function (req, res) {
            res.json({objectList: req.app.objects});
    });
    app.get('/api/v1/get/objectTypeDetail/:objectTypeId', objectList.objectTypes, function (req, res) {
        res.json({objectType: req.app.result});
    });
    app.get('/api/v1/get/objectType/:channelId', objectList.objectTypesForChannel, function (req, res) {
        res.json({objectType: req.app.result});
    });
    app.post('/api/v1/objects',objectList.mozObjectStore, function (req, res) {
        res.json({objectList:req.app.result});
    });

};