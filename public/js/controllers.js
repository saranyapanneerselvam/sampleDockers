var showMetricApp = angular.module('inspinia');

showMetricApp.service('createWidgets',function($http,$q){
    //To fetch data for a widget for given date range; format the same so that it can be loaded into nvd3 directive
    this.widgetDataFetchHandler = function(widget,chosenDateRange){

        var deferredWidget = $q.defer();
        var unformattedWidget = [];
        var finalWidget = [];
        var countCustomData = 0;
        var getCharts = getDataForChosenDates(widget,chosenDateRange);

        getCharts.then(function successCallback(charts){
            unformattedWidget = widget;

            if(unformattedWidget.widgetType=="custom"){
                // Need to get custom data
                // Need to get custom data
                unformattedWidget.charts = charts;

                for(i=0;i<unformattedWidget.charts.length;i++) {
                    for(getCustomName in unformattedWidget.charts[i].chartData){
                        // console.log(unformattedWidget.charts[i].chartData[getCustomName].name);
                    }
                }

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
                    finalWidget.then(function successCallback(finalWidget){
                        deferredWidget.resolve(finalWidget);
                    },function errorCallback(error){
                        console.log(error);
                        deferredWidget.reject(error);
                    });
                },function errorCallback(error){
                    console.log(error);
                    deferredWidget.reject(error);
                });
            }
        },function errorCallback(error){
            deferredWidget.reject(error);
        });
        return deferredWidget.promise;

        function getDataForChosenDates(widget,chosenDateRange) {
            var deferred = $q.defer();
            console.log("Widget Type : "+widget.widgetType);
            if(widget.widgetType=="custom"){
                $http({
                    method: 'POST',
                    url: '/api/v1/customWidget/data/' + widget._id,
                    data: {
                        "startDate": chosenDateRange.startDate,
                        "endDate": chosenDateRange.endDate
                    }
                }).then(function successCallback(response) {
                    //console.log(response);
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
                                    chartObjectId: response.data[j].objectId
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

        function formatDataPoints(widget) {
            var formattedWidget = $q.defer();
            var splitDate, newDate, inputDate;
            var getTimeStamp = "";
            var changedWidget = widget;
            for(i=0;i<widget.charts.length;i++){
                var formattedChartData = [];
                console.log(widget.charts[i].chartType);
                debugger;
                if(widget.charts[i].chartType=="cumulativeLine"){
                    console.log('In the else condition. Needs to be addressed as chart type is cumulativeLine');
                    console.log(widget.charts);

                    for(j=0;j<widget.charts[i].chartData.length;j++){

                        getTimeStamp = new Date(widget.charts[i].chartData[j].date).getTime();

                        console.log(widget.charts[i].chartData[j].name+" --- "+parseInt(widget.charts[i].chartData[j].total)+"  "+widget.charts[i].chartData[j].date+" --- "+getTimeStamp);

                        formattedChartData.push({key: widget.charts[i].chartData[j].name, values: [ [ getTimeStamp, parseInt(widget.charts[i].chartData[j].total) ]] });
                    }
                    changedWidget.charts[i].chartData = formattedChartData;

                }
                else if(widget.charts[i].chartType == 'line' || 'bar'){
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
                        for(j=0;j<widget.charts[i].chartData.length;j++){
                            formattedChartData.push({x: moment(widget.charts[i].chartData[j].date), y:widget.charts[i].chartData[j].total});
                        }
                        changedWidget.charts[i].chartData = formattedChartData;
                    }
                }
                else {
                    console.log('In the else condition. Needs to be addressed as chart type is different');
                }
            }
            formattedWidget.resolve(changedWidget);
            return formattedWidget.promise;
        }

    };

    //To load the data available for graphs into the widget
    this.dataLoader = function(widgetData){
        var widgetIndex;
        var graphData = [];
        graphData.lineData = []; graphData.barData = [];
        graphData.lineDataOptions = []; graphData.barDataOptions = [];
        graphData.cumulativeData = [];
        graphData.cumulativeDataOptions = [];

        for(var i=0;i<widgetData.charts.length;i++){
            var keyValue;
            if(widgetData.charts[i].metricDetails!=undefined){
                keyValue = widgetData.charts[i].metricDetails.name;
            }
            else{
                keyValue = "CustomName";
            }
            if(widgetData.charts[i].chartType == 'line'){
                graphData.lineData.push({
                    values: widgetData.charts[i].chartData,      //values - represents the array of {x,y} data points
                    key: keyValue, //key  - the name of the series.
                    color: '#7E57C2'  //color - optional: choose your own line color.
                });
            } else if (widgetData.charts[i].chartType == 'bar'){
                graphData.barData.push({
                    values: widgetData.charts[i].chartData,      //values - represents the array of {x,y} data points
                    key: keyValue, //key  - the name of the series.
                    color: '#7E57C2'  //color - optional: choose your own line color.
                });
            }

            else if (widgetData.charts[i].chartType == 'cumulativeLine'){
                console.log(widgetData.charts[i].chartData);
                graphData.cumulativeData.push({
                    values: widgetData.charts[i].chartData,      //values - represents the array of {x,y} data points
                    key: keyValue, //key  - the name of the series.

                });
            }
        }

        if(graphData.lineData != null){
            graphData.lineDataOptions = {
                chart: {
                    type: 'lineChart',
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
        if(graphData.cumulativeData != null){
            graphData.cumulativeDataOptions = {
                chart: {
                    type: 'cumulativeLineChart',
                    height: 450,
                    margin : {
                        top: 20,
                        right: 20,
                        bottom: 60,
                        left: 65
                    },
                    x: function(d){ return d[0]; },
                    y: function(d){ return d[1]/100; },
                    average: function(d) { return d.mean/100; },

                    color: d3.scale.category10().range(),
                    duration: 300,
                    useInteractiveGuideline: true,
                    clipVoronoi: false,

                    xAxis: {
                        axisLabel: 'X Axis',
                        tickFormat: function(d) {
                            return d3.time.format('%m/%d/%y')(new Date(d))
                        },
                        showMaxMin: false,
                        staggerLabels: true
                    },

                    yAxis: {
                        axisLabel: 'Y Axis',
                        tickFormat: function(d){
                            return d3.format(',.1%')(d);
                        },
                        axisLabelDistance: 20
                    }
                }
            }
        }

        var tempChart = {
            'options': graphData.lineDataOptions,
            'data': graphData.lineData,
            'api': {}
        };
        return(tempChart);
    };
});