showMetricApp.controller('AlertController', AlertController)
function AlertController($scope, $http, $q, $state, $rootScope, $window, $stateParams, generateChartColours) {
    console.log('$rootScope.id', $rootScope.selectedWidget.id);
    var storeMetricDetails = [];

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
    }

    $http({
        method: 'GET',
        url: '/api/v1/widget/' + $rootScope.selectedWidget.id
    }).then(function successCallback(response) {
        console.log('res', response)
        $scope.widgetDetails = response.data[0];
        console.log('widgett', response);
        for (var i = 0; i < $scope.widgetDetails.charts.length; i++) {
            console.log('fusion for');
            storeMetricDetails.push($scope.getMetricDetails($scope.widgetDetails.charts[i].metrics[0].metricId, i));
        }
        $q.all(storeMetricDetails).then(function successCallback(storeMetricDetails) {
            console.log('storeMetricDetails',storeMetricDetails);
            $scope.metricDetails = storeMetricDetails;
            $scope.storeFinalMetric = [];
            var metricsLength = $scope.metricDetails.length;

            for (var i = 0; i < metricsLength; i++) {
                console.log('endpoint', $scope.metricDetails[i].metrics[0].objectTypes[0].meta.endpoint)
                if ($scope.metricDetails[i].metrics[0].objectTypes[0].meta.endpoint.length != 0  ) {
                    console.log('metric if');
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
                else{
                    console.log('else');
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
    }
}