angular

.module('manager.controllers')
.controller('VenueProductsCtrl', function($scope, $rootScope, $timeout, $ionicModal, $ionicLoading, $ionicScrollDelegate, validations, api, items) {

  var master = {
    displayName: '',
    keywords: [],
    slug: '',
    price: 0,
    active: true,
    stock: 0,
    unitType: null,
    description: '',
    decorators: null
  };

  var Papa = require('papaparse');
  var slugify = require('underscore.string').slugify;
  var titleize = require('underscore.string').titleize
  var cleanDiacritics = require('underscore.string/cleanDiacritics');
  var validate = require('validate.js');
  var notifier = require('node-notifier');
  const dialog = require('electron').remote.dialog;

  $scope.items = _.isArray(items) ? items : [];
  $scope.error = _.isObject(items) ? items : false;
  $scope.model = angular.copy(master);
  $scope.titleize = titleize;
  $scope.slugify = slugify;

  $scope.reload = function() {
    $ionicLoading.show({template: 'Reloading...'});

    api
      .get('/manager/venues/' + $rootScope.venue.id + '/products')
      .then(function(response) {
        $timeout(function() {
          $scope.$apply(function() {
            $scope.items = response.results;
          });
        });
      })
      .catch(function(e) {
        $timeout(function() {
          $scope.$apply(function() {
            $scope.error = e;
          });
        });
      })
      .finally(function() {
        $ionicLoading.hide();
      });
  };

  $scope.add = function() {
    if(!$scope.newItemModal){
        $ionicModal.fromTemplateUrl('templates/venue/modals/add-product-modal.html', {
            scope: $scope,
            animation: 'slide-in-up'
        }).then(function(modal) {
            $scope.newItemModal = modal;
            $scope.newItemModal.show();
        });
    }else{
        $scope.newItemModal.show();
    }
  };

  $scope.cancel = function() {
    $scope.newItemModal.hide();
  };

  $scope.save = function() {
    var model = angular.copy($scope.model);
    var validationErrors = validate(model, validations.product);

    model.keywords = model.keywords.map(function(k) {return k.text});

    if(!validationErrors) {
      $ionicLoading.show({template: 'Saving Product...'});

      api
        .post('/manager/venues/' + $rootScope.venue.id + '/products', model)
        .then(function(response) {
          $timeout(function() {
            $scope.$apply(function() {
              $scope.model = angular.copy(master);
              $ionicScrollDelegate.$getByHandle('product-add-handle').resize();
              $scope.items.push(response);
            })
          })
          notifier.notify({
              title: 'Done',
              message: 'Product has been added',
              wait: true
          });
        })
        .catch(function(e) {
          alert('Error', e.data.message);
        })
        .finally(function() {
          $ionicLoading.hide();
          $ionicScrollDelegate.$getByHandle('products-scroll').resize();
          $ionicScrollDelegate.$getByHandle('product-add-handle').resize();
        });
    } else {
      dialog.showErrorBox('Error', validations.toArray(validationErrors).join('\n'))
    }
  };
})
