showMetricApp.controller('DashboardController',DashboardController);

function DashboardController($scope,$timeout,$rootScope,$http,$window,$state,$stateParams,createWidgets,$q,$compile) {
    $scope.loading=false;
    $scope.$window = $window;
    $scope.autoArrangeGrid = false;
    $scope.dashbd = { widgets: [], widgetData: []};
    $scope.dashbd.dashboardName='';
    $scope.widgetErrorCode=0;
    $scope.actionTypeEnable={};
    $scope.submitEnable={};
    $scope.messageEnable={};
    var expWid = { dashName:[], wid: [], widData: []};
    $scope.currentDate=moment(new Date()).format("YYYY-DD-MM");
    $scope.widgetsize=function(widgetsizeX){
        if(widgetsizeX==1){
            return {float:"left"}
        }
    }


    // document.getElementById('dashLayout').style.visibility = "hidden";
    var isExportOptionSet = '';
    $(".navbar").css('z-index','1');
    $(".md-overlay").css('background','rgba(0,0,0,0.5)');


    //Sets up all the required parameters for the dashboard to function properly when it is initially loaded. This is called in the ng-init function of the dashboard template
    $scope.dashboardConfiguration = function () {

        //Defining configuration parameters for dashboard layout
        $scope.dashboard = { widgets: [], widgetData: [] };
        $scope.dashboard.dashboardName = '';
        $scope.widgetsPresent = false;
        $scope.loadedWidgetCount = 0;
        $scope.widgetErrorCode=0;
        $scope.fetchDateForDashboard=function(){
            $http({
                method: 'GET',
                url: '/api/v1/get/dashboards/' + $state.params.id
            }).then(
                function successCallback(response) {
                    if (response.status == 200) {
                        var diffWithStartDate = dayDiff(response.data.startDate, new Date());
                        var diffWithEndDate = dayDiff(response.data.endDate, new Date());
                        var changeInDb = true;
                        function dayDiff(startDate, endDate) {
                            var storeStartDate = new Date(startDate);
                            var storeEndDate = new Date(endDate);
                            var timeDiff = Math.abs(storeEndDate.getTime() - storeStartDate.getTime());
                            var diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24));
                            return diffDays;
                        }

                        if (diffWithStartDate >= 365 || diffWithEndDate >= 365) {
                            $scope.startDate = moment(new Date()).subtract(30, 'days');
                            $scope.endDate = new Date();
                            storeDateInDb($scope.startDate,$scope.endDate, changeInDb);
                        }

                        else {
                            $scope. startDate = response.data.startDate;
                            $scope. endDate = response.data.endDate;
                            $scope.userModifyDate($scope.startDate, $scope.endDate);
                        }
                    }
                    else {
                        $scope.startDate = moment(new Date()).subtract(30, 'days');
                        $scope.endDate = new Date();
                        $scope.userModifyDate($scope.startDate, $scope.endDate)
                    }
                    // $scope.userModifyDate(startDate,endDate)
                }
            )
        };
        $scope.fetchDateForDashboard();

        //To define the calendar in dashboard header
        $scope.userModifyDate = function (startDate, endDate) {
            $scope.dashboardCalendar = new Calendar({
                element: $('.daterange--double'),
                earliest_date: moment(new Date()).subtract(365, 'days'),
                latest_date: new Date(),
                start_date: startDate,
                end_date: endDate,
                callback: function () {
                    storeDateInDb(this.start_date, this.end_date);
                }
            });
        };
        function storeDateInDb(start_date, end_date, changeInDb) {
            var jsonData = {
                dashboardId: $state.params.id,
                startDate: start_date,
                endDate: end_date
            };
            $http(
                {
                    method: 'POST',
                    url: '/api/v1/create/dashboards',
                    data: jsonData
                }
            ).then(
                function successCallback(response) {
                    if (response.status == 200) {
                        $scope.startDate = response.config.data.startDate;
                        $scope.endDate = response.config.data.endDate;
                        if (changeInDb === true) {
                            $scope.userModifyDate( $scope.startDate, $scope.endDate);
                        }
                        else {
                            $scope.populateDashboardWidgets();
                        }
                    }
                    else {
                        var startDate = this.start_date;
                        var endDate = this.end_date;
                        $scope.populateDashboardWidgets();
                    }
                    // var start = moment(this.start_date).format('ll'), end = moment(this.end_date).format('ll');
                },
                function errorCallback(error) {
                    var startDate = this.start_date;
                    var endDate = this.end_date;
                    $scope.populateDashboardWidgets();
                });
        }

        //Setting up grid configuration for widgets
        $scope.gridsterOptions = {
            margins: [20, 20],
            columns: 6,
            defaultSizeX: 2,
            defaultSizeY: 2,
            minSizeX: 1,
            minSizeY: 1,
            swapping: true,
            float: true,
            pushing: true,
            width: 'auto',
            colWidth:'auto',
            draggable: {
                enabled: true,
                handle: '.box-header',
                stop: function (event, $element, widget) {
                    $rootScope.$broadcast('storeGridStructure',{});
                }
            },
            outerMargin: true, // whether margins apply to outer edges of the grid
            mobileBreakPoint: 700,
            mobileModeEnabled: true, // whether or not to toggle mobile mode when screen width is less than mobileBreakPoint
            /*isMobile: false, // stacks the grid items if true*/
            resizable: {
                enabled: true,
                handles: ['se'], //handles: ['n', 'e', 's', 'w', 'ne', 'se', 'sw', 'nw'],
                start: function (event, $element, widget) {
                    var getWidgetColor = $("#getWidgetColor-"+widget.id).attr('ref');
                    if(getWidgetColor == '')
                        getWidgetColor='#288DC0';
                    $(".getBox-"+widget.id).css('border','3px solid '+getWidgetColor);
                },
                resize: function (event, $element, widget) {
                    var getWidgetColor = $("#getWidgetColor-"+widget.id).attr('ref');
                    if(getWidgetColor == ''){
                        getWidgetColor= '#288DC0';
                    }
                    $(".getBox-"+widget.id).css('border','3px solid '+getWidgetColor);
                    var ind = $scope.dashboard.widgets.indexOf(widget);
                    for(var i=0;i<$scope.dashboard.widgetData[ind].chart.length;i++){
                        if ($scope.dashboard.widgetData[ind].chart[i].api){
                            $scope.dashboard.widgetData[ind].chart[i].api.update();
                        }
                    }
                },
                stop: function (event, $element, widget) {
                    $(".getBox-"+widget.id).css('border','1px solid #ccc');
                    $rootScope.$broadcast('storeGridStructure',{});
                    function updateCharts(widget){
                        return function(){
                            var ind = $scope.dashboard.widgets.indexOf(widget);
                            for (var i = 0; i < $scope.dashboard.widgetData[ind].chart.length; i++) {
                                if ($scope.dashboard.widgetData[ind].chart[i].options.chart.type === 'lineChart' || $scope.dashboard.widgetData[ind].chart[i].options.chart.type === 'pieChart' || $scope.dashboard.widgetData[ind].chart[i].options.chart.type === 'multiBarChart' || $scope.dashboard.widgetData[ind].chart[i].options.chart.type === 'multiChart') {

                                    for (var j = 0; j < $scope.dashboard.widgetData[ind].chart[i].data.length; j++) {
                                        var elemHeight = document.getElementById('li-' + widget.id + '-' + String(j)).offsetHeight;
                                        $scope.dashboard.widgetData[ind].chart[i].data[j].myheight = elemHeight;
                                    }
                                }

                                else{
                                    var getWigetId='#getWidgetColor-' + widget.id
                                    var listed = $('#chartTable-'+widget.id).width();
                                    if (listed <= 350){
                                        $('#chartTable-'+widget.id).find('.date').addClass('responsiveDate').removeClass('date');
                                        $('#chartTable-'+widget.id).find('.listed').addClass('responsiveListed');
                                        $('#chartTable-'+widget.id).find('.aside').css('padding-left','75px');
                                        $('#chartTable-'+widget.id).find('.impression').css('padding-top','0px');
                                        $('#chartTable-'+widget.id).find('.likes').css('float','none');
                                        $('#chartTable-'+widget.id).find('.comment').css('float','none');
                                        $('#chartTable-'+widget.id).find('.comment').css('margin-left','0px');
                                    }
                                    else {
                                        $('#chartTable-'+widget.id).find('.responsiveDate').addClass('date').removeClass('responsiveDate');
                                        $('#chartTable-'+widget.id).find('.listed').removeClass('responsiveListed');
                                        $('#chartTable-'+widget.id).find('.comment').css('float','left');
                                        $('#chartTable-'+widget.id).find('.comment').css('margin-left','5px');
                                        $('#chartTable-'+widget.id).find('.likes').css('float','left');
                                        $('#chartTable-'+widget.id).find('.impression').css('padding-top','15px');
                                        $('#chartTable-'+widget.id).find('.aside').css('padding-left','83px');

                                    }
                                }
                            }
                            var ind = $scope.dashboard.widgets.indexOf(widget);
                            for(var i=0;i<$scope.dashboard.widgetData[ind].chart.length;i++){
                                if ($scope.dashboard.widgetData[ind].chart[i].api)
                                    $scope.dashboard.widgetData[ind].chart[i].api.update();
                            }
                        }
                    }
                    $timeout(updateCharts(widget),400);



                }
            }
        };

        //To fetch the name of the dashboard from database and display it when the dashboard is loaded
        $scope.fetchDashboardName = function () {
            $http({
                method: 'GET',
                url: '/api/v1/get/dashboards/'+ $state.params.id
            }).then(
                function successCallback(response) {
                    if(response.status == '200'){
                        $scope.dashboard.dashboardName =  response.data.name;
                        $rootScope.populateDashboardWidgets();
                    }
                    else
                        $scope.dashboard.dashboardName =  null;
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
        };

        $scope.fetchDashboardName();

        //To change the name of the dashboard to user entered value
        $scope.changeDashboardName = function () {
            var jsonData = {
                dashboardId: $state.params.id,
                name: $scope.dashboard.dashboardName
            };
            $http({
                method: 'POST',
                url: '/api/v1/create/dashboards',
                data: jsonData
            }).then(
                function successCallback(response) {
                    if(response.status == '200')
                        console.log(response);
                },
                function errorCallback(error) {
                    swal({
                        title: "",
                        text: "<span style='sweetAlertFont'>Error in changing the name! Please try again</span> .",
                        html: true
                    });
                }
            );
        };

        $scope.changeWidgetName = function (widgetInfo,widgetdata) {
            var inputParams = [];
            var jsonData = {
                "dashboardId": $state.params.id,
                "widgetId": widgetInfo.id,
                "name": widgetdata
            };
            inputParams.push(jsonData);

            $http({
                method: 'POST',
                url: '/api/v1/update/widgets',
                data: inputParams
            }).then(
                function successCallback(response) {
                    if(response.status == '200')
                        console.log(response);
                },
                function errorCallback(error) {
                    swal({
                        title: "",
                        text: "<span style='sweetAlertFont'>Error in changing the name! Please try again</span> .",
                        html: true
                    });
                }
            );
        };

        $scope.$on('gridster-resized', function(sizes, gridster,$element) {
            for(var i=0;i<$scope.dashboard.widgets.length;i++){
                $timeout(resizeWidget(i), 100);
            }
            function resizeWidget(i) {
                return function() {
                    if(typeof $scope.dashboard.widgetData[i].chart != 'undefined'){
                        for(var j=0;j<$scope.dashboard.widgetData[i].chart.length;j++){
                            if ($scope.dashboard.widgetData[i].chart[j].api){
                                $scope.dashboard.widgetData[i].chart[j].api.update();
                            }
                        }
                    }
                };
            }
        });

        $scope.$on('gridster-mobile-changed', function( e,gridster) {
            $scope.isMobile = gridster.isMobile;
        });

        $scope.$on('storeGridStructure',function(e){
            var inputParams = [];
            if($scope.dashboard.widgets.length !=0){
                for(var getWidgetInfo in $scope.dashboard.widgets){
                    var jsonData = {
                        dashboardId: $state.params.id,
                        widgetId: $scope.dashboard.widgets[getWidgetInfo].id,
                        name: $scope.dashboard.widgets[getWidgetInfo].name,
                        row: $scope.dashboard.widgets[getWidgetInfo].row,
                        col: $scope.dashboard.widgets[getWidgetInfo].col,
                        size: {
                            h: $scope.dashboard.widgets[getWidgetInfo].sizeY,
                            w: $scope.dashboard.widgets[getWidgetInfo].sizeX
                        },
                        minSize: {
                            h: $scope.dashboard.widgets[getWidgetInfo].minSizeY,
                            w: $scope.dashboard.widgets[getWidgetInfo].minSizeX
                        },
                        maxSize: {
                            h: $scope.dashboard.widgets[getWidgetInfo].maxSizeY,
                            w: $scope.dashboard.widgets[getWidgetInfo].maxSizeX
                        }
                    };
                    inputParams.push(jsonData);
                }
                $http({
                    method: 'POST',
                    url: '/api/v1/widgets',
                    data: inputParams
                }).then(
                    function successCallback(response){
                        for(var i=0;i<$scope.dashboard.widgetData.length;i++)
                        {
                            if($scope.dashboard.widgetData[i].chart.length===0){
                                if($scope.dashboard.widgetData[i].visibility==false){
                                    if($scope.dashboard.widgetData[i].dataerror === true){
                                        $("#widgetData-"+$scope.dashboard.widgetData[i].id).hide();
                                        $("#errorWidgetData-"+$scope.dashboard.widgetData[i].id).hide();
                                        $("#errorWidgetTokenexpire-" + $scope.dashboard.widgetData[i].id).show()
                                    }
                                    else{
                                        $("#widgetData-"+$scope.dashboard.widgetData[i].id).hide();
                                        $("#errorWidgetData-"+$scope.dashboard.widgetData[i].id).show();
                                        $("#errorWidgetTokenexpire-" + $scope.dashboard.widgetData[i].id).hide()
                                    }

                                }
                            }
                        }
                    },
                    function errorCallback (error){
                        swal({
                            title: "",
                            text: "<span style='sweetAlertFont'>Something is missing! Please refresh the dashboard</span> .",
                            html: true
                        });
                    }
                );
            }
        });

        angular.element($window).on('resize', function (e) {
            $scope.$broadcast('resize');
        });

        $scope.$on('resize',function(e){
            for(var i=0;i<$scope.dashboard.widgets.length;i++){
                $timeout(resizeWidget(i), 100);
            }
            function resizeWidget(i) {
                return function() {
                    if(typeof $scope.dashboard.widgetData[i].chart != 'undefined'){
                        for(j=0;j<$scope.dashboard.widgetData[i].chart.length;j++){
                            if ($scope.dashboard.widgetData[i].chart[j].api)
                                $scope.dashboard.widgetData[i].chart[j].api.update();
                        }
                    }
                };
            }
        });

        $scope.calculateColumnWidth = function(noOfItems,widgetWidth,noOfCharts) {

            widgetWidth = Math.floor(widgetWidth/noOfCharts);
            
            if(widgetWidth < 1)
                widgetWidth = 1;
            if(widgetWidth==1)
                return ('col-sm-'+12+' col-md-'+12+' col-lg-'+12);
            else {
                if(widgetWidth==2){
                    if(noOfItems<=2)
                        return ('col-sm-'+12+' col-md-'+12+' col-lg-'+12);
                    else
                        return ('col-sm-'+6+' col-md-'+6+' col-lg-'+6);
                }
                else {
                    if (noOfItems <= 2)
                        return ('col-sm-' + 12 + ' col-md-' + 12 + ' col-lg-' + 12);
                    else if (noOfItems > 2 && noOfItems <= 4)
                        return ('col-sm-'+6+' col-md-'+6+' col-lg-'+6);
                    else
                        return ('col-sm-'+4+' col-md-'+4+' col-lg-'+4);
                }
            }
        };
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

        $scope.calculateRowHeight = function(data,noOfItems,widgetWidth,widgetHeight,noOfCharts) {
            widgetWidth = Math.floor(widgetWidth/noOfCharts);
            if(widgetWidth < 1)
                widgetWidth = 1;

            var cols;

            if(widgetWidth==1)
                cols =1;
            else {
                if(widgetWidth==2){
                    if(noOfItems<=2)
                        cols=1;
                    else
                        cols =2;
                }
                else {
                    if(noOfItems<=2)
                        cols = 1;
                    else if(noOfItems>2 && noOfItems<=4)
                        cols = 2;
                    else
                        cols = 3;
                }
            }
            if(cols === 1){
                if(widgetHeight > 1 && noOfItems <= 2)
                    data.showComparision = true;
                else
                data.showComparision = false;
            }
            else
                data.showComparision = true;
        };

        $scope.calculateSummaryHeight = function(widgetHeight,noOfItems) {
            var heightPercent;
            if(noOfItems==1 && widgetHeight ==1)
                    heightPercent = 20;
                else
                    heightPercent = 100 / widgetHeight;
                return {'height': (heightPercent + '%')};
        };
        $scope.calculateSummaryHeightMoz = function(widgetHeight,noOfItems) {
            var heightPercent;
            if(widgetHeight ==1)
                heightPercent = 20;
            else
                heightPercent = 70 / widgetHeight;
            return {'height': (heightPercent + '%')};

        };
        $scope.calculateChartHeight = function(widgetHeight,noOfItems) {
            var heightPercent;
                if(noOfItems==1 && widgetHeight ==1)
                    heightPercent = 80;
                else
                    heightPercent = 100-(100/widgetHeight);
                return {'height':(heightPercent+'%')};
        };

    };

    $scope.getActionType=function(actionType,widgetID){
        if(actionType.length) {
            var key;
            var name;

            var finalList=[]
            $scope.actionTypeEnable[widgetID] = true;
            for(var i=0;i<actionType.length;i++){
                var list={}
                key=actionType[i];
                name=key.replace('_',' ')
                list.name=name;
                list.meta=actionType[i];
                finalList.push(list);
            }
            $scope.actionTypeList = finalList;
        }
        else {
            $scope.actionTypeEnable[widgetID]=false;
            $scope.messageEnable[widgetID]=true;
        }
    };

    $scope.saveMeta=function(widgetId,meta){
        if(meta) $scope.submitEnable[widgetId]=true;
        else $scope.submitEnable[widgetId]=false;
    };

    $scope.reloadDashboard=function(widgetId,meta){
        $scope.actionTypeEnable[widgetId]=false;
        $scope.submitEnable[widgetId]=false;
        var dataUrl = {
            method: 'GET',
            url: '/api/v1/widget/'+ widgetId + '?meta=' +meta.meta
        };
        $http(dataUrl).then(
            function successCallback() {
                $rootScope.populateDashboardWidgets();
            },
            function errorCallback() {
                swal({
                    title: '',
                    text: '<span style = "sweetAlertFont">Error in saving the configuration. Please try again</span>',
                    html: true
                });
            }
        )
    };

    //To populate all the widgets in a dashboard when the dashboard is refreshed or opened or calendar date range in the dashboard header is changed
    $rootScope.populateDashboardWidgets = function() {

        $(".navbar").css('z-index','1');
        $(".md-overlay").css("background","rgba(0,0,0,0.5)");

        isExportOptionSet=0;

        $scope.dashboard.widgets = [];
        $scope.dashboard.widgetData = [];
        $http({
            method: 'GET',
            url: '/api/v1/dashboards/widgets/'+ $state.params.id
        })
            .then(
                function successCallback(response) {
                    var widgets = [];
                    var dashboardWidgetList = [];
                    var initialWidgetList = response.data.widgetsList;
                    for(getWidgetInfo in initialWidgetList){
                        if(initialWidgetList[getWidgetInfo].visibility == true)
                            dashboardWidgetList.push(initialWidgetList[getWidgetInfo]);
                    }
                    if(dashboardWidgetList.length > 0) {
                        $scope.loadedWidgetCount = 0;
                        $scope.widgetsPresent = true;
                    }
                    else
                        $scope.widgetsPresent = false;
                    var widgetID=0;
                    var dashboardWidgets = [];
                    for(var getWidgetInfo in dashboardWidgetList){
                        dashboardWidgets.push(createWidgets.widgetHandler(dashboardWidgetList[getWidgetInfo],{
                            'startDate': moment($scope.dashboardCalendar.start_date).format('YYYY-MM-DD'),
                            'endDate': moment($scope.dashboardCalendar.end_date).format('YYYY-MM-DD')
                        }));
                        $scope.dashboard.widgets.push({
                            'row': (typeof dashboardWidgetList[getWidgetInfo].row != 'undefined'? dashboardWidgetList[getWidgetInfo].row : 0),
                            'col': (typeof dashboardWidgetList[getWidgetInfo].col != 'undefined'? dashboardWidgetList[getWidgetInfo].col : 0),
                            'sizeY': (typeof dashboardWidgetList[getWidgetInfo].size != 'undefined'? dashboardWidgetList[getWidgetInfo].size.h : 2),
                            'sizeX': (typeof dashboardWidgetList[getWidgetInfo].size != 'undefined'? dashboardWidgetList[getWidgetInfo].size.w : 2),
                            'minSizeY': (typeof dashboardWidgetList[getWidgetInfo].minSize != 'undefined'? dashboardWidgetList[getWidgetInfo].minSize.h : 1),
                            'minSizeX': (typeof dashboardWidgetList[getWidgetInfo].minSize != 'undefined'? dashboardWidgetList[getWidgetInfo].minSize.w : 1),
                            'maxSizeY': (typeof dashboardWidgetList[getWidgetInfo].maxSize != 'undefined'? dashboardWidgetList[getWidgetInfo].maxSize.h : 3),
                            'maxSizeX': (typeof dashboardWidgetList[getWidgetInfo].maxSize != 'undefined'? dashboardWidgetList[getWidgetInfo].maxSize.w : 3),
                            'name': (typeof dashboardWidgetList[getWidgetInfo].name != 'undefined'? dashboardWidgetList[getWidgetInfo].name : ''),
                            'widgetType': (typeof dashboardWidgetList[getWidgetInfo].widgetType != 'undefined'? dashboardWidgetList[getWidgetInfo].widgetType : ''),
                            'isAlert':(typeof dashboardWidgetList[getWidgetInfo].isAlert != 'undefined'? dashboardWidgetList[getWidgetInfo].isAlert : false),
                            'id': dashboardWidgetList[getWidgetInfo]._id,
                            'visibility': false,
                            'channelName':(typeof dashboardWidgetList[getWidgetInfo].channelName != 'undefined'? dashboardWidgetList[getWidgetInfo].channelName : '')
                        });
                        $scope.dashboard.widgetData.push({
                            'id':  dashboardWidgetList[getWidgetInfo]._id,
                            'chart': [],
                            'visibility': false,
                            'dataerror':false,
                            'name': (typeof dashboardWidgetList[getWidgetInfo].name != 'undefined'? dashboardWidgetList[getWidgetInfo].name : ''),
                            'color': (typeof dashboardWidgetList[getWidgetInfo].color != 'undefined'? dashboardWidgetList[getWidgetInfo].color : '')
                        });
                        dashboardWidgets[getWidgetInfo].then(
                            function successCallback(dashboardWidgets) {
                                var widgetIndex = $scope.dashboard.widgets.map(function(el) {return el.id;}).indexOf(dashboardWidgets.id);
                                $scope.dashboard.widgetData[widgetIndex] = dashboardWidgets;
                                isExportOptionSet=1;
                                $scope.loadedWidgetCount++;
                            },
                            function errorCallback(error){
                                if(error.status === 401) {
                                    if (error.data.errorstatusCode === 1003) {
                                        k = $scope.dashboard.widgetData.map(function(e) { return e.id; }).indexOf(error.data.id);
                                        if(k !== -1 ){
                                            $scope.dashboard.widgetData[k].dataerror=true;
                                        }
                                        $("#widgetData-"+error.data.id).hide();
                                        $("#errorWidgetData-"+error.data.id).hide();
                                        $("#errorWidgetTokenexpire-" + error.data.id).show();
                                        $scope.widgetErrorCode=1;
                                        $scope.loadedWidgetCount++;
                                        isExportOptionSet = 0;
                                    }
                                }else{
                                    $scope.loadedWidgetCount++;
                                    if(typeof error.data.id != 'undefined') {
                                        $("#widgetData-"+error.data.id).hide();
                                        $("#errorWidgetData-"+error.data.id).show();
                                        $("#errorWidgetTokenexpire-" + error.data.id).hide();
                                        isExportOptionSet=0;
                                    }
                                }
                            }
                        );
                    }
                },
                function errorCallback(error) {
                    swal({
                        title: '',
                        text: '<span style = "sweetAlertFont">Error in populating widgets! Please refresh the dashboard again</span>',
                        html: true
                    });
                    isExportOptionSet=0;
                }
            );
    };

    //To catch a request for a new widget creation and create the dashboard in the frontend
    $scope.$on('populateWidget', function(e,widget){
        var inputWidget = [];
        inputWidget.push(createWidgets.widgetHandler(widget,{
            'startDate': moment($scope.dashboardCalendar.start_date).format('YYYY-MM-DD'),
            'endDate': moment($scope.dashboardCalendar.end_date).format('YYYY-MM-DD')
        }));

        $scope.widgetsPresent = true;

        //To temporarily create an empty widget with same id as the widgetId till all the data required for the widget is fetched by the called service
        $scope.dashboard.widgets.push({
            'row': (typeof widget.row != 'undefined'? widget.row : 0),
            'col': (typeof widget.col != 'undefined'? widget.col : 0),
            'sizeY': (typeof widget.size != 'undefined'? widget.size.h : 2),
            'sizeX': (typeof widget.size != 'undefined'? widget.size.w : 2),
            'minSizeY': (typeof widget.minSize != 'undefined'? widget.minSize.h : 1),
            'minSizeX': (typeof widget.minSize != 'undefined'? widget.minSize.w : 1),
            'maxSizeY': (typeof widget.maxSize != 'undefined'? widget.maxSize.h : 3),
            'maxSizeX': (typeof widget.maxSize != 'undefined'? widget.maxSize.w : 3),
            'name': (typeof widget.name != 'undefined'? widget.name : ''),
            'widgetType':(typeof widget.widgetType != 'undefined'? widget.widgetType : ''),
            'isAlert':(typeof widget.isAlert != 'undefined'? widget.isAlert : false),
            'id': widget._id,
            //'chart': {'api': {}},
            'visibility': false,
            'channelName':(typeof widget.channelName != 'undefined'? widget.channelName : '')
        });
        $scope.dashboard.widgetData.push({
            'id':  widget._id,
            'chart': [],
            'visibility': false,
            'name': (typeof widget.name != 'undefined'? widget.name : ''),
            'color': (typeof widget.color != 'undefined'? widget.color : '')
        });

        //Fetching the promise that contains all the data for all the widgets in the dashboard
        $q.all(inputWidget).then(
            function successCallback(inputWidget){
                $scope.loadedWidgetCount++;
                var widgetIndex = $scope.dashboard.widgets.map(function(el) {return el.id;}).indexOf(inputWidget[0].id);
                $scope.dashboard.widgetData[widgetIndex] = inputWidget[0];
                isExportOptionSet=1;
            },
            function errorCallback(error){
                if(error.status === 401) {
                    if (error.data.errorstatusCode === 1003) {
                        k = $scope.dashboard.widgetData.map(function(e) { return e.id; }).indexOf(error.data.id);
                        if(k !== -1 ){
                            $scope.dashboard.widgetData[k].dataerror=true;
                        }
                        $("#widgetData-" + widget._id).hide();
                        $("#errorWidgetData-" + widget._id).hide();
                        $("#errorWidgetTokenexpire-" + widget._id).show();
                        $scope.widgetErrorCode=1;
                        $scope.loadedWidgetCount++;
                        isExportOptionSet = 0;
                    }
                } else{
                    $("#widgetData-" + widget._id).hide();
                    $("#errorWidgetData-" + widget._id).show();
                    $("#errorWidgetTokenexpire-" + widget._id).hide()
                    $scope.loadedWidgetCount++;
                    isExportOptionSet = 0;
                }
            }
        );
    });

    //To download a pdf/jpeg version of the dashboard
    $scope.exportModal = function(val){
        $rootScope.expObj = $scope.dashboard;
        $state.go(val);
    };

    //To delete a widget from the dashboard
    $scope.removeWid = function (widget) {
        $scope.dashboard.widgets.splice($scope.dashboard.widgets.indexOf(widget), 1);
    };

    $scope.deleteWidget = function(widget){
        var widgetType = widget.widgetType;
        var widgetId = widget.id;
        $http({
            method:'POST',
            url:'/api/v1/delete/widgets/' + widget.id
        }).then(
            function successCallback(response){
                if(widgetType != 'customFusion') {
                    $scope.loadedWidgetCount--;
                    for(var items in $scope.dashboard.widgetData) {
                        if($scope.dashboard.widgetData[items].id == widgetId)
                            $scope.dashboard.widgetData.splice(items,1);
                    }
                    if($scope.dashboard.widgets.length == 0)
                        $scope.widgetsPresent = false;
                }
                else {
                    $rootScope.populateDashboardWidgets();
                }
            },
            function errorCallback(error){
                swal({
                    title: '',
                    text: '<span style = "sweetAlertFont">Error in deleting the widget! Please try again</span>',
                    html: true
                });
            }
        );
    };

    //To create alerts
    $scope.alertModal = function(value,widget){
        $rootScope.selectedWidget = widget;
        $state.go(value);
    };

    $scope.reArrangeWidgets = function(){
        $(".navbar").css('z-index','1');
        $(".md-overlay").css("background","rgba(0,0,0,0.5)");
        isExportOptionSet=0;

        $scope.gridsterOptions.autogenerate_stylesheet = true;
        var tempWidgetList = $scope.dashboard.widgets;
        var tempWidgetDataList = $scope.dashboard.widgetData;
        $scope.dashboard.widgets = [];
        $scope.dashboard.widgetData = [];

        for(var getWidgetInfo in tempWidgetList) {
            $scope.dashboard.widgets.push({
                'sizeY': (typeof tempWidgetList[getWidgetInfo].sizeY != 'undefined'? tempWidgetList[getWidgetInfo].sizeY : 2),
                'sizeX': (typeof tempWidgetList[getWidgetInfo].sizeX != 'undefined'? tempWidgetList[getWidgetInfo].sizeX : 2),
                'minSizeY': (typeof tempWidgetList[getWidgetInfo].minSizeY != 'undefined'? tempWidgetList[getWidgetInfo].minSizeY : 1),
                'minSizeX': (typeof tempWidgetList[getWidgetInfo].minSizeX != 'undefined'? tempWidgetList[getWidgetInfo].minSizeX : 1),
                'maxSizeY': (typeof tempWidgetList[getWidgetInfo].maxSizeY != 'undefined'? tempWidgetList[getWidgetInfo].maxSizeY : 3),
                'maxSizeX': (typeof tempWidgetList[getWidgetInfo].maxSizeX != 'undefined'? tempWidgetList[getWidgetInfo].maxSizeX : 3),
                'name': (typeof tempWidgetList[getWidgetInfo].name != 'undefined'? tempWidgetList[getWidgetInfo].name : ''),
                'widgetType': (typeof tempWidgetList[getWidgetInfo].widgetType != 'undefined'? tempWidgetList[getWidgetInfo].widgetType : ''),
                'isAlert':(typeof tempWidgetList[getWidgetInfo].isAlert != 'undefined'? tempWidgetList[getWidgetInfo].isAlert : false),
                'id': tempWidgetList[getWidgetInfo].id,
                'visibility': false,
                'channelName': (typeof tempWidgetList[getWidgetInfo].channelName != 'undefined'? tempWidgetList[getWidgetInfo].channelName : '')
            });
            $scope.dashboard.widgetData.push(tempWidgetDataList[getWidgetInfo]);
        }
        $scope.autoArrangeGrid = false;
        $scope.gridsterOptions.autogenerate_stylesheet = false;
        isExportOptionSet=1;
        $rootScope.$broadcast('storeGridStructure',{});
    };

    //To delete the dashboard
    $scope.deleteDashboard = function(){
        swal({
                title: "Confirm Delete?",
                text: "Dashboard and all its contents will be removed",
                type: "warning",
                showCancelButton: true,
                confirmButtonColor: "#DD6B55",
                confirmButtonText: "Confirm",
                closeOnConfirm: true
            },
            function () {
                $http({
                    method: 'POST',
                    url: '/api/v1/delete/userDashboards/' + $state.params.id
                }).then(
                    function successCallback(response) {
                        $state.go('app.reporting.dashboards');
                    },
                    function errorCallback(error) {
                        swal({
                            title: "",
                            text: "<span style='sweetAlertFont'>Unable to delete dashboard.Please try again</span> .",
                            html: true
                        });
                    }
                );
            }
        );
    };

    $scope.setAutoArrange = function () {
        $scope.autoArrangeGrid = true;
        $scope.reArrangeWidgets();
    };

    $scope.showSettings=function(id) {
        var dropDwn = "settingsDropdown-"+id;
        document.getElementById(String(dropDwn)).classList.toggle("shw");
    }
    $scope.toggleLegends = function (widgetId) {
        for(var widgetData in $scope.dashboard.widgetData) {
            if($scope.dashboard.widgetData[widgetData].id == widgetId) {
                for(var chart in $scope.dashboard.widgetData[widgetData].chart) {
                    if(typeof $scope.dashboard.widgetData[widgetData].chart[chart].options.chart.showLegend != 'undefined') {
                        if($scope.dashboard.widgetData[widgetData].chart[chart].options.chart.showLegend == true)
                            $scope.dashboard.widgetData[widgetData].chart[chart].options.chart.showLegend = false;
                        else
                            $scope.dashboard.widgetData[widgetData].chart[chart].options.chart.showLegend = true;
                    }
                }
            }
        }
    };

    var count =0;
    var color = '#F53F72';
    var size = '30px';
    var existCommentCheck = "";
    var existXaxis = "";
    var existYaxis = "";

    $(".exportModalContent").on( 'click', function( ev ) {
        if(isExportOptionSet==1){
            $(".navbar").css('z-index','1');
            $(".md-overlay").css("background","rgba(0,0,0,0.5)");
            $("#exportModalContent").addClass('md-show');
        }
        else{
            $(".navbar").css('z-index','1');
            $(".md-overlay").css("background","rgba(0,0,0,0.5)");
            $("#waitForWidgetsLoadModalContent").addClass('md-show');
        }
    });

    $('#exportOptionJpeg').change(function() {
        $(".errorExportMessage").text("").hide();
    });

    $('#exportOptionPDF').change(function() {
        $(".errorExportMessage").text("").hide();
    });

    /*
     $rootScope.$on("getDashboardCommentsFunc", function(getValue){
     $scope.getDashboardComments(getValue);
     });

     $scope.getDashboardComments = function(){
     console.log("get dashboard comments from database");
     /!*
     count = 0;
     var getCommentArr = '[{"Comment":"test 1","DashboardId":"571f2875c761262c0c0db9c8","WidgetId":"5755151332719ba202f3412e","xAxis":"20%","yAxis":"44%"},{"Comment":"test 2","DashboardId":"571f2875c761262c0c0db9c8","WidgetId":"5755122732719ba202f34068","xAxis":"36%","yAxis":"67%"},{"Comment":"test 3","DashboardId":"571f2875c761262c0c0db9c8","WidgetId":"5755011b32719ba202f33fc2","xAxis":"56%","yAxis":"67%"}]';
     console.log(JSON.parse(getCommentArr));
     var jsonData = JSON.parse(getCommentArr);

     for(getData in jsonData){
     count++;
     $("#widgetTransparentImage-"+jsonData[getData].WidgetId).append($('<div class="commentPoint" id="commentPoint-'+count+'" ref="'+jsonData[getData].WidgetId+'" style="color: #ffffff;"><span class="countComment">'+count+'</span><input type="hidden" id="hiddenComment-'+count+'" value="'+jsonData[getData].Comment+'" /> <input type="hidden" id="hiddenXaxis-'+count+'" value="'+jsonData[getData].xAxis+'" /> <input type="hidden" id="hiddenYaxis-'+count+'" value="'+jsonData[getData].yAxis+'" /> </div></div>')
     .css('position', 'absolute')
     .css('top', jsonData[getData].yAxis)
     .css('left', jsonData[getData].xAxis)
     .css('width', size)
     .css('height', size)
     .css('border-radius', '25px')
     .css('background-color', color)
     .css('cursor', 'pointer')
     .css('z-index', '2')
     );

     }

     $(".commentPoint").on('click',function () {
     console.log("exist commentPoint called");

     var countValue = this.id.replace('commentPoint-','');
     var hiddenComment = $("#hiddenComment-"+countValue).val();
     var widgetID = $("#commentPoint-"+countValue).attr('ref');
     var xAxis = $("#hiddenXaxis-"+countValue).val();
     var yAxis = $("#hiddenYaxis-"+countValue).val();
     existCommentCheck = countValue;

     $(".navbar").css('z-index','1');
     $(".md-overlay").css("background","rgba(0,0,0,0.5)");
     $("#commentModalContent").addClass('md-show');
     $(".successImage").hide();
     $(".commentHeadText").text('Leave a Comment - '+countValue).css('font-style','italic');
     $(".commentMessage").hide();
     $(".closeModalContent").hide();
     $("#inputTextArea").show().val(hiddenComment);
     $(".cancelModalContent").show().text('Delete');
     $(".sendCommentModalContent").show().text('Update');

     $("#inputTextArea").keyup(function () {
     var comment = $("#inputTextArea").val();
     if(comment==""){
     $(".commentMessage").text('* Enter the Comment !!!').show().css('color','red');
     }
     else{
     $(".commentMessage").text('').hide();
     }
     });

     $(".cancelModalContent").off('click').on('click', function() {
     deleteComment();
     });


     $(".sendCommentModalContent").off('click').on('click', function() {
     updateDashBoardComment();
     });


     function updateDashBoardComment(){
     var comment = $("#inputTextArea").val();

     if(comment==""){
     $(".commentMessage").text('* Enter the Comment !!!').show().css('color','red');
     return false;
     }
     else{
     var dashboardId = $state.params.id;

     var dataForm = '{"Comment":"'+comment+'","DashboardId":"'+dashboardId+'","WidgetId":"'+widgetID+'","xAxis":"'+xAxis+'","yAxis":"'+yAxis+'"}';
     console.log(dataForm);
     existCommentCheck="";
     $("#errorCommentMessage").text('').hide();
     $("#commentModalContent").removeClass('md-show');
     $(".md-overlay").css("background","rgba(0,0,0,0.5)");
     $("#commentModalContent").addClass('md-show');
     $(".successImage").show().attr("src","/image/success.png");
     $(".commentHeadText").html('Updated!').css('font-style','normal');
     $(".commentMessage").text('Your comment has been updated sucessfully').show().css('color','');
     $("#inputTextArea").hide();
     $(".cancelModalContent").hide();
     $(".sendCommentModalContent").hide();
     $(".closeModalContent").show();

     $(".closeModalContent").on('click',function () {
     $(".successImage").hide();
     $("#commentModalContent").removeClass('md-show');
     });

     }

     }


     function deleteComment(){
     $("#commentPoint-"+countValue).remove();

     $("#commentModalContent").removeClass('md-show');
     $(".md-overlay").css("background","rgba(0,0,0,0.5)");
     $("#commentModalContent").addClass('md-show');
     $(".successImage").show();
     $(".commentHeadText").html('Deleted!').css('font-style','normal');
     $(".successImage").show().attr("src","/image/success.png");
     $(".commentMessage").text('Your comment has been deleted successfully').show().css('color','');
     $("#inputTextArea").hide();
     $(".cancelModalContent").hide();
     $(".sendCommentModalContent").hide();
     $(".closeModalContent").show();
     existCommentCheck="";

     $(".closeModalContent").on('click',function () {
     $(".successImage").hide();
     $("#commentModalContent").removeClass('md-show');
     });
     }

     });
     *!/
     };

     $scope.callThePosition = function (event,widgetID){
     console.log(existCommentCheck+" != "+count);
     if(existCommentCheck==""){
     console.log("callThePosition called");
     var dialog, form;
     var x = event.x;
     var y = event.y;
     var offsetX = event.offsetX;
     var offsetY = event.offsetY;
     var contentWidth = $("#page-wrapper").width();
     count++;

     var $this = $("#widgetTransparentImage-"+widgetID), offset = $this.offset(),
     width = $this.innerWidth(), height = $this.innerHeight();
     var parentOffset = $this.offset();
     var posX = $("#widgetTransparentImage-"+widgetID).offset().left, posY = $("#widgetTransparentImage-"+widgetID).offset().top;

     var x = event.pageX-posX;
     x = parseInt(x/width*100,10);
     x = x<0?0:x;
     x = x>100?100:x;
     var y = event.pageY-posY;
     y = parseInt(y/height*100,10);
     y = y<0?0:y;
     y = y>100?100:y;
     console.log(x+'% '+y+'%');

     $("#widgetTransparentImage-"+widgetID).append($('<div class="commentPoint" id="commentPoint-'+count+'" style="color: #ffffff;"><span class="countComment">'+count+'</span></div></div>')
     .css('position', 'absolute')
     .css('top', y + '%')
     .css('left', x + '%')
     .css('width', size)
     .css('height', size)
     .css('border-radius', '25px')
     .css('background-color', color)
     );


     $(".navbar").css('z-index','1');
     $(".md-overlay").css("background","rgba(0,0,0,0.5)");
     $("#commentModalContent").addClass('md-show');
     $(".successImage").hide();
     $(".commentHeadText").text('Leave a Comment - '+count).css('font-style','italic');
     $(".commentMessage").hide();
     $(".closeModalContent").hide();
     $("#inputTextArea").show().val('');
     $(".cancelModalContent").show().text('Cancel');
     $(".sendCommentModalContent").show().text('Send');

     $("#inputTextArea").keyup(function () {
     var comment = $("#inputTextArea").val();
     if(comment==""){
     $(".commentMessage").text('* Enter the Comment !!!').show().css('color','red');
     }
     else{
     $(".commentMessage").text('').hide();
     }
     });

     $(".cancelModalContent").off('click').on('click', function() {
     errorComment();
     });


     $(".sendCommentModalContent").off('click').on('click', function() {
     addDashBoardComment();
     });


     function addDashBoardComment(){
     var comment = $("#inputTextArea").val();

     if(comment==""){
     $(".commentMessage").text('* Enter the Comment !!!').show().css('color','red');
     return false;
     }
     else{
     var dashboardId = $state.params.id;

     var dataForm = '{"Comment":"'+comment+'","DashboardId":"'+dashboardId+'","WidgetId":"'+widgetID+'","xAxis":"'+x+'%","yAxis":"'+y+'%"}';
     console.log(dataForm);

     /!*
     Send JSON data to the database for CreateComment
     $http({
     method: 'POST', url: '/api/v1/create/dashboardComment', data: dataForm
     }).then(function successCallback(response){
     console.log(response);
     $("#errorCommentMessage").text('').hide();
     $("#commentModalContent").removeClass('md-show');
     $(".md-overlay").css("background","rgba(0,0,0,0.5)");
     $("#commentModalContent").addClass('md-show');
     $(".successImage").show().attr("src","/image/success.png");
     $(".commentHeadText").html('Submitted!').css('font-style','normal');
     $(".commentMessage").text('Your comment has been posted sucessfully').show().css('color','');
     $("#inputTextArea").hide();
     $(".cancelModalContent").hide();
     $(".sendCommentModalContent").hide();
     $(".closeModalContent").show();

     $(".closeModalContent").on('click',function () {
     $(".successImage").hide();
     $("#commentModalContent").removeClass('md-show');
     });

     }, function errorCallback (error){
     console.log('Error in creating dashboard comment post',error);
     errorComment();

     });
     *!/

     $("#errorCommentMessage").text('').hide();
     $("#commentModalContent").removeClass('md-show');
     $(".md-overlay").css("background","rgba(0,0,0,0.5)");
     $("#commentModalContent").addClass('md-show');
     $(".successImage").show().attr("src","/image/success.png");
     $(".commentHeadText").html('Submitted!').css('font-style','normal');
     $(".commentMessage").text('Your comment has been posted sucessfully.').show().css('color','');
     $("#inputTextArea").hide();
     $(".cancelModalContent").hide();
     $(".sendCommentModalContent").hide();
     $(".closeModalContent").show();

     $(".closeModalContent").on('click',function () {
     $(".successImage").hide();
     $("#commentModalContent").removeClass('md-show');
     });

     }
     }

     function errorComment(){
     $("#commentPoint-"+count).remove();
     count--;
     $("#commentModalContent").removeClass('md-show');
     $(".md-overlay").css("background","rgba(0,0,0,0.5)");
     $("#commentModalContent").addClass('md-show');
     $(".commentHeadText").html('Comment').css('font-style','normal');
     $(".successImage").show().attr("src","/image/error.png");
     $(".commentMessage").text('Your comment is not posted').show();
     $("#inputTextArea").hide();
     $(".cancelModalContent").hide();
     $(".sendCommentModalContent").hide();
     $(".closeModalContent").show();

     $(".closeModalContent").on('click',function () {
     $(".successImage").hide();
     $("#commentModalContent").removeClass('md-show');
     });
     }
     }

     }; // callThePosition

     $scope.closeCommentMode = function () {
     count=0;
     $(".commentPoint").html("");
     $(".context").removeClass("commentPoint");
     $rootScope.tempDashboard=true;
     $rootScope.$emit("CallSwitchChangeFunc", {value:0});
     };
     */

}
