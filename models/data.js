// app/models/user.js
// load the things we need
var mongoose = require('mongoose');


// define the schema for our user model
var dataSchema = mongoose.Schema({
    objectId: String,
    metricId: String,
    data: Array,
    created: Date,
    updated: Date,
    deleted: Date
});

// create the model for organization and expose it to our app
module.exports = mongoose.model('Data', dataSchema);

