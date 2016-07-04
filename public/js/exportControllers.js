function ExportAppController($http,$state,$scope,$stateParams) {
    //console.log('ExportAppController',$state.params,$stateParams);
}

function ExportDashboardController($scope,$timeout,$rootScope,$http,$window,$state,$stateParams) {

    $scope.dashboardConfiguration = function () {
        //Defining configuration parameters for dashboard calendar
        $scope.date = {
            startDate: moment().subtract(29, "days"),
            endDate: moment()
        };
        $scope.opts = {
            locale: {
                applyClass: 'btn-green', applyLabel: "Apply",
                fromLabel: "From", toLabel: "To", cancelLabel: 'Cancel', customRangeLabel: 'Custom Range',
                daysOfWeek: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], firstDay: 1,
                monthNames: [
                    'January', 'February', 'March', 'April', 'May', 'June', 'July',
                    'August', 'September', 'October', 'November', 'December']
            },
            ranges: {
                'Last 7 Days': [moment().subtract(6, 'days'), moment()],
                'Last 30 Days': [moment().subtract(29, 'days'), moment()]},
            opens: "center",
            minDate: moment().subtract(365,"days"),
            maxDate: moment()
        };

        //Defining configuration parameters for dashboard layout
        $scope.dashboard = {widgets: []};
        $scope.dashboard.dashboardName = '';

        //
        $scope.fetchDashboardName = function () {
            $http({
                method: 'GET', url: '/api/v1/get/dashboards/'+ $rootScope.dashboardId
            }).then(function successCallback(response) {
                $scope.dashboard.dashboardName =  response.data.data.name;
            }, function errorCallback(error) {
                $scope.dashboard.dashboardName =   null;
            });
        };
        $scope.fetchDashboardName();
        $scope.populateDashboardWidgets();

        //Setting up grid configuration for widgets
        $scope.gridsterOptions = {
            margins: [10, 10], columns: 6, defaultSizeX: 3, defaultSizeY: 6, minSizeX: 3, minSizeY: 6,
            draggable: {enabled: true, handle: 'box-header'},
            outerMargin: true, // whether margins apply to outer edges of the grid
            mobileBreakPoint: 600,
            mobileModeEnabled: true, // whether or not to toggle mobile mode when screen width is less than mobileBreakPoint
            isMobile: false, // stacks the grid items if true
            resizable: {enabled: true,handles: ['n', 'e', 's', 'w', 'ne', 'se', 'sw', 'nw'],
                start: function (event, $element, widget) {}, // optional callback fired when resize is started
                resize: function (event, $element, widget) {
                    if (widget.chart.api) widget.chart.api.update();
                }, // optional callback fired when item is resized,
                stop: function (event, $element, widget) {
                    $timeout(function () {if (widget.chart.api) widget.chart.api.update();}, 400)
                } // optional callback fired when item is finished resizing
            }
        };
        //Watch for date changes to repopulate dashboard widgets
        //subscribe widget on window resize event and sidebar resize event
        new ResizeSensor(document.getElementById('dashboardLayout'), function() {$scope.$broadcast('resize');});
        angular.element($window).on('resize', function (e) {$scope.$broadcast('resize');});
        $scope.$on('resize',function(e){
            for(var i=0;i<$scope.dashboard.widgets.length;i++){$timeout(resizeWidget(i), 100);}
            function resizeWidget(i) {
                return function() {if ($scope.dashboard.widgets[i].chart.api){$scope.dashboard.widgets[i].chart.api.update();}};
            }
        });
    };

    $scope.populateDashboardWidgets = function(){
        $scope.dashboard.widgets = [];
        $scope.widgetsCount = 0;
        $http({
            method: 'GET', url: '/api/v1/dashboards/widgets/'+ $rootScope.dashboardId
        }).then(function successCallback(response) {
            $scope.dashboardWidgetList = response.data.widgetsList;
            $scope.widgetsCount = $scope.dashboardWidgetList.length;
            for(i=0;i<$scope.dashboardWidgetList.length;i++){
                if($scope.dashboardWidgetList[i].widgetType = 'basic')
                    $rootScope.$emit('createNewBasicWidget',$scope.dashboardWidgetList[i]._id);
            }
        }, function errorCallback(error) {
            console.log('Error in finding widgets in the dashboard',error);
        });
    };

    $rootScope.$on('createNewBasicWidget', function(e,widgetId){
        var graphData, metricNameInGraph, metricDetails;
        var dataToBePopulated = [];
        var jsonData = {
            "startDate": $rootScope.startDate,
            "endDate": $rootScope.endDate
        };

        $scope.dashboard.widgets.push({
            sizeY: 3, sizeX: 3, id: widgetId, chart: {api: {}}, visibility: false
        });

        $http({
            method: 'POST',
            url: '/api/v1/widgets/data/'+widgetId,
            data: jsonData
        }).then(function successCallback(response){
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
                    color: '#1ab394'  //color - optional: choose your own line color.
                }];
                $scope.addBasicWidget(graphData,metricDetails,widgetId);
            },function errorCallback(error){
                console.log('Error in getting metric details',error);
            });
        },function errorCallback(error){
            console.log('Error in getting data after widget creation',error);
            $scope.addBasicWidget(graphData,metricDetails,widgetId);
        });
    });

    $scope.addBasicWidget = function (graphData,metricDetails,widgetId) {
        if(graphData){
            var widgetIndex = $scope.dashboard.widgets.map(function(el) {
                return el.id;
            }).indexOf(widgetId);
            $scope.dashboard.widgets[widgetIndex] = {
                sizeY: 3, sizeX: 3, name: metricDetails.description, id: widgetId,
                chart: {
                    options: {
                        chart: {
                            type: 'lineChart',
                            margin : {top: 20, right: 20, bottom: 40, left: 55}, x: function(d){ return d.x; }, y: function(d){ return d.y; },
                            useInteractiveGuideline: true,
                            xAxis: {axisLabel: metricDetails.xAxis, tickFormat: function(d) {return d3.time.format('%m/%d/%y')(new Date(d))}},
                            yAxis: {axisLabel: metricDetails.yAxis},
                            axisLabelDistance: -10
                        }
                    },
                    data: graphData, api: {}
                },
                visibility: true
            }
        } else {
            $scope.dashboard.widgets.push({
                sizeY: 3, sizeX: 3, name: '', id: widgetId
            });
        }
    };
}

/**
 * Pass all functions into module
 */
angular
    .module('exportPDF')
    .controller('ExportAppController', ExportAppController)
    .controller('ExportDashboardController',ExportDashboardController);