showMetricApp.controller('ChangePasswordController', ChangePasswordController)
function ChangePasswordController($scope, $http, $q, $state, $rootScope,$location) {
    $scope.currentPassword="",
        $scope.newPassword="",
   $scope.changePassword=function () {
      if(document.getElementById('password-res').innerHTML == "Password Match") { swal(
          {
              title: "Are you sure?",
              text: "You will be logged out and must login again with your new password!",
              type: "warning",
              showCancelButton: true,
              confirmButtonColor: "#DD6B55",
              confirmButtonText: "Yes, change my password!",
              closeOnConfirm: true
          },
          function () {
              callChangePasswordApi();
          });
      }}
    function callChangePasswordApi(){
        var passwords={
            currentPassword: $scope.currentPassword,
            newPassword:  $scope.newPassword
        }
        $http({
            method: 'POST',
            url: '/api/v1/changePassword',
            data: passwords
        }).then(
            function successCallback(response) {
                if(response.status == '200'){
                    $location.path('/api/v1/login');
                }
                else{
                    swal("Please enter correct current password");
                }
            })
    }
}
