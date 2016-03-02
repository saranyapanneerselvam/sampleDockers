// app/models/user.js
// load the things we need
var mongoose = require('mongoose');


// define the schema for our user model
var metricsSchema = mongoose.Schema({
    name: String,
    code: String,
    description: String,
    channelId: String,
    bgFetch: Boolean,
    fetchPeriod: Number,
    xAxis: String,
    yAxis: String,
    scopes: Array,
    meta:Object,
    endPoints: {
        objectTypeId: Number,
        endPoint: String
    },
    created: Date,
    updated: Date,
    deleted: Date
});

// create the model for organization and expose it to our app
module.exports = mongoose.model('Metrics', metricsSchema);

