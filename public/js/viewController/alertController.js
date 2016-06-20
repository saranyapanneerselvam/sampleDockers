showMetricApp.controller('AlertController', AlertController)
function AlertController($scope, $http, $q, $state, $rootScope, $window, $stateParams, generateChartColours) {

    var isEdit = false;
    $scope.alert, $scope.metricName, $scope.currentView = 'step_one', $scope.operation,  $scope.storedAlertsForWidget = [], $scope.storeMetric = [];
    var storeMetricDetails = [], storeMetricDetailsInEdit = [];

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
            $scope.storeMetric = [];
            $scope.storeFinalMetric = '';
            $scope.storedAlertsForWidget = [];
            $scope.fetchAlertsForWidget();
                   }
        else if ($scope.currentView === 'step_two') {
            if (isEdit == true) {
                console.log('alertsDetail', $scope.alert, $scope.metricName, $scope.metricName._id);
                if ($scope.alert.operation.gt === true) {
                    $scope.operation = 'gt';
                }
                else {
                    $scope.operation = 'lt';
                }
                console.log('operation', [$scope.metricName._id, $scope.metricName.objectTypes[0].meta.endpoint[0]])
                $scope.name = $scope.alert.name;
                $scope.metric = [$scope.metricName._id, $scope.metricName.objectTypes[0].meta.endpoint[0]];
                $scope.operation = $scope.operation;
                $scope.threshold = $scope.alert.threshold.gt;
                $scope.interval = $scope.alert.interval;
                $scope.email = $scope.alert.mailingId.email;
            }
            else {
                $scope.metricDetails = [];
                $scope.storeMetric = [];
                $scope.storeFinalMetric = '';
                $scope.alertFunction();
            }
        }
        ;
    };

    $scope.fetchAlertsForWidget = function () {
        $http({
            method: 'GET',
            url: '/api/v1/get/alerts/' + $rootScope.selectedWidget.id
        }).then(
            function successCallback(response) {
                console.log('InsideOfSuccessCallback',response.status);
                if(response.status == '200') {
                    $scope.storedAlertsForWidget = ({data: response.data});
                    console.log('$scope.storedAlertsForWidget', $scope.storedAlertsForWidget);
                    for (var i = 0; i < $scope.storedAlertsForWidget.data.length; i++) {
                        console.log('storedAlertsForWidget', $scope.storedAlertsForWidget.data[i].metricId);
                        storeMetricDetailsInEdit.push($scope.getMetricDetails($scope.storedAlertsForWidget.data[i].metricId, i));
                    }
                    $q.all(storeMetricDetailsInEdit).then(
                        function successCallback(storeMetricDetailsInEdit) {
                            for (var j = 0; j < $scope.storedAlertsForWidget.data.length; j++) {
                                for (var i = 0; i < storeMetricDetailsInEdit.length; i++) {
                                    if ($scope.storedAlertsForWidget.data[j].metricId === storeMetricDetailsInEdit[i].metrics[0]._id)
                                        $scope.storeMetric[i] = ({name: storeMetricDetailsInEdit[i].metrics[0]});
                                }
                            }
                        },
                        function errorCallback(error) {
                            $scope.$parent.closeBasicWidgetModal('');
                            swal("Sorry! Something went wrong, Please try again.");
                        }
                    );
                }
                else{$scope.storedAlertsForWidget=[];
                }
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
        }).then(function successCallback(metric) {
            deferred.resolve({
                index: index,
                metrics: metric.data.metricsList
            });
            console.log('metrics', metric);

        }, function errorCallback(error) {
            console.log('Error in finding metric', error);
            deferred.reject(error);
        });
        return deferred.promise;
    };

    $scope.alertFunction = function () {
        console.log('enteringFunction', $rootScope.selectedWidget.id, isEdit);
        if (isEdit == true) {
            var widgetId = $scope.alert.widgetId;
        }
        else {
            var widgetId = $rootScope.selectedWidget.id
        }
        $http({
            method: 'GET',
            url: '/api/v1/widget/' + widgetId
        }).then(function successCallback(response) {
            //console.log('res', response)
            $scope.widgetDetails = response.data[0];
            //console.log('widgett', response,$scope.widgetDetails.charts.length);
            for (var i = 0; i < $scope.widgetDetails.charts.length; i++) {
                console.log('fusion for');
                storeMetricDetails.push($scope.getMetricDetails($scope.widgetDetails.charts[i].metrics[0].metricId, i));
            }
            $q.all(storeMetricDetails).then(function successCallback(storeMetricDetails) {
                // console.log('storeMetricDetails', storeMetricDetails);
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
                        // console.log('else');
                        $scope.storeFinalMetric.push({
                            name: $scope.metricDetails[i].metrics[0].name,
                            _id: $scope.metricDetails[i].metrics[0]._id
                        });
                    }

                }
                console.log('$scope.metricDetails', $scope.metricDetails, $scope.storeFinalMetric);
            }, function errorCallback(err) {
                console.log('Error in fetching profiles');
            });

        }, function errorCallback(error) {
            console.log('Error in finding widget', error);
        });
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
        }
        $http({
            method: 'POST',
            url: '/api/v1/alerts',
            data: alertData
        }).then(function successCallback(alert) {
            console.log('alert is success')
            var updataData = {
                objectId: objectId,
                metricId: parsedData[0], bgFetch: true
            };
            $http({
                method: 'POST',
                url: '/api/v1/bgFetchUpdate',
                data: updataData
            }).then(function successCallback(alert) {
                console.log('bg fetch update is success')

            }, function errorCallback(error) {

            });

        }, function errorCallback(error) {

        });
    };

    $scope.deleteAlert = function (alert, index) {
        console.log('deleteAlert', alert, index);
        $http({
            method: 'POST',
            url: '/api/v1/remove/alerts/' + alert._id
        }).then(function successCallback(alert) {
            console.log('bg fetch update is success')
            $scope.fetchAlertsForWidget();
        }, function errorCallback(error) {

        });
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