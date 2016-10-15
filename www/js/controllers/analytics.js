angular.module('manager.controllers')

.controller('AnalyticsCtrl', function($rootScope, $scope, $state, $timeout, User, $ionicLoading){
    var _ = require('lodash');

    if(_.isEmpty($rootScope.user)){
        $state.go('app.home');
        return;
    }
});
