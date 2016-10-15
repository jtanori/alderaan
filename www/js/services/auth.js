angular.module('manager.services')

.factory('UUID', function(){
    function guid() {
        function s4() {
            return Math.floor((1 + Math.random()) * 0x10000)
            .toString(16)
            .substring(1);
        }
        return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
        s4() + '-' + s4() + s4() + s4();
    }

    return {generate: guid};
})

.factory('AuthService', function(UtilsService, $http, $q, API_URL){
    'use strict';

    var _ = require('lodash');

    return {
        logIn: function(username, password){
            var defer = $q.defer();

            $http
                .post(API_URL + '/manager/login', {username:username, password: password})
                .then(function(c){
                    if(!_.isEmpty(c)){
                        $http.defaults.headers.common['X-Parse-Session-Token'] = c.data.user.sessionToken;
                        defer.resolve(c.data);
                    }else{
                        defer.reject({message: 'Invalid user', code: 403});
                    }
                }, function(e){
                  console.log(e, 'error');
                    if(!_.isEmpty(e) && !_.isEmpty(e.data)){
                        defer.reject({message: e.data.message, code: e.status});
                    }else{
                        defer.reject({message: 'Unknown error', code: e.status});
                    }
                });

            return defer.promise;
        },
        become: function(token){
            var defer = $q.defer();

            $http
                .post(API_URL + '/manager/sync', {token: token})
                .then(function(c){
                    if(!_.isEmpty(c) && !_.isEmpty(c.data)){
                        defer.resolve({message: c.data.message});
                    }else{
                        defer.reject({});
                    }
                }, function(e){
                    if(!_.isEmpty(e) && !_.isEmpty(e.data)){
                        defer.reject({message: e.data.message, code: e.status});
                    }else{
                        defer.reject({message: 'Unknown error', code: e.status});
                    }
                });

            return defer.promise;
        }
    }
});
