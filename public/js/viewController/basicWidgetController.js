showMetricApp.controller('BasicWidgetController', BasicWidgetController)

function BasicWidgetController($scope, $http, $state, $rootScope, $window, $stateParams, generateChartColours) {
    $scope.objectList = {};
    $scope.referenceWidgetsList = [];
    $scope.profileList = {};
    $scope.objectTypeList={};
    $scope.tokenExpired = false;
    $scope.channelList;
    $scope.currentView = 'step_one';
    $scope.weburl='';
    $scope.mozObjectDetails={};
    $scope.selectEnable=false;
    $scope.campaignEnable=false;
    $scope.adSetEnable=false;
    $scope.adSetAdsEnable=false;
    $scope.campaignChosen=false;
    $scope.adSetChosen=false;
    $scope.adSetAdsChosen=false;
    $scope.googleCampaignEnable = false;
    $scope.adEnable = false;
    $scope.groupEnable = false;
    $scope.googleCampaignChosen = false;
    $scope.groupChosen = false;
    $scope.adChosen = false;
    $scope.refreshButtonLoading;
    var widgetType = 'basic';
    var storedProfile = {};
    var getChannelName = "";
    var getCustomWidgetObj = {};
    var getCustomWidgetId = "";
    var isSelectedMetric = "";
    var referenceWidgetsData = {};
    var getReferenceWidgetsArr = new Array();
    var storeChosenObject = [];
    var profileListBeforeAddition = {};
    $scope.profileOptionsModel={};

    $scope.changeViewsInBasicWidget = function (obj) {
        $scope.currentView = obj;
        $rootScope.currentModalView = obj;
        if ($scope.currentView === 'step_one') {
            document.getElementById('basicWidgetBackButton1').disabled = true;
            document.getElementById('basicWidgetNextButton').disabled = true;
            $scope.listChannels();
            $scope.clearReferenceWidget();
            getReferenceWidgetsArr = [];
            storeChosenObject = [];
            $scope.profileList = {};
            $scope.objectTypeList={};
            $scope.canManageClients = null;
        }
        else if ($scope.currentView === 'step_two') {
            document.getElementById('basicWidgetBackButton1').disabled = false;
            $scope.clearReferenceWidget();
            $scope.profileList = [];
            if (getChannelName == "CustomData") {
                $scope.storeCustomData();
                $("#basicWidgetNextButton").hide();
                $("#basicWidgetFinishButtonCustom").show();
            }
            else {
                storeChosenObject = [];
                document.getElementById('basicWidgetFinishButton').disabled = true;
                $scope.getReferenceWidgetsForChosenChannel();
                $scope.getProfilesForDropdown();
                $("#basicWidgetNextButton").show();
                $("#basicWidgetFinishButtonCustom").hide();
            }
        }
        else if ($scope.currentView === 'step_three') {
            document.getElementById('basicWidgetBackButton1').disabled = false;
            document.getElementById('basicWidgetFinishButton').disabled = true;
            $scope.getProfilesForDropdown();
            if ($scope.storedChannelName=='FacebookAds'){
                $scope.selectedObjectType = null;
                $scope.selectedLevel = null;
                $scope.selectedId = null;
                $scope.campaignChosen = false;
                $scope.adSetChosen = false;
                $scope.adSetAdsChosen = false;
                $scope.campaignEnable = false;
                $scope.adSetEnable = false;
                $scope.adSetAdsEnable = false;
                $scope.campaign = null;
                $scope.adSet = null;
                $scope.adSetAds = null;
            }
        }
    };

    $scope.mozobject=function(url){
        $scope.weburl=url;

        if($scope.weburl!=''&& $scope.weburl!=null)
            document.getElementById('basicWidgetFinishButton').disabled = false;
        else
            document.getElementById('basicWidgetFinishButton').disabled =true;
    };

    $scope.listChannels = function () {
        $http({
            method: 'GET',
            url: '/api/v1/get/channels'
        }).then(
            function successCallback(response) {
                $scope.channelList = response.data;
            },
            function errorCallback(error) {
                swal({
                    title: "",
                    text: "<span style='sweetAlertFont'>Something went wrong! Please reopen widgets link</span> .",
                    html: true
                });
            }
        );
    };

    $scope.getReferenceWidgetsForChosenChannel = function () {
        $http({
            method: 'GET',
            url: '/api/v1/get/referenceWidgets/' + widgetType
        }).then(
            function successCallback(response) {
                for (var i = 0; i < response.data.referenceWidgets.length; i++) {
                    if (response.data.referenceWidgets[i].charts[0].channelId === $scope.storedChannelId) {
                        var IsAlreadyExist = 0;
                        for (var getData in getReferenceWidgetsArr) {
                            if (getReferenceWidgetsArr[getData]._id == response.data.referenceWidgets[i]._id) {
                                isSelectedMetric = 1;
                                referenceWidgetsData = {
                                    '_id': response.data.referenceWidgets[i]._id,
                                    'charts': response.data.referenceWidgets[i].charts,
                                    'created': response.data.referenceWidgets[i].created,
                                    'description': response.data.referenceWidgets[i].description,
                                    'maxSize': response.data.referenceWidgets[i].maxSize,
                                    'minSize': response.data.referenceWidgets[i].minSize,
                                    'name': response.data.referenceWidgets[i].name,
                                    'size': response.data.referenceWidgets[i].size,
                                    'updated': response.data.referenceWidgets[i].updated,
                                    'widgetType': response.data.referenceWidgets[i].widgetType,
                                    'isAlert': response.data.referenceWidgets[i].isAlert,
                                    'isSelectedMetric': isSelectedMetric,
                                    'border': '2px solid #04509B'
                                };
                                IsAlreadyExist = 1;
                            }
                        }

                        if (IsAlreadyExist != 1) {
                            isSelectedMetric = 0;
                            referenceWidgetsData = {
                                '_id': response.data.referenceWidgets[i]._id,
                                'charts': response.data.referenceWidgets[i].charts,
                                'created': response.data.referenceWidgets[i].created,
                                'description': response.data.referenceWidgets[i].description,
                                'maxSize': response.data.referenceWidgets[i].maxSize,
                                'minSize': response.data.referenceWidgets[i].minSize,
                                'name': response.data.referenceWidgets[i].name,
                                'size': response.data.referenceWidgets[i].size,
                                'updated': response.data.referenceWidgets[i].updated,
                                'widgetType': response.data.referenceWidgets[i].widgetType,
                                'isAlert': response.data.referenceWidgets[i].isAlert,
                                'isSelectedMetric': isSelectedMetric,
                                'border': '2px solid #e7eaec'
                            };
                            document.getElementById('basicWidgetNextButton').disabled = false;
                        }

                        if (getReferenceWidgetsArr == "" || getReferenceWidgetsArr == "[]" || getReferenceWidgetsArr == null)
                            document.getElementById('basicWidgetNextButton').disabled = true;

                        $scope.referenceWidgetsList.push(referenceWidgetsData);
                    }
                }
            },
            function errorCallback(error) {
                swal({
                    title: "",
                    text: "<span style='sweetAlertFont'>Something went wrong! Please reopen widgets link</span> .",
                    html: true
                });
            }
        );
    };

    $scope.getProfilesForDropdown = function () {
        document.getElementById('basicWidgetFinishButton').disabled = true;
        $http({
            method: 'GET', url: '/api/v1/get/profiles/' + $scope.storedChannelId
        }).then(
            function successCallback(response) {
                $scope.profileList = response.data.profileList;
                if($scope.profileList !=undefined) {
                    $scope.profileOptionsModel = $scope.profileList[0];
                    $scope.getObjectsForChosenProfile();
                }
                $scope.objectList = [];
                $scope.facebookObjectList = [];
                $scope.googleAnalyticsObjectList = [];
                $scope.facebookAdsObjectList = [];
                $scope.googleAdwordsObjectList = [];
                $scope.mailchimpObjectList = [];
                $scope.aweberObjectList = [];
                $scope.linkedInObjectList = [];
                $scope.youtubeObjectList = [];
                $scope.vimeoObjectList = [];
                $scope.twitterObjectList=[];
                $scope.instagramObjectList=[];
                $scope.pinterestObjectList=[];

            },
            function errorCallback(error) {
                swal({
                    title: "",
                    text: "<span style='sweetAlertFont'>Something went wrong! Please reopen widgets link</span> .",
                    html: true
                });
            }
        );
    };

    $scope.selectLevelChosen = function (level) {
        if(level) {
            if(!this.objectTypeOptionsModel){
                document.getElementById('basicWidgetFinishButton').disabled = true;
                $scope.campaignChosen = false;
                $scope.adSetChosen = false;
                $scope.adSetAdsChosen = false;
                $scope.campaignEnable = false;
                $scope.adSetEnable = false;
                $scope.adSetAdsEnable = false;
                $scope.campaign = null;
                $scope.adSet = null;
                $scope.adSetAds = null;
                $scope.selectedObjectType = this.objectTypeOptionsModel;
                $scope.selectedLevel =null;
                $scope.selectedId = null;
            }
            else{
                document.getElementById('basicWidgetFinishButton').disabled = true;
                $scope.campaignChosen = false;
                $scope.adSetChosen = false;
                $scope.adSetAdsChosen = false;
                $scope.campaignEnable = false;
                $scope.adSetEnable = false;
                $scope.adSetAdsEnable = false;
                $scope.campaign = null;
                $scope.adSet = null;
                $scope.adSetAds = null;
                $scope.selectedObjectType = this.objectTypeOptionsModel;
                $scope.selectedLevel = this.objectTypeOptionsModel.type;
                $scope.selectedId = this.objectTypeOptionsModel._id;
            }
        }
        //   else
        if($scope.selectedLevel=='fbadaccount'){
            if(($scope.profileId!=null)&&($scope.accountId!=null))
                document.getElementById('basicWidgetFinishButton').disabled =false;
            else
                document.getElementById('basicWidgetFinishButton').disabled = true;
        }
        else if($scope.selectedLevel=='fbAdcampaign'){
            if($scope.campaignChosen==false){
                document.getElementById('basicWidgetFinishButton').disabled =true;
                $scope.campaignEnable=true;
                $scope.getCampaigns();
            }
            else {
                if(($scope.profileId!=null)&&($scope.accountId!=null)&&($scope.campaign!=null))
                    document.getElementById('basicWidgetFinishButton').disabled =false;
                else{
                    //  $scope.clearSelectLevel();
                    document.getElementById('basicWidgetFinishButton').disabled =true;
                }
            }
        }
        else if($scope.selectedLevel=='fbAdSet'){
            if(($scope.campaignChosen==true)&&($scope.adSetChosen==true)){
                if(($scope.profileId!=null)&&($scope.accountId!=null)&&($scope.campaign!=null)&&($scope.adSet!=null))
                    document.getElementById('basicWidgetFinishButton').disabled =false;
                else {
                    //   $scope.clearSelectLevel();
                    document.getElementById('basicWidgetFinishButton').disabled = true;
                }
            }
            else if(($scope.campaignChosen==false)&&($scope.adSetChosen==false)){
                $scope.campaignEnable=true;
                $scope.getCampaigns();
            }
            else if(($scope.campaignChosen==true)&&($scope.adSetChosen==false)){
                $scope.campaignEnable=true;
                $scope.adSetEnable=true;
                $scope.getAdSet();
                document.getElementById('basicWidgetFinishButton').disabled = true;
            }
            else
                document.getElementById('basicWidgetFinishButton').disabled = true;
            //  $scope.clearSelectLevel();
        }
        else if($scope.selectedLevel=='fbAdSetAds'){
            if(($scope.campaignChosen==true)&&($scope.adSetChosen==true)&&($scope.adSetAdsChosen==true)){
                if(($scope.profileId!=null)&&($scope.accountId!=null)&&($scope.campaign!=null)&&($scope.adSet!=null)&&($scope.adSetAds!=null))
                    document.getElementById('basicWidgetFinishButton').disabled =false;
                else {
                    //  $scope.clearSelectLevel();
                    document.getElementById('basicWidgetFinishButton').disabled = true;
                }
            }
            else if((($scope.campaignChosen==false)&&($scope.adSetChosen==false))&&($scope.adSetAdsChosen==true)){
                document.getElementById('basicWidgetFinishButton').disabled = true;
                $scope.campaignEnable=true;
                $scope.getCampaigns();
                $scope.adSetAdsChosen=false;
                $scope.adSetAds=null;
            }
            else if(($scope.campaignChosen==true)&&($scope.adSetChosen==true)&&($scope.adSetAdsChosen==false)){
                document.getElementById('basicWidgetFinishButton').disabled = true;
                $scope.adSetAdsEnable=true;
                $scope.getAdSetAds();
            }
            else if(($scope.campaignChosen==false)&&($scope.adSetChosen==false)&&($scope.adSetAdsChosen==false)){
                document.getElementById('basicWidgetFinishButton').disabled = true;
                $scope.campaignEnable=true;
                $scope.getCampaigns();
            }
            else if(($scope.campaignChosen==true)&&($scope.adSetChosen==false)&&($scope.adSetAdsChosen==false)){
                document.getElementById('basicWidgetFinishButton').disabled = true;
                $scope.adSetEnable=true;
                $scope.getAdSet();
            }
            else if(($scope.campaignChosen==true)&&($scope.adSetChosen==false)&&($scope.adSetAdsChosen==true)){
                document.getElementById('basicWidgetFinishButton').disabled = true;
                $scope.adSetEnable=true;
                $scope.getAdSet();
                $scope.adSetAdsChosen=false;
                $scope.adSetAds=null;
            }
            else if(($scope.campaignChosen==false)&&($scope.adSetChosen==true)&&($scope.adSetAdsChosen==true)){
                document.getElementById('basicWidgetFinishButton').disabled = true;
                $scope.campaignEnable=true;
                $scope.getCampaigns();
                $scope.adSetAdsChosen=false;
                $scope.adSetAds=null;
                $scope.adSetChosen=false;
                $scope.adSet=null;
            }
            else if(($scope.campaignChosen==false)&&($scope.adSetChosen==true)&&($scope.adSetAdsChosen==false)){
                document.getElementById('basicWidgetFinishButton').disabled = true;
                $scope.campaignEnable=true;
                $scope.getCampaigns();
                $scope.adSetAdsChosen=false;
                $scope.adSetAds=null;
                $scope.adSetChosen=false;
                $scope.adSet=null;
            }
        }
    };

    $scope.fbAdsCheck=function(level){
        var value=0;
        document.getElementById('basicWidgetFinishButton').disabled = true;
        if(level=='campaign'){
            $scope.adSet=null;
            $scope.adSetChosen=false;
            $scope.adSetAds=null;
            $scope.adSetAdsChosen=false;
            $scope.adSetEnable=false;
            $scope.adSetAdsEnable=false;
            $scope.campaign=this.campaignOptionsModel;
            if($scope.campaign)
                $scope.campaignChosen = true;
            else
                $scope.campaignChosen=false;
            value=1;
        }
        else if(level=='adset'){
            $scope.adSetAds=null;
            $scope.adSetAdsChosen=false;
            $scope.adSetAdsEnable=false;
            $scope.adSet=this.adSetOptionsModel;
            if($scope.adSet)
                $scope.adSetChosen=true;
            else
                $scope.adSetChosen=false;
            value=1;
        }
        else if(typeof(level=='adsetads')){
            $scope.adSetAds=this.adSetAdsOptionsModel;
            if($scope.adSetAds)
                $scope.adSetAdsChosen=true;
            else
                $scope.adSetAdsChosen=false;
            value=1;
        }
        if(value==1)
            $scope.selectLevelChosen();
    };

    // $scope.clearSelectLevel=function(){
    //
    //     if($scope.profileId==$scope.profileOptionsModel._id){
    //
    //         $scope.selectedLevel=null;
    //         document.getElementById('basicWidgetFinishButton').disabled = true;
    //         $scope.campaignEnable=false;
    //         $scope.adSetAdsEnable=false;
    //         $scope.adSetEnable=false;
    //         $scope.campaign=null;
    //         $scope.adSetAds=null;
    //         $scope.adSet=null;
    //         $scope.campaignChosen=false;
    //         $scope.adSetChosen=false;
    //         $scope.adSetAdsChosen=false;
    //     }
    //     else {
    //         $scope.profileId=$scope.profileOptionsModel._id;
    //
    //         $scope.selectedLevel=null;
    //         document.getElementById('basicWidgetFinishButton').disabled = true;
    //         $scope.campaignEnable=false;
    //         $scope.adSetAdsEnable=false;
    //         $scope.adSetEnable=false;
    //         $scope.campaign=null;
    //         $scope.adSetAds=null;
    //         $scope.adSet=null;
    //         $scope.campaignChosen=false;
    //         $scope.adSetChosen=false;
    //         $scope.adSetAdsChosen=false;
    //         $scope.getObjectsForChosenProfile();
    //     }
    //     $scope.selectLevelChosen();
    // };

    $scope.getCampaigns=function(){
        var objectTypeId = $scope.selectedId;
        var accountId = $scope.accountId
        var profileId = $scope.profileId;
        $http({
            method: 'GET',
            url: '/api/v1/get/objects/' + profileId + '?objectTypeId=' + objectTypeId + '&accountId=' + accountId
        }).then(
            function successCallback(response) {
                $scope.campaignList = response.data.objectList;
                $scope.campaignOptionsModel = $scope.campaignList;
            },
            function errorCallback(error) {
                swal({
                    title: "",
                    text: "<span style='sweetAlertFont'>Something went wrong! Please reopen widgets link</span> .",
                    html: true
                });
            }
        )
    };

    $scope.getAdSet=function(){
        var objectTypeId = $scope.selectedId;
        var campaignId = $scope.campaign.channelObjectId;
        var profileId = $scope.profileId;
        $http({
            method: 'GET',
            url: '/api/v1/get/objects/' + profileId + '?objectTypeId=' + objectTypeId + '&campaignId=' + campaignId
        }).then(
            function successCallback(response) {
                $scope.adSetList = response.data.objectList;
                $scope.adSetOptionsModel = $scope.adSetList;
            },
            function errorCallback(error) {
                swal({
                    title: "",
                    text: "<span style='sweetAlertFont'>Something went wrong! Please reopen widgets link</span> .",
                    html: true
                });
            }
        )
    };

    $scope.getAdSetAds=function() {
        var objectTypeId = $scope.selectedId;
        var adSetId = $scope.adSet.channelObjectId;
        var profileId = $scope.profileId;
        $http({
            method: 'GET',
            url: '/api/v1/get/objects/' + profileId + '?objectTypeId=' + objectTypeId + '&adSetId=' + adSetId
        }).then(
            function successCallback(response) {
                $scope.adSetAdsList = response.data.objectList;
                $scope.adSetAdsOptionsModel = $scope.adSetAdsList;
            },
            function errorCallback(error) {
                swal({
                    title: "",
                    text: "<span style='sweetAlertFont'>Something went wrong! Please reopen widgets link</span> .",
                    html: true
                });
            }
        )
    };

    $scope.refreshAdCampaign=function(level){
        $scope.refreshAdCampaignLoading=true;
        var objectTypeId = level;
        var accountId = $scope.accountId;
        var profileId = $scope.profileId;
        $http({
            method: 'GET',
            url: '/api/v1/channel/profiles/objectsList/' + profileId + '?objectType=' + objectTypeId + '&accountId=' + accountId
        }).then(
            function successCallback(response) {
                $scope.campaignList = response.data;
                $scope.campaignOptionsModel = $scope.campaignList;
                $scope.refreshAdCampaignLoading=false;
            },
            function errorCallback(error) {
                $scope.refreshAdCampaignLoading=false;
                if(error.status === 401){
                    if(error.data.errorstatusCode === 1003){
                        swal({
                            title: "",
                            text: "<span style='sweetAlertFont'>Please refersh your profile!</span>",
                            html: true
                        });
                        $scope.tokenExpired=true;
                    }
                } else
                swal({
                    title: "",
                    text: "<span style='sweetAlertFont'>Something went wrong! Please reopen widgets link</span> .",
                    html: true
                });
            }
        )
    };

    $scope.refreshAdSet=function(level){
        $scope.refreshAdSetLoading=true;
        var objectTypeId = level;
        var accountId = $scope.campaign.channelObjectId;
        var profileId = $scope.profileId;
        $http({
            method: 'GET',
            url: '/api/v1/channel/profiles/objectsList/' + profileId + '?objectType=' + objectTypeId + '&campaignId=' + accountId
        }).then(
            function successCallback(response) {
                $scope.adSetList = response.data;
                $scope.adSetOptionsModel = $scope.adSetList;
                $scope.refreshAdSetLoading=false;
            },
            function errorCallback(error) {
                $scope.refreshAdSetLoading=false;
                if(error.status === 401){
                    if(error.data.errorstatusCode === 1003){
                        swal({
                            title: "",
                            text: "<span style='sweetAlertFont'>Please refersh your profile!</span>",
                            html: true
                        });
                        $scope.tokenExpired=true;
                    }
                } else
                    swal({
                        title: "",
                        text: "<span style='sweetAlertFont'>Something went wrong! Please reopen widgets link</span> .",
                        html: true
                    });
            }
        )
    };

    $scope.refreshAdSetAds = function (level) {
        $scope.refreshAdSetAdsLoading=true;
        var objectTypeId = level;
        var accountId = $scope.adSet.channelObjectId;
        var profileId = $scope.profileId;
        $http({
            method: 'GET',
            url: '/api/v1/channel/profiles/objectsList/' + profileId + '?objectType=' + objectTypeId + '&adSetId=' + accountId
        }).then(
            function successCallback(response) {

                $scope.adSetAdsList = response.data;
                $scope.adSetAdsOptionsModel = $scope.adSetAdsList;
                $scope.refreshAdSetAdsLoading=false;
            },
            function errorCallback(error) {
                $scope.refreshAdSetAdsLoading=false;
                if(error.status === 401){
                    if(error.data.errorstatusCode === 1003){
                        swal({
                            title: "",
                            text: "<span style='sweetAlertFont'>Please refersh your profile!</span>",
                            html: true
                        });
                        $scope.tokenExpired=true;
                    }
                } else
                    swal({
                        title: "",
                        text: "<span style='sweetAlertFont'>Something went wrong! Please reopen widgets link</span> .",
                        html: true
                    });
            }
        )
    };

    $scope.googleSelectLevelChosen = function (level) {
        if(level) {
            if(this.objectTypeOptionsModel) {
                document.getElementById('basicWidgetFinishButton').disabled = true;
                $scope.selectedGoogleObjectType =null;
                $scope.selectedGoogleLevel = null;
                $scope.selectedGoogleId = null;
                $scope.googleCampaignChosen = false;
                $scope.adChosen = false;
                $scope.groupChosen = false;
                $scope.googleCampaignEnable = false;
                $scope.adEnable = false;
                $scope.groupEnable = false;
                $scope.googleCampaign = null;
                $scope.googleAd = null;
                $scope.googleGroup = null;
                $scope.selectedGoogleObjectType = this.objectTypeOptionsModel;
                $scope.selectedGoogleLevel = this.objectTypeOptionsModel.type;
                $scope.selectedGoogleId = this.objectTypeOptionsModel._id;
            }
            else{
                document.getElementById('basicWidgetFinishButton').disabled = true;
                $scope.selectedGoogleObjectType =null;
                $scope.selectedGoogleLevel = null;
                $scope.selectedGoogleId = null;
                $scope.googleCampaignChosen = false;
                $scope.adChosen = false;
                $scope.groupChosen = false;
                $scope.googleCampaignEnable = false;
                $scope.adEnable = false;
                $scope.groupEnable = false;
                $scope.googleCampaign = null;
                $scope.googleAd = null;
                $scope.googleGroup = null;
                $scope.selectedGoogleObjectType = this.objectTypeOptionsModel;
                $scope.selectedGoogleLevel = null;
                $scope.selectedGoogleId = null;
            }
        }
        if($scope.selectedGoogleLevel=='adwordaccount'){
            if(($scope.profileOptionsModel!=null)&&($scope.googleAccountId!=null))
                document.getElementById('basicWidgetFinishButton').disabled =false;
            else
                document.getElementById('basicWidgetFinishButton').disabled = true;
        }
        else if($scope.selectedGoogleLevel=='adwordCampaign'){
            if($scope.googleCampaignChosen==false){
                document.getElementById('basicWidgetFinishButton').disabled =true;
                $scope.googleCampaignEnable=true;
                $scope.getGoogleCampaigns();
            }
            else{
                if(($scope.googleProfileId!=null)&&($scope.googleAccountId!=null)&&($scope.googleCampaign!=null))
                    document.getElementById('basicWidgetFinishButton').disabled =false;
                else{
                    //  $scope.clearGoogleSelectLevel();
                    document.getElementById('basicWidgetFinishButton').disabled =true;
                }
            }
        }
        else if($scope.selectedGoogleLevel=='adwordAdgroup'){
            if(($scope.googleCampaignChosen==true)&&($scope.groupChosen==true)){
                if(($scope.profileOptionsModel!=null)&&($scope.googleAccountId!=null)&&($scope.googleCampaign!=null)&&($scope.googleGroup!=null))
                    document.getElementById('basicWidgetFinishButton').disabled =false;
                else {
                    //  $scope.clearGoogleSelectLevel();
                    document.getElementById('basicWidgetFinishButton').disabled = true;
                }
            }
            else if(($scope.googleCampaignChosen==false)&&($scope.groupChosen==false)){
                $scope.googleCampaignEnable=true;
                $scope.getGoogleCampaigns();
            }
            else if(($scope.googleCampaignChosen==true)&&($scope.groupChosen==false)){
                $scope.googleCampaignEnable=true;
                $scope.groupEnable=true;
                $scope.getGoogleGroup();
                document.getElementById('basicWidgetFinishButton').disabled = true;
            }
            else
                document.getElementById('basicWidgetFinishButton').disabled = true;
            //  $scope.clearGoogleSelectLevel();
        }
        else if($scope.selectedGoogleLevel=='adwordsAd'){
            if(($scope.googleCampaignChosen==true)&&($scope.groupChosen==true)&&($scope.adChosen==true)){
                if(($scope.profileOptionsModel!=null)&&($scope.googleAccountId!=null)&&($scope.googleCampaign!=null)&&($scope.googleGroup!=null)&&($scope.googleAd!=null))
                    document.getElementById('basicWidgetFinishButton').disabled =false;
                else {
                    //  $scope.clearGoogleSelectLevel();
                    document.getElementById('basicWidgetFinishButton').disabled = true;
                }
            }
            else if((($scope.googleCampaignChosen==false)&&($scope.groupChosen==false))&&($scope.adChosen==true)){
                document.getElementById('basicWidgetFinishButton').disabled = true;
                $scope.googleCampaignEnable=true;
                $scope.getGoogleCampaigns();
                $scope.adChosen=false;
                $scope.googleAd=null;
            }
            else if(($scope.googleCampaignChosen==true)&&($scope.groupChosen==true)&&($scope.adChosen==false)){
                document.getElementById('basicWidgetFinishButton').disabled = true;
                $scope.adEnable=true;
                $scope.getGoogleAd();
            }
            else if(($scope.googleCampaignChosen==false)&&($scope.groupChosen==false)&&($scope.adChosen==false)){
                document.getElementById('basicWidgetFinishButton').disabled = true;
                $scope.googleCampaignEnable=true;
                $scope.getGoogleCampaigns();
            }
            else if(($scope.googleCampaignChosen==true)&&($scope.groupChosen==false)&&($scope.adChosen==false)){
                document.getElementById('basicWidgetFinishButton').disabled = true;
                $scope.groupEnable=true;
                $scope.getGoogleGroup();
            }
            else if(($scope.googleCampaignChosen==true)&&($scope.groupChosen==false)&&($scope.adChosen==true)){
                document.getElementById('basicWidgetFinishButton').disabled = true;
                $scope.groupEnable=true;
                $scope.getGoogleGroup();
                $scope.adChosen=false;
                $scope.googleAd=null;
            }
            else if(($scope.googleCampaignChosen==false)&&($scope.groupChosen==true)&&($scope.adChosen==true)){
                document.getElementById('basicWidgetFinishButton').disabled = true;
                $scope.googleCampaignEnable=true;
                $scope.getGoogleCampaigns();
                $scope.adChosen=false;
                $scope.googleAd=null;
                $scope.groupChosen=false;
                $scope.googleGroup=null;
            }
            else if(($scope.googleCampaignChosen==false)&&($scope.groupChosen==true)&&($scope.adChosen==false)){
                document.getElementById('basicWidgetFinishButton').disabled = true;
                $scope.googleCampaignEnable=true;
                $scope.getGoogleCampaigns();
                $scope.adChosen=false;
                $scope.googleAds=null;
                $scope.groupChosen=false;
                $scope.googleGroup=null;
            }
        }
    };

    $scope.googleAdsCheck=function(level){
        var value=0;
        document.getElementById('basicWidgetFinishButton').disabled = true;
        if(level=='campaign'){
            $scope.googleGroup=null;
            $scope.groupChosen=false;
            $scope.googleAd=null;
            $scope.adChosen=false;
            $scope.adEnable=false;
            $scope.groupEnable=false;
            $scope.googleCampaign=this.googleCampaignOptionsModel;
            if($scope.googleCampaign)
                $scope.googleCampaignChosen = true;
            else
                $scope.googleCampaignChosen=false;
            value=1;
        }
        else if(level=='group'){
            $scope.googleAd=null;
            $scope.adChosen=false;
            $scope.adEnable=false;
            $scope.googleGroup=this.groupOptionsModel;
            if($scope.googleGroup)
                $scope.groupChosen=true;
            else
                $scope.groupChosen=false;
            value=1;
        }
        else if(typeof(level=='ads')){
            $scope.googleAd=this.adOptionsModel;
            if($scope.googleAd)
                $scope.adChosen=true;
            else
                $scope.adChosen=false;
            value=1;
        }
        if(value==1)
            $scope.googleSelectLevelChosen();
    };

    $scope.getGoogleCampaigns=function(){
        var objectTypeId = $scope.selectedGoogleId;
        var accountId = $scope.googleAccountId;
        var profileId = $scope.googleProfileId;
        $http({
            method: 'GET',
            url: '/api/v1/get/objects/' + profileId + '?objectTypeId=' + objectTypeId + '&accountId=' + accountId
        }).then(
            function successCallback(response) {
                $scope.googleCampaignList = response.data.objectList;
                $scope.googleCampaignOptionsModel = $scope.googleCampaignList;
            },
            function errorCallback(error) {
                swal({
                    title: "",
                    text: "<span style='sweetAlertFont'>Something went wrong! Please reopen widgets link</span> .",
                    html: true
                });
            }
        )
    };

    $scope.getGoogleGroup=function(){
        var objectTypeId = $scope.selectedGoogleId;
        var campaignId = $scope.googleCampaign.channelObjectId;
        var profileId = $scope.googleProfileId;
        var accountId= $scope.googleAccountId;
        var url='';
        if($scope.canManageClients==true)
            url='/api/v1/get/objects/' + profileId + '?objectTypeId=' + objectTypeId + '&campaignId=' + campaignId+'&accountId='+accountId;
        else
            url='/api/v1/get/objects/' + profileId + '?objectTypeId=' + objectTypeId + '&campaignId=' + campaignId+'&accountId='+accountId;
        $http({
            method: 'GET',
            url: url
        }).then(
            function successCallback(response) {
                $scope.groupList = response.data.objectList;
                $scope.groupOptionsModel = $scope.groupList;
            },
            function errorCallback(error) {
                swal({
                    title: "",
                    text: "<span style='sweetAlertFont'>Something went wrong! Please reopen widgets link</span> .",
                    html: true
                });
            }
        )
    };

    $scope.getGoogleAd=function() {
        var objectTypeId = $scope.selectedGoogleId;
        var adSetId = $scope.googleGroup.channelObjectId;
        var profileId = $scope.googleProfileId;
        var accountId= $scope.googleAccountId;
        var url='';
        if($scope.canManageClients==true)
            url='/api/v1/get/objects/' + profileId + '?objectTypeId=' + objectTypeId + '&adSetId=' + adSetId +'&accountId='+accountId;
        else
            url='/api/v1/get/objects/' + profileId + '?objectTypeId=' + objectTypeId + '&adSetId=' + adSetId +'&accountId='+accountId;
        $http({
            method: 'GET',
            url: url
        }).then(
            function successCallback(response) {
                $scope.adList = response.data.objectList;
                $scope.adOptionsModel = $scope.adList;
            },
            function errorCallback(error) {
                swal({
                    title: "",
                    text: "<span style='sweetAlertFont'>Something went wrong! Please reopen widgets link</span> .",
                    html: true
                });
            }
        )
    };

    $scope.refreshGoogleCampaign = function (level) {
        $scope.refreshGoogleCampaignLoading=true;
        var objectTypeId = level;
        var accountId = $scope.googleAccountId;
        var profileId = $scope.googleProfileId;
        $http({
            method: 'GET',
            url: '/api/v1/channel/profiles/objectsList/' + profileId + '?objectType=' + objectTypeId + '&accountId=' + accountId
        }).then(
            function successCallback(response) {
                $scope.googleCampaignList = response.data;
                $scope.googleCampaignOptionsModel = $scope.googleCampaignList;
                $scope.refreshGoogleCampaignLoading=false;
            },
            function errorCallback(error) {
                $scope.refreshGoogleCampaignLoading=false;
                if(error.status === 401){
                    if(error.data.errorstatusCode === 1003){
                        swal({
                            title: "",
                            text: "<span style='sweetAlertFont'>Please refersh your profile!</span>",
                            html: true
                        });
                        $scope.tokenExpired=true;
                    }
                } else
                    swal({
                        title: "",
                        text: "<span style='sweetAlertFont'>Something went wrong! Please reopen widgets link</span> .",
                        html: true
                    });
            }
        )
    };

    $scope.refreshGroup = function (level) {
        $scope.refreshGroupLoading=true;
        var objectTypeId = level;
        var campaignId = $scope.googleCampaign.channelObjectId;
        var profileId = $scope.googleProfileId;
        var accountId= $scope.googleAccountId;
        var url='';
        if($scope.canManageClients==true)
            url='/api/v1/channel/profiles/objectsList/' + profileId + '?objectType=' + objectTypeId + '&campaignId=' + campaignId +'&accountId='+accountId;
        else
            url='/api/v1/channel/profiles/objectsList/' + profileId + '?objectType=' + objectTypeId + '&campaignId=' + campaignId
        $http({
            method: 'GET',
            url: url
        }).then(
            function successCallback(response) {
                $scope.groupList = response.data;
                $scope.groupOptionsModel = $scope.groupList;
                $scope.refreshGroupLoading=false;
            },
            function errorCallback(error) {
                $scope.refreshGroupLoading=false;
                if(error.status === 401){
                    if(error.data.errorstatusCode === 1003){
                        swal({
                            title: "",
                            text: "<span style='sweetAlertFont'>Please refersh your profile!</span>",
                            html: true
                        });
                        $scope.tokenExpired=true;
                    }
                } else
                    swal({
                        title: "",
                        text: "<span style='sweetAlertFont'>Something went wrong! Please reopen widgets link</span> .",
                        html: true
                    });
            }
        )
    };

    $scope.refreshAd = function (level) {
        $scope.refreshAdLoading=true;
        var objectTypeId = level;
        var adSetId = $scope.googleGroup.channelObjectId;
        var profileId = $scope.googleProfileId;
        var accountId= $scope.googleAccountId;
        var url='';
        if($scope.canManageClients==true)
            url='/api/v1/channel/profiles/objectsList/' + profileId + '?objectType=' + objectTypeId + '&adSetId=' + adSetId +'&accountId='+accountId;
        else
            url='/api/v1/channel/profiles/objectsList/' + profileId + '?objectType=' + objectTypeId + '&adSetId=' + adSetId
        $http({
            method: 'GET',
            url: url
        }).then(
            function successCallback(response) {
                $scope.adList = response.data;
                $scope.adOptionsModel = $scope.adList;
                $scope.refreshAdLoading=false;
            },
            function errorCallback(error) {
                $scope.refreshAdLoading=true;
                if(error.status === 401){
                    if(error.data.errorstatusCode === 1003){
                        swal({
                            title: "",
                            text: "<span style='sweetAlertFont'>Please refersh your profile!</span>",
                            html: true
                        });
                        $scope.tokenExpired=true;
                    }
                } else
                    swal({
                        title: "",
                        text: "<span style='sweetAlertFont'>Something went wrong! Please reopen widgets link</span> .",
                        html: true
                    });
            }
        )
    };

    // $scope.clearGoogleSelectLevel=function(){
    //     if($scope.canManageClients==false) {
    //         var value=0;
    //         if ($scope.googleProfileId != $scope.profileOptionsModel._id) {
    //             $scope.selectedGoogleLevel = null;
    //             document.getElementById('basicWidgetFinishButton').disabled = true;
    //             $scope.googleCampaignEnable = false;
    //             $scope.adEnable = false;
    //             $scope.groupEnable = false;
    //             $scope.googleCampaign = null;
    //             $scope.googleGroup = null;
    //             $scope.googleAd = null;
    //             $scope.googleCampaignChosen = false;
    //             $scope.groupChosen = false;
    //             $scope.adChosen = false;
    //             value=1;
    //         }
    //         if(value==1)
    //         $scope.googleSelectLevelChosen();
    //     }
    //     else{
    //         var value=0;
    //         if ($scope.googleProfileId == $scope.profileOptionsModel._id) {
    //             $scope.selectedGoogleLevel = null;
    //             document.getElementById('basicWidgetFinishButton').disabled = true;
    //             $scope.googleCampaignEnable = false;
    //             $scope.adEnable = false;
    //             $scope.groupEnable = false;
    //             $scope.googleCampaign = null;
    //             $scope.googleGroup = null;
    //             $scope.googleAd = null;
    //             $scope.googleCampaignChosen = false;
    //             $scope.groupChosen = false;
    //             $scope.adChosen = false;
    //             value=1;
    //         }
    //         else
    //         {
    //             $scope.selectedGoogleLevel = null;
    //             document.getElementById('basicWidgetFinishButton').disabled = true;
    //             $scope.googleCampaignEnable = false;
    //             $scope.adEnable = false;
    //             $scope.groupEnable = false;
    //             $scope.googleCampaign = null;
    //             $scope.googleGroup = null;
    //             $scope.googleAd = null;
    //             $scope.googleCampaignChosen = false;
    //             $scope.groupChosen = false;
    //             $scope.adChosen = false;
    //             value=1;
    //         }
    //         if(value==1)
    //             $scope.googleSelectLevelChosen();
    //     }
    // };

    $scope.getObjectsForChosenProfile = function () {
        document.getElementById('basicWidgetFinishButton').disabled = true;
        $scope.checkExpiresIn = null;
        storeChosenObject = [];
        if (!$scope.profileOptionsModel) {
            $scope.facebookObjectList = null;
            $scope.googleAnalyticsObjectList = null;
            $scope.facebookAdsObjectList = null;
            $scope.googleAdwordsObjectList = null;
            $scope.mailchimpObjectList = null;
            $scope.aweberObjectList = null;
            $scope.linkedInObjectList = null;
            $scope.youtubeObjectList = null;
            $scope.vimeoObjectList = null;
            $scope.twitterObjectList=null;
            $scope.instagramObjectList=null;
            $scope.pinterestObjectList=null;
            storeChosenObject = [];
            if ($scope.storedChannelName === 'Twitter' || $scope.storedChannelName === 'Instagram' || $scope.storedChannelName === 'GoogleAdwords')
                for(var items in $scope.uniqueObjectCount)
                    $scope.objectForWidgetChosen([null, null, null,items]);
            if($scope.storedChannelName == 'FacebookAds'){
                $scope.selectedLevel = null;
                document.getElementById('basicWidgetFinishButton').disabled = true;
                $scope.campaignEnable = false;
                $scope.adSetAdsEnable = false;
                $scope.adSetEnable = false;
                $scope.campaign = null;
                $scope.adSetAds = null;
                $scope.adSet = null;
                $scope.campaignChosen = false;
                $scope.adSetChosen = false;
                $scope.adSetAdsChosen = false;
            }
            if(($scope.storedChannelName == 'GoogleAdwords')) {
                $scope.googleCampaignEnable = false;
                $scope.adEnable = false;
                $scope.groupEnable = false;
                $scope.googleCampaign = null;
                $scope.googleGroup = null;
                $scope.googleAd = null;
                $scope.googleCampaignChosen = false;
                $scope.groupChosen = false;
                $scope.adChosen = false;
                $scope.selectEnable = false;
                document.getElementById('basicWidgetFinishButton').disabled = true;

            }
        }
        else {
            storedProfile = $scope.profileOptionsModel;
            if($scope.storedChannelName == 'GoogleAdwords') {
                if ($scope.profileOptionsModel.canManageClients === false)
                    $scope.canManageClients =false;
                else
                    $scope.canManageClients =true;
            }
            if($scope.storedChannelName == 'FacebookAds'){
                document.getElementById('basicWidgetFinishButton').disabled = true;
                if($scope.profileOptionsModel) {
                    $scope.selectedLevel = null;
                    document.getElementById('basicWidgetFinishButton').disabled = true;
                    $scope.campaignEnable = false;
                    $scope.adSetAdsEnable = false;
                    $scope.adSetEnable = false;
                    $scope.campaign = null;
                    $scope.adSetAds = null;
                    $scope.adSet = null;
                    $scope.campaignChosen = false;
                    $scope.adSetChosen = false;
                    $scope.adSetAdsChosen = false;
                    $scope.profileId = storedProfile._id;
                    if ($scope.profileOptionsModel.expiresIn != undefined)
                        $scope.checkExpiresIn = new Date($scope.profileOptionsModel.expiresIn);
                    $scope.tokenExpired = false;
                    var profileId = $scope.profileOptionsModel._id;
                    var expiresIn = $scope.profileOptionsModel.expiresIn;
                    var currentDate = new Date();
                    var newExpiresIn = new Date(expiresIn);
                    if (currentDate <= newExpiresIn && expiresIn != null)
                        $scope.tokenExpired = false;
                    else if (expiresIn === undefined || expiresIn === null)
                        $scope.tokenExpired = false;
                    else
                        $scope.tokenExpired = true;
                    $http({
                        method: 'GET',
                        url: '/api/v1/get/objects/' + profileId
                    }).then(
                        function successCallback(response) {
                            var uniqueObject;
                            var k = 0;
                            var tempList = {};
                            uniqueObject = _.groupBy(response.data.objectList, 'objectTypeId');
                            var sortedUniqueObject = {};
                            for (var objectIds in $scope.uniqueObjectCount) {
                                for (var uniqueObjects in uniqueObject)
                                    if ($scope.uniqueObjectCount[objectIds] == uniqueObjects)
                                        sortedUniqueObject[uniqueObjects] = uniqueObject[uniqueObjects];
                            }
                            for (var items in sortedUniqueObject) {
                                var tempObjectList = [];
                                for (var subItems in sortedUniqueObject[items])
                                    tempObjectList.push(sortedUniqueObject[items][subItems]);
                                var obj = {};
                                obj[k] = tempObjectList;
                                tempList[k] = obj;
                                k++;
                            }
                            $scope.facebookAdsObjectList = tempList;
                        }, function errorCallback(error) {
                            swal({
                                title: "",
                                text: "<span style='sweetAlertFont'>Something went wrong! Please reopen widgets link</span> .",
                                html: true
                            });
                        }
                    );
                }
            }
            else if(($scope.storedChannelName == 'GoogleAdwords')){
                document.getElementById('basicWidgetFinishButton').disabled = true;
                if($scope.profileOptionsModel) {
                    $scope.googleCampaignEnable = false;
                    $scope.adEnable = false;
                    $scope.groupEnable = false;
                    $scope.googleCampaign = null;
                    $scope.googleGroup = null;
                    $scope.googleAd = null;
                    $scope.googleCampaignChosen = false;
                    $scope.groupChosen = false;
                    $scope.adChosen = false;
                    $scope.selectEnable = false;
                    document.getElementById('basicWidgetFinishButton').disabled = true;
                    if ($scope.canManageClients == false) {
                        $scope.googleProfileId = storedProfile._id;
                        if ($scope.profileOptionsModel.expiresIn != undefined)
                            $scope.checkExpiresIn = new Date($scope.profileOptionsModel.expiresIn);
                        $scope.tokenExpired = false;

                        var profileId = $scope.profileOptionsModel._id;
                        var expiresIn = $scope.profileOptionsModel.expiresIn;
                        var currentDate = new Date();
                        var newExpiresIn = new Date(expiresIn);
                        if (currentDate <= newExpiresIn && expiresIn != null)
                            $scope.tokenExpired = false;
                        else if (expiresIn === undefined || expiresIn === null)
                            $scope.tokenExpired = false;
                        else
                            $scope.tokenExpired = true;
                        $http({
                            method: 'GET',
                            url: '/api/v1/get/objects/' + profileId
                        }).then(
                            function successCallback(response) {
                                var uniqueObject;
                                var k = 0;
                                var tempList = {};
                                uniqueObject = _.groupBy(response.data.objectList, 'objectTypeId');
                                var sortedUniqueObject = {};
                                for (var objectIds in $scope.uniqueObjectCount) {
                                    for (var uniqueObjects in uniqueObject)
                                        if ($scope.uniqueObjectCount[objectIds] == uniqueObjects)
                                            sortedUniqueObject[uniqueObjects] = uniqueObject[uniqueObjects];
                                }
                                for (var items in sortedUniqueObject) {
                                    var tempObjectList = [];
                                    for (var subItems in sortedUniqueObject[items])
                                        tempObjectList.push(sortedUniqueObject[items][subItems]);
                                    var obj = {};
                                    obj[k] = tempObjectList;
                                    tempList[k] = obj;
                                    k++;
                                }
                                $scope.googleAdwordsObjectList = tempList;
                                var objectList = $scope.googleAdwordsObjectList;
                                for (var items in $scope.uniqueObjectCount)
                                    $scope.objectForWidgetChosen([objectList[0][0][0].name, objectList[0][0][0]._id, objectList[0][0][0].objectTypeId, items, objectList[0][0][0].channelObjectId]);
                            }, function errorCallback(error) {
                                swal({
                                    title: "",
                                    text: "<span style='sweetAlertFont'>Something went wrong! Please reopen widgets link</span> .",
                                    html: true
                                });
                            }
                        );
                    }
                    else {
                        $scope.googleProfileId = storedProfile._id;
                        if ($scope.profileOptionsModel.expiresIn != undefined)
                            $scope.checkExpiresIn = new Date($scope.profileOptionsModel.expiresIn);
                        $scope.tokenExpired = false;

                        var profileId = $scope.profileOptionsModel._id;
                        var expiresIn = $scope.profileOptionsModel.expiresIn;
                        var currentDate = new Date();
                        var newExpiresIn = new Date(expiresIn);
                        if (currentDate <= newExpiresIn && expiresIn != null)
                            $scope.tokenExpired = false;
                        else if (expiresIn === undefined || expiresIn === null)
                            $scope.tokenExpired = false;
                        else
                            $scope.tokenExpired = true;
                        $http({
                            method: 'GET',
                            url: '/api/v1/get/objects/' + profileId
                        }).then(
                            function successCallback(response) {
                                var uniqueObject;
                                var k = 0;
                                var tempList = {};
                                uniqueObject = _.groupBy(response.data.objectList, 'objectTypeId');
                                var sortedUniqueObject = {};
                                for (var objectIds in $scope.uniqueObjectCount) {
                                    for (var uniqueObjects in uniqueObject)
                                        if ($scope.uniqueObjectCount[objectIds] == uniqueObjects)
                                            sortedUniqueObject[uniqueObjects] = uniqueObject[uniqueObjects];
                                }
                                for (var items in sortedUniqueObject) {
                                    var tempObjectList = [];
                                    for (var subItems in sortedUniqueObject[items])
                                        tempObjectList.push(sortedUniqueObject[items][subItems]);
                                    var obj = {};
                                    obj[k] = tempObjectList;
                                    tempList[k] = obj;
                                    k++;
                                }
                                $scope.googleAdwordsObjectList = tempList;
                            }, function errorCallback(error) {
                                swal({
                                    title: "",
                                    text: "<span style='sweetAlertFont'>Something went wrong! Please reopen widgets link</span> .",
                                    html: true
                                });
                            }
                        );
                    }
                }
            }
            else {
                if ($scope.profileOptionsModel.expiresIn != undefined)
                    $scope.checkExpiresIn = new Date($scope.profileOptionsModel.expiresIn);
                $scope.tokenExpired = false;

                var profileId = $scope.profileOptionsModel._id;
                var expiresIn = $scope.profileOptionsModel.expiresIn;
                var currentDate = new Date();
                var newExpiresIn = new Date(expiresIn);
                if (currentDate <= newExpiresIn && expiresIn != null)
                    $scope.tokenExpired = false;
                else if (expiresIn === undefined || expiresIn === null)
                    $scope.tokenExpired = false;
                else
                    $scope.tokenExpired = true;

                $http({
                    method: 'GET',
                    url: '/api/v1/get/objects/' + profileId
                }).then(
                    function successCallback(response) {
                        var uniqueObject;
                        var k = 0;
                        var tempList = {};

                        if ($scope.storedChannelName != 'Google Analytics') {
                            uniqueObject = _.groupBy(response.data.objectList, 'objectTypeId');
                            var sortedUniqueObject = {};
                            for (var objectIds in $scope.uniqueObjectCount) {
                                for (var uniqueObjects in uniqueObject)
                                    if ($scope.uniqueObjectCount[objectIds] == uniqueObjects)
                                        sortedUniqueObject[uniqueObjects] = uniqueObject[uniqueObjects];
                            }
                            for (var items in sortedUniqueObject) {
                                var tempObjectList = [];
                                for (var subItems in sortedUniqueObject[items])
                                    tempObjectList.push(sortedUniqueObject[items][subItems]);
                                var obj = {};
                                obj[k] = tempObjectList;
                                tempList[k] = obj;
                                k++;
                            }
                            if ($scope.storedChannelName == 'Facebook')
                                $scope.facebookObjectList = tempList;
                            else if ($scope.storedChannelName == 'Mailchimp')
                                $scope.mailchimpObjectList = tempList;
                            else if ($scope.storedChannelName == 'Aweber')
                                $scope.aweberObjectList = tempList;
                            else if ($scope.storedChannelName == 'linkedin')
                                $scope.linkedInObjectList = tempList;
                            else if ($scope.storedChannelName == 'YouTube')
                                $scope.youtubeObjectList = tempList;
                            else if ($scope.storedChannelName == 'Vimeo')
                                $scope.vimeoObjectList = tempList;
                            else if ($scope.storedChannelName == 'Twitter')
                                $scope.twitterObjectList = tempList;
                            else if ($scope.storedChannelName == 'Pinterest')
                                $scope.pinterestObjectList = tempList;
                            else if ($scope.storedChannelName == 'Instagram')
                                $scope.instagramObjectList = tempList;
                        }
                        else {
                            document.getElementById('basicWidgetFinishButton').disabled = true;
                            var uniqueObjectTypeWithIndex = [];
                            uniqueObjectTypeWithIndex[k] = response.data.objectList;
                            $scope.googleAnalyticsObjectList = uniqueObjectTypeWithIndex;
                        }

                        if ($scope.storedChannelName === 'Twitter' || $scope.storedChannelName === 'Pinterest' || $scope.storedChannelName === 'Instagram') {
                            document.getElementById('basicWidgetFinishButton').disabled = true;
                            var objectList;
                            switch ($scope.storedChannelName) {
                                case 'Twitter':
                                    objectList = $scope.twitterObjectList;
                                    break;
                                case 'Instagram':
                                    objectList = $scope.instagramObjectList;
                                    break;
                                case 'Pinterest':
                                    objectList = $scope.pinterestObjectList;
                                    break;
                                default:
                                    objectList = null;
                                    break;
                            }
                            for (var items in $scope.uniqueObjectCount)
                                $scope.objectForWidgetChosen([objectList[0][0][0].name, objectList[0][0][0]._id, objectList[0][0][0].objectTypeId, items]);
                        }
                    },
                    function errorCallback(error) {
                        swal({
                            title: "",
                            text: "<span style='sweetAlertFont'>Something went wrong! Please reopen widgets link</span> .",
                            html: true
                        });
                    }
                );
            }
        }
    };

    $scope.refreshObjectsForChosenProfile = function (objectTypeId) {
        if ($scope.profileOptionsModel._id) {
            $scope.refreshButtonLoading=true;
            var profileId = $scope.profileOptionsModel._id;
            $http({
                method: 'GET',
                url: '/api/v1/get/objectTypeDetail/' + objectTypeId
            }).then(
                function successCallback(response) {
                    var objectTypeName = response.data.objectType.type;
                    $http({
                        method: 'GET',
                        url: '/api/v1/channel/profiles/objectsList/' + profileId + '?objectType=' + objectTypeName
                    }).then(
                        function successCallback(response) {
                            var uniqueObjectTypeWithIndex = [];
                            var uniqueObject;
                            var k=0; var tempList = {};

                            k = $scope.uniqueObjectCount.indexOf(objectTypeId);

                            if($scope.storedChannelName != 'Google Analytics') {
                                uniqueObject = _.groupBy(response.data, 'objectTypeId');
                                for(var items in uniqueObject) {
                                    var tempObjectList = [];
                                    if(items == objectTypeId) {
                                        for(var subItems in uniqueObject[items])
                                            tempObjectList.push(uniqueObject[items][subItems]);
                                        var obj = {};
                                        obj[k] = tempObjectList;
                                        tempList = obj;
                                    }
                                }
                                if ($scope.storedChannelName == 'Facebook')
                                    $scope.facebookObjectList[k] = tempList;
                                else if ($scope.storedChannelName == 'Mailchimp')
                                    $scope.mailchimpObjectList[k] = tempList;
                                else if ($scope.storedChannelName == 'Aweber')
                                    $scope.aweberObjectList[k] = tempList;
                                else if ($scope.storedChannelName == 'linkedin')
                                    $scope.linkedInObjectList[k] = tempList;
                                else if ($scope.storedChannelName == 'YouTube')
                                    $scope.youtubeObjectList[k]= tempList;
                                else if ($scope.storedChannelName == 'Vimeo')
                                    $scope.vimeoObjectList[k] = tempList;
                                else if ($scope.storedChannelName == 'FacebookAds')
                                    $scope.facebookAdsObjectList[k] = tempList;
                                else if ($scope.storedChannelName == 'GoogleAdwords')
                                    $scope.googleAdwordsObjectList[k] = tempList;
                            }
                            else {
                                uniqueObjectTypeWithIndex[k] = response.data;
                                $scope.googleAnalyticsObjectList = uniqueObjectTypeWithIndex;
                            }
                            $scope.refreshButtonLoading=false;
                        },
                        function errorCallback(error) {
                            $scope.refreshButtonLoading=false;
                            if(error.status === 401){
                                if(error.data.errorstatusCode === 1003){
                                    swal({
                                        title: "",
                                        text: "<span style='sweetAlertFont'>Please refersh your profile!</span>",
                                        html: true
                                    });
                                    $scope.tokenExpired=true;
                                }
                            } else
                            swal({
                                title: "",
                                text: "<span style='sweetAlertFont'>Something went wrong! Please reopen widgets link</span> .",
                                html: true
                            });
                        }
                    );
                },
                function errorCallback(error) {
                    $scope.refreshButtonLoading=false;
                    swal({
                        title: "",
                        text: "<span style='sweetAlertFont'>Something went wrong! Please reopen widgets link</span> .",
                        html: true
                    });
                }
            );
        }
    };

    $scope.addNewProfile = function () {
        var url, title;
        profileListBeforeAddition = $scope.profileList;
        function popupwindow(url, title, w, h) {
            switch ($scope.storedChannelName) {
                case 'Facebook':
                    url = '/api/v1/auth/facebook';
                    title = $scope.storedChannelName;
                    break;
                case 'Google Analytics':
                    url = '/api/v1/auth/google';
                    title = $scope.storedChannelName;
                    break;
                case 'FacebookAds':
                    url = '/api/auth/facebookads';
                    title = $scope.storedChannelName;
                    break;
                case 'Twitter':
                    url = '/api/auth/twitter';
                    title = $scope.storedChannelName;
                    break;
                case 'Instagram':
                    url = '/api/auth/instagram';
                    title = $scope.storedChannelName;
                    break;
                case 'GoogleAdwords':
                    url = '/api/auth/adwords';
                    title = $scope.storedChannelName;
                    break;
                case 'YouTube':
                    url = '/api/v1/auth/youTube';
                    title = $scope.storedChannelName;
                    break;
                case 'Mailchimp':
                    url = '/api/auth/mailchimp';
                    title = $scope.storedChannelName;
                    break;
                case 'linkedin':
                    url = '/api/auth/linkedIn';
                    title = $scope.storedChannelName;
                    break;
                case 'Aweber':
                    url = '/api/auth/aweber';
                    title = $scope.storedChannelName;
                    break;
                case 'Vimeo':
                    url = '/api/auth/vimeo';
                    title = $scope.storedChannelName;
                    break;
                case 'Pinterest':
                    url = '/api/auth/pinterest';
                    title = $scope.storedChannelName;
                    break;
            }
            var left = (screen.width / 2) - (w / 2);
            var top = (screen.height / 2) - (h / 2);
            return window.open(url, title, 'toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=no, resizable=no, copyhistory=no, width=' + w + ', height=' + h + ', top=' + top + ', left=' + left);
        }
        popupwindow(url, title, 1000, 500);
    };

    $window.afterAuthentication = function () {
        $scope.getProfilesForDropdown();
    };

    $scope.removeExistingProfile = function () {
        var profileOptionsModel = $scope.profileOptionsModel;
        swal({
                title: "Confirm Profile Delink?",
                text: "All data, widgets associated with this profile will be deleted! Confirm?",
                type: "warning",
                showCancelButton: true,
                confirmButtonColor: "#DD6B55",
                confirmButtonText: "Confirm",
                closeOnConfirm: true
            },
            function () {
                if (profileOptionsModel) {
                    $http({
                        method: 'POST',
                        url: '/api/v1/post/removeProfiles/' + profileOptionsModel._id
                    }).then(
                        function successCallback(response) {
                            $scope.getProfilesForDropdown();
                        },
                        function errorCallback(error) {
                            swal({
                                title: "",
                                text: "<span style='sweetAlertFont'>Something went wrong with Profile delink.Please try again</span> .",
                                html: true
                            });
                        }
                    );
                }
            }
        );
    };

    $scope.createAndFetchBasicWidget = function () {
        var widgetName;
        $(".navbar").css('z-index', '1');
        $(".md-overlay").css("background", "rgba(0,0,0,0.5)");
        if (getChannelName == "CustomData") {
            getCustomWidgetObj = {
                '_id': getCustomWidgetId,
                'widgetType': 'custom',
                "channelName": 'custom'
            };
            // final function after custom api url creation goes here
            $rootScope.$broadcast('populateWidget', getCustomWidgetObj);
        }
        //for moz
        else if(getChannelName == "Moz"){
            var mozData = {
                "channelId": $scope.storedChannelId,
                "mozObject": $scope.weburl,
                "mozObjectTypeId":$scope.uniqueObjectCount[0]
            }
            //creating object for moz
            var httpPromise=$http({
                method: 'POST',
                url: '/api/v1/objects',
                data: mozData
            }).then(
                function successCallback(response) {
                    $scope.mozObjectdetails=response.data.objectList;
                    return $scope.mozObjectdetails;
                },
                function errorCallback(error) {
                    swal({
                        title: "",
                        text: "<span style='sweetAlertFont'>Something went wrong! Please reopen widgets link</span> .",
                        html: true
                    });
                }
            );
            httpPromise.then (
                function (mozObjectDetails) {
                    //creating widget for moz
                    for (var getData in getReferenceWidgetsArr) {
                        var matchingMetric = [];
                        var matchingMetricName = '';
                        var inputParams = [];
                        var widgetColor = generateChartColours.fetchWidgetColor($scope.storedChannelName);

                        for (var i = 0; i < getReferenceWidgetsArr[getData].charts.length; i++) {
                            matchingMetric = [];
                            matchingMetricName = '';

                            for (var j = 0; j < getReferenceWidgetsArr[getData].charts[i].metrics.length; j++) {
                                matchingMetric.push(getReferenceWidgetsArr[getData].charts[i].metrics[j]);
                                matchingMetric[0].objectId = mozObjectDetails[0]._id;
                                matchingMetricName = mozObjectDetails[0].name;
                            }
                            getReferenceWidgetsArr[getData].charts[i].metrics = matchingMetric;
                            getReferenceWidgetsArr[getData].charts[i].objectName = matchingMetricName;
                        }

                        widgetName = getReferenceWidgetsArr[getData].name + ' - ' + matchingMetricName;

                        var jsonData = {
                            "dashboardId": $state.params.id,
                            "widgetType": widgetType,
                            "name": widgetName,
                            "description": getReferenceWidgetsArr[getData].description,
                            "charts": getReferenceWidgetsArr[getData].charts,
                            "order": getReferenceWidgetsArr[getData].order,
                            "offset": getReferenceWidgetsArr[getData].offset,
                            "size": getReferenceWidgetsArr[getData].size,
                            "minSize": getReferenceWidgetsArr[getData].minSize,
                            "maxSize": getReferenceWidgetsArr[getData].maxSize,
                            "color": widgetColor,
                            "visibility": true,
                            "isAlert": getReferenceWidgetsArr[getData].isAlert,
                            "channelName": $scope.storedChannelName
                        };
                        inputParams.push(jsonData);
                        $http({
                            method: 'POST',
                            url: '/api/v1/widgets',
                            data: inputParams
                        }).then(
                            function successCallback(response) {
                                for (var widgetObjects in response.data.widgetsList)
                                    $rootScope.$broadcast('populateWidget', response.data.widgetsList[widgetObjects]);
                            },
                            function errorCallback(error) {
                                $(".navbar").css('z-index', '1');
                                $(".md-overlay").css("background", "rgba(0,0,0,0.5)");
                                $("#somethingWentWrongModalContent").addClass('md-show');
                                $("#somethingWentWrongText").text("Something went wrong! Please try again");
                            }
                        );
                    }
                    getReferenceWidgetsArr = [];
                },
                function errorCallback() {
                    $(".navbar").css('z-index', '1');
                    $(".md-overlay").css("background", "rgba(0,0,0,0.5)");
                    $("#somethingWentWrongModalContent").addClass('md-show');
                    $("#somethingWentWrongText").text("Something went wrong! Please try again");
                }
            );
        }
        else if($scope.storedChannelName == "FacebookAds"){
            // function for saving facebook widgets goes here
            for (var getData in getReferenceWidgetsArr) {
                var matchingMetric = [];
                var matchingMetricName = '';
                var inputParams = [];
                var widgetColor = generateChartColours.fetchWidgetColor($scope.storedChannelName);

                for (var i = 0; i < getReferenceWidgetsArr[getData].charts.length; i++) {
                    matchingMetric = []; matchingMetricName = '';
                    for (var j = 0; j < getReferenceWidgetsArr[getData].charts[i].metrics.length; j++) {
                        matchingMetric.push(getReferenceWidgetsArr[getData].charts[i].metrics[j]);
                        if($scope.selectedLevel=='fbadaccount') {
                            matchingMetric[0].objectTypeId=$scope.selectedObjectType._id;
                            matchingMetric[0].objectId = storeChosenObject[0]._id;
                            matchingMetricName = storeChosenObject[0].name;
                        }
                        else if($scope.selectedLevel=='fbAdcampaign'){
                            matchingMetric[0].objectTypeId=$scope.selectedObjectType._id;
                            matchingMetric[0].objectId = $scope.campaign._id;
                            matchingMetricName = $scope.campaign.name;
                        }
                        else if($scope.selectedLevel=='fbAdSet'){
                            matchingMetric[0].objectTypeId=$scope.selectedObjectType._id;
                            matchingMetric[0].objectId = $scope.adSet._id;
                            matchingMetricName = $scope.adSet.name;
                        }
                        else if($scope.selectedLevel=='fbAdSetAds'){
                            matchingMetric[0].objectTypeId=$scope.selectedObjectType._id;
                            matchingMetric[0].objectId = $scope.adSetAds._id;
                            matchingMetricName = $scope.adSetAds.name;
                        }
                    }
                    getReferenceWidgetsArr[getData].charts[i].metrics = matchingMetric;
                    getReferenceWidgetsArr[getData].charts[i].objectName = matchingMetricName;
                }
                widgetName = getReferenceWidgetsArr[getData].name + ' - ' + matchingMetricName;

                var jsonData = {
                    "dashboardId": $state.params.id,
                    "widgetType": widgetType,
                    "name": widgetName,
                    "description": getReferenceWidgetsArr[getData].description,
                    "charts": getReferenceWidgetsArr[getData].charts,
                    "order": getReferenceWidgetsArr[getData].order,
                    "offset": getReferenceWidgetsArr[getData].offset,
                    "size": getReferenceWidgetsArr[getData].size,
                    "minSize": getReferenceWidgetsArr[getData].minSize,
                    "maxSize": getReferenceWidgetsArr[getData].maxSize,
                    "color": widgetColor,
                    "visibility": true,
                    "isAlert": getReferenceWidgetsArr[getData].isAlert,
                    "channelName": $scope.storedChannelName
                };
                inputParams.push(jsonData);
                $http({
                    method: 'POST',
                    url: '/api/v1/widgets',
                    data: inputParams
                }).then(
                    function successCallback(response) {
                        for (var widgetObjects in response.data.widgetsList) {
                            $rootScope.$broadcast('populateWidget', response.data.widgetsList[widgetObjects]);
                        }
                    },
                    function errorCallback(error) {
                        $(".navbar").css('z-index', '1');
                        $(".md-overlay").css("background", "rgba(0,0,0,0.5)");
                        $("#somethingWentWrongModalContent").addClass('md-show');
                        $("#somethingWentWrongText").text("Something went wrong! Please try again");
                        swal({
                            title: "",
                            text: "<span style='sweetAlertFont'>Something went wrong! Please try again!</span> .",
                            html: true
                        });
                    }
                );
            }
            getReferenceWidgetsArr = [];
        }
        else if($scope.storedChannelName == "GoogleAdwords"){
            // function for saving facebook widgets goes here
            for (var getData in getReferenceWidgetsArr) {
                var matchingMetric = [];
                var matchingMetricName = '';
                var inputParams = [];
                var widgetColor = generateChartColours.fetchWidgetColor($scope.storedChannelName);

                for (var i = 0; i < getReferenceWidgetsArr[getData].charts.length; i++) {
                    matchingMetric = []; matchingMetricName = '';
                    for (var j = 0; j < getReferenceWidgetsArr[getData].charts[i].metrics.length; j++) {
                        matchingMetric.push(getReferenceWidgetsArr[getData].charts[i].metrics[j]);
                        if($scope.selectedGoogleLevel=='adwordaccount') {
                            matchingMetric[0].objectTypeId=$scope.selectedGoogleObjectType._id;
                            matchingMetric[0].objectId = storeChosenObject[0]._id;
                            matchingMetricName = storeChosenObject[0].name;
                        }
                        else if($scope.selectedGoogleLevel=='adwordCampaign'){
                            matchingMetric[0].objectTypeId=$scope.selectedGoogleObjectType._id;
                            matchingMetric[0].objectId = $scope.googleCampaign._id;
                            matchingMetricName = $scope.googleCampaign.name;
                        }
                        else if($scope.selectedGoogleLevel=='adwordAdgroup'){
                            matchingMetric[0].objectTypeId=$scope.selectedGoogleObjectType._id;
                            matchingMetric[0].objectId = $scope.googleGroup._id;
                            matchingMetricName = $scope.googleGroup.name;
                        }
                        else if($scope.selectedGoogleLevel=='adwordsAd'){
                            matchingMetric[0].objectTypeId=$scope.selectedGoogleObjectType._id;
                            matchingMetric[0].objectId = $scope.googleAd._id;
                            matchingMetricName = $scope.googleAd.name;
                        }
                    }
                    getReferenceWidgetsArr[getData].charts[i].metrics = matchingMetric;
                    getReferenceWidgetsArr[getData].charts[i].objectName = matchingMetricName;
                }
                widgetName = getReferenceWidgetsArr[getData].name + ' - ' + matchingMetricName;

                var jsonData = {
                    "dashboardId": $state.params.id,
                    "widgetType": widgetType,
                    "name": widgetName,
                    "description": getReferenceWidgetsArr[getData].description,
                    "charts": getReferenceWidgetsArr[getData].charts,
                    "order": getReferenceWidgetsArr[getData].order,
                    "offset": getReferenceWidgetsArr[getData].offset,
                    "size": getReferenceWidgetsArr[getData].size,
                    "minSize": getReferenceWidgetsArr[getData].minSize,
                    "maxSize": getReferenceWidgetsArr[getData].maxSize,
                    "color": widgetColor,
                    "visibility": true,
                    "isAlert": getReferenceWidgetsArr[getData].isAlert,
                    "channelName": $scope.storedChannelName
                };
                inputParams.push(jsonData);
                $http({
                    method: 'POST',
                    url: '/api/v1/widgets',
                    data: inputParams
                }).then(
                    function successCallback(response) {
                        for (var widgetObjects in response.data.widgetsList) {
                            $rootScope.$broadcast('populateWidget', response.data.widgetsList[widgetObjects]);
                        }
                    },
                    function errorCallback(error) {
                        $(".navbar").css('z-index', '1');
                        $(".md-overlay").css("background", "rgba(0,0,0,0.5)");
                        $("#somethingWentWrongModalContent").addClass('md-show');
                        $("#somethingWentWrongText").text("Something went wrong! Please try again");
                        swal({
                            title: "",
                            text: "<span style='sweetAlertFont'>Something went wrong! Please try again!</span> .",
                            html: true
                        });
                    }
                );
            }
            getReferenceWidgetsArr = [];
        }
        else {
            // function for saving other widgets goes here
            for (var getData in getReferenceWidgetsArr) {
                var matchingMetric = [];
                var matchingMetricName = '';
                var inputParams = [];
                var widgetColor = generateChartColours.fetchWidgetColor($scope.storedChannelName);

                for (var i = 0; i < getReferenceWidgetsArr[getData].charts.length; i++) {
                    matchingMetric = []; matchingMetricName = '';
                    for (var j = 0; j < getReferenceWidgetsArr[getData].charts[i].metrics.length; j++) {
                        for(var k = 0;k < storeChosenObject.length; k++) {
                            if (getReferenceWidgetsArr[getData].charts[i].metrics[j].objectTypeId === storeChosenObject[k].objectTypeId) {
                                matchingMetric.push(getReferenceWidgetsArr[getData].charts[i].metrics[j]);
                                matchingMetric[0].objectId = storeChosenObject[k]._id;
                                matchingMetricName = storeChosenObject[k].name;
                            }
                        }
                    }
                    getReferenceWidgetsArr[getData].charts[i].metrics = matchingMetric;
                    getReferenceWidgetsArr[getData].charts[i].objectName = matchingMetricName;
                }
                if ($scope.storedChannelName === 'Twitter' || $scope.storedChannelName === 'Instagram' || $scope.storedChannelName === 'Google Analytics' ||  $scope.storedChannelName === 'Pinterest')
                    widgetName = getReferenceWidgetsArr[getData].name + ' - ' + storedProfile.name;
                else
                    widgetName = getReferenceWidgetsArr[getData].name + ' - ' + matchingMetricName;

                var jsonData = {
                    "dashboardId": $state.params.id,
                    "widgetType": widgetType,
                    "name": widgetName,
                    "description": getReferenceWidgetsArr[getData].description,
                    "charts": getReferenceWidgetsArr[getData].charts,
                    "order": getReferenceWidgetsArr[getData].order,
                    "offset": getReferenceWidgetsArr[getData].offset,
                    "size": getReferenceWidgetsArr[getData].size,
                    "minSize": getReferenceWidgetsArr[getData].minSize,
                    "maxSize": getReferenceWidgetsArr[getData].maxSize,
                    "color": widgetColor,
                    "visibility": true,
                    "isAlert": getReferenceWidgetsArr[getData].isAlert,
                    "channelName": $scope.storedChannelName
                };
                inputParams.push(jsonData);
                $http({
                    method: 'POST',
                    url: '/api/v1/widgets',
                    data: inputParams
                }).then(
                    function successCallback(response) {

                        for (var widgetObjects in response.data.widgetsList) {
                            $rootScope.$broadcast('populateWidget', response.data.widgetsList[widgetObjects]);
                        }
                    },
                    function errorCallback(error) {

                        $(".navbar").css('z-index', '1');
                        $(".md-overlay").css("background", "rgba(0,0,0,0.5)");
                        $("#somethingWentWrongModalContent").addClass('md-show');
                        $("#somethingWentWrongText").text("Something went wrong! Please try again");
                        swal({
                            title: "",
                            text: "<span style='sweetAlertFont'>Something went wrong! Please try again!</span> .",
                            html: true
                        });
                    }
                );
            }
            getReferenceWidgetsArr = [];
        }
    };

    $scope.storeChannel = function () {
        $scope.storedChannelId = this.data._id;
        $scope.storedChannelName = this.data.name;
        getChannelName = this.data.name;
        if (getChannelName == "CustomData") {
            $scope.metricContent = true;
            $scope.showCustomContent = false;
            $scope.selectCustomLinkHead = "Step 2 : Custom Data URL";
        }
        else {
            $scope.metricContent = false;
            $scope.showCustomContent = true;
            $scope.selectCustomLinkHead = "Step 2 : Choose your Metrics";
        }
    };

    var removeByAttr = function (arr, attr, value) {
        var i = arr.length;
        while (i--) {
            if (arr[i]
                && arr[i].hasOwnProperty(attr)
                && (arguments.length > 2 && arr[i][attr] === value )) {
                arr.splice(i, 1);
            }
        }
        return arr;
    };
    $scope.storeReferenceWidget = function () {
        $scope.storedReferenceWidget = this.referenceWidgets;
        var totalObjectType = [];
        var IsAlreadyExist = 0;
        for (var getData in getReferenceWidgetsArr) {
            if (getReferenceWidgetsArr[getData]._id == this.referenceWidgets._id) {
                removeByAttr(getReferenceWidgetsArr, '_id', getReferenceWidgetsArr[getData]._id);
                $("#referenceWidgets-" + this.referenceWidgets._id).css("border", "2px solid #e7eaec");
                $("#triangle-topright-" + this.referenceWidgets._id).removeClass("triangle-topright");
                $("#metricNames-" + this.referenceWidgets._id).removeClass("getMetricName");
                $("#getCheck-" + this.referenceWidgets._id).hide();
                IsAlreadyExist = 1;
            }
        }
        if (IsAlreadyExist != 1) {
            getReferenceWidgetsArr.push(this.referenceWidgets);
            $("#referenceWidgets-" + this.referenceWidgets._id).css("border", "2px solid #04509B");
            $("#triangle-topright-" + this.referenceWidgets._id).addClass("triangle-topright");
            $("#metricNames-" + this.referenceWidgets._id).addClass("getMetricName");
            $("#getCheck-" + this.referenceWidgets._id).show();
            document.getElementById('basicWidgetNextButton').disabled = false;
        }
        if (getReferenceWidgetsArr == "" || getReferenceWidgetsArr == "[]" || getReferenceWidgetsArr == null) {
            document.getElementById('basicWidgetNextButton').disabled = true;
        }
        if (getReferenceWidgetsArr.length) {
            var referenceWidgetLength = getReferenceWidgetsArr.length;

            for (var i = 0; i < referenceWidgetLength; i++) {
                for (var j = 0; j < getReferenceWidgetsArr[i].charts.length; j++) {
                    for (var k = 0; k < getReferenceWidgetsArr[i].charts[j].metrics.length; k++) {
                        totalObjectType.push(getReferenceWidgetsArr[i].charts[j].metrics[k].objectTypeId)
                    }
                }
            }
            $scope.uniqueObjectCount = _.uniq(totalObjectType);
        }
    };

    $scope.clearReferenceWidget = function () {
        $scope.referenceWidgetsList = [];
        $scope.tokenExpired = false;
        var lastWidgetId = $rootScope.customWidgetId;
        if (lastWidgetId != undefined && lastWidgetId !='' ) {
            $http({
                method: 'POST',
                url: '/api/v1/delete/widgets/' + lastWidgetId
            }).then(
                function successCallback(response) {
                    $rootScope.customWidgetId = '';
                },
                function errorCallback(error) {
                    swal({
                        title: "",
                        text: "<span style='sweetAlertFont'>Something went wrong! Please reopen widgets link</span> .",
                        html: true
                    });
                }
            );
        }
    };

    $scope.objectForWidgetChosen = function (chosenObject) {
        if($scope.storedChannelName=='FacebookAds') {
            if (!this.objectOptionsModel[0]) {
                $scope.selectedObjectType = null;
                $scope.selectedLevel = null;
                $scope.selectedId = null;
                $scope.campaignChosen = false;
                $scope.adSetChosen = false;
                $scope.adSetAdsChosen = false;
                $scope.campaignEnable = false;
                $scope.adSetEnable = false;
                $scope.adSetAdsEnable = false;
                $scope.campaign = null;
                $scope.adSet = null;
                $scope.adSetAds = null;
                $scope.selectEnable = false;
                document.getElementById('basicWidgetFinishButton').disabled = true;
            }
        }
        if(($scope.storedChannelName=='GoogleAdwords')&&($scope.canManageClients==true)){
            if (!this.objectOptionsModel[0]) {
                $scope.googleCampaignChosen = false;
                $scope.adChosen = false;
                $scope.groupChosen = false;
                $scope.googleCampaignEnable = false;
                $scope.adEnable = false;
                $scope.groupEnable = false;
                $scope.googleCampaign = null;
                $scope.googleAd = null;
                $scope.googleGroup = null;
                $scope.selectedGoogleObjectType = null;
                $scope.selectedGoogleLevel = null;
                $scope.selectedGoogleId = null;
                $scope.selectEnable = false;
                document.getElementById('basicWidgetFinishButton').disabled = true;
            }
        }
        document.getElementById('basicWidgetFinishButton').disabled = true;
        var countChecker = false;
        if ($scope.storedChannelName === 'Google Analytics' && chosenObject) {
            if(chosenObject[0] != '') {
                var objectDetails = JSON.parse(chosenObject[0]);
                chosenObject = [objectDetails[0],objectDetails[1],objectDetails[2],chosenObject[1]];
            }
            else
                chosenObject = [null,null,null,chosenObject[1]];
        }

        if (chosenObject != undefined && chosenObject[1] != undefined)
            storeChosenObject[chosenObject[3]] = {name: chosenObject[0],_id: chosenObject[1],objectTypeId: chosenObject[2]};
        else
            storeChosenObject[chosenObject[3]] = null;

        if(storeChosenObject.length == $scope.uniqueObjectCount.length) {
            countChecker = true;
            for(var items in storeChosenObject)
                if(storeChosenObject[items] == null)
                    countChecker = false;
            if((countChecker == true)&&($scope.storedChannelName!='FacebookAds')&&($scope.storedChannelName!='GoogleAdwords')) {
                document.getElementById('basicWidgetFinishButton').disabled = false;
            }
            else if((countChecker == true)&&($scope.storedChannelName=='FacebookAds')){
                //  $scope.clearSelectLevel();
                $scope.selectedObjectType = null;
                $scope.selectedLevel = null;
                $scope.selectedId = null;
                $scope.campaignChosen = false;
                $scope.adSetChosen = false;
                $scope.adSetAdsChosen = false;
                $scope.campaignEnable = false;
                $scope.adSetEnable = false;
                $scope.adSetAdsEnable = false;
                $scope.campaign = null;
                $scope.adSet = null;
                $scope.adSetAds = null;
                $scope.accountId = chosenObject[4];
                $scope.selectEnable = true;
                $http({
                    method: 'GET', url: '/api/v1/get/objectType/' + $scope.storedChannelId
                }).then(
                    function successCallback(response) {
                        $scope.objectTypeList = response.data.objectType;
                        //$scope.objectTypeOptionsModel=$scope.objectTypeList;
                    },
                    function errorCallback(error) {
                        swal({
                            title: "",
                            text: "<span style='sweetAlertFont'>Something went wrong! Please reopen widgets link</span> .",
                            html: true
                        });
                    }
                );
                document.getElementById('basicWidgetFinishButton').disabled = true;
            }
            else if((countChecker == true)&&($scope.storedChannelName=='GoogleAdwords')){
                // $scope.clearGoogleSelectLevel();
                $scope.googleCampaignChosen = false;
                $scope.adChosen = false;
                $scope.groupChosen = false;
                $scope.googleCampaignEnable = false;
                $scope.adEnable = false;
                $scope.groupEnable = false;
                $scope.googleCampaign = null;
                $scope.googleAd = null;
                $scope.googleGroup = null;
                $scope.selectedGoogleObjectType =null;
                $scope.selectedGoogleLevel = null;
                $scope.selectedGoogleId = null;
                $scope.googleAccountId=chosenObject[4];
                $scope.selectEnable=true;
                $http({
                    method: 'GET', url: '/api/v1/get/objectType/' + $scope.storedChannelId
                }).then(
                    function successCallback(response) {
                        $scope.googleObjectTypeList=response.data.objectType;
                    },
                    function errorCallback(error) {
                        swal({
                            title: "",
                            text: "<span style='sweetAlertFont'>Something went wrong! Please reopen widgets link</span> .",
                            html: true
                        });
                    }
                );
                document.getElementById('basicWidgetFinishButton').disabled = true;
            }
            else {

                document.getElementById('basicWidgetFinishButton').disabled =true;
            }
        }
        else {
            document.getElementById('basicWidgetFinishButton').disabled = true;
        }
    };

    $scope.errorMessage = true;

    $scope.storeCustomData = function () {
        var jsonData = {
            "dashboardId": $state.params.id,
            "widgetType": "custom",
            "channelId": $scope.storedChannelId,
            "visibility": true,
            "channelName": "custom"
        };
        $http({
            method: 'POST',
            url: '/api/v1/create/customwidgets',
            data: jsonData
        }).then(
            function successCallback(response) {
                $scope.errorMessage = true;
                $scope.customMessage = false;
                $scope.customDocLinkMessage = false;
                document.getElementById('basicWidgetBackButton2').disabled = false;
                document.getElementById('basicWidgetNextButton').disabled = false;
                getCustomWidgetId = response.data.widgetsList.id._id;
                $rootScope.customWidgetId = response.data.widgetsList.id._id;
                var domainUrl = "";
                if (window.location.hostname == "localhost")
                    domainUrl = "http://localhost:8080";
                else
                    domainUrl = window.location.hostname;
                $(".customApiLink").html(domainUrl + '/api/v1/create/customdata/' + response.data.widgetsList.id._id);
                $scope.customLink = domainUrl + '/api/v1/create/customdata/' + response.data.widgetsList.id._id;
            },
            function errorCallback(error) {
                $scope.customMessage = true;
                $scope.errorMessage = false;
                $scope.customDocLinkMessage = true;
                swal({
                    title: "",
                    text: "<span style='sweetAlertFont'>Something went wrong! Please reopen widgets link</span> .",
                    html: true
                });
            }
        );
        new Clipboard('#btnCopyLink');
    };

    $scope.copyToClipboard = function () {
        swal("Copied", "", "success");
    };

    $scope.ComingSoonAlert = function () {
        swal("Coming Soon!");
    };
}