showMetricApp.controller('InsightsController', InsightsController)

function InsightsController($scope, $http, $state, $rootScope,$interval, $window, $stateParams, generateChartColours) {
    var widgetType = 'insights';
    $scope.storedCompetitors=[];
    // $scope.objectOptionsModel={}
    $scope.self=[];
    $scope.competitors=[];
    $scope.showbutton=false
    $scope.keyword=""
    $scope.objectList=[];
    $scope.object="";
    $scope.pageName="";
    $scope.pageloading=false;
    $scope.insightsReferenceWidgetsList=[];
    var referenceWidgetsData={};
    $scope.pagelist=null;
    $scope.selectedPage=[];
    $scope.topSentiment={
        getResult:function(pagename,insights){
            $scope.pageloading=true;
            if (insights.charts[0].channelName === 'Twitter') var searchPagesQuery = 'getTwitterPages';
            else var searchPagesQuery = 'getUserRequest';
            $http({
                method: 'GET',
                url: '/api/v1/'+searchPagesQuery + '?keyWord=' + pagename
            }).then
            (
                function successCallback(response) {
                    $scope.pageloading=false
                    $scope.pagelist=response.data.pageLists;
                },
                function errorCallback(error) {
                    swal({
                        title: "",
                        text: "<span style='sweetAlertFont'>Something went wrong! Please reopen widgets link</span> .",
                        html: true
                    });
                }

            )
        },
        storePage:function(page){
            if($scope.selectedPage.length === 0){
                $scope.selectedPage.push(page) ;
                $(".page-" + page.id).css("border", "5px solid lightgrey");
            }
            else{
                if( page.id === $scope.selectedPage[0].id  ){
                    $scope.selectedPage.pop();
                    $(".page-" + page.id).css("border", "1px solid lightgrey");
                }
                else{
                    $(".page-" + $scope.selectedPage[0].id ).css("border", "1px solid lightgrey");
                    $scope.selectedPage.pop();
                    $scope.selectedPage.push(page);
                    $(".page-" + page.id).css("border", "5px solid lightgrey");
                }

            }
        }
    }
    $scope.getInsightsRefrenceWidgets=function(){
        $http({
            method: 'GET',
            url: '/api/v1/get/referenceWidgets/' + widgetType
        }).then
        (
            function successCallback(response) {
                for (var i = 0; i < response.data.referenceWidgets.length; i++) {
                    referenceWidgetsData = {
                        '_id': response.data.referenceWidgets[i]._id,
                        'charts': response.data.referenceWidgets[i].charts,
                        'created': response.data.referenceWidgets[i].created,
                        'description': response.data.referenceWidgets[i].description,
                        'maxSize': response.data.referenceWidgets[i].maxSize,
                        'minSize': response.data.referenceWidgets[i].minSize,
                        'name': response.data.referenceWidgets[i].name,
                        'size': response.data.referenceWidgets[i].size,
                        'updated': response.data.referenceWidgets[i].updated,
                        'widgetType': response.data.referenceWidgets[i].widgetType,
                    };

                    $scope.insightsReferenceWidgetsList.push(referenceWidgetsData);


                }
                // $scope.showdetail($scope.insightsReferenceWidgetsList[0]._id)
            },
            function errorCallback(error) {
                swal({
                    title: "",
                    text: "<span style='sweetAlertFont'>Something went wrong! Please reopen widgets link</span> .",
                    html: true
                });
            }
        );

    }
    $scope.showdetail=function(id){
        $scope.pagelist=null;
        $scope.showbutton=false;
        $scope.storedCompetitors=[];
        $scope.objectList=null;
        $(".content").hide();
        $("#insightContent-"+id).show();
        $(".insight").removeClass(' glyphicon glyphicon-play');
        $("#icon-"+id).addClass(' glyphicon glyphicon-play');
        return false;
    }
    $scope.createInsightWidget=function(refrenceWidgets){
        var inputParams=[]
        if(refrenceWidgets.charts[0].keywordNeeded === true) {
            refrenceWidgets.charts[0].keyWord= $scope.keyword;
        }
        if(refrenceWidgets.charts[0].self === true) {
            refrenceWidgets.charts[0].objectId= $scope.object._id;
        }
        if(refrenceWidgets.charts[0].competitor === true){
            refrenceWidgets.charts[0].competitors=  $scope.storedCompetitors;
        }

        var widgetColor = generateChartColours.fetchWidgetColor(refrenceWidgets.charts[0].channelName);
        var jsonData={
            "dashboardId": $state.params.id,
            "widgetType":refrenceWidgets.widgetType,
            "name":refrenceWidgets.name,
            "description": refrenceWidgets.description,
            "charts": refrenceWidgets.charts,
            "size": refrenceWidgets.size,
            "minSize": refrenceWidgets.minSize,
            "maxSize": refrenceWidgets.maxSize,
            "color": widgetColor,
            "visibility": true,
            "channelName": refrenceWidgets.charts[0].channelName
        }
        inputParams.push(jsonData);
        $http({
            method: 'POST',
            url: '/api/v1/widgets',
            data: inputParams
        }).then(
            function successCallback(response) {
                for (var widgetObjects in response.data.widgetsList)
                    $rootScope.$broadcast('populateWidget', response.data.widgetsList[widgetObjects]);
            })
    }
    $scope.addCompetitors=function(Competitor,maxCompetitor){
        if($scope.storedCompetitors.length < maxCompetitor){
            $scope.storedCompetitors.push({
                remoteObjectId: Competitor.id,
                name:Competitor.name
            });
        }
    }
    $scope.removeCompetitors=function(Competitor){
        $scope.storedCompetitors.pop(Competitor);
    }
    $scope.getProfileForDropDown=function(channelId){

        $http({
            method: 'GET', url: '/api/v1/get/profiles/' + channelId
        }).then(
            function successCallback(response) {
                $scope.profileList=response.data.profileList;
            },
            function errorCallback(error) {
                swal({
                    title: "",
                    text: "<span style='sweetAlertFont'>Something went wrong! Please reopen widgets link</span> .",
                    html: true
                });
            })
    }
    $scope.getObjectForChoosenprofile=function(profile,insights){
        if(profile == undefined || null){
            $scope.objectList=[];
        }
        else{
            var objectTypeId=insights.charts[0].objectTypeId;
            $http({
                method: 'GET',
                url: '/api/v1/get/objects/' + profile._id
            }).then(
                function successCallback(response) {
                    var uniqueObject = _.groupBy(response.data.objectList, 'objectTypeId');
                    if(insights.charts[0].channelName ==='Twitter') $scope.object =uniqueObject[objectTypeId];
                    else $scope.objectList=uniqueObject[objectTypeId];
                },
                function errorCallback(error) {
                    swal({
                        title: "",
                        text: "<span style='sweetAlertFont'>Something went wrong! Please reopen widgets link</span> .",
                        html: true
                    });
                }
            )
        }
    }
    $scope.saveObject=function(object){
        if(typeof object === 'object' ){
            $scope.object=object;
            $scope.showbutton=true;
        }
        else{
            $scope.showbutton=false;
        }

    }
    $scope.SaveKeyword=function(keyword){
        $scope.keyword=keyword;
    }
    $scope.enableButton=function(insight){
        if(insight.charts[0].self === true && insight.charts[0].competitor === true){
            if(insight.charts[0].keywordNeeded === true){
                if($scope.keyword !== null &&  $scope.object !== null && $scope.storedCompetitors.length !== 0 ){
                    $scope.showbutton=true;
                }
                else{
                    $scope.showbutton=false;
                }
            }
            else{
                if( $scope.object != null && $scope.storedCompetitors  != null ){
                    $scope.showbutton=true;
                }
                else{
                    $scope.showbutton=true;
                }
            }
        }
        else if(insight.charts[0].competitor === true){
            if(insight.charts[0].keywordNeeded === true){
                if($scope.keyword != null && $scope.storedCompetitors.length !== 0 ){
                    $scope.showbutton=true;
                }
                else{
                    $scope.showbutton=true;
                }
            }
            else{
                if( $scope.storedCompetitors.length !== 0  ){
                    $scope.showbutton=true;
                }
                else{
                    $scope.showbutton=false;
                }
            }
        }
        else if(insight.charts[0].self === true){
            if(insight.charts[0].keywordNeeded === true){
                if($scope.keyword != null &&  $scope.object != null  ){
                    $scope.showbutton=true;
                }
                else{
                    $scope.showbutton=false;
                }
            }
            else{
                if( $scope.object != null ){
                    $scope.showbutton=true;
                }
                else{
                    $scope.showbutton=true;
                }
            }
        }
    }

}