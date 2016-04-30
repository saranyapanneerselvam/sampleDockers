showMetricApp.controller('ModalInstanceController', ModalInstanceController)

function ModalInstanceController($scope, $rootScope, $http, $uibModalInstance) {
    $scope.ok = function () {
        $uibModalInstance.close();
    };

    $scope.cancel = function () {
        $uibModalInstance.dismiss('cancel');
    };

    $scope.closeBasicWidgetModal = function(currentModalView){
        console.log("closeBasicWidgetModal called : "+currentModalView);
        if(currentModalView=="step_two"){
            var lastWidgetId = $rootScope.customWidgetId;
            console.log("lastWidgetId : "+lastWidgetId);
            // Need to check this delete api which is already written. Because there is delay in response. But the last custom widget created is being deleted in this api call
            $http({
                method: 'POST',
                url: '/api/v1/delete/widgets/'+lastWidgetId
            }).then(function successCallback(response){
               console.log(response);
            },function errorCallback(error){
                console.log('Error in deleting profile',error)
            });

        }
        $uibModalInstance.dismiss('cancel');
    };
}
