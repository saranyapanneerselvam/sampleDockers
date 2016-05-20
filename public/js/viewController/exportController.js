showMetricApp.controller('ExportController',ExportController)

function ExportController($scope,$http,$state,$rootScope,$window,$stateParams,generateChartColours) {

    $scope.submitExport = function(){
        var setJPEGOption = $("#exportOptionJpeg").prop("checked");
        var setPDFOption = $("#exportOptionPDF").prop("checked");
        var dashboardLayout = document.getElementById('dashboardLayout');
        if(setJPEGOption==true){
            console.log("to export JPEG");
            // domtoimage.toPng(dashboardLayout)
            //     .then(function (dataUrl) {
            //         var img = new Image();
            //         img.src = dataUrl;
            //         console.log(img);
            //
            //     })
            //     .catch(function (error) {
            //         console.error('oops, something went wrong!', error);
            //     });

            domtoimage.toBlob(document.getElementById('dashboardLayout'))
                .then(function (blob) {
                    window.saveAs(blob, 'screenShotDashboard.jpeg');
                });

        }

        if(setPDFOption==true){
            console.log("to export PDF");
        }
    };

}