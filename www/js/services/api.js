
angular

.module('manager.services')
.provider('api', [function apiProvider() {

  var initInjector = angular.injector(['ng']);
  var $http = initInjector.get('$http');
  var API_URL = '';
  var HEADERS = {};

  function request(url, method, data, headers) {
    data = data || {};
    headers = headers || {};

    return $http({
      method: method.toUpperCase(),
      url: url,
      data: data,
      headers: headers
    })
    .then(function(response) {
      if (response.statusText == 'OK') {
        return response.data;
      } else {
        throw new Error(response);
      }
    });
  };

  this.configure = function $apiConfigure(baseUrl, headers) {
    API_URL = baseUrl;
    HEADERS = headers;
  };

  this.$get = [function() {
    return {
      get: function $apiGet(path) {
        return request(API_URL + path, 'GET', {}, HEADERS);
      },
      post: function $apiPost(path, data) {
        return request(API_URL + path, 'POST', data, HEADERS);
      },
      put: function $apiPut(path, data) {
        return request(API_URL + path, 'PUT', data, HEADERS);
      },
      patch: function $apiPatch(path, data) {
        return request(API_URL + path, 'PATCH', data, HEADERS);
      },
      delete: function $apiDelete(path, data) {
        return request(API_URL + path, 'DELETE', data, HEADERS);
      },
      updateHeaders: function $updateHeaders(newHeaders) {
        HEADERS = angular.extend({}, HEADERS, newHeaders || {});
      },
      _log: function() {
        console.log('URL: ', API_URL)
        console.log('HEADERS: ', HEADERS);
      }
    }
  }]
}]);
