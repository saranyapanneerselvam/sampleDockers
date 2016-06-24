showMetricApp.controller('DashboardController',DashboardController)

function DashboardController($scope,$timeout,$rootScope,$http,$window,$state,$stateParams,createWidgets,$q,$window) {
    $scope.loading=false;
    $scope.$window = $window;
    var isExportOptionSet = "";
    $(".navbar").css('z-index','1');
    $(".md-overlay").css("background","rgba(0,0,0,0.5)");
    $("#getLoadingModalContent").addClass('md-show');
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
            widgetData: []
        };
        $scope.dashboard.dashboardName = '';
        $scope.widgetsPresent = false;

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
            swapping: true,
            float: true,
            pushing: true,
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
                    for(var i=0;i<$scope.dashboard.widgetData[ind].chart.length;i++){
                        if ($scope.dashboard.widgetData[ind].chart[i].api){
                            $scope.dashboard.widgetData[ind].chart[i].api.update()
                        }
                    }
                }, // optional callback fired when item is resized,
                stop: function (event, $element, widget) {
                    function updateCharts(widget){
                        return function(){
                            var ind = $scope.dashboard.widgets.indexOf(widget);
                            for(var i=0;i<$scope.dashboard.widgetData[ind].chart.length;i++){
                                if ($scope.dashboard.widgetData[ind].chart[i].api){
                                    $scope.dashboard.widgetData[ind].chart[i].api.update()
                                }
                            }
                        }
                    }
                    $timeout(updateCharts(widget),400);

                } // optional callback fired when item is finished resizing
            }
        };

        $scope.$on('gridster-resized', function(sizes, gridster) {
            //console.log('Gridster resized');
            for(var i=0;i<$scope.dashboard.widgets.length;i++){
                $timeout(resizeWidget(i), 100);
            }
            function resizeWidget(i) {
                return function() {
                    if(typeof $scope.dashboard.widgetData[i].chart != 'undefined'){
                        for(j=0;j<$scope.dashboard.widgetData[i].chart.length;j++){
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

        $scope.$watch('dashboard.widgets',function(newVal,oldVal){
            var inputParams = [];
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
                    };
                    inputParams.push(jsonData);
                }
                $http({
                    method: 'POST',
                    url: '/api/v1/widgets',
                    data: inputParams
                }).then(function successCallback(response){
                    //console.log('Response after updating widget', response);
                }, function errorCallback (error){
                    console.log('Error in getting widget id',error);
                    swal({  title: "", text: "<span style='sweetAlertFont'>Please try again! Something is missing</span> .",   html: true });
                });
            }
        },true);

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
                            if ($scope.dashboard.widgetData[i].chart[j].api){
                                $scope.dashboard.widgetData[i].chart[j].api.update();
                            }
                        }
                    }
                };
            }
        });

        $scope.calculateColumnWidth = function(x) {
            var y = Math.round(12/x);
            if(y<6)
                return ('col-sm-'+6+' col-md-'+6+' col-lg-'+6);
            else
                return ('col-sm-'+y+' col-md-'+y+' col-lg-'+y);
        };

        $scope.calculateRowHeight = function(availableHeight,noOfItems) {
            var cols = $window.innerWidth>=768 ? 2 : 1;
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
        $(".navbar").css('z-index','1');
        $(".md-overlay").css("background","rgba(0,0,0,0.5)");
        $("#getLoadingModalContent").addClass('md-show');
        isExportOptionSet=0;
        $scope.dashboard.widgets = [];
        $scope.dashboard.widgetData = [];
        $http({
            method: 'GET',
            url: '/api/v1/dashboards/widgets/'+ $state.params.id
        }).then(
            function successCallback(response) {
                $("#getLoadingModalContent").removeClass('md-show');
                var widgets = [];
                var dashboardWidgetList = response.data.widgetsList;
                if(dashboardWidgetList) {
                    $scope.widgetsPresent = true;
                } else {
                    $scope.widgetsPresent = false;
                }
                var widgetID=0;

                for(getWidgetInfo in dashboardWidgetList){
                    widgets.push(createWidgets.widgetDataFetchHandler(dashboardWidgetList[getWidgetInfo],{
                        'startDate': moment($scope.dashboardCalendar.start_date).format('YYYY-MM-DD'),
                        'endDate': moment($scope.dashboardCalendar.end_date).format('YYYY-MM-DD')
                    }));
                    widgetID = dashboardWidgetList[getWidgetInfo]._id;
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
                        'widgetType': (typeof dashboardWidgetList[getWidgetInfo].widgetType != 'undefined'? dashboardWidgetList[getWidgetInfo].widgetType : ''),
                        'id': dashboardWidgetList[getWidgetInfo]._id,
                        //'chart': {'api': {}},
                        'visibility': false
                    });
                    $scope.dashboard.widgetData.push({
                        'id':  dashboardWidgetList[getWidgetInfo]._id,
                        'chart': [],
                        'visibility': false,
                        'name': (typeof dashboardWidgetList[getWidgetInfo].name != 'undefined'? dashboardWidgetList[getWidgetInfo].name : ''),
                        'color': (typeof dashboardWidgetList[getWidgetInfo].color != 'undefined'? dashboardWidgetList[getWidgetInfo].color : '')
                    });

                    //Fetching the promise that contains all the data for the particular widget in the dashboard
                    widgets[getWidgetInfo].then(
                        function successCallback(widget){
                            var widgetIndex = $scope.dashboard.widgets.map(function(el) {return el.id;}).indexOf(widget._id);
                            var finalChartData = createWidgets.chartCreator(widget);
                            var widgetToBeLoaded = createWidgets.replacePlaceHolderWidget(widget,finalChartData);
                            widgetToBeLoaded.then(
                                function successCallback(widgetToBeLoaded){
                                    $scope.dashboard.widgetData[widgetIndex] = widgetToBeLoaded;
                                    //console.log('widgetData:',$scope.dashboard.widgetData[widgetIndex]);
                                    isExportOptionSet=1;
                                },
                                function errorCallback(error){
                                    console.log(error);
                                    isExportOptionSet=0;
                                    swal({
                                        title: "",
                                        text: "<span style='sweetAlertFont'>There has been an error in populating the widgets! Please refresh the dashboard again</span> .",
                                        html: true
                                    });
                                }
                            );
                        },
                        function errorCallback(error){
                            console.log(error);
                            console.log("Error for WidgetID : "+widgetID);
                            $("#widgetData-"+widgetID).hide();
                            $("#errorWidgetData-"+widgetID).show();
                            isExportOptionSet=0;
                        }
                    );
                }
            },
            function errorCallback(error) {
                console.log('Error in finding widgets in the dashboard', error);
                swal({
                    title: "",
                    text: "<span style='sweetAlertFont'>There has been an error in populating the widgets! Please refresh the dashboard again</span> .",
                    html: true
                });
                isExportOptionSet=0;
            }
        );
    };

    //To catch a request for a new widget creation and create the dashboard in the frontend
    $scope.$on('populateWidget', function(e,widget,dataDateRange){
        var inputWidget = [];
        var chartName;
        inputWidget.push(createWidgets.widgetDataFetchHandler(widget,{
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
            'id': widget._id,
            //'chart': {'api': {}},
            'visibility': false
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
                $("#getLoadingModalContent").removeClass('md-show');
                var widgetIndex = $scope.dashboard.widgets.map(function(el) {return el.id;}).indexOf(inputWidget[0]._id);
                var finalChartData = createWidgets.chartCreator(inputWidget[0]);
                var widgetToBeLoaded = createWidgets.replacePlaceHolderWidget(inputWidget[0],finalChartData);
                widgetToBeLoaded.then(
                    function successCallback(widgetToBeLoaded){
                        $scope.dashboard.widgetData[widgetIndex] = widgetToBeLoaded;
                    },
                    function errorCallback(error) {
                        console.log(error);
                        swal({
                            title: "",
                            text: "<span style='sweetAlertFont'>There has been an error in creating the widget! Please try again</span> .",
                            html: true
                        });
                    }
                );
            },
            function errorCallback(error){
                console.log(error);
            }
        );
    });

    //To download a pdf/jpeg version of the dashboard
    $scope.exportModal = function(value){
        if(isExportOptionSet==1){
            $state.go(value);
        }
        else{
            swal({
                title: "",
                text: "<span style='sweetAlertFont'>Something went wrong! Can't export at this moment</span> .",
                html: true
            });
        }
    };

    //To delete a widget from the dashboard
    $scope.deleteWidget = function(widget){
        var widgetId = widget.id;
        $http({
            method:'POST',
            url:'/api/v1/delete/widgets/' + widget.id
        }).then(
            function successCallback(response){
                for(items in $scope.dashboard.widgetData){
                    if($scope.dashboard.widgetData[items].id == widgetId)
                        $scope.dashboard.widgetData.splice(items,1);
                }
                if($scope.dashboard.widgets.length == 0)
                    $scope.widgetsPresent = false;
            },
            function errorCallback(error){
                console.log('Error in deleting the widget',error);
            }
        );
    };

    //To create alerts
    $scope.alertModal = function(value,widget){
        console.log('widget',widget);
        $rootScope.selectedWidget = widget;
        $state.go(value);
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
                        console.log('Error in deleting dashboard', error);
                    }
                );
            }
        );
    };

    var count =0;
    var color = '#F53F72';
    var size = '30px';
    var existCommentCheck = "";
    var existXaxis = "";
    var existYaxis = "";

    $rootScope.$on("getDashboardCommentsFunc", function(getValue){
        $scope.getDashboardComments(getValue);
    });

    $scope.getDashboardComments = function(){
        console.log("get dashboard comments from database");
        /*
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
        */
    };


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

                    /*
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
                     */

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

}