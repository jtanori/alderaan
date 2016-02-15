angular.module('manager.services')

.factory('User', ['$localStorage', 'AuthService', '$q', 'UUID', function($localStorage, AuthService, $q, UUID){
    var _current;
    var _ = require('lodash');

    var User = (function () {
        var instance;
        var token;

        function createInstance(key, initialAttributes, roles) {
            var object = function(key, initialAttributes, roles){
                if(!_.isEmpty($localStorage.get('current-user'))){
                    token = $localStorage.get('current-user');

                    this.attributes = $localStorage.getObject(token);
                    this.roles = $localStorage.getObject(token + '-roles');
                }else{
                    token = key;

                    this.attributes = initialAttributes;
                    this.roles = roles;
                    this.save();
                }
            };

            object.prototype = {
                save: function(key, value){
                    var $self = this;
                    //Want to save current attributes?
                    if(_.isEmpty(key)){
                        $localStorage.setObject(token, this.attributes);
                        $localStorage.setObject(token + '-roles', this.roles);
                        $localStorage.set('current-user', token);
                    }else{
                        var c = $localStorage.getObject(token) || {};

                        if(_.isObject(key)){
                            _.each(key, function(k, v){
                                c[v] = k;
                                $self.attributes[v] = k;
                            });
                        }else{
                            c[key] = value;
                            this.attributes[key] = value;
                        }

                        $localStorage.setObject(token, c);
                    }

                    return c;
                },
                get: function(key){
                    return this.attributes[key];
                },
                set: function(key, value){
                    var c = this.attributes;

                    if(_.isObject(key)){
                        _.each(key, function(k, v){
                            c[v] = k;
                        });
                    }else{
                        c[key] = value;
                    }

                    return c;
                },
                toJSON: function(){
                    return this.attributes;
                },
                is: function(role){
                    var roles = this.roles.map(function(r){
                        return r.name;
                    });
                    
                    if(roles.indexOf(role) === -1){
                        return false;
                    }else{
                        return true;
                    }
                },
                getHighestRole: function(){
                    return _.min(this.roles, function(r){return r.priority}).id;
                },
                logOut: function(){
                    $localStorage.removeItem(token);
                    $localStorage.removeItem(token + '-roles');
                    $localStorage.removeItem('current-user');
                }
            };

            return new object(key, initialAttributes, roles);
        }

        return {
            current: function () {
                if (!instance && !_.isEmpty($localStorage.get('current-user'))) {
                    instance = createInstance();
                }

                return instance;
            },
            logIn: function(username, password){
                var defer = $q.defer();

                AuthService
                    .logIn(username, password)
                    .then(function(response){
                        instance = createInstance(response.user.objectId, response.user, response.roles);
                        defer.resolve(instance);
                    }, function(e){
                        defer.reject(e);
                    });

                return defer.promise;
            },
            logOut: function(){
                var defer = $q.defer();

                AuthService
                    .logOut()
                    .then(function(response){
                        instance.logOut();
                        instance = null;
                        defer.resolve();
                    }, function(e){
                        defer.reject(e);
                    });

                return defer.promise;
            },
            become: function(){
                var defer = $q.defer();

                AuthService
                    .become(instance.get('sessionToken'))
                    .then(function(response){
                        defer.resolve(response);
                    }, function(e){
                        instance.logOut();
                        defer.reject(e);
                    });

                return defer.promise;
            }
        };
    })();

    return User;
}]);
