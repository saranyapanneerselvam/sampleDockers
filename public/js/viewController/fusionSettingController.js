showMetricApp.controller('FusionSettingsController', FusionSettingsController)

function FusionSettingsController($scope, $uibModalInstance, widget, $http, $state, $rootScope) {
    $scope.widget = widget;
    $scope.form = {
        id: widget.id,
        name: widget.name,
        type: widget.widgetType
    };
    $scope.widgetsList = [];
    $scope.selectedWidgetsList = [];
    $scope.dashboardWidgets = [];
    $scope.fusionView = false;
    $scope.dismiss = function () {
        $scope.widgetsList = [];
        $scope.selectedWidgetsList = [];
        $scope.dashboardWidgets = [];
        $uibModalInstance.dismiss();
    };
    
    $scope.selectedFusableWidgets = function () {
        if($scope.dashboardWidgets.length > 0) {

            $scope.dashboardWidgets.forEach(function (value, key) {
                if(value._id != $scope.widget.id && value.widgetType != 'customFusion') {
                    $scope.widgetsList.push({
                        id: value._id,
                        label: value.name,
                        widgetType: value.widgetType
                    });
                }
            });
            $scope.fusionView = true;
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
                        if(value._id != $scope.widget.id && value.widgetType != 'customFusion' && value.visibility != false) {
                            $scope.widgetsList.push({
                                id: value._id,
                                label: value.name,
                                widgetType: value.widgetType
                            });
                        }
                    });
                    $scope.fusionView = true;
                },
                function errorCallback(error) {
                    $scope.dismiss();
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
                    storeFinalWidgetsList.push({
                        widgetId: value.id,
                        widgetType: value.widgetType
                    });
                }
            );
            storeFinalWidgetsList.push({
                widgetId: widget.id,
                widgetType: widget.widgetType
            });
            var jsonData = {
                "dashboardId": $state.params.id,
                "name": "Custom Fusion",
                "widgetType": widgetType,
                "widgets":storeFinalWidgetsList,
                "size": {h: 2, w: 4},
                "minSize": {h: 2, w: 4},
                "maxSize": {h: 3, w: 6},
                "color": '#1F77B4',
                "channelName": "customFusion"
            };
            inputParams.push(jsonData);
            $http({
                method: 'POST',
                url: '/api/v1/widgets',
                data: inputParams
            }).then(
                function successCallback(response) {
                    $rootScope.populateDashboardWidgets();
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