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
            console.log($state.params,$stateParams);
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
                    for(i=0;i<widget.chart.length;i++){
                        if (widget.chart[i].api){
                            widget.chart[i].api.update();
                            console.log('API triggered');
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
            console.log('Resize event triggered');
            $scope.$broadcast('resize');
        });
        angular.element($window).on('resize', function (e) {$scope.$broadcast('resize');});
        $scope.$on('resize',function(e){
            for(var i=0;i<$scope.dashboard.widgets.length;i++){$timeout(resizeWidget(i), 100);}
            function resizeWidget(i) {
                return function() {if ($scope.dashboard.widgets[i].chart.api){$scope.dashboard.widgets[i].chart.api.update();}};
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

            console.log("populate Dashboard Widgets", response.data.widgetsList);

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
                    'sizeY': (dashboardWidgetList[getWidgetInfo].size.h? dashboardWidgetList[getWidgetInfo].size.h : 3),
                    'sizeX': (dashboardWidgetList[getWidgetInfo].size.w? dashboardWidgetList[getWidgetInfo].size.w : 3),
                    'minSizeY': (dashboardWidgetList[getWidgetInfo].minSize.h? dashboardWidgetList[getWidgetInfo].minSize.h : 3),
                    'minSizeX': (dashboardWidgetList[getWidgetInfo].minSize.w? dashboardWidgetList[getWidgetInfo].minSize.w : 3),
                    'maxSizeY': (dashboardWidgetList[getWidgetInfo].maxSize.h? dashboardWidgetList[getWidgetInfo].maxSize.h : 3),
                    'maxSizeX': (dashboardWidgetList[getWidgetInfo].maxSize.w? dashboardWidgetList[getWidgetInfo].maxSize.w : 3),
                    'name': (dashboardWidgetList[getWidgetInfo].name? dashboardWidgetList[getWidgetInfo].name : ''),
                    'id': dashboardWidgetList[getWidgetInfo]._id,
                    'chart': {
                        'api': {}
                    },
                    'visibility': false
                });
            }

            $q.all(widgets).then(function successCallback(widgets){
                var finalChartData,widgetIndex;

                for(getWidgets in widgets){
                    finalChartData = createWidgets.dataLoader(widgets[getWidgets]);
                    widgetIndex = $scope.dashboard.widgets.map(function(el) {return el.id;}).indexOf(widgets[getWidgets]._id);
                    //$scope.dashboard.widgets[widgetIndex] = createWidgets.replacePlaceHolderWidget(dashboardWidgetList[getWidgetInfo],finalChartData,$scope.widgetLayoutOptions);

                    var sizeY,sizeX,chartsCount,individualGraphWidthDivider,individualGraphHeightDivider;
                    var setLayoutOptions = function() {
                        sizeY = dashboardWidgetList[getWidgetInfo].size.h? dashboardWidgetList[getWidgetInfo].size.h : 3;
                        sizeX = dashboardWidgetList[getWidgetInfo].size.w? dashboardWidgetList[getWidgetInfo].size.w : 3;
                        var chartsCount = finalChartData.length;
                        for(var i=0;i<$scope.widgetLayoutOptions.length;i++){
                            //console.log($scope.widgetLayoutOptions[i].W, $scope.widgetLayoutOptions[i].H, $scope.widgetLayoutOptions[i].N);
                            //console.log(sizeX, sizeY, chartsCount);
                            if($scope.widgetLayoutOptions[i].W == sizeX && $scope.widgetLayoutOptions[i].H == sizeY && $scope.widgetLayoutOptions[i].N == chartsCount){
                                //console.log('Matching layout found');
                                individualGraphWidthDivider = $scope.widgetLayoutOptions[i].c;
                                individualGraphHeightDivider = $scope.widgetLayoutOptions[i].r;
                            }
                        }
                    };
                    setLayoutOptions();
                    console.log('Dividers',individualGraphWidthDivider,individualGraphHeightDivider);

                    $scope.dashboard.widgets[widgetIndex] = {
                        'sizeY': (dashboardWidgetList[getWidgetInfo].size.h? dashboardWidgetList[getWidgetInfo].size.h : 3),
                        'sizeX': (dashboardWidgetList[getWidgetInfo].size.w? dashboardWidgetList[getWidgetInfo].size.w : 3),
                        'minSizeY': (dashboardWidgetList[getWidgetInfo].minSize.h? dashboardWidgetList[getWidgetInfo].minSize.h : 3),
                        'minSizeX': (dashboardWidgetList[getWidgetInfo].minSize.w? dashboardWidgetList[getWidgetInfo].minSize.w : 3),
                        'maxSizeY': (dashboardWidgetList[getWidgetInfo].maxSize.h? dashboardWidgetList[getWidgetInfo].maxSize.h : 3),
                        'maxSizeX': (dashboardWidgetList[getWidgetInfo].maxSize.w? dashboardWidgetList[getWidgetInfo].maxSize.w : 3),
                        'name': (dashboardWidgetList[getWidgetInfo].name? dashboardWidgetList[getWidgetInfo].name : ''),
                        'visibility': true,
                        'id': widgets[getWidgets]._id,
                        'chart': finalChartData,
                        'layoutOptionsX': individualGraphWidthDivider,
                        'layoutOptionsY': individualGraphHeightDivider
                    };
                    $timeout($window.dispatchEvent(new Event('resize')),400);
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
        inputWidget.push(createWidgets.widgetDataFetchHandler(widget,{
            'startDate': moment($scope.dashboardCalendar.start_date).format('YYYY-MM-DD'),
            'endDate': moment($scope.dashboardCalendar.end_date).format('YYYY-MM-DD')
        }));

        //To temporarily create an empty widget with same id as the widgetId till all the data required for the widget is fetched by the called service
        $scope.dashboard.widgets.push({
            'sizeY': (widget.size.h? widget.size.h : 3),
            'sizeX': (widget.size.w? widget.size.w : 3),
            'minSizeY': (widget.minSize.h? widget.minSize.h : 3),
            'minSizeX': (widget.minSize.w? widget.minSize.w : 3),
            'maxSizeY': (widget.maxSize.h? widget.maxSize.h : 3),
            'maxSizeX': (widget.maxSize.w? widget.maxSize.w : 3),
            'name': (widget.name? widget.name : ''),
            id: widget._id,
            chart: {
                api: {}
            },
            visibility: false
        });

        $q.all(inputWidget).then(
            function successCallback(inputWidget){
                console.log(inputWidget);
                var finalChartData,widgetIndex;
                finalChartData = createWidgets.dataLoader(inputWidget[0]);

                widgetIndex = $scope.dashboard.widgets.map(function(el) {
                    return el.id;
                }).indexOf(inputWidget[0]._id);

                var sizeY,sizeX,chartsCount,individualGraphWidthDivider,individualGraphHeightDivider;
                var setLayoutOptions = function() {
                    sizeY = inputWidget[0].size.h? inputWidget[0].size.h : 3;
                    sizeX = inputWidget[0].size.w? inputWidget[0].size.w : 3;
                    var chartsCount = finalChartData.length;
                    for(var i=0;i<$scope.widgetLayoutOptions.length;i++){
                        //console.log($scope.widgetLayoutOptions[i].W, $scope.widgetLayoutOptions[i].H, $scope.widgetLayoutOptions[i].N);
                        //console.log(sizeX, sizeY, chartsCount);
                        if($scope.widgetLayoutOptions[i].W == sizeX && $scope.widgetLayoutOptions[i].H == sizeY && $scope.widgetLayoutOptions[i].N == chartsCount){
                            //console.log('Matching layout found');
                            individualGraphWidthDivider = $scope.widgetLayoutOptions[i].c;
                            individualGraphHeightDivider = $scope.widgetLayoutOptions[i].r;
                        }
                    }
                };
                setLayoutOptions();
                console.log('Dividers',individualGraphWidthDivider,individualGraphHeightDivider);


                $scope.dashboard.widgets[widgetIndex] = {
                    'sizeY': (inputWidget[0].size.h? inputWidget[0].size.h : 3),
                    'sizeX': (inputWidget[0].size.w? inputWidget[0].size.w : 3),
                    'minSizeY': (inputWidget[0].minSize.h? inputWidget[0].minSize.h : 3),
                    'minSizeX': (inputWidget[0].minSize.w? inputWidget[0].minSize.w : 3),
                    'maxSizeY': (inputWidget[0].maxSize.h? inputWidget[0].maxSize.h : 3),
                    'maxSizeX': (inputWidget[0].maxSize.w? inputWidget[0].maxSize.w : 3),
                    'name': (inputWidget[0].name? inputWidget[0].name : ''),
                    'visibility': true,
                    'id': inputWidget[0]._id,
                    'chart': finalChartData,
                    'layoutOptionsX': individualGraphWidthDivider,
                    'layoutOptionsY': individualGraphHeightDivider
                };
                console.log($scope.dashboard.widgets[widgetIndex]);
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
            console.log(widgetIndex);
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
            console.log($scope.dashboard.widgets[widgetIndex]);
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