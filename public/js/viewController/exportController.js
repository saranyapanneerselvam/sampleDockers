showMetricApp.controller('ExportController',ExportController)

function ExportController($scope,$http,$state,$rootScope,$window,$stateParams,generateChartColours) {
    var dashboardName = "NoName";

    //To fetch the name of the dashboard from database and display it when the dashboard is loaded
    $scope.fetchDashboardName = function () {
        $http({
            method: 'GET', url: '/api/v1/get/dashboards/'+ $state.params.id
        }).then(function successCallback(response) {
            if(response.status == '200'){
                dashboardName =  response.data.name;
            }

        }, function errorCallback(error) {
            console.log('Error in fetching dashboard name', error);
        });
    };
    $scope.fetchDashboardName();

    $scope.closeExport = function(){
        var setJPEGOption = $("#exportOptionJpeg").prop("checked");
        var setPDFOption = $("#exportOptionPDF").prop("checked");
        var dashboardLayout = document.getElementById('dashLayout');

        if(setJPEGOption==false && setPDFOption==false){
            $(".errorExportMessage").text("* Select the option to export").show();
            return false;
        }
        else{
            $(".errorExportMessage").text("").hide();
        }
    };


    $scope.submitExport = function(){
        var setJPEGOption = $("#exportOptionJpeg").prop("checked");
        var setPDFOption = $("#exportOptionPDF").prop("checked");
        document.getElementById('dashboardTitleIcons').style.visibility = "hidden";
        var dashboardLayout = document.getElementById('dashLayout');
        console.log(dashboardLayout);

        if(setJPEGOption==true){
            $(".navbar").css('z-index','1');
            $("#exportModalContent").removeClass('md-show');
            $(".md-overlay").css("background","rgba(0,0,0,0.5)");
            $("#exportJPEGModalContent").addClass('md-show');

            domtoimage.toBlob(dashboardLayout)
                .then(function (blob) {
                    document.getElementById('dashboardTitleIcons').style.visibility = "visible";
                    var timestamp = Number(new Date());
                    $("#exportJPEGModalContent").removeClass('md-show');
                    window.saveAs(blob, dashboardName+"_"+timestamp+".jpeg");
                    $("#exportOptionJpeg").prop("checked",false);
                });
        }

        if(setPDFOption==true){
            $(".navbar").css('z-index','1');
            $("#exportModalContent").removeClass('md-show');
            $(".md-overlay").css("background","rgba(0,0,0,0.5)");
            $("#exportPDFModalContent").addClass('md-show');
            $(".pdfHeadText").text('');
            $(".pdfContentText").html('<b>Please wait while the PDF file is being generated</b>');
            $(".loadingStatus").show();

            domtoimage.toPng(dashboardLayout)
                .then(function (dataUrl) {
                    var jsonData = {
                        "dashboardLayout": dataUrl,
                        "dashboardId": $state.params.id,
                        "dashboardName":dashboardName
                    };
                    $http({
                        method: 'POST', url: '/api/v1/createHtml5ToPdf/dashboard', data: jsonData
                    }).then(function successCallback(response){
                        console.log(response);
                        $("#exportOptionPDF").prop("checked",false);
                        document.getElementById('dashboardTitleIcons').style.visibility = "visible";
                        var domainUrl = "";
                        if (window.location.hostname == "localhost") {
                            domainUrl = "http://localhost:8080";
                        }
                        else {
                            domainUrl = "";
                        }

                        $("#exportPDFModalContent").removeClass('md-show');
                        $(".md-overlay").css("background","rgba(0,0,0,0.5)");
                        $("#exportPDFModalContent").addClass('md-show');

                        $(".loadingStatus").hide();
                        $(".pdfHeadText").show().text("PDF has been generated successfully").css('font-style','italic');
                        $(".pdfContentText").html('<b><a href="'+domainUrl+response.data.Response+'" download style="color: #1AB394;">Click here to download the PDF</a></b>');

                    }, function errorCallback (error){
                        console.log('Error in creating PDF dashboard widgets',error);

                        $("#exportPDFModalContent").removeClass('md-show');
                        $(".md-overlay").css("background","rgba(0,0,0,0.5)");
                        $("#exportPDFModalContent").addClass('md-show');

                        $(".loadingStatus").hide();
                        $(".pdfHeadText").show().text("Uh-Oh!!").css('font-style','normal');
                        $(".pdfContentText").html('<b>Something went wrong. Please try again</b>');

                        document.getElementById('dashboardTitleIcons').style.visibility = "visible";
                    });
    
            })
            .catch(function (error) {
                console.error('oops, something went wrong!', error);

                $("#exportPDFModalContent").removeClass('md-show');
                $(".md-overlay").css("background","rgba(0,0,0,0.5)");
                $("#exportPDFModalContent").addClass('md-show');

                $(".loadingStatus").hide();
                $(".pdfHeadText").show().text("Uh-Oh!!").css('font-style','normal');
                $(".pdfContentText").html('<b>Something went wrong. Please try again</b>');

            });
        }
    };
}