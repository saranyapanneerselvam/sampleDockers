var showMetricApp = angular.module('inspinia');

showMetricApp.service('createWidgets',function($http,$q){

    //To fetch data for a widget for given date range; fetching the metric details for all the charts inside the widget
    this.widgetDataFetchHandler = function(widget,chosenDateRange){

        var deferredWidget = $q.defer(),
            finalWidget = [],
            countCustomData = 0;

        //Calling function to fetch data for all charts within a widget. Widget object and the date range are passed as inputs
        var getCharts = getDataForChosenDates(widget,chosenDateRange);

        //Acquiring data for all the charts within the widget through promise and then fetching metric details for all charts within the widget
        getCharts.then(

            //On successful data fetching for all the charts within the widget, the metric details for the corresponding charts have to be fetched as well
            function successCallback(updatedCharts){

                //Different logic for custom and regular widgets implemented as the data structure for custom widgets is different
                if(widget.widgetType=="custom"){
                    widget.charts = updatedCharts;
                    finalWidget = formatDataPoints(widget);
                    finalWidget.then(
                        function successCallback(finalWidget){
                            deferredWidget.resolve(finalWidget);
                        },
                        function errorCallback(error){
                            console.log(error);
                            deferredWidget.reject(error);
                        }
                    );
                }
                else if (widget.widgetType=="basic" || "adv" || "fusion"){
                    widget.charts = updatedCharts;
                    var metricDetails = [];

                    //Fetching metricDetails for all the charts inside the widget one by one
                    for(chartObjects in widget.charts)
                        metricDetails.push(fetchMetricDetailsForAllChartsInWidgets(widget.charts[chartObjects]));

                    //Pushing all the metricDetails fetched into the corresponding charts
                    $q.all(metricDetails).then(
                        function successCallback(metricDetails){
                            for(items in widget.charts){
                                widget.charts[items].metricDetails = metricDetails[items];
                            }
                            finalWidget = formatDataPoints(widget);
                            finalWidget.then(
                                function successCallback(finalWidget){
                                    //Resolving the changed widget with data for all the charts including the metric details for the corresponding charts
                                    deferredWidget.resolve(finalWidget);
                                },
                                function errorCallback(error){
                                    console.log(error);
                                    deferredWidget.reject(error);
                                }
                            );
                        },
                        function errorCallback(error){
                            console.log(error);
                            deferredWidget.reject(error);
                        }
                    );
                }
                else {
                    deferredWidget.reject("error");
                }
            },
            //If there is any error in fetching the data for any or all of the charts within the widget, then the promise will be rejected and error message will be sent to the calling function
            function errorCallback(error){
                deferredWidget.reject(error);
            }
        );
        //Returning the charts(along with associated metrics) to the calling function
        return deferredWidget.promise;

        //Function to fetch data for the input date range for all the charts defined inside a widget
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
                }).then(
                    function successCallback(response) {
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
                    },
                    function errorCallback(error) {
                        deferred.reject(error);
                    }
                );
                return deferred.promise;
            }
            else if(widget.widgetType=="basic" || "adv" || "fusion"){
                var updatedCharts = [];
                $http({
                    method: 'POST',
                    url: '/api/v1/widgets/data/' + widget._id,
                    data: {
                        "startDate": chosenDateRange.startDate,
                        "endDate": chosenDateRange.endDate
                    }
                }).then(
                    function successCallback(response) {
                        console.log(response);
                        for(chartObjects in widget.charts){
                            for(dataObjects in response.data){
                                if(String(widget.charts[chartObjects].metrics[0].metricId) === String(response.data[dataObjects].metricId)){
                                    updatedCharts.push({
                                        channelId: widget.charts[chartObjects].channelId,
                                        chartName: widget.charts[chartObjects].name,
                                        chartType: widget.charts[chartObjects].metrics[0].chartType,
                                        chartObjectTypeId: widget.charts[chartObjects].metrics[0].objectTypeId,
                                        chartData: response.data[dataObjects].data,
                                        chartMetricId: response.data[dataObjects].metricId,
                                        chartObjectId: response.data[dataObjects].objectId,
                                        chartColour: widget.charts[chartObjects].metrics[0].color,
                                        chartObjectName: widget.charts[chartObjects].objectName
                                    });
                                }
                            }
                        }
                        deferred.resolve(updatedCharts);
                    },
                    function errorCallback(error) {
                        deferred.reject(error);
                    }
                );
                return deferred.promise;
            }
            else {
                deferred.reject("error");
                return deferred.promise;
            }
        }

        //Function to fetch metrics for all charts inside a widget
        function fetchMetricDetailsForAllChartsInWidgets(chart) {

            var deferred = $q.defer();

            if(chart.chartMetricId==undefined){
                deferred.reject("error");
            }
            else{
                $http({
                    method:'GET',
                    url:'/api/v1/get/metricDetails/' + chart.chartMetricId
                }).then(
                    function successCallback(response){
                        deferred.resolve(response.data.metricsList[0]);
                    },
                    function errorCallback(error){
                        deferred.reject(error);
                    }
                );
            }

            return deferred.promise;
        }

        //Function to format the data in all the charts inside a widget
        function formatDataPoints(widget) {
            var formattedWidget = $q.defer();
            var splitDate, newDate, inputDate;
            var changedWidget = JSON.parse(JSON.stringify(widget));

/*
            for(var i = 0; i < widget.charts.length; i++) {
                if (typeof(widget.charts[i].chartData[0].total) === 'object') {
                    var endpoint = [];
                    for (objectTypeObjects in widget.charts[i].metricDetails.objectTypes) {
                        if (widget.charts[i].metricDetails.objectTypes[objectTypeObjects].objectTypeId == widget.charts[i].chartObjectTypeId) {
                            endpoint = widget.charts[i].metricDetails.objectTypes[objectTypeObjects].meta.endpoint;
                        }
                    }
                    if (typeof endpoint[0] == 'object') {

                        for(items in endpoint) {
                            modifiedEndpoint = '';
                            console.log(items,endpoint[items]);
                            for(subpoints in endpoint[items]) {
                                console.log(subpoints,endpoint[items][subpoints])
                                modifiedEndpoint += subpoints;
                                if (endpoint[items].length - endpointLength > 1)
                                    modifiedEndpoint += '_';
                            }
                            console.log(modifiedEndpoint)
                        }

/!*
                        for(items in endpoint) {
                            var modifiedEndpoint = "";
                            for (var endpointLength = 0; endpointLength < endpoint[items].length; endpointLength++) {
                                modifiedEndpoint += endpoint[items][endpointLength];
                                if (endpoint[items].length - endpointLength > 1)
                                    modifiedEndpoint += '_';
                            }
                            for(dataItems in widget.charts[i].chartData) {

                            }
                        }
*!/
                    }
                }
            }
*/

            for(var i = 0; i < widget.charts.length; i++){

                var formattedChartData = [];
                var valuesArr = new Array();

                if(widget.charts[i].chartType == 'line' || widget.charts[i].chartType == 'area'){
                    changedWidget.charts[i].chartData = [];
                    if(typeof(widget.charts[i].chartData[0].total) === 'object') {
                        var endpoint;
                        for(objectTypeObjects in widget.charts[i].metricDetails.objectTypes){
                            if(widget.charts[i].metricDetails.objectTypes[objectTypeObjects].objectTypeId == widget.charts[i].chartObjectTypeId){
                                endpoint = widget.charts[i].metricDetails.objectTypes[objectTypeObjects].meta.endpoint;
                            }
                        }
                        for(items in endpoint){
                            var currentItem = endpoint[items];
                            formattedChartData = [];
                            for(dataObjects in widget.charts[i].chartData){
                                formattedChartData.push(
                                    {
                                        x: moment(widget.charts[i].chartData[dataObjects].date),
                                        y: (widget.charts[i].chartData[dataObjects].total != null && Object.keys(widget.charts[i].chartData[dataObjects].total.length != 0 )? (typeof widget.charts[i].chartData[dataObjects].total[currentItem] != 'undefined' ? widget.charts[i].chartData[dataObjects].total[currentItem] : 0) : 0)
                                    }
                                );
                            }
                            changedWidget.charts[i].chartData[items] = formattedChartData;
                        }
                    }
                    else {
                        for(dataObjects in widget.charts[i].chartData){
                            //To identify regular widgets (basic, adv, fusion)
                            if(widget.charts[i].chartData[dataObjects].name==undefined){
                                formattedChartData.push(
                                    {
                                        x: moment(widget.charts[i].chartData[dataObjects].date),
                                        y:widget.charts[i].chartData[dataObjects].total
                                    }
                                );
                            }

                            //To handle custom widgets
                            else {
                                var IsAlreadyExist = 0;
                                for(getData in formattedChartData){

                                    if(formattedChartData[getData].key==widget.charts[i].chartData[dataObjects].name){
                                        valuesArr = formattedChartData[getData].values;
                                        var dataValues = {
                                            'x': moment(widget.charts[i].chartData[dataObjects].date),
                                            'y': widget.charts[i].chartData[dataObjects].values
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
                                        'x': moment(widget.charts[i].chartData[dataObjects].date),
                                        'y': widget.charts[i].chartData[dataObjects].values
                                    };
                                    valuesArr.push(dataValues);
                                    valuesArr.sort(function(a,b){
                                        var c = new Date(a.x);
                                        var d = new Date(b.x);
                                        return c-d;
                                    });
                                    formattedChartData.push({values:valuesArr,key: widget.charts[i].chartData[dataObjects].name, color:null});
                                }
                            }
                        }
                        changedWidget.charts[i].chartData = formattedChartData;
                    }
                }

                else if(widget.charts[i].chartType == 'bar'){
                    changedWidget.charts[i].chartData = [];
                    if(typeof(widget.charts[i].chartData[0].total) === 'object') {
                        var endpoint = [];
                        for(objectTypeObjects in widget.charts[i].metricDetails.objectTypes){
                            if(widget.charts[i].metricDetails.objectTypes[objectTypeObjects].objectTypeId == widget.charts[i].chartObjectTypeId){
                                endpoint = widget.charts[i].metricDetails.objectTypes[objectTypeObjects].meta.endpoint;
                            }
                        }
                        for(items in endpoint){
                            var currentItem = endpoint[items];
                            formattedChartData = [];
                            for(dataObjects in widget.charts[i].chartData){
                                formattedChartData.push(
                                    {
                                        x: moment(widget.charts[i].chartData[dataObjects].date),
                                        y: (widget.charts[i].chartData[dataObjects].total != null && Object.keys(widget.charts[i].chartData[dataObjects].total.length != 0 )? (typeof widget.charts[i].chartData[dataObjects].total[currentItem] != 'undefined' ? widget.charts[i].chartData[dataObjects].total[currentItem] : 0) : 0)
                                    }
                                );
                            }
                            changedWidget.charts[i].chartData[items] = formattedChartData;
                        }
                    }
                    else {
                        for(dataObjects in widget.charts[i].chartData){
                            //To identify regular widgets (basic, adv, fusion)
                            if(widget.charts[i].chartData[dataObjects].name == undefined){
                                formattedChartData.push(
                                    {
                                        x: moment(widget.charts[i].chartData[dataObjects].date),
                                        y:widget.charts[i].chartData[dataObjects].total
                                    }
                                );
                            }

                            //To handle custom widgets
                            else {
                                var IsAlreadyExist = 0;
                                for(getData in formattedChartData){
                                    if(formattedChartData[getData].key==widget.charts[i].chartData[dataObjects].name){
                                        valuesArr = formattedChartData[getData].values;
                                        var dataValues = {
                                            'x': moment(widget.charts[i].chartData[dataObjects].date),
                                            'y': widget.charts[i].chartData[dataObjects].values
                                        };
                                        valuesArr.push(dataValues);
                                        valuesArr.sort(
                                            function(a,b){
                                                var c = new Date(a.x);
                                                var d = new Date(b.x);
                                                return c-d;
                                            }
                                        );
                                        formattedChartData[getData].values=valuesArr;
                                        IsAlreadyExist = 1;
                                    }
                                }

                                if (IsAlreadyExist != 1) {
                                    valuesArr = [];
                                    var dataValues = {
                                        'x': moment(widget.charts[i].chartData[dataObjects].date),
                                        'y': widget.charts[i].chartData[dataObjects].values
                                    };
                                    valuesArr.push(dataValues);
                                    valuesArr.sort(function(a,b){
                                        var c = new Date(a.x);
                                        var d = new Date(b.x);
                                        return c-d;
                                    });
                                    formattedChartData.push({values:valuesArr,key: widget.charts[i].chartData[dataObjects].name, color:null});
                                }
                            }
                        }
                        changedWidget.charts[i].chartData = formattedChartData;
                    }
                }

                else if(widget.charts[i].chartType == 'pie'){
                    changedWidget.charts[i].chartData = [];
                    if(typeof(widget.charts[i].chartData[0].total) === 'object') {
                        var endpoint = [];
                        for(objectTypeObjects in widget.charts[i].metricDetails.objectTypes){
                            if(widget.charts[i].metricDetails.objectTypes[objectTypeObjects].objectTypeId == widget.charts[i].chartObjectTypeId){
                                endpoint = widget.charts[i].metricDetails.objectTypes[objectTypeObjects].meta.endpoint;
                            }
                        }
/*
                        if(typeof endpoint[0] == 'object') {
                            for(items in endpoint){
                                var modifiedEndpoint = "";
                                for(var endpointLength = 0; endpointLength < endpoint[items].length; endpointLength++){
                                    modifiedEndpoint += endpoint[items][endpointLength];
                                    if(endpoint[items].length - endpointLength > 1)
                                        modifiedEndpoint += '_';
                                }

                                for(dataObjects in widget.charts[i].chartData){
                                    formattedChartData.push(
                                        {
                                            x: moment(widget.charts[i].chartData[dataObjects].date),
                                            y:widget.charts[i].chartData[dataObjects].total[modifiedEndpoint]
                                        }
                                    );
                                }
                                /!*
                                                                var currentItem = endpoint[items];
                                                                formattedChartData = [];
                                                                for(dataObjects in widget.charts[i].chartData){
                                                                    formattedChartData.push(
                                                                        {
                                                                            x: moment(widget.charts[i].chartData[dataObjects].date),
                                                                            y:widget.charts[i].chartData[dataObjects].total[currentItem]
                                                                        }
                                                                    );
                                                                }
                                                                changedWidget.charts[i].chartData[items] = formattedChartData;
                                *!/
                            }
                        }
                        else {
*/
                            for(items in endpoint){
                                var currentItem = endpoint[items];
                                formattedChartData = [];
                                for(dataObjects in widget.charts[i].chartData){
                                    formattedChartData.push(
                                        {
                                            x: moment(widget.charts[i].chartData[dataObjects].date),
                                            y:widget.charts[i].chartData[dataObjects].total[currentItem]
                                        }
                                    );
                                }
                                changedWidget.charts[i].chartData[items] = formattedChartData;
                            }
/*
                        }
*/
                    }
                    else {
                        for(dataObjects in widget.charts[i].chartData){
                            //To identify regular widgets (basic, adv, fusion)
                            if(widget.charts[i].chartData[dataObjects].name == undefined){
                                formattedChartData.push(
                                    {
                                        x: moment(widget.charts[i].chartData[dataObjects].date),
                                        y:widget.charts[i].chartData[dataObjects].total
                                    }
                                );
                            }

                            //To handle custom widgets
                            else{
                                var IsAlreadyExist = 0;
                                for(getData in formattedChartData){
                                    var yValue = 0;
                                    if(formattedChartData[getData].key == widget.charts[i].chartData[dataObjects].name){
                                        yValue = parseInt(formattedChartData[getData].y);
                                        formattedChartData[getData].y = parseInt(yValue)+parseInt(widget.charts[i].chartData[dataObjects].values);
                                        IsAlreadyExist = 1;
                                    }
                                }

                                if (IsAlreadyExist != 1) {

                                    formattedChartData.push({y:parseInt(widget.charts[i].chartData[j].values),key: widget.charts[i].chartData[j].name, color:null});
                                }

                            }
                        }
                        changedWidget.charts[i].chartData.push(formattedChartData);
                    }
                }
            }
            formattedWidget.resolve(changedWidget);
            return formattedWidget.promise;
        }
    };

    //To load the data available for graphs into nvd3 format as per the chart type and to group the graphs by chart type
    this.chartCreator = function(widgetData){
        var modifiedCharts = [],
            graphData = [];
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
                //If the chart type is LINE or AREA
                if(widgetData.charts[i].chartType == 'line' || widgetData.charts[i].chartType == 'area'){
                    var displaySummaryLineData = 0, lowestValue = 0, highestValue = 0;

                    //To handle chart creation for regular widgets (basic, adv, fusion)
                    if(widgetData.charts[i].metricDetails!=undefined){
                        if(widgetData.charts[i].chartData[0].x){
                            for(var items in widgetData.charts[i].chartData) {
                                displaySummaryLineData += parseInt(widgetData.charts[i].chartData[items].y);
                                if(parseInt(widgetData.charts[i].chartData[items].y) < lowestValue)
                                    lowestValue = parseInt(widgetData.charts[i].chartData[items].y);
                                if(parseInt(widgetData.charts[i].chartData[items].y) > highestValue)
                                    highestValue = parseInt(widgetData.charts[i].chartData[items].y);
                            }
                            graphData.lineData.push({
                                values: widgetData.charts[i].chartData,      //values - represents the array of {x,y} data points
                                key: widgetData.charts[i].metricDetails.name, //key  - the name of the series.
                                color: widgetData.charts[i].chartColour[0],  //color - optional: choose your own line color.
                                summaryDisplay: parseInt(displaySummaryLineData),
                                area: widgetData.charts[i].chartType == 'area'? true : false
                            });
                        }
                        else {
                            for(items in widgetData.charts[i].chartData) {
                                displaySummaryLineData = 0;
                                for(dataItems in widgetData.charts[i].chartData[items]) {
                                    displaySummaryLineData += parseInt(widgetData.charts[i].chartData[items][dataItems].y);
                                    if(parseInt(widgetData.charts[i].chartData[items][dataItems].y) < lowestValue)
                                        lowestValue = parseInt(widgetData.charts[i].chartData[items][dataItems].y);
                                    if(parseInt(widgetData.charts[i].chartData[items][dataItems].y) > highestValue)
                                        highestValue = parseInt(widgetData.charts[i].chartData[items][dataItems].y);
                                }
                                graphData.lineData.push({
                                    values: widgetData.charts[i].chartData[items],      //values - represents the array of {x,y} data points
                                    key: widgetData.charts[i].metricDetails.objectTypes[0].meta.endpoint[items], //key  - the name of the series.
                                    color: widgetData.charts[i].chartColour[items],  //color - optional: choose your own line color.
                                    summaryDisplay: parseInt(displaySummaryLineData),
                                    area: widgetData.charts[i].chartType == 'area'? true : false
                                });
                            }
                        }
                    }

                    //To handle chart creation for custom widgets
                    else{
                        for(var customData in widgetData.charts[i].chartData){
                            for(var getTotal in widgetData.charts[i].chartData[customData].values)
                                displaySummaryLineData += parseInt(widgetData.charts[i].chartData[customData].values[getTotal].y);
                            graphData.lineData.push({
                                values: widgetData.charts[i].chartData[customData].values,      //values - represents the array of {x,y} data points
                                key: widgetData.charts[i].chartData[customData].key, //key  - the name of the series.
                                color: widgetData.charts[i].chartData[customData].color,  //color - optional: choose your own line color.
                                summaryDisplay: displaySummaryLineData,
                                area: false
                            });
                            displaySummaryLineData=0;
                        }
                    }

                    //Defining the chart options for all line/area charts
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
                            showLegend: true,
                            forceY: [lowestValue,highestValue == 0? 10 : highestValue],
                            //yDomain: [lowestValue,highestValue],
                            legend: {
                                rightAlign: false
                            }
                        }
                    };
                }

                //If the chart type is BAR
                else if (widgetData.charts[i].chartType == 'bar'){
                    var displaySummaryBarData = 0;

                    //To handle chart creation for regular widgets (basic, adv, fusion)
                    if(widgetData.charts[i].metricDetails!=undefined){
                        if(widgetData.charts[i].chartData[0].x){
                            for(items in widgetData.charts[i].chartData)
                                displaySummaryBarData = displaySummaryBarData + parseInt(widgetData.charts[i].chartData[items].y);
                            graphData.barData.push({
                                values: widgetData.charts[i].chartData,      //values - represents the array of {x,y} data points
                                key: widgetData.charts[i].metricDetails.name, //key  - the name of the series.
                                color: widgetData.charts[i].chartColour[0],  //color - optional: choose your own line color.
                                summaryDisplay: parseInt(displaySummaryBarData)
                            });

                        }
                        else {
                            for(items in widgetData.charts[i].chartData) {
                                displaySummaryBarData = 0;
                                for(dataItems in widgetData.charts[i].chartData[items])
                                    displaySummaryBarData = displaySummaryBarData + parseInt(widgetData.charts[i].chartData[items][dataItems].y);
                                graphData.barData.push({
                                    values: widgetData.charts[i].chartData[items],      //values - represents the array of {x,y} data points
                                    key: widgetData.charts[i].metricDetails.objectTypes[0].meta.endpoint[items], //key  - the name of the series.
                                    color: widgetData.charts[i].chartColour[items],  //color - optional: choose your own line color.
                                    summaryDisplay: parseInt(displaySummaryBarData)
                                });
                            }
                        }
                    }

                    //To handle chart creation for custom widgets
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

                    //Defining the chart options for all line/area charts
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
                            showLegend: true,
                            stacked: true,
                            showControls: false,
                            legend: {
                                rightAlign: false
                            }
                        }
                    };
                }

                //If the chart type is PIE
                else if(widgetData.charts[i].chartType == 'pie'){

                    var displaySummaryPieData =0;

                    //To handle chart creation for regular widgets (basic, adv, fusion)
                    if(widgetData.charts[i].metricDetails!=undefined) {
                        if(widgetData.charts[i].chartData[0].x){
                            for(items in widgetData.charts[i].chartData)
                                displaySummaryPieData = displaySummaryPieData + parseInt(widgetData.charts[i].chartData[items].y);
                            graphData.pieData.push(
                                {
                                    values: widgetData.charts[i].chartData,      //values - represents the array of {x,y} data points
                                    key: widgetData.charts[i].metricDetails.name, //key  - the name of the series.
                                    color: widgetData.charts[i].chartColour[0],  //color - optional: choose your own line color.
                                    summaryDisplay: parseInt(displaySummaryPieData)
                                }
                            );
                        }
                        else {
                            for(items in widgetData.charts[i].chartData) {
                                displaySummaryPieData = 0;
                                for(dataItems in widgetData.charts[i].chartData[items])
                                    displaySummaryPieData = displaySummaryPieData + parseInt(widgetData.charts[i].chartData[items][dataItems].y);
                                graphData.pieData.push({
                                    y: parseInt(displaySummaryPieData),      //values - represents the array of {x,y} data points
                                    key: widgetData.charts[i].metricDetails.objectTypes[0].meta.endpoint[items], //key  - the name of the series.
                                    color: widgetData.charts[i].chartColour[items],  //color - optional: choose your own line color.
                                    summaryDisplay: parseInt(displaySummaryPieData)
                                });
                            }
                        }
                    }

                    //To handle chart creation for custom widgets
                    else {
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
                            showLegend: true,
                            labelsOutside: false,
                            tooltips: true,
                            //tooltipcontent: 'toolTipContentFunction()',
                            //duration: 50,
                            labelThreshold: 0.01,
                            labelSunbeamLayout: true,
                            legend: {
                                rightAlign: false,
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
            modifiedCharts.push({
                'options': graphData.lineDataOptions,
                'data': graphData.lineData,
                'api': {}
        });
        if(graphData.barDataOptions !== null)
            modifiedCharts.push({
                'options': graphData.barDataOptions,
                'data': graphData.barData,
                'api': {}
        });
        if(graphData.pieDataOptions !== null)
            modifiedCharts.push({
                'options': graphData.pieDataOptions,
                'data': graphData.pieData,
                'api': {}
        });

        return(modifiedCharts);
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

        console.log(widget);

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

        if(widget.widgetType == 'custom') {
            chartName = "Custom Data";
        }
        else {
            if(widget.charts==[] || widget.charts==""){
                chartName = "";
            }
            else {
                chartName = (typeof widget.name != 'undefined'? widget.name + ' - ' : '');
                var objectNames = [],uniqueNames = [];
                for(i=0;i<widget.charts.length;i++)
                    objectNames.push(widget.charts[i].chartObjectName);
                $.each(objectNames, function(i ,el){
                    if($.inArray(el, uniqueNames) === -1){
                        uniqueNames.push(el);
                    }
                });
                chartName = chartName.concat(uniqueNames);
            }
        }

        var modifiedWidget = {
            'name': chartName,
            'visibility': true,
            'id': widget._id,
            'color': widget.color,
            'chart': finalChartData,
            'layoutOptionsX': individualGraphWidthDivider,
            'layoutOptionsY': individualGraphHeightDivider
        };
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
                widgetColor = '#3B5998';
                break;
            case 'Google Analytics':
                widgetColor = '#F26630';
                break;
            case 'Twitter':
                widgetColor = '#5EA9DD';
                break;
            case 'FacebookAds':
                widgetColor = '#4E5664';
                break;
            case 'GoogleAdwords':
                widgetColor = '#1A925A';
                break;
            case 'Instagram':
                widgetColor = '#895A4D';
                break;
            default:
                widgetColor = '#04509B';
                break;
        }

        return widgetColor;
    };

});