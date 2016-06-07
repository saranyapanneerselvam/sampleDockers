showMetricApp.controller('SwitchController',SwitchController)

function SwitchController($scope,$http,$state,$rootScope,$window,$stateParams,generateChartColours) {
    //console.log("SwitchController called");
    

    $scope.changeCallback = function () {
        console.log("switch change");
        console.log($scope.enabled);
    }
}