showMetricApp.controller('GridviewController', GridviewController)

function GridviewController($scope,$http) {
    $scope.dashboardList = null;
    $scope.fetchAllDashboards = function(){
        $http({
            method: 'GET', url: '/api/v1/get/dashboardList'
        }).then(function successCallback(response){
            console.log(response);
            if(response.status == '200')
                $scope.dashboardList = response.data.dashboardList;
            else
                $scope.dashboardList = null;
        },function errorCallback(error){
            console.log('Error in creating new Dashboard',error);
            $scope.dashboardList = null;
        })
    };
}