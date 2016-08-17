showMetricApp.controller('BasicWidgetController', BasicWidgetController)

function BasicWidgetController($scope, $http, $state, $rootScope, $window, $stateParams, generateChartColours) {
    $scope.objectList = {};
    $scope.referenceWidgetsList = [];
    $scope.profileList = {};
    $scope.tokenExpired = false;
    $scope.channelList;
    $scope.currentView = 'step_one';
    $scope.weburl='';
    $scope.mozObjectdetails={};
   // var mozObjectId="";
   //  var mozObjectname="";
   //   var mozObjecttypeid="";
    var widgetType = $stateParams.widgetType;
    var storedProfile = {};
    var getChannelName = "";
    var getCustomWidgetObj = {};
    var getCustomWidgetId = "";
    var isSelectedMetric = "";
    var referenceWidgetsData = {};
    var getReferenceWidgetsArr = new Array();
    var storeChosenObject = [];
    var profileListBeforeAddition = {};

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
            $scope.canManageClients = null;
        }
        else if ($scope.currentView === 'step_two') {
            document.getElementById('basicWidgetBackButton1').disabled = false;
            $scope.clearReferenceWidget();
            $scope.profileList = {};
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
        }
    };

    $scope.mozobject=function(url){
        $scope.weburl=url;
        document.getElementById('basicWidgetFinishButton').disabled = false;
    }

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
                if( $scope.profileList != undefined){
                    $scope.profileOptionsModel=$scope.profileList[0];
                    $scope.getObjectsForChosenProfile();

                }



/*
                var newProfile;
                for(var newItems in $scope.profileList) {
                    var checker = false;
                    for(var oldItems in profileListBeforeAddition) {
                        if(String($scope.profileList[newItems]) == String(profileListBeforeAddition[oldItems]))
                            checker = true;
                    }
                    if(checker == true)
                        $scope.profileOptionsModel = $scope.profileList[newItems];
                }
*/
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
        document.getElementById('basicWidgetFinishButton').disabled = true;
        $scope.checkExpiresIn = null;
        storeChosenObject = [];
        if (!this.profileOptionsModel) {
            $scope.objectList = null;
            storeChosenObject = [];
            if ($scope.storedChannelName === 'Twitter' || $scope.storedChannelName === 'Instagram' || $scope.storedChannelName === 'GoogleAdwords')
                for(var items in $scope.uniqueObjectCount)
                    $scope.objectForWidgetChosen([null, null, null,items]);
        }
        else {
            storedProfile = this.profileOptionsModel;

            if($scope.storedChannelName == 'GoogleAdwords') {
                if (this.profileOptionsModel.canManageClients === false)
                    $scope.canManageClients = true;
                else
                    $scope.canManageClients = false;
            }

            if (this.profileOptionsModel.expiresIn != undefined)
                $scope.checkExpiresIn = new Date(this.profileOptionsModel.expiresIn);
            $scope.tokenExpired = false;

            var profileId = this.profileOptionsModel._id;
            var expiresIn = this.profileOptionsModel.expiresIn;
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
                    var k=0; var tempList = {};

                    if($scope.storedChannelName != 'Google Analytics') {
                        uniqueObject = _.groupBy(response.data.objectList, 'objectTypeId');
                        var sortedUniqueObject = {};
                        for(var objectIds in $scope.uniqueObjectCount) {
                            for(var uniqueObjects in uniqueObject)
                                if($scope.uniqueObjectCount[objectIds] == uniqueObjects)
                                    sortedUniqueObject[uniqueObjects] = uniqueObject[uniqueObjects];
                        }
                        for(var items in sortedUniqueObject) {
                            var tempObjectList = [];
                            for(var subItems in sortedUniqueObject[items])
                                tempObjectList.push(sortedUniqueObject[items][subItems]);
                            var obj = {};
                            obj[k] = tempObjectList;
                            tempList[k] = obj;
                            k++;
                        }
                        $scope.objectList = tempList;
                    }
                    else {
                        document.getElementById('basicWidgetFinishButton').disabled = true;
                        var uniqueObjectTypeWithIndex = [];
                        uniqueObjectTypeWithIndex[k] = response.data.objectList;
                        $scope.objectList = uniqueObjectTypeWithIndex;
                    }

                    if ($scope.storedChannelName === 'Twitter' || $scope.storedChannelName === 'Instagram' || ($scope.storedChannelName === 'GoogleAdwords' && $scope.canManageClients === true) || $scope.storedChannelName === "Pinterest" ) {
                        document.getElementById('basicWidgetFinishButton').disabled = true;
                        for(var items in $scope.uniqueObjectCount)
                            $scope.objectForWidgetChosen([$scope.objectList[0][0][0].name, $scope.objectList[0][0][0]._id, $scope.objectList[0][0][0].objectTypeId,items]);
                    }
                    else if($scope.storedChannelName === 'GoogleAdwords' && $scope.canManageClients === false) {
                        storeChosenObject = [];
                        document.getElementById('basicWidgetFinishButton').disabled = true;
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

    $scope.refreshObjectsForChosenProfile = function (objectTypeId) {
        if (this.profileOptionsModel._id) {
            var profileId = this.profileOptionsModel._id;
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
                                    for(var subItems in uniqueObject[items])
                                        tempObjectList.push(uniqueObject[items][subItems]);
                                    var obj = {};
                                    obj[k] = tempObjectList;
                                    tempList = obj;
                                }
                                $scope.objectList[k] = tempList;
                            }
                            else {
                                uniqueObjectTypeWithIndex[k] = response.data;
                                $scope.objectList = uniqueObjectTypeWithIndex;
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
                case 'LinkedIn':
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
	
        var mozObjectId="";
        var mozObjectname="";
        var mozObjecttypeid="";
        var chartColors = [], widgetName;
        $(".navbar").css('z-index', '1');
        $(".md-overlay").css("background", "rgba(0,0,0,0.5)");


        if (getChannelName == "CustomData") {
            getCustomWidgetObj = {
                '_id': getCustomWidgetId,
                'widgetType': 'custom'
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
                }
            );
            httpPromise.then (function (mozObjectdetails) {
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
                              matchingMetric[0].objectId = mozObjectdetails[0]._id;
                              matchingMetricName = mozObjectdetails[0].name;
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

            });
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

    $scope.objectForWidgetChosen = function (chosenObject) {
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
            if(countChecker == true)
                document.getElementById('basicWidgetFinishButton').disabled = false;
            else
                document.getElementById('basicWidgetFinishButton').disabled = true;
        }
        else
            document.getElementById('basicWidgetFinishButton').disabled = true;
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