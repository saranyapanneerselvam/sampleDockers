// app/models/user.js
// load the things we need
var mongoose = require('mongoose');


// define the schema for our user model
var customidentitySchema = mongoose.Schema({
    dashboardId: String,
    widgetType: String,
    created: Date,
    updated: Date,
    deleted: Date
});

// create the model for customPush and expose it to our app
module.exports = mongoose.model('CustomIdentity', customidentitySchema);

