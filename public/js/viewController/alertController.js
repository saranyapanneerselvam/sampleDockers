showMetricApp.controller('AlertController', AlertController)
function AlertController($scope, $http, $q, $state, $rootScope, $window, $stateParams, generateChartColours) {

    var isEdit = false;
    $scope.alert, $scope.metricName, $scope.currentView = 'step_one', $scope.operation,  $scope.storedAlertsForWidget = [], $scope.metricsInStoredAlerts = [];
    var storeMetricDetails = [], widgetMetricDetails = [];

    $scope.changeViewsInAlertModal = function (obj) {
        $scope.currentView = obj;
        if ($scope.currentView === 'step_one') {
            isEdit = false;
            $scope.name = '';
            $scope.metric = '';
            $scope.operation = '';
            $scope.threshold = '';
            $scope.interval = '';
            $scope.email = '';
            $scope.metricDetails = '';
            $scope.metricsInStoredAlerts = [];
            $scope.storeFinalMetric = '';
            $scope.storedAlertsForWidget = [];
            $scope.fetchAlertsForWidget();
        }
        else if ($scope.currentView === 'step_two') {
            if (isEdit == true) {
                console.log('alertsDetail', $scope.alert, $scope.metricName, $scope.metricName._id);

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
                $scope.metricsInStoredAlerts = [];
                $scope.storeFinalMetric = '';
                $scope.alertFunction();
            }
        }
    };

    $scope.fetchAlertsForWidget = function () {
        $http({
            method: 'GET',
            url: '/api/v1/get/alerts/' + $rootScope.selectedWidget.id
        }).then(
            function successCallback(response) {
                if(response.status == '200') {
                    $scope.storedAlertsForWidget = {
                        data: response.data
                    };
                    console.log($scope.storedAlertsForWidget);
                    for (var i = 0; i < $scope.storedAlertsForWidget.data.length; i++)
                        widgetMetricDetails.push($scope.getMetricDetails($scope.storedAlertsForWidget.data[i].metricId, i));
                    $q.all(widgetMetricDetails).then(
                        function successCallback(widgetMetricDetails) {
                            for (var j = 0; j < $scope.storedAlertsForWidget.data.length; j++) {
                                for (var i = 0; i < widgetMetricDetails.length; i++) {
                                    if ($scope.storedAlertsForWidget.data[j].metricId === widgetMetricDetails[i].metrics[0]._id) {
                                        console.log(widgetMetricDetails[i].metrics[0]);
                                        $scope.metricsInStoredAlerts[i] = {
                                            name: widgetMetricDetails[i].metrics[0]
                                        };
                                    }
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
                    $scope.storedAlertsForWidget=[];
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
                        $scope.metricDetails = storeMetricDetails;
                        $scope.storeFinalMetric = [];
                        var metricsLength = $scope.metricDetails.length;

                        for (var i = 0; i < metricsLength; i++) {
                            // console.log('endpoint', $scope.metricDetails[i].metrics[0].objectTypes[0].meta.endpoint)
                            if ($scope.metricDetails[i].metrics[0].objectTypes[0].meta.endpoint.length != 0) {
                                // console.log('metric if');
                                var endPointsLength = $scope.metricDetails[i].metrics[0].objectTypes[0].meta.endpoint.length;
                                for (var j = 0; j < endPointsLength; j++) {
                                    var metricName = $scope.metricDetails[i].metrics[0].name + '-' + $scope.metricDetails[i].metrics[0].objectTypes[0].meta.endpoint[j];
                                    $scope.storeFinalMetric.push({
                                        name: metricName,
                                        _id: $scope.metricDetails[i].metrics[0]._id,
                                        endPoints: $scope.metricDetails[i].metrics[0].objectTypes[0].meta.endpoint[j]
                                    });
                                }

                            }
                            else {
                                $scope.storeFinalMetric.push({
                                    name: $scope.metricDetails[i].metrics[0].name,
                                    _id: $scope.metricDetails[i].metrics[0]._id
                                });
                            }
                        }
                        if(isEdit == true) {
                            for(i=0;i<$scope.storeFinalMetric.length;i++) {
                                if($scope.alert.metricId == $scope.storeFinalMetric[i]._id) {
                                    if($scope.alert.endPoint != null) {
                                        if($scope.storeFinalMetric[i].name.includes($scope.alert.endPoint) == true) {
                                            $scope.metric = $scope.storeFinalMetric[i].name;
                                        }
                                    }
                                    else {
                                        $scope.metric = $scope.storeFinalMetric[i].name;
                                    }
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
        var objectId;
        console.log('inside alert', $scope.name, $scope.email, $scope.threshold, $scope.metric, $scope.operation, $scope.interval);
        console.log($rootScope.selectedWidget);
        var widgetDetail = $scope.widgetDetails.charts;
        console.log('widgets', widgetDetail)
        for (var k = 0; k < widgetDetail.length; k++) {
            var parsedData = JSON.parse($scope.metric)
            console.log('for', parsedData, widgetDetail[k].metrics[0].metricId)
            if (widgetDetail[k].metrics[0].metricId === parsedData[0]) {
                objectId = widgetDetail[k].metrics[0].objectId;
            }
        }
        console.log('objectId', objectId);
        var threshold = {};
        var operation = {};
        operation[$scope.operation] = true;
        threshold[$scope.operation] = $scope.threshold;
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

        $http({
            method: 'POST',
            url: '/api/v1/alerts',
            data: alertData
        }).then(
            function successCallback(alert) {
                console.log('alert is success');
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
                        changeViewsInAlertModal('step_one');
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
        console.log('deleteAlert', alert, index);
        $http({
            method: 'POST',
            url: '/api/v1/remove/alerts/' + alert._id
        }).then(
            function successCallback(alert) {
                $scope.fetchAlertsForWidget();
            },
            function errorCallback(error) {
                $scope.$parent.closeBasicWidgetModal('');
                swal("Sorry! Something went wrong, Please try again.");
            }
        );
    };

    $scope.editAlert = function (alert, metric) {
        console.log('alert', alert, metric);
        isEdit = true;
        $scope.alert = alert;
        $scope.metricName = metric;
        $scope.alertFunction();
        $scope.changeViewsInAlertModal('step_two');
    };

}