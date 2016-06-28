var exports = module.exports = {};

exports.dashboardWidgetData = function(req,res){
    if(req.user=='undefined'){
        next();
    }
};