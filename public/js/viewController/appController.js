showMetricApp.controller('AppController', AppController)

function AppController($http,$state,$scope) {

    $scope.loading=false;

    $scope.fetchUserName = function() {
        $http(
            {
                method: 'GET',
                url: '/api/v1/me'
            }
        ).then(
            function successCallback(response) {
                $scope.userName = response.data.userDetails[0].name;
            },
            function errorCallback(error) {
                $scope.userName = '';
            }
        );
    };

    $scope.createNewDashboard = function() {
        $scope.loading=true;
        $http(
            {
                method: 'POST',
                url: '/api/v1/create/dashboards'
            }
        ).then(
            function successCallback(response){
                $state.go('app.reporting.dashboard',{id: response.data});
            },
            function errorCallback(error){
                swal({
                    title: "",
                    text: "<span style='sweetAlertFont'>Something went wrong! Please try again!</span> .",
                    html: true
                });
            }
        )
    };
}