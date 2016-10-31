angular.module('manager.controllers')

.controller('CategoriesCtrl', function($scope, $rootScope, $timeout, $ionicPlatform, CategoriesService, $ionicLoading, $ionicModal, $ionicScrollDelegate, UtilsService, validations){
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

    $scope.categories = [];
    $scope.error = null;
    $scope.categoryMaster = {};
    $scope.slugify = require('underscore.string').slugify;
    $scope.titleize = require('underscore.string').titleize;
    $scope.data = {};
    $scope.records = [];
    $scope.previewRecords = [];

    $rootScope.$on('category:removed', function(e, id){
        $timeout(function(){
            $scope.$apply(function(){
                var index = _.findIndex($scope.categories, function(c){
                    if(c.id === id || c.objectId === id){
                        return c;
                    }
                });

                $scope.categories.splice(index, 1);
            });
        })
    });

    $scope.refresh = function(force){
        $timeout(function(){
            $scope.$apply(function(){
                $scope.loading = true;
                $scope.corrupted = null;
            });
        });

        CategoriesService
            .get(force || false)
            .then(function(results){
                if(results){
                    $timeout(function(){
                        $scope.$apply(function(){
                            $scope.categories = results;
                            $scope.corrupted = results.filter(function(c){
                                if(_.isEmpty(c.slug) || _.isEmpty(c.keywords)){
                                    return c;
                                }
                            }).length;
                        });
                    });
                }else{
                    $scope.error = 'No categories found, please contact technical service.';
                }
            }, function(e){
                $scope.error = e.message + ': ' + e.code;
            })
            .finally(function(){
                $timeout(function(){
                    $scope.$apply(function(){
                        $scope.loading = false;
                        $ionicScrollDelegate.$getByHandle('categories-scroll').resize();
                    });
                });
            });
    };

    $scope.addCategory = function(){
        $scope.category = angular.copy($scope.categoryMaster);

        if(!$scope.newCategoryModal){
            $ionicModal.fromTemplateUrl('templates/new-category-modal.html', {
                scope: $scope,
                animation: 'slide-in-up'
            }).then(function(modal) {
                $scope.newCategoryModal = modal;
                $scope.newCategoryModal.show();
            });
        }else{
            $scope.newCategoryModal.show();
        }
    };

    $scope.saveCategory = function(){
        var data = angular.copy($scope.category);
        var validationsError = validate(validations.category);

        if(!validationsError) {
            data.keywords = data.keywords.map(function(k){return k.text.toLowerCase();}).join(',');

            $timeout(function(){
                $scope.$apply(function(){
                    $scope.saving = true;
                    $ionicLoading.show({template: 'Saving category...'});
                });
            });

            CategoriesService
                .add(data)
                .then(function(c){
                    if(!_.isEmpty(c)){
                        alert('Category Saved');
                        $scope.refresh();
                        hideCategoryModal();
                        $ionicScrollDelegate.$getByHandle('categories-scroll').resize();
                        $ionicScrollDelegate.$getByHandle('categories-scroll').scrollBottom(false);
                    }else{
                        alert('An error has occurred while saving the category, please try again.');
                    }
                }, function(e){
                    $scope.categoryError = e.message;
                    alert(e.message);
                })
                .finally(function(){
                    $timeout(function(){
                        $scope.$apply(function(){
                            $scope.saving = false;
                            $ionicLoading.hide();
                        });
                    });
                })
        }
    };

    $scope.cancelNewCategory = function(){
        hideCategoryModal();
    }

    $scope.filterCategory = function(){
        var keywords = UtilsService.strings.keywordize($scope.data.q);
        var q = $scope.data.q;

        if(keywords.length){
            $scope.categories.forEach(function(c){
                var hide = true;

                if(_.intersection(c.keywords, keywords).length){
                    hide = false;
                }else{
                    hide = true;
                    if(c.name && c.name.indexOf(q) >= 0){
                        hide = false;
                    }if(c.displayName && c.displayName.indexOf(q) >= 0){
                        hide = false;
                    }if(c.pluralized && c.pluralized.indexOf(q) >= 0){
                        hide = false;
                    }else if(c.slug && c.slug.indexOf(q) >= 0){
                        hide = false
                    }
                }

                c.hidden = hide;
            });
        }else{
            $scope.categories.forEach(function(c){
                c.hidden = false;
            });
        }

        $ionicScrollDelegate.$getByHandle('categories-scroll').resize();
        $ionicScrollDelegate.$getByHandle('categories-scroll').scrollTop(false);
    }

    var hideCategoryModal = function(){
        if($scope.newCategoryModal){
            $scope.category = null;
            $scope.newCategoryModal.hide();
        }
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
          dynamicTyping: true,
          skipEmptyLines: true,
          complete: function(results){
            if(results){
              if(results.data){

                $scope.importError = [];
                $scope.records = results.data.filter(function(r) {
                  try {
                    var hasErrors = validate(r, validations.categoryImport);

                    if(!hasErrors) {
                      return r;
                    } else {
                      $scope.importError.push(validations.toArray(hasErrors));
                    }
                  } catch(e) {
                    $scope.importError.push(e.message);
                  }
                });

                console.log($scope.records);

                $ionicScrollDelegate.$getByHandle('categories-scroll').resize();
                $ionicScrollDelegate.$getByHandle('categories-scroll').scrollTop(false);

                $scope.openImportModal();
              }
              if(results.errors && results.errors.length){
                $scope.errors = results.errors;
                $scope.error = 'Some errors found';
                $scope.records = null;
                $scope.documents = {};
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
            $ionicModal.fromTemplateUrl('templates/import-categories.html', {
                scope: $scope,
                animation: 'slide-in-up'
            }).then(function(modal) {
                $scope._previewModal = modal;
                $scope._previewModal
                  .show()
                  .then(function() {
                    $ionicScrollDelegate.$getByHandle('categories-import-scroll').resize();
                    $ionicScrollDelegate.$getByHandle('categories-import-scroll').scrollTop(false);
                  });
            });
        }else{
            $scope._previewModal
              .show()
              .then(function() {
                $ionicScrollDelegate.$getByHandle('categories-import-scroll').resize();
                $ionicScrollDelegate.$getByHandle('categories-import-scroll').scrollTop(false);
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
        $ionicLoading.show({template: 'Importing Categories...'});
        CategoriesService
          .import($scope.records)
          .then(function(results) {
            $scope.closeImportModal();
            notifier.notify({
                title: 'Done',
                message: 'Categories file has been imported',
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
        $scope.refresh();
    });
})

.controller('CategoryCtrl', function($scope, $rootScope, $timeout, $state, $stateParams, CategoriesService, $ionicLoading, $ionicPopup, UtilsService, LANGS, $ionicScrollDelegate){
    var _ = require('lodash');

    if(_.isEmpty($rootScope.user)){
        $state.go('app.home');
        return;
    }

    var notifier = require('node-notifier');

    $scope.category = false;
    $scope.loading = false;
    $scope.categoryMaster = {};
    $scope.localizedCategories = [];
    $scope.availableLangs = LANGS;
    $scope.loadingi18n = false;

    $scope.$on('$ionicView.enter', function(){
        $timeout(function(){
            $scope.$apply(function(){
                $scope.loading = true;
            });
        });

        CategoriesService
            .getById($stateParams.id)
            .then(function(c){
                $timeout(function(){
                    $scope.$apply(function(){
                        $scope.category = c;
                        $ionicScrollDelegate.$getByHandle('categoryScroll').resize();
                    });
                });
                geti18n();
            }, function(e){
                $timeout(function(){
                    $scope.$apply(function(){
                        $scope.error = e.message;
                        $ionicScrollDelegate.$getByHandle('categoryScroll').resize();
                    });
                });
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
        var data = angular.copy($scope.category);
        var id = data.id;

        delete data.id;
        delete data.updatedAt;

        data.keywords = UtilsService.strings.sanitize(data.keywords.map(function(c){return c.text}));

        $timeout(function(){
            $scope.$apply(function(){
                $scope.saving = true;
            });
        });

        CategoriesService
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
            });
    };

    $scope.remove = function(){
        var confirmPopup = $ionicPopup.confirm({
            title: 'Delete',
            template: 'Are you sure you want to delete this category, there is no undo?'
        });

        confirmPopup.then(function(res) {
            $ionicLoading.show({template: 'Deleting...'});

            if(res) {
                CategoriesService
                    .remove($scope.category.id)
                    .then(function(removed){
                        if(removed){
                            alert('Category has been removed');
                            $rootScope.$broadcast('category:removed', $scope.category.id);
                            $scope.category = null;
                            $state.go('app.categories');
                        }else{
                            alert(removed);
                        }
                    }, function(e){
                        alert(e.message);
                    })
                    .finally(function(){
                        $ionicLoading.hide();
                    });
            }
        });
    };
    //Prepare new record to add to the localized categories
    $scope.addLocalized = function(){
        var data = angular.copy($scope.category);
        var currentLocalizations = $scope.localizedCategories.map(function(c){
            return c.lang;
        });
        //Configure
        data.availableLangs = _.without(LANGS, currentLocalizations);
        data.saved = false;
        data.collapsed = false;
        data.keywords = [];
        //Cleanup
        delete data.i18n;
        delete data.updatedAt;
        delete data.id;
        delete data.updateHistory;

        $scope.localizedCategories.push(data);
        $ionicScrollDelegate.$getByHandle('categoryScroll').resize();
    };
    //Check if we can add more translations
    $scope.canAddTranslation = function(){
        var currentLocalizations = $scope.localizedCategories.map(function(c){
            return c.lang;
        });
        //console.log($scope.availableLangs, currentLocalizations, _.intersection($scope.availableLangs, currentLocalizations.length));

        return true;
    };

    $scope.deleteLocalization = function(category){
        var confirmPopup = $ionicPopup.confirm({
            title: 'Delete',
            template: 'Are you sure you want to delete this translation?'
        });

        confirmPopup.then(function(res) {
            if(res) {
                var id = category.objectId;
                var lang = category.lang;

                $timeout(function(){
                    $scope.$apply(function(){
                        category.removing = true;
                    });
                });

                CategoriesService
                    .deleteLocalization($stateParams.id, id)
                    .then(function(){
                        var index = $scope.localizedCategories.findIndex(function(c){
                            if(c.objectId === id){
                                return c;
                            }
                        });

                        $scope.localizedCategories.splice(index, 1);

                        notifier.notify({
                            title: 'Translation Removed',
                            message: lang + ' translation record has been removed from category.',
                            sound: true, // Only Notification Center or Windows Toasters
                            wait: true // Wait with callback, until user action is taken against notification
                        }, function (err, response) {
                            // Response is response from notification
                            console.log('response', err, response);
                        });
                    }, function(e){
                        $scope.error = e.message;

                        notifier.notify({
                            title: 'Translation Not Removed',
                            message: e.message,
                            sound: true, // Only Notification Center or Windows Toasters
                            wait: true // Wait with callback, until user action is taken against notification
                        }, function (err, response) {
                            // Response is response from notification
                            console.log('response', err, response);
                        });
                    })
                    .finally(function(){
                        $timeout(function(){
                            $scope.$apply(function(){
                                $ionicScrollDelegate.$getByHandle('categoryScroll').resize();
                            });
                        });
                    });
            }
        });
    };

    $scope.cancelLocalization = function(data){
        $scope.localizedCategories.pop();
        $ionicScrollDelegate.$getByHandle('categoryScroll').resize();
    };

    $scope.saveLocalization = function(data){
        var defer;
        var d = angular.copy(data);
        var id;

        $timeout(function(){
            $scope.$apply(function(){
                $ionicScrollDelegate.$getByHandle('categoryScroll').resize();
                data.saving = true;
            });
        });
        //If we have an ID we need to update
        if(d.objectId){
            id = d.objectId;
            delete d.objectId;
            defer = CategoriesService.updateLocalization($stateParams.id, id, d);
        }else{
        //Create otherwise
            defer = CategoriesService.addLocalization($stateParams.id, d);
        }

        delete d.$$hashKey;
        delete d.availableLangs;
        delete d.i18n;
        delete d.saved;
        delete d.collapsed;
        delete d.updatedAt;

        d.keywords = UtilsService.strings.sanitize(d.keywords.map(function(c){return c.text}));

        defer
            .then(function(response){
                data.saved = true;
                data.objectId = response.id;

                notifier.notify({
                    title: 'Translation Saved',
                    message: lang + ' translation record has been saved to category.',
                    sound: true, // Only Notification Center or Windows Toasters
                    wait: true // Wait with callback, until user action is taken against notification
                }, function (err, response) {
                    // Response is response from notification
                    console.log('response', err, response);
                });

                $scope.localizationsError = false;
            }, function(e){
                console.log('localization error', e);
                notifier.notify({
                    title: 'Translation Not Saved',
                    message: e.message,
                    sound: true, // Only Notification Center or Windows Toasters
                    wait: true // Wait with callback, until user action is taken against notification
                }, function (err, response) {
                    // Response is response from notification
                    console.log('response', err, response);
                });
            })
            .finally(function(){
                $timeout(function(){
                    $scope.$apply(function(){
                        $ionicScrollDelegate.$getByHandle('categoryScroll').resize();
                        data.saving = false;
                    });
                });
            });
    }

    var geti18n = function(){
        $timeout(function(){
            $scope.$apply(function(){
                $scope.loadingi18n = true;
            });
        });

        CategoriesService
            .getLocalizationForCategory($stateParams.id)
            .then(function(c){
                c = c.map(function(ca){
                    ca.collapsed = true;
                    ca.saved = true;
                    return ca;
                });

                $scope.localizedCategories = c;
            }, function(e){
                $scope.localizationsError = e.message;
            })
            .finally(function(){
                $timeout(function(){
                    $scope.$apply(function(){
                        $scope.loadingi18n = false;
                        $ionicScrollDelegate.$getByHandle('categoryScroll').resize();
                    });
                });
            });
    }
});
