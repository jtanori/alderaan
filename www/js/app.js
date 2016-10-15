// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.controllers' is found in controllers.js

angular.module('manager.controllers', ['ngMap']);
angular.module('manager.services', []);
angular.module('manager.directives', []);

window.app = angular.module('manager', ['ionic', 'manager.controllers', 'manager.services', 'ngTagsInput', 'ngFileUpload', 'ngMap', '720kb.datepicker'])

.constant('LANGS', ['EN', 'FR', 'IT', 'PT', 'RU'])
//.constant('API_URL', 'https://api.jound.mx')
//.constant('API_URL', 'https://api-stage.jound.mx')
.constant('API_URL', 'http://localhost:5001')
.constant('APP_ID', 'jound')
.constant('JS_KEY', 'jound-js')
//.constant('APP_ID', '23495f01-e732-4fdf-bf13-ae569874ea2e')
//.constant('JS_KEY', '5bfd0836-0ed7-4f6f-a44f-3cc6d0d0ce51')
//.constant('APP_ID', '23495f01-e732-4fdf-bf13-ae569874ea2f')
//.constant('JS_KEY', '5bfd0836-0ed7-4f6f-a44f-3cc6d0d0ce52')
.constant('GOOGLE_MAPS_API_URL', 'https://maps.googleapis.com/maps/api/js?key=AIzaSyDzZII1NdMzWZaRPfTFntVwaGt6p5hnesQ&libraries=places')
.constant('GOOGLE_MAPS_API_KEY', 'AIzaSyDzZII1NdMzWZaRPfTFntVwaGt6p5hnesQ')
.constant('DEFAULT_CENTER', { latitude: 23.634501, longitude: -102.552784 })
.constant('DEFAULT_RADIUS', 1000)
.constant('MINUTES', (function(){
    var x = _.range(0, 60, 15);

    return x.map(function(i){
        return {id: i, name: i < 10 ? '0' + i : i};
    });
})())
.constant('HOURS', (function(){
    var x = _.range(0, 24);

    return x.map(function(i){
        return {id: i, name: i < 10 ? '0' + i : i};
    });
})())
.constant('GEO_DEFAULT_SETTINGS', {
    enableHighAccuracy: true,
    timeout: 5000,
    maximumAge: 0
})
.constant('_', require('lodash'))
.constant('s', require('underscore.string'))
.run(function($http, $rootScope, $state, APP_ID, JS_KEY, User, $timeout, $ionicScrollDelegate) {
    var _ = require('lodash');

    $http.defaults.headers.common['X-Parse-Application-Id'] = APP_ID;
    $http.defaults.headers.common['X-Parse-Javascript-Key'] = JS_KEY;

    //Set user in root
    $rootScope.user = User.current();

    if($rootScope.user){
        $http.defaults.headers.common['X-Parse-Session-Token'] = $rootScope.user.get('sessionToken');
    }

    $rootScope.$on('$stateChangeStart', function (event, next, nextParams, fromState) {
        if (_.isEmpty($rootScope.user)) {
            switch (next.name) {
                case 'forgot':
                case 'resetPassword':
                case 'login':
                case 'verify':
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
            return JSON.parse($window.localStorage[key] || '{}');
        },
        removeItem: function(item){
            $window.localStorage.removeItem(item);
        }
    }
}]);
