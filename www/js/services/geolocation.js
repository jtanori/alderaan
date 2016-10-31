angular.module('manager.services')

.factory('GeolocationService', function($http, $q) {

  return {
    getCurrentPosition: function() {
      var defer = $q.defer();

      $http
        .get('https://freegeoip.net/json')
        .then(function(response) {
          console.log(response, 'response');
          defer.resolve(response);
        }, function(e) {
          console.log(e, 'e');
          defer.reject({message: e.message, code: e.code});
        });

      return defer.promise;
    }
  }
});
