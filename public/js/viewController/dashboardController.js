showMetricApp.controller('DashboardController',DashboardController)

function DashboardController($scope,$timeout,$rootScope,$http,$window,$state,$stateParams,createWidgets,$q) {

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
                console.log(response);
                console.log('successfully retrieved dashboard details',response.data.data.name);
                $scope.dashboard.dashboardName =  response.data.data.name;
            }, function errorCallback(error) {
                console.log('Error in getting dashboard details',error);
                $scope.dashboard.dashboardName =   null;
            });
        };
        $scope.fetchDashboardName();

        //Function to change the name of the dashboard to user entered value
        $scope.changeDashboardName = function () {
            console.log('This is working',$scope.dashboard.dashboardName);
            var jsonData = {dashboardId: $state.params.id, name: $scope.dashboard.dashboardName};
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
            margins: [10, 10], columns: 8, defaultSizeX: 2, defaultSizeY: 2, minSizeX: 2, minSizeY: 2,
            draggable: {enabled: true, handle: 'box-header'},
            outerMargin: true, // whether margins apply to outer edges of the grid
            mobileBreakPoint: 600,
            mobileModeEnabled: true, // whether or not to toggle mobile mode when screen width is less than mobileBreakPoint
            /*
             isMobile: false, // stacks the grid items if true
             */
            resizable: {enabled: true,handles: ['n', 'e', 's', 'w', 'ne', 'se', 'sw', 'nw'],
                start: function (event, $element, widget) {}, // optional callback fired when resize is started
                resize: function (event, $element, widget) {if (widget.chart.api) widget.chart.api.update();}, // optional callback fired when item is resized,
                stop: function (event, $element, widget) {$timeout(function () {if (widget.chart.api) widget.chart.api.update();}, 400)} // optional callback fired when item is finished resizing
            }
        };

        //subscribe widget on window resize event and sidebar resize event
        new ResizeSensor(document.getElementById('dashboardLayout'), function() {$scope.$broadcast('resize');});
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
                $scope.dashboard.widgets.push({sizeY: 3, sizeX: 3, id: dashboardWidgetList[getWidgetInfo]._id, chart: {api: {}},visibility: false});
            }

            $q.all(widgets).then(function successCallback(widgets){
                var finalChartData,widgetIndex;
                for(getWidgets in widgets){
                    finalChartData = createWidgets.dataLoader(widgets[getWidgets]);

                    widgetIndex = $scope.dashboard.widgets.map(function(el) {
                        return el.id;
                    }).indexOf(widgets[getWidgets]._id);

                    $scope.dashboard.widgets[widgetIndex] = {
                        sizeY: 3, sizeX: 3, name: 'chart', visibility: true,
                        id: widgets[getWidgets]._id,
                        chart: finalChartData
                    };
                    console.log($scope.dashboard.widgets[widgetIndex]);
                }
/*
                var widgetIndex;
                var graphData = [];
                var charts = [];
                graphData.lineData = [];
                graphData.barData = [];
                graphData.lineDataOptions = [];
                graphData.barDataOptions = [];
                for(var i=0;i<widgets.length;i++){
                    console.log('Widget after formatting',widgets[i]);
                    for(var j=0;j<widgets[i].charts.length;j++){
                        if(widgets[i].charts[j].chartType == 'line'){
                            graphData.lineData.push({
                                values: widgets[i].charts[j].chartData,      //values - represents the array of {x,y} data points
                                key: widgets[i].charts[j].metricDetails.name, //key  - the name of the series.
                                color: '#7E57C2'  //color - optional: choose your own line color.
                            });
                        } else if (widgets[i].charts[j].chartType == 'bar'){
                            graphData.barData.push({
                                values: widgets[i].charts[j].chartData,      //values - represents the array of {x,y} data points
                                key: widgets[i].charts[j].metricDetails.name, //key  - the name of the series.
                                color: '#7E57C2'  //color - optional: choose your own line color.
                            });
                        }
                    }
                    console.log(graphData);
                    if(graphData.lineData != null){
                        graphData.lineDataOptions = {
                            chart: {
                                type: 'cumulativeLineChart',
                                margin : {top: 20, right: 20, bottom: 40, left: 55},
                                x: function(d){ return d.x; },
                                y: function(d){ return d.y; },
                                useInteractiveGuideline: true,
                                xAxis: {
                                    axisLabel: 'Line Chart xaxis',
                                    tickFormat: function(d) {
                                        return d3.time.format('%m/%d/%y')(new Date(d))}
                                },
                                yAxis: {
                                    axisLabel: 'Line Chart yaxis'
                                },
                                axisLabelDistance: -10
                            }
                        }
                    }
                    if(graphData.barData != null){
                        graphData.barDataOptions = {
                            chart: {
                                type: 'discreteBarChart',
                                margin : {top: 20, right: 20, bottom: 40, left: 55},
                                x: function(d){ return d.x; },
                                y: function(d){ return d.y; },
                                useInteractiveGuideline: true,
                                xAxis: {
                                    axisLabel: 'Bar Chart xaxis',
                                    tickFormat: function(d) {
                                        return d3.time.format('%m/%d/%y')(new Date(d))}
                                },
                                yAxis: {
                                    axisLabel: 'Bar Chart yaxis'
                                },
                                axisLabelDistance: -10
                            }
                        }
                    }
                    widgetIndex = $scope.dashboard.widgets.map(function(el) {
                        return el.id;
                    }).indexOf(widgets[i]._id);
                    var tempChart = {
                        'options': graphData.lineDataOptions,
                        'data': graphData.lineData,
                        'api': {}
                    };
                    /!*,
                     {
                     'options': graphData.barDataOptions,
                     'data': graphData.barData,
                     'api': {}
                     }*!/

                     $scope.dashboard.widgets[widgetIndex] = {
                     sizeY: 3, sizeX: 3, name: 'chart', visibility: true,
                     id: widgets[i]._id,
                     chart: tempChart
                     };
                     console.log($scope.dashboard.widgets[widgetIndex]);

*/
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
        $scope.dashboard.widgets.push({sizeY: 3, sizeX: 3, id: widget._id, chart: {api: {}},visibility: false});

        $q.all(inputWidget).then(
            function successCallback(inputWidget){
                console.log(inputWidget);
                var finalChartData,widgetIndex;
                finalChartData = createWidgets.dataLoader(inputWidget[0]);

                widgetIndex = $scope.dashboard.widgets.map(function(el) {
                    return el.id;
                }).indexOf(inputWidget[0]._id);

                $scope.dashboard.widgets[widgetIndex] = {
                    sizeY: 3, sizeX: 3, name: 'chart', visibility: true,
                    id: inputWidget[0]._id,
                    chart: finalChartData
                };
                console.log($scope.dashboard.widgets[widgetIndex]);
            },
            function errorCallback(error){
                console.log(error);
            }
        );

        /*
                var graphData, metricDetails;
                var dataToBePopulated = [];
                var jsonData = {
                    "startDate": moment($scope.dashboardCalendar.start_date).format('YYYY-MM-DD'),
                    "endDate": moment($scope.dashboardCalendar.end_date).format('YYYY-MM-DD')
                };
                console.log('Displaying data fetch inputs',widgetId,jsonData);
                $scope.dashboard.widgets.push({
                    sizeY: 3,
                    sizeX: 3,
                    id: widgetId,
                    chart: {
                        api: {}
                    },
                    visibility: false
                });
                $http({
                    method: 'POST',
                    url: '/api/v1/widgets/data/'+widgetId,
                    data: jsonData
                }).then(function successCallback(response){
                    console.log('Data for widget',widgetId,':',response);
                    for(i=0;i<response.data[0].data.length;i++){
                        splitDate = [response.data[0].data[i].date];
                        newDate = splitDate[1]+'/'+splitDate[2]+'/'+splitDate[0];
                        inputDate = new Date(newDate).getTime();
                        dataToBePopulated.push({x: inputDate, y: response.data[0].data[i].total});
                    }
                    $http({
                        method:'GET', url:'/api/v1/get/metricDetails/' + response.data[0].metricId
                    }).then(function successCallback(response){
                        metricDetails = response.data.metricsList[0];
                        graphData = [{
                            values: dataToBePopulated,      //values - represents the array of {x,y} data points
                            key: metricDetails.name, //key  - the name of the series.
                            color: '#7E57C2'  //color - optional: choose your own line color.
                        }];
                        $scope.addBasicWidget(graphData,metricDetails,widgetId);
                    },function errorCallback(error){
                        console.log('Error in getting metric details',error);
                    });
                },function errorCallback(error){
                    console.log('Error in getting data after widget creation',error);
                    //$scope.addBasicWidget(graphData,metricDetails,widgetId);
                });
        */
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