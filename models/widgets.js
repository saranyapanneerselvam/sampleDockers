// app/models/user.js
// load the things we need
var mongoose = require('mongoose');


// define the schema for our user model
var widgetsSchema = mongoose.Schema({
    name: String,
    description: String,
    dashboardId: String,
    channelId: String,
    row: Number,
    col: Number,
    size: Object,
    minSize: Object,
    maxSize: Object,
    referenceWidgetId:String,
    widgetType: String,
    charts: Array,
    color: String,
    created: Date,
    updated: Date,
    deleted: Date,
    widgets:Array,
    visibility:Boolean
});

// create the model for organization and expose it to our app
module.exports = mongoose.model('Widgets', widgetsSchema);

