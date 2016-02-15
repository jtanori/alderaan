angular.module('manager.controllers')

.controller('AppCtrl', function(User, $scope, $state, $rootScope) {
    var _ = require('lodash');

    $scope.logout = function(){
        User
            .logOut()
            .then(function(){
                $rootScope.user = null;
                $state.go('login');
            }, function(){
                alert('There was an error loging you out');
            })
    };
});
