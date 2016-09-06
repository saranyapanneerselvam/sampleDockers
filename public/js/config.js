function config($stateProvider, $urlRouterProvider, $ocLazyLoadProvider, IdleProvider, KeepaliveProvider) {

    // Configure Idle settings
    IdleProvider.idle(5); // in seconds
    IdleProvider.timeout(120); // in seconds

    $urlRouterProvider.otherwise("/reporting");

    $ocLazyLoadProvider.config({
        debug: false
    });

    $stateProvider

        .state('app', {
            abstract: true,
            templateUrl: "common/content.ejs",
            controller: 'AppController'
        })

        .state('app.adReporting', {
            abstract: true,
            url: "/adReporting"
        })

        .state('app.reporting', {
            url: "/reporting",
            template: '{{loadingVariable}}',
            controller: function ($http,$state,$scope){
                $scope.loadingVariable = '';
                if($state.$current.name == 'app.reporting'){
                    $scope.loadingVariable = '';
                    $http(
                        {
                            method: 'GET',
                            url: '/api/v1/me'
                        }
                    ).then(
                        function successCallback(response) {
                            if(response.data.userDetails[0].lastDashboardId) {
                                $scope.loadingVariable = '';
                                if(response.data.userDetails[0].lastDashboardId != 'undefined')
                                    $state.go('.dashboard',{id: response.data.userDetails[0].lastDashboardId});
                                else
                                    $scope.createNewDashboard();
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
                            files: [
                                'css/angular-gridster/angular-gridster.min.css',
                                'css/angular-gridster/style_gridster.css',
                                'js/angular-gridster/jquery.resize.js'
                            ]
                        }
                    ]);
                }
            },
            onEnter: function ($stateParams,$http,$state) {
                var dashboardId = $stateParams.id? $stateParams.id : $state.params.id;
                if(typeof dashboardId != 'undefined') {
                    $http(
                        {
                            method:'POST',
                            url:'/api/v1/updateLastDashboardId/' + dashboardId
                        }
                    ).then(
                        function successCallback(response){
                        },
                        function errorCallback (error){
                        }
                    );
                }
            }
        })

        .state('app.reporting.dashboard.basicWidget', {
            url: "",
            views: {
                'lightbox@app.reporting.dashboard': {
                    templateUrl: "basicWidget.ejs",
                    controller: 'LightBoxController'
                }
            }
        })
        .state('app.reporting.dashboard.listProfile', {
            url: "",
            views: {
                'lightbox@app.reporting.dashboard': {
                    templateUrl: "profilelist.ejs",
                    controller: 'LightBoxController'
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
            }
        })

        .state('app.reporting.dashboard.exportModal', {
            url: "",
            views: {
                'lightbox@app.reporting.dashboard': {
                    templateUrl: "exportTemplate.ejs",
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

        .state('app.reporting.dashboard.exportMessageModal', {
            url: "",
            views: {
                'lightbox@app.reporting.dashboard': {
                    templateUrl: "exportMessage.ejs",
                    controller: 'LightBoxController'
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
        })

        .state('app.changePassword', {
            url: "/changePassword",
            views: {
                'main@app': {
                    templateUrl: "changePassword.ejs"
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