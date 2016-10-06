showMetricApp.controller('ExportController', ExportController)

function ExportController($scope, $http, $state, $rootScope, $window,$q,$stateParams, $timeout) {


    $scope.currentDate=moment(new Date()).format("YYYY-DD-MM");

    var dashboardName = "NoName";
    var dashboardRepId = null;
    $rootScope.showExport = true;
    $scope.expAct = false;
    $scope.expDashboard = {widgets: [], widgetData: []};
    $scope.expDashboard.dashboardName = '';
    $scope.expPages = [];
    $scope.exportObject = {widgets: [], widgetData: []};
    $scope.exportObject.dashboardName = '';
    $scope.windowWidth = false;
    $scope.closedCancle=true;
//Logos Section Code Begins
    $scope.orgLogosList = [];
    $scope.cliLogosList = [];
    $scope.orgLogoSrc = '/userFiles/datapoolt.png';
    $scope.cliLogoSrc = '/userFiles/plain-white.jpg';
    var readyCopyUrl;
    var readyToButtonLoad;
    var readyToJPEGDownload;
    var readyToExcel;
    var buttonTrigger=false;
    $scope.exportPDF=false;
    $scope.exportUrl=false;
    $scope.calculateSummaryHeightMoz = function(widgetHeight,noOfItems) {
        var heightPercent;

        if(widgetHeight ==1)
            heightPercent = 20;
        else
            heightPercent = 70 / widgetHeight;
        return {'height': (heightPercent + '%')};

    };

    angular.element(document).ready(function () {
        $('.ladda-button').addClass('icon-arrow-right');
        Ladda.bind( '.ladda-button',{
            callback: function( instance ){
                $('.ladda-button').removeClass('icon-arrow-right');
                $scope.closeExport();
                    var progress = 0;
                if(readyToButtonLoad== false){
                    var attr = $('.ladda-button').attr('data-style','');
                    $('.ladda-button').addClass('icon-arrow-right');
                }
                else{
                    var attr = $('.ladda-button').attr('data-style','expand-right');
                    var interval = setInterval(function () {
                        progress = Math.min(progress + Math.random() * 0.1, 1);
                        instance.setProgress(progress);
                        if (progress === 1 && readyToJPEGDownload === 1) {
                            instance.stop();
                            clearInterval(interval);
                        }
                        else if (progress === 1 && readyCopyUrl === 1) {
                            instance.stop();
                            clearInterval(interval);
                            $('.ladda-button').addClass('icon-arrow-right');
                        }
                        else if(progress === 1 && readyToExcel===1){
                            instance.stop();
                            clearInterval(interval);
                        }

                    }, 50);

                }
            }
        });


    });

    $scope.calculateColumnWidthMoz = function(noOfItems,widgetWidth,noOfCharts) {
        if(widgetWidth==1){
            return ('col-sm-'+12+' col-md-'+12+' col-lg-'+12);
        }
        else if((widgetWidth>=2)&& (widgetWidth<=4)){
            return ('col-sm-' + 4 + ' col-md-' + 4 + ' col-lg-' + 4);

        }
        else if(widgetWidth>=5){
            return ('col-sm-' + 2 + ' col-md-' + 2 + ' col-lg-' + 2);
        }
    };

    $scope.selectedIconIndicator = function(accType,getID) {
        if(accType == 'cli'){
        var $cols = $('.cliIcon')
            $cols.removeClass('selectIcon');
            $('#' + getID).addClass('selectIcon');
        }
        else if(accType=='org'){
        var $cols = $('.orgIcon');
            $cols.removeClass('selectIcon');
            $('#' + getID).addClass('selectIcon');

        }
    }

    $scope.fetchLogosFromDB = function(acType){
        var uploadData= {
            'accType':acType
        };
        $http({
            method: 'post',
            url: '/api/v1/fetchLogoToPdf/dashboard',
            data: uploadData
        }).then(
            function successCallback(response) {
                if(acType =='org')
                    $scope.orgLogosList = JSON.parse(JSON.stringify(response.data.logosInDB));
                else if(acType =='cli')
                    $scope.cliLogosList = JSON.parse(JSON.stringify(response.data.logosInDB));
            },
            function errorCallback(error) {
                $scope.orgLogosList = [];
                $scope.cliLogosList = [];
                swal({
                    title: '',
                    text: '<span style="sweetAlertFont">Something went wrong! Please reload the dashboard</span>',
                    html: true
                });
            }
        );

    };

    $scope.submitUpload = function(info,accType){
        var uploadData= {
            file : info,
            accType:accType
        };
        var uploadUrl = '/api/v1/createLogoToPdf/createFolder';
        var fd = new FormData();
        var fileType = info.type.split('/');
        if(fileType[1]=='png'||fileType[1]=='bmp'||fileType[1]=='jpg'||fileType[1]=='jpeg')
        {
        for(var key in uploadData)
            fd.append(key, uploadData[key]);
        $http.post(uploadUrl, fd, {
            transformRequest: angular.indentity,
            headers: { 'Content-Type': undefined }
        }).then(
            function successCallback(response){
                document.getElementById('orgUploadButton').disabled = true;
                    document.getElementById('clientUploadButton').disabled = true;
                // data.resolve(response.data.FileUrl);
                $scope.fetchLogosFromDB(accType);
            },
            function errorCallback(err){
                swal({
                    title: '',
                    text: '<span style="sweetAlertFont">Something went wrong! Please reload the dashboard</span>',
                    html: true
                });
            }
        );
        }
        else{
            swal({
                title: '',
                text: '<span style="sweetAlertFont">Please Upload Only Image files(.jpg,.png,.jpeg,.bmp)</span>',
                html: true
            });
        }
        // return data.promise;;

    };

    $scope.removeLogo = function(imageInfo,accType) {
        var jsonData = {
            'fileUrl': imageInfo.fileUrl,
            "accType": accType,
        };
        $http({
            method: 'POST',
            url: '/api/v1/removeLogoToPdf/dashboard',
            data: jsonData
        }).then(
            function successCallback(response){
                // data.resolve(response.data.FileUrl);
                 if(imageInfo.fileUrl == $scope.orgLogoSrc){
                     $scope.orgLogoSrc = '/userFiles/datapoolt.png';
                 }
                else if (imageInfo.fileUrl == $scope.cliLogoSrc){
                     $scope.cliLogoSrc = '/userFiles/plain-white.jpg';
                 }
                $scope.fetchLogosFromDB(accType);
            },
            function errorCallback(err){
                // data.resolve(err);
                swal({
                    title: '',
                    text: '<span style="sweetAlertFont">Something went wrong! Please reload the dashboard</span>',
                    html: true
                });
            }
        );
    }
    
    $scope.enableUploadbutton=function(accType){
        if(accType=='org')
            document.getElementById('orgUploadButton').disabled = false;
        else if(accType=='cli')
            document.getElementById('clientUploadButton').disabled = false;
    }
    
    $scope.selectedOrgLogo = function(imageInfo){
        $scope.orgLogoSrc = imageInfo;
    }
    
    $scope.selectedCliLogo = function(imageInfo){
        $scope.cliLogoSrc = imageInfo;
    }
    //Logos Section Code Ends

    if ($rootScope.expObj != undefined) {
        var tWid = $rootScope.expObj.widgets;
        var tWidData = $rootScope.expObj.widgetData;
        var date=$rootScope.expObj.dashoboardDate;
        $scope.exportObject.dashboardName = $rootScope.expObj.dashboardName;
        if ($scope.exportObject.dashboardName != undefined || $scope.exportObject.dashboardName != null) {
            dashboardName = $scope.exportObject.dashboardName;
        }
        delete $rootScope.expObj;
        var lent = tWid.length;
        for (var m = 0; m < lent; m++) {
            $scope.exportObject.widgets.push(tWid[m]);
            $scope.exportObject.widgetData.push(tWidData[m]);
        }
    }
    
    $scope.expgridsterOptions = {
        margins: [20, 20],
        columns: 6,
        rows: 4,
        defaultSizeX: 6,
        defaultSizeY: 4,
        minSizeX: 1,
        minSizeY: 1,
        width: 'auto',
        resizable: {
            enabled: false,
        },
        draggable: {
            enabled: false,
        },
        outerMargin: true, // whether margins apply to outer edges of the grid
        mobileBreakPoint: 700,
        mobileModeEnabled: true // whether or not to toggle mobile mode when screen width is less than mobileBreakPoint
    };

    angular.element($window).on('resize', function (e) {
        $scope.$broadcast('resize');
    });

    $scope.$on('resize', function (e) {
        $timeout(function () {
            var len = $scope.expPages.length;
            for (var j = 0; j < len; j++) {
                var widLen = $scope.expPages[j].widgets.length;
                for (var ind = 0; ind < widLen; ind++) {
                    for (var i = 0; i < $scope.expPages[j].widgetData[ind].chart.length; i++) {
                        if ($scope.expPages[j].widgetData[ind].chart[i].api)
                            $scope.expPages[j].widgetData[ind].chart[i].api.update();
                    }
                }
            }
        }, 800);
    });


    $scope.calcColumnWidth = function (noOfItems,widgetWidth,widgetHeight) {

        if (noOfItems <= 2)
            return ('col-sm-' + 12 + ' col-md-' + 12 + ' col-lg-' + 12);
        else if (noOfItems > 2 && noOfItems <= 4)
            return ('col-sm-' + 6 + ' col-md-' + 6 + ' col-lg-' + 6);
        else if (noOfItems > 5 && noOfItems <= 9)
        {
            if(widgetWidth==1 && widgetHeight!=1)
                return ('col-sm-' + 6 + ' col-md-' + 6 + ' col-lg-' + 6);
            else
                return ('col-sm-' + 4 + ' col-md-' + 4 + ' col-lg-' + 4);
        }
        else
            return ('col-sm-' + 4 + ' col-md-' + 4 + ' col-lg-' + 4);
    };

    $scope.calcRowHeight = function (data,noOfItems,widgetWidth,widgetHeight,layoutHeight) {
        // var availableHeight = data.myheight;
        var fontSizeEm;
        var cols;
        if (noOfItems <= 2) {
            cols = 1;
            fontSizeEm = 1.0;
        }
        else if (noOfItems > 2 && noOfItems <= 4) {
            cols = 2;
            fontSizeEm = 0.85;
        }
        else if (noOfItems > 5 && noOfItems <= 9) {
            if (widgetWidth == 1 && widgetHeight != 1) {
                cols = 2;
                fontSizeEm = 0.85;
            }
            else {
                cols = 3;
                fontSizeEm = 0.7;
            }
        }
        else {
            cols = 3;
            fontSizeEm = 0.7;
        }
        if(widgetWidth === 1 || noOfItems > 15 ||widgetHeight === 1||layoutHeight>1)
            data.showComparision = false;
        else
            data.showComparision = true;


        //var cols = $window.innerWidth>=768 ? 2 : 1;
        var rows = Math.ceil(noOfItems / cols);
        var heightPercent = 100 / rows;
        // var rowHeight = document.getElementById('chartRowHeight-'+widgetId).offsetHeight;
        // var rHeight = rowHeight;
        //  var availableHeight = Math.floor(rHeight/rows);
       // var fontSizeEm = availableHeight / 100 * 3.5;


        var minSize = 0.7, maxSize = 1.0;
        if (fontSizeEm < minSize)
            fontSizeEm = minSize;
        if (fontSizeEm > maxSize)
            fontSizeEm = maxSize;
        return {'height': (heightPercent + '%'), 'font-size': (fontSizeEm + 'em')};
    };

    $scope.calculateSummaryHeight = function(widgetHeight,noOfItems) {
        var heightPercent;
        if(widgetHeight<=1) {
            if(noOfItems==1)
                heightPercent = 20;
            else
                heightPercent = 100;
        }
        else if(widgetHeight==2){
            if(noOfItems==1)
                heightPercent = 20;
            else if(noOfItems<=4&&noOfItems>1)
                heightPercent = 30;
            else
            heightPercent = 50;

        }
        else {
            if(noOfItems==1)
                heightPercent = 20;
            else if(noOfItems<=4&&noOfItems>1)
                heightPercent = 30;
            else if(noOfItems<=9&&noOfItems>5)
                heightPercent = 40;
            else if(noOfItems<=15&&noOfItems>10)
                heightPercent = 50;
            else
                heightPercent = 60;
        }
        return {'height':(heightPercent+'%')};
    };

    $scope.calculateChartHeight = function(widgetHeight,noOfItems) {
        var heightPercent;
        if(widgetHeight<=1) {
            if(noOfItems==1)
                heightPercent = 80;
            else
                heightPercent = 0;
        }
        else if(widgetHeight==2){
            if(noOfItems==1)
                heightPercent = 80;
            else if(noOfItems<=4&&noOfItems>1)
                heightPercent = 70;
            else
                heightPercent = 50;
        }
        else {
            if(noOfItems==1)
                heightPercent = 80;
            else if(noOfItems<=4&&noOfItems>1)
                heightPercent = 70;
            else if(noOfItems<=9&&noOfItems>5)
                heightPercent = 60;
            else if(noOfItems<=15&&noOfItems>10)
                heightPercent = 50;
            else
                heightPercent = 40;
        }
        return {'height':(heightPercent+'%')};
    };

    var vm = this;
    $scope.pdfPrintPreview = function (opt) {
        $scope.expAct = opt;
        $scope.exportPDF=opt;
        $scope.exportUrl=false;
        document.getElementById('submitExportButton').disabled = opt;
    };


    //To download a pdf/jpeg version of the dashboard
    $scope.printpaperPDF = function () {
        // $scope.windowWidth = String(parseInt(($window.outerWidth)*0.028))+'px';

        if($window.outerWidth>=1600)
        {
            $scope.windowWidth = true;
        }
        vm.dashboard = $scope.exportObject;
        var pages = new Array();
        var len = vm.dashboard.widgets.length;
        var tempWid1 = vm.dashboard.widgets;
        var tempWidData1 = vm.dashboard.widgetData;
        var tempWidgetName1 = vm.dashboard.dashboardName;
        var tempWidgetList1 = [];
        var tempWidgetDataList1 = [];
        var tempSortWidgetList1 = [];
        var tempSortWidgetDataList1 = [];
        var rowSize = [];
        for (var m = 0; m < len; m++)
            rowSize.push(vm.dashboard.widgets[m].row);
        var maxRow = Math.max.apply(null, rowSize);
        loop1:   for (var rs = 0; rs <= maxRow; rs++) {
            loop2:  for (var cs = 0; cs <= 5; cs++) {
                loop3: for (var sortPos = 0; sortPos < tempWid1.length; sortPos += 1) {
                    if (tempWid1[sortPos].row == rs && tempWid1[sortPos].col == cs) {
                        tempSortWidgetList1.push(tempWid1[sortPos]);
                        tempSortWidgetDataList1.push(tempWidData1[sortPos]);
                        break loop3;
                    }
                }
            }
        }

        angular.copy(tempSortWidgetDataList1, tempWidgetDataList1);
        angular.copy(tempSortWidgetList1, tempWidgetList1);
        for(var widgetData in tempWidgetDataList1) {
            for(var chart in tempWidgetDataList1[widgetData].chart) {
                if(typeof tempWidgetDataList1[widgetData].chart[chart].options.chart.showLegend != 'undefined') {
                    tempWidgetDataList1[widgetData].chart[chart].options.chart.showLegend = false;
                }
            }
        }
        var n = 0;

        do
        {
            var caninsert = 1;
            var pageWidgets = {
                sizeFilled: new Array(6),
                sizeLeft: new Array(6),
                widgets: [],
                widgetData: [],
                empWidget: []
            };
            pageWidgets.sizeFilled = [0, 0, 0, 0, 0, 0];
            pageWidgets.sizeLeft = [4, 4, 4, 4, 4, 4];
            loop4: for (var getWidgetInfo in tempWidgetList1) {
                var caninsert = 1;
                // if (tempWidgetList1[getWidgetInfo].sizeY < 2) {
                //     tempWidgetList1[getWidgetInfo].sizeY = 2;
                // }
                var pos = tempWidgetList1[getWidgetInfo].col;
                var checkpos = pos + tempWidgetList1[getWidgetInfo].sizeX - 1;
                for (var p = pos; p <= checkpos; p++) {
                    if (tempWidgetList1[getWidgetInfo].sizeY <= pageWidgets.sizeLeft[p])
                        caninsert *= 1;
                    else
                        caninsert *= 0;
                }
                if (caninsert == 1) {

                    for(var ind=0;ind<tempWidgetDataList1[getWidgetInfo].chart.length;ind++) {
                        if (tempWidgetDataList1[getWidgetInfo].chart[ind].data.length > 15) {
                            tempWidgetList1[getWidgetInfo].sizeY = 3;
                            if (tempWidgetDataList1[getWidgetInfo].chart[ind].data.length > 30) {
                                tempWidgetList1[getWidgetInfo].sizeY = 4;
                            }
                        }
                    }

                    pageWidgets.widgets.push({
                        'row': (typeof tempWidgetList1[getWidgetInfo].row != 'undefined' ? tempWidgetList1[getWidgetInfo].row : 0),
                        'col': tempWidgetList1[getWidgetInfo].col,
                        'sizeY': (typeof tempWidgetList1[getWidgetInfo].sizeY != 'undefined' ? tempWidgetList1[getWidgetInfo].sizeY : 2),
                        'sizeX': (typeof tempWidgetList1[getWidgetInfo].sizeX != 'undefined' ? tempWidgetList1[getWidgetInfo].sizeX : 2),
                        'minSizeY': (typeof tempWidgetList1[getWidgetInfo].minSizeY != 'undefined' ? tempWidgetList1[getWidgetInfo].minSizeY : 2),
                        'minSizeX': (typeof tempWidgetList1[getWidgetInfo].minSizeX != 'undefined' ? tempWidgetList1[getWidgetInfo].minSizeX : 2),
                        'maxSizeY': (typeof tempWidgetList1[getWidgetInfo].maxSizeY != 'undefined' ? tempWidgetList1[getWidgetInfo].maxSizeY : 3),
                        'maxSizeX': (typeof tempWidgetList1[getWidgetInfo].maxSizeX != 'undefined' ? tempWidgetList1[getWidgetInfo].maxSizeX : 3),
                        'name': (typeof tempWidgetList1[getWidgetInfo].name != 'undefined' ? tempWidgetList1[getWidgetInfo].name : ''),
                        'widgetType': (typeof tempWidgetList1[getWidgetInfo].widgetType != 'undefined' ? tempWidgetList1[getWidgetInfo].widgetType : ''),
                        'isAlert': (typeof tempWidgetList1[getWidgetInfo].isAlert != 'undefined' ? tempWidgetList1[getWidgetInfo].isAlert : false),
                        'id': tempWidgetList1[getWidgetInfo].id,
                        'visibility': false
                    });
                    pageWidgets.widgetData.push(tempWidgetDataList1[getWidgetInfo]);

                    for (var j = 0; j < tempWidgetList1[getWidgetInfo].sizeX; j++) {
                        pageWidgets.sizeFilled[pos + j] += tempWidgetList1[getWidgetInfo].sizeY;
                        pageWidgets.sizeLeft[pos + j] -= (pageWidgets.sizeFilled[pos + j]);
                    }
                    tempWidgetList1[getWidgetInfo] = null;
                    tempWidgetDataList1[getWidgetInfo] = null;
                }
                else {
                    var rowNeutral = tempWidgetList1[getWidgetInfo].row;
                    for (var t = getWidgetInfo; t < tempWidgetList1.length; t++)
                        tempWidgetList1[t].row -= rowNeutral;
                    break loop4;
                }
            }
            var len = tempWidgetList1.length;
            var temp = new Array();
            var tempData = new Array();

            for (var k = 0; k < len; k++) {
                if (tempWidgetList1[k] != null) {
                    temp.push(tempWidgetList1[k]);
                    tempData.push(tempWidgetDataList1[k]);
                }
            }
            tempWidgetList1 = [];
            tempWidgetList1 = temp;
            tempWidgetDataList1 = [];
            tempWidgetDataList1 = tempData;
            var max = Math.max.apply(null, pageWidgets.sizeFilled);
            var emp;
            if (max < 4) {
                loop5:for (var c = 0; c < 6; c++) {
                    if (pageWidgets.sizeFilled[c] == max) {
                        emp = c;
                        break;
                    }
                }
                pageWidgets.empWidget.push({
                    'row': max,
                    'col': emp,
                    'sizeY': 4 - max,
                    'sizeX': 1,
                    'visibility': false
                });
            }
            pages[n] = pageWidgets;
            ++n;
        }
        while (tempWidgetList1.length > 0);
        $scope.expPages = pages;


        $timeout(function () {
            var len = $scope.expPages.length;
            for (var j = 0; j < len; j++) {
                var widLen = $scope.expPages[j].widgets.length;
                for (var ind = 0; ind < widLen; ind++) {
                    for (var i = 0; i < $scope.expPages[j].widgetData[ind].chart.length; i++) {
                        if ($scope.expPages[j].widgetData[ind].chart[i].api)
                            $scope.expPages[j].widgetData[ind].chart[i].api.update();
                    }
                }
                if(j==len-1)
                    document.getElementById('submitExportButton').disabled = false;
            }
        }, 600);

    };

    $scope.closeExport = function () {
        var setJPEGOption = $("#exportOptionJpeg").prop("checked");
        var setPDFOption = $("#exportOptionPDF").prop("checked");
        var setUrlOption = $("#exportOptionUrl").prop("checked");
        var setExcelOption = $("#exportOptionExcel").prop("checked");
        if (setJPEGOption == false && setPDFOption == false && setUrlOption == false && setExcelOption== false) {
            //$(".errorExportMessage").text("* Select the option to export").show();
            //return false;
            $window.alert("* Please Select the option to export");
            readyToButtonLoad=false;

        }
        else {
            readyToButtonLoad=true;
            document.getElementById('submitExportButton').disabled = true;
            if(setPDFOption==true) {
                $rootScope.showExport = false;
                $scope.exportUrl=false;
                $scope.closedCancle=false;
                $timeout(function(){$scope.submitExport()},1800);
            }
            else {
                readyToJPEGDownload=0;
                readyToExcel=0;
                $scope.submitExport();
            }

        }
    };

    $scope.submitExport = function () {
        var dashboardLayout = document.getElementById('dashboardLayout');
        var dashboardExportLayout = document.getElementById('dashLayout');
        var setJPEGOption = $("#exportOptionJpeg").prop("checked");
        var setUrlOption = $("#exportOptionUrl").prop("checked");
        var setPDFOption = $("#exportOptionPDF").prop("checked");
        var setExportOption = $("#exportOptionExcel").prop("checked");
        // if (setJPEGOption == false && setPDFOption == false && setUrlOption == false)
        //     $window.alert("* Please Select the option to export");
        // else
        //     $rootScope.showExport = false;

        if (setJPEGOption == true) {
            $(".navbar").css('z-index', '1');
            /*$("#exportModalContent").removeClass('md-show');*/
            $(".md-overlay").css("background", "rgba(0,0,0,0.5)");
            /*$("#exportJPEGModalContent").addClass('md-show');*/
            $("#dashboardContent").removeClass('dashboardContent');
            $("#dashboardContent").addClass('dashboardContentJpeg');
            domtoimage.toBlob(dashboardLayout)
                .then(
                    function (blob) {
                        $("#dashboardContent").removeClass('dashboardContentJpeg');
                        $("#dashboardContent").addClass('dashboardContent');
                        var timestamp = Number(new Date());
                       /* $("#exportJPEGModalContent").removeClass('md-show');*/
                        window.saveAs(blob, dashboardName + "_" + timestamp + ".jpeg");
                        $("#exportOptionJpeg").prop("checked", false);
                        readyToJPEGDownload=1;
                        $scope.expAct = false;
                        $rootScope.closePdfModal();
                    },
                    function errorCallback(error) {
                        $("#exportJPEGModalContent").removeClass('md-show');
                        $(".md-overlay").css("background", "rgba(0,0,0,0.5)");
                        $("#exportPDFModalContent").addClass('md-show');
                        $(".loadingStatus").hide();
                        $(".pdfHeadText").show().text("Uh-Oh!!").css('font-style', 'normal');
                        $(".pdfContentText").html('<b>Something went wrong. Please try again</b>');
                        document.getElementById('dashboardTitleIcons').style.visibility = "visible";
                        $scope.expAct = false;
                        $rootScope.closePdfModal();
                    }
                );
        }

        if (setPDFOption == true) {

            $(".navbar").css('z-index', '1');
            $("#exportModalContent").removeClass('md-show');
            // $(".md-overlay").css("background","rgba(0,0,0,0.5)");
            //  $("#exportPDFModalContent").addClass('md-show');
            //  $(".pdfHeadText").text('');
            $(".exportContentText").html('<b>Please wait while the PDF file is being generated</b>');
            $(".loadingStatus").show();
            var exportImages=[];

            var dashboardExpLayout=[];
            var promiseExportObject = [];
            $scope.exportPromise = function(dashboardExpLayout) {
                var deferred = $q.defer();
                domtoimage.toPng(dashboardExpLayout)
                    .then(
                        function (dataUrl) {
                            deferred.resolve(dataUrl);
                        },
                        function errorCallback(error) {
                            deferred.reject(error);

                        });
                return deferred.promise;
            }
            for (var j = 0; j < $scope.expPages.length; j++) {
                dashboardExpLayout[j] = document.getElementById('dashLayoutpages-' + j);
                promiseExportObject.push($scope.exportPromise(dashboardExpLayout[j]));
            }
            $q.all(promiseExportObject).then(
                function (exportImages) {
                    var jsonData = {
                        "dashboardLayout": exportImages,
                        "dashboardId": $state.params.id,
                        "dashboardName": dashboardName
                    };

                    $http({
                        method: 'POST',
                        url: '/api/v1/createHtml5ToPdf/dashboard',
                        data: jsonData
                    }).then(
                        function successCallback(response) {
                            $("#exportOptionPDF").prop("checked", false);
                            var timestamp = Number(new Date());
                            var domainUrl = "";
                            if (window.location.hostname == "localhost")
                                domainUrl = "http://localhost:8080";
                            else
                                domainUrl = "";
                            var dwnldUrl = String(domainUrl + response.data.Response);
                            $scope.closedCancle=true;
                            $(".exportContentText").html('<p><span class="pdfHeadText">PDF has been generated successfully</span><br>' +
                                '<span class="pdfContentText"><b><a href="' + dwnldUrl + '" download style="color: green;font-size: 20px;"  id="yourLinkID">Click here to download your PDF</a></b></span></p>');
                            $(".preview-loading").hide();
                            /*$rootScope.closePdfModal();
                            $("#exportPDFModalContent").removeClass('md-show');
                            $(".md-overlay").css("background", "rgba(0,0,0,0.5)");
                            $("#exportPDFModalContent").addClass('md-show');

                            $(".loadingStatus").hide();
                            $(".pdfHeadText").show().text("PDF has been generated successfully");
                            $(".pdfContentText").html('<b><br/><a href="' + dwnldUrl + '" download style="color: green;"  id="yourLinkID">Click here to download your PDF</a></b>');*/
                            // window.saveAs(response.data.Response['blob'], dashboardName + "_" + timestamp + ".pdf");
                            // document.getElementById('yourLinkID').click();
                            // $window.open(dwnldUrl);
                            // window.saveAs(dwnldUrl, dashboardName+"_"+timestamp+".pdf");
                            $scope.expAct = false;
                        },
                        function errorCallback(error) {
                            $rootScope.closePdfModal();
                            $("#exportPDFModalContent").removeClass('md-show');
                            $(".md-overlay").css("background", "rgba(0,0,0,0.5)");
                            $("#exportPDFModalContent").addClass('md-show');
                            $(".loadingStatus").hide();
                            $(".pdfHeadText").show().text("Uh-Oh!!").css({"font-style": 'normal', "color": "red"});
                            $(".pdfContentText").html('<b>Something went wrong. Please try again</b>');
                            document.getElementById('dashboardTitleIcons').style.visibility = "visible";
                            $scope.expAct = false;
                        }
                    );
                },
                function errCallback(error) {
                    $("#exportPDFModalContent").removeClass('md-show');
                    $(".md-overlay").css("background", "rgba(0,0,0,0.5)");
                    $("#exportPDFModalContent").addClass('md-show');
                    $(".loadingStatus").hide();
                    $(".pdfHeadText").show().text("Oh!!").css({"font-style": 'normal', "color": "red"});
                    $(".pdfContentText").html('<b>Something went wrong. Please try again</b>');
                    $scope.expAct = false;
                    $rootScope.closePdfModal();
                });
        }

        if (setUrlOption === true) {
          /*  $rootScope.closePdfModal();*/
            $http({
                method: 'GET',
                url: '/api/v1/get/dashboards/' + $state.params.id
            }).then(
                function successCallback(response) {
                    var reportId = response.data.reportId;
                    var sharingDomain = window.location.hostname == 'localhost' ? "localhost:8080/reports" :  window.location.hostname + "/reports";
                    $scope.sharingUrl = sharingDomain + '#/' + reportId;
                    $(".navbar").css('z-index', '1');
                    //$("#exportModalContent").removeClass('md-show');
                    $(".md-overlay").css("background", "rgba(0,0,0,0.5)");
                   /* $("#exportPDFModalContent").addClass('md-show');*/
                   /* $(".loadingStatus").hide();
                    $(".pdfHeadText").text('');
                    $(".pdfContentText").html('<p id="butt" style="word-wrap: break-word;"><b>Check your dashboard here : ' + '</b>' + sharingUrl + '</p>' + '<button class="btn" id="btnCopyLink" ' + 'data-clipboard-text=sharingUrl">' + '<img src="image/clippy.svg" width="13" alt="Copy to clipboard"></button>');
                    $("#btnCopyLink").attr('data-clipboard-text', sharingUrl);*/
                    readyCopyUrl=1;
                    $scope.exportUrl=true;
                    $scope.expAct=true;
                    var clipboard = new Clipboard('.btn');
                    clipboard.on('success', function (e) {
                        e.clearSelection();
                    });

                },
                function errorCallback(error) {
                    $scope.dashboard.dashboardName = null;
                    swal({
                        title: '',
                        text: '<span style="sweetAlertFont">Something went wrong! Please reload the dashboard</span>',
                        html: true
                    });
                }
            );
        }

        if(setExportOption=== true){
            var finalData=[];
            var tempArray=[];
            var concatDate=date.startDate+'-'+date.endDate
            var newDateFormat = concatDate.replace(/-/g, "")
            for(var n=0;n<$scope.exportObject.widgetData.length;n++) {
                var lengthOfValue;
                for(var chart=0;chart<$scope.exportObject.widgetData[n].chart.length;chart++){
                    if($scope.exportObject.widgetData[n].chart[chart].data) {
                        var formatJson = [];
                        if ($scope.exportObject.widgetData[n].chart[chart].data[0].type == 'line' || $scope.exportObject.widgetData[n].chart[chart].data[0].type == 'bar' || $scope.exportObject.widgetData[n].chart[chart].data[0].type == 'area') {
                            lengthOfValue = $scope.exportObject.widgetData[n].chart[0].data[0].values.length;
                            var j = 0;
                            while (j < lengthOfValue) {
                                var arrangeData = {};
                                for (var k = 0; k < $scope.exportObject.widgetData[n].chart[chart].data.length; k++) {
                                    var noPushInArray = 0;
                                    if ($scope.exportObject.widgetData[n].chart[chart].data[k].type == 'line' || $scope.exportObject.widgetData[n].chart[chart].data[k].type == 'bar' || $scope.exportObject.widgetData[n].chart[chart].data[k].type == 'area') {
                                        if (!$scope.exportObject.widgetData[n].chart[chart].data[k].message) {
                                            arrangeData.Date = moment($scope.exportObject.widgetData[n].chart[chart].data[k].values[j].x).format('YYYY-MM-DD');
                                            arrangeData[$scope.exportObject.widgetData[n].chart[chart].data[k].key] = $scope.exportObject.widgetData[n].chart[chart].data[k].values[j].y;
                                        }
                                        else
                                            noPushInArray = 1;
                                    }

                                }
                                if (noPushInArray != 1)
                                    formatJson.push(arrangeData)

                                j++
                            }
                        }
                        else if ($scope.exportObject.widgetData[n].chart[chart].data[0].type == 'pie') {
                            var arrangeData = {};
                            for (var k = 0; k < $scope.exportObject.widgetData[n].chart[chart].data.length; k++) {
                                var noPushInArray = 0;
                                if (!$scope.exportObject.widgetData[n].chart[chart].data[k].message)
                                    arrangeData[$scope.exportObject.widgetData[n].chart[chart].data[k].key] = $scope.exportObject.widgetData[n].chart[chart].data[k].y;
                                else
                                    noPushInArray = 1
                            }
                            if (noPushInArray != 1)
                                formatJson.push(arrangeData)
                            
                        }
                        else if ($scope.exportObject.widgetData[n].chart[chart].options.chart.type == 'highEngagementTweets') {
                            lengthOfValue = $scope.exportObject.widgetData[n].chart[0].data.length;
                            for (var k = 0; k < $scope.exportObject.widgetData[n].chart[chart].data.length; k++) {
                                var noPushInArray = 0;
                                if (!$scope.exportObject.widgetData[n].chart[chart].data[k].message) {
                                    var arrangeData =
                                    {
                                        Date: $scope.exportObject.widgetData[n].chart[chart].data[k].date,
                                        Post: $scope.exportObject.widgetData[n].chart[chart].data[k].postComment.replace(/\r?\n|\r/g, "").trim(),
                                        Likes: $scope.exportObject.widgetData[n].chart[chart].data[k].likes,
                                        ReTweet: $scope.exportObject.widgetData[n].chart[chart].data[k].reTweet,
                                    }
                                }
                                else
                                    noPushInArray = 1;

                                if (noPushInArray != 1)
                                    formatJson.push(arrangeData)
                            }

                        }
                        else if ($scope.exportObject.widgetData[n].chart[chart].options.chart.type == 'instagramPosts') {
                            for (var k = 0; k < $scope.exportObject.widgetData[n].chart[chart].data.length; k++) {
                                var noPushInArray = 0;
                                if (!$scope.exportObject.widgetData[n].chart[chart].data[k].message) {
                                    var arrangeData =
                                    {
                                        Date: $scope.exportObject.widgetData[n].chart[chart].data[k].date,
                                        Post: $scope.exportObject.widgetData[n].chart[chart].data[k].postComment.replace(/\r?\n|\r/g, ""),
                                        Likes: $scope.exportObject.widgetData[n].chart[chart].data[k].likes,
                                        Comments: $scope.exportObject.widgetData[n].chart[chart].data[k].comments
                                    }
                                }
                                else
                                    noPushInArray = 1;

                                if (noPushInArray != 1)
                                    formatJson.push(arrangeData)
                            }
                        }
                        else if ($scope.exportObject.widgetData[n].chart[chart].options.chart.type == 'highestEngagementLinkedIn') {
                            for (var k = 0; k < $scope.exportObject.widgetData[n].chart[chart].data.length; k++) {
                                var noPushInArray = 0;
                                if (!$scope.exportObject.widgetData[n].chart[chart].data[k].message) {
                                    var arrangeData =
                                    {
                                        Date: $scope.exportObject.widgetData[n].chart[chart].data[k].date,
                                        Post: $scope.exportObject.widgetData[n].chart[chart].data[k].postComment.replace(/\r?\n|\r/g, ""),
                                        Likes: $scope.exportObject.widgetData[n].chart[chart].data[k].likes,
                                        Comments: $scope.exportObject.widgetData[n].chart[chart].data[k].comments,
                                        Impression: $scope.exportObject.widgetData[n].chart[chart].data[k].impressions,
                                        Clicks: $scope.exportObject.widgetData[n].chart[chart].data[k].clicks,
                                        Shares: $scope.exportObject.widgetData[n].chart[chart].data[k].shares
                                    }
                                }
                                else
                                    noPushInArray = 1;

                                if (noPushInArray != 1)
                                    formatJson.push(arrangeData)
                            }
                        }
                        else if ($scope.exportObject.widgetData[n].chart[chart].options.chart.type == 'pinterestEngagementRate') {
                            for (var k = 0; k < $scope.exportObject.widgetData[n].chart[chart].data.length; k++) {
                                var noPushInArray = 0;
                                if (!$scope.exportObject.widgetData[n].chart[chart].data[k].message) {
                                    var arrangeData =
                                    {
                                        Date: $scope.exportObject.widgetData[n].chart[chart].data[k].date,
                                        Post: $scope.exportObject.widgetData[n].chart[chart].data[k].postComment.replace(/\r?\n|\r/g, ""),
                                        Likes: $scope.exportObject.widgetData[n].chart[chart].data[k].likes,
                                        Comments: $scope.exportObject.widgetData[n].chart[chart].data[k].comments,
                                        Repins: $scope.exportObject.widgetData[n].chart[chart].data[k].repins,
                                    }
                                }
                                else
                                    noPushInArray = 1;

                                if (noPushInArray != 1)
                                    formatJson.push(arrangeData)
                            }
                        }
                        else if ($scope.exportObject.widgetData[n].chart[chart].options.chart.type == 'pinterestLeaderboard') {
                            for (var k = 0; k < $scope.exportObject.widgetData[n].chart[chart].data.length; k++) {
                                var noPushInArray = 0;
                                if (!$scope.exportObject.widgetData[n].chart[chart].data[k].message) {
                                    var arrangeData =
                                    {
                                        Date: $scope.exportObject.widgetData[n].chart[chart].data[k].date,
                                        Post: $scope.exportObject.widgetData[n].chart[chart].data[k].postComment.replace(/\r?\n|\r/g, ""),
                                        Collaborators: $scope.exportObject.widgetData[n].chart[chart].data[k].collaborators,
                                        Pins: $scope.exportObject.widgetData[n].chart[chart].data[k].pins,
                                        Followers: $scope.exportObject.widgetData[n].chart[chart].data[k].followers,
                                    }
                                }
                                else
                                    noPushInArray = 1;

                                if (noPushInArray != 1)
                                    formatJson.push(arrangeData)
                            }
                        }
                        else if ($scope.exportObject.widgetData[n].chart[chart].options.chart.type == 'vimeoTopVideos') {
                            for (var k = 0; k < $scope.exportObject.widgetData[n].chart[chart].data.length; k++) {
                                var noPushInArray = 0;
                                if (!$scope.exportObject.widgetData[n].chart[chart].data[k].message) {
                                    var arrangeData =
                                    {
                                        Date: $scope.exportObject.widgetData[n].chart[chart].data[k].date,
                                        Post: $scope.exportObject.widgetData[n].chart[chart].data[k].title.replace(/\r?\n|\r/g, ""),
                                        Comment: $scope.exportObject.widgetData[n].chart[chart].data[k].Comment,
                                        likes: $scope.exportObject.widgetData[n].chart[chart].data[k].likes,
                                        Views: $scope.exportObject.widgetData[n].chart[chart].data[k].views,
                                    }
                                }
                                else
                                    noPushInArray = 1;

                                if (noPushInArray != 1)
                                    formatJson.push(arrangeData)
                            }
                        }
                        else if ($scope.exportObject.widgetData[n].chart[chart].options.chart.type == 'gaTopPagesByVisit') {
                            for (var k = 0; k < $scope.exportObject.widgetData[n].chart[chart].data.length; k++) {
                                var noPushInArray = 0;
                                if (!$scope.exportObject.widgetData[n].chart[chart].data[k].message) {
                                    var arrangeData =
                                    {
                                        PageTitle: $scope.exportObject.widgetData[n].chart[chart].data[k].pageTitle.replace(/\r?\n|\r/g, ""),
                                        PagePath: $scope.exportObject.widgetData[n].chart[chart].data[k].pagePath,
                                        PageViews: $scope.exportObject.widgetData[n].chart[chart].data[k].pageviews,
                                        AvgTimeOnpage: $scope.exportObject.widgetData[n].chart[chart].data[k].avgTimeOnpage,
                                        BouncesRate: $scope.exportObject.widgetData[n].chart[chart].data[k].bouncesRate
                                    }
                                }
                                else
                                    noPushInArray = 1;

                                if (noPushInArray != 1)
                                    formatJson.push(arrangeData)
                            }
                        }
                        else if ($scope.exportObject.widgetData[n].chart[chart].options.chart.type == 'mozoverview') {
                            var noPushInArray = 0;
                                if (!$scope.exportObject.widgetData[n].chart[chart].data[k].message) {
                                    var arrangeData =
                                    {
                                        'Moz Rank': $scope.exportObject.widgetData[n].chart[chart].displayData.mozRankURL,
                                        'External Links': $scope.exportObject.widgetData[n].chart[chart].displayData.externalEquityLinks,
                                        'Domain Authority': $scope.exportObject.widgetData[n].chart[chart].displayData.domainageAuthority,
                                        'Page Authority': $scope.exportObject.widgetData[n].chart[chart].displayData.pageAuthority,
                                        'Back Links ': $scope.exportObject.widgetData[n].chart[chart].displayData.links
                                    }
                                }
                                else
                                    noPushInArray = 1;

                                if (noPushInArray != 1)
                                    formatJson.push(arrangeData)

                        }
                        finalData.push({data: formatJson, title: $scope.exportObject.widgetData[n].name});
                    }
                }

            }

            /*var data=[
                [{"Vehicle":"BMW","Date":"30, Jul 2013 09:24 AM","Location":"Hauz Khas, Enclave, New Delhi, Delhi, India","Speed":42},
                    {"Vehicle":"Honda CBR","Date":"30, Jul 2013 12:00 AM","Location":"Military Road, West Bengal 734013,  India","Speed":0},
                    {"Vehicle":"Supra","Date":"30, Jul 2013 07:53 AM","Location":"Sec-45, St. Angel's School, Gurgaon, Haryana, India","Speed":58},
                    {"Vehicle":"Land Cruiser","Date":"30, Jul 2013 09:35 AM","Location":"DLF Phase I, Marble Market, Gurgaon, Haryana, India","Speed":83},
                    {"Vehicle":"Suzuki Swift","Date":"30, Jul 2013 12:02 AM","Location":"Behind Central Bank RO, Ram Krishna Rd by-lane, Siliguri, West Bengal, India","Speed":0}
                ],
                [{"Vehicle":"BMW","Date":"30, Jul 2013 09:24 AM","Location":"Hauz Khas, Enclave, New Delhi, Delhi, India","Speed":42},
                    {"Vehicle":"Honda CBR","Date":"30, Jul 2013 12:00 AM","Location":"Military Road, West Bengal 734013,  India","Speed":0},
                    {"Vehicle":"Supra","Date":"30, Jul 2013 07:53 AM","Location":"Sec-45, St. Angel's School, Gurgaon, Haryana, India","Speed":58},
                    {"Vehicle":"Land Cruiser","Date":"30, Jul 2013 09:35 AM","Location":"DLF Phase I, Marble Market, Gurgaon, Haryana, India","Speed":83},
                    {"Vehicle":"Suzuki Swift","Date":"30, Jul 2013 12:02 AM","Location":"Behind Central Bank RO, Ram Krishna Rd by-lane, Siliguri, West Bengal, India","Speed":0}
                ]
            ];*/
            for(var i=0;i<finalData.length;i++){
                tempArray.push(JSONToCSVConvertor(finalData[i].data, finalData[i].title, true));
            }
            $q.all(tempArray).then(function(tempArray){
                var excel ='data:text/csv;charset=utf-8,'+escape(tempArray);
                var link = document.createElement("a");
                link.href = excel;
                var fileName = "Report_"+newDateFormat;
                //this will remove the blank-spaces from the title and replace it with an underscore
                //fileName += ReportTitle.replace(/ /g,"_");
                //set the visibility hidden so it will not effect on your web-layout
                link.style = "visibility:hidden";
                link.download = fileName + ".csv";

                //this part will append the anchor tag and remove it after automatic click
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                readyToExcel=1;
                $rootScope.closePdfModal();
            });
            //JSONToCSVConvertor(data, "Vehicle Report", true);

           function JSONToCSVConvertor(JSONData, ReportTitle, ShowLabel) {
                var deferred=$q.defer();
                //If JSONData is not an object then JSON.parse will parse the JSON string in an Object
                var arrData = typeof JSONData != 'object' ? JSON.parse(JSONData) : JSONData;
               var CSV = '';
                //Set Report title in first row or line
                CSV='\r\n';
                CSV += ReportTitle + '\r\n\n';

                //This condition will generate the Label/Header
                if (ShowLabel) {
                    var row = "";

                    //This loop will extract the label from 1st index of on array
                    for (var index in arrData[0]) {
                            //Now convert each value to string and comma-seprated
                            row += index + ',';
                        }

                    row = row.slice(0, -1);

                    //append Label row with line break
                    CSV += row + '\r\n';
                }

                //1st loop is to extract each row
                for (var i = 0; i < arrData.length; i++) {
                    var row = "";

                    //2nd loop will extract each column and convert it in string comma-seprated
                    for (var index in arrData[i]) {
                        row += '"' + arrData[i][index] + '",';
                    }

                    row.slice(0, row.length - 1);

                    //add a line break after each row
                    CSV += row + '\r\n';
                }

                if (CSV == '') {
                    alert("Invalid data");
                    return;
                }

                //Generate a file name


                //Initialize file format you want csv or xls
                var uri = CSV;
                deferred.resolve(uri);
                return deferred.promise;
                // Now the little tricky part.
                // you can use either>> window.open(uri);
                // but this will not work in some browsers
                // or you will not get the correct file extension

                /*!//this trick will generate a temp <a /> tag
                var link = document.createElement("a");
                link.href = uri;

                //set the visibility hidden so it will not effect on your web-layout
                link.style = "visibility:hidden";
                link.download = fileName + ".csv";

                //this part will append the anchor tag and remove it after automatic click
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);*/
            }
        }
    };


}