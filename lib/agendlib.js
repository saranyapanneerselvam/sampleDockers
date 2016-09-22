var Agenda = require('agenda');
var configAuth=require('../config/auth');
var Jobs=require('../models/insightsJob')
var mongoConnectionString = configAuth.batchJobs.dataBase;
var agenda = new Agenda({db: {address: mongoConnectionString}});
var jobTypes =configAuth.JobTypes.insightsJobs;
jobTypes.forEach(function(type) {
    require('../insightsJob/' + type)(agenda);
})
agenda.on('start', function (job) {
});
if(jobTypes.length) {
    agenda.on('ready', function() {
      //  agenda.every('5 seconds', 'match providers');
        agenda.start();
        agenda.on('success',function(job){
            //count++;
            var now=new Date();
            var meta={};
           meta.widgetId=job.attrs.data.widgetId;
            Jobs.update({meta:meta},{$set: {
                status :'success',
                    endTime:now
            }},function(err,save){
            }
            )
        } )
        agenda.on('fail',function(job){
            //count++;
            var meta={};
            meta.widgetId=job.attrs.data.widgetId;
            Jobs.update({meta:meta},{$set: {
                    status :'failed'
                }},function(err,save){
                }
            )
        } )
    });
    //agenda.start();
}
module.exports = agenda;