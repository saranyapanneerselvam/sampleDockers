showMetricApp.controller('DashboardController',DashboardController)

function DashboardController($scope,$timeout,$rootScope,$http,$window,$state,$stateParams,createWidgets,$q) {
    $scope.loading=false;
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
        $scope.dashboard = {
            widgets: [],
            datas: []
        };
        $scope.dashboard.dashboardName = '';

        //To fetch the name of the dashboard from database and display it when the dashboard is loaded
        $scope.fetchDashboardName = function () {
            $http({
                method: 'GET', url: '/api/v1/get/dashboards/'+ $state.params.id
            }).then(function successCallback(response) {
                if(response.status == '200'){
                    $scope.dashboard.dashboardName =  response.data.name;
                    $rootScope.populateDashboardWidgets();
                }
                else
                    $scope.dashboard.dashboardName =  null;
            }, function errorCallback(error) {
                console.log('Error in fetching dashboard name', error);
                $scope.dashboard.dashboardName = null;
                swal({
                    title: "",
                    text: "<span style='sweetAlertFont'>Please try again! Something is missing</span> .",
                    html: true
                });
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
                if(response.status == '200')
                    console.log('Dashboard Name updated successfully',response);
            }, function errorCallback(error) {
                console.log('Error in updating dashboard name', error);
                swal({
                    title: "",
                    text: "<span style='sweetAlertFont'>Please try again! Something is missing</span> .",
                    html: true
                });
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
            width: 'auto',
            colWidth:'auto',
            draggable: {
                enabled: true,
                handle: '.box-header'
            },
            outerMargin: true, // whether margins apply to outer edges of the grid
            mobileBreakPoint: 700,
            mobileModeEnabled: true, // whether or not to toggle mobile mode when screen width is less than mobileBreakPoint
            /*isMobile: false, // stacks the grid items if true*/
            resizable: {
                enabled: true,
                handles: ['se'],
                //handles: ['n', 'e', 's', 'w', 'ne', 'se', 'sw', 'nw'],
                start: function (event, $element, widget) {}, // optional callback fired when resize is started
                resize: function (event, $element, widget) {
                    var ind = $scope.dashboard.widgets.indexOf(widget);
                    for(var i=0;i<$scope.dashboard.datas[ind].chart.length;i++){
                        if ($scope.dashboard.datas[ind].chart[i].api){
                            $scope.dashboard.datas[ind].chart[i].api.update()
                        }
                    }
                }, // optional callback fired when item is resized,
                stop: function (event, $element, widget) {
                    function updateCharts(widget){
                        return function(){
                            var ind = $scope.dashboard.widgets.indexOf(widget);
                            for(var i=0;i<$scope.dashboard.datas[ind].chart.length;i++){
                                if ($scope.dashboard.datas[ind].chart[i].api){
                                    $scope.dashboard.datas[ind].chart[i].api.update()
                                }
                            }
                        }
                    }
                    $timeout(updateCharts(widget),400);

                } // optional callback fired when item is finished resizing
            }
        };

        $scope.$on('gridster-resized', function(sizes, gridster) {
            console.log('Gridster resized');
            for(var i=0;i<$scope.dashboard.widgets.length;i++){
                $timeout(resizeWidget(i), 100);
            }
            function resizeWidget(i) {
                return function() {
                    if(typeof $scope.dashboard.datas[i].chart != 'undefined'){
                        for(j=0;j<$scope.dashboard.datas[i].chart.length;j++){
                            if ($scope.dashboard.datas[i].chart[j].api){
                                $scope.dashboard.datas[i].chart[j].api.update();
                            }
                        }
                    }
                };
            }
        });

        $scope.$on('my-gridster-item-resized', function(e,item) {
            //console.log('my-gridster-item-resized',item);
/*
            for(var i=0;i<$scope.dashboard.widgets.length;i++){
                $timeout(resizeWidget(i), 100);
            }
            function resizeWidget(i) {
                return function() {
                    if(typeof $scope.dashboard.widgets[i].chart != 'undefined'){
                        for(j=0;j<$scope.dashboard.widgets[i].chart.length;j++){
                            if ($scope.dashboard.widgets[i].chart[j].api){
                                $scope.dashboard.widgets[i].chart[j].api.update();
                            }
                        }
                    }
                };
            }
*/
        });

        $scope.$watch('dashboard.widgets',function(newVal,oldVal){
            console.log('Inside watch oldLen=',oldVal.length," newLen=",newVal.length);
            if($scope.dashboard.widgets.length !=0){
                for(getWidgetInfo in $scope.dashboard.widgets){
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
                    }
                    $http({
                        method: 'POST',
                        url: '/api/v1/widgets',
                        data: jsonData
                    }).then(function successCallback(response){
                        //console.log('Response after updating widget', response);
                    }, function errorCallback (error){
                        console.log('Error in getting widget id',error);
                        swal({  title: "", text: "<span style='sweetAlertFont'>Please try again! Something is missing</span> .",   html: true });
                    });
                }
            }
        },true);

        $scope.$on('my-gridster-item-transition-end', function(e,item) {
            console.log('my-gridster-item-transition-end');

            for(var i=0;i<$scope.dashboard.widgets.length;i++){
                $timeout(resizeWidget(i), 100);
            }
            function resizeWidget(i) {
                return function() {
                    if(typeof $scope.dashboard.datas[i].chart != 'undefined'){
                        //var chartCount = $scope.dashboard.widgets[i].chart.length;
                        //var graphCountInCharts = [];
                        for(j=0;j<$scope.dashboard.datas[i].chart.length;j++){
                            //graphCountInCharts[j] = $scope.dashboard.widgets[i].chart[j].length;
                            if ($scope.dashboard.datas[i].chart[j].api){
                                $scope.dashboard.datas[i].chart[j].api.update();
                            }
/*
                            var summaryDiv = document.getElementById($scope.dashboard.widgets[i].id+'_summaryDataDiv_'+j);
                            var graphDiv = document.getElementById($scope.dashboard.widgets[i].id+'_graphDataDiv_'+j);
                            var boxDiv = document.getElementById($scope.dashboard.widgets[i].id);
                            console.log('Widget:',$scope.dashboard.widgets[i].name,' Box:',boxDiv.scrollHeight,boxDiv.offsetHeight,boxDiv.clientHeight);
                            console.log('Summary:',summaryDiv.scrollHeight,summaryDiv.offsetHeight,summaryDiv.clientHeight);
                            console.log('Graph:',graphDiv.scrollHeight,graphDiv.offsetHeight,graphDiv.clientHeight);
                            console.log('Chart count:',chartCount);
*/
/*
                            console.log('displaying div',summaryDiv, 'Box dimension',boxDiv.clientHeight,boxDiv.clientWidth,boxDiv.scrollHeight,boxDiv.scrollWidth);
                            console.log('Displaying heights',summaryDiv.getBoundingClientRect(),summaryDiv.scrollHeight,summaryDiv.clientHeight,summaryDiv.offsetHeight,summaryDiv.scrollWidth,summaryDiv.clientWidth);
                            if(summaryDiv.scrollHeight>summaryDiv.clientHeight || summaryDiv.scrollWidth>summaryDiv.clientWidth){
                                graphDiv.style.visibility = 'hidden';
                                console.log('Hiding the graph');
                            } else {
                                graphDiv.style.visibility='visible';
                                console.log('Showing the graph');
                            }
                            detectCollision(summaryDivId,graphDivId);
                            console.log('scroll height',document.getElementById(summaryDivId).scrollHeight);
                            console.log('client height',document.getElementById(summaryDivId).clientHeight);
                            if(document.getElementById(summaryDivId).scrollHeight > document.getElementById(summaryDivId).clientHeight || document.getElementById(summaryDivId).scrollWidth > document.getElementById(summaryDivId).clientWidth){
                                document.getElementById(graphDivId).style.visibility='hidden'
                            } else {
                                document.getElementById(graphDivId).style.visibility='visible'
                            }
                            collision($scope.dashboard.widgets[i].name,$('#'+summaryDivId),$('#'+graphDivId));
*/
                        }
                    }
                };
            }

/*
            function detectCollision(summaryDivName,graphDivName){
                var summaryDiv = document.getElementById(summaryDivName);
                var graphDiv = document.getElementById(graphDivName);

                var x1 = summaryDiv.offsetLeft;
                var y1 = summaryDiv.offsetTop;
                var h1 = summaryDiv.scrollHeight;
                var w1 = summaryDiv.scrollWidth;
                var x2 = graphDiv.offsetLeft;
                var y2 = graphDiv.offsetTop;
                var h2 = graphDiv.offsetHeight;
                var w2 = graphDiv.offsetWidth;
                var b1 = y1 + h1;
                var r1 = x1 + w1;
                var b2 = y2 + h2;
                var r2 = x2 + w2;
                if (b1 < y2 || y1 > b2 || r1 < x2 || x1 > r2) {
                    console.log(false, summaryDiv, graphDiv);
                    graphDiv.style.visibility = 'visible';
                }
                else {
                    console.log(true, summaryDiv, graphDiv);
                    graphDiv.style.visibility = 'hidden';
                }
            }
            function collision(name,$div1, $div2) {
                var x1 = $div1.offset().left;
                var y1 = $div1.offset().top;
                var h1 = $div1.outerHeight(true);
                var w1 = $div1.outerWidth(true);
                var b1 = y1 + h1;
                var r1 = x1 + w1;
                var x2 = $div2.offset().left;
                var y2 = $div2.offset().top;
                var h2 = $div2.outerHeight(true);
                var w2 = $div2.outerWidth(true);
                var b2 = y2 + h2;
                var r2 = x2 + w2;

                console.log(name);
                console.log(x1,y1,h1,w1,x2,y2,h2,w2,b1,r1,b2,r2);
                if (b1 < y2 || y1 > b2 || r1 < x2 || x1 > r2)
                    console.log(false, $div1, $div2);
                else
                    console.log(true, $div1, $div2);
            }
*/
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
                    if(typeof $scope.dashboard.datas[i].chart != 'undefined'){
                        for(j=0;j<$scope.dashboard.datas[i].chart.length;j++){
                            if ($scope.dashboard.datas[i].chart[j].api){
                                $scope.dashboard.datas[i].chart[j].api.update();
                            }
                        }
                    }
                };
            }
        });

        $scope.calculateColumnWidth = function(x) {
            var y = Math.round(12/x);
            if(y<6) {
                //return ('col-lg-'+6);
                return ('col-sm-'+6+' col-md-'+6+' col-lg-'+6);
            } else {
                //return ('col-lg-'+y);
                return ('col-sm-'+y+' col-md-'+y+' col-lg-'+y);
            }
        }

        //make chart visible after grid have been created
        $scope.config = {visible: false};
        $timeout(function () {$scope.config.visible = true;}, 100);
        $scope.skSpinner=false;
    };

    //To populate all the widgets in a dashboard when the dashboard is refreshed or opened or calendar date range in the dashboard header is changed
    $rootScope.populateDashboardWidgets = function() {
        $scope.dashboard.widgets = [];
        $http({
            method: 'GET',
            url: '/api/v1/dashboards/widgets/'+ $state.params.id
        }).then(function successCallback(response) {
            var dashboardWidgetList = response.data.widgetsList;
            var widgets = [];

            for(getWidgetInfo in dashboardWidgetList){
                widgets.push(createWidgets.widgetDataFetchHandler(dashboardWidgetList[getWidgetInfo],{
                    'startDate': moment($scope.dashboardCalendar.start_date).format('YYYY-MM-DD'),
                    'endDate': moment($scope.dashboardCalendar.end_date).format('YYYY-MM-DD')
                }));

                //To temporarily create an empty widget with same id as the widgetId till all the data required for the widget is fetched by the called service
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
                    'id': dashboardWidgetList[getWidgetInfo]._id,
                    //'chart': {'api': {}},
                    'visibility': false
                });

                $scope.dashboard.datas.push({
                    'id':  dashboardWidgetList[getWidgetInfo]._id,
                    'chart': [],
                    'visibility': false,
                    'name': (typeof dashboardWidgetList[getWidgetInfo].name != 'undefined'? dashboardWidgetList[getWidgetInfo].name : '')
                });

                //Fetching the promise that contains all the data for the particular widget in the dashboard
                widgets[getWidgetInfo].then(
                    function successCallback(widget){
                        var widgetIndex = $scope.dashboard.widgets.map(function(el) {return el.id;}).indexOf(widget._id);
                        var finalChartData = createWidgets.dataLoader(widget);
                        var widgetToBeLoaded = createWidgets.replacePlaceHolderWidget(widget,finalChartData);
                        widgetToBeLoaded.then(
                            function successCallback(widgetToBeLoaded){
                                $scope.dashboard.datas[widgetIndex] = widgetToBeLoaded;
                        },
                            function errorCallback(error){
                            console.log(error);
                        });
                    },
                    function errorCallback(error){
                        console.log(error);
                    });
            }
        }, function errorCallback(error) {
            console.log('Error in finding widgets in the dashboard', error);
            swal({
                title: "",
                text: "<span style='sweetAlertFont'>Please try again! Something is missing</span> .",
                html: true
            });
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
            'row': (typeof widget.row != 'undefined'? widget.row : 0),
            'col': (typeof widget.col != 'undefined'? widget.col : 0),
            'sizeY': (typeof widget.size != 'undefined'? widget.size.h : 2),
            'sizeX': (typeof widget.size != 'undefined'? widget.size.w : 2),
            'minSizeY': (typeof widget.minSize != 'undefined'? widget.minSize.h : 1),
            'minSizeX': (typeof widget.minSize != 'undefined'? widget.minSize.w : 1),
            'maxSizeY': (typeof widget.maxSize != 'undefined'? widget.maxSize.h : 3),
            'maxSizeX': (typeof widget.maxSize != 'undefined'? widget.maxSize.w : 3),
            'name': (typeof widget.name != 'undefined'? widget.name : ''),
            'id': widget._id,
            //'chart': {'api': {}},
            'visibility': false
        });
        $scope.dashboard.datas.push({
            'id':  widget._id,
            'chart': [],
            'visibility': false,
            'name': (typeof widget.name != 'undefined'? widget.name : '')
        });


        //Fetching the promise that contains all the data for all the widgets in the dashboard
        $q.all(inputWidget).then(
            function successCallback(inputWidget){
                var widgetIndex = $scope.dashboard.widgets.map(function(el) {return el.id;}).indexOf(inputWidget[0]._id);
                var finalChartData = createWidgets.dataLoader(inputWidget[0]);
                var widgetToBeLoaded = createWidgets.replacePlaceHolderWidget(inputWidget[0],finalChartData);
                widgetToBeLoaded.then(
                    function successCallback(widgetToBeLoaded){
                        //$scope.dashboard.widgets[widgetIndex] = widgetToBeLoaded;
                        $scope.dashboard.datas[widgetIndex] = widgetToBeLoaded;
                    },
                    function errorCallback(error) {
                        console.log(error);
                        swal({
                            title: "",
                            text: "<span style='sweetAlertFont'>Please try again! Something is missing</span> .",
                            html: true
                        });
                    });
                /*
                 var finalChartData,widgetIndex,sizeY,sizeX,chartsCount,individualGraphWidthDivider,individualGraphHeightDivider;

                finalChartData = createWidgets.dataLoader(inputWidget[0]);

                //Based on the layout size of the widget, the charts inside the widget will be allocated space accordingly
                var setLayoutOptions = function() {
                    sizeY = typeof inputWidget[0].size != 'undefined'? inputWidget[0].size.h : 3;
                    sizeX = typeof inputWidget[0].size != 'undefined'? inputWidget[0].size.w : 3;
                    chartsCount = finalChartData.length;
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
                } else{
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
*/
            },
            function errorCallback(error){
                console.log(error);
            }
        );
    });

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

    //To delete the dashboard
    $scope.deleteDashboard = function(){
        $http({
            method:'POST', url:'/api/v1/delete/userDashboards/' + $state.params.id
        }).then(function successCallback(response){
            console.log('dashboardDeleted',response);
            $state.go('app.reporting.dashboards');
        },function errorCallback(error){
            swal({  title: "", text: "<span style='sweetAlertFont'>Unable to delete dashboard.Please try again</span> .",   html: true });
            console.log('Error in deleting the widget',error);
        });

    }

}