angular.module('manager.controllers')

.controller('GeoCtrl', function($scope, $timeout, $rootScope, $ionicPlatform, GeoService, $ionicLoading, $ionicScrollDelegate, $ionicModal, validations){
    var _ = require('lodash');

    if(_.isEmpty($rootScope.user)){
        $state.go('app.home');
        return;
    }

    var Papa = require('papaparse');
    var slugify = require('underscore.string/slugify');
    var cleanDiacritics = require('underscore.string/cleanDiacritics');
    var validate = require('validate.js');
    var notifier = require('node-notifier');

    $scope.countries = [];
    $scope.error = null;
    $scope.records = [];
    $scope.previewRecords = [];

    $scope.refresh = function(force){
        $timeout(function(){
            $scope.$apply(function(){
                $scope.loading = true;
            });
        });

        GeoService
            .get(force || false)
            .then(function(results){
                if(results){
                    $scope.countries = results;
                }else{
                    $scope.error = 'No countries found, please contact technical service.';
                }
            }, function(e){
                $scope.error = e.message + ': ' + e.code;
            })
            .finally(function(){
                $timeout(function(){
                    $scope.$apply(function(){
                        $scope.loading = false;
                    });
                });
            });
    };

    //Upload file to Manager
    $scope.upload = function(files){
      if (files && files.length) {
        $timeout(function(){
          $scope.$apply(function(){
            $scope.loading = true;
          });
        });

        var file = files[0];

        Papa.parse(file, {
          //worker: true,
          header: true,
          dynamicTyping: false,
          skipEmptyLines: true,
          complete: function(results){
            if(results){
              if(results.data){

                $scope.importError = [];
                $scope.records = results.data.map(function(c){
                  c.active = false;
                  c.slug = slugify(c.name);
                  c.displayName = c.name;
                  c.name = cleanDiacritics(c.name);

                  return c;
                }).filter(function(c) {
                  try {
                    var hasErrors = validate(c, validations.countryImport);

                    if(!hasErrors) {
                      return c;
                    } else {
                      $scope.importError.push(validations.toArray(hasErrors));
                    }
                  } catch(e) {
                    $scope.importError.push(e.message);
                  }
                });

                $ionicScrollDelegate.$getByHandle('countries-scroll').resize();
                $ionicScrollDelegate.$getByHandle('countries-scroll').scrollTop(false);

                $scope.openImportModal();
              }
              if(results.errors && results.errors.length){
                $scope.errors = results.errors;
                $scope.error = 'Some errors found';
              }

              $timeout(function(){
                $scope.$apply(function(){
                  $scope.loading = false;
                });
              });
            }else{
              $scope.error = 'Nothing to parse, please check your CSV file';
            }
          }
        });
      }
    };

    $scope.openImportModal = function(id){
        $scope.previewRecords = $scope.records;

        if(!$scope._previewModal){
            $ionicModal.fromTemplateUrl('templates/import-countries.html', {
                scope: $scope,
                animation: 'slide-in-up'
            }).then(function(modal) {
                $scope._previewModal = modal;
                $scope._previewModal
                  .show()
                  .then(function() {
                    $ionicScrollDelegate.$getByHandle('countries-import-scroll').resize();
                    $ionicScrollDelegate.$getByHandle('countries-import-scroll').scrollTop(false);
                  });
            });
        }else{
            $scope._previewModal
              .show()
              .then(function() {
                $ionicScrollDelegate.$getByHandle('countries-import-scroll').resize();
                $ionicScrollDelegate.$getByHandle('countries-import-scroll').scrollTop(false);
              });
        }
    };

    $scope.closeImportModal = function() {
      $timeout(function() {
        $scope.$apply(function() {
          $scope.records = [];
          $scope.previewRecords = [];
          $scope._previewModal.hide();
        });
      });
    }

    $scope.save = function() {
      if($scope.records) {
        $ionicLoading.show({template: 'Importing Countries...'});
        GeoService
          .importCountries($scope.records)
          .then(function(results) {
            $scope.closeImportModal();
            notifier.notify({
                title: 'Done',
                message: 'Countries file has been imported',
                sound: true, // Only Notification Center or Windows Toasters
                wait: true // Wait with callback, until user action is taken against notification
            });
            $scope.refresh();
          })
          .finally(function() {
            $ionicLoading.hide();
          });
      } else {
        alert('Something went wrong', 'For some reason we did not find any records to save, please check your data and try again.');
      }
    };

    $scope.cancel = function() {
      $scope.closeImportModal();
    };

    $scope.$on('$ionicView.enter', function(){
        if(!$scope.countries.length){
            $scope.refresh();
        }
    });
})

.controller('CountryCtrl', function($scope, $rootScope, $timeout, $state, $stateParams, $ionicHistory, GeoService, $ionicLoading, $ionicPopup, UtilsService, LANGS, $ionicScrollDelegate, $ionicModal){
    var _ = require('lodash');

    if(_.isEmpty($rootScope.user)){
        $state.go('app.home');
        return;
    }

    var notifier = require('node-notifier');
    var Papa = require('papaparse');

    $scope.country = false;
    $scope.loading = false;

    $scope.back = function(){
        var backView = $ionicHistory.backView();

        if(!backView){
            $state.go('app.geo');
        }else{
            $ionicHistory.goBack();
        }
    };

    $scope.$on('$ionicView.enter', function(){
        if(!$scope.country){
            $timeout(function(){
                $scope.$apply(function(){
                    $scope.loading = true;
                });
            });

            GeoService
                .getById($stateParams.id)
                .then(function(c){
                    $scope.country = c;
                }, function(e){
                    $scope.error = e.message;
                })
                .finally(function(){
                    $timeout(function(){
                        $scope.$apply(function(){
                            $scope.loading = false;
                        });
                    });
                });
        }
    });

    $scope.save = function(){
        /*var data = angular.copy($scope.category);
        var id = data.id;

        delete data.id;
        delete data.updatedAt;

        data.keywords = UtilsService.strings.sanitize(data.keywords.map(function(c){return c.text}));

        $timeout(function(){
            $scope.$apply(function(){
                $scope.saving = true;
            });
        });

        GeoService
            .update(id, data)
            .then(function(c){
                notifier.notify({
                    title: 'Category Saved',
                    message: 'Category has been saved.',
                    sound: true, // Only Notification Center or Windows Toasters
                    wait: true // Wait with callback, until user action is taken against notification
                }, function (err, response) {
                    // Response is response from notification
                    console.log('response', err, response);
                });
            }, function(e){
                notifier.notify({
                    title: 'Category Not Saved',
                    message: e.message,
                    sound: true, // Only Notification Center or Windows Toasters
                    wait: true // Wait with callback, until user action is taken against notification
                }, function (err, response) {
                    // Response is response from notification
                    console.log('response', err, response);
                });
                $scope.error = e.message;
            })
            .finally(function(){
                console.log('done saving category');
                $timeout(function(){
                    $scope.$apply(function(){
                        $scope.saving = false;
                    });
                });
            });*/
    };

    $scope.addStatesCollection = function(){
        var data = angular.copy($scope.states);

        $timeout(function(){
            $scope.$apply(function(){
                $scope.loadingStates = true;
            });
        });

        GeoService
            .addStatesToCountry($stateParams.id, data)
            .then(function(s){
                if($scope.country.states.length){
                    $scope.country.states.concat(s);
                }else{
                    $scope.country.states = s;
                }

                hideStatesModal();
            }, function(e){
                $scope.statesError = e.message;
            })
            .finally(function(){
                $timeout(function(){
                    $scope.$apply(function(){
                        $scope.loadingStates = false;
                    });
                });
            });
    };

    $scope.goState = function(id){
        $state.go('app.state', {id: $scope.country.objectId, stateId: id});
    };

    $scope.upload = function(files){
        if (files && files.length) {
            var file = files[0];

            Papa.parse(file, {
                header: true,
                dynamicTyping: true,
                skipEmptyLines: true,
                complete: function(results){
                    if(results){
                        if(results.data){
                            $scope.states = results.data.map(function(s){
                                if(!s.code){
                                    s.code = s.abbr.replace('.', '').split(' ').join('').toUpperCase();
                                }

                                return s;
                            });

                            console.log($scope.states);

                            showStatesModal();
                        }
                        if(results.errors && results.errors.length){
                            //Add eror
                        }
                    }else{
                        $scope.error = 'Nothing to parse, please check your CSV file';
                    }
                }
            });
        }
    };

    $scope.cancelImport = function(){
        hideStatesModal()
    }

    var showStatesModal = function(){
        if(!$scope.previewModal){
            $ionicModal.fromTemplateUrl('templates/import-states-modal.html', {
                scope: $scope,
                animation: 'slide-in-up'
            }).then(function(modal) {
                $scope.previewModal = modal;
                $scope.previewModal.show();
            });
        }else{
            $scope.previewModal.show();
        }
    };

    var hideStatesModal = function(){
        $scope.previewModal.hide();
        $scope.states = [];
    };

})

.controller('StateCtrl', function($scope, $rootScope, $timeout, $stateParams, $state, $ionicHistory, GeoService, $ionicLoading, $ionicPopup, UtilsService, LANGS, $ionicScrollDelegate, $ionicModal){
    var _ = require('lodash');

    if(_.isEmpty($rootScope.user)){
        $state.go('app.home');
        return;
    }

    var notifier = require('node-notifier');
    var Papa = require('papaparse');

    $scope.state = false;
    $scope.loading = false;

    $scope.back = function(){
        var backView = $ionicHistory.backView();

        if(!backView){
            $state.go('app.country');
        }else{
            $ionicHistory.goBack();
        }
    };

    $scope.$on('$ionicView.enter', function(){
        $timeout(function(){
            $scope.$apply(function(){
                $scope.loading = true;
            });
        });

        GeoService
            .getStateById($stateParams.id, $stateParams.stateId)
            .then(function(c){
                console.log('state I got', c);
                $scope.state = c;
            }, function(e){
                $scope.error = e.message;
            })
            .finally(function(){
                $timeout(function(){
                    $scope.$apply(function(){
                        $scope.loading = false;
                    });
                });
            });
    });

    $scope.save = function(){
        /*var data = angular.copy($scope.category);
        var id = data.id;

        delete data.id;
        delete data.updatedAt;

        data.keywords = UtilsService.strings.sanitize(data.keywords.map(function(c){return c.text}));

        $timeout(function(){
            $scope.$apply(function(){
                $scope.saving = true;
            });
        });

        GeoService
            .update(id, data)
            .then(function(c){
                notifier.notify({
                    title: 'Category Saved',
                    message: 'Category has been saved.',
                    sound: true, // Only Notification Center or Windows Toasters
                    wait: true // Wait with callback, until user action is taken against notification
                }, function (err, response) {
                    // Response is response from notification
                    console.log('response', err, response);
                });
            }, function(e){
                notifier.notify({
                    title: 'Category Not Saved',
                    message: e.message,
                    sound: true, // Only Notification Center or Windows Toasters
                    wait: true // Wait with callback, until user action is taken against notification
                }, function (err, response) {
                    // Response is response from notification
                    console.log('response', err, response);
                });
                $scope.error = e.message;
            })
            .finally(function(){
                console.log('done saving category');
                $timeout(function(){
                    $scope.$apply(function(){
                        $scope.saving = false;
                    });
                });
            });*/
    };

    $scope.addMunicipalitiesToState = function(){
        var data = angular.copy($scope.municipalities);

        $timeout(function(){
            $scope.$apply(function(){
                $scope.loadingMunicipalities = true;
                $ionicScrollDelegate.resize();
            });
        });

        GeoService
            .addMunicipalitiesToState($stateParams.id, $stateParams.stateId, data)
            .then(function(results){
                console.log(results, 's');
                if($scope.state.municipalities.length){
                    $scope.state.municipalities.concat(results);
                }else{
                    $scope.state.municipalities = results;
                }
                hideMunicipalitiesModal();
            }, function(e){
                $scope.municipalitiesError = e.message;
            })
            .finally(function(){
                $timeout(function(){
                    $scope.$apply(function(){
                        $scope.loadingMunicipalities = false;
                    });
                });
            });
    };

    $scope.goMunicipality = function(id){
        $state.go('app.municipality', {id: $stateParams.id, stateId: $stateParams.stateId, municipalityId: id});
    }

    $scope.upload = function(files){
        if (files && files.length) {
            var file = files[0];

            Papa.parse(file, {
                header: true,
                dynamicTyping: true,
                skipEmptyLines: true,
                complete: function(results){
                    if(results){
                        if(results.data){
                            $scope.municipalities = results.data;

                            showMunicipalitiesModal();
                        }
                        if(results.errors && results.errors.length){
                            //Add eror
                        }
                    }else{
                        $scope.error = 'Nothing to parse, please check your CSV file';
                    }
                }
            });
        }
    };

    $scope.cancelImport = function(){
        hideMunicipalitiesModal();
    }

    var showMunicipalitiesModal = function(){
        if(!$scope.previewModal){
            $ionicModal.fromTemplateUrl('templates/import-municipalities-modal.html', {
                scope: $scope,
                animation: 'slide-in-up'
            }).then(function(modal) {
                $scope.previewModal = modal;
                $scope.previewModal.show();
            });
        }else{
            $scope.previewModal.show();
        }
    };

    var hideMunicipalitiesModal = function(){
        $scope.previewModal.hide();
        $scope.municipalities = [];
        $ionicScrollDelegate.resize();
    };
});
