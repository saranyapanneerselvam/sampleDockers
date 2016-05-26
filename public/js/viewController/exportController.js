showMetricApp.controller('ExportController',ExportController)

function ExportController($scope,$http,$state,$rootScope,$window,$stateParams,generateChartColours) {

    $scope.submitExport = function(){
        var setJPEGOption = $("#exportOptionJpeg").prop("checked");
        var setPDFOption = $("#exportOptionPDF").prop("checked");
        document.getElementById('dashboardTitleIcons').style.visibility = "hidden";


        var dashboardLayout = document.getElementById('dashboardLayout');
        console.log(dashboardLayout);

        if(setJPEGOption==true){
            swal("Please wait while the JPEG file is being downloading.", "", "success");
            console.log("to export JPEG");
            domtoimage.toBlob(dashboardLayout)
                .then(function (blob) {
                    window.saveAs(blob, 'dashboardWidgets.jpeg');
                    document.getElementById('dashboardTitleIcons').style.visibility = "visible";
                });
        }

        if(setPDFOption==true){
            swal("Please wait while the PDF file is being downloading.", "", "success");
            console.log("to export PDF");
                domtoimage.toPng(dashboardLayout)
                    .then(function (dataUrl) {
                        var jsonData = {
                            "dashboardLayout": dataUrl,
                            "dashboardId": $state.params.id
                        };
                        console.log('json data', jsonData);
                        $http({
                            method: 'POST', url: '/api/v1/createHtml5ToPdf/dashboard', data: jsonData
                        }).then(function successCallback(response){
                            console.log(response);
                            document.getElementById('dashboardTitleIcons').style.visibility = "visible";
                        }, function errorCallback (error){
                            console.log('Error in creating PDF dashboard widgets',error);

                        });

                })
                .catch(function (error) {
                    console.error('oops, something went wrong!', error);
                });


        }
    };

 


}