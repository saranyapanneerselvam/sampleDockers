// app/models/user.js
// load the things we need
var mongoose = require('mongoose');
var ObjectIdSchema = mongoose.Schema.ObjectId;
var ObjectId = mongoose.Types.ObjectId;
// define the schema for our user model
var dashboardsSchema = mongoose.Schema({
    name: String,
    orgId: String,
    order: Number,
    type: String,
    reportId : {type:ObjectIdSchema, default: function () { return new ObjectId()} },
    startDate:Date,
    endDate:Date,
    created: Date,
    updated: Date,
    deleted: Date
});

// create the model for organization and expose it to our app
module.exports = mongoose.model('Dashboards', dashboardsSchema);

