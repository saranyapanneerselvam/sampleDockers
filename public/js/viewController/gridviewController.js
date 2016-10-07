showMetricApp.controller('GridviewController', GridviewController);

function GridviewController($scope,$http,$window,$rootScope) {
    $scope.dashboardList = null;
    $scope.gridloading=true;
    $(".navbar").css('z-index','1');
    $(".md-overlay").css("background","rgba(0,0,0,0.5)");

    angular.element($window).on('resize', function (e) {
        $scope.docHeight = window.innerHeight;
        $scope.docHeight = $scope.docHeight - 105;
    });

    $scope.fetchAllDashboards = function(){
        $scope.docHeight = window.innerHeight;
        $scope.docHeight = $scope.docHeight-105;
        $http({
            method: 'GET', url: '/api/v1/get/dashboardList'
        }).then(
            function successCallback(response){
                $scope.gridloading=false;
                if(response.status == '200')
                    $scope.dashboardList = response.data.dashboardList;
                else
                    $scope.dashboardList = null;
            },
            function errorCallback(error){
                $scope.gridloading=false;
                $scope.dashboardList = null;
                $(".navbar").css('z-index','1');
                $(".md-overlay").css("background","rgba(0,0,0,0.5)");
                $("#somethingWentWrongModalContent").addClass('md-show');
                //swal({  title: "", text: "<span style='sweetAlertFont'>Please try again! Something is missing</span> .",   html: true });
            }
        )
    };

    $scope.deleteDashboard = function(dashboard){
        swal({
                title: "Confirm Delete?",
                text: "Dashboard and all its contents will be removed",
                type: "warning",
                showCancelButton: true,
                confirmButtonColor: "#DD6B55",
                confirmButtonText: "Confirm",
                closeOnConfirm: true
            },
            function () {
                $scope.gridloading=true;
                $(".navbar").css('z-index', '1');
                $(".md-overlay").css("background", "rgba(0,0,0,0.5)");
                $http({
                    method: 'POST',
                    url: '/api/v1/delete/userDashboards/' + dashboard._id
                }).then(
                    function successCallback(response) {
                        $rootScope.fetchRecentDashboards()
                        $scope.fetchAllDashboards();
                    },
                    function errorCallback(error) {
                        $(".navbar").css('z-index','1');
                        $(".md-overlay").css("background","rgba(0,0,0,0.5)");
                        $("#somethingWentWrongModalContent").addClass('md-show');
                        $("#somethingWentWrongText").text("Unable to delete dashboard.Please try again");
                    }
                );
            }
        );
    }
}