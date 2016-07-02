showMetricApp.controller('BasicWidgetController', BasicWidgetController)

function BasicWidgetController($scope, $http, $state, $rootScope, $window, $stateParams, generateChartColours) {
    $scope.currentView = 'step_one';
    $scope.objectList = {};
    $scope.metricList = {};
    $scope.referenceWidgetsList = [];
    $scope.profileList = {};
    $scope.storedObject = {};
    $scope.storedProfile = {};
    $scope.widgetType = $stateParams.widgetType;
    var getChannelName = "";
    var getCustomWidgetObj = {};
    var getCustomWidgetId = "";
    var isSelectedMetric = "";
    var referenceWidgetsData = {};
    var getReferenceWidgetsArr = new Array();
    $scope.tokenExpired = false;

    $scope.changeViewsInBasicWidget = function (obj) {
        $scope.currentView = obj;
        $rootScope.currentModalView = obj;
        if ($scope.currentView === 'step_one') {
            document.getElementById('basicWidgetBackButton1').disabled = true;
            document.getElementById('basicWidgetNextButton').disabled = true;
            $scope.listChannels();
            $scope.clearReferenceWidget();
            getReferenceWidgetsArr=[];
        } else if ($scope.currentView === 'step_two') {
            document.getElementById('basicWidgetBackButton1').disabled = false;
            $scope.clearReferenceWidget();
            if (getChannelName == "CustomData") {
                $scope.storeCustomData();
                $("#basicWidgetNextButton").hide();
                $("#basicWidgetFinishButtonCustom").show();
            }
            else {
                //$scope.clearReferenceWidget();
                $scope.getReferenceWidgetsForChosenChannel();
                $scope.getProfilesForDropdown();
                $("#basicWidgetNextButton").show();
                $("#basicWidgetFinishButtonCustom").hide();
            }
        } else if ($scope.currentView === 'step_three') {
            document.getElementById('basicWidgetBackButton1').disabled = false;
        }
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
            url: '/api/v1/get/referenceWidgets/' + $scope.widgetType
        }).then(
            function successCallback(response) {
                for (var i = 0; i < response.data.referenceWidgets.length; i++) {
                if (response.data.referenceWidgets[i].charts[0].channelId === $scope.storedChannelId) {
                    var IsAlreadyExist = 0;
                    for(var getData in getReferenceWidgetsArr){
                        if(getReferenceWidgetsArr[getData]._id==response.data.referenceWidgets[i]._id){
                            isSelectedMetric=1;
                            referenceWidgetsData = {
                                '_id':response.data.referenceWidgets[i]._id,
                                'charts':response.data.referenceWidgets[i].charts,
                                'created':response.data.referenceWidgets[i].created,
                                'description':response.data.referenceWidgets[i].description,
                                'maxSize':response.data.referenceWidgets[i].maxSize,
                                'minSize':response.data.referenceWidgets[i].minSize,
                                'name':response.data.referenceWidgets[i].name,
                                'size':response.data.referenceWidgets[i].size,
                                'updated':response.data.referenceWidgets[i].updated,
                                'widgetType':response.data.referenceWidgets[i].widgetType,
                                'isSelectedMetric':isSelectedMetric,
                                'border':'2px solid #04509B'
                            };
                            IsAlreadyExist = 1;
                        }
                    }

                    if (IsAlreadyExist != 1) {
                        isSelectedMetric=0;
                        referenceWidgetsData = {
                            '_id':response.data.referenceWidgets[i]._id,
                            'charts':response.data.referenceWidgets[i].charts,
                            'created':response.data.referenceWidgets[i].created,
                            'description':response.data.referenceWidgets[i].description,
                            'maxSize':response.data.referenceWidgets[i].maxSize,
                            'minSize':response.data.referenceWidgets[i].minSize,
                            'name':response.data.referenceWidgets[i].name,
                            'size':response.data.referenceWidgets[i].size,
                            'updated':response.data.referenceWidgets[i].updated,
                            'widgetType':response.data.referenceWidgets[i].widgetType,
                            'isSelectedMetric':isSelectedMetric,
                            'border':'2px solid #e7eaec'
                        };
                        document.getElementById('basicWidgetNextButton').disabled = false;
                    }

                    if(getReferenceWidgetsArr=="" || getReferenceWidgetsArr=="[]" || getReferenceWidgetsArr==null)
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

        $http({
            method: 'GET',
            url: '/api/v1/get/metrics/' + $scope.storedChannelId
        }).then(
            function successCallback(response) {
                $scope.metricList = response.data.metricsList;
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
        $http({
            method: 'GET', url: '/api/v1/get/profiles/' + $scope.storedChannelId
        }).then(
            function successCallback(response) {
                $scope.profileList = response.data.profileList;
                $scope.objectList = [];
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

    $scope.getObjectsForChosenProfile = function () {
        $scope.checkExpiresIn = null;
        if (!this.profileOptionsModel) {
            $scope.objectList = null;
            if ($scope.storedChannelName === 'Twitter' || $scope.storedChannelName === 'Instagram') {
                $scope.objectForWidgetChosen($scope.objectList);
            }
        }
        else {
            console.log('this.profileOptionsModel.canManageClients',this.profileOptionsModel.canManageClients)
            if(this.profileOptionsModel.canManageClients===false)
                $scope.canManageClients = true;
            else  $scope.canManageClients = false;
            if(this.profileOptionsModel.expiresIn!= undefined)
                $scope.checkExpiresIn = new Date(this.profileOptionsModel.expiresIn);
            $scope.tokenExpired = false;
            var profileId = this.profileOptionsModel._id;
            var expiresIn = this.profileOptionsModel.expiresIn;
            var currentDate = new Date();
            var newexpiresIn = new Date(expiresIn);
            if (currentDate <= newexpiresIn &&  expiresIn != null) {
                //token is valid
                $scope.tokenExpired = false;
            }
            else if (expiresIn === undefined || expiresIn === null) {
                $scope.tokenExpired = false;
            }
            else {
                $scope.tokenExpired = true;
            }
            $scope.storedProfile = this.profileOptionsModel;
            $http({
                method: 'GET',
                url: '/api/v1/get/objects/' + profileId
            }).then(
                function successCallback(response) {
                    $scope.objectList = response.data.objectList;
                    if ($scope.storedChannelName === 'Twitter' || $scope.storedChannelName === 'Instagram' || $scope.canManageClients === true) {
                        $scope.objectForWidgetChosen([$scope.objectList[0].name,$scope.objectList[0]._id,$scope.objectList[0].objectTypeId]);
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
    };

    $scope.refreshObjectsForChosenProfile = function () {
        if (this.profileOptionsModel._id) {
            switch ($scope.storedChannelName) {
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
                url: '/api/v1/channel/profiles/objectsList/' + this.profileOptionsModel._id + '?objectType=' + $scope.objectType
            }).then(
                function successCallback(response) {
                    $scope.objectList = response.data;
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

    $scope.addNewProfile = function () {
        var url, title;

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
        var profileOptionsModel = this.profileOptionsModel;
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
        var chartColors = [], widgetName;
        $(".navbar").css('z-index','1');
        $(".md-overlay").css("background","rgba(0,0,0,0.5)");
        $("#getLoadingModalContent").addClass('md-show');
        if (getChannelName == "CustomData") {
            getCustomWidgetObj = {
                '_id': getCustomWidgetId,
                'widgetType': 'custom'
            };
            // final function after custom api url creation goes here
            $rootScope.$broadcast('populateWidget', getCustomWidgetObj);
        }
        else {
            // function for saving other widgets goes here
            for(var getData in getReferenceWidgetsArr){
                var matchingMetric = [];
                var inputParams = [];
                var chartCount = getReferenceWidgetsArr[getData].charts.length;
                //var chartColors = generateChartColours.fetchRandomColors(chartCount);
                var widgetColor = generateChartColours.fetchWidgetColor($scope.storedChannelName);

                for (var i = 0; i < getReferenceWidgetsArr[getData].charts.length; i++) {
                    matchingMetric = [];
                    for (var j = 0; j < getReferenceWidgetsArr[getData].charts[i].metrics.length; j++) {
                        if (getReferenceWidgetsArr[getData].charts[i].metrics[j].objectTypeId === $scope.storedObject.objectTypeId) {
                            matchingMetric.push(getReferenceWidgetsArr[getData].charts[i].metrics[j]);
                            matchingMetric[0].objectId = $scope.storedObject._id;
                        }
                    }
                    getReferenceWidgetsArr[getData].charts[i].metrics = matchingMetric;
                    //$scope.storedReferenceWidget.charts[i].colour = chartColors[i];
                    getReferenceWidgetsArr[getData].charts[i].objectName = $scope.storedObject.name;
                }
                if($scope.storedChannelName === 'Twitter' || $scope.storedChannelName === 'Instagram')
                    widgetName = getReferenceWidgetsArr[getData].name + ' - ' + $scope.storedProfile.name;
                else
                    widgetName = getReferenceWidgetsArr[getData].name + ' - ' + $scope.storedProfile.name + ' - ' + $scope.storedObject.name;

                var jsonData = {
                    "dashboardId": $state.params.id,
                    "widgetType": $scope.widgetType,
                    "name": widgetName,
                    "description": getReferenceWidgetsArr[getData].description,
                    "charts": getReferenceWidgetsArr[getData].charts,
                    "order": getReferenceWidgetsArr[getData].order,
                    "offset": getReferenceWidgetsArr[getData].offset,
                    "size": getReferenceWidgetsArr[getData].size,
                    "minSize": getReferenceWidgetsArr[getData].minSize,
                    "maxSize": getReferenceWidgetsArr[getData].maxSize,
                    "color": widgetColor
                };
                inputParams.push(jsonData);

                $http({
                    method: 'POST',
                    url: '/api/v1/widgets',
                    data: inputParams
                }).then(
                    function successCallback(response) {
                        $("#getLoadingModalContent").removeClass('md-show');
                        for(widgetObjects in response.data.widgetsList) {
                            $rootScope.$broadcast('populateWidget', response.data.widgetsList[widgetObjects]);
                        }
                    },
                    function errorCallback(error) {
                        $("#getLoadingModalContent").removeClass('md-show');
                        $(".navbar").css('z-index','1');
                        $(".md-overlay").css("background","rgba(0,0,0,0.5)");
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

    var removeByAttr = function(arr, attr, value){
        var i = arr.length;
        while(i--){
            if( arr[i]
                && arr[i].hasOwnProperty(attr)
                && (arguments.length > 2 && arr[i][attr] === value ) ){
                arr.splice(i,1);
            }
        }
        return arr;
    };
    
    $scope.storeReferenceWidget = function () {
        $scope.storedReferenceWidget = this.referenceWidgets;

        var IsAlreadyExist = 0;
        for(var getData in getReferenceWidgetsArr){
            if(getReferenceWidgetsArr[getData]._id==this.referenceWidgets._id){
                removeByAttr(getReferenceWidgetsArr, '_id', getReferenceWidgetsArr[getData]._id);
                $("#referenceWidgets-"+this.referenceWidgets._id).css("border","2px solid #e7eaec");
                $("#triangle-topright-"+this.referenceWidgets._id).removeClass("triangle-topright");
                $("#metricNames-"+this.referenceWidgets._id).removeClass("getMetricName");
                $("#getCheck-"+this.referenceWidgets._id).hide();
                IsAlreadyExist = 1;
            }
        }

        if (IsAlreadyExist != 1) {
            getReferenceWidgetsArr.push(this.referenceWidgets);
            $("#referenceWidgets-"+this.referenceWidgets._id).css("border","2px solid #04509B");
            $("#triangle-topright-"+this.referenceWidgets._id).addClass("triangle-topright");
            $("#metricNames-"+this.referenceWidgets._id).addClass("getMetricName");
            $("#getCheck-"+this.referenceWidgets._id).show();
            document.getElementById('basicWidgetNextButton').disabled = false;
        }

        if(getReferenceWidgetsArr=="" || getReferenceWidgetsArr=="[]" || getReferenceWidgetsArr==null){
            document.getElementById('basicWidgetNextButton').disabled = true;
        }
    };

    $scope.clearReferenceWidget = function () {
        $scope.referenceWidgetsList = [];
        $scope.tokenExpired = false;
        var lastWidgetId = $rootScope.customWidgetId;
        if (lastWidgetId != undefined) {
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

    $scope.objectForWidgetChosen = function (objectOptionsModel) {
        if ($scope.storedChannelName === 'Google Analytics' && objectOptionsModel)
            objectOptionsModel = JSON.parse(objectOptionsModel);

        if(objectOptionsModel != undefined && objectOptionsModel[1] != undefined) {
            $scope.storedObject = {
                name: objectOptionsModel[0],
                _id: objectOptionsModel[1],
                objectTypeId: objectOptionsModel[2]
            };
        } else {
            $scope.storedObject = null;
        }

        if ($scope.storedObject != null && (  $scope.checkExpiresIn === null || $scope.checkExpiresIn >= new Date()))
            document.getElementById('basicWidgetFinishButton').disabled = false;
        else
            document.getElementById('basicWidgetFinishButton').disabled = true;
    };

    $scope.errorMessage = true;
    $scope.storeCustomData = function () {
        var jsonData = {
            "dashboardId": $state.params.id,
            "widgetType": "custom",
            "channelId": $scope.storedChannelId
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

    $scope.ComingSoonAlert = function (){
        swal("Coming Soon!");
    };

}