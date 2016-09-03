// app/models/user.js
// load the things we need
var mongoose = require('mongoose');


// define the schema for our user model
var logosSchema = mongoose.Schema({
    orgId: String,
    accType: String,
    fileUrl: String,
    created: Date,
    deleted: Date
});

// create the model for organization and expose it to our app
module.exports = mongoose.model('logos', logosSchema);

