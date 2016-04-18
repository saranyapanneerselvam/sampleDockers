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

    $urlRouterProvider.otherwise("/reporting");

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
            url: "/reporting",
            template: '{{loading}}',
            controller: function ($http,$state,$scope){
                $scope.loading = "";
                if($state.$current.name == 'app.reporting'){
                    $scope.loading="loading...";
                    $http({
                        method: 'GET', url: '/api/v1/me'
                    }).then(function successCallback(response) {
                        var currentDashboardId = response.data.userDetails[0].lastDashboardId;
                        $state.go('.dashboard',{id: currentDashboardId});
                        $scope.loading='';
                    }, function errorCallback(error) {
                        console.log('Error in finding dashboard Id',error);
                        return error;
                    });
                }
            }
        })

        //Defining child states for parent state: 'reporting'
        .state('app.reporting.dashboard', {
            url: "/dashboard/:id",
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
            },
            onEnter: function ($stateParams,$http) {
                $http({
                    method:'POST', url:'/api/v1/updateLastDashboardId/' + $stateParams.id
                }).then(function successCallback(response){
                    console.log('successfully updated last dashboard id',response)
                },function errorCallback (error){
                    console.log('Failure in updating last dashboard id',error)
                });
            }
        })

        .state('app.reporting.dashboard.basicWidget', {
            url: "",
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
        })

        .state('app.reporting.dashboard.dashboardName', {
            url: "",
            views: {
                'lightbox@app.reporting.dashboard': {
                    templateUrl: "dashboardName.ejs",
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
        })

        .state('app.reporting.dashboards', {
            url: "/gridView",
            views: {
                'main@app': {
                    templateUrl: "gridView.ejs",
                    controller: 'GridviewController'
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