showMetricApp.controller('AlertController', AlertController)
function AlertController($scope, $http, $q, $state, $rootScope, $window, $stateParams, generateChartColours) {

    var isEdit = false;
    $scope.alert, $scope.metricName, $scope.currentView = 'step_one', $scope.operation;
    $scope.widgetAlerts = [];
    $scope.alertMetrics = [];
    var storeMetricDetails = [], widgetMetricDetails = [];

    $scope.changeViewsInAlertModal = function (obj) {
        $scope.currentView = obj;
        if ($scope.currentView === 'step_one') {
            isEdit = false;
            $scope.name = '';
            $scope.inAlertMetric = '';
            $scope.metric = '';
            $scope.operation = '';
            $scope.threshold = '';
            $scope.interval = '';
            $scope.email = '';
            $scope.metricDetails = '';
            $scope.alertMetrics = [];
            $scope.widgetMetrics = [];
            $scope.widgetAlerts = [];
            storeMetricDetails = [];
            $scope.fetchWidgetAlerts();
        }
        else if ($scope.currentView === 'step_two') {
            if (isEdit == true) {
                $scope.name = $scope.alert.name;
                $scope.interval = $scope.alert.interval;
                $scope.email = $scope.alert.mailingId.email;
                if(typeof $scope.alert.operation.gt != 'undefined') {
                    if($scope.alert.operation.gt === true) {
                        $scope.operation = 'gt';
                        $scope.threshold = $scope.alert.threshold.gt;
                    }
                }
                else {
                    $scope.operation = 'lt';
                    $scope.threshold = $scope.alert.threshold.lt;
                }
            }
            else {
                $scope.metricDetails = [];
                $scope.alertMetrics = [];
                $scope.widgetMetrics = [];
                $scope.alertFunction();
            }
        }
    };

    $scope.fetchWidgetAlerts = function () {
        $http({
            method: 'GET',
            url: '/api/v1/get/alerts/' + $rootScope.selectedWidget.id
        }).then(
            function successCallback(response) {
                if(response.status == '200') {
                    widgetMetricDetails.length=0;
                    $scope.widgetAlerts = response.data;
                    for (var i = 0; i < $scope.widgetAlerts.length; i++)
                        widgetMetricDetails.push($scope.getMetricDetails($scope.widgetAlerts[i].metricId, i));
                    $q.all(widgetMetricDetails).then(
                        function successCallback(widgetMetricDetails) {
                            for(var alerts in $scope.widgetAlerts) {
                                for(var metrics in widgetMetricDetails) {
                                    if($scope.widgetAlerts[alerts].metricId == widgetMetricDetails[metrics].metrics[0]._id)
                                        $scope.alertMetrics.push(widgetMetricDetails[metrics].metrics[0]);
                                }
                            }
                        },
                        function errorCallback(error) {
                            $scope.$parent.closeBasicWidgetModal('');
                            swal("Sorry! Something went wrong, Please try again.");
                        }
                    );
                }
                else
                    $scope.widgetAlerts=[];
            },
            function errorCallback(error) {
                $scope.$parent.closeBasicWidgetModal('');
                swal("Sorry! Something went wrong, Please try again.");
            }
        );
    };

    $scope.getMetricDetails = function (metricId, index) {
        var deferred = $q.defer();
        $http({
            method: 'GET',
            url: '/api/v1/get/metricDetails/' + metricId
        }).then(
            function successCallback(metric) {
                deferred.resolve({
                    index: index,
                    metrics: metric.data.metricsList
                });
            },
            function errorCallback(error) {
                deferred.reject(error);
            }
        );
        return deferred.promise;
    };

    $scope.alertFunction = function () {
        if (isEdit == true)
            var widgetId = $scope.alert.widgetId;
        else
            var widgetId = $rootScope.selectedWidget.id;
        $http({
            method: 'GET',
            url: '/api/v1/widget/' + widgetId
        }).then(
            function successCallback(response) {
                $scope.widgetDetails = response.data[0];
                for (var i = 0; i < $scope.widgetDetails.charts.length; i++)
                    storeMetricDetails.push($scope.getMetricDetails($scope.widgetDetails.charts[i].metrics[0].metricId, i));
                $q.all(storeMetricDetails).then(
                    function successCallback(storeMetricDetails) {
                        $scope.widgetMetrics = [];
                        for(var metrics in storeMetricDetails) {
                            if(storeMetricDetails[metrics].metrics[0].objectTypes[0].meta.endpoint.length != 0) {
                                for(var endpoints in storeMetricDetails[metrics].metrics[0].objectTypes[0].meta.endpoint) {
                                    $scope.widgetMetrics.push({
                                        name: storeMetricDetails[metrics].metrics[0].name + ' - ' + storeMetricDetails[metrics].metrics[0].objectTypes[0].meta.endpoint[endpoints],
                                        id: storeMetricDetails[metrics].metrics[0]._id,
                                        endPoints: storeMetricDetails[metrics].metrics[0].objectTypes[0].meta.endpoint[endpoints]
                                    });
                                }
                            }
                            else {
                                $scope.widgetMetrics.push({
                                    name: storeMetricDetails[metrics].metrics[0].name,
                                    id: storeMetricDetails[metrics].metrics[0]._id,
                                    endPoints: ''
                                });
                            }
                        }
                        if(isEdit == true) {
                            for(i=0;i<$scope.widgetMetrics.length;i++) {
                                if($scope.alert.metricId == $scope.widgetMetrics[i].id) {
                                    if($scope.alert.endPoint != null) {
                                        if($scope.widgetMetrics[i].endPoints == $scope.alert.endPoint)
                                            $scope.inAlertMetric = $scope.widgetMetrics[i].name;
                                    }
                                    else
                                        $scope.inAlertMetric = $scope.widgetMetrics[i].name;
                                }
                            }
                        }
                    },
                    function errorCallback(err) {
                        $scope.$parent.closeBasicWidgetModal('');
                        swal("Sorry! Something went wrong, Please try again.");
                    }
                );
            },
            function errorCallback(error) {
                $scope.$parent.closeBasicWidgetModal('');
                swal("Sorry! Something went wrong, Please try again.");
            }
        );
    };

    $scope.saveAlert = function () {
        var k = $scope.widgetMetrics.map(function(e) { return e.name; }).indexOf($scope.inAlertMetric);
        $scope.metric=[$scope.widgetMetrics[k].id,$scope.widgetMetrics[k].endPoints];
        var objectId;
        var widgetDetail = $scope.widgetDetails.charts;
        for (var k = 0; k < widgetDetail.length; k++) {
            var parsedData = $scope.metric;
            if (widgetDetail[k].metrics[0].metricId === parsedData[0])
                objectId = widgetDetail[k].metrics[0].objectId;
        }
        var threshold = {};
        var operation = {};
        operation[$scope.operation] = true;
        threshold[$scope.operation] = $scope.threshold;
        if (isEdit == true) {
            var alertData = {
                alertId: $scope.alert._id,
                operation: operation,
                threshold: threshold,
                interval: $scope.interval,
                name: $scope.name,
                widgetId: $scope.widgetDetails._id,
                metricId: parsedData[0],
                objectId: objectId,
                endPoint: parsedData[1],
                mailingId: {email: $scope.email}
            };
        }
        else {
            var alertData = {
                operation: operation,
                threshold: threshold,
                interval: $scope.interval,
                name: $scope.name,
                widgetId: $scope.widgetDetails._id,
                metricId: parsedData[0],
                objectId: objectId,
                endPoint: parsedData[1],
                mailingId: {email: $scope.email}
            };
        }

        $http({
            method: 'POST',
            url: '/api/v1/alerts',
            data: alertData
        }).then(
            function successCallback(alert) {
                var updatedData = {
                    objectId: objectId,
                    metricId: parsedData[0],
                    bgFetch: true
                };
                $http({
                    method: 'POST',
                    url: '/api/v1/bgFetchUpdate',
                    data: updatedData
                }).then(
                    function successCallback(alert) {
                        $scope.changeViewsInAlertModal('step_one');
                    },
                    function errorCallback(error) {
                        $scope.$parent.closeBasicWidgetModal('');
                        swal("Sorry! Something went wrong, Please try again.");
                    }
                );
            },
            function errorCallback(error) {
                $scope.$parent.closeBasicWidgetModal('');
                swal("Sorry! Something went wrong, Please try again.");
            }
        );
    };

    $scope.deleteAlert = function (alert, index) {
        $http({
            method: 'POST',
            url: '/api/v1/remove/alerts/' + alert._id
        }).then(
            function successCallback(alert) {
                $scope.fetchWidgetAlerts();
            },
            function errorCallback(error) {
                $scope.$parent.closeBasicWidgetModal('');
                swal("Sorry! Something went wrong, Please try again.");
            }
        );
    };

    $scope.editAlert = function (alert, metric) {
        isEdit = true;
        $scope.alert = alert;
        $scope.metricName = metric;
        $scope.alertFunction();
        $scope.changeViewsInAlertModal('step_two');
    };

}