var chai = require('chai'),
    expect = require('chai').expect;
var supertest = require("supertest");
var assert = chai.assert,
    expect = chai.expect,
    should = chai.should(); // Note that should has to be executed
var request = require('supertest');
var superagent = require('superagent');
var url = 'http://facebook.com';
    describe('Check Login Functionality', function() {
    it('Check response on adding correct email and password', function(done) {
        var profile = {
            email: 'email',
        pass: 'password'
    };
        request(url)
            .post('/api/v1/signup')
    .send('profile')
    .end(function(err,res){
            if(err)
            {
                Console.log(err);
            }
            res.status.should.equal(200);
            res.body.email.should.equal(email);
            done();
        });
    });
});