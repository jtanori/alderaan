angular.module('manager.controllers')

.controller('UsersCtrl', function(User, $scope, $state, $rootScope, $timeout, UsersService) {
    var _ = require('lodash');

    $scope.users = [];
    $scope.error = null;
    $scope.loading = false;
    $scope.pageSize = 200;
    $scope.data = {q: ''};

    $scope.refresh = function(val){
        search($scope.data.q);
    };

    $scope.$on('$ionicView.enter', function(){
        if(!$scope.users.length){
            search();
        }
    });

    var search = function(val){
        $timeout(function(){
            $scope.$apply(function(){
                $scope.loading = true;
            });
        });

        UsersService
            .get(val, $scope.pageSize)
            .then(function(results){
                if(results){
                    $scope.users = results;
                }else{
                    $scope.error = 'No users found, please contact technical service.';
                }
            }, function(e){
                $scope.error = e.message + ': ' + e.code;
            })
            .finally(function(){
                $timeout(function(){
                    $scope.$apply(function(){
                        $scope.loading = false;
                    });
                });
            });
    };
})

.controller('UserCtrl', function($scope, $timeout, $state, $ionicPlatform, UsersService, $ionicLoading, $stateParams, $ionicHistory){
    var _ = require('lodash');

    $scope.user = null;
    $scope.venues = [];
    $scope.roles = [];
    $scope.error = null;

    $scope.back = function(){
        var backView = $ionicHistory.backView();

        if(!backView){
            $state.go('app.users');
        }else{
            $ionicHistory.goBack();
        }
    }

    $scope.refresh = function(){
        $timeout(function(){
            $scope.$apply(function(){
                $scope.loading = true;
            });
        });

        UsersService
            .getById($stateParams.id)
            .then(function(response){
                $scope.user = response.user;
                $scope.venues = response.venues;
                $scope.roles = response.roles;
            }, function(e){
                $scope.error = e.message;
            })
            .finally(function(){
                $timeout(function(){
                    $scope.$apply(function(){
                        $scope.loading = false;
                    });
                });
            });
    };

    $scope.revoke = function(){
        console.log('revoke permission');
    };

    $scope.$on('$ionicView.enter', function(){
        if(_.isEmpty($scope.user)){
            $scope.refresh();
        }
    });
});
