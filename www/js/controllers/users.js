angular.module('manager.controllers')

.controller('UsersCtrl', function(User, $scope, $state, $rootScope, $timeout, UsersService, $ionicModal, $ionicLoading) {
    var _ = require('lodash');
    const dialog = require('electron').remote.dialog;

    if(_.isEmpty($rootScope.user)){
        $state.go('app.home');
        return;
    }

    $scope.users = [];
    $scope.userMaster = {email: '', phone: ''};
    $scope.error = null;
    $scope.loading = false;
    $scope.pageSize = 200;
    $scope.data = {q: ''};

    $scope.refresh = function(val){
        search($scope.data.q);
    };

    $scope.inviteUser = function(){
        $scope.model = angular.copy($scope.userMaster);

        if(!$scope.inviteUserModal){
            $ionicModal.fromTemplateUrl('templates/new-user-modal.html', {
                scope: $scope,
                animation: 'slide-in-up'
            }).then(function(modal) {
                $scope.inviteUserModal = modal;
                $scope.inviteUserModal.show();
            });
        }else{
            $scope.inviteUserModal.show();
        }
    };

    $scope.closeInviteModal = function(){
        if($scope.inviteUserModal && $scope.inviteUserModal.isShown()){
            $scope.inviteUserModal.hide();
        }
    };

    $scope.invite = function(){
        var data = angular.copy($scope.model);

        $ionicLoading.show({template: '<ion-spinner></ion-spinner><br />Sending Invite Confirmation'});

        UsersService
            .invite(data.email, data.phone)
            .then(function(response){
                $scope.model = angular.copy($scope.userMaster);
                dialog.showMessageBox({title: 'Success', buttons: ['Ok'], type: 'info', message: 'Invitation has been sent'});
            }, function(e){
                dialog.showErrorBox('Error', e.message);
            })
            .then(function(){
                $ionicLoading.hide();
            });
    };

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

    $scope.$on('$ionicView.enter', function(){
        if(!$scope.users.length){
            search();
        }
    });
})

.controller('UserCtrl', function($scope, $rootScope, $timeout, $state, $ionicPlatform, UsersService, RolesService, $ionicLoading, $stateParams, $ionicHistory){
    var _ = require('lodash');
    const dialog = require('electron').remote.dialog;

    if(_.isEmpty($rootScope.user)){
        $state.go('app.home');
        return;
    }

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
    };

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

    $scope.revoke = function(role, $index){
        var highestRoleForUser = _.min($scope.roles, function(u){return u.priority});
        var currUserHighestRole = $rootScope.user.getHighestRole();
        var hasPermissionsOverUser = currUserHighestRole.priority < highestRoleForUser.priority;
        var revoke = false;

        if(!hasPermissionsOverUser){
            dialog.showErrorBox('Forbidden', 'You don\'t have permissions to suspend this account');
        }else if(!_.isEmpty($scope.venues)){
            revoke = dialog.showMessageBox({title: 'Suspend', buttons: ['Cancel', 'Yes, suspend!'], type: 'warning', message: 'If the user is the owner or legal representative of the venues listed in the "venues" panel they may lose some privilegies over those venues, proceed with caution'});
        }else {
            revoke = dialog.showMessageBox({title: 'Revoke Role', buttons: ['Cancel', 'Yes, revoke!'], type: 'warning', message: 'Do you really want to revoke the role on this user?'});
        }



        switch(revoke){
        case 0: return; break;
        default:
            $ionicLoading.show({template: '<ion-spinner></ion-spinner><br />Revoking Role'});

            RolesService
                .revoke(role.objectId, $stateParams.id)
                .then(function(response){
                    $scope.roles.splice($index, 1);
                    dialog.showMessageBox({title: 'Role Revoked', buttons: ['Ok'], type: 'info', message: 'Role has been revoked for user'});
                }, function(e){
                    dialog.showErrorBox('Error', e.message);
                })
                .finally(function(){
                    $ionicLoading.hide();
                });
        }
    };

    $scope.suspend = function(){
        var highestRoleForUser = _.min($scope.roles, function(u){return u.priority});
        var currUserHighestRole = $rootScope.user.getHighestRole();
        var hasPermissionsOverUser = currUserHighestRole.priority < highestRoleForUser.priority;
        var suspend = false;

        if(!hasPermissionsOverUser){
            dialog.showErrorBox('Forbidden', 'You don\'t have permissions to suspend this account');
        }else if(!_.isEmpty($scope.venues)){
            suspend = dialog.showMessageBox({title: 'Suspend', buttons: ['Cancel', 'Yes, suspend!'], type: 'warning', message: 'If the user is the owner or legal representative of the venues listed in the "venues" panel we will disable those venues from showing in the results too, proceed with caution'});
        }else {
            suspend = true;
        }

        if(suspend){
            $ionicLoading.show({template: '<ion-spinner></ion-spinner><br />Suspending Account'});

            UsersService
                .suspend($stateParams.id)
                .then(function(response){
                    $scope.user.suspended = true;
                }, function(e){
                    dialog.showErrorBox('Error', e.message);
                })
                .finally(function(){
                    $ionicLoading.hide();
                });
        }
    };

    $scope.$on('$ionicView.enter', function(){
        $scope.refresh();
    });
})

.controller('ProfileCtrl', function($scope, $rootScope, $timeout, $state, $ionicPlatform, UsersService, $ionicLoading, $stateParams, $ionicHistory){
    var _ = require('lodash');

    if(_.isEmpty($rootScope.user)){
        $state.go('app.home');
        return;
    }

    $scope.item = $rootScope.user;

    $scope.back = function(){
        var backView = $ionicHistory.backView();

        if(!backView){
            $state.go('app.home');
        }else{
            $ionicHistory.goBack();
        }
    };

    $scope.$on('$ionicView.enter', function(){
        console.log($scope.item, 'item');
    });
});
