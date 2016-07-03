showMetricApp.controller('GridviewController', GridviewController);

function GridviewController($scope,$http) {
    $scope.dashboardList = null;

    $(".navbar").css('z-index','1');
    $(".md-overlay").css("background","rgba(0,0,0,0.5)");
    $("#getLoadingModalContent").addClass('md-show');

    $scope.fetchAllDashboards = function(){
        $http({
            method: 'GET', url: '/api/v1/get/dashboardList'
        }).then(function successCallback(response){
            if(response.status == '200')
                $scope.dashboardList = response.data.dashboardList;
            else
                $scope.dashboardList = null;
            $("#getLoadingModalContent").removeClass('md-show');
        },function errorCallback(error){
            $("#getLoadingModalContent").removeClass('md-show');
            $scope.dashboardList = null;
            $(".navbar").css('z-index','1');
            $(".md-overlay").css("background","rgba(0,0,0,0.5)");
            $("#somethingWentWrongModalContent").addClass('md-show');
            //swal({  title: "", text: "<span style='sweetAlertFont'>Please try again! Something is missing</span> .",   html: true });
        })
    };

    $scope.deleteDashboard = function(dashboard){

        $(".navbar").css('z-index','1');
        $(".md-overlay").css("background","rgba(0,0,0,0.5)");
        $("#getLoadingModalContent").addClass('md-show');

        $http({
            method:'POST', url:'/api/v1/delete/userDashboards/' + dashboard._id
        }).then(function successCallback(response){
            $("#getLoadingModalContent").removeClass('md-show');
            $scope.fetchAllDashboards();
        },function errorCallback(error){
            $("#getLoadingModalContent").removeClass('md-show');
            $(".navbar").css('z-index','1');
            $(".md-overlay").css("background","rgba(0,0,0,0.5)");
            $("#somethingWentWrongModalContent").addClass('md-show');
            $("#somethingWentWrongText").text("Unable to delete dashboard.Please try again");
            //swal({  title: "", text: "<span style='sweetAlertFont'>Unable to delete dashboard.Please try again</span> .",   html: true });
            console.log('Error in deleting the widget',error);
        });
    }
}