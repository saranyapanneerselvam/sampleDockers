showMetricApp.controller('RecommendedDashboardController', RecommendedDashboardController)

function RecommendedDashboardController($scope, $http, $window, $q, $state, $rootScope, generateChartColours) {
    $scope.currentView = 'step_one';
    $scope.expiredRefreshButton = [];
    $scope.recommendDashboard = [];
    $scope.getChannelList = {};
    $scope.profileList = [];
    $scope.objectList = [];
    $scope.tempList = [];
    $scope.recommendeDashboardName;
    $scope.metricList = {};
    $scope.referenceWidgetsList = [];
    $scope.storedObjects = {};
    $scope.referencechannelList = [];
    $scope.storedUserChosenValues = [];
    $scope.profileOptionsModel = [];
    $scope.dashboard = {};
    $scope.objectTypeList =[];
    $scope.fbAdObjId='';
    $scope.gaAdObjId='';
    $scope.canManage = true;
    $scope.recommendedRefreshButton='';
    $scope.tokenExpired=[];
    var progressStart=0;

    angular.element(document).ready(function () {
        $('.ladda-button').addClass('icon-arrow-right');
        Ladda.bind( '.ladda-button',{
            callback: function( instance ){
                $scope.createRecommendedDashboard();
                $('.ladda-button').removeClass('icon-arrow-right');
                var progress = 0;
                var interval = setInterval( function(){
                    progress = Math.min( progress + Math.random() * 0.1, 1 );
                    instance.setProgress( progress );
                    if( progress === 1 && progressStart===1){
                        instance.stop();
                        clearInterval( interval );
                        $scope.ok();
                    }
                }, 50 );
            }
        });


    });
    
    $scope.dropdownWidth=function(hasnoAccess,tokenExpired){
        if(hasnoAccess==true || tokenExpired==true){
            return ('col-sm-'+10+' col-md-'+10+' col-lg-'+10+' col-xs-10');
        }
    }

    $scope.changeViewsInBasicWidget = function (obj) {
        $scope.currentView = obj;
        if ($scope.currentView === 'step_one') {
            $scope.clearReferenceWidget();
            $scope.listOfRecommendedDashboard();
        }
    };

    $scope.clearReferenceWidget = function () {
        $scope.objectList = [];
        $scope.profileList = [];
        $scope.storedUserChosenValues = [];
        $scope.recommendDashboard = [];
    };

    $scope.listOfRecommendedDashboard = function () {
        $http({
            method: 'GET',
            url: 'api/get/recommendDashboard'
        }).then(function successCallback(response) {
            $scope.wholeDataDetail = response.data;
            for (var i in response.data) {
                $scope.recommendDashboard.push(response.data[i]);
            }
        }, function errorCallback(error) {
            swal({
                title: "",
                text: "<span style='sweetAlertFont'>Something went wrong! Please reopen recommended dashboards link</span>",
                html: true
            });
        });
    };
    $scope.closeRecommendedDashboardModal=function(){
        changeState().then(
            function () {
                $state.go('app.reporting.dashboard',{id:$rootScope.stateDashboard._id});
            }
        )
    }
    function changeState(){
        var deferred = $q.defer();
        CloseModal();
        function CloseModal(){
            $scope.ok();
            deferred.resolve("open")
        }
        return deferred.promise;
    }
    $scope.getProfileForChosenChannel = function (dashboards) {
        $scope.fullOfDashboard = dashboards;
        $scope.getChannelList = dashboards.channels;
        $scope.referenceWidgetsList = dashboards.referenceWidgets;
        var tempProfileList = [];
        for (var key in  $scope.getChannelList) {
            tempProfileList.push($scope.correspondingProfile($scope.getChannelList[key]._id, key));
        }
        $q.all(tempProfileList).then(
            function successCallback(tempProfileList) {
                $scope.profileList = tempProfileList;
            },
            function errorCallback(err) {
                swal({
                    title: "",
                    text: "<span style='sweetAlertFont'>Something went wrong! Please reopen recommended dashboards link</span>",
                    html: true
                });
            }
        );
    };
    $scope.correspondingProfile = function (profileId, index) {
        var deferred = $q.defer();
        $http({
            method: 'GET',
            url: '/api/v1/get/profiles/' + profileId
        }).then(
            function successCallback(response) {
                deferred.resolve({
                    profiles: response.data.profileList
                });
                $scope.objectList = [];
                $http({
                    method: 'GET', url: '/api/v1/get/objectType/' + profileId
                }).then(
                    function successCallback(response) {
                        $scope.objectTypeList=response.data.objectType;
                        for(var i=0;i<$scope.objectTypeList.length;i++){
                            if($scope.objectTypeList[i].type =='fbadaccount')
                                $scope.fbAdObjId = $scope.objectTypeList[i]._id;
                            else if($scope.objectTypeList[i].type =='adwordaccount')
                                $scope.gaAdObjId = $scope.objectTypeList[i]._id;
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
            },
            function errorCallback(error) {
                deferred.reject(error);
                swal({
                    title: "",
                    text: "<span style='sweetAlertFont'>Something went wrong! Please reopen recommended dashboards link</span>",
                    html: true
                });
            }
        );
        return deferred.promise;
    };

    $scope.getObjectsForChosenProfile = function (profileObj, index) {
        $scope.tokenExpired[index] = false;
        if (!profileObj) {
            document.getElementById('basicWidgetFinishButton').disabled = true;
            $scope.objectList[index] = null;
            if($scope.getChannelList[index].name === 'Google Analytics'){
                this.objectOptionsModel1='';
                $scope.objectForWidgetChosen($scope.objectList[index], index);
            }
            if ($scope.getChannelList[index].name === 'Twitter' ||  $scope.getChannelList[index].name === 'Instagram' || (($scope.getChannelList[index].name === 'GoogleAdwords')&&($scope.canManage == false))) {
                $scope.objectForWidgetChosen($scope.objectList[index], index);
            }
        }
        else {
            if($scope.getChannelList[index].name === 'Google Analytics'){
				this.objectOptionsModel1='';			
				document.getElementById('basicWidgetFinishButton').disabled = true;
			}
            if ((profileObj.canManageClients === false)&&($scope.getChannelList[index].name === 'GoogleAdwords')){
                $scope.canManage = false;
                $scope.objectList[index]=null;
            }
            if (profileObj.canManageClients === true){
                document.getElementById('basicWidgetFinishButton').disabled = true;
                $scope.canManage = true;
            }
            if ($scope.profileOptionsModel.expiresIn != undefined)
                $scope.checkExpiresIn = new Date($scope.profileOptionsModel.expiresIn);
            $scope.tokenExpired[index] = false;
            var expiresIn = profileObj.expiresIn;
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
                url: '/api/v1/get/objects/' + profileObj._id
            }).then(
                function successCallback(response) {
                    if ($scope.getChannelList[index].name === 'FacebookAds'){
                        $scope.expiredRefreshButton[index] = $scope.getChannelList[index].name;
                        $scope.objectList[index] = [];
                        for(var j=0;j<response.data.objectList.length;j++) {
                            if(response.data.objectList[j].objectTypeId == $scope.fbAdObjId) {
                                $scope.objectList[index].push(response.data.objectList[j]);
                            }
                        }
                    }
                    else if($scope.getChannelList[index].name === 'GoogleAdwords'){
                        $scope.expiredRefreshButton[index] = $scope.getChannelList[index].name;
                        $scope.objectList[index] = [];
                        for(var j=0;j<response.data.objectList.length;j++) {
                            if (response.data.objectList[j].objectTypeId == $scope.gaAdObjId) {
                                $scope.objectList[index].push(response.data.objectList[j]);
                            }
                        }
                    }
                    else {
                        $scope.expiredRefreshButton[index] = $scope.getChannelList[index].name;
                        $scope.objectList[index] = response.data.objectList;
                    }
                    if ($scope.getChannelList[index].name === 'Twitter' ||$scope.getChannelList[index].name === 'Instagram') {
                        $scope.expiredRefreshButton[index] = null;
                        $scope.objectForWidgetChosen($scope.objectList[index][0], index);
                    }
                    if ((profileObj.canManageClients === false)&&($scope.getChannelList[index].name === 'GoogleAdwords')){
                        $scope.objectForWidgetChosen($scope.objectList[index][0], index);
                    }
                },
                function errorCallback(error) {
                    swal({
                        title: "",
                        text: "<span style='sweetAlertFont'>Something went wrong! Please reopen recommended dashboards link</span>",
                        html: true
                    });
                }
            );
        }
    };

    $scope.objectForWidgetChosen = function (objectList, index) {
        if ((typeof objectList==='string')&&(objectList!='')) {
            var parsedObjectList = JSON.parse(objectList);
            objectList = parsedObjectList;
        }
        if (objectList != null && $scope.currentView == 'step_two') {
            if((objectList !='')&&(this.profileOptionsModel[index])) {
                $scope.storedUserChosenValues[index] = {
                    object: objectList,
                    profile: this.profileOptionsModel[index]
                };
            }
            else{
                $scope.storedUserChosenValues[index] = {
                    object: null,
                    profile: null
                };
            }
        }
        else if (objectList == null && $scope.currentView == 'step_two') {
            $scope.storedUserChosenValues[index] = {
                object: null,
                profile: null
            };
        }
        else if (objectList != null && $scope.currentView == 'step_one') {
            $scope.storedUserChosenValues = null;
        }
        var chosenObjectCount = 0;
        for (var i = 0; i < $scope.storedUserChosenValues.length; i++) {
            if ($scope.storedUserChosenValues[i] != null) {
                if ($scope.storedUserChosenValues[i].object != null) {
                    chosenObjectCount++;
                }
            }
        }
        if (chosenObjectCount == $scope.getChannelList.length)
            document.getElementById('basicWidgetFinishButton').disabled = false;
        else
            document.getElementById('basicWidgetFinishButton').disabled = true;
    };

    $scope.addNewProfile = function (index) {
        var url, title;

        function popupwindow(url, title, w, h) {
            switch ($scope.getChannelList[index].name) {
                case 'Facebook':
                    url = '/api/v1/auth/facebook';
                    title = $scope.getChannelList[index].name;
                    break;
                case 'Google Analytics':
                    url = '/api/v1/auth/google';
                    title = $scope.getChannelList[index].name;
                    break;
                case 'FacebookAds':
                    url = '/api/auth/facebookads';
                    title = $scope.getChannelList[index].name;
                    break;
                case 'Twitter':
                    url = '/api/auth/twitter';
                    title = $scope.getChannelList[index].name;
                    break;
                case 'Instagram' :
                    url = '/api/auth/instagram';
                    title = $scope.getChannelList[index].name;
                    break;
                case 'GoogleAdwords' :
                    url = '/api/auth/adwords';
                    title = $scope.getChannelList[index].name;
                    break;
            }
            var left = (screen.width / 2) - (w / 2);
            var top = (screen.height / 2) - (h / 2);
            $scope.tokenExpired[index] = false;
            return window.open(url, title, 'toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=no, resizable=no, copyhistory=no, width=' + w + ', height=' + h + ', top=' + top + ', left=' + left);
        }

        popupwindow(url, title, 1000, 500);
    };

    $window.afterAuthentication = function () {
        $scope.getProfileForChosenChannel($scope.fullOfDashboard);
    };

    $scope.removeExistingProfile = function (index) {
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
                if($scope.profileOptionsModel[index]) {

                    $http({
                        method: 'POST',
                        url: '/api/v1/post/removeProfiles/' + $scope.profileOptionsModel[index]._id
                    }).then(
                        function successCallback(response) {
                            $scope.getProfileForChosenChannel($scope.fullOfDashboard);
                        },
                        function errorCallback(error) {
                            swal({
                                title: "",
                                text: "<span style='sweetAlertFont'>Something went wrong! Please reopen recommended dashboards link</span>",
                                html: true
                            });
                        }
                    );
                }
            }
        );
    };

    $scope.refreshObjectsForChosenProfile = function (index) {
        if($scope.getChannelList[index].name === 'Google Analytics') {
            this.objectOptionsModel1[index] = '';
            $scope.objectList[index] = '';
        }
        if(this.profileOptionsModel[index]._id) {
            $scope.recommendedRefreshButton=$scope.getChannelList[index].name;
            switch ($scope.getChannelList[index].name) {
                case 'Facebook':
                    $scope.objectType = 'page';
                    break;
                case 'Google Analytics':
                    $scope.objectType = 'gaview';
                    break;
                case 'FacebookAds':
                    $scope.objectType = 'fbadaccount';
                    break;
                case 'Twitter':
                    $scope.objectType = 'tweet';
                    break;
                case 'Instagram' :
                    $scope.objectType = 'instagram';
                    break;
                case 'GoogleAdwords' :
                    $scope.objectType = 'adwordaccount';
                    break;
            }
            $http({
                method: 'GET',
                url: '/api/v1/channel/profiles/objectsList/' + this.profileOptionsModel[index]._id + '?objectType=' + $scope.objectType
            }).then(
                function successCallback(response) {
                    $scope.objectList[index] = response.data;
                    $scope.recommendedRefreshButton='';
                },
                function errorCallback(error) {
                    $scope.recommendedRefreshButton='';
                    if(error.status === 401){
                        if(error.data.errorstatusCode === 1003){
                            $scope.recommendedRefreshButton='';
                            swal({
                                title: "",
                                text: "<span style='sweetAlertFont'>Please refresh your profile</span>",
                                html: true
                            });
                            $scope.getProfileForChosenChannel($scope.fullOfDashboard);
                        }
                    } else
                        swal({
                            title: "",
                            text: "<span style='sweetAlertFont'>Something went wrong! Please reopen widgets link</span>",
                            html: true
                        });
                }
            );
        }
    };

    $scope.createRecommendedDashboard = function () {
        var matchingMetric = [];
        var jsonData = {
            name: $scope.recommendeDashboardName
        };
        $http({
            method: 'POST',
            url: '/api/v1/create/dashboards',
            data: jsonData
        }).then(
            function successCallback(response) {

                var inputParams = [];
                var dashboardId = response.data;
                //progressStart=1;
                $scope.ok();
                for (var widget = 0; widget < $scope.referenceWidgetsList.length; widget++) {
                    for (var chart = 0; chart < $scope.referenceWidgetsList[widget].charts.length; chart++) {
                        for (var j = 0; j < $scope.storedUserChosenValues.length; j++) {
                            if ($scope.referenceWidgetsList[widget].charts[chart].channelId === $scope.storedUserChosenValues[j].profile.channelId) {
                                matchingMetric = [];
                                for (var m = 0; m < $scope.referenceWidgetsList[widget].charts[chart].metrics.length; m++) {
                                    if ($scope.referenceWidgetsList[widget].charts[chart].metrics[m].objectTypeId === $scope.storedUserChosenValues[j].object.objectTypeId) {
                                        matchingMetric.push($scope.referenceWidgetsList[widget].charts[chart].metrics[m]);
                                        matchingMetric[0].objectId = $scope.storedUserChosenValues[j].object._id;
                                    }
                                }
                                for (var n = 0; n < $scope.getChannelList.length; n++) {
                                    var widgetName, channelName;
                                    if ($scope.storedUserChosenValues[j].profile.channelId === $scope.getChannelList[n]._id) {
                                        var widgetColor = generateChartColours.fetchWidgetColor($scope.getChannelList[n].name);
                                        if ($scope.getChannelList[n].name === 'Twitter' || $scope.getChannelList[n].name === 'Instagram' || $scope.storedChannelName === 'Google Analytics')
                                            widgetName = $scope.referenceWidgetsList[widget].name + ' - ' + $scope.storedUserChosenValues[j].profile.name;
                                        else
                                            widgetName = $scope.referenceWidgetsList[widget].name + ' - ' + $scope.storedUserChosenValues[j].object.name;
                                        channelName = $scope.getChannelList[n].name;
                                    }

                                }
                            }
                        }
                        $scope.referenceWidgetsList[widget].charts[chart].metrics = matchingMetric;
                    }

                    var jsonData = {
                        "dashboardId": response.data,
                        "widgetType": $scope.referenceWidgetsList[widget].widgetType,
                        "name": widgetName,
                        "description": $scope.referenceWidgetsList[widget].description,
                        "charts": $scope.referenceWidgetsList[widget].charts,
                        "order": $scope.referenceWidgetsList[widget].order,
                        "offset": $scope.referenceWidgetsList[widget].offset,
                        "size": $scope.referenceWidgetsList[widget].size,
                        "minSize": $scope.referenceWidgetsList[widget].minSize,
                        "maxSize": $scope.referenceWidgetsList[widget].maxSize,
                        "isAlert": $scope.referenceWidgetsList[widget].isAlert,
                        "color": widgetColor,
                        "channelName": channelName
                    };
                    inputParams.push(jsonData);
                }
                $http({
                    method: 'POST',
                    url: '/api/v1/widgets',
                    data: inputParams
                }).then(
                    function successCallback(response) {
                        $state.go('app.reporting.dashboard', {id: dashboardId});
                    },
                    function errorCallback(error) {
                        progressStart=1;
                        swal({
                            title: "",
                            text: "<span style='sweetAlertFont'>Something went wrong! Please reopen recommended dashboards link</span>",
                            html: true
                        });
                    }
                );
            },
            function errorCallback(error) {
                progressStart=1;
                swal({
                    title: "",
                    text: "<span style='sweetAlertFont'>Please try again! Something is missing</span>",
                    html: true
                });
            }
        );
    };
}