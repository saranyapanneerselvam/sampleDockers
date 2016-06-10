showMetricApp.controller('AppController', AppController)

function AppController($http,$state,$scope) {

    $scope.loading=false;

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
                console.log('Error in creating new Dashboard',error);
            }
        )
    };
}