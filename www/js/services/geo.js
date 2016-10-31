angular.module('manager.services')

.factory('GeoService', function(UtilsService, $http, $q, API_URL, $rootScope){
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
                    .get(API_URL + '/manager/countries')
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
                    .get(API_URL + '/manager/countries/' + id)
                    .then(function(c){
                        if(!_.isEmpty(c)){
                            defer.resolve(c.data.results);
                        }else{
                            defer.reject({message: 'No country found for ID: ' + id, code: 404});
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
                .patch(API_URL + '/manager/countries/' + id, data)
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
                        defer.reject({message: 'No country found', code: 404});
                    }
                }, function(e){
                    defer.reject({message: e.message, code: e.code});
                });

            return defer.promise;
        },
        addStatesToCountry: function(id, states){
            var defer = $q.defer();

            $http
                .patch(API_URL + '/manager/countries/' + id + '/states', {states: states})
                .then(function(s){
                    console.log('s', s);
                    if(!_.isEmpty(s)){
                        if(!_.isEmpty(_currentItems)){
                            var found = _currentItems.filter(function(c){
                                if(c.id === id){
                                    return c;
                                }
                            });

                            if(found) {
                                found.states = s;
                            }
                        }

                        defer.resolve(c.data);
                    }else{
                        defer.reject({message: 'No states added', code: 404});
                    }
                }, function(e){
                    defer.reject({message: e.message, code: e.code});
                });

            return defer.promise;
        },
        getStateById: function(countryID, stateID){
            var defer = $q.defer();

            $http
                .get(API_URL + '/manager/countries/' + countryID + '/states/' + stateID)
                .then(function(c){
                    if(!_.isEmpty(c)){
                        defer.resolve(c.data.results);
                    }else{
                        defer.reject({message: 'No state in country found for State ID: ' + id, code: 404});
                    }
                }, function(e){
                    defer.reject({message: e.message, code: e.code});
                });

            return defer.promise;
        },
        addMunicipalitiesToState: function(countryId, id, data){
            var defer = $q.defer();

            $http
                .patch(API_URL + '/manager/countries/' + countryId + '/states/' + id, {municipalities: data})
                .then(function(s){
                    if(!_.isEmpty(s) && !_.isEmpty(s.data)){
                        defer.resolve(s.data.results);
                    }else{
                        defer.reject({message: 'No municipalities added', code: 404});
                    }
                }, function(e){
                    defer.reject({message: e.message, code: e.code});
                });

            return defer.promise;
        },
        importCountries: function(data) {
          var defer = $q.defer();

          $http
              .post(API_URL + '/manager/countries', {items: data})
              .then(function(s){
                  if(!_.isEmpty(s) && !_.isEmpty(s.data)){
                      defer.resolve(s.data.results);
                  }else{
                      defer.reject({message: 'No countries added', code: 404});
                  }
              }, function(e){
                  defer.reject({message: e.message, code: e.code});
              });

          return defer.promise;
        }
    }
});
