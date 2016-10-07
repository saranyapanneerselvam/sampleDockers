showMetricApp.controller('ChooseDashboardController',ChooseDashboardController)

function ChooseDashboardController($scope,$state,$q,$http,$stateParams,$rootScope) {
    $scope.enabletextField=false;
    $scope.dashboardName;
    $scope.enableTextField=function (name) {
        $scope.enabletextField=true;
    }
    $scope.closemodal=function(){
        changeState().then(
            function () {
                $state.go('app.reporting.dashboard',{id:$rootScope.stateDashboard._id});
            }
        )
    }

    $scope.goRecommendedDashboard=function () {
        changeState().then(
            function () {
                $state.go('app.reporting.recommendedDashboard');
            }
        )
    }
    function changeState(){
        var deferred = $q.defer();
        CloseModal();
        function CloseModal(){
            $scope.ok();
            deferred.resolve("open")
        }
        return deferred.promise;
    }
    $scope.createDashboard = function(name) {
        $scope.loading=true;
        var jsonData = {
            name:name,
            startDate:moment(new Date()).subtract(30,'days'),
            endDate: new Date()
        };
        $http(
            {
                method: 'POST',
                url: '/api/v1/create/dashboards',
                data:jsonData
            }
        ).then(
            function successCallback(response){
                $state.go('app.reporting.dashboard',{id: response.data});
            },
            function errorCallback(error){
                swal({
                    title: "",
                    text: "<span style='sweetAlertFont'>Something went wrong! Please try again!</span> .",
                    html: true
                });
            }
        )
    };
}