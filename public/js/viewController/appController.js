showMetricApp.controller('AppController', AppController)
function AppController($http, $state, $scope,$rootScope) {
    $scope.loading = false;
    $scope.fetchUserName = function () {
        $scope.userName = '';
        $http({
                method: 'GET',
                url: '/api/v1/me'
            }
        ).then(
            function successCallback(response) {
                if (response.data.userDetails.subscriptionType === 'free') {
                    $scope.userName = response.data.userDetails.user[0].name;
                }
                else {
                    if (response.data.userDetails.statusCode === 1002) {
                        $rootScope.isExpired = true;
                        $scope.userName = response.data.userDetails.user[0].name;
                        $state.go('app.reporting.upgrade');
                    }
                    else {
                        $rootScope.isExpired = false;
                        $scope.userName = response.data.userDetails.user[0].name;
                    }
                }
            },
            function errorCallback(error) {
                $scope.userName = '';
            }
        )
    };

    $scope.createNewDashboard = function () {
        //send a request and get the available dashboards counts
        $http(
            {
                method: 'GET',
                url: '/api/v1/subscriptionLimits' + '?requestType=' + 'dashboards'
            }
        ).then(
            function successCallback(response){
                if($rootScope.isExpired === false){
                    if(response.data.availableDashboards > 0){
                        $scope.loading=true;
                        $http(
                            {
                                method: 'POST',
                                url: '/api/v1/create/dashboards'
                            }
                        ).then(
                            function successCallback(response) {
                                $state.go('app.reporting.dashboard', {id: response.data});
                            },
                            function errorCallback(error) {
                                swal({
                                    title: "",
                                    text: "<span style='sweetAlertFont'>Something went wrong! Please try again!</span> .",
                                    html: true
                                });
                            }
                        )
                    }
                    else {
                        toastr.info('Dashboard limit is reached !')
                    }
                }
                else {
                    toastr.info('Please renew !')
                }
            },
            function errorCallback(error) {
                swal({
                    title: "",
                    text: "<span style='sweetAlertFont'>Something went wrong! Please try again!</span> .",
                    html: true
                });
            }
        )
    };
}