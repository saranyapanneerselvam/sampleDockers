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

    $scope.submitExport = function(){
        var setJPEGOption = $("#exportOptionJpeg").prop("checked");
        var setPDFOption = $("#exportOptionPDF").prop("checked");
        document.getElementById('dashboardTitleIcons').style.visibility = "hidden";
        var dashboardLayout = document.getElementById('dashboardLayout');
        console.log(dashboardLayout);

        if(setJPEGOption==true){
            swal("Please wait while the JPEG file is being generated", "", "warning");
            domtoimage.toBlob(dashboardLayout)
                .then(function (blob) {
                    document.getElementById('dashboardTitleIcons').style.visibility = "visible";
                    var timestamp = Number(new Date());
                    window.saveAs(blob, dashboardName+"_"+timestamp+".jpeg");
                });
        }

        if(setPDFOption==true){

            swal({
                html:true,
                imageUrl: '/image/loading.gif',
                title:'',
                text:'<b> Please wait while the PDF file is being generated </b>',
                allowOutsideClick:false,
                allowEscapeKey:false,
                showConfirmButton:false
            });

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
                        document.getElementById('dashboardTitleIcons').style.visibility = "visible";
                        var domainUrl = "";
                        if (window.location.hostname == "localhost") {
                            domainUrl = "http://localhost:8080";
                        }
                        else {
                            domainUrl = "";
                        }
                        swal({
                            html:true,
                            title:'<i>PDF has been generated successfully</i>',
                            text:'<b><a href="'+domainUrl+response.data.Response+'" download style="color: #1AB394;">Click here to download the PDF</a></b>',
                            allowOutsideClick:false,
                            allowEscapeKey:false,
                            confirmButtonText:"Close"
    
                        });
                    }, function errorCallback (error){
                        console.log('Error in creating PDF dashboard widgets',error);
                        swal("Something went wrong. Please try again", "", "error");
                        document.getElementById('dashboardTitleIcons').style.visibility = "visible";
                    });
    
            })
            .catch(function (error) {
                console.error('oops, something went wrong!', error);
                swal("Something went wrong. Please try again", "", "error");
            });
        }
    };
}