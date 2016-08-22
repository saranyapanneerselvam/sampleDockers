showMetricApp.controller('CustomWidgetController',CustomWidgetController)

function CustomWidgetController($scope,$uibModal) {
    $scope.remove = function(widget) {
        $scope.dashboard.widgets.splice($scope.dashboard.widgets.indexOf(widget), 1);
    };
    $scope.openSettings = function(widget) {
        $uibModal.open({
            scope: $scope,
            backdrop: true,
            templateUrl: 'fusion_settings.ejs',
            controller: 'FusionSettingsController',
            resolve: {
                widget: function() {
                    return widget;
                }
            }
        });
    };
}
