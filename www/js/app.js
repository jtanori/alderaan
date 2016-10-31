// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.controllers' is found in controllers.js

angular.module('manager.controllers', ['ngMap']);
angular.module('manager.services', []);
angular.module('manager.directives', []);

window.app = angular

.module('manager', ['ionic', 'manager.controllers', 'manager.services', 'ngTagsInput', 'ngFileUpload', 'ngMap', '720kb.datepicker'])
.run(function($http, $rootScope, $state, APP_ID, JS_KEY, API_URL, User, $timeout, $ionicScrollDelegate, api) {
    var _ = require('lodash');

    $http.defaults.headers.common['X-Parse-Application-Id'] = APP_ID;
    $http.defaults.headers.common['X-Parse-Javascript-Key'] = JS_KEY;

    Parse.initialize(APP_ID, JS_KEY);
    Parse.serverURL = API_URL;

    //Set user in root
    $rootScope.user = User.current();

    if($rootScope.user){
      Parse.User.become($rootScope.user.get('sessionToken'));
        $http.defaults.headers.common['X-Parse-Session-Token'] = $rootScope.user.get('sessionToken');
        api.updateHeaders({'X-Parse-Session-Token': $rootScope.user.get('sessionToken')});
    }

    api._log();

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
