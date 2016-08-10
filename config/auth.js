module.exports = {

    'facebookAuth': {
        clientID: '1693788390861075', // your App ID
        clientSecret: 'b606822266381df4c1604208f55f0024', // your App Secret
        callbackURL: 'http://localhost:8080/auth/facebook/callback',
        scope: 'manage_pages,read_insights',
        profileFields: ["emails", "displayName"],
        site:'https://www.facebook.com/dialog/',
        tokenPath:'https://graph.facebook.com/oauth/access_token',
        authorizationPath:'oauth',
        localCallingURL:'/api/v1/auth/facebook',
        localCallbackURL:'/auth/facebook/callback',
        accessTokenURL:'https://graph.facebook.com/me?access_token='
    },
    'aweberAuth': {
        clientID: 'AkREQGDPsoHjCN2mdF3qY4YM',
        clientSecret: 'ibqzrt5XWBUhZf6jrN65Gr9nPDLanh1mq9Yel1uK',
        callbackURL:  'http://localhost:8080/callback',
        scope: ['onescope', 'twoscope', 'redscope', 'bluescope'],
        site:'https://api.aweber.com/1.0/',
        tokenPath:'https://auth.aweber.com/1.0/oauth/access_token',
        authorizationPath:'oauth',
        localCallingURL:'/api/v1/auth/aweber',
        localCallbackURL:'/callback',
        requestTokenURL: 'https://auth.aweber.com/1.0/oauth/request_token',
        accessTokenURL: 'https://auth.aweber.com/1.0/oauth/access_token',
    },
    'vimeoAuth':{
        clientID: 'a974e4016ef940afbc49dbad33fc509e86a13dd2',
        clientSecret: 'BDFtraHrIncCWl3mGVm8emXQ/hZA5b6S/gsDNIqpFZdOOiizYNRS5dPOiAJhpDSDOfuPCh7FleHCM0c7tw4NMj9uhEvP+3F33YfHPzpLWysHyeeWGQUeKe2qs+GTGeoE',
        site: 'https://api.vimeo.com',
        tokenPath: '/oauth/access_token',
        authorizationPath: '/oauth/authorize',
        redirect_uri:'http://localhost:8080/auth/vimeo/callback',
        scope: 'public',
        state: '3(#0/!~',
        localCallingURL: '/api/auth/vimeo',
        localCallbackURL: '/auth/vimeo/callback',
        accessTokenURL:'https://api.vimeo.com/me?access_token=',
        common:'https://api.vimeo.com'
    },


    'twitterAuth': {
        consumerKey: 'mZ5GHKtuVoSanQzbMMiVCezXQ',
        consumerSecret: '2yEn5lkQdqNR2mfXBd10OQCfLMMffKtqQg7FIppGnxFGeQCBpA',
        callbackURL: 'http://localhost:8080/auth/twitter/callback',
        AccessToken: '709717246818406400-12lp03kRIX3prTZaJKilaf7BOEgcjKr',
        AccessTokenSecret:'NApHAIYXNdkMk5c4CJccFrWIrHyTbLENuM14Zpa0a7mjn',
        localCallingURL: '/api/auth/twitter',
        localCallbackURL: '/auth/twitter/callback',
        requestTokenURL:'https://api.twitter.com/oauth/request_token',
        accessTokenURL:'https://api.twitter.com/oauth/access_token',
        oAuthVersion: '1.0',
        otherParams:'HMAC-SHA1',
        authenticationURL:'https://twitter.com/oauth/authenticate?oauth_token='
    },

    'googleAuth': {
        clientID: '261872343303-4c2pdfa4v7bhdtnqv0ug1iff877andnj.apps.googleusercontent.com',
        clientSecret: 'FaSgJZEP_3PSo9QKH0hF250I',
        callbackURL: 'http://localhost:8080/auth/google/callback',
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

/*
    clientID: '837692358996-slf0ol1u2btqki4d200qpv4fic9jp70d.apps.googleusercontent.com',
    clientSecret: 'nwlL0AVHi-h2jShCKfsvHQjK',
*/

    'googleAdwordsAuth':{
        clientID: '870217049857-gm1938i5vr53l4og5m5fmp1fjprbe7af.apps.googleusercontent.com',
        clientSecret: '1ZtXnW143hAuBAmZtj0i-rzC',
        callbackURL: 'http://localhost:8080/auth/adwords/callback',
        scope:'https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/adwords',
        state: '5$55#',
        managerClientId:'507-960-6961',
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
        clientID: '77bfdc87cb0744f8969746665368a743',
        clientSecret: '28c87fe403944737a7abce42f15d8388',
        callbackURL: 'http://localhost:8080/auth/instagram/callback',
        scope : ['basic', 'public_content', 'relationships', 'follower_list', 'comments', 'likes'],
        authorizationUrl:'https://api.instagram.com/oauth/authorize',
        accessTokenUrl:'https://api.instagram.com/oauth/access_token',
        localCallingURL: '/api/auth/instagram',
        localCallbackURL: '/auth/instagram/callback'
    },

    'facebookAdsAuth' : {
        clientID: '1693788390861075', // your App ID
        clientSecret: 'b606822266381df4c1604208f55f0024', // your App Secret
        grant_type      : '20f13bbac6d24f55359d3b9a598c48e4',
        site            : 'https://www.facebook.com/dialog/',
        tokenPath       : 'https://graph.facebook.com/oauth/access_token',
        authorizationPath: 'oauth',
        redirect_uri : 'http://localhost:8080/auth/facebookads/callback',
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
        linkedIn: 'linkedin',
        moz:'moz',
        vimeo:'vimeo',
        aweber:'aweber'
    },

    'objectType':{
        facebookAds:'fbadaccount',
        facebookPage:'page',
        facebookPost:'post',
        facebookAdCampaign:'fbAdcampaign',
        facebookAdSet:'fbAdSet',
        facebookAdSetAds:'fbAdSetAds',
        googleView:'gaview',
        twitter :'tweet',
        googleAdword :'adwordaccount',
        googleProperty: 'gaproperty',
        googleAccount: 'gaaccount',
        youtubeChannel:'youtubeChannel',
        mailChimpCampaign:'campaigns',
        mailChimpList:'lists',
        linkedIn:'companyPage',
        vimeochannel:'vimeochannel',
        vimeovideos:' vimeovideos',
        aweberList:"aweberlists",
        aweberCampaign:'awebercampaigns'
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
        callbackURL: 'http://localhost:8080/auth/youtube/callback',
        site: 'https://accounts.google.com/o/',
        tokenPath: 'https://accounts.google.com/o/oauth2/token',
        authorizationPath: 'oauth2/auth',
        approvalPrompt: 'force',
        accessType: 'offline',
        scope: 'https://www.googleapis.com/auth/youtube https://www.googleapis.com/auth/yt-analytics.readonly https://www.googleapis.com/auth/yt-analytics-monetary.readonly',
        state: '3832$',
        localCallingURL: '/api/v1/auth/youtube',
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
        clientID        : '764897986548',
        clientSecret    : 'd4ed50a96dad8d6e47bd043205bb5765',
        redirect_uri : 'http://127.0.0.1:8080/auth/mailchimp/callback/',
        authorizationUrl:"https://login.mailchimp.com/oauth2/authorize",
        accessTokenUrl:"https://login.mailchimp.com/oauth2/token",
        base_uri:"https://login.mailchimp.com/oauth2/",
        metadata:"https://login.mailchimp.com/oauth2/metadata",
        apiKey:"77baa3687f263b77dbda4f97b5111b62-us13"

    },
    'pinterest':{
        clientID        : '4838237239574020593',
        clientSecret    : '84fe4b846f68a8f896282f5b55cdd23b0d341d6fb07fcd4920bebb3c5eaff4b7',
        redirect_uri : 'https://localhost:8080/auth/pinterest/callback',
        scope:'read_public,read_relationships'
    },
    'linkedIn':{
        clientID :'81rzqsz9vo6vk4',
        clientSecret :'qWo9LU2s6KJ9EnNI',
        redirect_uri:'http://localhost:8080/auth/linkedin/callback',
        scope : [["r_basicprofile","r_emailaddress","rw_company_admin"]],
        tokenPath:'https://www.linkedin.com/oauth/v2/accessToken',
        site:'https://www.linkedin.com/oauth/',
        authorizationPath: 'v2/authorization'
    }

};

