//HTTP request library
var superagent = require('superagent');

//Assertion library
var chai = require('chai');

//chainable language to construct assertions,
var should = chai.should(); // Note that should has to be executed

//Import user module
var user = require('../../models/user');
var chai = require('chai'),
    expect = require('chai').expect;
var assert = chai.assert,
    expect = chai.expect,
    should = chai.should();
const Browser = require('zombie');
// UNIT test begin

describe("SAMPLE unit test", function () {
    this.timeout(15000);

    const browser = new Browser();

    // #1 should return home page

    it("should return home page", function (done) {

        // calling home page api
        superagent
            .get("http://localhost:8080/")

            .end(function (err, res) {
                //console.log('res',res);
                // HTTP status should be 200
                res.status.should.equal(200);
                // Error key should be false.
                res.error.should.equal(false);
                done();
            });
    });

    // #2 should return login page

    it("should return login page", function (done) {

        // calling login page api
        superagent
            .get("http://localhost:8080/api/v1/login")
            .end(function (err, res) {
                // console.log('res',res);
                // HTTP status should be 200
                res.status.should.equal(200);
                // Error key should be false.
                res.error.should.equal(false);
                done();
            });
    });

    // #3 should return login success

    it("should return login success", function (done) {

        // calling login page api
        superagent
            .post("http://localhost:8080/api/v1/login")
            .end(function (err, res) {
                // console.log('res',res);
                // HTTP status should be 200
                res.status.should.equal(200);
                // Error key should be false.
                res.error.should.equal(false);
                done();
            });
    });

    // #4 should return sign up page

    it("should return sign up page", function (done) {

        // calling login page api
        superagent
            .get("http://localhost:8080/api/v1/signup")
            .end(function (err, res) {
                // console.log('res',res);
                // HTTP status should be 200
                res.status.should.equal(200);
                // Error key should be false.
                res.error.should.equal(false);
                done();
            });
    });

    // #5 should return sign up success
    it("should return sign up success", function (done) {

        // calling login page api
        superagent
            .post("http://localhost:8080/api/v1/signup")
            .end(function (err, res) {
                // console.log('res',res);
                // HTTP status should be 200
                res.status.should.equal(200);
                // Error key should be false.
                res.error.should.equal(false);
                done();
            });
    });


    // #4 should return profile page

    /*it("should return me page", function (done) {

     // calling login success page api
     superagent
     .get("http://localhost:8080/api/v1/me")
     .set({
     'headers': {
     Cookie: 's%3Ad4DYiUQVb2fXtn6fDvSLThy5.h6QyH26q4azwRmVge2TSp5SPGRnCXz10gUsADmpb7zI',
     'content-type': 'application/json'
     },
     })
     .set('Accept', 'application/json')


     .end(function (err, res) {
     // console.log('res', res);
     // HTTP status should be 200
     res.status.should.equal(200);
     // Error key should be false.
     res.error.should.equal(false);
     done();
     });
     });*/

    //should return channel user's page list
    /*it('To get all widgets in a dashboard', function (done) {
     this.timeout(15000);
     setTimeout(done, 15000);
     superagent.get('http://localhost:8080/api/v1/channel/profiles/objectsList/56dd27af205313ec082095e9?objectType=page')
     .end(function (e, res) {
     if (res.body.channelId === '56d52c7ae4b0196c549033ca') {

     //expect(e).to.eql(null)
     expect(typeof res.body.objectList).to.eql('object')
     expect(res.body.objectList[0].name).to.eql('Michael Madana Kamarajan')
     expect(res.body.objectList[1].name).to.eql('Hotel mani')
     expect(res.body.objectList[2].name).to.eql('The Organic Post')
     expect(res.body.objectList[3].name).to.eql('Metro Weddings India')

     }
     done();

     });
     });*/

    //should return all channels from database
    it('should return channels', function (done) {
        superagent.get('http://localhost:8080/api/v1/get/channels')
            .end(function(err,res){

                expect(res.body[0].name).to.eql('Google Analytics')
                expect(res.body[1].name).to.eql('Facebook')
                expect(res.body[2].name).to.eql('Twitter')
                expect(res.body[3].name).to.eql('FacebookAds')
                done();
            });
    });

    //should return single dashboard details
    it("should return single dashboard's details", function(done){
        var id='63b42b3d2cc1ef603b41d54a';
        superagent.get('http://localhost:8080/api/v1/get/dashboards/'+id)
            .end(function(err,res){

                expect(res.body.data._id).to.eql(id)
                done();
            });
    });

    //should return all metrics for a given channel id
    it('should return all metrics',function(done){
        this.timeout(150000);
        setTimeout(done, 150000);
        var id = '56d52c7ae4b0196c549033ca';
        superagent.get('http://localhost:8080/api/v1/get/metrics/'+id)
            .end(function(err,response){
                console.log('res',response.body)
                //done();
            })
    })
    /* it('Checking for the sucess URL', function (done) {

     browser.visit('http://localhost:8080/api/v1/auth/facebook', function (err, browser) {
     console.log('browser',err,browser);
     if (err)
     throw err;
     console.log('Zombie visited the page,page loaded    ');
     assert.equal(browser.location.pathname, '/auth/facebook/callback');

     //all your tests goes here

     /!*you'll be using this 'browser object in the callback for further tests *!/

     done();
     });
     });*/


    /* it('should get user session for current user', function (done) {
     var req = server(app).get('/api/v1/me');
     // Set cookie to get saved user session
     req.cookies = 's%3AFO3US7CGVX8dqqfsAIPahEeQ.hB5vgm4K67R%2FELiqEc8EpOTVWoqmBXGvKp4NTBilP9Y';
     req.set('Accept','application/json')
     .expect('Content-Type', /json/)
     .expect(200)
     .end(function (err, res) {
     res.status.should.equal('200');
     res.body.short_name.should.equal('Test user');
     res.body.email.should.equal('user_test@example.com');
     done();
     });
     });*/

});



