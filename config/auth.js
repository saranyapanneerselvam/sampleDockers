module.exports = {

    'facebookAuth': {
        'clientID': '799332023525923', // your App ID
        'clientSecret': '8e66d0413faaaecab964b8054d405aae', // your App Secret
        'scope': 'manage_pages,read_insights',
        'callbackURL': 'http://localhost:8080/auth/facebook/callback',
        'profileFields': ["emails", "displayName","manage_pages","read_insights"],
        'state': '3832$'
    },

    'twitterAuth': {
        'consumerKey': 'mZ5GHKtuVoSanQzbMMiVCezXQ',
        'consumerSecret': '2yEn5lkQdqNR2mfXBd10OQCfLMMffKtqQg7FIppGnxFGeQCBpA',
        'callbackURL': 'http://localhost:8080/auth/twitter/callback',
        'AccessToken': '709717246818406400-12lp03kRIX3prTZaJKilaf7BOEgcjKr',
        'AccessTokenSecret':'NApHAIYXNdkMk5c4CJccFrWIrHyTbLENuM14Zpa0a7mjn'
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
        googleAnalytics: 'googleanalytics',
        twitter :'twitter'
    },
    'objectType':{
        facebookAds:'fbadaccount',
        facebookPage:'page',
        facebookPost:'post',
        googleView:'view',
        twitter :'tweet'
    },
    'twitterMetric':{
        Keywordmentions : 'Keyword mentions',
        Mentions : 'Mentions',
        HighEngagementtweets :'High Engagement tweets'
    }
};