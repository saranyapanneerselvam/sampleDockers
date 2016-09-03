var user = require('../models/user');
var profile = require('../models/profiles');
var organizations = require('../models/organizations');
var subscriptionTypes=require('../models/subscriptionType');
var configAuth = require('../config/auth');
var exports = module.exports = {};
var bcrypt = require('bcrypt-nodejs');

/**
 Function to get the user's details such as organization id,name ..
 @params 1.req contains the facebook user details i.e. username,token,email etc
 2.res have the query response
 @event pageList is used to send & receive the list of pages result
 */

exports.getUserDetails = function (req, res, next) {
console.log('user',req.user)
    //To check user is logged in or not
    if(req.user){
        user.find({_id: req.user._id}, function (err, user) {
            if (err)
                return res.status(500).json({error: 'Internal server error'});
            else if (!user)
                return res.status(204).json({error: 'No records found'});
            else{
                var userResult=user;
                var orgId=user[0].orgId;
                organizations.find({_id:orgId}, {subscriptionTypeId:1,subscriptionExpiresOn:1} ,function(err,result){
                    console.log('organizations',result)
                    if (err)
                        return res.status(500).json({error: 'Internal server error'});
                    else if (!result)
                        return res.status(204).json({error: 'No records found'});
                    else {
                        var subscriptionTypeId = result[0].subscriptionTypeId;
                        console.log('subscriptionTypeId',subscriptionTypeId)
                        var userExpiry = result[0].subscriptionExpiresOn;
                        subscriptionTypes.find({_id: subscriptionTypeId}, {code: 1}, function (err, type) {
                            if (err)
                                return res.status(500).json({error: 'Internal server error'});
                            else if (!type)
                                return res.status(204).json({error: 'No records found'});
                            else {
                                var subscriptionType = type[0].code;
                                if(configAuth.subscriptionType.free===subscriptionType) {
                                    var user = {
                                        user: userResult,
                                        subscriptionType:subscriptionType
                                    };
                                    req.app.result = user;
                                    next();
                                }
                                else{
                                    var expiryDate = moment(userExpiry).format("YYYY-MM-DD");
                                    var currentDate = moment(new Date).format("YYYY-MM-DD");
                                    if(expiryDate>=currentDate){
                                        var user = {
                                            user: userResult,
                                            subscriptionType:subscriptionType,
                                            expiryDate:expiryDate
                                        };
                                        req.app.result = user;
                                        next();
                                    }
                                    else{
                                        var user = {
                                            user: userResult,
                                            subscriptionType:subscriptionType,
                                            statusCode: 1002
                                        };
                                        console.log('userrr',user)
                                        req.app.result = user;
                                        next();
                                    }
                                }
                            }
                        });
                    }
                });
            }
        });
    }
    else
        res.status(401).json({error:'Authentication required to perform this action'})
};

exports.updateLastDashboardId = function (req,res,next) {
    user.update({'_id': req.user._id}, {$set: {"lastDashboardId": req.params.id, updated: new Date()}},{upsert: true},  function (err,user) {
        if (err)
            return res.status(500).json({error: 'Internal server error'})
        else if (user == 0)
            return res.status(501).json({error: 'Not implemented'})
        else{
            req.app.result = {'status': '200', 'dashboardId': req.params.id};
            next();
        }
    });
};

exports.getUserPassword = function (req, res, next) {

    if(req.user){
        user.findOne({_id: req.user._id}, function (err, user) {
            if (err)
                return res.status(500).json({error: 'Internal server error'});
            else if (!user)
                return res.status(204).json({error: 'No records found'});
            else {
                if (bcrypt.compareSync(req.body.currentPassword, user.pwdHash)){
                    user.pwdHash =  bcrypt.hashSync(req.body.newPassword, bcrypt.genSaltSync(8), null);
                    user.save(function(err){
                        if (!err){
                            return res.status(200).json({});
                        }
                    });
                }
                else{
                    return res.status(204).json({error: 'No records found'});

                }
            }
        });
    }
    else
        res.status(401).json({error:'Authentication required to perform this action'})
};