
//HTTP request library
var superagent = require('superagent');
var dbURI = 'mongodb://showmetric:showmetric@ds013918.mlab.com:13918/showmetric';
var mongoose = require('mongoose');
var mockgoose = require('mockgoose');
var sample = require('../../models/user');
var chai = require('chai'),
    expect = require('chai').expect;
var assert = chai.assert,
    expect = chai.expect,
    should = chai.should();

before(function () {
    mockgoose(mongoose);
    mongoose.connect('mongodb://showmetric:showmetric@ds013918.mlab.com:13918/showmetric');
    //var sample = require('../../models/user');
});
describe("Example spec for a model", function () {

    it('should create a new User', function (done) {
        // Create a User object to pass to User.create()
        var u = {
            name: 'dbTest'
        };
        sample.create(u, function (err, createdUser) {
            console.log('user', createdUser)

            // Confirm that that an error does not exist
            should.not.exist(err);
            // verify that the returned user is what we expect
            createdUser.name.should.equal('dbTest');
            //createdUser.name.familyName.should.equal('Obama');
            // Call done to tell mocha that we are done with this test
            done();
        });
    });

    it('To get all widgets in a dashboard', function (done) {
        var id = '63b42b3d2cc1ef603b41d54a';
        superagent.get('http://localhost:8080/api/v1/dashboards/widgets/' + id)
            .end(function (e, res) {
                console.log(res.body)
                expect(e).to.eql(null)
                expect(typeof res.body).to.eql('object')
                expect(res.body.widgetsList[0].dashboardId).to.eql(id)
                done()
            })
    })

});
