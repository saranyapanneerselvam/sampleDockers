showMetricApp.controller('GridviewController', GridviewController)

function GridviewController($scope,$http) {
    $scope.fetchAllDashboards = function(){
        $http({
            method: 'GET', url: '/api/v1/get/dashboards'
        }).then(function successCallback(response){
            console.log(response.data);
            $scope.dashboardList = response.data.dashboardList;
        },function errorCallback(error){
            console.log('Error in creating new Dashboard',error);
        })
    };
}