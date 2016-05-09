var profilesList = require('../middlewares/getProfiles');
var profiles = require('../middlewares/removeProfile');

/**
 * This is the middleware to get the list of profiles based on channels
 * @param app - loading the app which is for using express ,etc
 * @param req - request from client - contains urls,inputs ..

 */
module.exports = function (app) {
    app.get('/api/v1/get/profiles/:channelId', profilesList.profiles, function (req, res) {
        var profiles = req.showMetric.profiles;
        if (profiles)
            res.json({profileList: profiles});
        else
            res.status(500).send({error: ""});
    });

    app.post('/api/v1/post/removeProfiles/:profileId', profiles.removeProfile, function (req, res) {
        res.json(req.app.result);
    });
};