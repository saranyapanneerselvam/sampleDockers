var showMetricApp = angular.module('inspinia');

showMetricApp.service('createWidgets',function($http,$q){

    this.widgetHandler = function (widget, dateRange,isPublic) {

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
                            dataLoadedWidgetArray.push(getRegularWidgetElements(widgetList[subWidgets], dateRange,isPublic));
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
            var dataLoadedWidget = getRegularWidgetElements(tempWidget, dateRange,isPublic);
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
            updatedCharts = getRegularWidgetData(widget, dateRange,isPublic);
            updatedCharts.then(
                function successCallback(updatedCharts) {
                    widget.charts = updatedCharts;
                    var metricDetails = [];
                    for(var charts in widget.charts)
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
        
        function getRegularWidgetData(widget, dateRange, isPublic) {

            var deferred = $q.defer();
            var updatedCharts = [];
            if (isPublic){
                var dataUrl = {
                method: 'POST',
                url: '/api/v1/widgets/data/' + widget._id,
                data: {
                    "startDate": dateRange.startDate,
                        "endDate": dateRange.endDate,
                        "params":'public'
                }
                };
            }
            else {
                var dataUrl = {
                    method: 'POST',
                    url: '/api/v1/widgets/data/' + widget._id,
                    data: {
                        "startDate": dateRange.startDate,
                        "endDate": dateRange.endDate,
                    }
                }
            }
            $http(dataUrl).then(
                function successCallback(response) {
                    for(var chartObjects in widget.charts){
                        for(var datas in response.data){
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
                                        for(var keyValuePairs in widget.charts[charts].chartData[datas].total) {
                                            if(keyValuePairs.search('/') > -1) {
                                                endpointArray = keyValuePairs.split('/');
                                                for(var splittedValues in endpointArray) {
                                                    //console.log(splittedValues, endpointArray[splittedValues]);
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
                            for(var datas in widget.charts[charts].chartData) {
                                formattedChartData.push({
                                        x: moment(widget.charts[charts].chartData[datas].date),
                                        y: widget.charts[charts].chartData[datas].total != null ? widget.charts[charts].chartData[datas].total : 0
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
                    else if(chartType == "highestEngagementLinkedIn"){
                        if(typeof widget.charts[charts].chartData[0] != 'undefined') {
                            if(typeof(widget.charts[charts].chartData[0].total) === 'object') {
                                var likes ='likes';
                                var clicks='clicks';
                                var impressions='impressions';
                                var shares='shares';
                                var comments='comments'
                                var post='text';
                                var url='url';

                                var formattedChartDataArray = [];
                                for(datas in widget.charts[charts].chartData) {
                                    var formattedChartData = {
                                        date: widget.charts[charts].chartData[datas].date,
                                        link: (widget.charts[charts].chartData[datas].total != null && Object.keys(widget.charts[charts].chartData[datas].total.length != 0 )?
                                            (widget.charts[charts].chartData[datas].total[url] != null?
                                                (typeof widget.charts[charts].chartData[datas].total[url] != 'undefined' ? widget.charts[charts].chartData[datas].total[url]:''):''):''),

                                        postComment: (widget.charts[charts].chartData[datas].total != null && Object.keys(widget.charts[charts].chartData[datas].total.length != 0 )?
                                            (widget.charts[charts].chartData[datas].total[post] != null?
                                                (typeof widget.charts[charts].chartData[datas].total[post] != 'undefined' ? widget.charts[charts].chartData[datas].total[post]:''):''):''),

                                        impressions: (widget.charts[charts].chartData[datas].total != null && Object.keys(widget.charts[charts].chartData[datas].total.length != 0 )?
                                            (widget.charts[charts].chartData[datas].total[impressions] != null?
                                                (typeof widget.charts[charts].chartData[datas].total[impressions] != 'undefined' ? widget.charts[charts].chartData[datas].total[impressions]:0):0):0),

                                        shares: (widget.charts[charts].chartData[datas].total != null && Object.keys(widget.charts[charts].chartData[datas].total.length != 0 )?
                                            (widget.charts[charts].chartData[datas].total[shares] != null ?
                                                (typeof widget.charts[charts].chartData[datas].total[shares] != 'undefined'?
                                                    widget.charts[charts].chartData[datas].total[shares] : 0): 0) : 0),
                                        likes: (widget.charts[charts].chartData[datas].total != null && Object.keys(widget.charts[charts].chartData[datas].total.length != 0 )?
                                            (widget.charts[charts].chartData[datas].total[likes] != null?
                                                (typeof widget.charts[charts].chartData[datas].total[likes] != 'undefined' ? widget.charts[charts].chartData[datas].total[likes] : 0):0):0),

                                        comments: (widget.charts[charts].chartData[datas].total != null && Object.keys(widget.charts[charts].chartData[datas].total.length != 0 )?
                                            (widget.charts[charts].chartData[datas].total[comments] != null?
                                                (typeof widget.charts[charts].chartData[datas].total[comments]!= 'undefined' ? widget.charts[charts].chartData[datas].total[comments] : 0):0):0),
                                        clicks: (widget.charts[charts].chartData[datas].total != null && Object.keys(widget.charts[charts].chartData[datas].total.length != 0 )?
                                            (widget.charts[charts].chartData[datas].total[clicks] != null?
                                                (typeof widget.charts[charts].chartData[datas].total[clicks]!= 'undefined' ? widget.charts[charts].chartData[datas].total[clicks] : 0):0):0),

                                        /*links: (widget.charts[charts].chartData[datas].total != null && Object.keys(widget.charts[charts].chartData[datas].total.length != 0 )?
                                         (typeof widget.charts[charts].chartData[datas].total[link] != 'undefined' ? widget.charts[charts].chartData[datas].total[link] : '') : ''),*/
                                    };
                                    formattedChartDataArray.push(formattedChartData);
                                }
                                widget.charts[charts].chartData = formattedChartDataArray;
                            }
                        }
/*
                        if(typeof(widget.charts[charts].chartData[0].total) === 'object') {
                            var likes ='likes';
                            var clicks='clicks';
                            var impressions='impressions';
                            var shares='shares';
                            var comments='comments'
                            var post='text';
                            var url='url';

                            var formattedChartDataArray = [];
                            for(datas in widget.charts[charts].chartData) {
                                var formattedChartData = {
                                    date: widget.charts[charts].chartData[datas].date,
                                    link: (widget.charts[charts].chartData[datas].total != null && Object.keys(widget.charts[charts].chartData[datas].total.length != 0 )?
                                        (widget.charts[charts].chartData[datas].total[url] != null?
                                            (typeof widget.charts[charts].chartData[datas].total[url] != 'undefined' ? widget.charts[charts].chartData[datas].total[url]:''):''):''),

                                    postComment: (widget.charts[charts].chartData[datas].total != null && Object.keys(widget.charts[charts].chartData[datas].total.length != 0 )?
                                        (widget.charts[charts].chartData[datas].total[post] != null?
                                            (typeof widget.charts[charts].chartData[datas].total[post] != 'undefined' ? widget.charts[charts].chartData[datas].total[post]:''):''):''),

                                    impressions: (widget.charts[charts].chartData[datas].total != null && Object.keys(widget.charts[charts].chartData[datas].total.length != 0 )?
                                        (widget.charts[charts].chartData[datas].total[impressions] != null?
                                            (typeof widget.charts[charts].chartData[datas].total[impressions] != 'undefined' ? widget.charts[charts].chartData[datas].total[impressions]:0):0):0),

                                    shares: (widget.charts[charts].chartData[datas].total != null && Object.keys(widget.charts[charts].chartData[datas].total.length != 0 )?
                                        (widget.charts[charts].chartData[datas].total[shares] != null ?
                                            (typeof widget.charts[charts].chartData[datas].total[shares] != 'undefined'?
                                                widget.charts[charts].chartData[datas].total[shares] : 0): 0) : 0),
                                    likes: (widget.charts[charts].chartData[datas].total != null && Object.keys(widget.charts[charts].chartData[datas].total.length != 0 )?
                                        (widget.charts[charts].chartData[datas].total[likes] != null?
                                            (typeof widget.charts[charts].chartData[datas].total[likes] != 'undefined' ? widget.charts[charts].chartData[datas].total[likes] : 0):0):0),

                                    comments: (widget.charts[charts].chartData[datas].total != null && Object.keys(widget.charts[charts].chartData[datas].total.length != 0 )?
                                        (widget.charts[charts].chartData[datas].total[comments] != null?
                                            (typeof widget.charts[charts].chartData[datas].total[comments]!= 'undefined' ? widget.charts[charts].chartData[datas].total[comments] : 0):0):0),
                                    clicks: (widget.charts[charts].chartData[datas].total != null && Object.keys(widget.charts[charts].chartData[datas].total.length != 0 )?
                                        (widget.charts[charts].chartData[datas].total[clicks] != null?
                                            (typeof widget.charts[charts].chartData[datas].total[clicks]!= 'undefined' ? widget.charts[charts].chartData[datas].total[clicks] : 0):0):0),

                                    /!*links: (widget.charts[charts].chartData[datas].total != null && Object.keys(widget.charts[charts].chartData[datas].total.length != 0 )?
                                        (typeof widget.charts[charts].chartData[datas].total[link] != 'undefined' ? widget.charts[charts].chartData[datas].total[link] : '') : ''),*!/
                                };
                                formattedChartDataArray.push(formattedChartData);
                            }
                            widget.charts[charts].chartData = formattedChartDataArray;
                        }
*/
                    }
                }
                for(var charts in widget.charts) {
                    var chartType = widget.charts[charts].chartType;
                    if(chartType == "line" || chartType == "bar" || chartType == "area" || chartType == "pie") {
                        if(typeof widget.charts[charts].chartData[0] != 'undefined') {
                            if(widget.charts[charts].chartData[0].x){
                                var summaryValue = 0;
                                for(var datas in widget.charts[charts].chartData)
                                    summaryValue += parseInt(widget.charts[charts].chartData[datas].y);
                                if(typeof widget.charts[charts].metricDetails.objectTypes[0].meta.summaryType != 'undefined') {
                                    if(widget.charts[charts].metricDetails.objectTypes[0].meta.summaryType == 'avg') {
                                        summaryValue = parseFloat(summaryValue/widget.charts[charts].chartData.length).toFixed(2);
                                    }
                                    else if(widget.charts[charts].metricDetails.objectTypes[0].meta.summaryType == 'snapshot') {
                                        var latestDate = '';
                                        for(var data in widget.charts[charts].chartData) {
                                            if(latestDate<moment(widget.charts[charts].chartData[data].x)) {
                                                latestDate = moment(widget.charts[charts].chartData[data].x);
                                                summaryValue = widget.charts[charts].chartData[data].y;
                                            }
                                        }
                                    }
                                }

                                if(chartType == 'line' || chartType == 'bar') {
                                    widgetCharts.push({
                                        'type': widget.charts[charts].chartType,
                                        'values': widget.charts[charts].chartData,      //values - represents the array of {x,y} data points
                                        'key': widget.charts[charts].metricDetails.name, //key  - the name of the series.
                                        'color': widget.charts[charts].chartColour[0],  //color - optional: choose your own line color.
                                        'summaryDisplay': parseFloat(summaryValue)
                                    });
                                }
                                else if(chartType == 'area') {
                                    widgetCharts.push({
                                        'type': widget.charts[charts].chartType,
                                        'values': widget.charts[charts].chartData,      //values - represents the array of {x,y} data points
                                        'key': widget.charts[charts].metricDetails.name, //key  - the name of the series.
                                        'color': widget.charts[charts].chartColour[0],  //color - optional: choose your own line color.
                                        'summaryDisplay': parseFloat(summaryValue),
                                        'area': true
                                    });
                                }
                                else {
                                    widgetCharts.push({
                                        'type': widget.charts[charts].chartType,
                                        'y': parseFloat(summaryValue),      //values - represents the array of {x,y} data points
                                        'key': widget.charts[charts].metricDetails.name, //key  - the name of the series.
                                        'color': widget.charts[charts].chartColour[0],  //color - optional: choose your own line color.
                                        'summaryDisplay': parseFloat(summaryValue)
                                    });
                                }
                            }
                            else {
                                for(var items in widget.charts[charts].chartData) {
                                    var summaryValue = 0;
                                    for(var datas in widget.charts[charts].chartData[items]) {
                                        summaryValue += parseInt(widget.charts[charts].chartData[items][datas].y);
                                        if(typeof widget.charts[charts].metricDetails.objectTypes[0].meta.summaryType != 'undefined') {
                                            if(widget.charts[charts].metricDetails.objectTypes[0].meta.summaryType == 'avg')
                                                summaryValue = parseFloat(summaryValue/widget.charts[charts].chartData[items].length).toFixed(2);
                                            else if(widget.charts[charts].metricDetails.objectTypes[0].meta.summaryType == 'snapshot') {
                                                var latestDate = '';
                                                for(var data in widget.charts[charts].chartData[items]) {
                                                    if(latestDate<moment(widget.charts[charts].chartData[items][data].x)) {
                                                        latestDate = moment(widget.charts[charts].chartData[items][data].x);
                                                        summaryValue = widget.charts[charts].chartData[items][data].y;
                                                    }
                                                }
                                            }
                                        }
                                    }


                                    var endpointDisplayCode = widget.charts[charts].metricDetails.objectTypes[0].meta.endpoint[items];
                                    if(chartType == 'line' || chartType == 'bar') {
                                        widgetCharts.push({
                                            'type': widget.charts[charts].chartType,
                                            'values': widget.charts[charts].chartData[items],      //values - represents the array of {x,y} data points
                                            'key': typeof widget.charts[charts].metricDetails.objectTypes[0].meta.endpointDisplayName != 'undefined'? (typeof widget.charts[charts].metricDetails.objectTypes[0].meta.endpointDisplayName[endpointDisplayCode] != 'undefined'? widget.charts[charts].metricDetails.objectTypes[0].meta.endpointDisplayName[endpointDisplayCode]: widget.charts[charts].metricDetails.objectTypes[0].meta.endpoint[items]) : widget.charts[charts].metricDetails.objectTypes[0].meta.endpoint[items],
                                            'color': typeof widget.charts[charts].chartColour != 'undefined' ? (typeof widget.charts[charts].chartColour[items] != 'undefined'? widget.charts[charts].chartColour[items] : '') : '',  //color - optional: choose your own line color.
                                            'summaryDisplay': parseFloat(summaryValue)
                                        });
                                    }
                                    else if(chartType == 'area') {
                                        widgetCharts.push({
                                            'type': widget.charts[charts].chartType,
                                            'values': widget.charts[charts].chartData[items],      //values - represents the array of {x,y} data points
                                            'key': typeof widget.charts[charts].metricDetails.objectTypes[0].meta.endpointDisplayName != 'undefined'? (typeof widget.charts[charts].metricDetails.objectTypes[0].meta.endpointDisplayName[endpointDisplayCode] != 'undefined'? widget.charts[charts].metricDetails.objectTypes[0].meta.endpointDisplayName[endpointDisplayCode]: widget.charts[charts].metricDetails.objectTypes[0].meta.endpoint[items]) : widget.charts[charts].metricDetails.objectTypes[0].meta.endpoint[items],
                                            'color': typeof widget.charts[charts].chartColour != 'undefined' ? (typeof widget.charts[charts].chartColour[items] != 'undefined'? widget.charts[charts].chartColour[items] : '') : '',  //color - optional: choose your own line color.
                                            'summaryDisplay': parseFloat(summaryValue),
                                            'area': true
                                        });
                                    }
                                    else {
                                        widgetCharts.push({
                                            'type': widget.charts[charts].chartType,
                                            'y': parseFloat(summaryValue),      //values - represents the array of {x,y} data points
                                            'key': typeof widget.charts[charts].metricDetails.objectTypes[0].meta.endpointDisplayName != 'undefined'? (typeof widget.charts[charts].metricDetails.objectTypes[0].meta.endpointDisplayName[endpointDisplayCode] != 'undefined'? widget.charts[charts].metricDetails.objectTypes[0].meta.endpointDisplayName[endpointDisplayCode]: widget.charts[charts].metricDetails.objectTypes[0].meta.endpoint[items]) : widget.charts[charts].metricDetails.objectTypes[0].meta.endpoint[items],
                                            'color': typeof widget.charts[charts].chartColour != 'undefined' ? (typeof widget.charts[charts].chartColour[items] != 'undefined'? widget.charts[charts].chartColour[items] : '') : '',  //color - optional: choose your own line color.
                                            'summaryDisplay': parseFloat(summaryValue)
                                        });
                                    }
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
                    else if(chartType == 'highestEngagementLinkedIn'){
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
            finalCharts.lineCharts = [], finalCharts.barCharts = [], finalCharts.pieCharts = [], finalCharts.instagramPosts = [], finalCharts.highEngagementTweets = [],finalCharts.highestEngagementLinkedIn=[];
            var graphOptions = {
                lineDataOptions: {
                    chart: {
                        type: 'lineChart',
                        noData: 'Data unavailable for this metric',
                        margin : {top: 20, right: 25, bottom: 30, left: 35},
                        x: function(d){ return d.x; },
                        y: function(d){ return d.y; },
                        useInteractiveGuideline: true,
                        xAxis: {
                            tickFormat: function(d) {
                                return d3.time.format('%d/%m/%y')(new Date(d))},
                            showMaxMin: false
                        },
                        yAxis: {
                            tickFormat: function(d) {
                                return d3.format('f')(d);},
                            showMaxMin: false
                        },
                        interpolate: "monotone",
                        axisLabelDistance: -10,
                        showLegend: false,
                        //forceY: [lowestLineValue,highestLineValue == 0? 10 : highestLineValue + 10],
                        //yDomain: [lowestValue,highestValue],
                        legend: {
                            rightAlign: false,
                            margin: {
                                bottom: 25
                            }
                        }
                    }
                },
                barDataOptions: {
                    chart: {
                        type: 'multiBarChart',
                        noData: 'Data unavailable for this metric',
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
                        showLegend: false,
                        stacked: true,
                        //forceY: [lowestValue,highestValue == 0? 10 : highestValue + 10],
                        showControls: false,
                        legend: {
                            rightAlign: false,
                            margin: {
                                bottom: 25
                            }
                        }
                    }
                },
                pieDataOptions: {
                    chart: {
                        type: 'pieChart',
                        noData: 'Data unavailable for this metric',
                        margin : {top: 0, right: 15, bottom: 15, left: 15},
                        x: function (d) {
                            return d.key;
                        },
                        y: function (d) {
                            return d.y;
                        },
                        showLabels: false,
                        showLegend: false,
                        labelsOutside: false,
                        tooltips: true,
                        //tooltipcontent: 'toolTipContentFunction()',
                        //duration: 50,
                        labelThreshold: 0.01,
                        labelSunbeamLayout: true,
                        legend: {
                            rightAlign: false,
                            margin: {
                                bottom: 25
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
                },
                highestEngagementLinkedIn: {
                    chart: {
                        type: 'highestEngagementLinkedIn'
                    }
                },
                emptyCharts: {
                    chart: {
                        type: 'emptyCharts'
                    }
                }
            };
            var sizeY,sizeX,chartsCount = 0,individualGraphWidthDivider,individualGraphHeightDivider,chartName,finalChartData = [];
            var widgetLayoutOptions = [
                {W:1,H:1,N:0,r:1,c:1},

                {W:1,H:1,N:1,r:1,c:1},
                {W:1,H:1,N:2,r:2,c:1},
                {W:1,H:1,N:3,r:3,c:1},
                {W:1,H:1,N:4,r:4,c:1},
                {W:1,H:1,N:5,r:5,c:1},
                {W:1,H:1,N:6,r:6,c:1},
                {W:1,H:1,N:7,r:7,c:1},
                {W:1,H:1,N:8,r:8,c:1},

                {W:2,H:1,N:0,r:1,c:1},

                {W:2,H:1,N:1,r:1,c:1},
                {W:2,H:1,N:2,r:1,c:2},
                {W:2,H:1,N:3,r:2,c:1},
                {W:2,H:1,N:4,r:2,c:2},
                {W:2,H:1,N:5,r:2,c:3},
                {W:2,H:1,N:6,r:2,c:3},
                {W:2,H:1,N:7,r:3,c:3},
                {W:2,H:1,N:8,r:3,c:3},

                {W:3,H:1,N:0,r:1,c:1},

                {W:3,H:1,N:1,r:1,c:1},
                {W:3,H:1,N:2,r:1,c:2},
                {W:3,H:1,N:3,r:1,c:3},
                {W:3,H:1,N:4,r:2,c:2},
                {W:3,H:1,N:5,r:2,c:3},
                {W:3,H:1,N:6,r:2,c:3},
                {W:3,H:1,N:7,r:3,c:3},
                {W:3,H:1,N:8,r:3,c:3},

                {W:4,H:1,N:0,r:1,c:1},

                {W:4,H:1,N:1,r:1,c:1},
                {W:4,H:1,N:2,r:1,c:2},
                {W:4,H:1,N:3,r:1,c:3},
                {W:4,H:1,N:4,r:1,c:4},
                {W:4,H:1,N:5,r:2,c:3},
                {W:4,H:1,N:6,r:2,c:3},
                {W:4,H:1,N:7,r:3,c:3},
                {W:4,H:1,N:8,r:3,c:3},

                {W:5,H:1,N:0,r:1,c:1},

                {W:5,H:1,N:1,r:1,c:1},
                {W:5,H:1,N:2,r:1,c:2},
                {W:5,H:1,N:3,r:1,c:3},
                {W:5,H:1,N:4,r:1,c:4},
                {W:5,H:1,N:5,r:1,c:5},
                {W:5,H:1,N:6,r:2,c:3},
                {W:5,H:1,N:7,r:2,c:4},
                {W:5,H:1,N:8,r:2,c:4},

                {W:6,H:1,N:0,r:1,c:1},

                {W:6,H:1,N:1,r:1,c:1},
                {W:6,H:1,N:2,r:1,c:2},
                {W:6,H:1,N:3,r:1,c:3},
                {W:6,H:1,N:4,r:1,c:4},
                {W:6,H:1,N:5,r:1,c:5},
                {W:6,H:1,N:6,r:2,c:3},
                {W:6,H:1,N:7,r:2,c:4},
                {W:6,H:1,N:8,r:2,c:4},

                {W:1,H:2,N:0,r:1,c:1},

                {W:1,H:2,N:1,r:1,c:1},
                {W:1,H:2,N:2,r:2,c:1},
                {W:1,H:2,N:3,r:3,c:1},
                {W:1,H:2,N:4,r:4,c:1},
                {W:1,H:2,N:5,r:5,c:1},
                {W:1,H:2,N:6,r:6,c:1},
                {W:1,H:2,N:7,r:7,c:1},
                {W:1,H:2,N:8,r:8,c:1},

                {W:2,H:2,N:0,r:1,c:1},

                {W:2,H:2,N:1,r:1,c:1},
                {W:2,H:2,N:2,r:1,c:2},
                {W:2,H:2,N:3,r:2,c:2},
                {W:2,H:2,N:4,r:2,c:2},
                {W:2,H:2,N:5,r:3,c:2},
                {W:2,H:2,N:6,r:3,c:2},
                {W:2,H:2,N:7,r:4,c:2},
                {W:2,H:2,N:8,r:4,c:2},

                {W:3,H:2,N:0,r:1,c:1},

                {W:3,H:2,N:1,r:1,c:1},
                {W:3,H:2,N:2,r:1,c:2},
                {W:3,H:2,N:3,r:2,c:2},
                {W:3,H:2,N:4,r:2,c:2},
                {W:3,H:2,N:5,r:2,c:3},
                {W:3,H:2,N:6,r:2,c:3},
                {W:3,H:2,N:7,r:2,c:4},
                {W:3,H:2,N:8,r:2,c:4},

                {W:4,H:2,N:0,r:1,c:1},

                {W:4,H:2,N:1,r:1,c:1},
                {W:4,H:2,N:2,r:1,c:2},
                {W:4,H:2,N:3,r:1,c:3},
                {W:4,H:2,N:4,r:2,c:2},
                {W:4,H:2,N:5,r:2,c:3},
                {W:4,H:2,N:6,r:2,c:3},
                {W:4,H:2,N:7,r:2,c:4},
                {W:4,H:2,N:8,r:2,c:4},

                {W:5,H:2,N:0,r:1,c:1},

                {W:5,H:2,N:1,r:1,c:1},
                {W:5,H:2,N:2,r:1,c:2},
                {W:5,H:2,N:3,r:1,c:3},
                {W:5,H:2,N:4,r:2,c:2},
                {W:5,H:2,N:5,r:2,c:3},
                {W:5,H:2,N:6,r:2,c:3},
                {W:5,H:2,N:7,r:2,c:4},
                {W:5,H:2,N:8,r:2,c:4},

                {W:6,H:2,N:0,r:1,c:1},

                {W:6,H:2,N:1,r:1,c:1},
                {W:6,H:2,N:2,r:1,c:2},
                {W:6,H:2,N:3,r:1,c:3},
                {W:6,H:2,N:4,r:2,c:2},
                {W:6,H:2,N:5,r:2,c:3},
                {W:6,H:2,N:6,r:2,c:3},
                {W:6,H:2,N:7,r:2,c:4},
                {W:6,H:2,N:8,r:2,c:4},

                {W:1,H:3,N:0,r:1,c:1},

                {W:1,H:3,N:1,r:1,c:1},
                {W:1,H:3,N:2,r:2,c:1},
                {W:1,H:3,N:3,r:3,c:1},
                {W:1,H:3,N:4,r:4,c:1},
                {W:1,H:3,N:5,r:5,c:1},
                {W:1,H:3,N:6,r:6,c:1},
                {W:1,H:3,N:7,r:7,c:1},
                {W:1,H:3,N:8,r:8,c:1},

                {W:2,H:3,N:0,r:1,c:1},

                {W:2,H:3,N:1,r:1,c:1},
                {W:2,H:3,N:2,r:2,c:1},
                {W:2,H:3,N:3,r:3,c:1},
                {W:2,H:3,N:4,r:2,c:2},
                {W:2,H:3,N:5,r:3,c:2},
                {W:2,H:3,N:6,r:3,c:2},
                {W:2,H:3,N:7,r:4,c:2},
                {W:2,H:3,N:8,r:4,c:2},

                {W:3,H:3,N:0,r:1,c:1},

                {W:3,H:3,N:1,r:1,c:1},
                {W:3,H:3,N:2,r:1,c:2},
                {W:3,H:3,N:3,r:2,c:2},
                {W:3,H:3,N:4,r:2,c:2},
                {W:3,H:3,N:5,r:2,c:3},
                {W:3,H:3,N:6,r:2,c:3},
                {W:3,H:3,N:7,r:2,c:4},
                {W:3,H:3,N:8,r:2,c:4},

                {W:4,H:3,N:0,r:1,c:1},

                {W:4,H:3,N:1,r:1,c:1},
                {W:4,H:3,N:2,r:1,c:2},
                {W:4,H:3,N:3,r:1,c:3},
                {W:4,H:3,N:4,r:2,c:2},
                {W:4,H:3,N:5,r:2,c:3},
                {W:4,H:3,N:6,r:2,c:3},
                {W:4,H:3,N:7,r:2,c:4},
                {W:4,H:3,N:8,r:2,c:4},

                {W:5,H:3,N:0,r:1,c:1},

                {W:5,H:3,N:1,r:1,c:1},
                {W:5,H:3,N:2,r:1,c:2},
                {W:5,H:3,N:3,r:1,c:3},
                {W:5,H:3,N:4,r:2,c:2},
                {W:5,H:3,N:5,r:2,c:3},
                {W:5,H:3,N:6,r:2,c:3},
                {W:5,H:3,N:7,r:2,c:4},
                {W:5,H:3,N:8,r:2,c:4},

                {W:6,H:3,N:0,r:1,c:1},

                {W:6,H:3,N:1,r:1,c:1},
                {W:6,H:3,N:2,r:1,c:2},
                {W:6,H:3,N:3,r:1,c:3},
                {W:6,H:3,N:4,r:2,c:2},
                {W:6,H:3,N:5,r:2,c:3},
                {W:6,H:3,N:6,r:2,c:3},
                {W:6,H:3,N:7,r:2,c:4},
                {W:6,H:3,N:8,r:2,c:4}
            ];
            var lineDataHighValue = 0, lineDataLowValue = 0;
            var barDataHighValue = 0, barDataLowValue = 0;

            for(var charts in widgetCharts) {
                if(widgetCharts[charts].type == 'line' || widgetCharts[charts].type == 'area') {
                    finalCharts.lineCharts.push(widgetCharts[charts]);
                    for(var values in widgetCharts[charts].values) {
                        if(widgetCharts[charts].values[values].y < lineDataLowValue)
                            lineDataLowValue = parseFloat(widgetCharts[charts].values[values].y);
                        if(widgetCharts[charts].values[values].y > lineDataHighValue)
                            lineDataHighValue = parseFloat(widgetCharts[charts].values[values].y);
                    }
                }
                else if(widgetCharts[charts].type == 'bar') {
                    finalCharts.barCharts.push(widgetCharts[charts]);
                    for(var values in widgetCharts[charts].values) {
                        if(widgetCharts[charts].values[values].y < barDataLowValue)
                            barDataLowValue = parseFloat(widgetCharts[charts].values[values].y);
                        if(widgetCharts[charts].values[values].y > barDataHighValue)
                            barDataHighValue = parseFloat(widgetCharts[charts].values[values].y);
                    }
                }
                else if(widgetCharts[charts].type == 'pie') finalCharts.pieCharts.push(widgetCharts[charts]);
                else if(widgetCharts[charts].type == 'instagramPosts') finalCharts.instagramPosts.push(widgetCharts[charts]);
                else if(widgetCharts[charts].type == 'highEngagementTweets') finalCharts.highEngagementTweets.push(widgetCharts[charts]);
                else if(widgetCharts[charts].type == 'highestEngagementLinkedIn') finalCharts.highestEngagementLinkedIn.push(widgetCharts[charts]);

            }

            var chartColorChecker = [];
            var colourChart = ['#EF5350','#EC407A','#9C27B0','#42A5F5','#26A69A','#FFCA28','#FF7043','#8D6E63'];
            function fetchAColour(currentColour,colourArray){
                var checker;
                for(var colors in colourChart) {
                    checker = false;
                    for(var items in colourArray) {
                        if(colourChart[colors] == colourArray[items])
                            checker = true;
                    }
                    if(checker == false)
                        return colourChart[colors];
                }
            }

            if(finalCharts.lineCharts.length > 0) {
                chartsCount++;

                for(var charts in finalCharts.lineCharts) {
                    for(var items in chartColorChecker) {
                        if(finalCharts.lineCharts[charts].color == chartColorChecker[items]) {
                            var neededColour = fetchAColour(finalCharts.lineCharts[charts].color,chartColorChecker);
                            finalCharts.lineCharts[charts].color = neededColour;
                        }
                    }
                    chartColorChecker.push(finalCharts.lineCharts[charts].color);
                }
                chartColorChecker = [];

                var forceY = [lineDataLowValue,lineDataHighValue == 0? 10 : (lineDataHighValue>100 ? lineDataHighValue + 10 : lineDataHighValue + 1)];
                finalChartData.push({
                    'options': graphOptions.lineDataOptions,
                    'data': finalCharts.lineCharts,
                    'api': {}
                });
                finalChartData[finalChartData.length -1].options.chart.forceY = forceY;
            }
            if(finalCharts.barCharts.length > 0) {
                chartsCount++;

                for(var charts in finalCharts.barCharts) {
                    for(var items in chartColorChecker) {
                        if(finalCharts.barCharts[charts].color == chartColorChecker[items]) {
                            var neededColour = fetchAColour(finalCharts.barCharts[charts].color,chartColorChecker);
                            finalCharts.barCharts[charts].color = neededColour;
                        }
                    }
                    chartColorChecker.push(finalCharts.barCharts[charts].color);
                }
                chartColorChecker = [];

                var forceY = [barDataLowValue,barDataHighValue == 0? 10 : (barDataHighValue>100 ? barDataHighValue + 10 : barDataHighValue + 1)];
                finalChartData.push({
                    'options': graphOptions.barDataOptions,
                    'data': finalCharts.barCharts,
                    'api': {}
                });
                finalChartData[finalChartData.length -1].options.chart.forceY = forceY;
            }
            if(finalCharts.pieCharts.length > 0) {
                chartsCount++;

                for(var charts in finalCharts.pieCharts) {
                    for(var items in chartColorChecker) {
                        if(finalCharts.pieCharts[charts].color == chartColorChecker[items]) {
                            var neededColour = fetchAColour(finalCharts.pieCharts[charts].color,chartColorChecker);
                            finalCharts.pieCharts[charts].color = neededColour;
                        }
                    }
                    chartColorChecker.push(finalCharts.pieCharts[charts].color);
                }
                chartColorChecker = [];

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
            if(finalChartData.length == 0) {
                if(widget.widgetType == 'custom') {
                    var customDataUrl = '';
                    if(window.location.hostname=="localhost")
                        customDataUrl = "http://localhost:8080/api/v1/create/customdata/"+widget._id;
                    else
                        customDataUrl = window.location.hostname +"/api/v1/create/customdata/"+widget._id;
                    finalChartData.push({
                        'options': graphOptions.emptyCharts,
                        'data': [{message:'No data for chosen date range. ' +'Please send your data to: ' + customDataUrl}]
                    });
                }
                else {
                    finalChartData.push({
                        'options': graphOptions.emptyCharts,
                        'data': [{message:'Data unavailable for chosen date range'}]
                    });
                }
            }
            if(finalCharts.highestEngagementLinkedIn.length > 0) {
                chartsCount++;
                finalChartData.push({
                    'options': graphOptions.highestEngagementLinkedIn,
                    'data': finalCharts.highestEngagementLinkedIn[0].values
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
            case 'YouTube':
                widgetColor = '#CC181E';
                break;
            default:
                widgetColor = '#04509B';
                break;
        }

        return widgetColor;
    };

});