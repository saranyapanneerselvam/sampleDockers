showMetricApp.controller('SharedDashboardController',SharedDashboardController);

function SharedDashboardController($scope,$timeout,$rootScope,$http,$window,$state,$stateParams,createWidgets,$q) {
    var dashboardId;
    $scope.loading=false;
    $scope.$window = $window;
    $scope.autoArrangeGrid = false;

    //Sets up all the required parameters for the dashboard to function properly when it is initially loaded. This is called in the ng-init function of the dashboard template
    $scope.dashboardConfiguration = function () {

        //Defining configuration parameters for dashboard layout
        $scope.dashboard = { widgets: [], widgetData: [] };
        $scope.dashboard.dashboardName = '';
        $scope.widgetsPresent = false;
        $scope.loadedWidgetCount = 0;
        $scope.populateDashboardWidgets();



        //To define the calendar in dashboard header
        $scope.dashboardCalendar = new Calendar({
            element: $('.daterange--double').attr( 'readOnly' , 'true' ),
            earliest_date: moment(new Date()).subtract(365,'days'),
            latest_date: new Date(),
            start_date: moment(new Date()).subtract(30,'days'),
            end_date: new Date(),
            callback: function() {
                var start = moment(this.start_date).format('ll'), end = moment(this.end_date).format('ll');
                $scope.populateDashboardWidgets();
            }
        });

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
                enabled: false
            },
            outerMargin: true, // whether margins apply to outer edges of the grid
            mobileBreakPoint: 700,
            mobileModeEnabled: true, // whether or not to toggle mobile mode when screen width is less than mobileBreakPoint
            resizable: {
                enabled: false
            }
        };

        $scope.$on('gridster-resized', function(sizes, gridster) {
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

        $scope.calculateColumnWidth = function(x) {

            if(x<=2)
                return ('col-sm-'+12+' col-md-'+12+' col-lg-'+12);
            else if(x>2 && x<=4)
                return ('col-sm-'+6+' col-md-'+6+' col-lg-'+6);
            else
                return ('col-sm-'+4+' col-md-'+4+' col-lg-'+4);
        };

        $scope.calculateRowHeight = function(availableHeight,noOfItems) {

            var cols;
            if(noOfItems<=2)
                cols = 1;
            else if(noOfItems>2 && noOfItems<=4)
                cols = 2;
            else
                cols = 3;

            //var cols = $window.innerWidth>=768 ? 2 : 1;
            var rows = Math.ceil(noOfItems/cols);
            var heightPercent = 100/rows;
            var fontSizeEm = availableHeight/100*4.5;
            var minSize = 0.8, maxSize=1.5;
            if(fontSizeEm<minSize)
                fontSizeEm=minSize;
            if(fontSizeEm>maxSize)
                fontSizeEm=maxSize;
            return {'height':(heightPercent+'%'),'font-size':(fontSizeEm+'em')};
        };
    };

    //To populate all the widgets in a dashboard when the dashboard is refreshed or opened or calendar date range in the dashboard header is changed
    $rootScope.populateDashboardWidgets = function() {
        $scope.dashboard.widgets = [];
        $scope.dashboard.widgetData = [];
        $http({
            method: 'GET',
            url: '/api/v1/dashboards/widgets/'+ null,
            params: {reportId:$state.params.id}
        })
            .then(
                function successCallback(response) {
                    if(!response.data){
                        $state.go('error');
                    }
                    else dashboardId = response.data.widgetsList._id;



                    $scope.dashboard.dashboardName = response.data.dashboardDetails.name


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




                    $scope.fetchDashboardName = function () {
                        $http({
                            method: 'GET', url: '/api/v1/get/dashboards/'+ dashboardId
                        }).then(function successCallback(response) {
                            console.log("dashboard response",response)


                            $scope.dashboard.dashboardName =  response.data.data.name;
                        }, function errorCallback(error) {
                            $scope.dashboard.dashboardName =   null;
                        });
                    };
                    $scope.fetchDashboardName();






                    for(var getWidgetInfo in dashboardWidgetList){
                        dashboardWidgets.push(createWidgets.widgetHandler(dashboardWidgetList[getWidgetInfo],{
                            'startDate': moment($scope.dashboardCalendar.start_date).format('YYYY-MM-DD'),
                            'endDate': moment($scope.dashboardCalendar.end_date).format('YYYY-MM-DD')
                        },'public'));

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
                                $scope.loadedWidgetCount++;
                                if(typeof error.data.id != 'undefined') {
                                    $("#widgetData-"+error.data.id).hide();
                                    $("#errorWidgetData-"+error.data.id).show();
                                    isExportOptionSet=0;
                                }
                                swal({
                                    title: '',
                                    text: '<span style = "sweetAlertFont">Error in populating widgets! Please refresh the dashboard again</span>',
                                    html: true
                                });
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
}
