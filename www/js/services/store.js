angular.module('manager.services')

.factory('StoreService', function(UtilsService, $http, $q, API_URL, $rootScope){
    'use strict';

    var _currentItems = [];
    var _ = require('lodash');

    return {
        get: function(forceLoad){
            var defer = $q.defer();

            if(!_.isEmpty(_currentItems) && !forceLoad){
                defer.resolve(_currentItems);
            }else{
                $http
                    .get(API_URL + '/manager/stores')
                    .then(function(c){
                        if(!_.isEmpty(c)){
                            _currentItems = c.data.results;

                            defer.resolve(c.data.results);
                        }else{
                            defer.reject({message: 'No countries found', code: 404});
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
                    if(c.id === id){
                        return c;
                    }
                });
            }

            if(found && found.length){
                defer.resolve(found[0]);
            }else{
                $http
                    .get(API_URL + '/manager/stores/' + id)
                    .then(function(c){
                        if(!_.isEmpty(c)){
                            defer.resolve(c.data.results);
                        }else{
                            defer.reject({message: 'No store found for ID: ' + id, code: 404});
                        }
                    }, function(e){
                        defer.reject({message: e.message, code: e.code});
                    });
            }

            return defer.promise;
        },
        update: function(id, data){
            var defer = $q.defer();

            $http
                .patch(API_URL + '/manager/stores/' + id, data)
                .then(function(c){
                    if(!_.isEmpty(c)){
                        if(!_.isEmpty(_currentItems)){
                            var found = _currentItems.filter(function(c){
                                if(c.id === id){
                                    return c;
                                }
                            });

                            if(found) {
                                found = angular.extend(found, data);
                            }
                        }

                        defer.resolve(c.data);
                    }else{
                        defer.reject({message: 'No store found', code: 404});
                    }
                }, function(e){
                    defer.reject({message: e.message, code: e.code});
                });

            return defer.promise;
        }
    }
});
