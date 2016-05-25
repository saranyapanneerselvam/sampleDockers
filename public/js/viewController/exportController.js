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

            if(setPDFOption==true){
                $rootScope.fileType = "PDF";
                console.log("to export PDF");

                domtoimage.toPng(dashboardLayout)
                    .then(function (dataUrl) {
                        // var img = new Image();
                        // img.src = dataUrl;
                        // var doc = new jsPDF({
                        //     format:'a2'
                        // });
                        // doc.addImage(img, 'JPEG', 20, 20);
                        // doc.save('dashboardWidgets.pdf');

                        var jsonData = {
                            "dashboardLayout": dataUrl
                        };
                        console.log('json data', jsonData);
                        $http({
                            method: 'POST', url: '/api/v1/createHtml5ToPdf/dashboard', data: jsonData
                        }).then(function successCallback(response){
                            console.log(response);
                        }, function errorCallback (error){
                            console.log('Error in creating PDF dashboard widgets',error);

                        });

                })
                .catch(function (error) {
                    console.error('oops, something went wrong!', error);
                });

            }

        }
    };

 


}