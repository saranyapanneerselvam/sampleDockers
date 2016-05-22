var user = require('../models/user');
var profile = require('../models/profiles');
var exports = module.exports = {};

/**
 Function to get the user's details such as organization id,name ..
 @params 1.req contains the facebook user details i.e. username,token,email etc
 2.res have the query response
 @event pageList is used to send & receive the list of pages result
 */

exports.getUserDetails = function (req, res, next) {

    //To check user is logged in or not
    if(req.user){
        user.find({_id: req.user._id}, function (err, user) {
            if (err)
                return res.status(500).json({error: 'Internal server error'});
            else if (!user)
                return res.status(204).json({error: 'No records found'});
            else{
                req.app.result = user;
                next();
            }
        });
    }
    else
        res.status(401).json({error:'Authentication required to perform this action'})
};

exports.updateLastDashboardId = function (req,res,next) {
    console.log(req.params.id);
    user.update({'_id': req.user._id}, {$set: {"lastDashboardId": req.params.id, updated: new Date()}},{upsert: true},  function (err) {
        if (!err) {
            req.app.result = {'status': '200', 'dashboardId': req.params.id};
            next();
        }
        else {
            req.app.result = {'status': '302'};
            next();
        }
    });
};

