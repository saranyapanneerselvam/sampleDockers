var user = require('../models/user');
var profile = require('../models/profiles');
var dashboard=require('../models/dashboards')
var exports = module.exports = {};
var bcrypt = require('bcrypt-nodejs');
// to create a random string
var randomString = require("randomstring");
// to send mail
var configAuth = require('./../config/auth');
var  utility= require('../helpers/utility');
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
    user.update({'_id': req.user._id}, {$set: {"lastDashboardId": req.params.id, updated: new Date()}},{upsert: true},  function (err,user) {
        if (err)
            return res.status(500).json({error: 'Internal server error'})
        else if (user == 0)
            return res.status(501).json({error: 'Not implemented'})
        else{
            dashboard.update({'_id': req.params.id},{$set: {updated: new Date()}},{upsert: true},function (err,user) {
                if (err)
                    return res.status(500).json({error: 'Internal server error'})
                else if (user == 0)
                    return res.status(501).json({error: 'Not implemented'})
                else{
            req.app.result = {'status': '200', 'dashboardId': req.params.id};
            next();
        }
    });
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
exports.emailVerification=function(req,res,next){
    var userResult={};
    if(req.query.token){
        user.findOne({'emailVerification.tokenId':req.query.token},function(err,userDetail){
            if (err)
                return res.status(500).json({error: 'Internal server error'});
            else if(!userDetail){
                userResult={
                    status:configAuth.emailVerification.inValid
                };
                req.app.result=userResult;
                next();
            }
            else {
                if(userDetail.emailVerified==false) {
                    if (new Date().getTime() <= userDetail.emailVerification.expires.getTime()) {
                        var now = new Date();
                        user.update({
                            '_id': userDetail._id,
                            'emailVerification.tokenId': req.query.token
                        }, {
                            $setOnInsert: {created: now},
                            $set: {
                                updated: now,
                                emailVerified: true
                            }
                        }, {upsert: true}, function (err, success) {
                            if (err)
                                return res.status(500).json({
                                    error: 'Internal server error'
                                })
                            else if (!success)
                                return res.status(501).json({error: 'Not implemented'});
                            else {
                                user.findOne({_id: userDetail._id}, function (err, verifiedUser) {
                                    if (err)
                                        return res.status(500).json({error: 'Internal server error'});
                                    else if (!verifiedUser)
                                        return res.status(204).json({error: 'No records found'});
                                    else {
                                        userResult={
                                            user:verifiedUser,
                                            status:configAuth.emailVerification.verified
                                        };
                                        req.app.result=userResult;
                                        next();
                                    }
                                })

                            }
                        })
                    }
                    else {
                        var tokenId = userDetail.orgId + new Date().getTime() + randomString.generate({
                                length: configAuth.emailVerification.length,
                                charset: configAuth.emailVerification.charSet
                            }) + new Date().getMilliseconds();
                        var tokenExpiry = new Date().getTime() + configAuth.emailVerification.validity;
                        var now = new Date();
                        user.update({
                            '_id': userDetail._id,
                            'emailVerification.tokenId': req.query.token
                        }, {
                            $setOnInsert: {created: now},
                            $set: {
                                updated: now,
                                'emailVerification.tokenId': tokenId,
                                'emailVerification.expires': tokenExpiry
                            }
                        }, {upsert: true}, function (err, success) {
                            if (err)
                                return res.status(500).json({
                                    error: 'Internal server error'
                                })
                            else if (!success)
                                return res.status(501).json({error: 'Not implemented'});
                            else {
                                user.findOne({_id: userDetail._id}, function (err, unVerifiedUser) {
                                    if (err)
                                        return res.status(500).json({error: 'Internal server error'});
                                    else if (!unVerifiedUser)
                                        return res.status(204).json({error: 'No records found'});
                                    else {
                                        var mailOptionsSubmitter = {
                                            from: 'Datapoolt Invites <alerts@datapoolt.co>',
                                            to: unVerifiedUser.email,
                                            subject: unVerifiedUser.name + ', we\'ve received your request for an invite',
                                            // HTML Version
                                            html: '<p>Hi ' + unVerifiedUser.name + ',</p>' +
                                            '<p> We have received your request for an invite.Click link below to activate your account.</p><br><button style="background-color: #1a8bb3;border-radius: 12px;color:#fff;font-size: 24px;"><a style="text-decoration: none;color:#fff" href="'+configAuth.emailVerification.redirectLink+unVerifiedUser.emailVerification.tokenId+'">Click to Activate</a></button> <p>Thanks for trying us out. Cheers!</p>'
                                        };
                                        utility.sendVerificationMail(mailOptionsSubmitter,function(err){
                                            if(err){
                                                return res.status(500).json({error: 'Internal server error'});
                                            }
                                            else
                                                userResult={
                                                    user:unVerifiedUser,
                                                    status:configAuth.emailVerification.mailResend
                                                };
                                            req.app.result=userResult;
                                            next();
                                        })
                                    }
                                })
                            }
                        })
                    }
                }
                else{
                    user.findOne({_id: userDetail._id}, function (err, verifiedUser) {
                        if (err)
                            return res.status(500).json({error: 'Internal server error'});
                        else if (!verifiedUser)
                            return res.status(204).json({error: 'No records found'});
                        else {
                            userResult={
                                user:verifiedUser,
                                status:configAuth.emailVerification.alreadyVerified
                            };
                            req.app.result=userResult;
                            next();
                        }
                    })
                }
            }
        })
    }
    else{
        return res.status(500).json({error: 'Internal server error'});
    }
};