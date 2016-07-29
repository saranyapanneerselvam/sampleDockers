function config($stateProvider, $urlRouterProvider, $ocLazyLoadProvider, IdleProvider, KeepaliveProvider) {

    $ocLazyLoadProvider.config({
        // Set to true if you want to see what and when is dynamically loaded
        debug: false
    });

    $stateProvider

        .state('app', {
            url: "/:id",
            templateUrl: "sharingDashboard.ejs",
            controller: 'SharedDashboardController'
        })
        .state('error', {
            templateUrl: "dashboardTemplate.ejs"
        });
}
angular
    .module('inspinia')
    .config(config)
    .run(function($rootScope, $state) {
        $rootScope.$state = $state;
    });