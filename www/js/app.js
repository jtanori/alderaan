// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.controllers' is found in controllers.js

angular.module('manager.controllers', []);
angular.module('manager.services', []);
angular.module('manager.directives', []);

angular.module('manager', ['ionic', 'manager.controllers', 'manager.services', 'ngTagsInput', 'ngFileUpload'])

.constant('LANGS', ['EN', 'FR', 'IT', 'PT', 'RU'])
.constant('API_URL', 'http://devapi.jound.mx:5000')
.constant('APP_ID', '24BXvqzE2yuQX5EVM9UPDIh1SyxBZnRMq7BBmo0Y')
.constant('JS_KEY', 'dHaSGaXxD4ssx7GbPoXFNouJBG5r3pzPdCIPau9V')
.constant('_', require('lodash'))
.constant('s', require('underscore.string'))
.run(function($http, $rootScope, $state, APP_ID, JS_KEY, User, $timeout, $ionicScrollDelegate) {
    var _ = require('lodash');

    $http.defaults.headers.common['X-Parse-Application-Id'] = APP_ID;
    $http.defaults.headers.common['X-Parse-Javascript-Key'] = JS_KEY;

    //Set user in root
    $rootScope.user = User.current();

    if($rootScope.user){
        $http.defaults.headers.common['X-Parse-User-Token'] = $rootScope.user.get('sessionToken');
    }

    $rootScope.$on('$stateChangeStart', function (event, next, nextParams, fromState) {
        if (_.isEmpty($rootScope.user)) {
            switch (next.name) {
                case 'forgot':
                case 'resetPassword':
                case 'login':
                    break;
                default:
                    event.preventDefault();
                    $state.go('login');
                    break;
            }
        }
    });
    /*
    onResize = function(){
        console.log('resize');
        $timeout(function(){
            $ionicScrollDelegate.$getByHandle('mainContentHandle').resize();
            console.log($ionicScrollDelegate);
            $ionicScrollDelegate.resize();
        });
    }

    angular.element(window).on('resize', _.throttle(onResize, 1000, {leading: true}));*/
})
.factory('responseObserver', function responseObserver($q, $window) {
    return {
        responseError: function(errorResponse) {
            switch (errorResponse.status) {
            case 403:
            console.log('403', __dirname);
                $window.location.hash = 'login';
                break;
            }
            return $q.reject(errorResponse);
        }
    };
})
.factory('$localStorage', ['$window', function($window) {
    return {
        set: function(key, value) {
            $window.localStorage[key] = value;
        },
        get: function(key, defaultValue) {
            return $window.localStorage[key] || defaultValue;
        },
        setObject: function(key, value) {
            $window.localStorage[key] = JSON.stringify(value);
        },
        getObject: function(key) {
            console.log('get object', key);
            return JSON.parse($window.localStorage[key] || '{}');
        },
        removeItem: function(item){
            $window.localStorage.removeItem(item);
        }
    }
}])

.config(function($stateProvider, $urlRouterProvider, $ionicConfigProvider, $httpProvider) {
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

        .state('resetPassword', {
            url: '/forgot/reset',
            templateUrl: 'templates/reset.html',
            controller: 'ResetCtrl'
        });

    $urlRouterProvider.otherwise(function ($injector, $location) {
        var $state = $injector.get("$state");
        $state.go("login");
    });
    // if none of the above states are matched, use this as the fallback
    $urlRouterProvider.otherwise('/login');

    $ionicConfigProvider.tabs.position('bottom');
    $httpProvider.interceptors.push('responseObserver');
});
