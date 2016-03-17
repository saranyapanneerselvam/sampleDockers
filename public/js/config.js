/**
 * INSPINIA - Responsive Admin Theme
 *
 * Inspinia theme use AngularUI Router to manage routing and views
 * Each view are defined as state.
 * Initial there are written state for all view in theme.
 *
 */
function config($stateProvider, $urlRouterProvider, $ocLazyLoadProvider, IdleProvider, KeepaliveProvider) {

    // Configure Idle settings
    IdleProvider.idle(5); // in seconds
    IdleProvider.timeout(120); // in seconds

    $urlRouterProvider.otherwise("/reporting/dashboard");

    $ocLazyLoadProvider.config({
        // Set to true if you want to see what and when is dynamically loaded
        debug: false
    });

    $stateProvider

    //Defining 'app' state that will control the actions of the entire page
        .state('app', {
            abstract: true,
            templateUrl: "common/content.ejs",
            controller: 'AppController'
        })

        //Defining two sub-parent states 'adReporting' and 'reporting'
        //Sub-parent state #1
        .state('app.adReporting', {
            abstract: true,
            url: "/adReporting"
        })

        //Sub-parent state #2
        .state('app.reporting', {
            abstract: true,
            url: "/reporting"
        })

        //Defining child states for parent state: 'reporting'
        .state('app.reporting.dashboard', {
            url: "/dashboard",
            views: {
                'main@app': {
                    templateUrl: "dashboardTemplate.ejs",
                    controller: 'DashboardController'
                }
            },
            resolve: {
                loadPlugin: function ($ocLazyLoad) {
                    return $ocLazyLoad.load([
                        {
                            files: ['css/angular-gridster/angular-gridster.min.css',
                                'css/angular-gridster/style_gridster.css',
                                'js/angular-gridster/jquery.resize.js'
                            ]
                        }
                    ]);
}
}
})

        .state('app.reporting.dashboard.basicWidget', {
            url: "/lightBox",
            views: {
                'lightbox@app.reporting.dashboard': {
                    templateUrl: "basicWidget.ejs",
                    controller: 'LightBoxController'
                }
            },
            resolve: {
                loadPlugin: function ($ocLazyLoad) {
                    return $ocLazyLoad.load([
                        {
                            files: ['css/plugins/steps/jquery.steps.css']
                        }
                    ]);
                }
            }
        });
}
angular
    .module('inspinia')
    .config(config)
    .run(function($rootScope, $state) {
        $rootScope.$state = $state;
    });