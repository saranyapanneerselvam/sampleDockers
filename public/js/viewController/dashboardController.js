showMetricApp.controller('DashboardController',DashboardController)

function DashboardController($scope,$timeout,$rootScope,$http,$window,$state,$stateParams,createWidgets,$q) {

    $scope.widgetLayoutOptions = [
        {W:1,H:1,N:1,r:1,c:1},
        {W:1,H:1,N:2,r:2,c:1},
        {W:1,H:1,N:3,r:3,c:1},
        {W:1,H:1,N:4,r:4,c:1},
        {W:1,H:1,N:5,r:5,c:1},
        {W:1,H:1,N:6,r:6,c:1},
        {W:1,H:1,N:7,r:7,c:1},
        {W:1,H:1,N:8,r:8,c:1},

        {W:2,H:1,N:1,r:1,c:1},
        {W:2,H:1,N:2,r:1,c:2},
        {W:2,H:1,N:3,r:2,c:1},
        {W:2,H:1,N:4,r:2,c:2},
        {W:2,H:1,N:5,r:2,c:3},
        {W:2,H:1,N:6,r:2,c:3},
        {W:2,H:1,N:7,r:3,c:3},
        {W:2,H:1,N:8,r:3,c:3},

        {W:3,H:1,N:1,r:1,c:1},
        {W:3,H:1,N:2,r:1,c:2},
        {W:3,H:1,N:3,r:1,c:3},
        {W:3,H:1,N:4,r:2,c:2},
        {W:3,H:1,N:5,r:2,c:3},
        {W:3,H:1,N:6,r:2,c:3},
        {W:3,H:1,N:7,r:3,c:3},
        {W:3,H:1,N:8,r:3,c:3},

        {W:4,H:1,N:1,r:1,c:1},
        {W:4,H:1,N:2,r:1,c:2},
        {W:4,H:1,N:3,r:1,c:3},
        {W:4,H:1,N:4,r:1,c:4},
        {W:4,H:1,N:5,r:2,c:3},
        {W:4,H:1,N:6,r:2,c:3},
        {W:4,H:1,N:7,r:3,c:3},
        {W:4,H:1,N:8,r:3,c:3},

        {W:5,H:1,N:1,r:1,c:1},
        {W:5,H:1,N:2,r:1,c:2},
        {W:5,H:1,N:3,r:1,c:3},
        {W:5,H:1,N:4,r:1,c:4},
        {W:5,H:1,N:5,r:1,c:5},
        {W:5,H:1,N:6,r:2,c:3},
        {W:5,H:1,N:7,r:2,c:4},
        {W:5,H:1,N:8,r:2,c:4},

        {W:6,H:1,N:1,r:1,c:1},
        {W:6,H:1,N:2,r:1,c:2},
        {W:6,H:1,N:3,r:1,c:3},
        {W:6,H:1,N:4,r:1,c:4},
        {W:6,H:1,N:5,r:1,c:5},
        {W:6,H:1,N:6,r:2,c:3},
        {W:6,H:1,N:7,r:2,c:4},
        {W:6,H:1,N:8,r:2,c:4},

        {W:1,H:2,N:1,r:1,c:1},
        {W:1,H:2,N:2,r:2,c:1},
        {W:1,H:2,N:3,r:3,c:1},
        {W:1,H:2,N:4,r:4,c:1},
        {W:1,H:2,N:5,r:5,c:1},
        {W:1,H:2,N:6,r:6,c:1},
        {W:1,H:2,N:7,r:7,c:1},
        {W:1,H:2,N:8,r:8,c:1},

        {W:2,H:2,N:1,r:1,c:1},
        {W:2,H:2,N:2,r:1,c:2},
        {W:2,H:2,N:3,r:2,c:2},
        {W:2,H:2,N:4,r:2,c:2},
        {W:2,H:2,N:5,r:3,c:2},
        {W:2,H:2,N:6,r:3,c:2},
        {W:2,H:2,N:7,r:4,c:2},
        {W:2,H:2,N:8,r:4,c:2},

        {W:3,H:2,N:1,r:1,c:1},
        {W:3,H:2,N:2,r:1,c:2},
        {W:3,H:2,N:3,r:2,c:2},
        {W:3,H:2,N:4,r:2,c:2},
        {W:3,H:2,N:5,r:2,c:3},
        {W:3,H:2,N:6,r:2,c:3},
        {W:3,H:2,N:7,r:2,c:4},
        {W:3,H:2,N:8,r:2,c:4},

        {W:4,H:2,N:1,r:1,c:1},
        {W:4,H:2,N:2,r:1,c:2},
        {W:4,H:2,N:3,r:1,c:3},
        {W:4,H:2,N:4,r:2,c:2},
        {W:4,H:2,N:5,r:2,c:3},
        {W:4,H:2,N:6,r:2,c:3},
        {W:4,H:2,N:7,r:2,c:4},
        {W:4,H:2,N:8,r:2,c:4},

        {W:5,H:2,N:1,r:1,c:1},
        {W:5,H:2,N:2,r:1,c:2},
        {W:5,H:2,N:3,r:1,c:3},
        {W:5,H:2,N:4,r:2,c:2},
        {W:5,H:2,N:5,r:2,c:3},
        {W:5,H:2,N:6,r:2,c:3},
        {W:5,H:2,N:7,r:2,c:4},
        {W:5,H:2,N:8,r:2,c:4},

        {W:6,H:2,N:1,r:1,c:1},
        {W:6,H:2,N:2,r:1,c:2},
        {W:6,H:2,N:3,r:1,c:3},
        {W:6,H:2,N:4,r:2,c:2},
        {W:6,H:2,N:5,r:2,c:3},
        {W:6,H:2,N:6,r:2,c:3},
        {W:6,H:2,N:7,r:2,c:4},
        {W:6,H:2,N:8,r:2,c:4},

        {W:1,H:3,N:1,r:1,c:1},
        {W:1,H:3,N:2,r:2,c:1},
        {W:1,H:3,N:3,r:3,c:1},
        {W:1,H:3,N:4,r:4,c:1},
        {W:1,H:3,N:5,r:5,c:1},
        {W:1,H:3,N:6,r:6,c:1},
        {W:1,H:3,N:7,r:7,c:1},
        {W:1,H:3,N:8,r:8,c:1},

        {W:2,H:3,N:1,r:1,c:1},
        {W:2,H:3,N:2,r:2,c:1},
        {W:2,H:3,N:3,r:3,c:1},
        {W:2,H:3,N:4,r:2,c:2},
        {W:2,H:3,N:5,r:3,c:2},
        {W:2,H:3,N:6,r:3,c:2},
        {W:2,H:3,N:7,r:4,c:2},
        {W:2,H:3,N:8,r:4,c:2},

        {W:3,H:3,N:1,r:1,c:1},
        {W:3,H:3,N:2,r:1,c:2},
        {W:3,H:3,N:3,r:2,c:2},
        {W:3,H:3,N:4,r:2,c:2},
        {W:3,H:3,N:5,r:2,c:3},
        {W:3,H:3,N:6,r:2,c:3},
        {W:3,H:3,N:7,r:2,c:4},
        {W:3,H:3,N:8,r:2,c:4},

        {W:4,H:3,N:1,r:1,c:1},
        {W:4,H:3,N:2,r:1,c:2},
        {W:4,H:3,N:3,r:1,c:3},
        {W:4,H:3,N:4,r:2,c:2},
        {W:4,H:3,N:5,r:2,c:3},
        {W:4,H:3,N:6,r:2,c:3},
        {W:4,H:3,N:7,r:2,c:4},
        {W:4,H:3,N:8,r:2,c:4},

        {W:5,H:3,N:1,r:1,c:1},
        {W:5,H:3,N:2,r:1,c:2},
        {W:5,H:3,N:3,r:1,c:3},
        {W:5,H:3,N:4,r:2,c:2},
        {W:5,H:3,N:5,r:2,c:3},
        {W:5,H:3,N:6,r:2,c:3},
        {W:5,H:3,N:7,r:2,c:4},
        {W:5,H:3,N:8,r:2,c:4},

        {W:6,H:3,N:1,r:1,c:1},
        {W:6,H:3,N:2,r:1,c:2},
        {W:6,H:3,N:3,r:1,c:3},
        {W:6,H:3,N:4,r:2,c:2},
        {W:6,H:3,N:5,r:2,c:3},
        {W:6,H:3,N:6,r:2,c:3},
        {W:6,H:3,N:7,r:2,c:4},
        {W:6,H:3,N:8,r:2,c:4}
    ];

    //Sets up all the required parameters for the dashboard to function properly when it is initially loaded. This is called in the ng-init function of the dashboard template
    $scope.dashboardConfiguration = function () {
        $scope.dashboardCalendar = new Calendar({
            element: $('.daterange--double'),
            earliest_date: moment(new Date()).subtract(365,'days'),
            latest_date: new Date(),
            start_date: moment(new Date()).subtract(30,'days'),
            end_date: new Date(),
            callback: function() {
                var start = moment(this.start_date).format('ll'),
                    end = moment(this.end_date).format('ll');
                $scope.populateDashboardWidgets();
                console.debug('controller Start Date: '+ start +'\n controller End Date: '+ end);
            }
        });

        //Defining configuration parameters for dashboard layout
        $scope.dashboard = {widgets: []};
        $scope.dashboard.dashboardName = '';

        //To fetch the name of the dashboard from database and display it when the dashboard is loaded
        $scope.fetchDashboardName = function () {
            $http({
                method: 'GET', url: '/api/v1/get/dashboards/'+ $state.params.id
            }).then(function successCallback(response) {
                $scope.dashboard.dashboardName =  response.data.data.name;
            }, function errorCallback(error) {
                console.log('Error in getting dashboard details',error);
                $scope.dashboard.dashboardName =   null;
            });
        };
        $scope.fetchDashboardName();

        //Function to change the name of the dashboard to user entered value
        $scope.changeDashboardName = function () {
            var jsonData = {
                dashboardId: $state.params.id,
                name: $scope.dashboard.dashboardName
            };
            $http({
                method: 'POST',
                url: '/api/v1/create/dashboards',
                data: jsonData
            }).then(function successCallback(response) {
                console.log('Dashboard Name updated successfully',response);
            }, function errorCallback(error) {
                console.log('Error in updating dashboard name',error);
            });
        };

        //Setting up grid configuration for widgets
        $scope.gridsterOptions = {
            margins: [10, 10],
            columns: 6,
            defaultSizeX: 2,
            defaultSizeY: 2,
            minSizeX: 1,
            minSizeY: 1,
            draggable: {
                enabled: true,
                handle: 'box-header'
            },
            outerMargin: true, // whether margins apply to outer edges of the grid
            mobileBreakPoint: 600,
            mobileModeEnabled: true, // whether or not to toggle mobile mode when screen width is less than mobileBreakPoint
            /*
             isMobile: false, // stacks the grid items if true
             */
            resizable: {
                enabled: true,
                handles: ['n', 'e', 's', 'w', 'ne', 'se', 'sw', 'nw'],
                start: function (event, $element, widget) {}, // optional callback fired when resize is started
                resize: function (event, $element, widget) {
/*
                    if (widget.chart.api){
                        widget.chart.api.update();
                        console.log('API triggered');
                    }
*/
                    for(var i=0;i<widget.chart.length;i++){
                        if (widget.chart[i].api){
                            widget.chart[i].api.update();
                        }
                    }
                }, // optional callback fired when item is resized,
                stop: function (event, $element, widget) {
                    $timeout(function () {
                        if (widget.chart.api)
                            widget.chart.api.update();}, 400)
                } // optional callback fired when item is finished resizing
            }
        };

        //subscribe widget on window resize event and sidebar resize event
        new ResizeSensor(document.getElementById('dashboardLayout'), function() {
            $scope.$broadcast('resize');
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
                    for(j=0;j<$scope.dashboard.widgets[i].chart.length;j++){
                        if ($scope.dashboard.widgets[i].chart[j].api){
                            $scope.dashboard.widgets[i].chart[j].api.update();
                        }
                    }
                };
            }
        });

        //make chart visible after grid have been created
        $scope.config = {visible: false};
        $timeout(function () {$scope.config.visible = true;}, 100);
        $rootScope.populateDashboardWidgets();
        $scope.skSpinner=false;
    };

    $rootScope.$on("CallPopulateDashboardWidgets", function(){
        $rootScope.populateDashboardWidgets();
    });

    //To populate all the widgets in a dashboard when the dashboard is refreshed or opened or calendar date range in the dashboard header is changed
    $rootScope.populateDashboardWidgets = function(){
        $scope.dashboard.widgets = [];
        $http({
            method: 'GET',
            url: '/api/v1/dashboards/widgets/'+ $state.params.id
        }).then(function successCallback(response) {
            var dashboardWidgetList = response.data.widgetsList;
            var widgets = [];

            for(getWidgetInfo in dashboardWidgetList){
                widgets.push(
                    createWidgets.widgetDataFetchHandler(
                        dashboardWidgetList[getWidgetInfo],
                        {
                            'startDate': moment($scope.dashboardCalendar.start_date).format('YYYY-MM-DD'),
                            'endDate': moment($scope.dashboardCalendar.end_date).format('YYYY-MM-DD')
                        }
                    )
                );

                //To temporarily create an empty widget with same id as the widgetId till all the data required for the widget is fetched by the called service
                $scope.dashboard.widgets.push({
                    'sizeY': (typeof dashboardWidgetList[getWidgetInfo].size != 'undefined'? dashboardWidgetList[getWidgetInfo].size.h : 3),
                    'sizeX': (typeof dashboardWidgetList[getWidgetInfo].size != 'undefined'? dashboardWidgetList[getWidgetInfo].size.w : 3),
                    'minSizeY': (typeof dashboardWidgetList[getWidgetInfo].minSize != 'undefined'? dashboardWidgetList[getWidgetInfo].minSize.h : 3),
                    'minSizeX': (typeof dashboardWidgetList[getWidgetInfo].minSize != 'undefined'? dashboardWidgetList[getWidgetInfo].minSize.w : 3),
                    'maxSizeY': (typeof dashboardWidgetList[getWidgetInfo].maxSize != 'undefined'? dashboardWidgetList[getWidgetInfo].maxSize.h : 3),
                    'maxSizeX': (typeof dashboardWidgetList[getWidgetInfo].maxSize != 'undefined'? dashboardWidgetList[getWidgetInfo].maxSize.w : 3),
                    'name': (typeof dashboardWidgetList[getWidgetInfo].name != 'undefined'? dashboardWidgetList[getWidgetInfo].name : ''),
                    'id': dashboardWidgetList[getWidgetInfo]._id,
                    'chart': {
                        'api': {}
                    },
                    'visibility': false
                });
            }

            $q.all(widgets).then(function successCallback(widgets){
                var finalChartData,widgetIndex;
                var sizeY,sizeX,chartsCount,individualGraphWidthDivider,individualGraphHeightDivider;
                var chartName;
                for(getWidgets in widgets){
                    console.log(widgets[getWidgets].charts);
                    if(widgets[getWidgets].charts==[] || widgets[getWidgets].charts==""){
                        chartName = "No Data Found";
                    }
                    else{
                        chartName = (typeof dashboardWidgetList[getWidgets].name != 'undefined'? dashboardWidgetList[getWidgets].name : '');
                    }
                    //To format and group the charts within a widget by chart type
                    finalChartData = createWidgets.dataLoader(widgets[getWidgets]);
                    widgetIndex = $scope.dashboard.widgets.map(function(el) {return el.id;}).indexOf(widgets[getWidgets]._id);
                    //$scope.dashboard.widgets[widgetIndex] = createWidgets.replacePlaceHolderWidget(dashboardWidgetList[getWidgetInfo],finalChartData,$scope.widgetLayoutOptions);

                    var setLayoutOptions = function() {
                        sizeY = typeof dashboardWidgetList[getWidgets].size != 'undefined'? dashboardWidgetList[getWidgets].size.h : 3;
                        sizeX = typeof dashboardWidgetList[getWidgets].size != 'undefined'? dashboardWidgetList[getWidgets].size.w : 3;
                        var chartsCount = finalChartData.length;
                        for(var i=0;i<$scope.widgetLayoutOptions.length;i++){
                            if($scope.widgetLayoutOptions[i].W == sizeX && $scope.widgetLayoutOptions[i].H == sizeY && $scope.widgetLayoutOptions[i].N == chartsCount){
                                individualGraphWidthDivider = $scope.widgetLayoutOptions[i].c;
                                individualGraphHeightDivider = $scope.widgetLayoutOptions[i].r;
                            }
                        }
                    };
                    setLayoutOptions();

                    $scope.dashboard.widgets[widgetIndex] = {
                        'sizeY': (typeof dashboardWidgetList[getWidgets].size != 'undefined'? dashboardWidgetList[getWidgets].size.h : 3),
                        'sizeX': (typeof dashboardWidgetList[getWidgets].size != 'undefined'? dashboardWidgetList[getWidgets].size.w : 3),
                        'minSizeY': (typeof dashboardWidgetList[getWidgets].minSize != 'undefined'? dashboardWidgetList[getWidgets].minSize.h : 3),
                        'minSizeX': (typeof dashboardWidgetList[getWidgets].minSize != 'undefined'? dashboardWidgetList[getWidgets].minSize.w : 3),
                        'maxSizeY': (typeof dashboardWidgetList[getWidgets].maxSize != 'undefined'? dashboardWidgetList[getWidgets].maxSize.h : 3),
                        'maxSizeX': (typeof dashboardWidgetList[getWidgets].maxSize != 'undefined'? dashboardWidgetList[getWidgets].maxSize.w : 3),
                        'name': chartName,
                        'visibility': true,
                        'id': widgets[getWidgets]._id,
                        'chart': finalChartData,
                        'layoutOptionsX': individualGraphWidthDivider,
                        'layoutOptionsY': individualGraphHeightDivider
                    };
                }
            },function errorCallback(error){
                console.log(error);
            });
        }, function errorCallback(error) {
            console.log('Error in finding widgets in the dashboard',error);
        });
    };

    //To catch a request for a new widget creation and create the dashboard in the frontend
    $scope.$on('populateWidget', function(e,widget,dataDateRange){
        var inputWidget = [];
        var chartName;
        inputWidget.push(createWidgets.widgetDataFetchHandler(widget,{
            'startDate': moment($scope.dashboardCalendar.start_date).format('YYYY-MM-DD'),
            'endDate': moment($scope.dashboardCalendar.end_date).format('YYYY-MM-DD')
        }));


        //To temporarily create an empty widget with same id as the widgetId till all the data required for the widget is fetched by the called service
        $scope.dashboard.widgets.push({
            'sizeY': (typeof widget.size != 'undefined'? widget.size.h : 3),
            'sizeX': (typeof widget.size != 'undefined'? widget.size.w : 3),
            'minSizeY': (typeof widget.minSize != 'undefined'? widget.minSize.h : 3),
            'minSizeX': (typeof widget.minSize != 'undefined'? widget.minSize.w : 3),
            'maxSizeY': (typeof widget.maxSize != 'undefined'? widget.maxSize.h : 3),
            'maxSizeX': (typeof widget.maxSize != 'undefined'? widget.maxSize.w : 3),
            'name': (typeof widget.name != 'undefined'? widget.name : ''),
            id: widget._id,
            chart: {
                api: {}
            },
            visibility: false
        });

        //Fetching the promise that contains all the data for all the widgets in the dashboard
        $q.all(inputWidget).then(
            function successCallback(inputWidget){
                var finalChartData,widgetIndex;
                var sizeY,sizeX,chartsCount,individualGraphWidthDivider,individualGraphHeightDivider;

                finalChartData = createWidgets.dataLoader(inputWidget[0]);

                //Based on the layout size of the widget, the charts inside the widget will be allocated space accordingly
                var setLayoutOptions = function() {
                    sizeY = typeof inputWidget[0].size != 'undefined'? inputWidget[0].size.h : 3;
                    sizeX = typeof inputWidget[0].size != 'undefined'? inputWidget[0].size.w : 3;
                    var chartsCount = finalChartData.length;
                    for(var i=0;i<$scope.widgetLayoutOptions.length;i++){
                        if($scope.widgetLayoutOptions[i].W == sizeX && $scope.widgetLayoutOptions[i].H == sizeY && $scope.widgetLayoutOptions[i].N == chartsCount){
                            individualGraphWidthDivider = $scope.widgetLayoutOptions[i].c;
                            individualGraphHeightDivider = $scope.widgetLayoutOptions[i].r;
                        }
                    }
                };
                setLayoutOptions();

                //To identify each empty widget and feed the data returned from the service call into it
                widgetIndex = $scope.dashboard.widgets.map(function(el) {
                    return el.id;
                }).indexOf(inputWidget[0]._id);

                if(inputWidget[0].charts==[] || inputWidget[0].charts==""){
                    chartName = "No Data Found";
                }
                else{
                    chartName = (typeof inputWidget[0].name != 'undefined'? inputWidget[0].name : '');
                }


                $scope.dashboard.widgets[widgetIndex] = {
                    'sizeY': (typeof inputWidget[0].size != 'undefined'? inputWidget[0].size.h : 3),
                    'sizeX': (typeof inputWidget[0].size != 'undefined'? inputWidget[0].size.w : 3),
                    'minSizeY': (typeof inputWidget[0].minSize != 'undefined'? inputWidget[0].minSize.h : 3),
                    'minSizeX': (typeof inputWidget[0].minSize != 'undefined'? inputWidget[0].minSize.w : 3),
                    'maxSizeY': (typeof inputWidget[0].maxSize != 'undefined'? inputWidget[0].maxSize.h : 3),
                    'maxSizeX': (typeof inputWidget[0].maxSize != 'undefined'? inputWidget[0].maxSize.w : 3),
                    'name': chartName,
                    'visibility': true,
                    'id': inputWidget[0]._id,
                    'chart': finalChartData,
                    'layoutOptionsX': individualGraphWidthDivider,
                    'layoutOptionsY': individualGraphHeightDivider
                };
            },
            function errorCallback(error){
                console.log(error);
            }
        );
    });

    //To add the graph data of a widget to the angular gridster layout widget
    $scope.addBasicWidget = function (graphData,metricDetails,widgetId) {
        if(graphData){
            var widgetIndex = $scope.dashboard.widgets.map(function(el) {
                return el.id;
            }).indexOf(widgetId);
            $scope.dashboard.widgets[widgetIndex] = {
                sizeY: 3,
                sizeX: 3,
                name: metricDetails.description,
                id: widgetId,
                visibility: true,
                chart: {
                    options: {
                        chart: {
                            type: 'lineChart',
                            margin : {top: 20, right: 20, bottom: 40, left: 55},
                            x: function(d){ return d.x; },
                            y: function(d){ return d.y; },
                            useInteractiveGuideline: true,
                            xAxis: {
                                axisLabel: metricDetails.xAxis,
                                tickFormat: function(d) {
                                    return d3.time.format('%m/%d/%y')(new Date(d))}
                            },
                            yAxis: {
                                axisLabel: metricDetails.yAxis
                            },
                            axisLabelDistance: -10
                        }
                    },
                    data: graphData,
                    api: {}
                }
            }
        } else {
            $scope.dashboard.widgets.push({
                sizeY: 3,
                sizeX: 3,
                name: '',
                id: widgetId
            });
        }
    };

    //To delete a widget from the dashboard
    $scope.deleteWidget = function(widget){
        console.log(widget);
        $http({
            method:'POST', url:'/api/v1/delete/widgets/' + widget.id
        }).then(function successCallback(response){
            console.log(response);
        },function errorCallback(error){
            console.log('Error in deleting the widget',error);
        });
    };

    //To export the dashboard into PDF format
    $scope.printPDF = function () {
        $http({
            method: 'GET',
            url: '/exportPDF/'+ $state.params.id+ '/'+ moment(moment.utc($scope.date.startDate._d).valueOf()).format('YYYY-MM-DD')+'/'+moment(moment.utc($scope.date.endDate._d).valueOf()).format('YYYY-MM-DD')
        }).then(function successCallback(response) {
            console.log(response);
        },function errorCallback(error) {
            console.log(error);
        });

    };

}