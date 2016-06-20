/**
 * INSPINIA - Responsive Admin Theme
 * 2.3
 *
 * Custom scripts
 */

$(document).ready(function () {

    // Append config box / Only for demo purpose
    //$.get("views/skin-config.html", function (data) {
    //    $('body').append(data);
    //});

    // Full height of sidebar
    function fix_height() {
        var heightWithoutNavbar = $("body > #wrapper").height() - 61;
        $(".sidebard-panel").css("min-height", heightWithoutNavbar + "px");

        var navbarHeigh = $('nav.navbar-default').height();
        var wrapperHeigh = $('#page-wrapper').height();

        if(navbarHeigh > wrapperHeigh){
            $('#page-wrapper').css("min-height", navbarHeigh + "px");
        }

        if(navbarHeigh < wrapperHeigh){
            $('#page-wrapper').css("min-height", $(window).height() - 57  + "px");
        }

        if ($('body').hasClass('fixed-nav')) {
            $('#page-wrapper').css("min-height", $(window).height() - 57 + "px");
        }
    }


    $(window).bind("load resize scroll", function() {
        if(!$("body").hasClass('body-small')) {
            fix_height();
        }
    });

    // Move right sidebar top after scroll
    $(window).scroll(function(){
        if ($(window).scrollTop() > 0 && !$('body').hasClass('fixed-nav') ) {
            $('#right-sidebar').addClass('sidebar-top');
        } else {
            $('#right-sidebar').removeClass('sidebar-top');
        }
    });


    setTimeout(function(){
        fix_height();
    })
});

// Minimalize menu when screen is less than 768px
$(function() {
    $(window).bind("load resize", function() {
        if ($(this).width() < 769) {
            $('body').addClass('body-small')
        } else {
            $('body').removeClass('body-small')
        }
    })
});


/*
$(function(){

    //noinspection JSJQueryEfficiency

    $('.social-app').click(function (e) {
        $(".high").css("border", "1px solid #E94343");
    });
//noinspection JSJQueryEfficiency
    $('.click-meteric').click(function (e) {
        $(".mets").css("border", "1px solid #E94343");
    });

    $('#next1').attr('disabled','disabled');
    $('#next2').attr('disabled','disabled');
    $('#next3').attr('disabled','disabled');
//noinspection JSJQueryEfficiency

        $(".social-app").click(function(){
            $("#next1").removeAttr("disabled");
        });
//noinspection JSJQueryEfficiency
        $(".click-meteric").click(function(){
            $("#next2").removeAttr("disabled");

        });

        $(".profile-click").click(function() {
            $("#next3").removeAttr("disabled");
        });

});
*/

new WOW().init();