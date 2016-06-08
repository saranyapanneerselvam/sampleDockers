showMetricApp.controller('SwitchController',SwitchController)

function SwitchController($scope,$http,$state,$rootScope,$window,$stateParams,generateChartColours) {
    //console.log("SwitchController called");
    $rootScope.tempDashboard=true;
    var contentHeight = "";
    var contentWidth = "";

    $scope.changeCallback = function () {
        console.log("switch change : "+$scope.enabled);
        contentHeight = $("#page-wrapper").height();
        contentWidth = $("#page-wrapper").width();
        $(".viewport").css("width",contentWidth).css("height",contentHeight);
        if($scope.enabled==false){
            //console.log("if switch change : "+$scope.enabled);
            $rootScope.tempDashboard=true;
        }
        else{
            //console.log("else switch change : "+$scope.enabled);
            $rootScope.tempDashboard=false;
        }

    }
}