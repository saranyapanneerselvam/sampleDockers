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
        googleAdwordtypeId:'570e251ae4b0cbcd095d6ef0',
        googleAdwordAdGrouptypeId:'57a480cbed5dca13b01bf081',
        googleAdwordCampaigntypeId:'57a480b6ed5dca13b01bf07f',
        googleAdwordsAdtypeId:'57a5ec21ed5dca1cc08b4728',
        googleAdwordCampaign:'adwordCampaign',
        googleAdwordAdGroup:'adwordAdgroup',
        googleAdwordAd:'adwordsAd',
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
    googleAdwordsStatic:{
        host:'https://adwords.google.com/api/adwords/reportdownload/v201601',
        ADGROUP_PERFORMANCE_REPORT:'ADGROUP_PERFORMANCE_REPORT',
        adGroupId:'AdGroupId,',
        date:'Date,',
        adGroupIdEqual:"AdGroupId=",
        campaignId:'CampaignId,',
        CAMPAIGN_PERFORMANCE_REPORT:'CAMPAIGN_PERFORMANCE_REPORT',
        campaignEqual:"CampaignId=",
        id:'Id,',
        idEquals:"Id=",
        AD_PERFORMANCE_REPORT:'AD_PERFORMANCE_REPORT',
        ACCOUNT_PERFORMANCE_REPORT:'ACCOUNT_PERFORMANCE_REPORT'
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
        FBADs:'v2.6',
        FBInsightsUpdated:'v2.7'
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
    },
    'batchJobs':{
        dataBase:"mongodb://saranya:saranya@ds031975.mlab.com:31975/datapooltlocal",
        mail:{
            user: 'rajalakshmi.c@habile.in',
            password: 'habile3238'
        },
        alertName:'Send Alert',
        alertJobName:'Update channel data',
        successBatchJobMessage:'success:Update channel data',
        successAlertMessage:'success:Send Alert'
    },
    'batchJobsMoz':{
        accessId: 'mozscape-d79bd6e88f',
        secret: 'e093b821ca077d42fd113db646c22487',
        expires: 300
    },
    pinterestMetrics:{
        boardsLeaderBoard:'boardsleaderboard',
        engagementRate:'engagementRate'
    },
    linkedInMetrics:{
        highestEngagementUpdatesLinkedIn:'highestEngagementUpdatesLinkedIn'
    },
    vimeoMetric:{
        highEngagement:'highengagement'
    },
    facebookSite:{
        site:'https://graph.facebook.com/'
    },
    instagramStaticVariables:{
        user:'user',
        likes:'likes',
        comments:'comments',
        count:'count',
    },
    mailChimpQueryVariables:{
        lists:'lists',
        listQuery:'.api.mailchimp.com/3.0/lists/',
        campaignQuery:'.api.mailchimp.com/3.0/campaigns/',
        stats:'stats',
        campaign:'campaign',
        emailSend:'emailSend',
    },
    aweberStatic:{
        aweberMainList:'mainlists',
    }

};

