//noinspection JSJQueryEfficiency
$( document ).ready(function() {
    $('#next1').attr('disabled', 'disabled');
    $('#next2').attr('disabled', 'disabled');
    $('#next3').attr('disabled', 'disabled');
//noinspection JSJQueryEfficiency

    $(".social-app").click(function () {
        $("#next1").removeAttr("disabled");

    });
//noinspection JSJQueryEfficiency
    $(".click-meteric").click(function () {
        $("#next2").removeAttr("disabled");

    });

    $(".profile-click").click(function () {
        $("#next3").removeAttr("disabled");

    });
});


