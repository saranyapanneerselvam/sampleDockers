// app/models/user.js
// load the things we need
var mongoose = require('mongoose');


// define the schema for our user model
var objectsSchema = mongoose.Schema({
    name: String,
    profileId: mongoose.Schema.Types.ObjectId,
    channelObjectId: String,
    meta: {
        accountId: String,
        adSetId: String,
        campaignId: String,
        currency:String,
        objective:String,
        webPropertyName:String,
        webPropertyId:String
    },
    objectTypeId: mongoose.Schema.Types.ObjectId,
    channelId: mongoose.Schema.Types.ObjectId,
    created: Date,
    updated: Date,
    deleted: Date
});

// create the model for organization and expose it to our app
module.exports = mongoose.model('Objects', objectsSchema);

