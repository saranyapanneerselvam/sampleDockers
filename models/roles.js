// app/models/user.js
// load the things we need
var mongoose = require('mongoose');


// define the schema for our user model
var rolesSchema = mongoose.Schema({
    name: String,
    code: String,
    type: String,
    permissions: Array,
    created: new Date(),
    updated: new Date(),
    deleted: new Date()
});

// create the model for organization and expose it to our app
module.exports = mongoose.model('roles', rolesSchema);

