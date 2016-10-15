angular.module('manager.services')

.factory('EventsService', function($q, $http, $rootScope, API_URL) {

    var _currentResults = [];
    var _currentFeaturedResults = [];
    var _currentVenue;

    var global = {
        getForVenue: function(venueId, skip, force){
            var deferred = $q.defer();
            var config = {id: venueId};

            if(skip && _.isNumber(skip) && skip > 0){
                skip = '?skip=' + skip;
            }else{
                skip = '';
            }

            if(_.isEmpty(_currentResults) || force){
                $http
                    .get(API_URL + '/manager/venue/'+ venueId + '/events' + skip)
                    .then(function(response){
                        _currentResults = response.data.results.map(function(e){
                            if(e.eventDay && e.eventDay.iso){
                                e.eventDay = new Date(e.eventDay.iso);
                            }
                            
                            return e;
                        });

                        console.log(_currentResults);
                        deferred.resolve(_currentResults);
                    }, function(response){
                        if(_.isEmpty(response) || _.isEmpty(response.data) || _.isEmpty(response.data.error)){
                            var error = {message: 'Unknown error'};
                        }else{
                            var error = response.data.error;
                        }

                        deferred.reject(error);
                    });
            }else{
                deferred.resolve(_currentResults);
            }

            return deferred.promise;
        },
        addEvent: function(venueId, data){
            var deferred = $q.defer();

            if(venueId && data){
                $http
                    .post(API_URL + '/manager/venue/'+ venueId + '/events', {data: data})
                    .then(function(response){
                        if(response && response.data && response.data.eventDay){
                            response.data.eventDay = response.data.eventDay.iso;
                        }
                        deferred.resolve(response.data);
                    }, function(response){
                        if(_.isEmpty(response) || _.isEmpty(response.data) || _.isEmpty(response.data.error)){
                            var error = {message: 'Unknown error'};
                        }else{
                            var error = response.data.error;
                        }

                        deferred.reject(error);
                    });
            }else{
                deferred.reject({message: 'An error has ocurred, please try again or contact customer support.'});
            }

            return deferred.promise;
        },
        getById: function(venueId, eventId){
            var deferred = $q.defer();

            $http
                .get(API_URL + '/manager/venue/' + venueId + '/events/' + eventId)
                .then(function(response){
                    deferred.resolve(response.data);
                }, function(response){
                    if(_.isEmpty(response) || _.isEmpty(response.data) || _.isEmpty(response.data.error)){
                        var error = {message: 'Unknown error'};
                    }else{
                        var error = response.data.error;
                    }

                    deferred.reject(error);
                });

            return deferred.promise;
        },
        remove: function(venueId, eventId){
            var deferred = $q.defer();

            $http
                .delete(API_URL + '/manager/venue/' + venueId + '/events/' + eventId)
                .then(function(response){
                    deferred.resolve(response.data);
                }, function(response){
                    if(_.isEmpty(response) || _.isEmpty(response.data) || _.isEmpty(response.data.error)){
                        var error = {message: 'Unknown error'};
                    }else{
                        var error = response.data.error;
                    }

                    deferred.reject(error);
                });

            return deferred.promise;
        },
        patch: function(venueId, eventId, data){
            var deferred = $q.defer();

            $http
                .patch(API_URL + '/manager/venue/' + venueId + '/events/' + eventId, {data: data})
                .then(function(response){
                    deferred.resolve(response.data);
                }, function(response){
                    if(_.isEmpty(response) || _.isEmpty(response.data) || _.isEmpty(response.data.error)){
                        var error = {message: 'Unknown error'};
                    }else{
                        var error = response.data.error;
                    }

                    deferred.reject(error);
                });

            return deferred.promise;
        }
    };

    return global;
});
