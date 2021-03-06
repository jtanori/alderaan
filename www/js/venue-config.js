window.app

.config(function($stateProvider, $urlRouterProvider, $ionicConfigProvider, $httpProvider, apiProvider) {

  apiProvider.configure('http://api.jound.mx', {
    'X-Parse-Application-Id': '2d42ca0c-8ca7-40e4-a8f7-b5a09b07a96b',
    'X-Parse-Javascript-Key': 'f2673746-8a8e-499e-9cfa-3c9194b8ffaf'
  });

  console.log('load');

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

        .state('venue.configuration', {
            url: '/',
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
        })

        .state('venue.social', {
            url: '/social',
            views: {
                'menuContent': {
                    templateUrl: 'templates/venue/social-networks.html',
                    controller: 'VenueSocialCtrl'
                }
            },
            resolve: {

            }
        })

        .state('venue.graphics', {
            url: '/graphics',
            views: {
                'menuContent': {
                    templateUrl: 'templates/venue/graphics.html',
                    controller: 'VenueGraphicsCtrl'
                }
            },
            resolve: {

            }
        })

        .state('venue.about', {
            url: '/about',
            views: {
                'menuContent': {
                    templateUrl: 'templates/venue/about.html',
                    controller: 'VenueAboutCtrl'
                }
            },
            resolve: {

            }
        })

        .state('venue.reviews', {
            url: '/reviews',
            views: {
                'menuContent': {
                    templateUrl: 'templates/venue/reviews.html',
                    controller: 'VenueReviewsCtrl'
                }
            },
            resolve: {

            }
        })

        .state('venue.products', {
            url: '/products',
            views: {
                'menuContent': {
                    templateUrl: 'templates/venue/products.html',
                    controller: 'VenueProductsCtrl'
                }
            },
            resolve: {
              items: function($rootScope, $ionicLoading, $localStorage, api) {

                if($rootScope.products) {
                  return $rootScope.products;
                }

                $ionicLoading.show({template: 'Loading Event'});

                var id = $localStorage.get('current-venue-id');
                return api.get('/manager/venues/' + id + '/products')
                  .then(function(response) {
                    console.log(response, 'response');
                    $rootScope.products = response.results;

                    return response.results;
                  })
                  .catch(function(e) {
                    return e;
                  })
                  .finally(function() {
                    $ionicLoading.hide();
                  });
              }
            }
        })

        .state('venue.product', {
            url: '/products/:id',
            views: {
                'menuContent': {
                    templateUrl: 'templates/venue/product.html',
                    controller: 'VenueProductCtrl'
                }
            },
            resolve: {
              item: function(api, $ionicLoading, $localStorage, $stateParams) {
                $ionicLoading.show({template: 'Loading Event'});

                var id = $localStorage.get('current-venue-id');
                var productId = $stateParams.id;

                return api.get('/manager/venues/' + id + '/products/' + productId)
                  .then(function(response) {
                    return response;
                  })
                  .catch(function(e) {
                    return new Error(e.data.message);
                  })
                  .finally(function() {
                    $ionicLoading.hide();
                  });
              }
            }
        })

        .state('venue.deals', {
            url: '/deals',
            views: {
                'menuContent': {
                    templateUrl: 'templates/venue/deals.html',
                    controller: 'VenueDealsCtrl'
                }
            },
            resolve: {

            }
        });

    $urlRouterProvider.otherwise(function ($injector, $location) {
        var $state = $injector.get("$state");
        $state.go("venue.configuration");
    });
    // if none of the above states are matched, use this as the fallback
    $urlRouterProvider.otherwise('/');

    $ionicConfigProvider.tabs.position('bottom');
    $httpProvider.interceptors.push('responseObserver');
})
.run(function($localStorage, $state, $rootScope){
    $rootScope.events = [];

    var venue = $localStorage.getObject('current-venue');
    var option = $localStorage.get('current-venue-option');
    console.log(option, 'current option');
    //No venue, no deal
    if(!venue){
        window.close();
    }else{
        $rootScope.venue = venue;

        switch(option){
        case 'about':
        case 'configuration':
        case 'deals':
        case 'events':
        case 'graphics':
        case 'products':
        case 'reviews':
        case 'social':
        console.log('will go to ', option);
            $state.go('venue.' + option);
        break;
        default: $state.go('venue.configuration');
        }
    }
});
