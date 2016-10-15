angular.module('manager.services')

.factory('CurrencyService', function($http, $q, API_URL, $rootScope){
    'use strict';

    var _currentItems = [];
    var _ = require('lodash');

    return {
        fetch: function(forceLoad){
            var defer = $q.defer();
            
            if(!_.isEmpty(_currentItems) && !forceLoad){
                defer.resolve(_currentItems);
            }else{
                $http
                    .get(API_URL + '/manager/currencies')
                    .then(function(c){
                        if(!_.isEmpty(c)){
                            _currentItems = c.data.results;

                            defer.resolve(c.data.results);
                        }else{
                            defer.reject({message: 'No currencies found', code: 404});
                        }
                    }, function(e){
                        defer.reject({message: e.message, code: e.code});
                    });
            }

            return defer.promise;
        }
    };
});
