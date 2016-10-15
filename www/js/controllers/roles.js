angular.module('manager.controllers')

.controller('RolesCtrl', function(User, $scope, $state, $rootScope, RolesService, $timeout) {
    var _ = require('lodash');

    if(_.isEmpty($rootScope.user)){
        $state.go('app.home');
        return;
    }

    $scope.roles = [];
    $scope.error = null;
    $scope.loading = false;
    $scope.pageSize = 200;

    $scope.refresh = function(){
        $timeout(function(){
            $scope.$apply(function(){
                $scope.loading = true;
            });
        });

        RolesService
            .get()
            .then(function(results){
                if(results){
                    $scope.roles = results;
                }else{
                    $scope.error = 'No categories found, please contact technical service.';
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
        if(!$scope.roles.length){
            $scope.refresh();
        }
    });

})

.controller('RoleCtrl', function($scope, $rootScope, $timeout, $stateParams, CategoriesService, $ionicLoading, RolesService, UsersService){
    var _ = require('lodash');

    if(_.isEmpty($rootScope.user)){
        $state.go('app.home');
        return;
    }

    $scope.role = null;
    $scope.roles = null;
    $scope.loading = false;
    $scope.users = [];
    $scope.loadingUsers = false;
    $scope.search = '';
    $scope.rolesForRole = null;
    $scope.pageSize = 200;
    $scope.nonEnroledUsers = [];
    $scope.data = {q: ''};

    $scope.$on('$ionicView.enter', function(){
        $timeout(function(){
            $scope.$apply(function(){
                $scope.loading = true;
            });
        });

        RolesService
            .getById($stateParams.id)
            .then(function(c){
                console.log('role', c);
                $scope.role = c;
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
    });

    $scope.getUsers = function(){
        $scope.loadingUsers = true;

        RolesService
            .getUsersForRole($stateParams.id)
            .then(function(c){
                $scope.users = c;
            }, function(e){
                $scope.error = e.message;
            })
            .finally(function(){
                $timeout(function(){
                    $scope.$apply(function(){
                        $scope.loadingUsers = false;
                        $ionicLoading.hide();
                    });
                });
            });
    };

    $scope.config = function(){
        getRolesAvailable();
    };

    $scope.searchUser = function(val){
        $timeout(function(){
            $scope.$apply(function(){
                var found = $scope.users.map(function(u){
                    if(u.email && u.email.indexOf(val) !== -1){
                        u.hidden = false;
                    }else if(u.firstName && u.firstName.indexOf(val) !== -1){
                        u.hidden = false;
                    }else if(u.lastName && u.lastName.indexOf(val) !== -1){
                        u.hidden = false;
                    }else{
                        u.hidden = true;
                    }

                    if(!u.hidden){
                        return u;
                    }
                }).length;

                console.log('val', val);
                if(!found || found < $scope.pageSize){
                    UsersService
                        .get(val, $scope.pageSize)
                        .then(function(u){
                            console.log('searched users', u);
                            $scope.nonEnroledUsers = u;
                        }, function(e){
                            console.log('error', e);
                        })
                        .finally(function(){
                            console.log('finish searching users');
                        });
                }
            });
        });
    };

    $scope.addRole = function(role, checked){
        $ionicLoading.show({template: 'Saving Role...'});

        RolesService
            .updateRoleForRole($scope.role.objectId, role, checked)
            .then(function(){
                console.log('added', arguments);
            }, function(){
                console.log('error on add', arguments);
            })
            .finally(function(){
                console.log('finished');
                $ionicLoading.hide();
            });
    };

    $scope.addUserToRole = function(user){
        RolesService
            .addUserToRole($scope.role.objectId, user.objectId)
            .then(function(){
                console.log('added', arguments);
            }, function(){
                console.log('error on add', arguments);
            })
            .finally(function(){
                console.log('finished');
                $ionicLoading.hide();
            });
    };

    var getRolesForRole = function(){
        RolesService
            .getRolesForRole($scope.role.objectId)
            .then(function(results){
                if(results){
                    results.forEach(function(r){
                        _.forEach($scope.roles, function(ro){
                            if(ro.objectId === r.objectId){
                                ro.checked = true;
                                return;
                            }
                        });
                    });
                }else{
                    $scope.error = 'No roles found, please contact technical service.';
                }
            }, function(e){
                $scope.error = e.message + ': ' + e.code;
            })
            .finally(function(){
                $timeout(function(){
                    $scope.$apply(function(){
                        $scope.loadingRoles = false;
                    });
                });
            });
    };

    var getRolesAvailable = function(){
        $timeout(function(){
            $scope.$apply(function(){
                $scope.loadingRoles = true;
            });
        });

        RolesService
            .get()
            .then(function(results){
                if(results){
                    $scope.roles = results.filter(function(r){
                        if(r.priority > $scope.role.priority){
                            return r;
                        }
                    });
                    //Get roles this role belongs to
                    getRolesForRole();
                }else{
                    $scope.error = 'No roles found, please contact technical service.';
                    $timeout(function(){
                        $scope.$apply(function(){
                            $scope.loadingRoles = false;
                        });
                    });
                }
            }, function(e){
                $scope.error = e.message + ': ' + e.code;
                $timeout(function(){
                    $scope.$apply(function(){
                        $scope.loadingRoles = false;
                    });
                });
            });
    };
});
