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
        'callbackURL': 'http://localhost:8080/auth/twitter/callback',
        'AccessToken': '10251882-ni5BwChGKqwnUH1FAtucjfTp7RSyn2cqi9UF3oWnx',
        'AccessTokenSecret':'APXRXindtRTptbFfD77ogOnCV3XsMbTYAncsij323pKuj'
    },

    'googleAuth': {
        'clientID': '261872343303-4c2pdfa4v7bhdtnqv0ug1iff877andnj.apps.googleusercontent.com',
        'clientSecret': 'FaSgJZEP_3PSo9QKH0hF250I',
        'callbackURL': 'http://localhost:8080/auth/google/callback'
    },
    'facebookAdsAuth' : {
        clientID        : '799332023525923',
        clientSecret    : '8e66d0413faaaecab964b8054d405aae',
        grant_type      : 'c71500c25185e15ad84fadd9df05ded9',
        site            : 'https://www.facebook.com/dialog/',
        tokenPath       : 'https://graph.facebook.com/oauth/access_token',
        authorizationPath: 'oauth',
        redirect_uri : 'http://localhost:8080/auth/facebookads/callback',
        scope : 'email,manage_pages,read_insights,publish_actions,ads_read,ads_management',
        state : '4234#'
    },
    'channels': {
        facebook : 'facebook',
        facebookAds : 'facebookads',
        googleAnalytics: 'googleanalytics'
    },
    'objectType':{
        facebookAds:'fbadaccount',
        facebookPage:'page',
        facebookPost:'post',
        googleView:'view'
    }
};