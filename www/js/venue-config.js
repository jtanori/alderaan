window.app

.config(function($stateProvider, $urlRouterProvider, $ionicConfigProvider, $httpProvider) {
    $stateProvider

        .state('venue', {
            url: '',
            abstract: true,
            templateUrl: 'templates/venue/menu.html',
            controller: 'VenueCtrl',
            resolve: {
                currencies: function(CurrencyService, $ionicLoading, $rootScope){
                    $ionicLoading.show({template: 'Loading Currencies'});

                    return CurrencyService
                        .fetch()
                        .then(function(results){
                            $rootScope.currencies = results;

                            return results;
                        }, function(e){
                            return [];
                        })
                        .finally(function(){
                            $ionicLoading.hide();
                        });
                },
                venue: function(VenuesService, $localStorage, $ionicLoading, $rootScope){
                    $ionicLoading.show({template: 'Loading Venue'});

                    var id = $localStorage.get('current-venue-id');

                    return VenuesService
                        .getById(id)
                        .then(function(v){
                            $rootScope.venue = v;
                            return v;
                        }, function(e){
                            return e;
                        });
                }
            }
        })

        .state('venue.home', {
            url: '/home',
            views: {
                'menuContent': {
                    templateUrl: 'templates/venue/home.html'
                }
            }
        })

        .state('venue.configuration', {
            url: '/configuration',
            views: {
                'menuContent': {
                    templateUrl: 'templates/venue/configuration.html',
                    controller: 'VenueConfigurationCtrl'
                }
            }
        })

        .state('venue.events', {
            url: '/events',
            views: {
                'menuContent': {
                    templateUrl: 'templates/venue/events.html',
                    controller: 'VenueEventCtrl'
                }
            },
            resolve: {
                events: function(EventsService, $ionicLoading, $rootScope, $localStorage){
                    $ionicLoading.show({template: 'Loading Events'});

                    var id = $localStorage.get('current-venue-id');

                    return EventsService
                        .getForVenue(id)
                        .then(function(r){
                            $rootScope.events = r;

                            return r;
                        }, function(e){
                            return e;
                        });
                }
            }
        })

        .state('venue.addEvent', {
            url: '/events/add',
            views: {
                'menuContent': {
                    templateUrl: 'templates/venue/events/add.html',
                    controller: 'VenueEventAddCtrl'
                }
            }
        })

        .state('venue.editEvent', {
            url: '/events/:id',
            views: {
                'menuContent': {
                    templateUrl: 'templates/venue/events/edit.html',
                    controller: 'VenueEventEditCtrl'
                }
            },
            resolve: {
                event: function(EventsService, $stateParams, $rootScope, $ionicLoading, $localStorage){
                    $ionicLoading.show({template: 'Loading Event'});

                    var id = $localStorage.get('current-venue-id');

                    return EventsService
                        .getById(id, $stateParams.id)
                        .then(function(r){
                            return r;
                        }, function(e){
                            return e;
                        });
                }
            }
        });

    $urlRouterProvider.otherwise(function ($injector, $location) {
        var $state = $injector.get("$state");
        $state.go("venue.home");
    });
    // if none of the above states are matched, use this as the fallback
    $urlRouterProvider.otherwise('/venue');

    $ionicConfigProvider.tabs.position('bottom');
    $httpProvider.interceptors.push('responseObserver');
})
.run(function($localStorage, $state, $rootScope){
    $rootScope.events = [];

    var venue = $localStorage.getObject('current-venue');
    var option = $localStorage.get('current-venue-option');
    //No venue, no deal
    if(!venue){
        window.close();
    }else{
        $rootScope.venue = venue;

        switch(option){
        case 'events':
            $state.go('venue.events');
        break;
        case 'configuration':
            $state.go('venue.configuration');
        break;
        default: $state.go('venue.home');
        }
    }
});
