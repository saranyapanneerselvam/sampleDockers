var Profiles = require('../models/profiles');
var Channels = require('../models/channels');
var exports = module.exports = {};
exports.getChannelDetails = function (req, done) {

    Profiles.findOne({_id:req.profileId}, function (err, profile) {
        if (err)
            return res.status(500).json({error: 'Internal server error'});
        else if (!profile)
            return res.status(204).json({error: 'No records found'});
        else{
            Channels.findOne({_id:profile.channelId}, function (err, channel) {
                if (err)
                    return res.status(500).json({error: 'Internal server error'});
                else if (!channel)
                    return res.status(204).json({error: 'No records found'});
                else{
                    req.app.result = channel;
                    done(null,channel);
                }
            })
        }
    })
};
