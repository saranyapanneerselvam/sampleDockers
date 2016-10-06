showMetricApp.controller('NavigationController',NavigationController)

function NavigationController($scope,$state,$http,$stateParams,$rootScope) {
    $state.includes('app.reporting.dashboard')
    $scope.stateValidation = function(targetState) {
            switch(targetState) {
                case 'recommendedDashboard':
                    $state.go('app.reporting.'+targetState)
                    break;
                case 'basicWidget':
                if($state.includes('app.reporting.dashboard')){
                    var toStateParams = "{widgetType:'basic'}";
                    $state.go('app.reporting.dashboard.'+targetState,{widgetType:'basic'});
                }
                else
                    toastr.info('Please perform this action from within a dashboard');
                    break;
                case 'fusionWidget':
                    if($state.includes('app.reporting.dashboard')){
                    $state.go('app.reporting.dashboard.'+targetState);
                    }
                    else
                        toastr.info('Please perform this action from within a dashboard');
                    break;
                case 'chooseDashboardType':
                     $state.go('app.reporting.'+targetState);
                    break;
                case 'insights':
                    toastr.info('Coming Soon');
                    break;
            }
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
        if( hasPerspective )
            classie.remove( document.documentElement, 'md-perspective' );
    }

    function removeModalHandler() {
        removeModal( classie.has( el, 'md-setperspective' ) );
    }

}