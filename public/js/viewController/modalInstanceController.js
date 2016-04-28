showMetricApp.controller('ModalInstanceController', ModalInstanceController)

function ModalInstanceController($scope, $uibModalInstance) {
    $scope.ok = function () {$uibModalInstance.close();};
    $scope.cancel = function () {$uibModalInstance.dismiss('cancel');};
}
