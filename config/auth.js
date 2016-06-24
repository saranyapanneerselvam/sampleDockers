module.exports = {

    'facebookAuth': {
        'clientID': '1716895671912901', // your App ID
        'clientSecret': 'e5f9e0828dc78c548ddbc3ac9e3658fd', // your App Secret
        'callbackURL': 'https://datapoolt.co/auth/facebook/callback',
        'scope': 'manage_pages,read_insights',
        profileFields: ["emails", "displayName"]
    },

    'twitterAuth': {
        'consumerKey': 'e7SnwcN5W8FC1y6O8IpMtl2S8',
        'consumerSecret': 'YZmgirt6IAnUPxZGWvioVWeXiMRn4E6GKsVKv5MJUO4zD6PNcy',
        'callbackURL': 'https://datapoolt.co/auth/twitter/callback',
        'AccessToken': '10251882-S32VcR53BASqnXwC0NuEPvAg8X1eANCERfeuenDD3',
        'AccessTokenSecret':'HswuTzGf3iUwxOKFQrOoUF36NdUinxXQhfBPD8E4ifFii'
    },

    'googleAuth': {
        'clientID': '697605351302-cm90a20idvq2gcu3qju0oaab88ik6peg.apps.googleusercontent.com',
        'clientSecret': 'DkUY5XrdcWDQM_7tEI9xNAC6',
        'callbackURL': 'https://datapoolt.co/auth/google/callback'
    },

    'googleAdwordsAuth':{
        'clientID': '870217049857-gm1938i5vr53l4og5m5fmp1fjprbe7af.apps.googleusercontent.com',
        'clientSecret': '1ZtXnW143hAuBAmZtj0i-rzC',
        'callbackURL': 'https://datapoolt.co/auth/adwords/callback',
        'scope':'https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/adwords',
        'state': '5$55#',
        'managerClientId':'374-579-6439',
        'developerToken':'67sNz0baUXdQ0zN1RiVVUQ',
        'userAgent':'ShowmetricDeveloment M:ReportDownloader:V1.0'
    },

    'instagramAuth': {
        'clientID': '222690d755ba41d0a0defad5e19eceaf',
        'clientSecret': '51856a68d3b14b9f85d755bc615986e8',
        'callbackURL': 'https://datapoolt.co/auth/instagram/callback',
        'scope' : ['basic', 'public_content', 'relationships', 'follower_list', 'comments', 'likes'],
        'authorizationUrl':"https://api.instagram.com/oauth/authorize",
        'accessTokenUrl':"https://api.instagram.com/oauth/access_token"
    },

    'facebookAdsAuth' : {
        clientID        : '1716895671912901',
        clientSecret    : 'e5f9e0828dc78c548ddbc3ac9e3658fd',
        grant_type      : '81ec394c25ccd13f60ba3fe2b2ba3f4c',
        site            : 'https://www.facebook.com/dialog/',
        tokenPath       : 'https://graph.facebook.com/oauth/access_token',
        authorizationPath: 'oauth',
        redirect_uri : 'https://datapoolt.co/auth/facebookads/callback',
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
