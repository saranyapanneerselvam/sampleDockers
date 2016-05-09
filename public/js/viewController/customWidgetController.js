showMetricApp.controller('CustomWidgetController',CustomWidgetController)

function CustomWidgetController($scope,$uibModal) {
    $scope.remove = function(widget) {
        $scope.dashboard.widgets.splice($scope.dashboard.widgets.indexOf(widget), 1);
        console.log('removed');
    };
    $scope.openSettings = function(widget) {
        $uibModal.open({
            scope: $scope,backdrop: true,
            templateUrl: 'widget_settings.ejs',
            controller: 'WidgetSettingsController',
            resolve: {
                widget: function() {
                    return widget;
                }
            }
        });
    };
}
