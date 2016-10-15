angular.module('manager.controllers')

.controller('AppCtrl', function(User, $scope, $state, $rootScope, $http) {
    var _ = require('lodash');

    $scope.logout = function(){
        User.logOut();
        $rootScope.user = null;
        $state.go('login');
    };
});
