angular.module('manager.controllers')

.controller('StoresCtrl', function($scope, $timeout, $rootScope, $state, $ionicPlatform, $ionicLoading, $ionicScrollDelegate, $ionicModal, validations, items, api){
    var _ = require('lodash');

    if(_.isEmpty($rootScope.user)){
        $state.go('app');
        return;
    }

    var Papa = require('papaparse');
    var slugify = require('underscore.string').slugify;
    var titleize = require('underscore.string').titleize
    var cleanDiacritics = require('underscore.string/cleanDiacritics');
    var validate = require('validate.js');
    var notifier = require('node-notifier');
    var master = {
      displayName: '',
      slug: '',
      keywords: []
    };

    $scope.items = items;
    $scope.model = angular.copy(master);
    $scope.titleize = titleize;
    $scope.slugify = slugify;

    $scope.refresh = function(force){

    };

    $scope.add = function() {
      if(!$scope.newItemModal){
          $ionicModal.fromTemplateUrl('templates/new-store-modal.html', {
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
      var validationErrors = validate(model, validations.store);

      model.keywords = model.keywords.map(function(k) {return k.text});
      console.log(model, validationErrors);

      if(!validationErrors) {
        $ionicLoading.show({template: 'Saving Store...'});

        api
          .post('/manager/stores', model)
          .then(function(response) {
            $scope.newItemModal.hide();
            notifier.notify({
                title: 'Done',
                message: 'Store has been added',
                wait: true
            });
            $state.go('app.store', {id: response.objectId});
          })
          .catch(function(e) {
            console.log('error', e);
            alert('Error', e.data.message);
          })
          .finally(function() {
            $ionicLoading.hide();
            $ionicScrollDelegate.$getByHandle('stores-scroll').resize();
          });
      } else {
        $scope.error = validations.toArray(validationErrors);
      }
    };

    $scope.$on('$ionicView.enter', function(){
        if(!$scope.items.length){
            $scope.refresh();
        }
    });
})

.controller('StoreCtrl', function($scope, item, $localStorage) {
  $scope.item = item;

  $scope.editVenue = function(venue){
      $localStorage.setObject('current-venue', venue);
      $localStorage.set('current-venue-id', venue.objectId);
      $localStorage.set('current-venue-option', 'home');
      var w = window.open('venue.html', "Venue Editor");
  };
});
