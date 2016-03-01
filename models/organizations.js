var mongoose = require('mongoose');

// define the collection for our organization model
var organizationSchema = mongoose.Schema({
    name: String,
    country: String,
    subscriptionTypeId: String,
    paymentInfo: {
        cardNo: String,
        exp: String,
        vcc: String,
        name: String
    },
    billingAddress: {
        doorNo: String,
        street: String,
        area: String,
        city: String,
        state: String,
        country: String,
        zip: String

    },
    active: Boolean,
    subscriptionExpiresOn: Date,
    created: Date,
    updated: Date,
    deleted: Date


});
// create the model for organization and expose it to our app
module.exports = mongoose.model('Organization', organizationSchema);
