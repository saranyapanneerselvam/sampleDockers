showMetricApp.controller('LightBoxController', LightBoxController)

function LightBoxController($scope, $uibModal, $log, $state) {
    $scope.state = $state;
    $scope.animationsEnabled = true;
    $scope.open = function (size) {
        var modalInstance = $uibModal.open({
            animation: $scope.animationsEnabled,
            templateUrl: 'modal.ejs',
            controller: 'ModalInstanceController',
            size: size
        });
        modalInstance.result.then(function (selectedItem) {
            $scope.selected = selectedItem;
            $state.go('^');
        }, function () {
            $state.go('^');$log.info('Modal dismissed at: ' + new Date());
        });
    };
    $scope.toggleAnimation = function () {$scope.animationsEnabled = !$scope.animationsEnabled;};
}
