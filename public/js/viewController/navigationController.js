showMetricApp.controller('NavigationController',NavigationController)

function NavigationController() {


    $(".insightsModalContent").on( 'click', function( ev ) {
        $(".navbar").css('z-index','1');
        $(".md-overlay").css("background","rgba(0,0,0,0.5)");
        $("#insightsModalContent").addClass('md-show');
    });


    $(".settingModalContent").on( 'click', function( ev ) {
        $(".navbar").css('z-index','1');
        $(".md-overlay").css("background","rgba(0,0,0,0.5)");
        $("#settingModalContent").addClass('md-show');
    });


    $(".addRemoveModalContent").on( 'click', function( ev ) {
        console.log('CALLED')
        $(".navbar").css('z-index','1');
        $(".md-overlay").css("background","rgba(0,0,0,0.5)");
        $("#addRemoveModalContent").addClass('md-show');
    });

    $(".modifyUserModalContent").on( 'click', function( ev ) {
        console.log('CALLED')
        $(".navbar").css('z-index','1');
        $(".md-overlay").css("background","rgba(0,0,0,0.5)");
        $("#modifyUserModalContent").addClass('md-show');
    });


    $(".newAccountModalContent").on( 'click', function( ev ) {
        console.log('CALLED')
        $(".navbar").css('z-index','1');
        $(".md-overlay").css("background","rgba(0,0,0,0.5)");
        $("#newAccountModalContent").addClass('md-show');
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