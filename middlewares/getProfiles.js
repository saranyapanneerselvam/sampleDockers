//var user = require('../models/user');
var exports = module.exports = {};
var profilesList = require('../models/profiles');
/**
 Function to get the profiles's details such as name,access token,refresh token..
 @params 1.req contains the facebook user details i.e. username,email etc
 2.res have the query response

 */
exports.profiles = function (req, res, next) {
    if (req.user) {
        profilesList.find({channelId: req.params.channelId}, function (err, profiles) {
            if (err)
                return res.status(500).json({error: 'Internal server error'});
            else if (!profiles.length)
                return res.status(204).json({error: 'No records found'});
            else {
                req.app.profiles = profiles;
                next();
            }
        })
    }
    else res.status(401).json({error: 'Authentication required to perform this action'})

}


