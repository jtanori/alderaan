angular.module('manager.services')

.factory('RolesService', function(UtilsService, $http, $q, API_URL){
    'use strict';

    var _currentItems = [];
    var _ = require('lodash');

    return {
        get: function(){
            var defer = $q.defer();

            if(!_.isEmpty(_currentItems)){
                defer.resolve(_currentItems);
            }else{
                $http
                    .get(API_URL + '/manager/roles')
                    .then(function(c){
                        if(!_.isEmpty(c)){
                            _currentItems = c.data.roles;

                            defer.resolve(c.data.roles);
                        }else{
                            defer.reject({message: 'No roles found', code: 404});
                        }
                    }, function(e){
                        defer.reject({message: e.message, code: e.code});
                    });
            }

            return defer.promise;
        },
        getById: function(id){
            var found = false;
            var defer = $q.defer();

            if(!_.isEmpty(_currentItems)){
                found = _currentItems.filter(function(c){
                    if(c.objectId === id){
                        return c;
                    }
                });
            }

            if(found && found.length){
                defer.resolve(found[0]);
            }else{
                $http
                    .get(API_URL + '/manager/roles/' + id)
                    .then(function(c){
                        if(!_.isEmpty(c)){
                            defer.resolve(c.data.role);
                        }else{
                            defer.reject({message: 'No role found for ID: ' + id, code: 404});
                        }
                    }, function(e){
                        defer.reject({message: e.message, code: e.code});
                    });
            }

            return defer.promise;
        },
        getRolesForRole: function(id){
            var defer = $q.defer();

            $http
                .get(API_URL + '/manager/roles/' + id + '/roles')
                .then(function(c){
                    if(!_.isEmpty(c)){
                        defer.resolve(c.data.results);
                    }else{
                        defer.reject({message: 'No role found for ID: ' + id, code: 404});
                    }
                }, function(e){
                    defer.reject({message: e.message, code: e.code});
                });

            return defer.promise;
        },
        getUsersForRole: function(id){
            var defer = $q.defer();

            $http
                .get(API_URL + '/manager/roles/' + id + '/users')
                .then(function(c){
                    if(!_.isEmpty(c)){
                        console.log('users for role', c);
                        defer.resolve(c.data.results);
                    }else{
                        defer.reject({message: 'No users found for role: ' + id, code: 404});
                    }
                }, function(e){
                    defer.reject({message: e.message, code: e.code});
                });

            return defer.promise;
        },
        searchUserForRole: function(id, name, email){
            var defer = $q.defer();

            $http
                .post(API_URL + '/manager/users', {
                    role: id,
                    name: name,
                    email: email
                })
                .then(function(c){
                    if(!_.isEmpty(c)){
                        defer.resolve(c.data.results);
                    }else{
                        defer.reject({message: 'No users found for role: ' + id, code: 404});
                    }
                }, function(e){
                    defer.reject({message: e.message, code: e.code});
                });

            return defer.promise;
        },
        updateRoleForRole: function(id, role, add){
            var defer = $q.defer();
            var options = {id: id, role: role};

            if(_.isBoolean(add) && add === false){
                options.remove = true;
            }

            $http
                .put(API_URL + '/manager/roles/' + id + '/roles', options)
                .then(function(c){
                    if(!_.isEmpty(c)){
                        console.log(c, 'added role?');
                        defer.resolve(c.data.results);
                    }else{
                        defer.reject({message: 'No users found for role: ' + id, code: 404});
                    }
                }, function(e){
                    defer.reject({message: e.message, code: e.code});
                });

            return defer.promise;
        },
        addUserToRole: function(id, user, add){
            var defer = $q.defer();
            var options = {id: id, user: user};

            if(_.isBoolean(add) && add === false){
                options.remove = true;
            }

            $http
                .put(API_URL + '/manager/roles/' + id + '/users', options)
                .then(function(c){
                    if(!_.isEmpty(c)){
                        console.log(c, 'added user?');
                        defer.resolve(c.data.results);
                    }else{
                        defer.reject({message: 'Could not add user to role: ' + id, code: 404});
                    }
                }, function(e){
                    defer.reject(e);
                });

            return defer.promise;
        },
        revoke: function(id, user){
            var defer = $q.defer();

            $http
                .put(API_URL + '/manager/roles/' + id + '/users', {remove: true, id: id, user: user})
                .then(function(c){
                    if(!_.isEmpty(c)){
                        console.log(c, 'revoked user?');
                        defer.resolve(c.data.results);
                    }else{
                        defer.reject({message: 'Could not revoke user from role: ' + id, code: 404});
                    }
                }, function(e){
                    defer.reject(e);
                });

            return defer.promise;
        }
    }
});
