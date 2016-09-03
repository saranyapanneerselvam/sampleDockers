var limits=require('../helpers/utility');
var config=require('../config/auth');
var exports = module.exports = {};
exports.checkUserSubscriptionLimit=function (req, res,done){

 limits.getSubscriptionType(req,res,function(err,response){
     var max=response.limits;
        if (req.query.requestType == config.limitRequestType.dashboards ||req.query.requestType ==  config.limitRequestType.basic || req.query.requestType == config.limitRequestType.alert || req.query.requestType ==config.limitRequestType.fusion) {
            limits.dashboardList (req,res,function(err,response){
                if (req.query.requestType ==  config.limitRequestType.basic || req.query.requestType == config.limitRequestType.alert || req.query.requestType ==config.limitRequestType.fusion){
                    req.dashboards=response;
                    limits.widgetsList (req,res,function(err,response){
                        if ( req.query.requestType == config.limitRequestType.alert ){
                            req.widgets=response;
                            limits.alertsList (req,res,function(err,response){
                               var availableAlerts=max.alerts - response.length;
                                req.app.result = {
                                    availablealerts:availableAlerts
                                }
                                done(null, req.app.result)
                            })
                        }
                        else {
                           if(req.query.requestType ==  config.limitRequestType.basic) {
                               var availableWidgets=max.widgets - response.length;
                           }
                            else{
                               var availableWidgets=max.fusions - response.length;

                           }
                            req.app.result = {
                                availableWidgets:availableWidgets
                            }
                            done(null, req.app.result)
                        }
                    })
                }
                else {
                  var  availableDashboards=max.dashboards - response.length;
                    req.app.result = {
                        availableDashboards:availableDashboards
                    }
                    done(null, req.app.result)
                }
            })
        }
    else{
            return res.status(400).json({error: 'Invalid  Request'});
        }
 })

}