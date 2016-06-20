module.exports = {

    'facebookAuth': {
        clientID: '1693788390861075', // your App ID
        clientSecret: 'b606822266381df4c1604208f55f0024', // your App Secret
        callbackURL: 'http://localhost:8080/auth/facebook/callback',
        scope: 'manage_pages,read_insights',
        profileFields: ["emails", "displayName"]
    },

    'twitterAuth': {
        consumerKey: 'mZ5GHKtuVoSanQzbMMiVCezXQ',
        consumerSecret: '2yEn5lkQdqNR2mfXBd10OQCfLMMffKtqQg7FIppGnxFGeQCBpA',
        callbackURL: 'http://localhost:8080/auth/twitter/callback',
        AccessToken: '709717246818406400-12lp03kRIX3prTZaJKilaf7BOEgcjKr',
        AccessTokenSecret:'NApHAIYXNdkMk5c4CJccFrWIrHyTbLENuM14Zpa0a7mjn'
    },

    'googleAuth': {
        clientID: '261872343303-4c2pdfa4v7bhdtnqv0ug1iff877andnj.apps.googleusercontent.com',
        clientSecret: 'FaSgJZEP_3PSo9QKH0hF250I',
        callbackURL: 'http://localhost:8080/auth/google/callback'
    },

    'googleAdwordsAuth':{
        clientID: '837692358996-slf0ol1u2btqki4d200qpv4fic9jp70d.apps.googleusercontent.com',
        clientSecret: 'nwlL0AVHi-h2jShCKfsvHQjK',
        callbackURL: 'http://localhost:8080/auth/adwords/callback',
        scope:'https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/adwords',
        state: '5$55#',
        managerClientId:'507-960-6961',
        developerToken:'R45HDlrLXatt0pMUMDVlUw',
        userAgent:'ShowmetricDeveloment M:ReportDownloader:V1.0'
    },
    
    'instagramAuth': {
        clientID: '77bfdc87cb0744f8969746665368a743',
        clientSecret: '28c87fe403944737a7abce42f15d8388',
        callbackURL: 'http://localhost:8080/auth/instagram/callback',
        scope : ['basic', 'public_content', 'relationships', 'follower_list', 'comments', 'likes'],
        authorizationUrl:"https://api.instagram.com/oauth/authorize",
        accessTokenUrl:"https://api.instagram.com/oauth/access_token"
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
        twitter :'twitter',
        googleAdwords : 'googleAdwords',
        instagram: 'instagram'
    },

    'objectType':{
        facebookAds:'fbadaccount',
        facebookPage:'page',
        facebookPost:'post',
        googleView:'gaview',
        twitter :'tweet',
        googleAdword :'adwordaccount',
        googleProperty: 'gaproperty',
        googleAccount: 'gaaccount'
    },

    'twitterMetric':{
        keywordMentions : 'keyword_mentions',
        mentions : 'mentions',
        highEngagementTweets :'high_engagement_tweets',
        tweets: 'tweets',
        following:'following',
        followers:'followers',
        favourites:'favourites',
        listed:'listed',
        retweets_of_your_tweets:'retweetsOfYourTweets'
    },

    'googleAdwordsMetric' :{
        clicks: 'clicks',
        cost:'cost',
        impressions:'impressions',
        clickThroughRate:'clickThroughRate',
        costPerConversion :'costPerConversion',
        conversionRate : 'conversionRate',
        conversions : 'conversions',
        costPerClick:'costPerClick',
        costPerThousandImpressions:'costPerThousandImpressions'
    },
    googleApiTypes:{
        mcfApi:'mcf',
        gaApi:'ga'
    },
    interval:{
        setDaily:'daily',
        setWeekly:'weekly'
    },
    dayNames:{
        Sunday:'Sunday',
        Monday:'Monday',
        Tuesday:'Tuesday',
        Wednesday:'Wednesday',
        Thursday:'Thursday',
        Friday:'Friday',
        Saturday:'Saturday'
    }
};