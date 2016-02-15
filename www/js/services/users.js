angular.module('manager.services')

.factory('UsersService', function(UtilsService, $http, $q, API_URL){
    'use strict';

    var _ = require('lodash');
    var _currentItems = [];

    return {
        get: function(search, pageSize){
            var defer = $q.defer();
            var options = {};

            if(!_.isEmpty(search)){
                options.search = search;
            }

            $http
                .post(API_URL + '/manager/users', options)
                .then(function(c){
                    if(!_.isEmpty(c)){
                        _currentItems = c.data.results;

                        defer.resolve(c.data.results);
                    }else{
                        defer.reject({message: 'No users found', code: 404});
                    }
                }, function(e){
                    defer.reject({message: e.message, code: e.code});
                });

            return defer.promise;
        },
        getById: function(id){
            var defer = $q.defer();

            $http
                .get(API_URL + '/manager/users/' + id)
                .then(function(c){
                    if(!_.isEmpty(c)){
                        console.log(c, 'got user');
                        defer.resolve(c.data);
                    }else{
                        defer.reject({message: 'No user found for ID: ' + id, code: 404});
                    }
                }, function(e){
                    defer.reject({message: e.message, code: e.code});
                });

            return defer.promise;
        }
    }
});
