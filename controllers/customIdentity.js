var getCustomIdentity = require('../middlewares/customIdentity');

/**
 * This is the middleware to store custom push list based on userId
 * @param app - loading the app which is for using express ,etc
 * @param req - request from client - contains urls,inputs ..
 * @callback customPush - result from db call
 */
module.exports = function (app) {

    //Create a new customPush
    app.post('/api/v1/create/customIdentity',getCustomIdentity.storeCustomIdentity, function (req, res) {
        res.json(req.app.result);
    });

};