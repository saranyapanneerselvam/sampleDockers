module.exports = function (app) {
    var OAuth = require('oauth').OAuth;
    var oa = new OAuth(
        "https://api.twitter.com/oauth/request_token",
        "https://api.twitter.com/oauth/access_token",
        "WHFw38bP9Z9ushEcbY5WESIPs",//Consumer key
        "OkvPiJEBViYfjeR1OU1z8rZvgI1MZBCZtqvmKkklN7xcGxV4QR",//consumer secret
        "1.0",
        "http://localhost:8080/auth/twitter/callback",
        "HMAC-SHA1"
    );

    app.get('/auth/twitter', function (req, res) {
        oa.getOAuthRequestToken(function (error, oauth_token, oauth_token_secret, results) {
            if (error) {
                console.log(error);
                res.send("yeah no. didn't work.")
            }
            else {
                req.session.oauth = {};
                req.session.oauth.token = oauth_token;
                console.log('oauth.token: ' + req.session.oauth.token);
                req.session.oauth.token_secret = oauth_token_secret;
                console.log('oauth.token_secret: ' + req.session.oauth.token_secret);
                res.redirect('https://twitter.com/oauth/authenticate?oauth_token=' + oauth_token)
            }
        });
    });
}