angular.module('manager.services')

.factory('CategoriesService', function(UtilsService, $http, $q, API_URL, $rootScope){
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
                    .get(API_URL + '/manager/categories')
                    .then(function(c){
                        if(!_.isEmpty(c)){
                            _currentItems = c.data.results;

                            defer.resolve(c.data.results);
                        }else{
                            defer.reject({message: 'No categories found', code: 404});
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
                    .get(API_URL + '/manager/categories/' + id)
                    .then(function(c){
                        if(!_.isEmpty(c)){
                            defer.resolve(c.data.results);
                        }else{
                            defer.reject({message: 'No category found for ID: ' + id, code: 404});
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
                .patch(API_URL + '/manager/categories/' + id, data)
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
                        defer.reject({message: 'No categories found', code: 404});
                    }
                }, function(e){
                    defer.reject({message: e.message, code: e.code});
                });

            return defer.promise;
        },
        add: function(data){
            var defer = $q.defer();

            $http
                .post(API_URL + '/manager/categories', data)
                .then(function(c){
                    if(!_.isEmpty(c)){
                        if(!_.isEmpty(_currentItems)){
                            _currentItems.push(c.data.category);
                            _currentItems = _.sortBy(_currentItems, function(i){return i.displayName;});
                        }

                        defer.resolve(c.data.category);
                    }else{
                        defer.reject({message: 'Could not create category', code: 404});
                    }
                }, function(e){
                    defer.reject({message: e.data.message, code: e.status});
                });

            return defer.promise;
        },
        remove: function(id){
            var defer = $q.defer();

            $http
                .delete(API_URL + '/manager/categories/' + id)
                .then(function(c){
                    if(!_.isEmpty(c)){
                        if(!_.isEmpty(_currentItems)){
                            var index = _.findIndex(_currentItems, function(c){return c.id === id || c.objectId === id;});

                            if(index){
                                _currentItems.slice(index, 1);
                            }
                        }

                        defer.resolve(c);
                    }else{
                        defer.reject({message: 'There was an error removing this category, please try again or contact technical service.'});
                    }
                }, function(e){
                    defer.reject({message: e.data.message, code: e.status});
                });

            return defer.promise;
        },
        saveCollection: function(venues){
            var defer = $q.defer();

            $http
                .post(API_URL + '/manager/venues/collection', {venues: venues})
                .then(function(c){
                    if(!_.isEmpty(c)){
                        defer.resolve(c.data);
                    }else{
                        defer.reject({message: 'No categories found', code: 404});
                    }
                }, function(e){
                    defer.reject({message: e.message, code: e.code});
                });

            return defer.promise;
        },
        getIndicators: function(){
            var defer = $q.defer();

            $http
                .get(API_URL + '/manager/categories/indicators')
                .then(function(c){
                    if(!_.isEmpty(c)){
                        defer.resolve(c.data.results);
                    }else{
                        defer.reject({message: 'No indicators found', code: 404});
                    }
                }, function(e){
                    defer.reject({message: e.message, code: e.code});
                });

            return defer.promise;
        },
        getLocalizationForCategory: function(id){
            var defer = $q.defer();

            $http
                .get(API_URL + '/manager/categories/' + id + '/i18n')
                .then(function(c){
                    if(!_.isEmpty(c)){
                        defer.resolve(c.data.results);
                    }else{
                        defer.reject({message: 'No translations found', code: 404});
                    }
                }, function(e){
                    defer.reject({message: e.message, code: e.code});
                });

            return defer.promise;
        },
        addLocalization: function(id, data){
            var defer = $q.defer();

            $http
                .post(API_URL + '/manager/categories/' + id + '/i18n', data)
                .then(function(c){
                    if(!_.isEmpty(c)){
                        defer.resolve(c.data);
                    }else{
                        defer.reject({message: 'Could not add translation to category', code: 404});
                    }
                }, function(e){
                    defer.reject({message: e.message, code: e.code});
                });

            return defer.promise;
        },
        updateLocalization: function(id, i18nid, data){
            var defer = $q.defer();

            $http
                .patch(API_URL + '/manager/categories/' + id + '/i18n/' + i18nid, data)
                .then(function(c){
                    if(!_.isEmpty(c)){
                        defer.resolve(c.data);
                    }else{
                        defer.reject({message: 'Could not update translation to category', code: 404});
                    }
                }, function(e){
                    defer.reject({message: e.message, code: e.code});
                });

            return defer.promise;
        },
        deleteLocalization: function(id, i18nid){
            var defer = $q.defer();

            $http
                .delete(API_URL + '/manager/categories/' + id + '/i18n/' + i18nid)
                .then(function(c){
                    if(!_.isEmpty(c)){
                        defer.resolve(c.data);
                    }else{
                        defer.reject({message: 'Could not remove translation to category', code: 404});
                    }
                }, function(e){
                    defer.reject({message: e.message, code: e.code});
                });

            return defer.promise;
        }
    }
});
