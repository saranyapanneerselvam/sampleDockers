showMetricApp.controller('WidgetSettingsController', WidgetSettingsController)

function WidgetSettingsController($scope, $uibModalInstance, widget, $http, $state, $rootScope) {
    $scope.widget = widget;
    $scope.form = {
        id: widget.id,
        name: widget.name,
        type: widget.widgetType
    };
    $scope.widgetsList = [];
    $scope.selectedWidgetsList = [];
    $scope.dashboardWidgets = [];

    $scope.dismiss = function () {
        console.log('dismiss');
        $scope.widgetsList = [];
        $scope.selectedWidgetsList = [];
        $scope.dashboardWidgets = [];
        $uibModalInstance.dismiss();
    };

    $scope.remove = function () {
        $scope.dashboard.widgets.splice($scope.dashboard.widgets.indexOf(widget), 1);
        $uibModalInstance.close();
    };

    $scope.submit = function () {
        console.log('form', $scope.form);
        var inputParams = [];
        var jsonData = {
            "dashboardId": $state.params.id,
            "widgetId": $scope.form.id,
            "name": $scope.form.name
        };
        inputParams.push(jsonData);

        $http({
            method: 'POST',
            url: '/api/v1/update/widgets',
            data: inputParams
        }).then(
            function successCallback(response) {
                $scope.renameWidget = [];
                var widgetIndex = $scope.dashboard.widgets.map(function (el) {
                    return el.id;
                }).indexOf(response.data.widgetsList[0]._id);
                $scope.dashboard.widgetData[widgetIndex].name = response.data.widgetsList[0].name;
                angular.extend($scope.widget, $scope.form);
            },
            function errorCallback(error) {
                swal({
                    title: "",
                    text: "<span style='sweetAlertFont'>Something went wrong! Please reopen settings to rename the widget</span> .",
                    html: true
                });
            }
        );
        $uibModalInstance.close(widget);
    };

    $scope.changeViews = function (obj) {
        $scope.currentView = obj;
        $rootScope.currentModalView = obj;
        if ($scope.currentView === 'step_one') {
            $scope.widgetsList = [];
            $scope.selectedWidgetsList = [];
        }
    };

    $scope.selectedFusableWidgets = function () {
        $scope.changeViews('step_two');
        if($scope.dashboardWidgets.length > 0) {
            console.log('WORKING',$scope.dashboardWidgets)

            $scope.dashboardWidgets.forEach(function (value, key) {
                if(value._id != $scope.widget.id && value.widgetType != 'customFusion') {
                    $scope.widgetsList.push({
                        id: value._id,
                        label: value.name,
                        widgetType: value.widgetType
                    });
                }
            });
        }
        else {
            $http({
                method: 'GET',
                url: '/api/v1/dashboards/widgets/' + $state.params.id
            }).then(
                function successCallback(response) {
                    var widgetsList;
                    widgetsList = response.data.widgetsList;
                    widgetsList.forEach(function (value, key) {
                        if(value._id != $scope.widget.id && value.widgetType != 'customFusion') {
                            $scope.widgetsList.push({
                                id: value._id,
                                label: value.name,
                                widgetType: value.widgetType
                            });
                        }
                    });
                },
                function errorCallback(error) {
                    swal({
                        title: "",
                        text: "<span style='sweetAlertFont'>Something went wrong! Please reopen settings to fuse the widget</span> .",
                        html: true
                    });
                }
            );
        }
    };

    $scope.createCustomFusionWidget = function () {
        var inputParams=[];
        var widgetType = "customFusion";
        var storeFinalWidgetsList = [];

        if($scope.selectedWidgetsList.length>0) {
            $scope.selectedWidgetsList.forEach(
                function (value) {
                    storeFinalWidgetsList.push({widgetId: value.id,widgetType: value.widgetType})
                }
            );
            console.log(storeFinalWidgetsList)
            var jsonData = {
                "dashboardId": $state.params.id,
                "widgetType": widgetType,
                "widgets":storeFinalWidgetsList,
                "size": {h: 2, w: 4},
                "minSize": {h: 2, w: 4},
                "maxSize": {h: 2, w: 4},
                "color": '#1F77B4'
            };
            inputParams.push(jsonData);
            console.log(inputParams);
            $http({
                method: 'POST',
                url: '/api/v1/widgets',
                data: inputParams
            }).then(
                function successCallback(response) {
                    console.log(response);
                    $scope.dismiss();
                },
                function errorCallback(error) {
                    swal({
                        title: "",
                        text: "<span style='sweetAlertFont'>Something went wrong! Please try again</span> .",
                        html: true
                    });
                }
            );

        }
        else {
            swal({
                title: "",
                text: "<span style='sweetAlertFont'>Please choose at least one widget</span> .",
                html: true
            });
        }
    };

    $scope.pushSelectedWidgets = function (selectedItem,from,to) {

        var idx=from.indexOf(selectedItem);
        if (idx != -1) {
            from.splice(idx, 1);
            to.push(selectedItem);
        }
    };
}