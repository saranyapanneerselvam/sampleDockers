showMetricApp.controller('SwitchController',SwitchController)

function SwitchController($scope,$http,$state,$rootScope,$window,$stateParams,generateChartColours) {
    //console.log("SwitchController called");
    $rootScope.tempDashboard=true;


    $scope.changeCallback = function () {
        //console.log("switch change");
        console.log("switch change : "+$scope.enabled);
        if($scope.enabled==false){
            console.log("if switch change : "+$scope.enabled);
            $rootScope.tempDashboard=true;
        }
        else{
            console.log("else switch change : "+$scope.enabled);
            $rootScope.tempDashboard=false;
        }

        if($rootScope.isCloseComment==1){
            $scope.changeCallback();
            $rootScope.isCloseComment=0;
        }
    }
}