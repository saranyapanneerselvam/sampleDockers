// app/models/user.js
// load the things we need
var mongoose = require('mongoose');


// define the schema for our user model
var channelsSchema = mongoose.Schema({
    name: String,
    code: String,
    image: String,
    created: Date,
    updated: Date,
    deleted: Date
});

// create the model for organization and expose it to our app
module.exports = mongoose.model('Channels', channelsSchema);

