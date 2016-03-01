// app/models/user.js
// load the things we need
var mongoose = require('mongoose');


// define the schema for our user model
var objectsSchema = mongoose.Schema({
    name: String,
    profileId: Number,
    channelObjectId: String,
    objectTypeId: Number,
    created: Date,
    updated: Date,
    deleted: Date
});

// create the model for organization and expose it to our app
module.exports = mongoose.model('Objects', objectsSchema);

