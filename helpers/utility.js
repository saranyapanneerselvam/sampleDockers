var Widget = require('../models/widgets');
var User = require('../models/user');

//To check whether the user has required permission to get the widget data
var self= module.exports = {checkUserPermission : function(req,res,done){
    Widget.findOne({_id: req.params.widgetId}, {dashboardId:1,charts: 1, widgetType: 1}, function(err,response){
        console.log('req params',req.params)
        req.dashboardId = response.dashboardId;
        if(req.user){
            self.checkUserAccess(req,res,done)
        }
        else{
            console.log('dashboard match');
            return res.status(401).json({error:'User must be logged in'})
        }


    });
},
checkUserAccess :function (req,res,done) {
    console.log('check user access')
    User.findOne({
        _id: req.user._id,
        dashboards: {$elemMatch: {dashboardId: req.dashboardId}}},function(err,user){
        console.log('user details',user);
        if(err)
            return res.status(500).json({error:'Internal Server Error'})
        else if(!user){
            console.log('permission error');
            return res.status(401).json({error: 'Authentication required to perform this action'})
        }

        else
            done(null,user);

    })
}}

