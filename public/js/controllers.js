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
                                            'y': widget.charts[i].chartData[j].total
                                        };
                                        valuesArr.push(dataValues);
                                        formattedChartData[getData].values=valuesArr;
                                        IsAlreadyExist = 1;
                                    }
                                }

                                if (IsAlreadyExist != 1) {
                                    valuesArr = [];
                                    var dataValues = {
                                        'x': moment(widget.charts[i].chartData[j].date),
                                        'y': widget.charts[i].chartData[j].total
                                    };
                                    valuesArr.push(dataValues);
                                    formattedChartData.push({values:valuesArr,key: widget.charts[i].chartData[j].name, color:null});
                                }

                            }
                        }
                        changedWidget.charts[i].chartData = formattedChartData;
                    }
                }
                else if(widget.charts[i].chartType == 'bar'){
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
                                        'label': moment(widget.charts[i].chartData[j].date).format('MM/DD/YY'),
                                        'value': widget.charts[i].chartData[j].total
                                    };
                                    valuesArr.push(dataValues);
                                    formattedChartData[getData].values=valuesArr;
                                    IsAlreadyExist = 1;
                                }
                            }

                            if (IsAlreadyExist != 1) {
                                valuesArr = [];
                                var dataValues = {
                                    'label': moment(widget.charts[i].chartData[j].date).format('MM/DD/YY'),
                                    'value': widget.charts[i].chartData[j].total
                                };
                                valuesArr.push(dataValues);
                                formattedChartData.push({values:valuesArr,key: widget.charts[i].chartData[j].name, color:null});
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
                                    formattedChartData[getData].y=parseInt(yValue)+parseInt(widget.charts[i].chartData[j].total);
                                    IsAlreadyExist = 1;
                                }
                            }

                            if (IsAlreadyExist != 1) {

                                formattedChartData.push({y:parseInt(widget.charts[i].chartData[j].total),key: widget.charts[i].chartData[j].name, color:null});
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

    //To load the data available for graphs into the widget
    this.dataLoader = function(widgetData){
        var widgetIndex;
        var tempChart = [];

        var graphData = [];
        graphData.lineData = []; graphData.barData = [];
        graphData.lineDataOptions = []; graphData.barDataOptions = [];
        graphData.pieData = []; graphData.pieDataOptions = [];

        for(var i=0;i<widgetData.charts.length;i++){
            if(widgetData.charts[i].chartType == 'line'){
                if(widgetData.charts[i].metricDetails!=undefined){
                    graphData.lineData.push({
                        values: widgetData.charts[i].chartData,      //values - represents the array of {x,y} data points
                        key: widgetData.charts[i].metricDetails.name, //key  - the name of the series.
                        color: '#7E57C2'  //color - optional: choose your own line color.
                    });
                }
                else{
                    for(customData in widgetData.charts[i].chartData){
                        graphData.lineData.push({
                            values: widgetData.charts[i].chartData[customData].values,      //values - represents the array of {x,y} data points
                            key: widgetData.charts[i].chartData[customData].key, //key  - the name of the series.
                            color: widgetData.charts[i].chartData[customData].color  //color - optional: choose your own line color.
                        });
                    }
                }
                graphData.lineDataOptions = {
                    chart: {
                        type: 'lineChart',
                        margin : {top: 20, right: 20, bottom: 40, left: 55},
                        x: function(d){ return d.x; },
                        y: function(d){ return d.y; },
                        useInteractiveGuideline: true,
                        xAxis: {
                            axisLabel: 'Date',
                            tickFormat: function(d) {
                                return d3.time.format('%m/%d/%y')(new Date(d))}
                        },
                        yAxis: {
                            axisLabel: 'Value'
                        },
                        axisLabelDistance: -10
                    }
                };
                tempChart.push({
                    'options': graphData.lineDataOptions,
                    'data': graphData.lineData
                });
            }
            else if (widgetData.charts[i].chartType == 'bar'){
                if(widgetData.charts[i].metricDetails!=undefined){
                    graphData.barData.push({
                        values: widgetData.charts[i].chartData,      //values - represents the array of {x,y} data points
                        key: widgetData.charts[i].metricDetails.name, //key  - the name of the series.
                        color: '#7E57C2'  //color - optional: choose your own line color.
                    });
                }
                else{
                    for(customData in widgetData.charts[i].chartData){
                        graphData.barData.push({
                            values: widgetData.charts[i].chartData[customData].values,      //values - represents the array of {x,y} data points
                            key: widgetData.charts[i].chartData[customData].key, //key  - the name of the series.
                            color: widgetData.charts[i].chartData[customData].color  //color - optional: choose your own line color.
                        });
                    }
                }
                graphData.barDataOptions = {
                    chart: {
                        type: 'multiBarChart',
                        margin : {top: 20, right: 20, bottom: 40, left: 65},
                        x: function(d){ return d.x; },
                        y: function(d){ return d.y; },
                        useInteractiveGuideline: true,
                        xAxis: {
                            axisLabel: 'Date',
                            tickFormat: function(d) {
                                return d3.time.format('%m/%d/%y')(new Date(d))}
                        },
                        yAxis: {
                            axisLabel: 'Value',
                            axisLabelDistance: -10
                        }
                    }
                };
                tempChart.push({
                    'options': graphData.barDataOptions,
                    'data': graphData.barData
                });
            }
            else if(widgetData.charts[i].chartType == 'pie'){
                if(widgetData.charts[i].metricDetails!=undefined){
                    graphData.pieData.push({
                        y: parseInt(widgetData.charts[i].chartData[customData].y),
                        key: widgetData.charts[i].metricDetails.name, //key  - the name of the series.
                        color: '#7E57C2'  //color - optional: choose your own line color.
                    });
                }
                else{
                    for(customData in widgetData.charts[i].chartData){
                        graphData.pieData.push({
                            y: parseInt(widgetData.charts[i].chartData[customData].y),
                            key: widgetData.charts[i].chartData[customData].key, //key  - the name of the series.
                            color: widgetData.charts[i].chartData[customData].color  //color - optional: choose your own line color.
                        });
                    }
                }
                graphData.pieDataOptions.push = {
                    chart: {
                        type: 'pieChart',
                        height: 500,
                        x: function(d){return d.key;},
                        y: function(d){return d.y;},
                        showLabels: true,
                        duration: 500,
                        labelThreshold: 0.01,
                        labelSunbeamLayout: true,
                        legend: {
                            margin: {
                                top: 5,
                                right: 35,
                                bottom: 5,
                                left: 0
                            }
                        }
                    }
                };
                tempChart.push({
                    'options': graphData.pieDataOptions,
                    'data': graphData.pieData
                });
            }
        }


/*
        if(graphData.lineData != null){
            graphData.lineDataOptions = {
                chart: {
                    type: 'lineChart',
                    margin : {top: 20, right: 20, bottom: 40, left: 55},
                    x: function(d){ return d.x; },
                    y: function(d){ return d.y; },
                    useInteractiveGuideline: true,
                    xAxis: {
                        axisLabel: 'Date',
                        tickFormat: function(d) {
                            return d3.time.format('%m/%d/%y')(new Date(d))}
                    },
                    yAxis: {
                        axisLabel: 'Value'
                    },
                    axisLabelDistance: -10
                }
            }
            tempChart = {
                'options': graphData.lineDataOptions,
                'data': graphData.lineData,
                'api': {}
            };
        }

        if(graphData.barData != null){
            graphData.barDataOptions = {
                chart: {
                    type: 'discreteBarChart',
                    height: 450,
                    margin : {
                        top: 20,
                        right: 20,
                        bottom: 50,
                        left: 55
                    },
                    x: function(d){return d.label;},
                    y: function(d){return d.value + (1e-10);},
                    showValues: true,
                    valueFormat: function(d){
                        return d3.format(',.4f')(d);
                    },
                    duration: 500,
                    xAxis: {
                        axisLabel: 'Date'
                    },
                    yAxis: {
                        axisLabel: 'Value',
                        axisLabelDistance: -10
                    }
                }
            }

            // tempChart = {
            //     'options': graphData.barDataOptions,
            //     'data': graphData.barData,
            //     'api': {}
            // };
        }


        if(graphData.pieData != null){
            graphData.pieDataOptions = {
                chart: {
                    type: 'pieChart',
                    height: 500,
                    x: function(d){return d.key;},
                    y: function(d){return d.y;},
                    showLabels: true,
                    duration: 500,
                    labelThreshold: 0.01,
                    labelSunbeamLayout: true,
                    legend: {
                        margin: {
                            top: 5,
                            right: 35,
                            bottom: 5,
                            left: 0
                        }
                    }
                }
            }

            // tempChart = {
            //     'options': graphData.pieDataOptions,
            //     'data': graphData.pieData,
            //     'api': {}
            // };
        }
*/

        console.log(tempChart);
        return(tempChart);
    };
});