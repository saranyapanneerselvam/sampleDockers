showMetricApp.controller('TopNavbarController',TopNavbarController)

function TopNavbarController($scope) {
    $(".modifyUserModalContent").on( 'click', function( ev ) {
        $(".navbar").css('z-index','1');
        $(".md-overlay").css("background","rgba(0,0,0,0.5)");
        $("#modifyUserModalContent").addClass('md-show');
    });

    $(".newAccountModalContent").on( 'click', function( ev ) {
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

    $scope.getDropdown=function(){
        document.getElementById("myDropdown").classList.toggle("show");
    };
    window.onclick = function(event) {
        if(event.target.matches('.topdropbtn')||event.target.matches('.glyphicon.glyphicon-chevron-down')){
            var dropdowns = document.getElementsByClassName("dropdown-content");
            var i;
            for (i = 0; i < dropdowns.length; i++) {
                var openDropdown = dropdowns[i];
                if (openDropdown.classList.contains('shw')) {
                    openDropdown.classList.remove('shw');
                }
            }
        }
        else if(event.target.matches('.fa.fa-cog')){
            var dropdowns = document.getElementById("myDropdown");
            if (dropdowns.classList.contains('show')) {
                dropdowns.classList.remove('show');
            }
        }
        else{
            var dropdowns = document.getElementById("myDropdown");
            if (dropdowns.classList.contains('show')) {
                dropdowns.classList.remove('show');
            }
            var dropdown = document.getElementsByClassName("dropdown-content");
            var i;
            for (i = 0; i < dropdown.length; i++) {
                var openDropdown = dropdown[i];
                if (openDropdown.classList.contains('shw')) {
                    openDropdown.classList.remove('shw');
                }
            }
        }
        // if (!(event.target.matches('.topdropbtn')||event.target.matches('.glyphicon.glyphicon-chevron-down'))){
        //     var dropdowns = document.getElementById("myDropdown");
        //         if (dropdowns.classList.contains('show')) {
        //             dropdowns.classList.remove('show');
        //     }
        // }
        // else if(!event.target.matches('.fa.fa-cog')){
        //     console.log('.fa.f')
        //     var dropdowns = document.getElementsByClassName("dropdown-content");
        //     var i;
        //     for (i = 0; i < dropdowns.length; i++) {
        //         var openDropdown = dropdowns[i];
        //         if (openDropdown.classList.contains('shw')) {
        //             openDropdown.classList.remove('shw');
        //         }
        //     }
        // }
    }
}