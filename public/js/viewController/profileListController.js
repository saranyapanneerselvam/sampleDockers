showMetricApp.controller('ProfileListController',ProfileListController);
function ProfileListController($scope, $http, $window, $stateParams) {
    $scope.profile={};
   $scope.configProfileListModal=function(){
        $scope.profileListArray=[];
        $http({
            method: 'GET',
            url: '/api/v1/get/profileList'
        }).then(
            function successCallback(response) {
                $scope.profileListArray = response.data.profileList;
               // k=$scope.profileListArray.indexOf($scope.profile)
                if($scope.profile._id !== undefined){
                    k = $scope.profileListArray.map(function(e) { return e._id; }).indexOf($scope.profile._id);
                    if( k !== -1){
                        if($scope.profileListArray[k].hasNoAccess){
                            $('#errorInRelink').html('<div class="alert alert-danger fade in" style="width: 400px;margin-left: 212px;"><button type="button" class="close close-alert" data-dismiss="alert" aria-hidden="true">×</button>Please login with your Account</div>')
                        }
                    }
                }
            },
            function errorCallback(error) {
                swal({
                    title: "",
                    text: "<span style='sweetAlertFont'>Something went wrong! Please reopen widgets link</span> .",
                    html: true
                });
            }
        );
    };
    $scope.refreshProfile = function (profile) {
      var storedChannelName= profile.channelName;
        $scope.profile=profile;
        var url, title;
        function popupwindow(url, title, w, h) {
            switch (storedChannelName) {
                case 'Facebook':
                    url = '/api/v1/auth/facebook';
                    title = storedChannelName;
                    break;
                case 'Google Analytics':
                    url = '/api/v1/auth/google';
                    title = storedChannelName;
                    break;
                case 'FacebookAds':
                    url = '/api/auth/facebookads';
                    title = storedChannelName;
                    break;
                case 'Twitter':
                    url = '/api/auth/twitter';
                    title = storedChannelName;
                    break;
                case 'Instagram':
                    url = '/api/auth/instagram';
                    title = storedChannelName;
                    break;
                case 'GoogleAdwords':
                    url = '/api/auth/adwords';
                    title = storedChannelName;
                    break;
                case 'YouTube':
                    url = '/api/v1/auth/youTube';
                    title = storedChannelName;
                    break;
                case 'Mailchimp':
                    url = '/api/auth/mailchimp';
                    title = storedChannelName;
                    break;
                case 'linkedin':
                    url = '/api/auth/linkedIn';
                    title = storedChannelName;
                    break;
                case 'Aweber':
                    url = '/api/auth/aweber';
                    title = storedChannelName;
                    break;
                case 'Vimeo':
                    url = '/api/auth/vimeo';
                    title = storedChannelName;
                    break;
                case 'Pinterest':
                    url = '/api/auth/pinterest';
                    title = storedChannelName;
                    break;
            }
            var left = (screen.width / 2) - (w / 2);
            var top = (screen.height / 2) - (h / 2);
            return window.open(url, title, 'toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=no, resizable=no, copyhistory=no, width=' + w + ', height=' + h + ', top=' + top + ', left=' + left);
        }
        popupwindow(url, title, 1000, 500);
    };
    $window.afterAuthentication = function () {
         $scope.configProfileListModal();

    };
}
