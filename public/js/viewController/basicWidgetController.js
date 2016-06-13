showMetricApp.controller('BasicWidgetController', BasicWidgetController)

function BasicWidgetController($scope, $http, $state, $rootScope, $window, $stateParams, generateChartColours) {
    $scope.currentView = 'step_one';
    $scope.objectList = {};
    $scope.metricList = {};
    $scope.referenceWidgetsList = [];
    $scope.profileList = {};
    $scope.storedObject = {};
    $scope.widgetType = $stateParams.widgetType;
    var getChannelName = "";
    var getCustomWidgetObj = {};
    var getCustomWidgetId = "";
    $scope.tokenExpired = false;


    console.log('widgetType', $scope.widgetType);

    $scope.changeViewsInBasicWidget = function (obj) {
        $scope.currentView = obj;
        $rootScope.currentModalView = obj;
        if ($scope.currentView === 'step_one') {
            document.getElementById('basicWidgetBackButton1').disabled = true;
            document.getElementById('basicWidgetNextButton').disabled = true;
            $scope.listChannels();
            $scope.clearReferenceWidget();
        } else if ($scope.currentView === 'step_two') {
            document.getElementById('basicWidgetBackButton1').disabled = false;
            if (getChannelName == "CustomData") {
                $scope.storeCustomData();
            }
            else {
                //$scope.clearReferenceWidget();
                $scope.getReferenceWidgetsForChosenChannel();
                $scope.getProfilesForDropdown();
            }
        } else if ($scope.currentView === 'step_three') {
            document.getElementById('basicWidgetBackButton1').disabled = false;
        }
    };

    $scope.listChannels = function () {
        $http({
            method: 'GET',
            url: '/api/v1/get/channels'
        }).then(function successCallback(response) {
            $scope.channelList = response.data;
        }, function errorCallback(error) {
            console.log('Error in finding channels');
        });
    };

    $scope.getReferenceWidgetsForChosenChannel = function () {
        $http({
            method: 'GET',
            url: '/api/v1/get/referenceWidgets/' + $scope.widgetType
        }).then(function successCallback(response) {
            for (i = 0; i < response.data.referenceWidgets.length; i++) {
                if (response.data.referenceWidgets[i].charts[0].channelId === $scope.storedChannelId) {
                    $scope.referenceWidgetsList.push(response.data.referenceWidgets[i]);
                }
            }
        }, function errorCallback(error) {
            console.log('Error in finding reference widgets', error);
        });

        $http({
            method: 'GET',
            url: '/api/v1/get/metrics/' + $scope.storedChannelId
        }).then(function successCallback(response) {
            $scope.metricList = response.data.metricsList;
        }, function errorCallback(error) {
            console.log('Error in finding metrics');
        });
    };

    $scope.getProfilesForDropdown = function () {
        $http({
            method: 'GET', url: '/api/v1/get/profiles/' + $scope.storedChannelId
        }).then(function successCallback(response) {
            $scope.profileList = response.data.profileList;
            $scope.objectList = [];

        }, function errorCallback(error) {
            console.log('Error in finding profiles');
        });
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
            if(this.profileOptionsModel.expiresIn!= undefined)
                $scope.checkExpiresIn = new Date(this.profileOptionsModel.expiresIn);
            $scope.tokenExpired = false;
            var profileId = this.profileOptionsModel._id;
            var expiresIn = this.profileOptionsModel.expiresIn;
            var currentDate = new Date();
            var newexpiresIn = new Date(expiresIn);
            if (currentDate <= newexpiresIn) {
                //token is valid
                $scope.tokenExpired = false;
            }
            else if (expiresIn === undefined)
                $scope.tokenExpired = false;
            else {
                console.log('else');
                $scope.tokenExpired = true;
            }
            $http({
                method: 'GET',
                url: '/api/v1/get/objects/' + profileId
            }).then(function successCallback(response) {
                $scope.objectList = response.data.objectList;
                if ($scope.storedChannelName === 'Twitter' || $scope.storedChannelName === 'Instagram') {
                     $scope.objectForWidgetChosen([$scope.objectList[0].name,$scope.objectList[0]._id,$scope.objectList[0].objectTypeId]);
                }
            }, function errorCallback(error) {
                console.log(error);
            });
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
            }
            $http({
                method: 'GET',
                url: '/api/v1/channel/profiles/objectsList/' + this.profileOptionsModel._id + '?objectType=' + $scope.objectType
            }).then(function successCallback(response) {
                $scope.objectList = response.data;
            }, function errorCallback(error) {
                console.log(error);
            });
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
        if (this.profileOptionsModel) {
            $http({
                method: 'POST',
                url: '/api/v1/post/removeProfiles/' + this.profileOptionsModel._id
            }).then(function successCallback(response) {
                $scope.getProfilesForDropdown();
            }, function errorCallback(error) {
                console.log('Error in deleting profile', error)
            });
        }
    };

    $scope.createAndFetchBasicWidget = function () {
        var chartColors = [];

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
            var matchingMetric = [];
            var inputParams = [];
            var chartCount = $scope.storedReferenceWidget.charts.length;
            //var chartColors = generateChartColours.fetchRandomColors(chartCount);
            var widgetColor = generateChartColours.fetchWidgetColor($scope.storedChannelName);

            for (var i = 0; i < $scope.storedReferenceWidget.charts.length; i++) {
                matchingMetric = [];
                for (var j = 0; j < $scope.storedReferenceWidget.charts[i].metrics.length; j++) {
                    if ($scope.storedReferenceWidget.charts[i].metrics[j].objectTypeId === $scope.storedObject.objectTypeId) {
                        matchingMetric.push($scope.storedReferenceWidget.charts[i].metrics[j]);
                        matchingMetric[0].objectId = $scope.storedObject._id;
                    }
                }
                $scope.storedReferenceWidget.charts[i].metrics = matchingMetric;
                //$scope.storedReferenceWidget.charts[i].colour = chartColors[i];
                $scope.storedReferenceWidget.charts[i].objectName = $scope.storedObject.name;
            }

            var jsonData = {
                "dashboardId": $state.params.id,
                "widgetType": $scope.widgetType,
                "name": $scope.storedReferenceWidget.name,
                "description": $scope.storedReferenceWidget.description,
                "charts": $scope.storedReferenceWidget.charts,
                "order": $scope.storedReferenceWidget.order,
                "offset": $scope.storedReferenceWidget.offset,
                "size": $scope.storedReferenceWidget.size,
                "minSize": $scope.storedReferenceWidget.minSize,
                "maxSize": $scope.storedReferenceWidget.maxSize,
                "color": widgetColor
            };
            inputParams.push(jsonData);

            $http({
                method: 'POST',
                url: '/api/v1/widgets',
                data: inputParams
            }).then(function successCallback(response) {
                for(widgetObjects in response.data.widgetsList) {
                    $rootScope.$broadcast('populateWidget', response.data.widgetsList[widgetObjects]);
                }
            }, function errorCallback(error) {
                console.log('Error in getting widget id', error);
                swal({
                    title: "",
                    text: "<span style='sweetAlertFont'>Please try again! Something is missing</span> .",
                    html: true
                });
            });
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
            $scope.selectCustomLinkHead = "Step 2 : Choose a Metric";
        }
    };

    $scope.storeReferenceWidget = function () {
        $scope.storedReferenceWidget = this.referenceWidgets;
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
                    console.log('Error in deleting profile', error)
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
        console.log('json data', jsonData);
        $http({
            method: 'POST', url: '/api/v1/create/customwidgets', data: jsonData
        }).then(function successCallback(response) {
            console.log(response.data);
            $scope.errorMessage = true;
            $scope.customMessage = false;
            $scope.customDocLinkMessage = false;
            document.getElementById('basicWidgetBackButton2').disabled = false;
            document.getElementById('basicWidgetNextButton').disabled = false;
            getCustomWidgetId = response.data.widgetsList.id._id;
            $rootScope.customWidgetId = response.data.widgetsList.id._id;
            var domainUrl = "";
            console.log(window.location.hostname);
            if (window.location.hostname == "localhost") {
                domainUrl = "http://localhost:8080";
            }
            else {
                domainUrl = window.location.hostname;
            }
            $(".customApiLink").html(domainUrl + '/api/v1/create/customdata/' + response.data.widgetsList.id._id);
            $scope.customLink = domainUrl + '/api/v1/create/customdata/' + response.data.widgetsList.id._id;

        }, function errorCallback(error) {
            console.log('Error in getting customwidgets', error);
            $scope.customMessage = true;
            $scope.errorMessage = false;
            $scope.customDocLinkMessage = true;
        });
        new Clipboard('#btnCopyLink');
    };

    $scope.copyToClipboard = function () {
        swal("Copied", "", "success");
    };

    $scope.ComingSoonAlert=function (){
        swal("Coming Soon!");
    }

}