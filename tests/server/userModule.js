//HTTP request library
var superagent = require('superagent');

//Assertion library
var chai = require('chai');

//chainable language to construct assertions,
var should = chai.should(); // Note that should has to be executed

//Import user module
var user = require('../../models/user');

// UNIT test begin

describe("SAMPLE unit test", function () {

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

    it("should return me page", function (done) {

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
                console.log('res', res);
                // HTTP status should be 200
                res.status.should.equal(200);
                // Error key should be false.
                res.error.should.equal(false);
                done();
            });
    });
    it('create', function (done) {
        user.create('Famous Person', 'I am so famous!', function (err, id) {
            console.log('user');
            user.all(function (err, comments) {
                comments.length.should.eql(4)
                comments[3]._id.should.eql(id)
                comments[3].user.should.eql('Famous Person')
                comments[3].text.should.eql('I am so famous!')
                done()
            })
        })
    })

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



