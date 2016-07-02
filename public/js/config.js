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
            template: '{{loadingVariable}}',
            controller: function ($http,$state,$scope){
                $scope.loadingVariable = '';
                if($state.$current.name == 'app.reporting'){
                    $scope.loadingVariable = 'LOADING';
                    $http(
                        {
                            method: 'GET',
                            url: '/api/v1/me'
                        }
                    ).then(
                        function successCallback(response) {
                            if(response.data.userDetails[0].lastDashboardId) {
                                $scope.loadingVariable = '';
                                $state.go('.dashboard',{id: response.data.userDetails[0].lastDashboardId});
                            }
                            else {
                                $scope.createNewDashboard();
                            }
                        },
                        function errorCallback(error) {
                            $scope.createNewDashboard();
                        }
                    );
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
            onEnter: function ($stateParams,$http,$state) {
                var dashboardId = $stateParams.id? $stateParams.id : $state.params.id;
                $http(
                    {
                        method:'POST',
                        url:'/api/v1/updateLastDashboardId/' + dashboardId
                    }
                ).then(
                    function successCallback(response){
                    },
                    function errorCallback (error){
                        console.log('Failure in updating last dashboard id',error)
                    }
                );
            }
        })

        .state('app.reporting.dashboard.basicWidget', {
            url: "/{widgetType}",
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

        .state('app.reporting.dashboard.fusionWidget', {
            url: "",
            views: {
                'lightbox@app.reporting.dashboard': {
                    templateUrl: "fusionWidget.ejs",
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

        .state('app.reporting.dashboard.exportModal', {
            url: "",
            views: {
                'lightbox@app.reporting.dashboard': {
                    templateUrl: "exportModal.ejs",
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

        .state('app.reporting.dashboard.alertModal', {
            url: "",
            //params: {selectedWidget: null},
            views: {
                'lightbox@app.reporting.dashboard': {
                    params: {selectedWidget: null},
                    templateUrl: "alertModal.ejs",
                    controller: 'LightBoxController',
                }
            },
            onEnter: function ($stateParams,$state) {
                console.log($state.params,$stateParams);
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


        .state('app.reporting.dashboard.exportMessageModal', {
            url: "",
            views: {
                'lightbox@app.reporting.dashboard': {
                    templateUrl: "exportMessage.ejs",
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

        .state('app.reporting.dashboard.recommendedDashboard', {
            url: "",
            views: {
                'lightbox@app.reporting.dashboard': {
                    templateUrl: "recommendedDashboard.ejs",
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