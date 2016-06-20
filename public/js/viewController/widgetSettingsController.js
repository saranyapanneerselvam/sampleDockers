showMetricApp.controller('WidgetSettingsController',WidgetSettingsController)

function WidgetSettingsController($scope,$uibModalInstance, widget,$http, $state) {
    console.log('widget',$scope.dashboard.widgetData);
    $scope.widget = widget;
    $scope.form = {
        id:widget.id,
        name: widget.name,
        sizeX: widget.sizeX,
        sizeY: widget.sizeY,
        col: widget.col,
        row: widget.row,
        type: widget.widgetType
    };
    $scope.sizeOptions = [{id: '1',name: '1'}, {id: '2',name: '2'}, {id: '3',name: '3'}, {id: '4',name: '4'}];
    $scope.dismiss = function() {$uibModalInstance.dismiss();};
    $scope.remove = function() {$scope.dashboard.widgets.splice($scope.dashboard.widgets.indexOf(widget), 1);$uibModalInstance.close();};
    $scope.submit = function() {
        console.log('form',$scope.form);
        var inputParams=[];
        var jsonData = {
            "dashboardId": $state.params.id,
            "widgetId":$scope.form.id,
            "name": $scope.form.name

        };
        inputParams.push(jsonData);
        console.log(inputParams)

        $http({
            method: 'POST',
            url: '/api/v1/update/widgets',
            data: inputParams
        }).then(function successCallback(response) {
            $scope.renameWidget=[];
            console.log('response',response);
            var widgetIndex = $scope.dashboard.widgets.map(function(el) {return el.id;}).indexOf(response.data.widgetsList[0]._id);
            $scope.dashboard.widgetData[widgetIndex].name = response.data.widgetsList[0].name;
            angular.extend($scope.widget,$scope.form)

        }, function errorCallback(error) {
            console.log('Error in getting widget id', error);
            swal({
                title: "",
                text: "<span style='sweetAlertFont'>Please try again! Something is missing</span> .",
                html: true
            });
        });


        $uibModalInstance.close(widget);};
}