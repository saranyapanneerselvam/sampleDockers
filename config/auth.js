module.exports = {

    'facebookAuth': {
        clientID: '1716895671912901', // your App ID
        clientSecret: 'e5f9e0828dc78c548ddbc3ac9e3658fd', // your App Secret
        callbackURL: 'https://datapoolt.co/auth/facebook/callback',
        scope: 'manage_pages,read_insights',
        profileFields: ["emails", "displayName"],
        site:'https://www.facebook.com/dialog/',
        tokenPath:'https://graph.facebook.com/oauth/access_token',
        authorizationPath:'oauth',
        localCallingURL:'/api/v1/auth/facebook',
        localCallbackURL:'/auth/facebook/callback',
        accessTokenURL:'https://graph.facebook.com/me?access_token='
    },

    'twitterAuth': {
        consumerKey: 'e7SnwcN5W8FC1y6O8IpMtl2S8',
        consumerSecret: 'YZmgirt6IAnUPxZGWvioVWeXiMRn4E6GKsVKv5MJUO4zD6PNcy',
        callbackURL: 'https://datapoolt.co/auth/twitter/callback',
        AccessToken: '10251882-3anABLaQc4ZaWbp6GDj21u19BUuTFQX3zVmlutnn7',
        AccessTokenSecret:'x9H1UO0BoMtfmWhN9OWzqQVJtasSVwNzohOhYEzTuyzoR',
        localCallingURL: '/api/auth/twitter',
        localCallbackURL: '/auth/twitter/callback',
        requestTokenURL:'https://api.twitter.com/oauth/request_token',
        accessTokenURL:'https://api.twitter.com/oauth/access_token',
        oAuthVersion: '1.0',
        otherParams:'HMAC-SHA1',
        authenticationURL:'https://twitter.com/oauth/authenticate?oauth_token='
    },

    'googleAuth': {
        clientID: '697605351302-cm90a20idvq2gcu3qju0oaab88ik6peg.apps.googleusercontent.com',
        clientSecret: 'DkUY5XrdcWDQM_7tEI9xNAC6',
        callbackURL: 'https://datapoolt.co/auth/google/callback',
        localCallingURL: '/api/v1/auth/google',
        localCallbackURL: '/auth/google/callback',
        site: 'https://accounts.google.com/o/',
        tokenPath: 'https://accounts.google.com/o/oauth2/token',
        authorizationPath: 'oauth2/auth',
        approvalPrompt: 'force',
        accessType: 'offline',
        scope: 'https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/analytics.readonly ',
        state: '3832$',
        requestTokenURL:'https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=',
        accessTokenURL:'https://www.googleapis.com/oauth2/v2/userinfo?access_token='
    },

    'googleAdwordsAuth':{
        clientID: '870217049857-gm1938i5vr53l4og5m5fmp1fjprbe7af.apps.googleusercontent.com',
        clientSecret: '1ZtXnW143hAuBAmZtj0i-rzC',
        callbackURL: 'https://datapoolt.co/auth/adwords/callback',
        scope:'https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/adwords',
        state: '5$55#',
        managerClientId:'374-579-6439',
        developerToken:'67sNz0baUXdQ0zN1RiVVUQ',
        userAgent:'ShowmetricDeveloment M:ReportDownloader:V1.0',
        localCallingURL:'/api/auth/adwords',
        localCallbackURL:'/auth/adwords/callback',
        approvalPrompt:'force',
        accessType:'offline',
        site:'https://accounts.google.com/o/',
        tokenPath:'https://accounts.google.com/o/oauth2/token',
        authorizationPath:'oauth2/auth'
    },

    'instagramAuth': {
        clientID: '222690d755ba41d0a0defad5e19eceaf',
        clientSecret: '51856a68d3b14b9f85d755bc615986e8',
        callbackURL: 'https://datapoolt.co/auth/instagram/callback',
        scope : ['basic'],
        authorizationUrl:'https://api.instagram.com/oauth/authorize',
        accessTokenUrl:'https://api.instagram.com/oauth/access_token',
        localCallingURL: '/api/auth/instagram',
        localCallbackURL: '/auth/instagram/callback'
    },

    'facebookAdsAuth' : {
        clientID        : '1716895671912901',
        clientSecret    : 'e5f9e0828dc78c548ddbc3ac9e3658fd',
        grant_type      : 'c71500c25185e15ad84fadd9df05ded9',
        site            : 'https://www.facebook.com/dialog/',
        tokenPath       : 'https://graph.facebook.com/oauth/access_token',
        authorizationPath: 'oauth',
        redirect_uri : 'https://datapoolt.co/auth/facebookads/callback',
        scope : 'email,manage_pages,read_insights,ads_read,ads_management',
        state : '4234#',
        localCallingURL: '/api/auth/facebookads',
        localCallbackURL: '/auth/facebookads/callback',
        accessTokenURL:'https://graph.facebook.com/me?access_token='
    },

    'channels': {
        facebook : 'facebook',
        facebookAds : 'facebookads',
        googleAnalytics: 'googleanalytics',
        twitter :'twitter',
        googleAdwords : 'googleAdwords',
        instagram: 'instagram',
        youtube: 'youtube',
        pinterest: 'pinterest',
        mailChimp: 'mailchimp',
        linkedIn: 'linkedin'
    },

    'objectType':{
        facebookAds:'fbadaccount',
        facebookPage:'page',
        facebookPost:'post',
        googleView:'gaview',
        twitter :'tweet',
        googleAdword :'adwordaccount',
        googleProperty: 'gaproperty',
        googleAccount: 'gaaccount',
        youtubeChannel:'youtubeChannel',
        mailChimpCampaign:'campaigns',
        mailChimpList:'lists',
        linkedIn:'companyPage'
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
        gaApi:'ga',
        youtubeApi: 'youtube'
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
    },

    youTubeAuth: {
        clientID: '697605351302-cm90a20idvq2gcu3qju0oaab88ik6peg.apps.googleusercontent.com',
        clientSecret: 'DkUY5XrdcWDQM_7tEI9xNAC6',
        callbackURL: 'https://datapoolt.co/auth/youtube/callback',
        site: 'https://accounts.google.com/o/',
        tokenPath: 'https://accounts.google.com/o/oauth2/token',
        authorizationPath: 'oauth2/auth',
        approvalPrompt: 'force',
        accessType: 'offline',
        scope: 'https://www.googleapis.com/auth/youtube https://www.googleapis.com/auth/yt-analytics.readonly https://www.googleapis.com/auth/yt-analytics-monetary.readonly',
        state: '3832$',
        localCallingURL: '/api/v1/auth/youTube',
        localCallbackURL: '/auth/youtube/callback'
    },

    expire:{
        FBAccessExpire:5097600,
        linkedInAccessExpire:60
    },

    apiVersions:{
        FBInsights:'v2.6',
        FBADs:'v2.6'
    },

    widgetType:{
        customFusion:'customFusion'
    },

    dataFormat:{
        dateFormat:'YYYYMMDD',
        logDataFormat:'[:date[clf]] :method :url :status :res[header] :response-time ms',
        fileNameFormat:'/errorLog-%DATE%.log',
        frequency:'daily',
        folderName:'/log'
    },

    'mailChimp':{
        clientID        : '236023092083',
        clientSecret    : '2aa7fd91868924efd542767bc65b2ec9',
        redirect_uri : 'https://datapoolt.co/auth/mailchimp/callback/',
        authorizationUrl:"https://login.mailchimp.com/oauth2/authorize",
        accessTokenUrl:"https://login.mailchimp.com/oauth2/token",
        base_uri:"https://login.mailchimp.com/oauth2/",
        metadata:"https://login.mailchimp.com/oauth2/metadata",
        apiKey:"5b907c6f3b2f00b07270d38b709a8106-us13"

    },
    'pinterest':{
        clientID        : '4838237239574020593',
        clientSecret    : '84fe4b846f68a8f896282f5b55cdd23b0d341d6fb07fcd4920bebb3c5eaff4b7',
        redirect_uri : 'https://localhost:8080/auth/pinterest/callback',
        scope:'read_public,read_relationships'
    },
    'linkedIn':{
        clientID :'81665zttd0yozd',
        clientSecret :'KUlhe3rR1ZoV3V2o',
        redirect_uri:'https://datapoolt.co/auth/linkedin/callback',
        scope : [["r_basicprofile","r_emailaddress","rw_company_admin"]],
        tokenPath:'https://www.linkedin.com/oauth/v2/accessToken',
        site:'https://www.linkedin.com/oauth/',
        authorizationPath: 'v2/authorization'
    }

};

