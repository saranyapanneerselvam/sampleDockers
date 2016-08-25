showMetricApp.controller('ExportController', ExportController)

function ExportController($scope, $http, $state, $rootScope, $window,$q,$stateParams, $timeout) {
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
    if ($rootScope.expObj != undefined) {
        var tWid = $rootScope.expObj.widgets;
        var tWidData = $rootScope.expObj.widgetData;
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
    $scope.calcColumnWidth = function (x) {

        if (x <= 2)
            return ('col-sm-' + 12 + ' col-md-' + 12 + ' col-lg-' + 12);
        else if (x > 2 && x <= 4)
            return ('col-sm-' + 6 + ' col-md-' + 6 + ' col-lg-' + 6);
        else
            return ('col-sm-' + 4 + ' col-md-' + 4 + ' col-lg-' + 4);
    };

    $scope.calcRowHeight = function (availableHeight, noOfItems) {
        var cols;
        if (noOfItems <= 2)
            cols = 1;
        else if (noOfItems > 2 && noOfItems <= 4)
            cols = 2;
        else
            cols = 3;
        //var cols = $window.innerWidth>=768 ? 2 : 1;
        var rows = Math.ceil(noOfItems / cols);
        var heightPercent = 100 / rows;
        // var rowHeight = document.getElementById('chartRowHeight-'+widgetId).offsetHeight;
        // var rHeight = rowHeight;
        //  var availableHeight = Math.floor(rHeight/rows);
        var fontSizeEm = availableHeight / 100 * 3.5;
        var minSize = 0.7, maxSize = 1.2;
        if (fontSizeEm < minSize)
            fontSizeEm = minSize;
        if (fontSizeEm > maxSize)
            fontSizeEm = maxSize;
        return {'height': (heightPercent + '%'), 'font-size': (fontSizeEm + 'em')};
    };
    var vm = this;
    $scope.pdfPrintPreview = function (opt) {
        $scope.expAct = opt;
    };


    //To download a pdf/jpeg version of the dashboard
    $scope.printpaperPDF = function () {
        // $scope.windowWidth = String(parseInt(($window.outerWidth)*0.028))+'px';

        if($window.outerWidth>=1600)
        {
            $scope.windowWidth = true;
        }
        console.log("$scope.windowWidth",$scope.windowWidth,$window.outerWidth);
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
                if (tempWidgetList1[getWidgetInfo].sizeY < 2) {
                    tempWidgetList1[getWidgetInfo].sizeY = 2;
                }
                var pos = tempWidgetList1[getWidgetInfo].col;
                var checkpos = pos + tempWidgetList1[getWidgetInfo].sizeX - 1;
                for (var p = pos; p <= checkpos; p++) {
                    if (tempWidgetList1[getWidgetInfo].sizeY <= pageWidgets.sizeLeft[p])
                        caninsert *= 1;
                    else
                        caninsert *= 0;
                }
                if (caninsert == 1) {
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
            }
        }, 1000);
    };

    $scope.closeExport = function () {
        var setJPEGOption = $("#exportOptionJpeg").prop("checked");
        var setPDFOption = $("#exportOptionPDF").prop("checked");
        var setUrlOption = $("#exportOptionUrl").prop("checked");
        if (setJPEGOption == false && setPDFOption == false && setUrlOption == false) {
            //$(".errorExportMessage").text("* Select the option to export").show();
            //return false;
            $window.alert("* Please Select the option to export");
        }
        else {
            $rootScope.showExport = false;
            $scope.submitExport();
        }
    };

    $scope.submitExport = function () {
        var dashboardLayout = document.getElementById('dashboardLayout');
        var dashboardExportLayout = document.getElementById('dashLayout');
        var setJPEGOption = $("#exportOptionJpeg").prop("checked");
        var setPDFOption = $("#exportOptionPDF").prop("checked");
        var setUrlOption = $("#exportOptionUrl").prop("checked");
        if (setJPEGOption == false && setPDFOption == false && setUrlOption == false)
        //$(".errorExportMessage").text("* Select the option to export").show();
            $window.alert("* Please Select the option to export");
        else
            $rootScope.showExport = false;

        if (setJPEGOption == true) {
            $(".navbar").css('z-index', '1');
            $("#exportModalContent").removeClass('md-show');
            $(".md-overlay").css("background", "rgba(0,0,0,0.5)");
            $("#exportJPEGModalContent").addClass('md-show');
            $rootScope.closePdfModal();

            domtoimage.toBlob(dashboardLayout)
                .then(
                    function (blob) {
                        var timestamp = Number(new Date());
                        $("#exportJPEGModalContent").removeClass('md-show');
                        window.saveAs(blob, dashboardName + "_" + timestamp + ".jpeg");
                        $("#exportOptionJpeg").prop("checked", false);
                        $scope.expAct = false;
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

            // function asyncGreet(name) {
            //     // perform some asynchronous operation, resolve or reject the promise when appropriate.
            //     return $q(function(resolve, reject) {
            //         setTimeout(function() {
            //             if (okToGreet(name)) {
            //                 resolve('Hello, ' + name + '!');
            //             } else {
            //                 reject('Greeting ' + name + ' is not allowed.');
            //             }
            //         }, 1000);
            //     });
            // }
            //
            // var promise = asyncGreet('Robin Hood');
            // promise.then(function(greeting) {
            //     alert('Success: ' + greeting);
            // }, function(reason) {
            //     alert('Failed: ' + reason);
            // });









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
            // console.log("promiseExportObject",promiseExportObject);
            $q.all(promiseExportObject).then(
                function (exportImages) {
                    // console.log("exportImages inside promise",exportImages);
                    var jsonData = {
                        "dashboardLayout": exportImages,
                        "dashboardId": $state.params.id,
                        "dashboardName": dashboardName
                    };
                    console.log("exportImages",exportImages.length);
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
                            $rootScope.closePdfModal();
                            $("#exportPDFModalContent").removeClass('md-show');
                            $(".md-overlay").css("background", "rgba(0,0,0,0.5)");
                            $("#exportPDFModalContent").addClass('md-show');

                            $(".loadingStatus").hide();
                            $(".pdfHeadText").show().text("PDF has been generated successfully").css('font-style', 'italic');
                            $(".pdfContentText").html('<b>Your download should start shortly.<br/><a id="yourLinkID" href="' + domainUrl + response.data.Response + '" download style="color: #1AB394;"> If not, please use direct link.</a></b>');
                            document.getElementById('yourLinkID').click();
                            var dwnldUrl = String(domainUrl + response.data.Response);
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
            $rootScope.closePdfModal();
            $http({
                method: 'GET',
                url: '/api/v1/get/dashboards/' + $state.params.id
            }).then(
                function successCallback(response) {
                    var reportId = response.data.reportId;
                    var sharingDomain = window.location.hostname == 'localhost' ? "localhost:8080/reports" : "https://" + window.location.hostname + "/reports";
                    var sharingUrl = sharingDomain + '#/' + reportId;
                    $(".navbar").css('z-index', '1');
                    $("#exportModalContent").removeClass('md-show');
                    $(".md-overlay").css("background", "rgba(0,0,0,0.5)");
                    $("#exportPDFModalContent").addClass('md-show');
                    $(".loadingStatus").hide();
                    $(".pdfHeadText").text('');
                    $(".pdfContentText").html('<p id="butt"><b>Check your dashboard here : ' + '</b>' + sharingUrl + '</p>' + '<button class="btn" id="btnCopyLink" ' + 'data-clipboard-text=sharingUrl">' + '<img src="image/clippy.svg" width="13" alt="Copy to clipboard"></button>');
                    $("#btnCopyLink").attr('data-clipboard-text', sharingUrl);
                    var clipboard = new Clipboard('.btn');
                    clipboard.on('success', function (e) {
                        e.clearSelection();
                        swal("Copied", "", "success");
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
    };
}