var
    _ = require('lodash'),
    async = require('async'),
    soap = require('soap');

var AdWordsCustomerService = require('./adwordsCustomerService');
var types = require('../types/customer');
var links = require('../types/customerLink');

function Service(options) {
    var self = this;
//    var Selector = require('../types/selector').model;
    AdWordsCustomerService.call(self, options);
    self.Collection = types.collection;
    self.Model = types.model;
    self.ManagedCustomerLinkCollection = links.collection;
    self.ManagedCustomerLink = links.model;

    self.findByCustomerId = function(accessToken,cb) {
        return self.getCustomer(accessToken,cb);
    };

    /*self.findCustomerDetail = function( cb) {
     var selector = new Selector({
     });

     return self.get(selector, cb);
     };*/

    self.mutateLinkSet = function(clientCustomerId, operand, done) {
        if (!operand.isValid()) return done(operand.validationError);
        var operation = {};
        operation[self.operatorKey] = 'SET';
        operation.operand = operand.toJSON();

        var options = {
            clientCustomerId: clientCustomerId,
            mutateMethod: 'mutateLink',
            operations: [operation],
            parseMethod: self.parseMutateLinkResponse
        };

        self.mutate(options, done);
    };

    // why the cm?
    self.operatorKey = 'cm:operator';
    self.mutateRemove = null;
    self.mutateSet = null;

    self.parseGetResponse = function(response) {
        if (self.validateOnly) {
            return {
                entries: null,
                links: null,
                'Page.Type': null,
                totalNumEntries: null

            };
        } else {
            if (response.rval) {
                return {
                    entries: new self.Collection(response.rval.entries),
                    links: new self.Collection(response.rval.links),
                    'Page.Type': response.rval['Page.Type'],
                    totalNumEntries: response.rval.totalNumEntries
                };
            } else {
                return {};
            }
        }
    };

    self.parseMutateResponse = function(response) {
        if (self.validateOnly) {
            return {
                value: null
            };
        } else {
            if (response.rval) {
                return {
                    value: new self.Collection(response.rval.value)
                };
            } else {
                return {};
            }
        }
    };

    self.parseMutateLinkResponse = function(response) {
        if (self.validateOnly) {
            return {
                links: null
            };
        } else {
            if (response.rval) {
                return {
                    links: new self.Collection(response.rval.links)
                };
            } else {
                return {};
            }
        }
    };

    self.selectable = [
        'AccountLabels',
        'CanManageClients',
        'CompanyName',
        'CurrencyCode',
        'CustomerId',
        'DateTimeZone',
        'Name',
        'TestAccount'
    ];

    self.xmlns = 'https://adwords.google.com/api/adwords/mcm/v201605' ;
    self.wsdlUrl = self.xmlns + '/CustomerService?wsdl';
}

Service.prototype = _.create(AdWordsCustomerService.prototype, {
    'constructor': Service
});

module.exports = (Service);
