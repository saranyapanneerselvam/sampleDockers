// app/models/user.js
// load the things we need
var mongoose = require('mongoose');


// define the schema for our user model
var recommendedDashboardsSchema = mongoose.Schema({
    name: String,
    description: String,
    widgets: Array,
    created: Date,
    updated: Date,
    deleted: Date
});

// create the model for organization and expose it to our app
module.exports = mongoose.model('recommendedDashboard', recommendedDashboardsSchema);

