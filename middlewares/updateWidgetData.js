var exports = module.exports = {};

exports.dashboardWidgetData = function(req,res){
    console.log('user',req.user);
    if(req.user=='undefined'){

        next();
    }

}