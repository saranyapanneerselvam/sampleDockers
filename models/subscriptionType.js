var mongoose = require('mongoose');

// define the collection for our organization model
var subscriptionTypeSchema = mongoose.Schema({
    name: String,
    code: String,
    limits: {
        basic: Number,
        adv: Number,
        fusion: Number,
        insights: Number,
        dateRange: Number
    },
    created: Date,
    updated: Date,
    deleted: Date


});

// create the model for organization and expose it to our app
module.exports = mongoose.model('subscriptionType', subscriptionTypeSchema);
