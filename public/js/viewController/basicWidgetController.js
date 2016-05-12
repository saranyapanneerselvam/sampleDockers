showMetricApp.controller('BasicWidgetController',BasicWidgetController)

function BasicWidgetController($scope,$http,$state,$rootScope,$window,$stateParams) {
    $scope.currentView = 'step_one';
    $scope.objectList = {};
    $scope.metricList = {};
    $scope.referenceWidgetsList = [];
    $scope.profileList = {};
    $scope.storedObject = {};
    $scope.widgetType = $stateParams.widgetType;
    var getChannelName = "";
    var getCustomWidgetId = "";

    console.log('widgetType',$scope.widgetType);

    $scope.changeViewsInBasicWidget = function (obj) {
        $scope.currentView = obj;
        $rootScope.currentModalView = obj;
        if($scope.currentView === 'step_one'){
            document.getElementById('basicWidgetBackButton1').disabled=true;
            document.getElementById('basicWidgetNextButton').disabled=true;
            $scope.listChannels();
            $scope.clearReferenceWidget();
        } else if($scope.currentView === 'step_two'){
            document.getElementById('basicWidgetBackButton1').disabled=false;
            if(getChannelName=="CustomData"){
                $scope.storeCustomData();
                $(".showCustomUrlLink" ).show();
                $(".showReferenceWidgets" ).html('');
            }
            else{
                $scope.clearReferenceWidget();
                $scope.getReferenceWidgetsForChosenChannel();
                $scope.getProfilesForDropdown();
                $(".showReferenceWidgets" ).show();
                $(".showCustomUrlLink").html('');
            }
        } else if ($scope.currentView === 'step_three'){
            document.getElementById('basicWidgetBackButton1').disabled=false;
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
            for(i=0;i<response.data.referenceWidgets.length;i++) {
                if(response.data.referenceWidgets[i].charts[0].channelId === $scope.storedChannelId) {
                    $scope.referenceWidgetsList.push(response.data.referenceWidgets[i]);
                }
            }
        }, function errorCallback (error){
            console.log('Error in finding reference widgets', error);
        });

        $http({
            method: 'GET',
            url: '/api/v1/get/metrics/'+$scope.storedChannelId
        }).then(function successCallback(response) {
            $scope.metricList = response.data.metricsList;
        }, function errorCallback(error) {
            console.log('Error in finding metrics');
        });
    };

    $scope.getProfilesForDropdown = function () {
        $http({ method: 'GET', url: '/api/v1/get/profiles/'+$scope.storedChannelId
        }).then(function successCallback(response) {
            $scope.profileList = response.data.profileList;
            $scope.objectList = [];
        }, function errorCallback(error) {
            console.log('Error in finding profiles');
        });
    };

    $scope.getObjectsForChosenProfile = function(){
        $http({
            method: 'GET',
            url: '/api/v1/get/objects/'+ this.profileOptionsModel._id
        }).then(function successCallback(response) {
            $scope.objectList=response.data.objectList;
            console.log(response.data.objectList);
        }, function errorCallback(error) {
            console.log(error);
        });
    };

    $scope.refreshObjectsForChosenProfile = function () {
        if(this.profileOptionsModel._id) {
            switch ($scope.storedChannelName) {
                case 'Facebook':            $scope.objectType = 'page';         break;
                case 'Google Analytics':    $scope.objectType = 'view';         break;
                case 'FacebookAds':        $scope.objectType = 'fbadaccount';  break;
            }
            $http({
                method: 'GET',
                url: '/api/v1/channel/profiles/objectsList/'+ this.profileOptionsModel._id +'?objectType='+ $scope.objectType
            }).then(function successCallback(response) {
                $scope.objectList = response.data;
            }, function errorCallback(error) {
                console.log(error);
            });
        }
    };

    $scope.addNewProfile = function () {
        var url,title;
        function popupwindow(url, title, w, h) {
            switch ($scope.storedChannelName){
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
            }
            var left = (screen.width/2)-(w/2);
            var top = (screen.height/2)-(h/2);
            return window.open(url, title, 'toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=no, resizable=no, copyhistory=no, width='+w+', height='+h+', top='+top+', left='+left);
        }
        popupwindow(url,title, 1000,500);
    };

    $window.afterAuthentication = function () {
        $scope.getProfilesForDropdown();
    };

    $scope.removeExistingProfile = function () {
        if(this.profileOptionsModel) {
            $http({
                method: 'POST',
                url: '/api/v1/post/removeProfiles/'+this.profileOptionsModel._id
            }).then(function successCallback(response){
                $scope.getProfilesForDropdown();
            },function errorCallback(error){
                console.log('Error in deleting profile',error)
            });
        }
    };

    $scope.createAndFetchBasicWidget = function(objectPassed) {
        if(getChannelName=="CustomData"){
            // final function after custom api url creation goes here
            $rootScope.$emit("CallPopulateDashboardWidgets", {});
        }
        else{
            // function for saving other widgets goes here
            var matchingMetric = [];
            for(var i=0;i<$scope.storedReferenceWidget.charts.length;i++) {
                matchingMetric = [];
                for(var j=0;j<$scope.storedReferenceWidget.charts[i].metrics.length;j++) {
                    if($scope.storedReferenceWidget.charts[i].metrics[j].objectTypeId === $scope.storedObject.objectTypeId) {
                        matchingMetric.push($scope.storedReferenceWidget.charts[i].metrics[j]);
                        matchingMetric[0].objectId = $scope.storedObject._id;
                    }
                }
                $scope.storedReferenceWidget.charts[i].metrics = matchingMetric;
                //console.log('Displaying metrics',$scope.storedReferenceWidget.charts[i].metrics);
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
                "maxSize": $scope.storedReferenceWidget.maxSize
            };
            console.log('json data',jsonData);
            $http({
                method: 'POST',
                url: '/api/v1/widgets',
                data: jsonData
            }).then(function successCallback(response){
                console.log('Response after creating widget', response);
                $rootScope.$broadcast('populateWidget',response.data.widgetsList.id);
            }, function errorCallback (error){
                console.log('Error in getting widget id',error);
            });
        }
    };

    $scope.storeChannel = function(){
        $scope.storedChannelId = this.data._id;
        $scope.storedChannelName = this.data.name;
        getChannelName = this.data.name;
    };

    $scope.storeReferenceWidget = function(){$scope.storedReferenceWidget = this.referenceWidgets;};
    $scope.clearReferenceWidget = function(){
        $scope.referenceWidgetsList= [];
    };
    $scope.objectForWidgetChosen = function() {
        $scope.storedObject = this.objectOptionsModel;
        if(this.objectOptionsModel != null)
            document.getElementById('basicWidgetNextButton').disabled=false;
        else
            document.getElementById('basicWidgetNextButton').disabled=true;
    };

    $scope.errorMessage=true;
    $scope.storeCustomData = function () {
        $(".selectCustomLinkHead").text("Step2.Select the Link");

        var jsonData = {
            "dashboardId": $state.params.id,
            "widgetType": "custom",
            "channelId": $scope.storedChannelId
        };
        console.log('json data', jsonData);
        $http({
            method: 'POST', url: '/api/v1/create/customwidgets', data: jsonData
        }).then(function successCallback(response){
            console.log(response.data);
            $scope.errorMessage=true;
            document.getElementById('basicWidgetBackButton2').disabled=false;
            getCustomWidgetId = response.data.widgetsList.id._id;
            $rootScope.customWidgetId=response.data.widgetsList.id._id;
            $(".customApiLink").html('http://localhost:8080/api/v1/create/customdata/'+response.data.widgetsList.id._id);
        }, function errorCallback (error){
            console.log('Error in getting customwidgets',error);
            document.getElementById('basicWidgetBackButton2').disabled=true;
            document.getElementById('basicWidgetNextButton').disabled=true;
            $scope.errorMessage=false;
        });
    };

    $scope.selectCustomAPILink = function () {
        var getCustomLink = $(".customApiLink").text();
        console.log(getCustomLink);
        $(".isChecked").show();
        document.getElementById('basicWidgetNextButton').disabled=false;
    };

}