angular.module('manager.controllers')

.controller('LoginCtrl', function($rootScope, $scope, $state, $timeout, User, $ionicLoading){
    var _ = require('lodash');

    if(!_.isEmpty($rootScope.user)){
        $state.go('app.home');
        return;
    }

    $scope.userMaster = {username: '', password: ''};
    $scope.user = angular.copy($scope.userMaster);
    $scope.login = function(){
        $ionicLoading.show({template: 'Authenticating...'});
        User
            .logIn($scope.user.username, $scope.user.password)
            .then(function(){
                $rootScope.user = User.current();
                $scope.user = angular.copy($scope.userMaster);
                $state.go('app.home');
            }, function(e){
                $scope.user.password = '';
                alert(e.message);
            })
            .finally(function(){
                $ionicLoading.hide();
            })
    };
})

.controller('ForgotCtrl', function($rootScope, $scope, $state, $timeout, User, $ionicLoading){
    var _ = require('lodash');

    $scope.userMaster = {username: '', phone: ''};
    $scope.user = angular.copy($scope.userMaster);
    $scope.login = function(){
        $ionicLoading.show({template: 'Verifying...'});
        User
            .forgot($scope.user.username, $scope.user.phone)
            .then(function(){
                $rootScope.user = User.current();
                $state.go('resetPassword');
            }, function(e){
                alert(e.message);
            })
            .finally(function(){
                $scope.user = angular.copy($scope.userMaster);
                $ionicLoading.hide();
            })
    };
})

.controller('ResetCtrl', function($rootScope, $scope, $state, $timeout, User, $ionicLoading){
    var _ = require('lodash');

    $scope.userMaster = {username: '', phone: '', verificationCode: '', newPassword: '', newPasswordConfirmation: ''};
    $scope.user = angular.copy($scope.userMaster);
    $scope.login = function(){
        $ionicLoading.show({template: 'Verifying...'});
        User
            .forgot($scope.user.username, $scope.user.phone)
            .then(function(){
                $rootScope.user = User.current();
                $state.go('resetPassword');
            }, function(e){
                alert(e.message);
            })
            .finally(function(){
                $scope.user = angular.copy($scope.userMaster);
                $ionicLoading.hide();
            })
    };
});
