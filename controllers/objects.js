var objectList = require('../middlewares/getObjects');

/**
 * This is the middleware to get the list of objects based on chosen profile
 * @param app - loading the app which is for using express ,etc
 * @param req - request from client - contains urls,inputs ..

 */
module.exports = function (app) {
    app.get('/api/v1/get/objects/:profileID', objectList.objects, function (req, res) {
        var objects = req.showMetric.objects;
        if (objects)
            res.json({objectList: objects});
        else
            res.status(500).send({error: ""});
    });
};