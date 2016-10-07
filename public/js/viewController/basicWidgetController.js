showMetricApp.controller('BasicWidgetController', BasicWidgetController)

function BasicWidgetController($scope, $http, $state, $rootScope, $window, $stateParams, generateChartColours,$q) {
    $scope.objectList = {};
    $scope.referenceWidgetsList = [];
    $scope.fbObjectTypeList={};
    $scope.tokenExpired = [];
    $scope.channelList;
    $scope.currentView = 'step_one';
    $scope.weburl='';
    $scope.mozObjectDetails={};
    $scope.fbSelectEnable=false;
    $scope.googleSelectEnable=false;
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
    $scope.refreshButtonLoading='';
    $scope.selectedChannelList=[];
    $scope.selectedTempChannelList=[];
    $scope.uniqueObjectCount=[];
    $scope.checkExpiresIn=[];
    $scope.hasNoAccess=[];
    var widgetType = 'basic';
    var storedProfile = [];
    var getChannelName = "";
    var mozComplete=false;
    var getCustomWidgetObj = {};
    var getCustomWidgetId = "";
    var isSelectedMetric = "";
    var referenceWidgetsData = {};
    var getReferenceWidgetsArr = new Array();
    var storeChosenObject = [];
    var tempChosenObject = [];
    var profileListBeforeAddition = {};
    var startWidget=0;
    var linkChannelId='';
    var mozPresent=false;
    var fbAdsPresent=false;
    var googleAdsPresent=false;
    var canFinishEnable=false;
    var fbAdsComplete=false;
    var googleAdsComplete=false;
    $scope.profileOptionsModel={};
    angular.element(document).ready(function () {
        $('.progress-demo2 .ladda-button').addClass('icon-arrow-right');
        Ladda.bind('.progress-demo2 .ladda-button',{
            callback: function( instance ){
                $('.progress-demo2 .ladda-button').removeClass('icon-arrow-right');
                $scope.createAndFetchBasicWidget();
                var progress = 0;
                var interval = setInterval( function(){
                    progress = Math.min( progress + Math.random() * 0.1, 1 );
                    instance.setProgress( progress );

                    if( progress === 1 && startWidget===1 ){
                        instance.stop();
                        clearInterval( interval );
                        $scope.ok();

                    }
                }, 50 );
            }
        });


    });

    $scope.changeViewsInBasicWidget = function (obj) {
        $scope.currentView = obj;
        $rootScope.currentModalView = obj;
        if ($scope.currentView === 'step_one') {
            $scope.listChannels();
            $scope.clearReferenceWidget();
            $scope.selectedChannelList=[];
            $scope.customMessageEnable=false;
            storeChosenObject = [];
            $scope.fbObjectTypeList={};
            $scope.canManageClients = true;
            document.getElementById('basicWidgetFinishButton').disabled = true;
            $("#basicWidgetNextButton1").show();
        }
        else if ($scope.currentView === 'step_two') {
            $scope.customMessageEnable=false;
            $scope.messageEnable=false;
            $scope.clearReferenceWidget();
            $scope.selectedChannelList=[];
            if (getChannelName == "CustomData") {
                $scope.storeCustomData();
                $('#basicWidgetBackButton').hide();
                $("#basicWidgetNextButton2").hide();
                $("#basicWidgetNextButton1").hide();
                $("#basicWidgetFinishButtonCustom").show();
            }
            else {
                storeChosenObject = [];
                tempChosenObject=[];
                $scope.weburl=''
                canFinishEnable=false;
                fbAdsComplete=false;
                googleAdsComplete=false;
                mozComplete=false;
                $scope.fbSelectEnable=false;
                $scope.googleSelectEnable=false;
                document.getElementById('basicWidgetFinishButton').disabled = true;
                $scope.getReferenceWidgetsForChosenChannel();
                $scope.getProfilesForDropdown();
                $("#basicWidgetNextButton2").show();
                $('#basicWidgetBackButton').hide();
                $("#basicWidgetFinishButtonCustom").hide();
                $('#basicWidgetFinishButton').hide();
                $("#basicWidgetNextButton1").hide();
            }
        }
        else if ($scope.currentView === 'step_three') {
            $('#basicWidgetBackButton2').hide();
            $('#basicWidgetFinishButton').show();
            $("#basicWidgetNextButton2").hide();
            $scope.checkChannelList();
            document.getElementById('basicWidgetFinishButton').disabled = true;
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
    };

    $scope.dropdownWidth=function(hasnoAccess,tokenExpired){
        if(hasnoAccess==true || tokenExpired==true){
            return ('col-sm-'+10+' col-md-'+10+' col-lg-'+10+' col-xs-10');
        }
    }

    $scope.mozobject=function(url){
        $scope.weburl=url;
        if($scope.weburl!=''&& $scope.weburl!=null)
            mozComplete=true;
        else
            mozComplete=false;
        for (var items in $scope.selectedChannelList){
            if($scope.selectedChannelList[items].name=='Moz'){
                mozPresent=true;
                storeChosenObject[items]={channelName:$scope.selectedChannelList[items].name};
            }
            if($scope.selectedChannelList[items].name=='FacebookAds')
                fbAdsPresent=true;
            if($scope.selectedChannelList[items].name=='GoogleAdwords')
                googleAdsPresent=true;
        }
        if($scope.selectedChannelList.length==1 && mozPresent==true)
            canFinishEnable=true;
        $scope.checkComplete();
    };

    $scope.listChannels = function () {
        $http({
            method: 'GET',
            url: '/api/v1/get/channels'
        }).then(
            function successCallback(response) {
                var channels = response.data;
                if(!$scope.selectedTempChannelList.length){
                    for(i in channels)
                        channels[i].isSelected=0;
                    $scope.channelList=channels
                }
                else
                    document.getElementById('basicWidgetNextButton1').disabled = false;
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
                for(var j in $scope.selectedTempChannelList) {
                    var tempReferenceList=[];
                    for (var i = 0; i < response.data.referenceWidgets.length; i++) {
                        if (response.data.referenceWidgets[i].charts[0].channelId === $scope.selectedTempChannelList[j].id) {
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
                                    'border': '2px solid #e7eaec',
                                    'channelName':$scope.selectedTempChannelList[j].name
                                };
                                document.getElementById('basicWidgetNextButton2').disabled = false;
                            }

                            if (getReferenceWidgetsArr == "" || getReferenceWidgetsArr == "[]" || getReferenceWidgetsArr == null)
                                document.getElementById('basicWidgetNextButton2').disabled = true;

                            tempReferenceList.push(referenceWidgetsData);
                        }
                    }
                    $scope.referenceWidgetsList.push({widgets:tempReferenceList,channelName:$scope.selectedTempChannelList[j].name})
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
        var tempProfileList = [];
        for (var key in  $scope.selectedTempChannelList) {
            tempProfileList.push($scope.correspondingProfile($scope.selectedTempChannelList[key].id));
        }
        $q.all(tempProfileList).then(
            function successCallback(tempProfileList) {
                for(var key in $scope.selectedTempChannelList){
                    $scope.selectedTempChannelList[key].profileList=tempProfileList[key].profiles;
                }
            },
            function errorCallback(err) {
                swal({
                    title: "",
                    text: "<span style='sweetAlertFont'>Something went wrong! Please reopen widgets link</span>",
                    html: true
                });
            }
        );
    };

    $scope.correspondingProfile = function (channelId) {
        var deferred = $q.defer();
        $http({
            method: 'GET',
            url: '/api/v1/get/profiles/' + channelId
        }).then(
            function successCallback(response) {
                deferred.resolve({
                    profiles: response.data.profileList
                });
            },
            function errorCallback(error) {
                deferred.reject(error);
                swal({
                    title: "",
                    text: "<span style='sweetAlertFont'>Something went wrong! Please reopen widgets link</span>",
                    html: true
                });
            }
        );
        return deferred.promise;
    };

    $scope.checkChannelList=function(){
        var tempObjectCount = _.groupBy($scope.uniqueObjectCount,'channelId');
        var uniqueMergedList=[];
        for(var data in tempObjectCount){
            var objectTypePerChannel=[];
            for(i=0;i<tempObjectCount[data].length;i++){
                objectTypePerChannel.push(tempObjectCount[data][i].objectType);
            }
            var uniqueObjectTypePerChannel=_.uniq(objectTypePerChannel)
            uniqueMergedList.push({channelId:data,objectype:uniqueObjectTypePerChannel})
        }
        for(var key in $scope.selectedTempChannelList){
            $scope.selectedTempChannelList[key].uniqueObjectCount=[];
            for(var data in uniqueMergedList){
                if($scope.selectedTempChannelList[key].id == uniqueMergedList[data].channelId ){
                    $scope.selectedTempChannelList[key].uniqueObjectCount =uniqueMergedList[data].objectype
                }
            }
        }
        for(var key in $scope.selectedTempChannelList){
            if($scope.selectedTempChannelList[key].uniqueObjectCount !='') {
                $scope.selectedChannelList.push($scope.selectedTempChannelList[key]);
            }
        }
    };

    $scope.selectLevelChosen = function (level,index) {
        $scope.messageEnable=false;
        if(level) {
            var setLimitation=0;
            for (var getData in getReferenceWidgetsArr) {
                if(getReferenceWidgetsArr[getData].name == "Cost per objective") setLimitation=1;
                else setLimitation=0;
            }
            if(!this.objectTypeOptionsModel[index]){
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
                $scope.selectedObjectType = this.objectTypeOptionsModel[index];
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
                $scope.selectedObjectType = this.objectTypeOptionsModel[index];
                $scope.selectedLevel = this.objectTypeOptionsModel[index].type;
                $scope.selectedId = this.objectTypeOptionsModel[index]._id;
            }
        }
        //   else
        if($scope.selectedLevel=='fbadaccount'){
            if(setLimitation){
                $scope.messageEnable=true;
                fbAdsComplete=false;
            }
            else {
                if (($scope.profileId != null) && ($scope.accountId != null))
                    fbAdsComplete=true;
                else
                    fbAdsComplete=false;
            }
            $scope.checkComplete();
        }
        else if($scope.selectedLevel=='fbAdcampaign'){
            if($scope.campaignChosen==false){
                fbAdsComplete=false;
                $scope.campaignEnable=true;
                $scope.getCampaigns();
            }
            else {
                if(($scope.profileId!=null)&&($scope.accountId!=null)&&($scope.campaign!=null))
                    fbAdsComplete=true;
                else{
                    fbAdsComplete=false;
                }
            }
            $scope.checkComplete();
        }
        else if($scope.selectedLevel=='fbAdSet'){
            if(setLimitation){
                $scope.messageEnable=true;
                fbAdsComplete=false;
            }
            else {
                if (($scope.campaignChosen == true) && ($scope.adSetChosen == true)) {
                    if (($scope.profileId != null) && ($scope.accountId != null) && ($scope.campaign != null) && ($scope.adSet != null))
                        fbAdsComplete=true;
                    else {
                        fbAdsComplete=false;
                    }
                }
                else if (($scope.campaignChosen == false) && ($scope.adSetChosen == false)) {
                    $scope.campaignEnable = true;
                    $scope.getCampaigns();
                }
                else if (($scope.campaignChosen == true) && ($scope.adSetChosen == false)) {
                    $scope.campaignEnable = true;
                    $scope.adSetEnable = true;
                    $scope.getAdSet();
                    fbAdsComplete=false;
                }
                else
                    fbAdsComplete=false;;
            }
            $scope.checkComplete();
        }
        else if($scope.selectedLevel=='fbAdSetAds'){
            if(setLimitation){
                $scope.messageEnable=true;
                fbAdsComplete=false;
            }
            else {
                if (($scope.campaignChosen == true) && ($scope.adSetChosen == true) && ($scope.adSetAdsChosen == true)) {
                    if (($scope.profileId != null) && ($scope.accountId != null) && ($scope.campaign != null) && ($scope.adSet != null) && ($scope.adSetAds != null))
                        fbAdsComplete=true;
                    else {
                        fbAdsComplete=false;
                    }
                }
                else if ((($scope.campaignChosen == false) && ($scope.adSetChosen == false)) && ($scope.adSetAdsChosen == true)) {
                    fbAdsComplete=false;
                    $scope.campaignEnable = true;
                    $scope.getCampaigns();
                    $scope.adSetAdsChosen = false;
                    $scope.adSetAds = null;
                }
                else if (($scope.campaignChosen == true) && ($scope.adSetChosen == true) && ($scope.adSetAdsChosen == false)) {
                    fbAdsComplete=false;
                    $scope.adSetAdsEnable = true;
                    $scope.getAdSetAds();
                }
                else if (($scope.campaignChosen == false) && ($scope.adSetChosen == false) && ($scope.adSetAdsChosen == false)) {
                    fbAdsComplete=false;
                    $scope.campaignEnable = true;
                    $scope.getCampaigns();
                }
                else if (($scope.campaignChosen == true) && ($scope.adSetChosen == false) && ($scope.adSetAdsChosen == false)) {
                    fbAdsComplete=false;
                    $scope.adSetEnable = true;
                    $scope.getAdSet();
                }
                else if (($scope.campaignChosen == true) && ($scope.adSetChosen == false) && ($scope.adSetAdsChosen == true)) {
                    fbAdsComplete=false;
                    $scope.adSetEnable = true;
                    $scope.getAdSet();
                    $scope.adSetAdsChosen = false;
                    $scope.adSetAds = null;
                }
                else if (($scope.campaignChosen == false) && ($scope.adSetChosen == true) && ($scope.adSetAdsChosen == true)) {
                    fbAdsComplete=false;
                    $scope.campaignEnable = true;
                    $scope.getCampaigns();
                    $scope.adSetAdsChosen = false;
                    $scope.adSetAds = null;
                    $scope.adSetChosen = false;
                    $scope.adSet = null;
                }
                else if (($scope.campaignChosen == false) && ($scope.adSetChosen == true) && ($scope.adSetAdsChosen == false)) {
                    fbAdsComplete=false;
                    $scope.campaignEnable = true;
                    $scope.getCampaigns();
                    $scope.adSetAdsChosen = false;
                    $scope.adSetAds = null;
                    $scope.adSetChosen = false;
                    $scope.adSet = null;
                }
            }
            $scope.checkComplete();
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

    $scope.getCampaigns=function(){
        var objectTypeId = $scope.selectedId;
        var accountId = $scope.accountId;
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
                            text: "<span style='sweetAlertFont'>Please refresh your profile!</span>",
                            html: true
                        });
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
                            text: "<span style='sweetAlertFont'>Please refresh your profile!</span>",
                            html: true
                        });
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
                            text: "<span style='sweetAlertFont'>Please refresh your profile!</span>",
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

    $scope.googleSelectLevelChosen = function (level,index) {
        if(level) {
            if(this.objectTypeOptionsModel[index]) {
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
                $scope.selectedGoogleObjectType = this.objectTypeOptionsModel[index];
                $scope.selectedGoogleLevel = this.objectTypeOptionsModel[index].type;
                $scope.selectedGoogleId = this.objectTypeOptionsModel[index]._id;
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
                $scope.selectedGoogleObjectType = this.objectTypeOptionsModel[index];
                $scope.selectedGoogleLevel = null;
                $scope.selectedGoogleId = null;
            }
        }
        if($scope.selectedGoogleLevel=='adwordaccount'){
            if(($scope.profileOptionsModel!=null)&&($scope.googleAccountId!=null))
                googleAdsComplete=true;
            else
                googleAdsComplete=false;
            $scope.checkComplete();
        }
        else if($scope.selectedGoogleLevel=='adwordCampaign'){
            if($scope.googleCampaignChosen==false){
                googleAdsComplete=false;
                $scope.googleCampaignEnable=true;
                $scope.getGoogleCampaigns();
            }
            else{
                if(($scope.googleProfileId!=null)&&($scope.googleAccountId!=null)&&($scope.googleCampaign!=null))
                    googleAdsComplete=true;
                else{
                    googleAdsComplete=false;
                }
            }
            $scope.checkComplete();
        }
        else if($scope.selectedGoogleLevel=='adwordAdgroup'){
            if(($scope.googleCampaignChosen==true)&&($scope.groupChosen==true)){
                if(($scope.profileOptionsModel!=null)&&($scope.googleAccountId!=null)&&($scope.googleCampaign!=null)&&($scope.googleGroup!=null))
                    googleAdsComplete=true;
                else {
                    googleAdsComplete=false;
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
                googleAdsComplete=false;
            }
            else
                googleAdsComplete=false;
            $scope.checkComplete();
        }
        else if($scope.selectedGoogleLevel=='adwordsAd'){
            if(($scope.googleCampaignChosen==true)&&($scope.groupChosen==true)&&($scope.adChosen==true)){
                if(($scope.profileOptionsModel!=null)&&($scope.googleAccountId!=null)&&($scope.googleCampaign!=null)&&($scope.googleGroup!=null)&&($scope.googleAd!=null))
                    googleAdsComplete=true;
                else {
                    googleAdsComplete=false;
                }
            }
            else if((($scope.googleCampaignChosen==false)&&($scope.groupChosen==false))&&($scope.adChosen==true)){
                googleAdsComplete=false;
                $scope.googleCampaignEnable=true;
                $scope.getGoogleCampaigns();
                $scope.adChosen=false;
                $scope.googleAd=null;
            }
            else if(($scope.googleCampaignChosen==true)&&($scope.groupChosen==true)&&($scope.adChosen==false)){
                googleAdsComplete=false;
                $scope.adEnable=true;
                $scope.getGoogleAd();
            }
            else if(($scope.googleCampaignChosen==false)&&($scope.groupChosen==false)&&($scope.adChosen==false)){
                googleAdsComplete=false;
                $scope.googleCampaignEnable=true;
                $scope.getGoogleCampaigns();
            }
            else if(($scope.googleCampaignChosen==true)&&($scope.groupChosen==false)&&($scope.adChosen==false)){
                googleAdsComplete=false;
                $scope.groupEnable=true;
                $scope.getGoogleGroup();
            }
            else if(($scope.googleCampaignChosen==true)&&($scope.groupChosen==false)&&($scope.adChosen==true)){
                googleAdsComplete=false;
                $scope.groupEnable=true;
                $scope.getGoogleGroup();
                $scope.adChosen=false;
                $scope.googleAd=null;
            }
            else if(($scope.googleCampaignChosen==false)&&($scope.groupChosen==true)&&($scope.adChosen==true)){
                googleAdsComplete=false;
                $scope.googleCampaignEnable=true;
                $scope.getGoogleCampaigns();
                $scope.adChosen=false;
                $scope.googleAd=null;
                $scope.groupChosen=false;
                $scope.googleGroup=null;
            }
            else if(($scope.googleCampaignChosen==false)&&($scope.groupChosen==true)&&($scope.adChosen==false)){
                googleAdsComplete=false;
                $scope.googleCampaignEnable=true;
                $scope.getGoogleCampaigns();
                $scope.adChosen=false;
                $scope.googleAds=null;
                $scope.groupChosen=false;
                $scope.googleGroup=null;
            }
            $scope.checkComplete();
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
                            text: "<span style='sweetAlertFont'>Please refresh your profile!</span>",
                            html: true
                        });
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
                            text: "<span style='sweetAlertFont'>Please refresh your profile!</span>",
                            html: true
                        });
                    }
                } else
                    swal({
                        title: "",
                        text: "<span style='sweetAlertFont'>Something went wrong! Please reopen widgets link</span>",
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
                            text: "<span style='sweetAlertFont'>Please refresh your profile!</span>",
                            html: true
                        });
                    }
                } else
                    swal({
                        title: "",
                        text: "<span style='sweetAlertFont'>Something went wrong! Please reopen widgets link</span>",
                        html: true
                    });
            }
        )
    };

    $scope.getObjectsForChosenProfile = function (index,profile,channelName,uniqueObjectCount) {
        document.getElementById('basicWidgetFinishButton').disabled = true;
        $scope.checkExpiresIn[index] = null;
        storeChosenObject[index] = [];
        if (!profile) {
            if (channelName == 'Facebook')
                $scope.facebookObjectList = null;
            else if (channelName == 'Mailchimp')
                $scope.mailchimpObjectList = null;
            else if (channelName == 'Aweber')
                $scope.aweberObjectList = null;
            else if (channelName == 'linkedin')
                $scope.linkedInObjectList = null;
            else if (channelName == 'YouTube')
                $scope.youtubeObjectList = null;
            else if (channelName == 'Vimeo')
                $scope.vimeoObjectList = null;
            else if (channelName == 'Twitter')
                $scope.twitterObjectList = null;
            else if (channelName == 'Pinterest')
                $scope.pinterestObjectList = null;
            else if (channelName == 'Instagram')
                $scope.instagramObjectList = null;
            else if(channelName == 'FacebookAds')
                $scope.facebookAdsObjectList = null;
            else if(channelName == 'GoogleAdwords')
                $scope.googleAdwordsObjectList = null;
            else if(channelName == 'Google Analytics')
                $scope.googleAnalyticsObjectList = null;
            storeChosenObject[index] = [];
            if (channelName === 'Twitter' || channelName === 'Instagram' || channelName === 'GoogleAdwords')
                for(var items in uniqueObjectCount)
                    $scope.objectForWidgetChosen([null, null, null,items,index],channelName,uniqueObjectCount);
            if(channelName == 'FacebookAds'){
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
                $scope.fbSelectEnable = false;
            }
            if((channelName == 'GoogleAdwords')) {
                $scope.googleCampaignEnable = false;
                $scope.adEnable = false;
                $scope.groupEnable = false;
                $scope.googleCampaign = null;
                $scope.googleGroup = null;
                $scope.googleAd = null;
                $scope.googleCampaignChosen = false;
                $scope.groupChosen = false;
                $scope.adChosen = false;
                $scope.googleSelectEnable= false;
                document.getElementById('basicWidgetFinishButton').disabled = true;

            }
        }
        else {
            $scope.hasNoAccess[index] = profile.hasNoAccess;
            storedProfile[index] = profile;
            if(channelName == 'GoogleAdwords') {
                if (profile.canManageClients === false)
                    $scope.canManageClients =false;
                else
                    $scope.canManageClients =true;
            }
            if(channelName == 'FacebookAds'){
                document.getElementById('basicWidgetFinishButton').disabled = true;
                if(profile) {
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
                    $scope.fbSelectEnable = false;
                    $scope.profileId = storedProfile[index]._id;
                    if (profile.expiresIn != undefined)
                        $scope.checkExpiresIn[index] = new Date(profile.expiresIn);
                    $scope.tokenExpired[index] = false;
                    var profileId = profile._id;
                    var expiresIn = profile.expiresIn;
                    var currentDate = new Date();
                    var newExpiresIn = new Date(expiresIn);
                    if (currentDate <= newExpiresIn && expiresIn != null)
                        $scope.tokenExpired[index] = false;
                    else if (expiresIn === undefined || expiresIn === null)
                        $scope.tokenExpired[index] = false;
                    else
                        $scope.tokenExpired[index] = true;
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
                            for (var objectIds in uniqueObjectCount) {
                                for (var uniqueObjects in uniqueObject)
                                    if (uniqueObjectCount[objectIds] == uniqueObjects)
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
                                text: "<span style='sweetAlertFont'>Something went wrong! Please reopen widgets link</span>",
                                html: true
                            });
                        }
                    );
                }
            }
            else if((channelName == 'GoogleAdwords')){
                document.getElementById('basicWidgetFinishButton').disabled = true;
                if(profile) {
                    $scope.googleCampaignEnable = false;
                    $scope.adEnable = false;
                    $scope.groupEnable = false;
                    $scope.googleCampaign = null;
                    $scope.googleGroup = null;
                    $scope.googleAd = null;
                    $scope.googleCampaignChosen = false;
                    $scope.groupChosen = false;
                    $scope.adChosen = false;
                    $scope.googleSelectEnable = false;
                    document.getElementById('basicWidgetFinishButton').disabled = true;
                    if ($scope.canManageClients == false) {
                        $scope.googleProfileId = storedProfile[index]._id;
                        if (profile.expiresIn != undefined)
                            $scope.checkExpiresIn[index]= new Date(profile.expiresIn);
                        $scope.tokenExpired[index] = false;

                        var profileId = profile._id;
                        var expiresIn = profile.expiresIn;
                        var currentDate = new Date();
                        var newExpiresIn = new Date(expiresIn);
                        if (currentDate <= newExpiresIn && expiresIn != null)
                            $scope.tokenExpired[index] = false;
                        else if (expiresIn === undefined || expiresIn === null)
                            $scope.tokenExpired[index] = false;
                        else
                            $scope.tokenExpired[index] = true;
                        $http({
                            method: 'GET',
                            url: '/api/v1/get/objects/' + profileId
                        }).then(
                            function successCallback(response) {
                                console.log('response',response)
                                var uniqueObject;
                                var k = 0;
                                var tempList = {};
                                uniqueObject = _.groupBy(response.data.objectList, 'objectTypeId');
                                console.log('uniqueObject',uniqueObject,'uniqueObjectCount',uniqueObjectCount)
                                var sortedUniqueObject = {};
                                for (var objectIds in uniqueObjectCount) {
                                    for (var uniqueObjects in uniqueObject){
                                        if (uniqueObjectCount[objectIds] == uniqueObjects)
                                            sortedUniqueObject[uniqueObjects] = uniqueObject[uniqueObjects];
                                        console.log('uniqueObject[uniqueObjects]',uniqueObject[uniqueObjects])
                                    }
                                }
                                console.log('sortedUniqueObject',sortedUniqueObject)
                                for (var items in sortedUniqueObject) {
                                    var tempObjectList = [];
                                    for (var subItems in sortedUniqueObject[items])
                                        tempObjectList.push(sortedUniqueObject[items][subItems]);
                                    var obj = {};
                                    obj[k] = tempObjectList;
                                    tempList[k] = obj;
                                    k++;
                                }
                                console.log('tempList',tempList)
                                $scope.googleAdwordsObjectList = tempList;
                                var objectList = $scope.googleAdwordsObjectList;
                                for (var items in uniqueObjectCount)
                                    $scope.objectForWidgetChosen([objectList[0][0][0].name, objectList[0][0][0]._id, objectList[0][0][0].objectTypeId, items,index, objectList[0][0][0].channelObjectId],channelName,uniqueObjectCount);
                            }, function errorCallback(error) {
                                swal({
                                    title: "",
                                    text: "<span style='sweetAlertFont'>Something went wrong! Please reopen widgets link</span>",
                                    html: true
                                });
                            }
                        );
                    }
                    else {
                        $scope.googleProfileId = storedProfile[index]._id;
                        if (profile.expiresIn != undefined)
                            $scope.checkExpiresIn[index] = new Date(profile.expiresIn);
                        $scope.tokenExpired[index] = false;

                        var profileId = profile._id;
                        var expiresIn = profile.expiresIn;
                        var currentDate = new Date();
                        var newExpiresIn = new Date(expiresIn);
                        if (currentDate <= newExpiresIn && expiresIn != null)
                            $scope.tokenExpired[index] = false;
                        else if (expiresIn === undefined || expiresIn === null)
                            $scope.tokenExpired[index] = false;
                        else
                            $scope.tokenExpired[index] = true;
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
                                for (var objectIds in uniqueObjectCount) {
                                    for (var uniqueObjects in uniqueObject)
                                        if (uniqueObjectCount[objectIds] == uniqueObjects)
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
                                    text: "<span style='sweetAlertFont'>Something went wrong! Please reopen widgets link</span>",
                                    html: true
                                });
                            }
                        );
                    }
                }
            }
            else {
                if (profile.expiresIn != undefined)
                    $scope.checkExpiresIn[index] = new Date($scope.profileOptionsModel.expiresIn);
                $scope.tokenExpired[index] = false;

                var profileId = profile._id;
                var expiresIn = profile.expiresIn;
                var currentDate = new Date();
                var newExpiresIn = new Date(expiresIn);
                if (currentDate <= newExpiresIn && expiresIn != null)
                    $scope.tokenExpired[index] = false;
                else if (expiresIn === undefined || expiresIn === null)
                    $scope.tokenExpired[index] = false;
                else
                    $scope.tokenExpired[index] = true;

                $http({
                    method: 'GET',
                    url: '/api/v1/get/objects/' + profileId
                }).then(
                    function successCallback(response) {
                        var uniqueObject;
                        var k = 0;
                        var tempList = {};

                        if (channelName != 'Google Analytics') {
                            uniqueObject = _.groupBy(response.data.objectList, 'objectTypeId');
                            var sortedUniqueObject = {};
                            for (var objectIds in uniqueObjectCount) {
                                for (var uniqueObjects in uniqueObject)
                                    if (uniqueObjectCount[objectIds] == uniqueObjects)
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
                            if (channelName == 'Facebook')
                                $scope.facebookObjectList = tempList;
                            else if (channelName == 'Mailchimp')
                                $scope.mailchimpObjectList = tempList;
                            else if (channelName == 'Aweber')
                                $scope.aweberObjectList = tempList;
                            else if (channelName == 'linkedin')
                                $scope.linkedInObjectList = tempList;
                            else if (channelName == 'YouTube')
                                $scope.youtubeObjectList = tempList;
                            else if (channelName == 'Vimeo')
                                $scope.vimeoObjectList = tempList;
                            else if (channelName == 'Twitter')
                                $scope.twitterObjectList = tempList;
                            else if (channelName == 'Pinterest')
                                $scope.pinterestObjectList = tempList;
                            else if (channelName == 'Instagram')
                                $scope.instagramObjectList = tempList;
                        }
                        else {
                            document.getElementById('basicWidgetFinishButton').disabled = true;
                            var uniqueObjectTypeWithIndex = [];
                            uniqueObjectTypeWithIndex[k] = response.data.objectList;
                            $scope.googleAnalyticsObjectList = uniqueObjectTypeWithIndex;
                        }

                        if (channelName === 'Twitter' || channelName === 'Pinterest' || channelName === 'Instagram') {
                            document.getElementById('basicWidgetFinishButton').disabled = true;
                            var objectList;
                            switch (channelName) {
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
                            for (var items in uniqueObjectCount)
                                $scope.objectForWidgetChosen([objectList[0][0][0].name, objectList[0][0][0]._id, objectList[0][0][0].objectTypeId, Number(items),index],channelName,uniqueObjectCount);
                        }
                    },
                    function errorCallback(error) {
                        swal({
                            title: "",
                            text: "<span style='sweetAlertFont'>Something went wrong! Please reopen widgets link</span>",
                            html: true
                        });
                    }
                );
            }
        }
    };

    $scope.refreshObjectsForChosenProfile = function (objectTypeId,channelName,profileId,uniqueObjectCount,channelId) {
        if (profileId) {
            linkChannelId=channelId;
            $scope.refreshButtonLoading=objectTypeId;
            var profileId = profileId;
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

                            k = uniqueObjectCount.indexOf(objectTypeId);

                            if(channelName != 'Google Analytics') {
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
                                if (channelName == 'Facebook')
                                    $scope.facebookObjectList[k] = tempList;
                                else if (channelName == 'Mailchimp')
                                    $scope.mailchimpObjectList[k] = tempList;
                                else if (channelName == 'Aweber')
                                    $scope.aweberObjectList[k] = tempList;
                                else if (channelName == 'linkedin')
                                    $scope.linkedInObjectList[k] = tempList;
                                else if (channelName == 'YouTube')
                                    $scope.youtubeObjectList[k]= tempList;
                                else if (channelName == 'Vimeo')
                                    $scope.vimeoObjectList[k] = tempList;
                                else if (channelName == 'FacebookAds')
                                    $scope.facebookAdsObjectList[k] = tempList;
                                else if (channelName == 'GoogleAdwords')
                                    $scope.googleAdwordsObjectList[k] = tempList;
                            }
                            else {
                                uniqueObjectTypeWithIndex[k] = response.data;
                                $scope.googleAnalyticsObjectList = uniqueObjectTypeWithIndex;
                            }
                            $scope.refreshButtonLoading='';
                        },
                        function errorCallback(error) {
                            $scope.refreshButtonLoading='';
                            if(error.status === 401){
                                if(error.data.errorstatusCode === 1003){
                                    swal({
                                        title: "",
                                        text: "<span style='sweetAlertFont'>Please refresh your profile!</span>",
                                        html: true
                                    });
                                }
                                $scope.getProfileAfterLink();
                            } else
                                swal({
                                    title: "",
                                    text: "<span style='sweetAlertFont'>Something went wrong! Please reopen widgets link</span>",
                                    html: true
                                });
                        }
                    );
                },
                function errorCallback(error) {
                    $scope.refreshButtonLoading=false;
                    swal({
                        title: "",
                        text: "<span style='sweetAlertFont'>Something went wrong! Please reopen widgets link</span>",
                        html: true
                    });
                }
            );
        }
    };

    $scope.addNewProfile = function (profileList,channelName,channelId) {
        var url, title;
        profileListBeforeAddition = profileList;
        linkChannelId=channelId;
        function popupwindow(url, title, w, h) {
            switch (channelName) {
                case 'Facebook':
                    url = '/api/v1/auth/facebook';
                    title = channelName;
                    break;
                case 'Google Analytics':
                    url = '/api/v1/auth/google';
                    title = channelName;
                    break;
                case 'FacebookAds':
                    url = '/api/auth/facebookads';
                    title = channelName;
                    break;
                case 'Twitter':
                    url = '/api/auth/twitter';
                    title = channelName;
                    break;
                case 'Instagram':
                    url = '/api/auth/instagram';
                    title = channelName;
                    break;
                case 'GoogleAdwords':
                    url = '/api/auth/adwords';
                    title = channelName;
                    break;
                case 'YouTube':
                    url = '/api/v1/auth/youTube';
                    title = channelName;
                    break;
                case 'Mailchimp':
                    url = '/api/auth/mailchimp';
                    title = channelName;
                    break;
                case 'linkedin':
                    url = '/api/auth/linkedIn';
                    title = channelName;
                    break;
                case 'Aweber':
                    url = '/api/auth/aweber';
                    title = channelName;
                    break;
                case 'Vimeo':
                    url = '/api/auth/vimeo';
                    title = channelName;
                    break;
                case 'Pinterest':
                    url = '/api/auth/pinterest';
                    title = channelName;
                    break;
            }
            var left = (screen.width / 2) - (w / 2);
            var top = (screen.height / 2) - (h / 2);
            return window.open(url, title, 'toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=no, resizable=no, copyhistory=no, width=' + w + ', height=' + h + ', top=' + top + ', left=' + left);
        }
        popupwindow(url, title, 1000, 500);
    };

    $window.afterAuthentication = function () {
        $scope.getProfileAfterLink();
    };

    $scope.getProfileAfterLink=function(){
        $http({
            method: 'GET', url: '/api/v1/get/profiles/' + linkChannelId
        }).then(
            function successCallback(response) {
                for(var key in $scope.selectedChannelList){
                    if($scope.selectedChannelList[key].id == linkChannelId)
                        $scope.selectedChannelList[key].profileList=response.data.profileList;
                }
            },
            function errorCallback(error) {
                deferred.reject(error);
                swal({
                    title: "",
                    text: "<span style='sweetAlertFont'>Something went wrong! Please reopen widgets link</span>",
                    html: true
                });
            }
        );
    }

    $scope.removeExistingProfile = function (profile,channelId) {
        var profileOptionsModel = profile;
        linkChannelId=channelId;
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
                            $scope.getProfileAfterLink();
                        },
                        function errorCallback(error) {
                            swal({
                                title: "",
                                text: "<span style='sweetAlertFont'>Something went wrong with Profile delink.Please try again</span>",
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
        var channelName='';
        var channelId='';
        var uniqueObjectCount=[];
        var chosenObject=[];
        var profileName='';
        var channel=[];
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

        var widgetCreateList=function(channel,index){
            var deferred = $q.defer();
            if(channel.name=="Moz"){
                channelName=channel.name;
                channelId=channel.id;
                uniqueObjectCount=channel.uniqueObjectCount;
            }
            else if(channel.name==storeChosenObject[index].channelName) {
                channelName=storeChosenObject[index].channelName;
                channelId=channel.id;
                uniqueObjectCount=channel.uniqueObjectCount;
                chosenObject=storeChosenObject[index].objectDetails;
                profileName=storedProfile[index].name;
            }
            if(channelName == "Moz"){
                var mozData = {
                    "channelId": channelId,
                    "mozObject": $scope.weburl,
                    "mozObjectTypeId":uniqueObjectCount[0]
                };
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
                            text: "<span style='sweetAlertFont'>Something went wrong! Please reopen widgets link</span>",
                            html: true
                        });
                    }
                );
                httpPromise.then (
                    function (mozObjectDetails) {
                        //creating widget for moz
                        var inputParams=[];
                        for (var getData in getReferenceWidgetsArr) {
                            if (getReferenceWidgetsArr[getData].channelName == channelName) {
                                var matchingMetric = [];
                                var matchingMetricName = '';
                                var widgetColor = generateChartColours.fetchWidgetColor(channelName);

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
                                    "channelName": channelName
                                };
                                inputParams.push(jsonData);
                            }
                        }
                        deferred.resolve(inputParams);
                    },
                    function errorCallback() {
                        deferred.reject(error);
                        $(".navbar").css('z-index', '1');
                        $(".md-overlay").css("background", "rgba(0,0,0,0.5)");
                        $("#somethingWentWrongModalContent").addClass('md-show');
                        $("#somethingWentWrongText").text("Something went wrong! Please try again");
                    }
                );
            }
            else if(channelName == "FacebookAds"){
                var inputParams=[];
                // function for saving facebook widgets goes here
                for (var getData in getReferenceWidgetsArr) {
                    if (getReferenceWidgetsArr[getData].channelName == channelName) {
                        var matchingMetric = [];
                        var matchingMetricName = '';
                        var widgetColor = generateChartColours.fetchWidgetColor(channelName);
                        for (var i = 0; i < getReferenceWidgetsArr[getData].charts.length; i++) {
                            matchingMetric = [];
                            matchingMetricName = '';
                            for (var j = 0; j < getReferenceWidgetsArr[getData].charts[i].metrics.length; j++) {
                                matchingMetric.push(getReferenceWidgetsArr[getData].charts[i].metrics[j]);
                                if ($scope.selectedLevel == 'fbadaccount') {
                                    matchingMetric[0].objectTypeId = $scope.selectedObjectType._id;
                                    matchingMetric[0].objectId = chosenObject[0]._id;
                                    matchingMetricName = chosenObject[0].name;
                                }
                                else if ($scope.selectedLevel == 'fbAdcampaign') {
                                    matchingMetric[0].objectTypeId = $scope.selectedObjectType._id;
                                    matchingMetric[0].objectId = $scope.campaign._id;
                                    matchingMetricName = $scope.campaign.name;
                                }
                                else if ($scope.selectedLevel == 'fbAdSet') {
                                    matchingMetric[0].objectTypeId = $scope.selectedObjectType._id;
                                    matchingMetric[0].objectId = $scope.adSet._id;
                                    matchingMetricName = $scope.adSet.name;
                                }
                                else if ($scope.selectedLevel == 'fbAdSetAds') {
                                    matchingMetric[0].objectTypeId = $scope.selectedObjectType._id;
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
                            "channelName": channelName
                        };
                        inputParams.push(jsonData);
                    }
                }
                deferred.resolve(inputParams);
            }
            else if(channelName == "GoogleAdwords"){
                // function for saving facebook widgets goes here
                var inputParams=[];
                for (var getData in getReferenceWidgetsArr) {
                    if (getReferenceWidgetsArr[getData].channelName == channelName) {
                        var matchingMetric = [];
                        var matchingMetricName = '';
                        var widgetColor = generateChartColours.fetchWidgetColor(channelName);

                        for (var i = 0; i < getReferenceWidgetsArr[getData].charts.length; i++) {
                            matchingMetric = [];
                            matchingMetricName = '';
                            for (var j = 0; j < getReferenceWidgetsArr[getData].charts[i].metrics.length; j++) {
                                matchingMetric.push(getReferenceWidgetsArr[getData].charts[i].metrics[j]);
                                if ($scope.selectedGoogleLevel == 'adwordaccount') {
                                    matchingMetric[0].objectTypeId = $scope.selectedGoogleObjectType._id;
                                    matchingMetric[0].objectId = chosenObject[0]._id;
                                    matchingMetricName = chosenObject[0].name;
                                }
                                else if ($scope.selectedGoogleLevel == 'adwordCampaign') {
                                    matchingMetric[0].objectTypeId = $scope.selectedGoogleObjectType._id;
                                    matchingMetric[0].objectId = $scope.googleCampaign._id;
                                    matchingMetricName = $scope.googleCampaign.name;
                                }
                                else if ($scope.selectedGoogleLevel == 'adwordAdgroup') {
                                    matchingMetric[0].objectTypeId = $scope.selectedGoogleObjectType._id;
                                    matchingMetric[0].objectId = $scope.googleGroup._id;
                                    matchingMetricName = $scope.googleGroup.name;
                                }
                                else if ($scope.selectedGoogleLevel == 'adwordsAd') {
                                    matchingMetric[0].objectTypeId = $scope.selectedGoogleObjectType._id;
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
                            "channelName":channelName
                        };
                        inputParams.push(jsonData);
                    }
                }
                deferred.resolve(inputParams);
            }
            else {
                // function for saving other widgets goes here
                var inputParams=[];
                for (var getData in getReferenceWidgetsArr) {
                    if (getReferenceWidgetsArr[getData].channelName == channelName) {
                        var matchingMetric = [];
                        var matchingMetricName = '';
                        var widgetColor = generateChartColours.fetchWidgetColor(channelName);

                        for (var i = 0; i < getReferenceWidgetsArr[getData].charts.length; i++) {
                            matchingMetric = [];
                            matchingMetricName = '';
                            for (var j = 0; j < getReferenceWidgetsArr[getData].charts[i].metrics.length; j++) {
                                for (var k = 0; k < chosenObject.length; k++) {
                                    if (getReferenceWidgetsArr[getData].charts[i].metrics[j].objectTypeId === chosenObject[k].objectTypeId) {
                                        matchingMetric.push(getReferenceWidgetsArr[getData].charts[i].metrics[j]);
                                        matchingMetric[0].objectId = chosenObject[k]._id;
                                        matchingMetricName = chosenObject[k].name;
                                    }
                                }
                            }
                            getReferenceWidgetsArr[getData].charts[i].metrics = matchingMetric;
                            getReferenceWidgetsArr[getData].charts[i].objectName = matchingMetricName;
                        }
                        if (channelName === 'Twitter' || channelName === 'Instagram' || channelName === 'Google Analytics' || channelName === 'Pinterest')
                            widgetName = getReferenceWidgetsArr[getData].name + ' - ' + profileName;
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
                            "channelName": channelName
                        };
                        inputParams.push(jsonData);
                    }
                }
                deferred.resolve(inputParams);
            }
            return deferred.promise;
        };

        for (var j = 0; j < $scope.selectedChannelList.length; j++) {
            channel.push(widgetCreateList($scope.selectedChannelList[j],j));
        }
        $q.all(channel).then(
            function (inputParams) {
                var widgets=[];
                for(var i=0;i<inputParams.length;i++){
                    for(var j=0;j<inputParams[i].length;j++)
                        widgets.push(inputParams[i][j])
                }
                $http({
                    method: 'POST',
                    url: '/api/v1/widgets',
                    data: widgets
                }).then(
                    function successCallback(response) {
                        startWidget=1;
                        for (var widgetObjects in response.data.widgetsList) {
                            $rootScope.$broadcast('populateWidget', response.data.widgetsList[widgetObjects]);
                        }
                    },
                    function errorCallback(error) {
                        startWidget = 1;
                        $(".navbar").css('z-index', '1');
                        $(".md-overlay").css("background", "rgba(0,0,0,0.5)");
                        $("#somethingWentWrongModalContent").addClass('md-show');
                        $("#somethingWentWrongText").text("Something went wrong! Please try again");
                        swal({
                            title: "",
                            text: "<span style='sweetAlertFont'>Something went wrong! Please try again!</span>",
                            html: true
                        });
                    }
                );
                getReferenceWidgetsArr = [];
            }
        );

    };

    $scope.storeChannel = function (channel) {
        if(!$scope.selectedTempChannelList.length) {
            getChannelName=channel.name;
            $scope.selectedTempChannelList.push({name: channel.name, id: channel._id});
            for (var i in $scope.channelList) {
                if (channel._id == $scope.channelList[i]._id)
                    $scope.channelList[i].isSelected = 1;
            }
            $("#channellist-" + channel._id).css("border", "2px solid #04509B");
            if (channel.name == "CustomData") {
                $scope.metricContent = true;
                $scope.showCustomContent = false;
                $scope.selectCustomLinkHead = "Step 2 : Custom Data URL";
            }
            else {

                $scope.metricContent = false;
                $scope.showCustomContent = true;
                $scope.selectCustomLinkHead = "Step 2 : Choose your Metrics";
            }
        }
        else{
            if($scope.showCustomContent == false){
                if(channel.name == "CustomData"){
                    removeByAttr($scope.selectedTempChannelList, 'id', channel._id);
                    $("#channellist-" + channel._id).css("border", "2px solid #e7eaec");
                    $scope.customMessageEnable=false;
                }
                else
                    $scope.customMessageEnable=true;
            }
            else {
                if(channel.name == "CustomData")
                    $scope.customMessageEnable=true;
                else {
                    $scope.customMessageEnable=false;
                    var add = 0;
                    for (var data in $scope.selectedTempChannelList) {
                        if ($scope.selectedTempChannelList[data].id == channel._id) {
                            var add = 0;
                            removeByAttr($scope.selectedTempChannelList, 'id', channel._id);
                            $("#channellist-" + channel._id).css("border", "2px solid #e7eaec");

                        }
                        else {
                            var add = 1;
                            $("#channellist-" + channel._id).css("border", "2px solid #04509B");
                        }
                    }
                    if (add == 1) {
                        $scope.selectedTempChannelList.push({name: channel.name, id: channel._id});
                        for (var i in $scope.channelList) {
                            if (channel._id == $scope.channelList[i]._id)
                                $scope.channelList[i].isSelected = 1;
                        }
                    }
                    else {
                        for (var i in $scope.channelList) {
                            if (channel._id == $scope.channelList[i]._id)
                                $scope.channelList[i].isSelected = 0;
                        }
                    }
                }
            }
        }
        if($scope.selectedTempChannelList.length)
            document.getElementById('basicWidgetNextButton1').disabled = false;
        else
            document.getElementById('basicWidgetNextButton1').disabled = true;
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
        $scope.uniqueObjectCount=[];
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
            document.getElementById('basicWidgetNextButton2').disabled = false;
        }
        if (getReferenceWidgetsArr == "" || getReferenceWidgetsArr == "[]" || getReferenceWidgetsArr == null) {
            document.getElementById('basicWidgetNextButton2').disabled = true;
        }
        if (getReferenceWidgetsArr.length) {
            var referenceWidgetLength = getReferenceWidgetsArr.length;

            for (var i = 0; i < referenceWidgetLength; i++) {
                for (var j = 0; j < getReferenceWidgetsArr[i].charts.length; j++) {
                    for (var k = 0; k < getReferenceWidgetsArr[i].charts[j].metrics.length; k++) {
                        $scope.uniqueObjectCount.push({objectType:getReferenceWidgetsArr[i].charts[j].metrics[k].objectTypeId,channelId:getReferenceWidgetsArr[i].charts[j].channelId})
                    }
                }
            }
        }
    };

    $scope.clearReferenceWidget = function () {
        $scope.referenceWidgetsList = [];
        $scope.tokenExpired =[];
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
                        text: "<span style='sweetAlertFont'>Something went wrong! Please reopen widgets link</span>",
                        html: true
                    });
                }
            );
        }
    };

    $scope.objectForWidgetChosen = function (chosenObject,channelName,uniqueObjectCount) {
        document.getElementById('basicWidgetFinishButton').disabled = true;
        if (channelName === 'Google Analytics' && chosenObject) {
            if(chosenObject[0] != '') {
                var objectDetails = JSON.parse(chosenObject[0]);
                chosenObject = [objectDetails[0],objectDetails[1],objectDetails[2],chosenObject[1],chosenObject[2]];
            }
            else
                chosenObject = [null,null,null,chosenObject[1],chosenObject[2]];
        }
        if(!tempChosenObject[chosenObject[4]])
            tempChosenObject[chosenObject[4]]=[];
        if (chosenObject != undefined && chosenObject[1] != undefined){
            tempChosenObject[chosenObject[4]][chosenObject[3]]={name: chosenObject[0],_id: chosenObject[1],objectTypeId: chosenObject[2]};
            if(tempChosenObject[chosenObject[4]].length==uniqueObjectCount.length) {
                var c = 0
                for (var i = 0; i < tempChosenObject[chosenObject[4]].length; i++) {
                    if (tempChosenObject[chosenObject[4]][i] != null)
                        c++;
                }
            }
            else
                var c=0;
            if(c==tempChosenObject[chosenObject[4]].length)
                var channelStatus=true;
            else
                var channelStatus=false;
            storeChosenObject[chosenObject[4]]={channelName:channelName,objectDetails:tempChosenObject[chosenObject[4]],channelStatus:channelStatus};
        }
        else{
            tempChosenObject[chosenObject[4]][chosenObject[3]]=null;
            storeChosenObject[chosenObject[4]]= {channelName:channelName,objectDetails:tempChosenObject[chosenObject[4]],channelStatus:false};
        }
        for (var items in $scope.selectedChannelList){
            if($scope.selectedChannelList[items].name=='Moz'){
                mozPresent=true;
                storeChosenObject[items]={channelName:$scope.selectedChannelList[items].name};
            }
            if($scope.selectedChannelList[items].name=='FacebookAds')
                fbAdsPresent=true;
            if($scope.selectedChannelList[items].name=='GoogleAdwords')
                googleAdsPresent=true;
        }
        var count=0;
        for(var data in storeChosenObject){
            if(storeChosenObject[data].channelStatus==true)
                count++;
        }
        if($scope.selectedChannelList.length==count){
            canFinishEnable=true;
        }
        else if(($scope.selectedChannelList.length-count==1)&&(mozPresent==true)){
            canFinishEnable=true;
        }
        else
            canFinishEnable=false;
        document.getElementById('basicWidgetFinishButton').disabled = true;
        if(channelName=='FacebookAds') {
            if (!chosenObject[0]) {
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
                $scope.fbSelectEnable = false;
                document.getElementById('basicWidgetFinishButton').disabled = true;
            }
            else{
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
                $scope.accountId = chosenObject[5];
                $scope.fbSelectEnable = true;
                $http({
                    method: 'GET', url: '/api/v1/get/objectType/' + $scope.selectedChannelList[chosenObject[4]].id
                }).then(
                    function successCallback(response) {
                        $scope.fbObjectTypeList = response.data.objectType;
                    },
                    function errorCallback(error) {
                        swal({
                            title: "",
                            text: "<span style='sweetAlertFont'>Something went wrong! Please reopen widgets link</span>",
                            html: true
                        });
                    }
                );
            }
        }
        if(channelName=='GoogleAdwords'){
            if (!chosenObject[0]) {
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
                $scope.googleSelectEnable = false;
                document.getElementById('basicWidgetFinishButton').disabled = true;
            }
            else {
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
                $scope.googleAccountId = chosenObject[5];
                $scope.googleSelectEnable = true;
                $http({
                    method: 'GET', url: '/api/v1/get/objectType/' + $scope.selectedChannelList[chosenObject[4]].id
                }).then(
                    function successCallback(response) {
                        $scope.googleObjectTypeList = response.data.objectType;
                    },
                    function errorCallback(error) {
                        swal({
                            title: "",
                            text: "<span style='sweetAlertFont'>Something went wrong! Please reopen widgets link</span>",
                            html: true
                        });
                    }
                );
            }
        }
        $scope.checkComplete();
    };

    $scope.checkComplete=function(){
        if(mozPresent==false && fbAdsPresent==false && googleAdsPresent==false){
            if(canFinishEnable==true)
                document.getElementById('basicWidgetFinishButton').disabled = false;
            else
                document.getElementById('basicWidgetFinishButton').disabled = true;
        }
        else if(mozPresent==true && fbAdsPresent==false && googleAdsPresent==false){
            if(canFinishEnable==true && mozComplete ==true)
                document.getElementById('basicWidgetFinishButton').disabled = false;
            else
                document.getElementById('basicWidgetFinishButton').disabled = true;
        }
        else if(mozPresent==false && fbAdsPresent==true && googleAdsPresent==false){
            if(canFinishEnable==true && fbAdsComplete ==true)
                document.getElementById('basicWidgetFinishButton').disabled = false;
            else
                document.getElementById('basicWidgetFinishButton').disabled = true;
        }
        else if(mozPresent==false && fbAdsPresent==false && googleAdsPresent==true){
            if(canFinishEnable==true && googleAdsComplete ==true)
                document.getElementById('basicWidgetFinishButton').disabled = false;
            else
                document.getElementById('basicWidgetFinishButton').disabled = true;
        }
        else if(mozPresent==true && fbAdsPresent==false && googleAdsPresent==true){
            if(canFinishEnable==true && googleAdsComplete ==true  && mozComplete ==true)
                document.getElementById('basicWidgetFinishButton').disabled = false;
            else
                document.getElementById('basicWidgetFinishButton').disabled = true;
        }
        else if(mozPresent==false && fbAdsPresent==true && googleAdsPresent==true){
            if(canFinishEnable==true && googleAdsComplete ==true && fbAdsComplete ==true)
                document.getElementById('basicWidgetFinishButton').disabled = false;
            else
                document.getElementById('basicWidgetFinishButton').disabled = true;
        }
        else if(mozPresent==true && fbAdsPresent==true && googleAdsPresent==false){
            if(canFinishEnable==true && fbAdsComplete ==true && mozComplete ==true)
                document.getElementById('basicWidgetFinishButton').disabled = false;
            else
                document.getElementById('basicWidgetFinishButton').disabled = true;
        }
        else if(mozPresent==true && fbAdsPresent==true && googleAdsPresent==true){
            if(canFinishEnable==true && fbAdsComplete ==true && mozComplete ==true && googleAdsComplete ==true)
                document.getElementById('basicWidgetFinishButton').disabled = false;
            else
                document.getElementById('basicWidgetFinishButton').disabled = true;
        }
    };

    $scope.errorMessage = true;

    $scope.storeCustomData = function () {
        var jsonData = {
            "dashboardId": $state.params.id,
            "widgetType": "custom",
            "channelId": $scope.selectedTempChannelList[0].id,
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
                document.getElementById('basicWidgetNextButton2').disabled = false;
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
                    text: "<span style='sweetAlertFont'>Something went wrong! Please reopen widgets link</span>",
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