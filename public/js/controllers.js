var showMetricApp = angular.module('inspinia');

showMetricApp.service('createWidgets',function($http,$q){

    //To fetch data for a widget for given date range; format the same
    this.widgetDataFetchHandler = function(widget,chosenDateRange){

        var deferredWidget = $q.defer();
        var unformattedWidget = [];
        var finalWidget = [];
        var countCustomData = 0;

        //Calling function to fetch data for all charts within a widget
        var getCharts = getDataForChosenDates(widget,chosenDateRange);

        //Acquiring data for all the charts within the widget through promise and then fetching metric details for all charts within the widget
        getCharts.then(function successCallback(charts){
            unformattedWidget = widget;
            if(unformattedWidget.widgetType=="custom"){

                unformattedWidget.charts = charts;

                finalWidget = formatDataPoints(unformattedWidget);
                finalWidget.then(function successCallback(finalWidget){
                    deferredWidget.resolve(finalWidget);
                },function errorCallback(error){
                    console.log(error);
                    deferredWidget.reject(error);
                });
            }
            else{
                unformattedWidget.charts = charts;
                var metricDetailsArray = [];

                for(i=0;i<unformattedWidget.charts.length;i++){
                    metricDetailsArray.push(fetchMetricDetailsForCharts(unformattedWidget.charts[i]));
                }
                $q.all(metricDetailsArray).then(function successCallback(metricDetailsArray){
                    for(i=0;i<unformattedWidget.charts.length;i++){
                        unformattedWidget.charts[i].metricDetails = metricDetailsArray[i];
                    }
                    finalWidget = formatDataPoints(unformattedWidget);
                    finalWidget.then(
                        function successCallback(finalWidget){
                            deferredWidget.resolve(finalWidget);
                        },
                        function errorCallback(error){
                            console.log(error);
                            deferredWidget.reject(error);
                        }
                    );
                },function errorCallback(error){
                    console.log(error);
                    deferredWidget.reject(error);
                });
            }
        },function errorCallback(error){
            deferredWidget.reject(error);
        });
        //Returning the charts(along with associated metrics) to the calling function
        return deferredWidget.promise;

        //Function to fetch data for the input date range
        function getDataForChosenDates(widget,chosenDateRange) {
            var deferred = $q.defer();
            if(widget.widgetType=="custom"){
                $http({
                    method: 'POST',
                    url: '/api/v1/customWidget/data/' + widget._id,
                    data: {
                        "startDate": chosenDateRange.startDate,
                        "endDate": chosenDateRange.endDate
                    }
                }).then(function successCallback(response) {
                    var formattedCharts = [];
                    countCustomData++;
                    for(getData in response.data){
                        if(response.data[getData].widgetId==widget._id){
                            formattedCharts.push({
                                _id: response.data[getData]._id,
                                chartName: "Custom Data "+countCustomData,
                                chartType: response.data[getData].chartType,
                                widgetId: response.data[getData].widgetId,
                                chartData: response.data[getData].data,
                                intervalType: response.data[getData].intervalType,
                                metricsCount: response.data[getData].metricsCount
                            });
                        }
                    }
                    deferred.resolve(formattedCharts);
                }, function errorCallback(error) {
                    deferred.reject(error);
                });
                return deferred.promise;
            }
            else {
                var formattedCharts = [];
                $http({
                    method: 'POST',
                    url: '/api/v1/widgets/data/' + widget._id,
                    data: {
                        "startDate": chosenDateRange.startDate,
                        "endDate": chosenDateRange.endDate
                    }
                }).then(function successCallback(response) {
                    for(i=0;i<widget.charts.length;i++){
                        for(j=0;j<response.data.length;j++){
                            if(String(widget.charts[i].metrics[0].metricId) === String(response.data[j].metricId)){
                                formattedCharts.push({
                                    channelId: widget.charts[i].channelId,
                                    chartName: widget.charts[i].name,
                                    chartType: widget.charts[i].metrics[0].chartType,
                                    chartObjectTypeId: widget.charts[i].metrics[0].objectTypeId,
                                    chartData: response.data[j].data,
                                    chartMetricId: response.data[j].metricId,
                                    chartObjectId: response.data[j].objectId,
                                    chartColour: widget.charts[i].colour,
                                    chartObjectName: widget.charts[i].objectName
                                });
                            }
                        }
                    }
                    deferred.resolve(formattedCharts);
                }, function errorCallback(error) {
                    deferred.reject(error);
                });
                return deferred.promise;
            }
        }

        //Function to fetch metrics for all charts inside a widget
        function fetchMetricDetailsForCharts(chart) {
            var deferred = $q.defer();
            if(chart.chartMetricId==undefined){

            }
            else{
                $http({
                    method:'GET',
                    url:'/api/v1/get/metricDetails/' + chart.chartMetricId
                }).then(function successCallback(response){
                    deferred.resolve(response.data.metricsList[0]);
                },function errorCallback(error){
                    deferred.reject(error);
                });
            }

            return deferred.promise;
        }

        //Function to format the data in all the charts inside a widget
        function formatDataPoints(widget) {
            var formattedWidget = $q.defer();
            var splitDate, newDate, inputDate;
            var changedWidget = widget;
            for(i=0;i<widget.charts.length;i++){
                var formattedChartData = [];
                var valuesArr = new Array();
                if(widget.charts[i].chartType == 'line'){
                    if(typeof(widget.charts[i].chartData[0].total) === 'object') {
                        var endpoint;
                        for(j=0;j<widget.charts[i].metricDetails.objectTypes.length;j++){
                            if(widget.charts[i].metricDetails.objectTypes[j].objectTypeId == widget.charts[i].chartObjectTypeId){
                                endpoint = widget.charts[i].metricDetails.objectTypes[j].meta.endpoint;
                            }
                        }
                        for(j=0;j<widget.charts[i].chartData.length;j++){
                            formattedChartData.push({x: moment(widget.charts[i].chartData[j].date), y:widget.charts[i].chartData[j].total[endpoint]});
                        }
                        changedWidget.charts[i].chartData = formattedChartData;
                    } else {
                        var setCustomDataArr = new Array();

                        for(j=0;j<widget.charts[i].chartData.length;j++){
                            if(widget.charts[i].chartData[j].name==undefined){
                                formattedChartData.push({x: moment(widget.charts[i].chartData[j].date), y:widget.charts[i].chartData[j].total});
                            }
                            else{
                                var IsAlreadyExist = 0;
                                for(getData in formattedChartData){

                                    if(formattedChartData[getData].key==widget.charts[i].chartData[j].name){
                                        valuesArr = formattedChartData[getData].values;
                                        var dataValues = {
                                            'x': moment(widget.charts[i].chartData[j].date),
                                            'y': widget.charts[i].chartData[j].values
                                        };
                                        valuesArr.push(dataValues);
                                        valuesArr.sort(function(a,b){
                                            var c = new Date(a.x);
                                            var d = new Date(b.x);
                                            return c-d;
                                        });
                                        formattedChartData[getData].values=valuesArr;
                                        IsAlreadyExist = 1;
                                    }
                                }

                                if (IsAlreadyExist != 1) {
                                    valuesArr = [];
                                    var dataValues = {
                                        'x': moment(widget.charts[i].chartData[j].date),
                                        'y': widget.charts[i].chartData[j].values
                                    };
                                    valuesArr.push(dataValues);
                                    valuesArr.sort(function(a,b){
                                        var c = new Date(a.x);
                                        var d = new Date(b.x);
                                        return c-d;
                                    });
                                    formattedChartData.push({values:valuesArr,key: widget.charts[i].chartData[j].name, color:null});
                                }

                            }
                        }
                        changedWidget.charts[i].chartData = formattedChartData;
                    }
                }
                else if(widget.charts[i].chartType == 'bar'){

                    if(typeof(widget.charts[i].chartData[0].total) === 'object') {
                        var endpoint;
                        for(j=0;j<widget.charts[i].metricDetails.objectTypes.length;j++){
                            if(widget.charts[i].metricDetails.objectTypes[j].objectTypeId == widget.charts[i].chartObjectTypeId){
                                endpoint = widget.charts[i].metricDetails.objectTypes[j].meta.endpoint;
                            }
                        }
                        for(j=0;j<widget.charts[i].chartData.length;j++){
                            formattedChartData.push({x: moment(widget.charts[i].chartData[j].date), y:widget.charts[i].chartData[j].total[endpoint]});
                        }
                        changedWidget.charts[i].chartData = formattedChartData;
                    } else {
                        var setCustomDataArr = new Array();

                        for(j=0;j<widget.charts[i].chartData.length;j++){
                            if(widget.charts[i].chartData[j].name==undefined){
                                formattedChartData.push({x: moment(widget.charts[i].chartData[j].date), y:widget.charts[i].chartData[j].total});
                            }
                            else{
                                var IsAlreadyExist = 0;
                                for(getData in formattedChartData){

                                    if(formattedChartData[getData].key==widget.charts[i].chartData[j].name){
                                        valuesArr = formattedChartData[getData].values;
                                        var dataValues = {
                                            'x': moment(widget.charts[i].chartData[j].date),
                                            'y': widget.charts[i].chartData[j].values
                                        };
                                        valuesArr.push(dataValues);
                                        valuesArr.sort(function(a,b){
                                            var c = new Date(a.x);
                                            var d = new Date(b.x);
                                            return c-d;
                                        });
                                        formattedChartData[getData].values=valuesArr;
                                        IsAlreadyExist = 1;
                                    }
                                }

                                if (IsAlreadyExist != 1) {
                                    valuesArr = [];
                                    var dataValues = {
                                        'x': moment(widget.charts[i].chartData[j].date),
                                        'y': widget.charts[i].chartData[j].values
                                    };
                                    valuesArr.push(dataValues);
                                    valuesArr.sort(function(a,b){
                                        var c = new Date(a.x);
                                        var d = new Date(b.x);
                                        return c-d;
                                    });
                                    formattedChartData.push({values:valuesArr,key: widget.charts[i].chartData[j].name, color:null});
                                }

                            }
                        }
                    }
                    changedWidget.charts[i].chartData = formattedChartData;
                }
                else if(widget.charts[i].chartType == 'pie'){
                    var setCustomDataArr = new Array();

                    for(j=0;j<widget.charts[i].chartData.length;j++){
                        if(widget.charts[i].chartData[j].name==undefined){
                            formattedChartData.push({x: moment(widget.charts[i].chartData[j].date), y:widget.charts[i].chartData[j].total});
                        }
                        else{
                            var IsAlreadyExist = 0;
                            for(getData in formattedChartData){
                                var yValue = 0;
                                if(formattedChartData[getData].key==widget.charts[i].chartData[j].name){
                                    yValue = parseInt(formattedChartData[getData].y);
                                    formattedChartData[getData].y=parseInt(yValue)+parseInt(widget.charts[i].chartData[j].values);
                                    IsAlreadyExist = 1;
                                }
                            }

                            if (IsAlreadyExist != 1) {

                                formattedChartData.push({y:parseInt(widget.charts[i].chartData[j].values),key: widget.charts[i].chartData[j].name, color:null});
                            }

                        }
                    }
                    changedWidget.charts[i].chartData = formattedChartData;
                }
            }
            formattedWidget.resolve(changedWidget);
            return formattedWidget.promise;
        }

    };

    //To load the data available for graphs into nvd3 format as per the chart type and to group the graphs by chart type
    this.dataLoader = function(widgetData){
        var tempChart = [];
        var graphData = [];
        graphData.lineData = []; graphData.barData = []; graphData.pieData = [];
        graphData.lineDataOptions = null; graphData.barDataOptions = null; graphData.pieDataOptions = null;


        if(widgetData.charts==[] || widgetData.charts==""){
            var customDataUrl = "";
            if(widgetData.widgetType=="custom"){
                if(window.location.hostname=="localhost"){
                    customDataUrl = "http://localhost:8080/api/v1/create/customdata/"+widgetData._id;
                }
                else{
                    customDataUrl = window.location.hostname+"/api/v1/create/customdata/"+widgetData._id;
                }
            }
            else{
                // For other widgetType
            }
            graphData.lineDataOptions = {
                chart: {
                    type: 'lineChart',
                    noData: customDataUrl,
                    xAxis: {
                        showMaxMin: false,
                        tickFormat: function(d) {
                            return d3.time.format('%d/%m %H:%M')(new Date(d));
                        }
                    }
                }
            };
            graphData.lineData.push({
                values: [],
                key: "noData",
                color: '#7E57C2'
            });

        }
        else {
            for(var i=0;i<widgetData.charts.length;i++){
                if(widgetData.charts[i].chartType == 'line'){
                    var displaySummaryLineData = 0;
                    if(widgetData.charts[i].metricDetails!=undefined){
                        for(j=0;j<widgetData.charts[i].chartData.length;j++){
                            displaySummaryLineData = displaySummaryLineData + parseInt(widgetData.charts[i].chartData[j].y);
                        }
                        graphData.lineData.push({
                            values: widgetData.charts[i].chartData,      //values - represents the array of {x,y} data points
                            key: widgetData.charts[i].metricDetails.name, //key  - the name of the series.
                            color: widgetData.charts[i].chartColour,  //color - optional: choose your own line color.
                            summaryDisplay: displaySummaryLineData,
                            area: true
                        });
                    }
                    else{
                        for(customData in widgetData.charts[i].chartData){
                            for(getTotal in widgetData.charts[i].chartData[customData].values){
                                displaySummaryLineData = displaySummaryLineData + parseInt(widgetData.charts[i].chartData[customData].values[getTotal].y);
                            }
                            graphData.lineData.push({
                                values: widgetData.charts[i].chartData[customData].values,      //values - represents the array of {x,y} data points
                                key: widgetData.charts[i].chartData[customData].key, //key  - the name of the series.
                                color: widgetData.charts[i].chartData[customData].color,  //color - optional: choose your own line color.
                                summaryDisplay: displaySummaryLineData,
                                area: true
                            });
                            displaySummaryLineData=0;
                        }
                    }
                    graphData.lineDataOptions = {
                        chart: {
                            type: 'lineChart',
                            margin : {top: 20, right: 25, bottom: 30, left: 35},
                            x: function(d){ return d.x; },
                            y: function(d){ return d.y; },
                            useInteractiveGuideline: true,
                            xAxis: {
                                //axisLabel: 'Date',
                                tickFormat: function(d) {
                                    return d3.time.format('%d/%m/%y')(new Date(d))}
                            },
                            yAxis: {
                                //axisLabel: 'Value'
                                tickFormat: function(d) {
                                    return d3.format('f')(d);}
                            },
                            axisLabelDistance: -10,
                            showLegend: false
                        }
                    };
                }
                else if (widgetData.charts[i].chartType == 'bar'){
                    var displaySummaryBarData = 0;
                    if(widgetData.charts[i].metricDetails!=undefined){
                        for(j=0;j<widgetData.charts[i].chartData.length;j++){
                            displaySummaryBarData = displaySummaryBarData + parseInt(widgetData.charts[i].chartData[j].y);
                        }
                        graphData.barData.push({
                            values: widgetData.charts[i].chartData,      //values - represents the array of {x,y} data points
                            key: widgetData.charts[i].metricDetails.name, //key  - the name of the series.
                            color: widgetData.charts[i].chartColour,  //color - optional: choose your own line color.
                            summaryDisplay: displaySummaryBarData
                        });
                    }
                    else{
                        for(customData in widgetData.charts[i].chartData){
                            for(getTotal in widgetData.charts[i].chartData[customData].values){
                                displaySummaryBarData = displaySummaryBarData + parseInt(widgetData.charts[i].chartData[customData].values[getTotal].y);
                            }
                            graphData.barData.push({
                                values: widgetData.charts[i].chartData[customData].values,      //values - represents the array of {x,y} data points
                                key: widgetData.charts[i].chartData[customData].key, //key  - the name of the series.
                                color: widgetData.charts[i].chartData[customData].color,  //color - optional: choose your own line color.
                                summaryDisplay: displaySummaryBarData
                            });
                            displaySummaryBarData = 0;
                        }
                    }
                    graphData.barDataOptions = {
                        chart: {
                            type: 'multiBarChart',
                            margin : {top: 20, right: 25, bottom: 30, left: 35},
                            x: function(d){ return d.x; },
                            y: function(d){ return d.y; },
                            useInteractiveGuideline: true,
                            xAxis: {
                                //axisLabel: 'Date',
                                tickFormat: function(d) {
                                    return d3.time.format('%d/%m/%y')(new Date(d))}
                            },
                            yAxis: {
                                //axisLabel: 'Value',
                                tickFormat: function(d) {
                                    return d3.format('f')(d);}
                            },
                            axisLabelDistance: -10,
                            showLegend: false
                        }
                    };
                }
                else if(widgetData.charts[i].chartType == 'pie'){
                    var displaySummaryPieData =0;
                    if(widgetData.charts[i].metricDetails!=undefined){
                        graphData.pieData.push({
                            y: parseInt(widgetData.charts[i].chartData[customData].y),
                            key: widgetData.charts[i].metricDetails.name, //key  - the name of the series.
                            color: widgetData.charts[i].chartColour  //color - optional: choose your own line color.
                        });
                    }
                    else{

                        for(customData in widgetData.charts[i].chartData){
                            displaySummaryPieData = displaySummaryPieData + parseInt(widgetData.charts[i].chartData[customData].y);
                            graphData.pieData.push({
                                y: parseInt(widgetData.charts[i].chartData[customData].y),
                                key: widgetData.charts[i].chartData[customData].key, //key  - the name of the series.
                                color: widgetData.charts[i].chartData[customData].color,  //color - optional: choose your own line color.
                                summaryDisplay: displaySummaryPieData
                            });
                            displaySummaryPieData =0;
                        }
                    }
                    graphData.pieDataOptions = {
                        chart: {
                            type: 'pieChart',
                            margin : {top: 0, right: 15, bottom: 15, left: 15},
                            x: function (d) {
                                return d.key;
                            },
                            y: function (d) {
                                return d.y;
                            },
                            showLabels: false,
                            duration: 500,
                            labelThreshold: 0.01,
                            labelSunbeamLayout: true,
                            legend: {
                                margin: {
                                    top: 0,
                                    right: 0,
                                    bottom: 0,
                                    left: 0
                                }
                            }
                        }
                    };
                }
            }
        }



        if(graphData.lineDataOptions !== null)
            tempChart.push({
                'options': graphData.lineDataOptions,
                'data': graphData.lineData,
                'api': {}
        });
        if(graphData.barDataOptions !== null)
            tempChart.push({
                'options': graphData.barDataOptions,
                'data': graphData.barData,
                'api': {}
        });
        if(graphData.pieDataOptions !== null)
            tempChart.push({
                'options': graphData.pieDataOptions,
                'data': graphData.pieData,
                'api': {}
        });

        return(tempChart);
    };

    //To load the fetched data into the placeholder widget
    this.replacePlaceHolderWidget = function(widget,finalChartData){
        var finalWidget = $q.defer();
        var sizeY,sizeX,chartsCount,individualGraphWidthDivider,individualGraphHeightDivider,chartName;
        var displayData = [];
        var widgetLayoutOptions = [
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
        
/*
        for(i=0;i<finalChartData.length;i++){
            displayData[i] = [];
            for(j=0;j<finalChartData[i].data.length;j++){
                var temp = 0;
                for(k=0;k<finalChartData[i].data[j].values.length;k++){
                    temp = temp + parseInt(finalChartData[i].data[j].values[k].y);
                }
                displayData[i].push(temp);
            }
        }
        console.log(displayData);
*/

        var setLayoutOptions = function() {
            sizeY = typeof widget.size != 'undefined'? widget.size.h : 3;
            sizeX = typeof widget.size != 'undefined'? widget.size.w : 3;
            chartsCount = finalChartData.length;
            for(var i=0;i<widgetLayoutOptions.length;i++){
                if(widgetLayoutOptions[i].W == sizeX && widgetLayoutOptions[i].H == sizeY && widgetLayoutOptions[i].N == chartsCount){
                    individualGraphWidthDivider = widgetLayoutOptions[i].c;
                    individualGraphHeightDivider = widgetLayoutOptions[i].r;
                }
            }
        };
        setLayoutOptions();

        if(widget.charts==[] || widget.charts==""){
            chartName = "No Data Found";
        }
        else {
            chartName = (typeof widget.name != 'undefined'? widget.name + ' - ' : '');
            var objectNames = [],uniqueNames = [];
            for(i=0;i<widget.charts.length;i++){
                objectNames.push(widget.charts[i].chartObjectName);
            }
            $.each(objectNames, function(i ,el){
                if($.inArray(el, uniqueNames) === -1){
                    uniqueNames.push(el);
                }
            });
            chartName = chartName.concat(uniqueNames);
        }

        var modifiedWidget = {
/*
            'row': 0,
            'col': 0,
            'sizeY': (typeof widget.size != 'undefined'? widget.size.h : 2),
            'sizeX': (typeof widget.size != 'undefined'? widget.size.w : 2),
            'minSizeY': (typeof widget.minSize != 'undefined'? widget.minSize.h : 1),
            'minSizeX': (typeof widget.minSize != 'undefined'? widget.minSize.w : 1),
            'maxSizeY': (typeof widget.maxSize != 'undefined'? widget.maxSize.h : 3),
            'maxSizeX': (typeof widget.maxSize != 'undefined'? widget.maxSize.w : 3),
*/
            'name': chartName,
            'visibility': true,
            'id': widget._id,
            'color': widget.color,
            'chart': finalChartData,
            //'display': displayData,
            'layoutOptionsX': individualGraphWidthDivider,
            'layoutOptionsY': individualGraphHeightDivider
        };
        //console.log(modifiedWidget);
        finalWidget.resolve(modifiedWidget);
        return finalWidget.promise;
    };

});


showMetricApp.service('generateChartColours',function(){

    //To fetch colours for all the charts in a widget
    this.fetchRandomColors = function (iterator) {
        var colourChart = ['#EF5350', '#EC407A', '#9C27B0', '#42A5F5', '#26A69A', '#FFCA28', '#FF7043', '#8D6E63'];
        var colourRepeatChecker = [];

        var randomColour;

        while(colourRepeatChecker.length<iterator) {
            randomColour = colourChart[Math.floor(Math.random() * (colourChart.length - 1))+1];
            if(colourRepeatChecker.indexOf(randomColour) == -1) {
                colourRepeatChecker.push(randomColour);
            } else if(colourRepeatChecker.length>colourChart.length){
                if(colourRepeatChecker.indexOf(randomColour,(colourChart.length-1)) == -1)
                    colourRepeatChecker.push(randomColour);
            }
        }
        return colourRepeatChecker;
    };

    //To fetch colours for the widget header
    this.fetchWidgetColor = function (channelName) {
        var colourChart = ['#EF5350','#EC407A','#9C27B0','#42A5F5','#26A69A','#FFCA28','#FF7043','#8D6E63'];
        var widgetColor;
        switch (channelName){
            case 'Facebook':
                widgetColor = '#EF5350';
                break;
            case 'Google Analytics':
                widgetColor = '#EC407A';
                break;
            case 'Twitter':
                widgetColor = '#9C27B0';
                break;
            case 'FacebookAds':
                widgetColor = '#42A5F5';
                break;
            case 'GoogleAdwords':
                widgetColor = '#26A69A';
                break;
            case 'Instagram':
                widgetColor = '#FFCA28';
                break;
            default:
                widgetColor = '#FF7043';
                break;
        }

        return widgetColor;
    };
});

