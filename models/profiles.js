// app/models/user.js
// load the things we need
var mongoose = require('mongoose');


// define the schema for our user model
var profilesSchema = mongoose.Schema({
    customerId:Number,
    canManageClients:Boolean,
    name: String,
    orgId: String,
    dataCenter:String,
    email: String,
    accessToken: String,
    tokenSecret:String,
    refreshToken: String,
    userId: String,
    channelId: String,
    channelName: String,
    expiresIn: Date,
    created: Date,
    updated: Date,
    deleted: Date,
    hasNoAccess: { type:Boolean , default: false }
});

// create the model for organization and expose it to our app
module.exports = mongoose.model('Profile', profilesSchema);


