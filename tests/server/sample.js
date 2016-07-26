const Browser = require('zombie');

// We're going to make requests to http://example.com/signup 
// Which will be routed to our test server localhost:3000 
Browser.localhost('localhost:8080', 8080);

describe('User visits signup page', function() {

    const browser = new Browser();

    before(function(done) {
        browser.visit('api/v1/auth/facebook', done);
    });

    it('submits form', function() {

        Browser.localhost('example.com', 8080)
        browser.visit('/path', function () {
            console.log(browser.location.href);
        });
    })
});