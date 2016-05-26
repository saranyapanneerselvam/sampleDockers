showMetricApp.controller('GridviewController', GridviewController)

function GridviewController($scope,$http) {
    $scope.dashboardList = null;
    $scope.fetchAllDashboards = function(){
        $http({
            method: 'GET', url: '/api/v1/get/dashboardList'
        }).then(function successCallback(response){
            //console.log(response);
            if(response.status == '200')
                $scope.dashboardList = response.data.dashboardList;
            else
                $scope.dashboardList = null;
        },function errorCallback(error){
            //console.log('Error in creating new Dashboard',error);
            $scope.dashboardList = null;
            swal({  title: "", text: "<span style='sweetAlertFont'>Please try again! Something is missing</span> .",   html: true });
        })
    };

    $scope.deleteDashboard = function(dashboard){
       // console.log('girdDashboard',index,dashboard._id);
        $http({
            method:'POST', url:'/api/v1/delete/userDashboards/' + dashboard._id
        }).then(function successCallback(response){
            console.log('dashboardDeleted',response);
            $scope.fetchAllDashboards();
        },function errorCallback(error){
            swal({  title: "", text: "<span style='sweetAlertFont'>Unable to delete dashboard.Please try again</span> .",   html: true });
            console.log('Error in deleting the widget',error);
        });

    }
}