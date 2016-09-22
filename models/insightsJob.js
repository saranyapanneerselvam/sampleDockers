var mongoose = require('mongoose');


// define the schema for our user model
var InsightJobSchema = mongoose.Schema({
     jobType:String,
       meta:{
           widgetId:String
           },
       startTime:Date,
       endTime:Date,
       status:String
});

// create the model for organization and expose it to our app
module.exports = mongoose.model('Insightjob', InsightJobSchema);