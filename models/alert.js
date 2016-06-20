
//Import mongoose
var mongoose = require('mongoose');

// define the schema for our user model
var alertSchema = mongoose.Schema({
    name:String,
    operation:Object,
    threshold: Object,
    interval:String,
    metricId: String,
    widgetId: String,
    objectId:String,
    mute: Boolean,
    endPoint : Object,
    mailingId:Object,
    lastEvaluatedTime:Date,
    created: Date,
    updated: Date,
    deleted: Date
});

// create the model for alert and expose it to our app
module.exports = mongoose.model('Alert', alertSchema);
