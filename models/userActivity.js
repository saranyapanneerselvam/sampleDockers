// app/models/user.js
// load the things we need
var mongoose = require('mongoose');

// define the schema for our user model
var userActivitySchema = mongoose.Schema({
    userId: mongoose.Schema.Types.ObjectId,
    email: String,
    loggedInTime :Date,
    created: Date,
    updated: Date,
    deleted: Date
});


// create the model for users and expose it to our app
module.exports = mongoose.model('UserActivity', userActivitySchema);