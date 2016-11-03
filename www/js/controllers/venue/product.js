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
          $rootScope.products = response.results;
          $scope.items = $rootScope.items;
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

.controller('VenueProductCtrl', function($scope, $rootScope, $ionicLoading, $timeout, item, api) {

  const dialog = require('electron').remote.dialog;
  
  $scope.item = item;
  $scope.model = angular.copy(item);
  $scope.canSave = false;

  $scope.uploadCover = function(file){
    if(file && $scope.model){
      try{
        var x = new FileReader();
        var fileType = file[0].type

        x.onload = function(){
          $scope.model._cover = $scope.model.cover;
          $scope.model.cover = x.result;
          $scope.model.fileType = fileType;
        };

        x.readAsDataURL(file[0]);
      }catch(e){
        dialog.showErrorBox('Error', e.message);
      }
    }else if ($scope.model){
      $scope.model.file = null;
    }
  };

  $scope.removeCover = function(){
    $timeout(function() {
      $scope.$apply(function() {
        if(_.isEmpty($scope.model._cover)) {

          delete $scope.model.cover;
        } else {
          $scope.model.cover = $scope.model._cover;
        }

        delete $scope.model.fileType;
        delete $scope.model._cover;
      });
    });
  };

  $scope.cancel = function(){
    $scope.model = angular.copy($scope.item);
  };

  $scope.save = function(){
    var options = _.omit(angular.copy($scope.model), ['_cover', '_icon']);
    var changed = {};

    options.keywords = _.map(options.keywords, 'text');

    _.each(options, function(v, i) {
      if(!_.isEqual(v, $scope.item[i])) {
        changed[i] = v;
      }
    });

    if(_.isEmpty(changed)) {
      alert('Nothing to change');
      return;
    }

    $ionicLoading.show({template: 'Updating'});

    api
      .patch('/manager/venues/' + $rootScope.venue.id + '/products/' + $scope.item.objectId, changed)
      .then(function(response) {
        $timeout(function() {
          $scope.$apply(function() {
            $scope.item = angular.extend($scope.item, _.omit(response, ['objectId']));
            $scope.model = angular.copy($scope.item);
          });
        });
      })
      .catch(function(e) {
        dialog.showErrorBox('Error', e.data.message);
      })
      .finally(function() {
        $ionicLoading.hide();
      });
  };

  $scope.$watch('model', function(){
    var model = angular.copy($scope.model);

    model.keywords = model.keywords.map(function(k) { return _.isObject(k) ? k.text : k;});

    if(!_.isEqual($scope.item, model, true)){
      $scope.canSave = true;
    } else  {
      $scope.canSave = false;
    }
  }, true);
});
