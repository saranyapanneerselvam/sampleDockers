var showMetricApp = angular.module('inspinia');

showMetricApp.service('createWidgets',function($http,$q){



    this.widgetHandler = function(widget,dateRange) {

        var deferredWidget = $q.defer();
        var tempWidget = JSON.parse(JSON.stringify(widget));

        if(widget.widgetType == 'customFusion') {
            var sourceWidgetList = [], dataLoadedWidgetArray = [], widgetChartsArray = [];
            sourceWidgetList.push(fetchCustomFusionWidgets(widget));
            $q.all(sourceWidgetList).then(
                function successCallback(sourceWidgetList) {
                    var widgetList = sourceWidgetList[0];
                    for(var subWidgets in widgetList) {
                        if(widgetList[subWidgets].widgetType == 'basic' || widgetList[subWidgets].widgetType == 'adv' || widgetList[subWidgets].widgetType == 'fusion')
                            dataLoadedWidgetArray.push(getRegularWidgetElements(widgetList[subWidgets],dateRange));
                        else if(widgetList[subWidgets].widgetType == 'custom')
                            dataLoadedWidgetArray.push(getCustomWidgetElements(widgetList[subWidgets],dateRange));
                    }
                    $q.all(dataLoadedWidgetArray).then(
                            function successCallback(dataLoadedWidgetArray) {
                                for(var dataLoadedWidgets in dataLoadedWidgetArray) {
                                    if(dataLoadedWidgetArray[dataLoadedWidgets].widgetType == 'basic' || dataLoadedWidgetArray[dataLoadedWidgets].widgetType == 'adv' || dataLoadedWidgetArray[dataLoadedWidgets].widgetType == 'fusion')
                                        widgetChartsArray.push(formulateRegularWidgetGraphs(dataLoadedWidgetArray[dataLoadedWidgets]));
                                    else if(dataLoadedWidgetArray[dataLoadedWidgets].widgetType == 'custom')
                                        widgetChartsArray.push(formulateCustomWidgetGraphs(dataLoadedWidgetArray[dataLoadedWidgets]));
                                }
                                $q.all(widgetChartsArray).then(
                                    function successCallback(widgetChartsArray) {
                                        var consolidatedChartsArray = [];
                                        for(var arrayObjects in widgetChartsArray) {
                                            for(var subObjects in widgetChartsArray[arrayObjects])
                                                consolidatedChartsArray.push(widgetChartsArray[arrayObjects][subObjects])
                                        }
                                        var widgetData = createWidgetData(tempWidget,consolidatedChartsArray);
                                        widgetData.then(
                                            function successCallback(widgetData) {
                                                deferredWidget.resolve(widgetData);
                                            },
                                            function errorCallback(error) {
                                                deferredWidget.reject(error);
                                            }
                                        );
                                    },
                                    function errorCallback(error) {
                                        deferredWidget.reject(error);
                                    }
                                );
                            },
                            function errorCallback(err) {
                                deferredWidget.reject(err);
                            }
                    );
                },
                function errorCallback(err) {
                    deferredWidget.reject(err);
                }
            );
        }
        else if (widget.widgetType == 'basic' || widget.widgetType == 'adv' || widget.widgetType == 'fusion') {
            var dataLoadedWidget = getRegularWidgetElements(tempWidget,dateRange);
            dataLoadedWidget.then(
                function successCallback(dataLoadedWidget) {
                    var widgetCharts = formulateRegularWidgetGraphs(dataLoadedWidget);
                    widgetCharts.then(
                        function successCallback(widgetCharts) {
                            var widgetData = createWidgetData(widget,widgetCharts);
                            widgetData.then(
                                function successCallback(widgetData) {
                                    deferredWidget.resolve(widgetData);
                                },
                                function errorCallback(error) {
                                    deferredWidget.reject(error);
                                }
                            );
                        },
                        function errorCallback(error) {
                            deferredWidget.reject(error);
                        }
                    );
                },
                function errorCallback(error) {
                    deferredWidget.reject(error);
                }
            );
        }
        else if(widget.widgetType == 'custom') {
            var dataLoadedWidget = getCustomWidgetElements(tempWidget,dateRange);
            dataLoadedWidget.then(
                function successCallback(dataLoadedWidget) {
                    var widgetCharts = formulateCustomWidgetGraphs(dataLoadedWidget);
                    widgetCharts.then(
                        function successCallback(widgetCharts) {
                            var widgetData = createWidgetData(widget,widgetCharts);
                            widgetData.then(
                                function successCallback(widgetData) {
                                    deferredWidget.resolve(widgetData);
                                },
                                function errorCallback(error) {
                                    deferredWidget.reject(error);
                                }
                            );
                        },
                        function errorCallback(error) {
                            deferredWidget.reject(error);
                        }
                    );
                },
                function errorCallback(error) {
                    deferredWidget.reject(error);
                }
            );

        }
        return deferredWidget.promise;

        function fetchCustomFusionWidgets(widget) {
            var deferred = $q.defer();
            var sourceWidgetList = [];
            var finalWidgetList = [];

            for(var widgetReferences in widget.widgets) {
                var widgetType = widget.widgets[widgetReferences].widgetType;
                if(widgetType == 'basic' || widgetType == 'adv' || widgetType == 'fusion' || widgetType == 'custom')
                    sourceWidgetList.push(getWidgetData(widget.widgets[widgetReferences].widgetId));
            }
            $q.all(sourceWidgetList).then(
                function successCallback(sourceWidgetList) {
                    deferred.resolve(sourceWidgetList);
                },
                function errorCallback(err) {
                    deferred.reject(err);
                }
            );
            return deferred.promise;

            function getWidgetData(widgetId) {
                var data = $q.defer();
                $http({
                    method: 'GET',
                    url: '/api/v1/widget/' + widgetId
                }).then(
                    function successCallback(response){
                        data.resolve(response.data[0]);
                    },
                    function errorCallback(err){
                        data.resolve(err);
                    }
                );
                return data.promise;
            }
        }

        function getCustomWidgetElements(widget,dateRange) {
            var deferred = $q.defer();
            var updatedCharts = [];
            var countCustomData = 0;

            $http({
                method: 'POST',
                url: '/api/v1/customWidget/data/' + widget._id,
                data: {
                    "startDate": dateRange.startDate,
                    "endDate": dateRange.endDate
                }
            }).then(
                function successCallback(response) {
                    var formattedCharts = [];
                    countCustomData++;
                    for(var getData in response.data){
                        if(response.data[getData].widgetId == widget._id){
                            updatedCharts.push({
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
                    widget.charts = updatedCharts;
                    deferred.resolve(widget);
                },
                function errorCallback(error) {
                    deferred.reject(error);
                }
            );
            return deferred.promise;
        }

        function formulateCustomWidgetGraphs(widget) {
            var deferred = $q.defer();
            var widgetCharts = [];

            for(var charts in widget.charts) {
                var valuesArr = [], formattedChartData = [];
                if (widget.charts[charts].chartType == 'line' || widget.charts[charts].chartType == 'bar' || widget.charts[charts].chartType == 'area') {
                    for (var dataObjects in widget.charts[charts].chartData) {
                        var IsAlreadyExist = 0;
                        for (var getData in widgetCharts) {
                            if (widgetCharts[getData].key == widget.charts[charts].chartData[dataObjects].name) {
                                valuesArr = widgetCharts[getData].values;
                                var dataValues = {
                                    'x': moment(widget.charts[charts].chartData[dataObjects].date),
                                    'y': widget.charts[charts].chartData[dataObjects].values
                                };
                                valuesArr.push(dataValues);
                                valuesArr.sort(function (a, b) {
                                    var c = new Date(a.x);
                                    var d = new Date(b.x);
                                    return c - d;
                                });
                                widgetCharts[getData].values = valuesArr;
                                IsAlreadyExist = 1;
                            }
                        }
                        if (IsAlreadyExist != 1) {
                            valuesArr = [];
                            var dataValues = {
                                'x': moment(widget.charts[charts].chartData[dataObjects].date),
                                'y': widget.charts[charts].chartData[dataObjects].values
                            };
                            valuesArr.push(dataValues);
                            valuesArr.sort(function (a, b) {
                                var c = new Date(a.x);
                                var d = new Date(b.x);
                                return c - d;
                            });
                            widgetCharts.push({
                                type: widget.charts[charts].chartType,
                                values: valuesArr,
                                key: widget.charts[charts].chartData[dataObjects].name,
                                color: null
                            });
                        }
                    }
                }
                else if(widget.charts[charts].chartType == 'pie') {
                    for (var dataObjects in widget.charts[charts].chartData) {
                        var IsAlreadyExist = 0;
                        for(getData in widgetCharts){
                            var yValue = 0;
                            if(widgetCharts[getData].key == widget.charts[charts].chartData[dataObjects].name){
                                yValue = parseInt(widgetCharts[getData].y);
                                widgetCharts[getData].y = parseInt(yValue)+parseInt(widget.charts[charts].chartData[dataObjects].values);
                                IsAlreadyExist = 1;
                            }
                        }
                        if (IsAlreadyExist != 1) {
                            widgetCharts.push({
                                type: widget.charts[charts].chartType,
                                y: parseInt(widget.charts[charts].chartData[dataObjects].values),
                                key: widget.charts[charts].chartData[dataObjects].name,
                                color: null
                            });
                        }
                    }
                }
            }

            deferred.resolve(widgetCharts);
            return deferred.promise;
        }

        function getRegularWidgetElements(widget,dateRange) {
            var deferred = $q.defer();
            var updatedCharts;
            updatedCharts = getRegularWidgetData(widget,dateRange);
            updatedCharts.then(
                function successCallback(updatedCharts) {
                    widget.charts = updatedCharts;
                    var metricDetails = [];
                    for(charts in widget.charts)
                        metricDetails.push(fetchMetricDetails(widget.charts[charts]));
                    $q.all(metricDetails).then(
                        function successCallback(metricDetails){
                            for(charts in widget.charts)
                                widget.charts[charts].metricDetails = metricDetails[charts];
                            deferred.resolve(widget);
                        },
                        function errorCallback(error){
                            deferred.reject(error);
                        }
                    );
                },
                function errorCallback(error) {
                    deferred.reject(error);
                }
            );
            return deferred.promise;
        }
        
        function getRegularWidgetData(widget,dateRange) {
            var deferred = $q.defer();
            var updatedCharts = [];
            $http({
                method: 'POST',
                url: '/api/v1/widgets/data/' + widget._id,
                data: {
                    "startDate": dateRange.startDate,
                    "endDate": dateRange.endDate
                }
            }).then(
                function successCallback(response) {
                    for(chartObjects in widget.charts){
                        for(datas in response.data){
                            if(String(widget.charts[chartObjects].metrics[0].metricId) === String(response.data[datas].metricId)){
                                updatedCharts.push({
                                    channelId: widget.charts[chartObjects].channelId,
                                    chartType: typeof widget.charts[chartObjects].metrics[0].chartType != 'undefined'? widget.charts[chartObjects].metrics[0].chartType: '',
                                    chartName: widget.charts[chartObjects].name,
                                    chartColour: widget.charts[chartObjects].metrics[0].color,
                                    chartOptions: widget.charts[chartObjects].metrics[0].chartOptions,
                                    chartMetricId: response.data[datas].metricId,
                                    chartObjectId: response.data[datas].objectId,
                                    chartObjectTypeId: widget.charts[chartObjects].metrics[0].objectTypeId,
                                    chartObjectName: widget.charts[chartObjects].objectName,
                                    chartData: response.data[datas].data
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

        function fetchMetricDetails(chart) {

            var deferred = $q.defer();

            if(chart.chartMetricId == undefined){
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

        function formulateRegularWidgetGraphs(widget) {

            var deferred = $q.defer();
            var widgetCharts = [];

            if(widget.charts.length > 0) {
                for(var charts in widget.charts) {
                    var chartType = widget.charts[charts].chartType;

                    if(chartType == "line" || chartType == "area" || chartType == "bar") {
                        if(typeof widget.charts[charts].chartData[0].total == 'object') {
                            var endpoint;
                            for(objectTypes in widget.charts[charts].metricDetails.objectTypes){
                                if(widget.charts[charts].metricDetails.objectTypes[objectTypes].objectTypeId == widget.charts[charts].chartObjectTypeId)
                                    endpoint = widget.charts[charts].metricDetails.objectTypes[objectTypes].meta.endpoint;
                            }
                            var formattedChartDataArray = [];
                            for(items in endpoint){
                                var currentItem = endpoint[items];
                                var formattedChartData = [];
                                for(datas in widget.charts[charts].chartData){
                                    var yValue = 0, endpointArray;
                                    if(widget.charts[charts].chartData[datas].total != null && Object.keys(widget.charts[charts].chartData[datas].total.length != 0 )) {
                                        for(keyValuePairs in widget.charts[charts].chartData[datas].total) {
                                            //console.log(widget.charts[i].chartData[datas].total[keyValuePairs], keyValuePairs);
                                            if(keyValuePairs.search('/') > -1) {
                                                endpointArray = keyValuePairs.split('/');
                                                for(splittedValues in endpointArray) {
                                                    console.log(splittedValues, endpointArray[splittedValues]);
                                                }
                                            }
                                            else if(keyValuePairs == currentItem) {
                                                yValue = widget.charts[charts].chartData[datas].total[currentItem];
                                            }
                                        }
                                    }
                                    formattedChartData.push({
                                            x: moment(widget.charts[charts].chartData[datas].date),
                                            y: yValue
                                    });
                                }
                                formattedChartDataArray.push(formattedChartData);
                            }
                            widget.charts[charts].chartData = formattedChartDataArray;
                        }
                        else {
                            var formattedChartData = [];
                            for(datas in widget.charts[charts].chartData) {
                                formattedChartData.push({
                                        x: moment(widget.charts[charts].chartData[datas].date),
                                        y:widget.charts[charts].chartData[datas].total
                                });
                            }
                            widget.charts[charts].chartData = formattedChartData;
                        }
                    }
                    else if(chartType == "pie"){
                        if(typeof(widget.charts[charts].chartData[0].total) === 'object') {
                            var endpoint = [];
                            for(objectTypes in widget.charts[charts].metricDetails.objectTypes){
                                if(widget.charts[charts].metricDetails.objectTypes[objectTypes].objectTypeId == widget.charts[charts].chartObjectTypeId)
                                    endpoint = widget.charts[charts].metricDetails.objectTypes[objectTypes].meta.endpoint;
                            }
                            var formattedChartDataArray = [];
                            for(items in endpoint){
                                var currentItem = endpoint[items];
                                formattedChartData = [];
                                var yValue = 0;
                                for(datas in widget.charts[charts].chartData){
                                    if(widget.charts[charts].chartData[datas].total != null && Object.keys(widget.charts[charts].chartData[datas].total.length != 0 )) {
                                        if(typeof widget.charts[charts].chartData[datas].total[currentItem] != 'undefined') {
                                            yValue += parseInt(widget.charts[charts].chartData[datas].total[currentItem]);
                                        }
                                    }
                                }
                                formattedChartData.push({
                                    y: yValue
                                });
                                formattedChartDataArray.push(formattedChartData);
                            }
                            widget.charts[charts].chartData = formattedChartDataArray;
                        }
                        else {
                            var yValue = 0;
                            for(datas in widget.charts[charts].chartData) {
                                yValue += parseInt(widget.charts[charts].chartData[datas].total);
                            }
                            formattedChartData.push({
                                y: yValue
                            });
                            widget.charts[charts].chartData = formattedChartData;
                        }
                    }
                    else if(chartType == "instagramPosts"){
                        if(typeof(widget.charts[charts].chartData[0].total) === 'object') {
                            var images = 'images';
                            var thumbnail='thumbnail';
                            var likes ='likes';
                            var comments='comments'
                            var count='count';
                            var caption='caption';
                            var post='text';
                            var link='link';
                            var url='url';

                            var formattedChartDataArray = [];
                            for(datas in widget.charts[charts].chartData) {
                                var formattedChartData = {
                                    date: widget.charts[charts].chartData[datas].date,
                                    image: (widget.charts[charts].chartData[datas].total != null && Object.keys(widget.charts[charts].chartData[datas].total.length != 0 )?
                                        (widget.charts[charts].chartData[datas].total[images] != null?
                                            (widget.charts[charts].chartData[datas].total[images][thumbnail] != null?
                                                (typeof widget.charts[charts].chartData[datas].total[images][thumbnail][url] != 'undefined' ? widget.charts[charts].chartData[datas].total[images][thumbnail][url] : ''):''):''):''),

                                    postComment: (widget.charts[charts].chartData[datas].total != null && Object.keys(widget.charts[charts].chartData[datas].total.length != 0 )?
                                        (widget.charts[charts].chartData[datas].total[caption] != null ?
                                            (typeof widget.charts[charts].chartData[datas].total[caption][post] != 'undefined'?
                                                widget.charts[charts].chartData[datas].total[caption][post] : ''): '') : ''),
                                    likes: (widget.charts[charts].chartData[datas].total != null && Object.keys(widget.charts[charts].chartData[datas].total.length != 0 )?
                                        (widget.charts[charts].chartData[datas].total[likes] != null?
                                            (typeof widget.charts[charts].chartData[datas].total[likes][count] != 'undefined' ? widget.charts[charts].chartData[datas].total[likes][count] : 0):0):0),

                                    comments: (widget.charts[charts].chartData[datas].total != null && Object.keys(widget.charts[charts].chartData[datas].total.length != 0 )?
                                        (widget.charts[charts].chartData[datas].total[comments] != null?
                                            (typeof widget.charts[charts].chartData[datas].total[comments][count] != 'undefined' ? widget.charts[charts].chartData[datas].total[comments][count] : 0):0):0),
                                    links: (widget.charts[charts].chartData[datas].total != null && Object.keys(widget.charts[charts].chartData[datas].total.length != 0 )?
                                        (typeof widget.charts[charts].chartData[datas].total[link] != 'undefined' ? widget.charts[charts].chartData[datas].total[link] : '') : ''),
                                };
                                formattedChartDataArray.push(formattedChartData);
                            }
                            widget.charts[charts].chartData = formattedChartDataArray;
                        }
                    }
                    else if(chartType == "highEngagementTweets"){
                        if(typeof(widget.charts[charts].chartData[0].total) === 'object') {
                            var likes ='favorite_count';
                            var reTweet='retweet_count'
                            var entities='entities';
                            var media='media';
                            var post='text';
                            var link='expanded_url';

                            var formattedChartDataArray = [];
                            for(datas in widget.charts[charts].chartData) {
                                var formattedChartData = {
                                    date: widget.charts[charts].chartData[datas].date,
                                    likes: (widget.charts[charts].chartData[datas].total != null && Object.keys(widget.charts[charts].chartData[datas].total.length != 0 )? (typeof widget.charts[charts].chartData[datas].total[likes] != 'undefined' ? widget.charts[charts].chartData[datas].total[likes] : 0) : 0),
                                    reTweet: (widget.charts[charts].chartData[datas].total != null && Object.keys(widget.charts[charts].chartData[datas].total.length != 0 )? (typeof widget.charts[charts].chartData[datas].total[reTweet] != 'undefined' ? widget.charts[charts].chartData[datas].total[reTweet] : 0) : 0),
                                    postComment: (widget.charts[charts].chartData[datas].total != null && Object.keys(widget.charts[charts].chartData[datas].total.length != 0 )? (typeof widget.charts[charts].chartData[datas].total[post] != 'undefined' ? widget.charts[charts].chartData[datas].total[post] : 0) : 0),
                                    links: (widget.charts[charts].chartData[datas].total != null && Object.keys(widget.charts[charts].chartData[datas].total.length != 0 )? (typeof widget.charts[charts].chartData[datas].total.entities!= 'undefined' ? widget.charts[charts].chartData[datas].total.entities  : 0) : 0),
                                };
                                formattedChartDataArray.push(formattedChartData);
                            }
                            widget.charts[charts].chartData = formattedChartDataArray;
                        }
                    }
                }
                for(var charts in widget.charts) {
                    var chartType = widget.charts[charts].chartType;
                    if(chartType == "line" || chartType == "bar" || chartType == "area" || chartType == "pie") {
                        if(widget.charts[charts].chartData[0].x){
                            var summaryValue = 0;
                            for(var datas in widget.charts[charts].chartData)
                                summaryValue += parseInt(widget.charts[charts].chartData[datas].y);
                            if(chartType == 'line' || chartType == 'bar') {
                                widgetCharts.push({
                                    'type': widget.charts[charts].chartType,
                                    'values': widget.charts[charts].chartData,      //values - represents the array of {x,y} data points
                                    'key': widget.charts[charts].metricDetails.name, //key  - the name of the series.
                                    'color': widget.charts[charts].chartColour[0],  //color - optional: choose your own line color.
                                    'summaryDisplay': parseInt(summaryValue)
                                });
                            }
                            else if(chartType == 'area') {
                                widgetCharts.push({
                                    'type': widget.charts[charts].chartType,
                                    'values': widget.charts[charts].chartData,      //values - represents the array of {x,y} data points
                                    'key': widget.charts[charts].metricDetails.name, //key  - the name of the series.
                                    'color': widget.charts[charts].chartColour[0],  //color - optional: choose your own line color.
                                    'summaryDisplay': parseInt(summaryValue),
                                    'area': true
                                });
                            }
                            else {
                                widgetCharts.push({
                                    'type': widget.charts[charts].chartType,
                                    'y': parseInt(summaryValue),      //values - represents the array of {x,y} data points
                                    'key': widget.charts[charts].metricDetails.name, //key  - the name of the series.
                                    'color': widget.charts[charts].chartColour[0],  //color - optional: choose your own line color.
                                    'summaryDisplay': parseInt(summaryValue)
                                });
                            }
                        }
                        else {
                            for(var items in widget.charts[charts].chartData) {
                                var summaryValue = 0;
                                for(var datas in widget.charts[charts].chartData[items])
                                    summaryValue += parseInt(widget.charts[charts].chartData[items][datas].y);
                                var endpointDisplayCode = widget.charts[charts].metricDetails.objectTypes[0].meta.endpoint[items];
                                if(chartType == 'line' || chartType == 'bar') {
                                    widgetCharts.push({
                                        'type': widget.charts[charts].chartType,
                                        'values': widget.charts[charts].chartData[items],      //values - represents the array of {x,y} data points
                                        'key': typeof widget.charts[charts].metricDetails.objectTypes[0].meta.endpointDisplayName != 'undefined'? (typeof widget.charts[charts].metricDetails.objectTypes[0].meta.endpointDisplayName[endpointDisplayCode] != 'undefined'? widget.charts[charts].metricDetails.objectTypes[0].meta.endpointDisplayName[endpointDisplayCode]: widget.charts[charts].metricDetails.objectTypes[0].meta.endpoint[items]) : widget.charts[charts].metricDetails.objectTypes[0].meta.endpoint[items],
                                        'color': typeof widget.charts[charts].chartColour != 'undefined' ? (typeof widget.charts[charts].chartColour[items] != 'undefined'? widget.charts[charts].chartColour[items] : '') : '',  //color - optional: choose your own line color.
                                        'summaryDisplay': parseInt(summaryValue)
                                    });
                                }
                                else if(chartType == 'area') {
                                    widgetCharts.push({
                                        'type': widget.charts[charts].chartType,
                                        'values': widget.charts[charts].chartData[items],      //values - represents the array of {x,y} data points
                                        'key': typeof widget.charts[charts].metricDetails.objectTypes[0].meta.endpointDisplayName != 'undefined'? (typeof widget.charts[charts].metricDetails.objectTypes[0].meta.endpointDisplayName[endpointDisplayCode] != 'undefined'? widget.charts[charts].metricDetails.objectTypes[0].meta.endpointDisplayName[endpointDisplayCode]: widget.charts[charts].metricDetails.objectTypes[0].meta.endpoint[items]) : widget.charts[charts].metricDetails.objectTypes[0].meta.endpoint[items],
                                        'color': typeof widget.charts[charts].chartColour != 'undefined' ? (typeof widget.charts[charts].chartColour[items] != 'undefined'? widget.charts[charts].chartColour[items] : '') : '',  //color - optional: choose your own line color.
                                        'summaryDisplay': parseInt(summaryValue),
                                        'area': true
                                    });
                                }
                                else {
                                    widgetCharts.push({
                                        'type': widget.charts[charts].chartType,
                                        'y': parseInt(summaryValue),      //values - represents the array of {x,y} data points
                                        'key': typeof widget.charts[charts].metricDetails.objectTypes[0].meta.endpointDisplayName != 'undefined'? (typeof widget.charts[charts].metricDetails.objectTypes[0].meta.endpointDisplayName[endpointDisplayCode] != 'undefined'? widget.charts[charts].metricDetails.objectTypes[0].meta.endpointDisplayName[endpointDisplayCode]: widget.charts[charts].metricDetails.objectTypes[0].meta.endpoint[items]) : widget.charts[charts].metricDetails.objectTypes[0].meta.endpoint[items],
                                        'color': typeof widget.charts[charts].chartColour != 'undefined' ? (typeof widget.charts[charts].chartColour[items] != 'undefined'? widget.charts[charts].chartColour[items] : '') : '',  //color - optional: choose your own line color.
                                        'summaryDisplay': parseInt(summaryValue)
                                    });
                                }
                            }
                        }
                    }
                    else if(chartType == 'instagramPosts'){
                        widgetCharts.push({
                            'type': widget.charts[charts].chartType,
                            'values': widget.charts[charts].chartData
                        });
                    }
                    else if(chartType == 'highEngagementTweets'){
                        widgetCharts.push({
                            'type': widget.charts[charts].chartType,
                            'values': widget.charts[charts].chartData
                        });
                    }
                }
            }
            deferred.resolve(widgetCharts);
            return deferred.promise;
        }

        function createWidgetData(widget,widgetCharts) {
            var deferred = $q.defer();
            var finalCharts = [];
            finalCharts.lineCharts = [], finalCharts.barCharts = [], finalCharts.pieCharts = [], finalCharts.instagramPosts = [], finalCharts.highEngagementTweets = [];
            var graphOptions = {
                lineDataOptions: {
                    chart: {
                        type: 'lineChart',
                        margin : {top: 20, right: 25, bottom: 30, left: 35},
                        x: function(d){ return d.x; },
                        y: function(d){ return d.y; },
                        useInteractiveGuideline: true,
                        xAxis: {
                            tickFormat: function(d) {
                                return d3.time.format('%d/%m/%y')(new Date(d))}
                        },
                        yAxis: {
                            tickFormat: function(d) {
                                return d3.format('f')(d);}
                        },
                        axisLabelDistance: -10,
                        showLegend: true,
                        //forceY: [lowestLineValue,highestLineValue == 0? 10 : highestLineValue + 10],
                        //yDomain: [lowestValue,highestValue],
                        legend: {
                            rightAlign: false
                        }
                    }
                },
                barDataOptions: {
                    chart: {
                        type: 'multiBarChart',
                        margin : {top: 20, right: 25, bottom: 30, left: 35},
                        x: function(d){ return d.x; },
                        y: function(d){ return d.y; },
                        useInteractiveGuideline: true,
                        xAxis: {
                            tickFormat: function(d) {
                                return d3.time.format('%d/%m/%y')(new Date(d))}
                        },
                        yAxis: {
                            tickFormat: function(d) {
                                return d3.format('f')(d);}
                        },
                        axisLabelDistance: -10,
                        showLegend: true,
                        stacked: true,
                        //forceY: [lowestValue,highestValue == 0? 10 : highestValue + 10],
                        showControls: false,
                        legend: {
                            rightAlign: false
                        }
                    }
                },
                pieDataOptions: {
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
                },
                instagramPosts: {
                    chart: {
                        type: 'instagramPosts'
                    }
                },
                highEngagementTweets: {
                    chart: {
                        type: 'highEngagementTweets'
                    }
                }
            };
            var sizeY,sizeX,chartsCount = 0,individualGraphWidthDivider,individualGraphHeightDivider,chartName,finalChartData = [];
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

            for(var charts in widgetCharts) {
                if(widgetCharts[charts].type == 'line' || widgetCharts[charts].type == 'area') finalCharts.lineCharts.push(widgetCharts[charts]);
                else if(widgetCharts[charts].type == 'bar') finalCharts.barCharts.push(widgetCharts[charts]);
                else if(widgetCharts[charts].type == 'pie') finalCharts.pieCharts.push(widgetCharts[charts]);
                else if(widgetCharts[charts].type == 'instagramPosts') finalCharts.instagramPosts.push(widgetCharts[charts]);
                else if(widgetCharts[charts].type == 'highEngagementTweets') finalCharts.highEngagementTweets.push(widgetCharts[charts]);
            }

            if(finalCharts.lineCharts.length > 0) {
                chartsCount++;
                finalChartData.push({
                    'options': graphOptions.lineDataOptions,
                    'data': finalCharts.lineCharts,
                    'api': {}
                });
            }
            if(finalCharts.barCharts.length > 0) {
                chartsCount++;
                finalChartData.push({
                    'options': graphOptions.barDataOptions,
                    'data': finalCharts.barCharts,
                    'api': {}
                });
            }
            if(finalCharts.pieCharts.length > 0) {
                chartsCount++;
                finalChartData.push({
                    'options': graphOptions.pieDataOptions,
                    'data': finalCharts.pieCharts,
                    'api': {}
                });
            }
            if(finalCharts.instagramPosts.length > 0) {
                chartsCount++;
                finalChartData.push({
                    'options': graphOptions.instagramPosts,
                    'data': finalCharts.instagramPosts[0].values
                });
            }
            if(finalCharts.highEngagementTweets.length > 0) {
                chartsCount++;
                finalChartData.push({
                    'options': graphOptions.highEngagementTweets,
                    'data': finalCharts.highEngagementTweets[0].values
                });
            }

            var setLayoutOptions = function() {
                sizeY = typeof widget.size != 'undefined'? widget.size.h : 3;
                sizeX = typeof widget.size != 'undefined'? widget.size.w : 3;
                for(var i=0;i<widgetLayoutOptions.length;i++){
                    if(widgetLayoutOptions[i].W == sizeX && widgetLayoutOptions[i].H == sizeY && widgetLayoutOptions[i].N == chartsCount){
                        individualGraphWidthDivider = widgetLayoutOptions[i].c;
                        individualGraphHeightDivider = widgetLayoutOptions[i].r;
                    }
                }
            };
            setLayoutOptions();
            if(widget.widgetType == 'custom') chartName = "Custom Data";
            else chartName = (typeof widget.name != 'undefined'? widget.name: '');

            var modifiedWidget = {
                'name': chartName,
                'visibility': true,
                'id': widget._id,
                'color': widget.color,
                'chart': finalChartData,
                'layoutOptionsX': individualGraphWidthDivider,
                'layoutOptionsY': individualGraphHeightDivider
            };
            deferred.resolve(modifiedWidget);
            return deferred.promise;
        }

    };



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
                        for(chartObjects in widget.charts){
                            for(dataObjects in response.data){
                                if(String(widget.charts[chartObjects].metrics[0].metricId) === String(response.data[dataObjects].metricId)){
                                    updatedCharts.push({
                                        channelId: widget.charts[chartObjects].channelId,
                                        chartName: widget.charts[chartObjects].name,
                                        chartType: typeof widget.charts[chartObjects].metrics[0].chartType != 'undefined'? widget.charts[chartObjects].metrics[0].chartType: '',
                                        chartOptions: widget.charts[chartObjects].metrics[0].chartOptions,
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
                        console.log(error);
                        $("#widgetData-"+widget._id).hide();
                        $("#errorWidgetData-"+widget._id).show();
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
                                var yValue = 0, endpointArray;
                                if(widget.charts[i].chartData[dataObjects].total != null && Object.keys(widget.charts[i].chartData[dataObjects].total.length != 0 )) {
                                    for(keyValuePairs in widget.charts[i].chartData[dataObjects].total) {
                                        //console.log(widget.charts[i].chartData[dataObjects].total[keyValuePairs], keyValuePairs);
                                        if(keyValuePairs.search('/') > -1) {
                                            endpointArray = keyValuePairs.split('/');
                                            for(splittedValues in endpointArray) {
                                                console.log(splittedValues, endpointArray[splittedValues]);
                                            }
                                        }
                                        else if(keyValuePairs == currentItem) {
                                            yValue = widget.charts[i].chartData[dataObjects].total[currentItem];
                                        }
                                    }

                                    /*
                                     if(typeof widget.charts[i].chartData[dataObjects].total[currentItem] != 'undefined') {
                                     yValue = widget.charts[i].chartData[dataObjects].total[currentItem];
                                     }
                                     */
                                }
                                formattedChartData.push(
                                    {
                                        x: moment(widget.charts[i].chartData[dataObjects].date),
                                        //y: (widget.charts[i].chartData[dataObjects].total != null && Object.keys(widget.charts[i].chartData[dataObjects].total.length != 0 )? (typeof widget.charts[i].chartData[dataObjects].total[currentItem] != 'undefined' ? widget.charts[i].chartData[dataObjects].total[currentItem] : 0) : 0)
                                        y: yValue
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
                                var yValue = 0;
                                if(widget.charts[i].chartData[dataObjects].total != null && Object.keys(widget.charts[i].chartData[dataObjects].total.length != 0 )) {
                                    //console.log(widget.charts[i].chartData[dataObjects].total);
                                    if(typeof widget.charts[i].chartData[dataObjects].total[currentItem] != 'undefined') {
                                        yValue = widget.charts[i].chartData[dataObjects].total[currentItem];
                                    }
                                }
                                formattedChartData.push(
                                    {
                                        x: moment(widget.charts[i].chartData[dataObjects].date),
                                        //y: (widget.charts[i].chartData[dataObjects].total != null && Object.keys(widget.charts[i].chartData[dataObjects].total.length != 0 )? (typeof widget.charts[i].chartData[dataObjects].total[currentItem] != 'undefined' ? widget.charts[i].chartData[dataObjects].total[currentItem] : 0) : 0)
                                        y: yValue
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
                                    formattedChartData.push({y:parseInt(widget.charts[i].chartData[dataObjects].values),key: widget.charts[i].chartData[dataObjects].name, color:null});
                                }

                            }
                        }
                        changedWidget.charts[i].chartData.push(formattedChartData);
                    }
                }

                else if(widget.charts[i].chartType == 'instagramPosts'){
                    changedWidget.charts[i].chartData = [];
                    if(typeof(widget.charts[i].chartData[0].total) === 'object') {
                        var images = 'images';
                        var thumbnail='thumbnail';
                        var likes ='likes';
                        var comments='comments'
                        var count='count';
                        var caption='caption';
                        var post='text';
                        var link='link';
                        var url='url';


                        for(dataObjects in widget.charts[i].chartData){
                            formattedChartData.push(
                                {
                                    date: widget.charts[i].chartData[dataObjects].date,
                                    image: (widget.charts[i].chartData[dataObjects].total != null && Object.keys(widget.charts[i].chartData[dataObjects].total.length != 0 )?
                                                (widget.charts[i].chartData[dataObjects].total[images] != null?
                                                    (widget.charts[i].chartData[dataObjects].total[images][thumbnail] != null?
                                                        (typeof widget.charts[i].chartData[dataObjects].total[images][thumbnail][url] != 'undefined' ? widget.charts[i].chartData[dataObjects].total[images][thumbnail][url] : ''):''):''):''),

                                    postComment: (widget.charts[i].chartData[dataObjects].total != null && Object.keys(widget.charts[i].chartData[dataObjects].total.length != 0 )?
                                                    (widget.charts[i].chartData[dataObjects].total[caption] != null ?
                                                        (typeof widget.charts[i].chartData[dataObjects].total[caption][post] != 'undefined'?
                                                            widget.charts[i].chartData[dataObjects].total[caption][post] : ''): '') : ''),
                                    likes: (widget.charts[i].chartData[dataObjects].total != null && Object.keys(widget.charts[i].chartData[dataObjects].total.length != 0 )?
                                            (widget.charts[i].chartData[dataObjects].total[likes] != null?
                                                (typeof widget.charts[i].chartData[dataObjects].total[likes][count] != 'undefined' ? widget.charts[i].chartData[dataObjects].total[likes][count] : 0):0):0),

                                    comments: (widget.charts[i].chartData[dataObjects].total != null && Object.keys(widget.charts[i].chartData[dataObjects].total.length != 0 )?
                                            (widget.charts[i].chartData[dataObjects].total[comments] != null?
                                                (typeof widget.charts[i].chartData[dataObjects].total[comments][count] != 'undefined' ? widget.charts[i].chartData[dataObjects].total[comments][count] : 0):0):0),
                                    links: (widget.charts[i].chartData[dataObjects].total != null && Object.keys(widget.charts[i].chartData[dataObjects].total.length != 0 )?
                                            (typeof widget.charts[i].chartData[dataObjects].total[link] != 'undefined' ? widget.charts[i].chartData[dataObjects].total[link] : '') : ''),
                                }
                            );
                        }
                        changedWidget.charts[i].chartData[items] = formattedChartData;
                    }
                    else{
                        var images = 'images';
                        var thumbnail='thumbnail';
                        var likes ='likes';
                        var comments='comments'
                        var count='count';
                        var caption='caption';
                        var post='text';
                        var link='link';


                        for(dataObjects in widget.charts[i].chartData){
                            formattedChartData.push(
                                {
                                    date: widget.charts[i].chartData[dataObjects].date,
                                    image: (widget.charts[i].chartData[dataObjects].total != null && Object.keys(widget.charts[i].chartData[dataObjects].total.length != 0 )? (typeof widget.charts[i].chartData[dataObjects].total[images][thumbnail] != 'undefined' ? widget.charts[i].chartData[dataObjects].total[images][thumbnail] : 0) : 0),
                                    postComment: (widget.charts[i].chartData[dataObjects].total != null && Object.keys(widget.charts[i].chartData[dataObjects].total.length != 0 )? (typeof widget.charts[i].chartData[dataObjects].total[caption][post] != 'undefined' ? widget.charts[i].chartData[dataObjects].total[caption][post] : 0) : 0),
                                    likes: (widget.charts[i].chartData[dataObjects].total != null && Object.keys(widget.charts[i].chartData[dataObjects].total.length != 0 )? (typeof widget.charts[i].chartData[dataObjects].total[likes][count] != 'undefined' ? widget.charts[i].chartData[dataObjects].total[likes][count] : 0) : 0),
                                    comments: (widget.charts[i].chartData[dataObjects].total != null && Object.keys(widget.charts[i].chartData[dataObjects].total.length != 0 )? (typeof widget.charts[i].chartData[dataObjects].total[comments][count] != 'undefined' ? widget.charts[i].chartData[dataObjects].total[comments][count] : 0) : 0),
                                    links: (widget.charts[i].chartData[dataObjects].total != null && Object.keys(widget.charts[i].chartData[dataObjects].total.length != 0 )? (typeof widget.charts[i].chartData[dataObjects].total[link] != 'undefined' ? widget.charts[i].chartData[dataObjects].total[link] : 0) : 0),
                                }
                            );
                        }
                        changedWidget.charts[i].chartData[items] = formattedChartData;
                    }
                }

                else if(widget.charts[i].chartType == 'highEngagementTweets'){
                    changedWidget.charts[i].chartData = [];
                    var likes ='favorite_count';
                    var reTweet='retweet_count'
                    var entities='entities';
                    var media='media';
                    var post='text';
                    var link='expanded_url';

                    for(dataObjects in widget.charts[i].chartData){
                        formattedChartData.push(
                            {
                                date: widget.charts[i].chartData[dataObjects].date,
                                likes: (widget.charts[i].chartData[dataObjects].total != null && Object.keys(widget.charts[i].chartData[dataObjects].total.length != 0 )? (typeof widget.charts[i].chartData[dataObjects].total[likes] != 'undefined' ? widget.charts[i].chartData[dataObjects].total[likes] : 0) : 0),
                                reTweet: (widget.charts[i].chartData[dataObjects].total != null && Object.keys(widget.charts[i].chartData[dataObjects].total.length != 0 )? (typeof widget.charts[i].chartData[dataObjects].total[reTweet] != 'undefined' ? widget.charts[i].chartData[dataObjects].total[reTweet] : 0) : 0),
                                postComment: (widget.charts[i].chartData[dataObjects].total != null && Object.keys(widget.charts[i].chartData[dataObjects].total.length != 0 )? (typeof widget.charts[i].chartData[dataObjects].total[post] != 'undefined' ? widget.charts[i].chartData[dataObjects].total[post] : 0) : 0),
                                links: (widget.charts[i].chartData[dataObjects].total != null && Object.keys(widget.charts[i].chartData[dataObjects].total.length != 0 )? (typeof widget.charts[i].chartData[dataObjects].total.entities!= 'undefined' ? widget.charts[i].chartData[dataObjects].total.entities  : 0) : 0),
                            }
                        );
                    }
                    changedWidget.charts[i].chartData[items] = formattedChartData;
                }
            }
            formattedWidget.resolve(changedWidget);
            return formattedWidget.promise;
        }
    };

    //To load the data available for graphs into nvd3 format as per the chart type and to group the graphs by chart type
    this.chartCreator = function(widgetData){
        var modifiedCharts = [], graphData = [];
        graphData.lineData = []; graphData.barData = []; graphData.pieData = [];
        graphData.lineDataOptions = null; graphData.barDataOptions = null; graphData.pieDataOptions = null;
        graphData.instagramPosts=[]; graphData.highEngagementTweets=[];
        var instagramPost=false,highEngagement=false;

        var lowestLineValue =0, highestLineValue = 0;
        var barStacked = true;

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
                    var displaySummaryLineData = 0;

                    //To handle chart creation for regular widgets (basic, adv, fusion)
                    if(widgetData.charts[i].metricDetails!=undefined){
                        if(widgetData.charts[i].chartData[0].x){
                            for(var items in widgetData.charts[i].chartData) {
                                displaySummaryLineData += parseInt(widgetData.charts[i].chartData[items].y);
                                if(parseInt(widgetData.charts[i].chartData[items].y) < lowestLineValue)
                                    lowestLineValue = parseInt(widgetData.charts[i].chartData[items].y);
                                if(parseInt(widgetData.charts[i].chartData[items].y) > highestLineValue)
                                    highestLineValue = parseInt(widgetData.charts[i].chartData[items].y);
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
                                    if(parseInt(widgetData.charts[i].chartData[items][dataItems].y) < lowestLineValue)
                                        lowestLineValue = parseInt(widgetData.charts[i].chartData[items][dataItems].y);
                                    if(parseInt(widgetData.charts[i].chartData[items][dataItems].y) > highestLineValue)
                                        highestLineValue = parseInt(widgetData.charts[i].chartData[items][dataItems].y);
                                }
                                var endpointDisplayCode = widgetData.charts[i].metricDetails.objectTypes[0].meta.endpoint[items];
                                graphData.lineData.push({
                                    values: widgetData.charts[i].chartData[items],      //values - represents the array of {x,y} data points
                                    key: typeof widgetData.charts[i].metricDetails.objectTypes[0].meta.endpointDisplayName != 'undefined'? (typeof widgetData.charts[i].metricDetails.objectTypes[0].meta.endpointDisplayName[endpointDisplayCode] != 'undefined'? widgetData.charts[i].metricDetails.objectTypes[0].meta.endpointDisplayName[endpointDisplayCode]: widgetData.charts[i].metricDetails.objectTypes[0].meta.endpoint[items]) : widgetData.charts[i].metricDetails.objectTypes[0].meta.endpoint[items],
                                    //key: typeof widgetData.charts[i].metricDetails.objectTypes[0].meta.endpointDisplayName[endpointDisplayCode] != 'undefined'? widgetData.charts[i].metricDetails.objectTypes[0].meta.endpointDisplayName[endpointDisplayCode] : widgetData.charts[i].metricDetails.objectTypes[0].meta.endpoint[items], //key  - the name of the series.
                                    //key: widgetData.charts[i].metricDetails.objectTypes[0].meta.endpoint[items], //key  - the name of the series.
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
                            forceY: [lowestLineValue,highestLineValue == 0? 10 : highestLineValue + 10],
                            //yDomain: [lowestValue,highestValue],
                            legend: {
                                rightAlign: false
                            }
                        }
                    };
                }

                //If the chart type is BAR
                else if (widgetData.charts[i].chartType == 'bar'){
                    var displaySummaryBarData = 0, lowestValue = 0, highestValue = 0;

                    //To handle chart creation for regular widgets (basic, adv, fusion)
                    if(widgetData.charts[i].metricDetails!=undefined){
                        if(widgetData.charts[i].chartData[0].x){
                            for(items in widgetData.charts[i].chartData) {
                                displaySummaryBarData = displaySummaryBarData + parseInt(widgetData.charts[i].chartData[items].y);
                                if(parseInt(widgetData.charts[i].chartData[items].y) < lowestValue)
                                    lowestValue = parseInt(widgetData.charts[i].chartData[items].y);
                                if(parseInt(widgetData.charts[i].chartData[items].y) > highestValue)
                                    highestValue = parseInt(widgetData.charts[i].chartData[items].y);
                            }
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
                                for(dataItems in widgetData.charts[i].chartData[items]) {
                                    displaySummaryBarData = displaySummaryBarData + parseInt(widgetData.charts[i].chartData[items][dataItems].y);
                                    if(parseInt(widgetData.charts[i].chartData[items][dataItems].y) < lowestValue)
                                        lowestValue = parseInt(widgetData.charts[i].chartData[items][dataItems].y);
                                    if(parseInt(widgetData.charts[i].chartData[items][dataItems].y) > highestValue)
                                        highestValue = parseInt(widgetData.charts[i].chartData[items][dataItems].y);
                                }
                                graphData.barData.push({
                                    values: widgetData.charts[i].chartData[items],      //values - represents the array of {x,y} data points
                                    key: widgetData.charts[i].metricDetails.objectTypes[0].meta.endpoint[items], //key  - the name of the series.
                                    color: widgetData.charts[i].chartColour[items],  //color - optional: choose your own line color.
                                    summaryDisplay: parseInt(displaySummaryBarData)
                                });
                            }
                        }

                        if(typeof widgetData.charts[i].chartOptions != 'undefined') {
                            if(typeof widgetData.charts[i].chartOptions.stacked != 'undefined')
                                if(widgetData.charts[i].chartOptions.stacked == 'false')
                                barStacked = false;
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
                            stacked: barStacked,
                            forceY: [lowestValue,highestValue == 0? 10 : highestValue + 10],
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

                            for(var getPieData in widgetData.charts[i].chartData[customData]){
                                displaySummaryPieData = displaySummaryPieData + parseInt(widgetData.charts[i].chartData[customData][getPieData].y);
                                graphData.pieData.push({
                                    y: parseInt(widgetData.charts[i].chartData[customData][getPieData].y),
                                    key: widgetData.charts[i].chartData[customData][getPieData].key, //key  - the name of the series.
                                    color: widgetData.charts[i].chartData[customData][getPieData].color,  //color - optional: choose your own line color.
                                    summaryDisplay: displaySummaryPieData
                                });
                                displaySummaryPieData =0;
                            }

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

                //If the chart type is instagramPost
                else if(widgetData.charts[i].chartType == 'instagramPosts'){
                    instagramPost=true;
                    for(items in widgetData.charts[i].chartData) {
                        graphData.instagramPosts.push(widgetData.charts[i].chartData[items]);
                    }
                }

                 //If the chart type is highEngagementTweets
                else if(widgetData.charts[i].chartType == 'highEngagementTweets'){
                    highEngagement=true;
                    for(items in widgetData.charts[i].chartData) {
                        graphData.highEngagementTweets.push(widgetData.charts[i].chartData[items]);
                    }
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

        if(instagramPost != false)
            modifiedCharts.push({
                'options': {
                    'chart':{'type':'instagramPosts'}
                },
                'data': graphData.instagramPosts[0]
            });

        if(highEngagement !=false){
            modifiedCharts.push({
                'options': {
                    'chart':{'type':'highEngagementTweets'}
                },
                'data': graphData.highEngagementTweets[0]
            });
        }
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
            chartName = (typeof widget.name != 'undefined'? widget.name: '');
        }
/*
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
*/

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