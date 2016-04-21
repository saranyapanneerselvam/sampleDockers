// app/models/user.js
// load the things we need
var mongoose = require('mongoose');


// define the schema for our user model
var referenceWidgetSchema = mongoose.Schema({
    name: String,
    description: String,
    order: Number,
    offSet: Number,
    size: {
        width: Number,
        height: Number
    },
    minSize: {
        width: Number,
        height: Number
    },
    maxSize: {
        width: Number,
        height: Number
    },
    widgetType: String,
    charts:Object,
    created: Date,
    updated: Date,
    deleted: Date
});

// create the model for organization and expose it to our app
module.exports = mongoose.model('referenceWidget', referenceWidgetSchema);