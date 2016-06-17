showMetricApp.controller('NavigationController',NavigationController)

function NavigationController($scope,$http,$state,$rootScope,$window,$stateParams,generateChartColours) {
    console.log("navigation controller called");

    $(".exportModalContent").on( 'click', function( ev ) {
        $(".navbar").css('z-index','0');
        $(".white-bg").addClass('md-show');
        $(".md-overlay").css("background","rgba(0,0,0,0.5)");
        $("#exportModalContent").addClass('md-show');
        $(".md-effect-19").addClass('md-setperspective');
    });

    $(".closeExportModalContent").click(function(){
        document.getElementById('dashboardTitleIcons').style.visibility = "visible";
        $(".white-bg").removeClass('md-show');
        $(".errorExportMessage").text("").hide();
        $("#exportOptionJpeg").prop("checked",false);
        $("#exportOptionPDF").prop("checked",false);
        $("#exportModalContent").removeClass('md-show');
    });

    $('#exportOptionJpeg').change(function() {
        $(".errorExportMessage").text("").hide();
    });

    $('#exportOptionPDF').change(function() {
        $(".errorExportMessage").text("").hide();
    });


    $(".settingModalContent").on( 'click', function( ev ) {
        $(".navbar").css('z-index','0');
        $(".white-bg").addClass('md-show');
        $(".md-overlay").css("background","rgba(0,0,0,0.5)");
        $("#settingModalContent").addClass('md-show');
        $(".md-effect-19").addClass('md-setperspective');

    });


    $(".addRemoveModalContent").on( 'click', function( ev ) {
        $(".navbar").css('z-index','0');
        $(".white-bg").addClass('md-show');
        $(".md-overlay").css("background","rgba(0,0,0,0.5)");
        $("#addRemoveModalContent").addClass('md-show');
        $(".md-effect-19").addClass('md-setperspective');

    });

    $(".modifyUserModalContent").on( 'click', function( ev ) {
        $(".navbar").css('z-index','0');
        $(".white-bg").addClass('md-show');
        $(".md-overlay").css("background","rgba(0,0,0,0.5)");
        $("#modifyUserModalContent").addClass('md-show');
        $(".md-effect-19").addClass('md-setperspective');

    });


    $(".newAccountModalContent").on( 'click', function( ev ) {
        $(".navbar").css('z-index','0');
        $(".white-bg").addClass('md-show');
        $(".md-overlay").css("background","rgba(0,0,0,0.5)");
        $("#newAccountModalContent").addClass('md-show');
        $(".md-effect-19").addClass('md-setperspective');

    });

    $(".closeModalContent").on( 'click', function( ev ) {
        $(".white-bg").removeClass('md-show');
        $("#settingModalContent").removeClass('md-show');
        $("#addRemoveModalContent").removeClass('md-show');
        $("#modifyUserModalContent").removeClass('md-show');
        $("#newAccountModalContent").removeClass('md-show');
        $("#exportJPEGModalContent").removeClass('md-show');
        $("#exportPDFModalContent").removeClass('md-show');
        $("#commentModalContent").removeClass('md-show');
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