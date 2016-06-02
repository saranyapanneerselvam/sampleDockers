showMetricApp.controller('FusionWidgetController', FusionWidgetController)

function FusionWidgetController($scope, $http, $q, $window, $state, $rootScope, generateChartColours) {
    $scope.currentView = 'step_one';
    $scope.objectList = [];
    $scope.metricList = {};
    $scope.referenceWidgetsList = [];
    $scope.profileList = [];
    $scope.storedObjects = {};
    $scope.referencechannelList = [];
    $scope.widgetType = 'fusion';
    $scope.storedUserChosenValues = [];
    $scope.profileOptionsModel = [];

    $scope.changeViewsInBasicWidget = function (obj) {
        $scope.currentView = obj;
        if ($scope.currentView === 'step_one') {
            document.getElementById('basicWidgetBackButton1').disabled = true;
            document.getElementById('basicWidgetNextButton').disabled = true;
            $scope.clearReferenceWidget();
            $scope.listOfReferenceWidget();
        }
        else if ($scope.currentView === 'step_two') {
            document.getElementById('basicWidgetBackButton1').disabled = true;
            $scope.getProfilesForDropdown();
        }
    };

    $scope.listOfReferenceWidget = function () {
        $http({
            method: 'GET',
            url: '/api/v1/get/referenceWidgets/' + $scope.widgetType
        }).then(function successCallback(response) {
            for (i = 0; i < response.data.referenceWidgets.length; i++) {
                $scope.referenceWidgetsList.push(response.data.referenceWidgets[i]);
            }
        }, function errorCallback(error) {
            console.log('Error in finding reference widgets', error);
        });
    };

    $scope.storeReferenceWidget = function () {
        $scope.storedReferenceWidget = this.referenceWidgets;
        $scope.storedReferenceCharts = this.referenceWidgets.charts;
        console.log(' finding reference widgets', $scope.storedReferenceCharts, $scope.storedReferenceWidget._id);

    };

    $scope.clearReferenceWidget = function () {
        $scope.referenceWidgetsList = [];
        $scope.referencechannelList = [];
        $scope.objectList = [];
        $scope.profileList = [];
        $scope.storedUserChosenValues = [];
        console.log('Cleared all data');
    };

    $scope.getProfilesForDropdown = function () {
        for (var i = 0; i < $scope.storedReferenceCharts.length; i++) {
            $scope.referencechannelList.push($scope.storedReferenceCharts[i].channelId);
        }
        var channelList = $scope.referencechannelList;
        $scope.uniquechannelList = [];
        $scope.uniquechannelNames = [];
        $.each(channelList, function (i, el) {
            if ($.inArray(el, $scope.uniquechannelList) === -1) {
                $scope.uniquechannelList.push(el);
            }
        });
        $http({
            method: 'GET',
            url: '/api/v1/get/channels'
        }).then(function successCallback(response) {
            console.log(response.data);
            //$scope.channelList = response.data;
            for (var i = 0; i < $scope.uniquechannelList.length; i++) {
                for (var j = 0; j < response.data.length; j++) {
                    if (response.data[j]._id == $scope.uniquechannelList[i]) {
                        $scope.uniquechannelNames.push(response.data[j].name);
                    }
                }
            }
            console.log('printing unique channel names', $scope.uniquechannelList, $scope.uniquechannelNames);
        }, function errorCallback(error) {
            console.log('Error in finding channels');
        });
        var tempProfileList = [];
        for (i = 0; i < $scope.uniquechannelList.length; i++) {
            console.log($scope.uniquechannelList[i]);
            tempProfileList.push($scope.selectProfile($scope.uniquechannelList[i], i));
        }
        $q.all(tempProfileList).then(function successCallback(tempProfileList) {
            $scope.profileList = tempProfileList;
        }, function errorCallback(err) {
            console.log('Error in fetching profiles');
        });
        console.log('Printing unique channel list', $scope.uniquechannelList);

    };

    $scope.addNewProfile = function (index) {
        console.log(index);
        var url, title;

        function popupwindow(url, title, w, h) {
            switch ($scope.uniquechannelNames[index]) {
                case 'Facebook':
                    url = '/api/v1/auth/facebook';
                    title = $scope.uniquechannelNames[index];
                    break;
                case 'Google Analytics':
                    url = '/api/v1/auth/google';
                    title = $scope.uniquechannelNames[index];
                    break;
                case 'FacebookAds':
                    url = '/api/auth/facebookads';
                    title = $scope.uniquechannelNames[index];
                    break;
                case 'Twitter':
                    url = '/api/auth/twitter';
                    title = $scope.uniquechannelNames[index];
                    break;
                case 'Instagram' :
                    url = '/api/auth/twitter';
                    title = $scope.uniquechannelNames[index];
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

    $scope.selectProfile = function (channel, index) {
        console.log(channel, index);
        var deferred = $q.defer();
        $http({
            method: 'GET',
            url: '/api/v1/get/profiles/' + channel
        }).then(function successCallback(response) {
            deferred.resolve({
                index: index,
                profiles: response.data.profileList
            });
            $scope.objectList = [];
        }, function errorCallback(error) {
            deferred.reject(error);
        });
        return deferred.promise;
    };

    $scope.getObjectsForChosenProfile = function (profileObj, index) {
        $scope.checkExpiresIn = null;
        if (!profileObj) {
            $scope.objectList[index] = null;
            if ($scope.uniquechannelNames[index] === 'Twitter' || $scope.uniquechannelNames[$index] === 'Instagram') {
                $scope.objectForWidgetChosen($scope.objectList[index], index);
            }
        } else {

            console.log('$scope.uniquechannelNames[index]', $scope.uniquechannelNames[index])
            if ($scope.uniquechannelNames[index] == 'Facebook' || $scope.uniquechannelNames[index] =='FacebookAds') {
                $scope.expiredRefreshButton = $scope.uniquechannelNames[index];
                
                console.log('this.profileOptionsModel.expiresIn', profileObj.expiresIn);

                if (profileObj.expiresIn != undefined)
                    $scope.checkExpiresIn = new Date(profileObj.expiresIn);
                console.log($scope.checkExpiresIn);
                $scope.tokenExpired = false;
                //var profileId = this.profileOptionsModel._id;
                var expiresIn = profileObj.expiresIn;
                var currentDate = new Date();
                var newexpiresIn = new Date(expiresIn)
                console.log('expiresin', newexpiresIn, currentDate, profileObj)
                if (currentDate <= newexpiresIn) {
                    console.log('if');

                    //token is valid
                    $scope.tokenExpired = false;
                }
                else if (expiresIn === undefined)
                    $scope.tokenExpired = false;
                else {
                    console.log('else');
                    $scope.tokenExpired = true;
                }
            }

            console.log('$scope.tokenExpired', $scope.tokenExpired);
            $http({
                method: 'GET',
                url: '/api/v1/get/objects/' + profileObj._id
            }).then(function successCallback(response) {
                console.log(response.data.objectList);
                $scope.objectList[index] = response.data.objectList;
                console.log($scope.objectList);
                if ($scope.uniquechannelNames[index] === 'Twitter' || $scope.uniquechannelNames[$index] === 'Instagram') {
                    $scope.objectForWidgetChosen($scope.objectList[index][0], index);
                }
            }, function errorCallback(error) {
                console.log(error);
            });
        }
    };

    $scope.objectForWidgetChosen = function (objectList, index) {
        console.log('chosen object',objectList,typeof objectList,' index:',index,' ',$scope.uniquechannelNames[index]);
        if(typeof objectList=== 'string' && objectList.length!=0){
            console.log('if')
            objectList = JSON.parse(objectList);
        } else if (typeof objectList === 'string' && objectList.length == 0)
            objectList = null;


        if (objectList != null && $scope.currentView == 'step_two') {
            $scope.storedUserChosenValues[index] = {
                object: objectList,
                profile: this.profileOptionsModel[index]
            };
        } else if (objectList == null && $scope.currentView == 'step_two') {
            $scope.storedUserChosenValues[index] = {
                object: null,
                profile: null
            };
        } else if (objectList != null && $scope.currentView == 'step_one') {
            $scope.storedUserChosenValues = null;
        }
        console.log('length of stored user chosen values', $scope.storedUserChosenValues.length);
        var chosenObjectCount = 0;
        for (var i = 0; i < $scope.storedUserChosenValues.length; i++) {
            if ($scope.storedUserChosenValues[i] != null) {
                if ($scope.storedUserChosenValues[i].object != null) {
                    chosenObjectCount++;
                }
            }
        }
        if (chosenObjectCount == $scope.uniquechannelList.length && (  $scope.checkExpiresIn ===null || $scope.checkExpiresIn >= new Date())) {
            document.getElementById('basicWidgetFinishButton').disabled = false;
        } else {
            document.getElementById('basicWidgetFinishButton').disabled = true;
        }

        console.log('UserStore', $scope.storedUserChosenValues);
    };

    $scope.removeExistingProfile = function (index) {
        console.log('DeletingProfile', this.profileOptionsModel[index]._id, this.profileOptionsModel[index].name);
        if (this.profileOptionsModel) {
            $http({
                method: 'POST',
                url: '/api/v1/post/removeProfiles/' + this.profileOptionsModel[index]._id
            }).then(function successCallback(response) {
                console.log('AfterdeleteQuery', response);
                $scope.getProfilesForDropdown();
            }, function errorCallback(error) {
                console.log('Error in deleting profile', error)
            });
        }
    };

    $scope.refreshObjectsForChosenProfile = function (index) {
        if (this.profileOptionsModel[index]._id) {
            switch ($scope.uniquechannelNames[index]) {
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
            console.log('refreshing', $scope.objectType);
            $http({
                method: 'GET',
                url: '/api/v1/channel/profiles/objectsList/' + this.profileOptionsModel[index]._id + '?objectType=' + $scope.objectType
            }).then(function successCallback(response) {
                $scope.objectList[index] = response.data;
                console.log('refreshingResponse', $scope.objectList[index]);
            }, function errorCallback(error) {
                console.log(error);
            });
        }
    };

    $scope.createAndFetchBasicWidget = function () {
        var colourRepeatChecker = [];
        var chartCount = $scope.storedReferenceWidget.charts.length;
        colourRepeatChecker = generateChartColours.fetchRandomColors(chartCount);
        var matchingMetric = [];
        var inputParams = [];

        for (var i = 0; i < $scope.storedReferenceCharts.length; i++) {
            for (var j = 0; j < $scope.storedUserChosenValues.length; j++) {
                if ($scope.storedReferenceCharts[i].channelId === $scope.storedUserChosenValues[j].profile.channelId) {
                    matchingMetric = [];
                    for (var k = 0; k < $scope.storedReferenceCharts[i].metrics.length; k++) {
                        if ($scope.storedReferenceCharts[i].metrics[k].objectTypeId === $scope.storedUserChosenValues[j].object.objectTypeId) {
                            matchingMetric.push($scope.storedReferenceCharts[i].metrics[k]);
                            matchingMetric[0].objectId = $scope.storedUserChosenValues[j].object._id;
                        }
                    }
                    $scope.storedReferenceWidget.charts[i].objectName = $scope.storedUserChosenValues[j].object.name;
                }
            }
            $scope.storedReferenceWidget.charts[i].metrics = matchingMetric;
            $scope.storedReferenceWidget.charts[i].colour = colourRepeatChecker[i];
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
    };
}

