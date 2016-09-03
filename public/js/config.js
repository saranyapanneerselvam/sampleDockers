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
            controller: function ($http,$state,$scope,$interval,$rootScope){
                $scope.loadingVariable = '';
                if($state.$current.name == 'app.reporting'){
                    $scope.loadingVariable = '';
                    var repeat=0;
                    var expiryCheck = function() {
                        $http(
                            {
                                method: 'GET',
                                url: '/api/v1/me'
                            }
                        ).then(
                            function successCallback(response) {
                                if(repeat==0) {
                                    if (response.data.userDetails.subscriptionType === 'free') {
                                        if (response.data.userDetails.user[0].lastDashboardId) {
                                            $scope.loadingVariable = '';
                                            if (response.data.userDetails.user[0].lastDashboardId != 'undefined')
                                                $state.go('.dashboard', {id: response.data.userDetails.user[0].lastDashboardId});
                                            else
                                                $scope.createNewDashboard();
                                        }
                                        else {
                                            $scope.createNewDashboard();
                                        }
                                    }
                                    else {
                                        if (response.data.userDetails.statusCode === 1002) {
                                            $rootScope.isExpired = true;
                                            $state.go('.upgrade');
                                        }
                                        else {
                                            $rootScope.isExpired = false;
                                            var expiryDate = moment(response.data.userDetails.expiryDate);
                                            var currentDate = moment(new Date).format("YYYY-MM-DD");
                                            currentDate = moment(currentDate);
                                            var diffDays = expiryDate.diff(currentDate, 'days');
                                            if (diffDays < 4) {
                                                toastr.info("Hi, welcome to Datapoolt.Your pricing plan is going to expire soon.Please upgrade to access Datapoolt", 'Expiry Warning', {
                                                    "closeButton": true,
                                                    "debug": false,
                                                    "progressBar": true,
                                                    "preventDuplicates": false,
                                                    "positionClass": "toast-top-right",
                                                    "onclick": null,
                                                    "showDuration": "4000",
                                                    "hideDuration": "1000",
                                                    "timeOut": "7000",
                                                    "extendedTimeOut": "1000",
                                                    "showEasing": "swing",
                                                    "hideEasing": "linear",
                                                    "showMethod": "fadeIn",
                                                    "hideMethod": "fadeOut"
                                                });
                                            }
                                            if (response.data.userDetails.user[0].lastDashboardId) {
                                                $scope.loadingVariable = '';
                                                if (response.data.userDetails.user[0].lastDashboardId != 'undefined')
                                                    $state.go('.dashboard', {id: response.data.userDetails.user[0].lastDashboardId});
                                                else
                                                    $scope.createNewDashboard();
                                            }
                                            else {
                                                $scope.createNewDashboard();
                                            }
                                            
                                        }
                                    }
                                    repeat++;
                                }
                                else {
                                    if (response.data.userDetails.statusCode === 1002) {
                                        $rootScope.isExpired = true;
                                        $state.go('app.reporting.upgrade');
                                    }
                                }
                            },
                            function errorCallback(error) {
                                $scope.createNewDashboard();
                            }
                        );
                    };
                    expiryCheck();
                    $interval(expiryCheck,3600000);
                }
            }
        })

        .state('app.reporting.upgrade', {
            url: "/upgrade",
            templateUrl: "common/upgrade.ejs"
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
            url: "/{widgetType}",
            views: {
                'lightbox@app.reporting.dashboard': {
                    templateUrl: "basicWidget.ejs",
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