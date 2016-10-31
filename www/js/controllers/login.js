angular.module('manager.controllers')

.controller('LoginCtrl', function($rootScope, $scope, $state, $timeout, User, $ionicLoading, validations){
    var _ = require('lodash');
    var validate = require('validate.js');

    if(!_.isEmpty($rootScope.user)){
        $state.go('app.home');
        return;
    }

    $scope.userMaster = {username: '', password: ''};
    $scope.user = angular.copy($scope.userMaster);
    $scope.login = function(){
      var data = {
        username: $scope.user.username,
        password: $scope.user.password
      };
      var validationErrors = validate(data, validations.login);
console.log(validationErrors);
      if(!validationErrors) {
        $ionicLoading.show({template: 'Authenticating...'});
        $scope.error = false;
        User
            .logIn($scope.user.username, $scope.user.password)
            .then(function(){
                $rootScope.user = User.current();
                $scope.user = angular.copy($scope.userMaster);
                $state.go('app.home');
            }, function(e){
                $scope.user.password = '';
                $scope.error = validations.toArray(e.message);
            })
            .finally(function(){
                $ionicLoading.hide();
            });
      } else {
        console.log(validationErrors, validations.toArray(validationErrors));
        $scope.error = validations.toArray(validationErrors);
      }
    };
})

.controller('VerifyCtrl', function($rootScope, $scope, $state, $timeout, User, $ionicLoading, UsersService){
    var _ = require('lodash');
    const dialog = require('electron').remote.dialog;

    if(!_.isEmpty($rootScope.user)){
        $state.go('app.home');
        return;
    }

    $scope.userMaster = {username: '', phone: '', code: '', password: '', passwordConfirmation: ''};
    $scope.user = angular.copy($scope.userMaster);

    $scope.submit = function(){
        $ionicLoading.show({template: 'Verifying...'});

        UsersService
            .verify($scope.user.username, $scope.user.phone, $scope.user.code, $scope.user.password)
            .then(function(){
                $scope.user = angular.copy($scope.userMaster);
                $state.go('login');
            }, function(e){
                $scope.user.code = '';
                $scope.user.password = '';
                $scope.user.passwordConfirmation = '';
                dialog.showErrorBox('Error', e.message);
            })
            .finally(function(){
                $ionicLoading.hide();
            });
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
