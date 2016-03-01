module.exports = {

    'facebookAuth': {
        'clientID': '1693788390861075', // your App ID
        'clientSecret': 'b606822266381df4c1604208f55f0024', // your App Secret
        'callbackURL': 'http://localhost:8080/auth/facebook/callback',
        profileFields: ["emails", "displayName"]
    },

    'twitterAuth': {
        'consumerKey': 'WHFw38bP9Z9ushEcbY5WESIPs',
        'consumerSecret': 'OkvPiJEBViYfjeR1OU1z8rZvgI1MZBCZtqvmKkklN7xcGxV4QR',
        'callbackURL': 'http://localhost:8080/auth/twitter/callback'
    },

    'googleAuth': {
        'clientID': '261872343303-4c2pdfa4v7bhdtnqv0ug1iff877andnj.apps.googleusercontent.com',
        'clientSecret': 'FaSgJZEP_3PSo9QKH0hF250I',
        'callbackURL': 'http://localhost:8080/auth/google/callback'
    }

};