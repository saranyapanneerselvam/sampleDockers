var mongoose = require('mongoose');


// define the schema for our user model
var InsightDataSchema = mongoose.Schema({
    widgetId:String,
    data: Array,
    created: Date,
    saveTime: Date,
});

// create the model for organization and expose it to our app
module.exports = mongoose.model('Insightdata', InsightDataSchema);