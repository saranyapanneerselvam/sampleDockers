showMetricApp.controller('AppController', AppController)

function AppController($http,$state,$scope) {
    $scope.createNewDashboard = function(){
        $http({
            method: 'POST', url: '/api/v1/create/dashboards'
        }).then(function successCallback(response){
            console.log(response);
            $state.transitionTo('app.reporting.dashboard',{id:response.data.id});
        },function errorCallback(error){
            console.log('Error in creating new Dashboard',error);
        })
    };
}