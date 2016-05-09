function exportConfig($stateProvider, $urlRouterProvider, $ocLazyLoadProvider, IdleProvider, KeepaliveProvider) {

    // Configure Idle settings
    IdleProvider.idle(5); // in seconds
    IdleProvider.timeout(120); // in seconds

    $urlRouterProvider.otherwise("/reporting");

    $ocLazyLoadProvider.config({
        // Set to true if you want to see what and when is dynamically loaded
        debug: false
    });

    $stateProvider

    //Defining 'app' state that will control the actions of the entire page
        .state('app', {
            abstract: true,
            templateUrl: "common/exportContent.ejs",
            controller: 'ExportAppController'
        })

        //Sub-parent state #2
        .state('app.reporting', {
            url: "/reporting",
            template: '{{loading}}',
            controller: function ($http,$state,$scope,$rootScope){
                console.log('Inside the controller');
                console.log($state.$current.name,$rootScope.dashboardId,$rootScope.startDate,$rootScope.endDate);
                $scope.loading = "....";
                $state.go('app.reporting.dashboard',{id: $rootScope.dashboardId});
            }
        })

        //Defining child states for parent state: 'reporting'
        .state('app.reporting.dashboard', {
            url: "/dashboard/:id",
            views: {
                'main@app': {
                    templateUrl: "exportDashboardTemplate.ejs",
                    controller: 'ExportDashboardController'
                }
            }
        });
}
angular
    .module('exportPDF')
    .config(exportConfig)
    .run(function($rootScope, $state) {
        $rootScope.$state = $state;
    });