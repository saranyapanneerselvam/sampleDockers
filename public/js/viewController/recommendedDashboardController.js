showMetricApp.controller('RecommendedDashboardController', RecommendedDashboardController)

function RecommendedDashboardController($scope, $http, $window, $q,  $state, $rootScope) {
    $scope.currentView = 'step_one';
    $scope.recommendDashboard = [];
    $scope.getChannelList = {};
    $scope.profileList=[];
    $scope.objectList = [];
    $scope.metricList = {};
    $scope.referenceWidgetsList = [];
    $scope.storedObjects = {};
    $scope.referencechannelList =[];
    $scope.storedUserChosenValues = [];
    $scope.profileOptionsModel = [];
    $scope.dashboard={};
    $scope.changeViewsInBasicWidget = function (obj) {
        $scope.currentView = obj;
        if($scope.currentView === 'step_one'){
            document.getElementById('basicWidgetBackButton1').disabled=true;
            $scope.clearReferenceWidget();
            $scope.listOfRecommendedDashboard();
        }
        else if($scope.currentView === 'step_two'){
            document.getElementById('basicWidgetBackButton1').disabled=true;
        }
    };

    $scope.clearReferenceWidget = function(){
        $scope.objectList =[];
        $scope.profileList=[];
        $scope.storedUserChosenValues = [];
        $scope.recommendDashboard=[];
       // console.log('Cleared all data');
    };

    $scope.listOfRecommendedDashboard = function(){
        $http({
            method:'GET',
            url:'api/get/recommendDashboard'
        }).then(function successCallback(response){
            $scope.wholeDataDetail=response.data;

            for(var i in response.data){
                console.log('WelcomeToFrontend', response.data[i]);
                $scope.recommendDashboard.push(response.data[i]);

            }
        },function errorCallback(error){
            console.log('Error in finding dashboard');
        });
    };

    $scope.getProfileForChosenChannel =function(dashboards){
        $scope.fullOfDashboard=dashboards;
        $scope.getChannelList=dashboards.channels;
        $scope.referenceWidgetsList =dashboards.referenceWidgets;
        console.log('getChannelList', $scope.getChannelList);
        var tempProfileList=[];
        for(var key in  $scope.getChannelList) {
            tempProfileList.push($scope.correspondingProfile($scope.getChannelList[key]._id,key));
        }
        $q.all(tempProfileList).then(function successCallback(tempProfileList){
            $scope.profileList = tempProfileList;
            console.log('ProperProfileData', $scope.profileList);
        }, function errorCallback(err){
            console.log('Error in fetching profiles',err);
        });
    };

    $scope.correspondingProfile=function(profileId,index){
        console.log('profileId',profileId);
        var deferred = $q.defer();
        $http({
            method: 'GET',
            url: '/api/v1/get/profiles/'+profileId
        }).then(function successCallback(response) {
            deferred.resolve({
                profiles: response.data.profileList
            });
            console.log( $scope.profileList);
            $scope.objectList = [];
        }, function errorCallback(error) {
            deferred.reject(error);
        });
        return deferred.promise;
    };

    $scope.getObjectsForChosenProfile = function(profileObj, index){
        //console.log('channelName',$scope.getChannelList[index].name,$scope.getChannelList.length);
        if (!profileObj) {
            $scope.objectList[index] = null;
            if($scope.getChannelList[index].name==='Twitter'){
                $scope.objectForWidgetChosen( $scope.objectList[index],index);
            }

        } else {
            $http({
                method: 'GET',
                url: '/api/v1/get/objects/'+ profileObj._id
            }).then(function successCallback(response) {
                //console.log(response.data.objectList);
                $scope.objectList[index] = response.data.objectList;
               // console.log('objects',$scope.objectList);
                if($scope.getChannelList[index].name==='Twitter'){
                    $scope.objectForWidgetChosen( $scope.objectList[index][0],index);
                }
            }, function errorCallback(error) {
                console.log(error);
            });
        }
    };

    $scope.objectForWidgetChosen = function(objectList, index) {
       // console.log('twitterProfile',this.profileOptionsModel);
        if(objectList != null && $scope.currentView == 'step_two'){
            $scope.storedUserChosenValues[index]={
                object:objectList,
                profile:this.profileOptionsModel[index]
            };
        } else if(objectList == null && $scope.currentView == 'step_two'){
            $scope.storedUserChosenValues[index] = {
                object:null,
                profile:null
            };
        } else if(objectList != null && $scope.currentView == 'step_one'){
            $scope.storedUserChosenValues = null;
        }
        //console.log('length of stored user chosen values',$scope.storedUserChosenValues.length);
        var chosenObjectCount=0;
        for(var i=0;i<$scope.storedUserChosenValues.length;i++){
            if($scope.storedUserChosenValues[i] != null){
                if( $scope.storedUserChosenValues[i].object !=null){
                    chosenObjectCount++;
                }
            }
        }
        if(chosenObjectCount == $scope.getChannelList.length){
            document.getElementById('basicWidgetFinishButton').disabled = false;
        } else {
            document.getElementById('basicWidgetFinishButton').disabled = true;
        }

        //console.log('UserStore', $scope.storedUserChosenValues);
    };

    $scope.addNewProfile = function (index) {
        console.log(index,$scope.getChannelList[index].name);
        var url,title;
        function popupwindow(url, title, w, h) {
            switch ($scope.getChannelList[index].name){
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
            }
            var left = (screen.width/2)-(w/2);
            var top = (screen.height/2)-(h/2);
            return window.open(url, title, 'toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=no, resizable=no, copyhistory=no, width='+w+', height='+h+', top='+top+', left='+left);
        }
        popupwindow(url,title, 1000,500);
    };

    $window.afterAuthentication = function () {
        //console.log('addNew', $scope.fullOfDashboard);
        $scope.getProfileForChosenChannel( $scope.fullOfDashboard);
    };

    $scope.removeExistingProfile = function (index) {
       // console.log('DeletingProfile',this.profileOptionsModel[index]._id,this.profileOptionsModel[index].name);
        if(this.profileOptionsModel) {
            $http({
                method: 'POST',
                url: '/api/v1/post/removeProfiles/'+this.profileOptionsModel[index]._id
            }).then(function successCallback(response){
               // console.log('AfterdeleteQuery',response, $scope.fullOfDashboard);
                $scope.getProfileForChosenChannel( $scope.fullOfDashboard);
            },function errorCallback(error){
                console.log('Error in deleting profile',error)
            });
        }
    };

    $scope.refreshObjectsForChosenProfile = function (index) {
        if(this.profileOptionsModel[index]._id) {
            switch ($scope.getChannelList[index].name) {
                case 'Facebook':            $scope.objectType = 'page';         break;
                case 'Google Analytics':    $scope.objectType = 'gaview';         break;
                case 'FacebookAds':        $scope.objectType = 'fbadaccount';   break;
            }
           // console.log('refreshing',$scope.objectType);
            $http({
                method: 'GET',
                url: '/api/v1/channel/profiles/objectsList/'+ this.profileOptionsModel[index]._id +'?objectType='+ $scope.objectType
            }).then(function successCallback(response) {
                $scope.objectList[index] = response.data;
                //console.log('refreshingResponse',$scope.objectList[index]);
            }, function errorCallback(error) {
                console.log(error);
            });
        }
    };

    $scope.createRecommendedDashboard = function () {
        var matchingMetric = [];
        var jsonData = {
            name: $scope.fullOfDashboard.dashboard.name
        };
        $http({
            method: 'POST',
            url: '/api/v1/create/dashboards',
            data: jsonData
        }).then(function successCallback(response) {
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
                        }
                    }
                    $scope.referenceWidgetsList[widget].charts[chart].metrics = matchingMetric;
                }
                var jsonData = {
                    "dashboardId": response.data,
                    "widgetType": $scope.referenceWidgetsList[widget].widgetType,
                    "name": $scope.referenceWidgetsList[widget].name,
                    "description": $scope.referenceWidgetsList[widget].description,
                    "charts": $scope.referenceWidgetsList[widget].charts,
                    "order": $scope.referenceWidgetsList[widget].order,
                    "offset": $scope.referenceWidgetsList[widget].offset,
                    "size": $scope.referenceWidgetsList[widget].size,
                    "minSize": $scope.referenceWidgetsList[widget].minSize,
                    "maxSize": $scope.referenceWidgetsList[widget].maxSize
                };
                $http({
                    method: 'POST',
                    url: '/api/v1/widgets',
                    data: jsonData
                }).then(function successCallback(response) {
                   // console.log('Response after creating widget', response);
                }, function errorCallback(error) {
                    console.log('Error in getting widget id', error);
                });
            }
            $state.transitionTo('app.reporting.dashboard', {id: response.data});
        }, function errorCallback(error) {
            console.log('Error in creating new Dashboard', error);
        })
    };
}
