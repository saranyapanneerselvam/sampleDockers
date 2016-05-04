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
        $scope.widgetsCount = 0;

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






        // //subscribe widget on window resize event and sidebar resize event
        // new ResizeSensor(document.getElementById('dashboardLayout'), function() {$scope.$broadcast('resize');});
        // angular.element($window).on('resize', function (e) {$scope.$broadcast('resize');});
        // $scope.$on('resize',function(e){
        //     for(var i=0;i<$scope.dashboard.widgets.length;i++){$timeout(resizeWidget(i), 100);}
        //     function resizeWidget(i) {
        //         return function() {if ($scope.dashboard.widgets[i].chart.api){$scope.dashboard.widgets[i].chart.api.update();}};
        //     }
        // });

        //make chart visible after grid have been created
        $scope.config = {visible: false};
        $timeout(function () {$scope.config.visible = true;}, 100);
        $rootScope.populateDashboardWidgets();
        $scope.noDataFound=true;
        $scope.skSpinner=false;
        $scope.hideCustomDataValues=true;
    };

    $rootScope.populateDashboardWidgets = function(){
        $scope.dashboard.widgets = [];
        $http({
            method: 'GET',
            url: '/api/v1/dashboards/widgets/'+ $state.params.id
        }).then(function successCallback(response) {
            var dashboardWidgetList = response.data.widgetsList;
            console.log("populate Dashboard Widgets");
            console.log(response.data.widgetsList);
            var countWidget = 0;
            var getCustomDataWidgetArray = new Array();
            for(getWidgetInfo in dashboardWidgetList){

                if(dashboardWidgetList[getWidgetInfo].widgetType=="custom"){
                    countWidget++;
                    // for custom widgets to be populated here
                    debugger;
                    var dataWidgetObj = {
                        col: countWidget,
                        name:  "Custom Data "+countWidget
                    };

                    getCustomDataWidgetArray.push(dataWidgetObj);

                    $scope.dashboards = {
                        '0': {
                            id: '1',
                            name: 'Dashboard Custom Widget',
                            widgets: getCustomDataWidgetArray
                        }
                    };

                    $scope.dashboard = $scope.dashboards[0];

                    $scope.skSpinner=true;
                    $scope.noDataFound=false;
                    $scope.hideCustomDataValues=true;
 
                }
                else{
                    // for other widgets to be populated here
                    $scope.widgetsCount = dashboardWidgetList.length;
                    var widgets = [];
                    for(var i=0;i<dashboardWidgetList.length;i++){
                        widgets.push(
                            createWidgets.widgetDataFetchHandler(
                                dashboardWidgetList[i],
                                {
                                    'startDate': moment($scope.dashboardCalendar.start_date).format('YYYY-MM-DD'),
                                    'endDate': moment($scope.dashboardCalendar.end_date).format('YYYY-MM-DD')
                                }
                            )
                        );
                    }
                    $q.all(widgets).then(function successCallback(widgets){
                        for(i=0;i<widgets.length;i++){
                            widgets[i] = createWidgets.formatDataPoints(widgets[i]);
                        }
                    },function errorCallback(error){
                        console.log(error);
                    });
                }
            }




        }, function errorCallback(error) {
            console.log('Error in finding widgets in the dashboard',error);
        });
    };

    //To catch a request for a new widget creation and create the dashboard in the frontend
    $rootScope.$on('populateBasicWidgetData', function(e,widgetId,dataDateRange){
        var graphData, metricNameInGraph, metricDetails;
        var dataToBePopulated = [];
        var jsonData = {
            /*"startDate": moment(moment.utc($scope.date.startDate._d).valueOf()).format('YYYY-MM-DD'),
             "endDate": moment(moment.utc($scope.date.endDate._d).valueOf()).format('YYYY-MM-DD')*/
            "startDate": moment($scope.dashboardCalendar.start_date).format('YYYY-MM-DD'),
            "endDate": moment($scope.dashboardCalendar.end_date).format('YYYY-MM-DD')
        };
        console.log('Displaying data fetch inputs',widgetId,jsonData);
        $scope.dashboard.widgets.push({
            sizeY: 3, sizeX: 3, id: widgetId, chart: {api: {}}, visibility: false
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
    });

    //To add the graph data of a widget to the angular gridster layout widget
    $scope.addBasicWidget = function (graphData,metricDetails,widgetId) {
        if(graphData){
            var widgetIndex = $scope.dashboard.widgets.map(function(el) {
                return el.id;
            }).indexOf(widgetId);
            console.log(widgetIndex);
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
/*
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

 //Watch for date changes to repopulate dashboard widgets
 $scope.$watch('date', function(newDate) {$scope.populateDashboardWidgets();}, false);
 */
/*
 var url,title;
 url = '/export/'+ $state.params.id+ '/'+ moment(moment.utc($scope.date.startDate._d).valueOf()).format('YYYY-MM-DD')+'/'+moment(moment.utc($scope.date.endDate._d).valueOf()).format('YYYY-MM-DD');
 console.log(url);
 title = $state.params.id;
 function popupwindow(url, title, w, h) {
 var left = (screen.width/2)-(w/2);
 var top = (screen.height/2)-(h/2);
 return window.open(url, title, 'toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=no, resizable=no, copyhistory=no, width='+w+', height='+h+', top='+top+', left='+left);
 }
 popupwindow(url,title, 1000,500);
 */
/*
 var pdf = new jsPDF('p', 'pt', 'a3');

 var specialElementHandlers = {
 '#justLayout': function(element, renderer){
 return true;
 }
 };

 var options = {
 pagesplit: true
 };

 for(i=0;i<$scope.dashboardWidgetList.length;i++){
 console.log($scope.dashboardWidgetList[i]._id);
 console.log(document.getElementById($scope.dashboardWidgetList[i]._id));
 elementToBeCanvased = document.getElementById($scope.dashboardWidgetList[i]._id).getElementsByTagName('svg').outerHTML;
 console.log(elementToBeCanvased);
 canvg(document.getElementById('canvas'),elementToBeCanvased);
 }
 pdf.addHTML($("#dashboardLayout"), {pagesplit: true}, function() {
 console.log("THING");
 pdf.save('Test.pdf');
 //$("#printingDiv").remove();
 });
 */
/*
 pdf.fromHTML($('#dashboardLayout').html(), 15, 30, {
 'width': 170,
 //'margin': 1,
 'elementHandlers': specialElementHandlers,
 'pagesplit': true
 });
 pdf.fromHTML($('#gridsterItems').html(), 15, 30, {
 'width': 170,
 //'margin': 1,
 'elementHandlers': specialElementHandlers,
 'pagesplit': true
 });
 $timeout(function(){pdf.save('Test.pdf');},5000);
 */
/*
 var doc = new jsPDF('p', 'in', 'letter');
 var source = $('#testLayout').first();
 var specialElementHandlers = {
 '#bypassme': function(element, renderer) {
 return true;
 }
 };

 doc.fromHTML(
 source, // HTML string or DOM elem ref.
 0.5, // x coord
 0.5, // y coord
 {
 'width': 7.5, // max width of content on PDF
 'elementHandlers': specialElementHandlers
 });

 doc.save('Test.pdf');
 window.print();
 */
/*
 var doc = new jsPDF(    );
 doc.text(20, 20, 'Hello world.');
 console.log($('#dashboardLayout'));
 console.log($('#testLayout'));
 doc.addHTML('<p>testing out</p>');
 doc.addHTML($('#dashboardLayout'));
 doc.addHTML($('#testLayout'),function(){doc.save('Test.pdf');});
 //doc.save('Test.pdf');
 //doc.open(400);
 */
