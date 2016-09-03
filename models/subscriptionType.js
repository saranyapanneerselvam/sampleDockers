var mongoose = require('mongoose');

// define the collection for our organization model
var subscriptionTypeSchema = mongoose.Schema({
    name: String,
    code: String,
    limits: {
        dashboards: Number,
        widgets: Number,
        fusions: Number,
        insights: Number,
        alerts:Number,
        chatSupport: Boolean,
        emailSupport: String,
        accountManager: Boolean,
        dateRange:Number,
    },
    created: Date,
    updated: Date,
    deleted: Date


});

// create the model for organization and expose it to our app
module.exports = mongoose.model('subscriptionType', subscriptionTypeSchema);
