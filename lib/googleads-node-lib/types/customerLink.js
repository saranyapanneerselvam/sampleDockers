var Backbone = require('backbone');

var CustomerLink = Backbone.Model.extend({});

var CustomerLinkCollection = Backbone.Collection.extend({
    model: CustomerLink,
});

module.exports = {
    collection: CustomerLinkCollection,
    model: CustomerLink
};
