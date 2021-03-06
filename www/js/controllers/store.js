/* globals angular: true, _:true, require: true */
angular.module('manager.controllers')

.controller('StoresCtrl', function ($scope, $timeout, $rootScope, $state, $ionicPlatform, $ionicLoading, $ionicScrollDelegate, $ionicModal, validations, items, api) {
    var _ = require('lodash');

    if (_.isEmpty($rootScope.user)) {
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

.controller('StoreCtrl', function($scope, item, $localStorage, $ionicModal, $ionicLoading, $timeout, $ionicScrollDelegate, api, validations) {

  var notifier = require('node-notifier');
  var dialog = require('electron').remote.dialog;
  var validate = require('validate.js');

  $scope.item = item;
  $scope.model = angular.copy(item);

  $scope.editVenue = function(venue){
      $localStorage.setObject('current-venue', venue);
      $localStorage.set('current-venue-id', venue.objectId);
      $localStorage.set('current-venue-option', 'home');
      var w = window.open('venue.html', "Venue Editor");
  };

  $scope.update = function() {
    var data = _.omit($scope.model, ['objectId', 'venues', 'updatedAt', 'createdAt']);
    var currentData = _.omit($scope.item, ['objectId', 'venues', 'updatedAt', 'createdAt']);
    var validationErrors = validate(data, validations.store);
    var patch = {};

    if(!validationErrors) {
      data.keywords = data.keywords.map(function(k) {return _.isString(k.text) ? k.text : k;});

      _.each(data, function(v, i) {
        if(!_.isEqual(v, currentData[i])) {
          patch[i] = v;
        }
      });

      $ionicLoading.show({template: 'Saving...'});

      api
        .patch('/manager/stores/' + $scope.item.objectId, patch)
        .then(function(response) {
          $timeout(function() {
            $scope.$apply(function() {
              $scope.item = angular.extend($scope.item, response);
              $scope.model = angular.copy($scope.item);

              notifier.notify({
                  title: 'Done',
                  message: 'Store has been updated',
                  wait: false
              });
            });
          });
        })
        .catch(function(e) {
          dialog.showErrorBox('Error', e.data.message);
        })
        .finally(function(){
          $ionicLoading.hide();
        });
    } else {
      dialog.showErrorBox('Error', validations.toArray(validationErrors).join('\n'));
    }
  };

  $scope.canSave = function() {
    var data = _.omit($scope.model, ['objectId', 'venues', 'updatedAt', 'createdAt']);
    var currentData = _.omit($scope.item, ['objectId', 'venues', 'updatedAt', 'createdAt']);
    var validationErrors = validate(data, validations.store);

    return !validationErrors && !_.isEqual(data, currentData);
  };

  $scope.add = function() {
    if(!$scope.newItemModal){
        $ionicModal.fromTemplateUrl('templates/link-store-modal.html', {
            scope: $scope,
            animation: 'slide-in-up',
            focusFirstInput: true
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
    $scope.fetchedVenues = null;
    $scope.model.id = null;
  };

  $scope.linkVenue = function(venue, index) {
    if(venue) {
      $timeout(function() {
        $scope.$apply(function() {
          $scope.linking = true;
          venue.linking = true;
        });
      });

      api
        .post('/manager/stores/' + item.objectId + '/link', {objectId: venue.objectId})
        .then(function(response) {
          response.venue = angular.copy(venue);
          $scope.item.venues.push(response);

          $scope.fetchedVenues.splice(index, 1);

          if(!$scope.fetchedVenues.length) {
            $scope.fetchedVenues = null;
            $scope.model.id = null;
          }
        })
        .catch(function(e) {
          $timeout(function() {
            $scope.$apply(function() {
              venue.linking = false;
            });
          });

          dialog.showErrorBox('Error', e.data.message);
        })
        .finally(function() {
          $timeout(function() {
            $scope.$apply(function() {
              $scope.linking = false;
            });
          });
        });
    }
  };

  $scope.fetch = function() {
    if(!_.isEmpty($scope.model.id)) {
      $scope.loadingVenues = true;
      var model = angular.copy($scope.model);

      api
        .get('/manager/venues/' + model.id)
        .then(function(response) {
          $timeout(function() {
            $scope.$apply(function() {
              $scope.fetchedVenues = response;
            });
          });
        })
        .catch(function(e) {
          alert('Error', e.data.message);
        })
        .finally(function() {
          $timeout(function() {
            $scope.$apply(function() {
              $scope.loadingVenues = false;
              $ionicScrollDelegate.$getByHandle('store-scroll').resize();
            });
          });
        });
    } else {
      $timeout(function() {
        $scope.$apply(function() {
          $scope.fetchedVenues = null;
        });
      });
    }
  };
});
