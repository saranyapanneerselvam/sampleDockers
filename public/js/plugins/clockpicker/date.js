
$('input[name="daterange"]').daterangepicker(
    {
        locale: {
            format: 'DD-MM-YYYY'
        },
        startDate: '17-02-1990',
        endDate: '23-02-2020'
    },
    function(start, end, label) {
        alert("A new date range was chosen: " + start.format('DD-MM-YYYY') + ' to ' + end.format('DD-MM-YYYY'));
    });

$('[data-toggle="tooltip"]').tooltip({
    //placement : 'top'
    //$("[data-original-title]").css({"position": "relative", "right": "50px", "background-color": "#959595"});
    //$( ".selector" ).tooltip( "option", "tooltipClass", "custom-tooltip-styling" );
});

$('.social-app').click(function (e) {
    $(".high").css("border", "1px solid #E94343");
});
$('.click-meteric').click(function (e) {
    $(".mets").css("border", "1px solid #E94343");
});

