window
.app
.config([
  "$stateProvider",
  "$urlRouterProvider",
  "$ionicConfigProvider",
  "$httpProvider",
  "apiProvider",
  function($stateProvider, $urlRouterProvider, $ionicConfigProvider, $httpProvider, apiProvider) {

    apiProvider.configure('http://api.jound.mx', {
      'X-Parse-Application-Id': '2d42ca0c-8ca7-40e4-a8f7-b5a09b07a96b',
      'X-Parse-Javascript-Key': 'f2673746-8a8e-499e-9cfa-3c9194b8ffaf'
    });

    $stateProvider

        .state('app', {
            url: '',
            abstract: true,
            templateUrl: 'templates/menu.html',
            controller: 'AppCtrl'
        })

        .state('app.home', {
            url: '/home',
            views: {
                'menuContent': {
                    templateUrl: 'templates/home.html'
                }
            }
        })

        .state('app.categories', {
            url: '/categories',
            views: {
                'menuContent': {
                    templateUrl: 'templates/categories.html',
                    controller: 'CategoriesCtrl'
                }
            }
        })

        .state('app.category', {
            url: '/categories/:id',
            views: {
                'menuContent': {
                    templateUrl: 'templates/category.html',
                    controller: 'CategoryCtrl'
                }
            }
        })

        .state('app.roles', {
            url: '/roles',
            views: {
                'menuContent': {
                    templateUrl: 'templates/roles.html',
                    controller: 'RolesCtrl'
                }
            }
        })

        .state('app.role', {
            url: '/roles/:id',
            views: {
                'menuContent': {
                    templateUrl: 'templates/role.html',
                    controller: 'RoleCtrl'
                }
            }
        })

        .state('app.users', {
            url: '/users',
            views: {
                'menuContent': {
                    templateUrl: 'templates/users.html',
                    controller: 'UsersCtrl'
                }
            }
        })

        .state('app.user', {
            url: '/users/:id',
            views: {
                'menuContent': {
                    templateUrl: 'templates/user.html',
                    controller: 'UserCtrl'
                }
            }
        })

        .state('app.import', {
            url: '/import',
            views: {
                'menuContent': {
                    templateUrl: 'templates/import.html',
                    controller: 'ImportCtrl'
                }
            }
        })

        .state('app.geo', {
            url: '/geo',
            views: {
                'menuContent': {
                    templateUrl: 'templates/geo.html',
                    controller: 'GeoCtrl'
                }
            }
        })

        .state('app.country', {
            url: '/country/:id',
            views: {
                'menuContent': {
                    templateUrl: 'templates/country.html',
                    controller: 'CountryCtrl'
                }
            }
        })

        .state('app.state', {
            url: '/country/:id/state/:stateId',
            views: {
                'menuContent': {
                    templateUrl: 'templates/state.html',
                    controller: 'StateCtrl'
                }
            }
        })

        .state('app.municipality', {
            url: '/country/:id/state/:stateId/city/:municipalityId',
            views: {
                'menuContent': {
                    templateUrl: 'templates/city.html',
                    controller: 'CityCtrl'
                }
            }
        })

        .state('app.settling', {
            url: '/country/:id/state/:stateId/city/:cityId/settling/:settlingId',
            views: {
                'menuContent': {
                    templateUrl: 'templates/settling.html',
                    controller: 'SettlingCtrl'
                }
            }
        })

        .state('app.venues', {
            url: '/venues',
            views: {
                'menuContent': {
                    templateUrl: 'templates/venues/home.html',
                    controller: 'VenuesCtrl'
                }
            }
        })

        .state('app.analytics', {
            url: '/analytics',
            views: {
                'menuContent': {
                    templateUrl: 'templates/analytics.html',
                    controller: 'AnalyticsCtrl'
                }
            }
        })

        .state('app.profile', {
            url: '/profile',
            views: {
                'menuContent': {
                    templateUrl: 'templates/profile.html',
                    controller: 'ProfileCtrl'
                }
            }
        })

        .state('login', {
            url: '/login',
            templateUrl: 'templates/login.html',
            controller: 'LoginCtrl'
        })

        .state('forgot', {
            url: '/forgot',
            templateUrl: 'templates/forgot.html',
            controller: 'ForgotCtrl'
        })

        .state('verify', {
            url: '/verify',
            templateUrl: 'templates/verify.html',
            controller: 'VerifyCtrl'
        })

        .state('resetPassword', {
            url: '/forgot/reset',
            templateUrl: 'templates/reset.html',
            controller: 'ResetCtrl'
        })

        .state('app.stores', {
            url: '/stores',
            views: {
                'menuContent': {
                    templateUrl: 'templates/stores.html',
                    controller: 'StoresCtrl'
                }
            },
            resolve: {
              items: function(api, $ionicLoading) {
                $ionicLoading.show({template: 'Loading Stores...'});
                return api
                  .get('/manager/stores')
                  .then(function(response) {
                    return response.results;
                  })
                  .catch(function(e) {
                    return e;
                  })
                  .finally(function() {
                    console.log('got stores');
                    $ionicLoading.hide();
                  });
              }
            }
        })

        .state('app.store', {
            url: '/stores/:id',
            views: {
                'menuContent': {
                    templateUrl: 'templates/store.html',
                    controller: 'StoreCtrl'
                }
            },
            resolve: {
              item: function(api, $stateParams, $ionicLoading) {
                console.log($stateParams, 'state params');
                $ionicLoading.show({template: 'Loading Store...'});
                return api
                  .get('/manager/stores/' + $stateParams.id)
                  .then(function(response) {
                    console.log(response, 'store response');
                    return response;
                  })
                  .catch(function(e) {
                    return e;
                  })
                  .finally(function() {
                    console.log('got store');
                    $ionicLoading.hide();
                  });
              }
            }
        });

    $urlRouterProvider.otherwise(function ($injector, $location) {
        var $state = $injector.get("$state");
        $state.go("home");
    });
    // if none of the above states are matched, use this as the fallback
    $urlRouterProvider.otherwise('/home');

    $ionicConfigProvider.tabs.position('bottom');
    $httpProvider.interceptors.push('responseObserver');
}]);
