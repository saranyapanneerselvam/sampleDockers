showMetricApp.controller('SwitchController',SwitchController)

function SwitchController($scope,$http,$state,$rootScope,$window,$stateParams,generateChartColours) {
/*    //console.log("SwitchController called");
    $rootScope.tempDashboard=true;
    var contentHeight = "";
    var contentWidth = "";


    $rootScope.$on("CallSwitchChangeFunc", function(getValue){
        $scope.changeCallback(getValue);
    });

    $scope.changeCallback = function (getValue) {
        // contentHeight = $("#page-wrapper").height();
        // contentWidth = $("#page-wrapper").width();
        // $("#widgetTransparentImage").css("width",contentWidth).css("height",contentHeight);

        if($scope.switchEnabled==false){
            //console.log("if switch change : "+$scope.enabled);
            $rootScope.tempDashboard=true;
        }
        else{
            //console.log("else switch change : "+$scope.enabled);
            if(getValue==1){
                $rootScope.tempDashboard=false;
                $rootScope.$emit("getDashboardCommentsFunc", {value:0});   // Get dashboard comments from the Database
            }
            else{
                $scope.switchEnabled=false;
                $rootScope.tempDashboard=true;
            }

        }

    }*/
}