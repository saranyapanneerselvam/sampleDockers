showMetricApp.controller('NavigationController',NavigationController)

function NavigationController($scope,$state,$http,$rootScope) {
    var availableBasicWidgets;
    var availableFusionWidgets;

    $scope.checkAndShowAlert = function(){
      if($state.includes('app.reporting.dashboard')){
          return false;
      }
        alert('Please open a dashboard to do this operation.')
        return true;
    };
    $state.includes('app.reporting.dashboard')

    //function to chech the subscription limits  of the user on fusion widgets
    $scope.fusionwidget = function () {
        toastr.options.closeButton=true;
        toastr.options.positionClass = 'toast-top-right';
        //request to get the subscription details of the user on fusion widgets

        $http(
            {
                method: 'GET',
                url: '/api/v1/subscriptionLimits' + '?requestType=' + 'fusion'
            }
        ).then(
            function successCallback(response) {
                availableFusionWidgets = response.data.availableWidgets;
                if ($rootScope.isExpired == true)
                    toastr.info('your expiry date is finished');
                else {
                    if (availableFusionWidgets <= 0)
                        toastr.info("you dont have available  widgets to create")
                    else
                        $state.go('app.reporting.dashboard.fusionWidget');
                }
            },
            function errorCallback(error) {
                swal({
                    title: "",
                    text: "<span style='sweetAlertFont'>Something went wrong! Please try again</span> .",
                    html: true
                });
            }
        );
    }

    //function to chech the subscription limits  of the user on basic widgets

    $scope.basicwidget = function () {
        toastr.options.closeButton=true;
        toastr.options.positionClass = 'toast-top-right';
        $http(
            {
                method: 'GET',
                url: '/api/v1/subscriptionLimits' + '?requestType=' + 'basic'
            }
        ).then(
            function successCallback(response) {
                availableBasicWidgets = response.data.availableWidgets;
                if ($rootScope.isExpired == true)
                    toastr.info('Please renew!');
                else {
                    if (availableBasicWidgets <= 0)
                        toastr.info("You don't have available widgets!")
                    else
                        $state.go("app.reporting.dashboard.basicWidget", {widgetType: 'basic'});
                }
            },
            function errorCallback(error) {
                swal({
                    title: "",
                    text: "<span style='sweetAlertFont'>Something went wrong! Please try Again</span> .",
                    html: true
                });
            }
        );
    }
    $scope.addRecommendedDashboard = function() {
        //check if dasshboards are available
        $http(
            {
                method: 'GET',
                url: '/api/v1/subscriptionLimits'+'?requestType='+'dashboards'
            }
        ).then(
            function successCallback(response){
                if( $rootScope.isExpired === false){
                    if(response.data.availableDashboards > 0){
//if dashboards avaialable and not expire open the modal
                                $state.go('app.reporting.dashboard.recommendedDashboard');
                    }
                    else{
                        toastr.info('Dashboard limit is reached !')
                    }
                }
                else{
                    toastr.info('Please renew!')
                }
            },
            function errorCallback(error){
                swal({
                    title: "",
                    text: "<span style='sweetAlertFont'>Something went wrong! Please try again!</span> .",
                    html: true
                });
            }
        )
    };
    $(".insightsModalContent").on( 'click', function( ev ) {
        $(".navbar").css('z-index','1');
        $(".md-overlay").css("background","rgba(0,0,0,0.5)");
        $("#insightsModalContent").addClass('md-show');
    });

    $(".addRemoveModalContent").on( 'click', function( ev ) {
        $(".navbar").css('z-index','1');
        $(".md-overlay").css("background","rgba(0,0,0,0.5)");
        $("#addRemoveModalContent").addClass('md-show');
    });
    function removeModal( hasPerspective ) {
        classie.remove( modal, 'md-show' );

        if( hasPerspective ) {
            classie.remove( document.documentElement, 'md-perspective' );
        }
    }

    function removeModalHandler() {
        removeModal( classie.has( el, 'md-setperspective' ) );
    }

}