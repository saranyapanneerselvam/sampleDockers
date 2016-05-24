showMetricApp.controller('ExportController',ExportController)

function ExportController($scope,$http,$state,$rootScope,$window,$stateParams,generateChartColours) {

    $scope.submitExport = function(){
        var setJPEGOption = $("#exportOptionJpeg").prop("checked");
        var setPDFOption = $("#exportOptionPDF").prop("checked");
        var dashboardLayout = document.getElementById('dashboardLayout');
        if(setJPEGOption==true){
            $rootScope.fileType = "JPEG";
            console.log("to export JPEG");
            domtoimage.toBlob(document.getElementById('dashboardLayout'))
                .then(function (blob) {
                    window.saveAs(blob, 'dashboardWidgets.jpeg');

                });
        }

        if(setPDFOption==true){
            $rootScope.fileType = "PDF";
            console.log("to export PDF");
            domtoimage.toPng(dashboardLayout)
                .then(function (dataUrl) {
                    var img = new Image();
                    img.src = dataUrl;
                    var doc = new jsPDF({
                        format:'a2'
                    });
                    doc.addImage(img, 'JPEG', 20, 20);
                    doc.save('dashboardWidgets.pdf');

            })
            .catch(function (error) {
                console.error('oops, something went wrong!', error);
            });
        }
    };

}