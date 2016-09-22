showMetricApp.controller('NavigationController',NavigationController)

function NavigationController($scope,$state,$http,$rootScope) {

    $scope.stateValidation = function(targetState) {
        if($state.includes('app.reporting.dashboard')) {
            switch(targetState) {
                case 'recommendedDashboard':
                    $state.go('app.reporting.dashboard.'+targetState);
                    break;
                case 'basicWidget':
                    var toStateParams = "{widgetType:'basic'}";
                    $state.go('app.reporting.dashboard.'+targetState,{widgetType:'basic'});
                    break;
                case 'fusionWidget':
                    $state.go('app.reporting.dashboard.'+targetState);
                    break;
                case 'insights':
                    $state.go('app.reporting.dashboard.'+targetState);
                    break;
            }
        }
        else
            toastr.info('Please perform this action from within a dashboard');
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