var configAuth = require('../config/auth');
var Widget = require('../models/widgets');
var Data=require('../models/insightData');
var Job=require('../models/insightsJob');
var agenda=require('../lib/agendlib')
var exports = module.exports = {};
var Object = require('../models/objects');
var Profile = require('../models/profiles')
var topSentiment=require('../helpers/topSentiment');
var getObjectProfileDetails =require('../helpers/utility')


exports.checkInsights = function (req, res,done) {
    Widget.findOne({_id: req.params.widgetId}, function (err, widget) {
        if (err)
            return res.status(500).json({error: 'Internal Server Error', id: req.params.widgetId});
        else if (!widget)
            return res.status(401).json({error: 'User not found', id: req.params.widgetId});
        else{
            var query={widgetId:req.params.widgetId};
            req.objectId = widget.objectId;
            if(widget.self){
                getObjectProfileDetails.getObjectsProfilesForInsights(req,res,function (err,objectsProfiles) {
                    widget.charts[0].object = objectsProfiles.objectDetails;
                    widget.charts[0].user = objectsProfiles.userDetails

                })
            }
            else{
                widget.charts[0].profile = '';
                widget.charts[0].object = '';
            }
            Job.findOne({meta:query},function(err,response){
                if (err)
                    return res.status(500).json({error: 'Internal Server Error', id: req.params.widgetId});
                else if (!response){
                    var now=new Date();
                    var job=new Job;
                    job.jobType=widget.name;
                    job.meta={widgetId:widget._id}
                    job.startTime=now;
                    job.status='inprogress';
                    job.save(function(err,job){
                        if (err)
                            return res.status(500).json({error: 'Internal server error'});
                        else if (!job)
                            return res.status(204).json({error: 'No records found'});
                        else {
                            agenda.schedule ('in 1 seconds',widget.name,{widget:widget.charts,widgetId:req.params.widgetId},function(){
                            });
                            return res.status(202).json({error: 'job in process', id: req.params.widgetId});
                        }
                    })
                }
                else{
                    if(response.status === 'success'){
                        Data.findOne({widgetId:req.params.widgetId},function(err,data){
                            if(err)
                                return res.staus(500).json({error:'Internal server error'})
                            else if(!data)
                                return res.status(204).json({error:'No records found'})
                            else {
                                req.app.result=data.data;
                                done(null,data.data)
                            }
                        })
                    }
                    else if(response.status === 'failure'){
                        agenda.schedule ('in 1 seconds',widget.name,{widgetId:req.params.widgetId,pageId:widget.charts[0].competitors[0].remoteObjectId});
                        return res.status(202).json({error:'job in process', id: req.params.widgetId})
                    }
                    else
                    {
                        // agenda.schedule ('in 1 seconds',widget.name,{widgetId:req.params.widgetId,pageId:widget.charts[0].competitors[0].remoteObjectId});
                        return res.status(202).json({error:'job in process', id: req.params.widgetId})
                    }

                }
            })
            
        }
    })
}