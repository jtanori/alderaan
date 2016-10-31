angular.module('manager.controllers')

.controller('ImportCtrl', function($scope, $q, $rootScope, $timeout, Upload, UtilsService, VenueService, $ionicLoading, $ionicScrollDelegate, CategoriesService, $ionicModal, GOOGLE_MAPS_API_KEY){
    var _ = require('lodash');

    if(_.isEmpty($rootScope.user)){
        $state.go('app.home');
        return;
    }

    const dialog = require('electron').remote.dialog;

    var Papa = require('papaparse');
    var slugify = require('underscore.string/slugify');
    var cleanDiacritics = require('underscore.string/cleanDiacritics');
    var writefile = require('writefile');
    var fileSave = require('file-save');
    var fs = require('fs');
    var mkdirp = require('mkdirp');
    var shell = require('electron').shell;
    var notifier = require('node-notifier');
    var gm = require('googlemaps');
    var gmAPI = new gm({key: GOOGLE_MAPS_API_KEY});
    var async = require('async');

    $scope.log = '';
    $scope.records = null;
    $scope.errors = null;
    $scope.loading = true;
    $scope.savingAll = false;
    $scope.documents = {};
    $scope.categories = [];
    $scope.categoriesFound = [];
    $scope.data = {currentPage: $scope.currentPage};
    $scope.$watch('files', function () {
        if($scope.files && $scope.files.length){
            upload($scope.files);
        }
    });
    $scope.chunks = [];
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
                            $scope.log = 'Parsed ' + results.data.length + ' records from file[' + file.name + ']';
                            var docs = {};

                            _.sortBy(results.data, function(v){
                                return slugify(v.activity_description).toLowerCase();
                            })
                            .forEach(function(v, i){
                                var doc = slugify(v.activity_description).toLowerCase();
                                var venue = VenueService.parse(v, {from_batch: true});

                                if(docs[doc]){
                                    docs[doc].push(venue);
                                }else{
                                    docs[doc] = [venue];
                                }
                            });

                            if(!_.isEmpty(docs)){
                                var size = _.size(docs);
                                var keys = _.keys(docs);

                                var index = _.chunk(keys, 15);
                                var chunks = index.map(function(indexes, i){
                                    var d = {};

                                    indexes.forEach(function(indx, i){
                                        d[indx] = docs[indx];
                                    });

                                    return d;
                                });

                                $timeout(function(){
                                    $scope.$apply(function(){
                                        $scope.chunks = chunks;
                                        $scope.pages = chunks.length;
                                        $scope.currentPage = 0;
                                    });
                                });
                            }else{
                                $timeout(function(){
                                    $scope.$apply(function(){
                                        $scope.chunks = [];
                                        $scope.pages = 0;
                                        $scope.currentPage = 0;
                                        $scope.error = 'No valid data found';
                                    });
                                });
                            }

                            $ionicScrollDelegate.$getByHandle('importScrollHandle').resize();
                            $ionicScrollDelegate.$getByHandle('importScrollHandle').scrollTop(false);

                            $timeout(function(){
                                $scope.$apply(function(){
                                    $scope.loading = false;
                                    notifier.notify({
                                        title: 'File Parsed',
                                        message: 'Found ' + $scope.chunks.length + ' documents',
                                        sound: true, // Only Notification Center or Windows Toasters
                                        wait: true // Wait with callback, until user action is taken against notification
                                    });
                                });
                            });
                        }
                        if(results.errors && results.errors.length){
                            $scope.errors = results.errors;
                            $scope.error = 'Some errors found';
                            $scope.records = null;
                            $scope.documents = {};

                            $timeout(function(){
                                $scope.$apply(function(){
                                    $scope.loading = false;
                                });
                            });
                        }
                    }else{
                        $scope.error = 'Nothing to parse, please check your CSV file';
                    }
                }
            });
        }
    };

    $scope.uploadSingle = function(files){
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
                            $scope.log = 'Parsed ' + results.data.length + ' records from file[' + file.name + ']';

                            $timeout(function(){
                                $scope.$apply(function(){
                                    $scope.categoryImportModel.items =
                                                    results
                                                        .data
                                                        .map(function(v, i){
                                                            var venue = VenueService.parse(v, {from_batch: true});

                                                            return venue;
                                                        });
                                    $scope.loading = false;
                                });
                            });
                        }

                        if(results.errors && results.errors.length){
                            $scope.errors = results.errors;
                            $scope.error = 'Some errors found';
                            $scope.records = null;
                            $scope.documents = {};

                            $timeout(function(){
                                $scope.$apply(function(){
                                    $scope.loading = false;
                                });
                            });
                        }
                    }else{
                        $scope.error = 'Nothing to parse, please check your CSV file';
                    }
                }
            });
        }
    };

    $scope.categoryImportModelMaster = {
        category: null,
        items: null
    };
    $scope.categoryImportModel = angular.copy($scope.categoryImportModelMaster);
    $scope.cancelImpotByCategory = function(){
        $timeout(function(){
            $scope.$apply(function(){
                $scope.categoryImportModel = angular.copy($scope.categoryImportModelMaster);
            });
        });
    };

    $scope.saveRecordsForCategory = function(){
        if($scope.categoryImportModel.category && $scope.categoryImportModel.items){
            var data = angular.copy($scope.categoryImportModel);

            data.items = data.items.map(function(v){
                delete v.__parsed_extra;
                delete v.$$hashKey;

                return v;
            });

            $ionicLoading.show({template: '<ion-spinner></ion-spinner><br />Saving, this may take a moment'});

            VenueService
                .import(data.items, data.category)
                .then(function(){
                    dialog.showMessageBox({title: 'Success', buttons: ['Ok'], type: 'info', message: 'Venues have been imported'});
                    //Clear results
                    $timeout(function(){
                        $scope.$apply(function(){
                            $scope.categoryImportModel = angular.copy($scope.categoryImportModelMaster);
                        });
                    });
                }, function(e){
                    dialog.showErrorBox('Error', e.message);
                })
                .finally(function(){
                    $ionicLoading.hide();
                });
        }else{
            dialog.showErrorBox('Error', 'Please select a category and provide a valid CSV file for importing');
        }
    };

    $scope.cancelBatchImport = function(){
        $timeout(function(){
            $scope.$apply(function(){
                $scope.chunks = [];
                $scope.pages = null;
                $scope.currentPage = null;
                $scope.documents = {};
                $scope.records = null;
            });
        });
    }

    $scope.next = function(){
        if($scope.currentPage < $scope.pages){
            $timeout(function(){
                $scope.$apply(function(){
                    ++$scope.currentPage;
                });
            });
        }
    };

    $scope.prev = function(){
        if($scope.currentPage > 0){
            $timeout(function(){
                $scope.$apply(function(){
                    --$scope.currentPage;
                });
            });
        }
    };

    $scope.goTo = function(index){
        $timeout(function(){
            $scope.$apply(function(){
                $scope.currentPage = index * 1;
            });
        });
    };

    $scope.runFilter = function(i, altKeywords){
        var records = angular.copy($scope.records[i]);
        var docs = {};
        var recordCount = 0;
        var indexes = [];

        altKeywords = UtilsService.strings.keywordize(altKeywords);
        //altKeywords = _.uniq(altKeywords);

        if(!_.isEmpty(altKeywords)){
            records.forEach(function(r, k){
                try{
                    var index;
                    var keywords = UtilsService.strings.sanitize(r.keywords);

                    if(altKeywords.length === 1 && keywords.indexOf(altKeywords[0])!== -1){
                        index = altKeywords;
                    }else{
                        index = _.intersection(keywords, altKeywords);
                    }

                    if(_.isEmpty(index)){
                        return;
                    }

                    if(index.length > 1){
                        index = index.join('-');
                    }else{
                        index = index[0];
                    }

                    records[k] = null;

                    if($scope.records[index]){
                        $scope.records[index].push(r);
                    }else{
                        $scope.records[index] = [r];
                    }

                    recordCount++;
                }catch(e){
                    console.log('error', e);
                }
            });

            $timeout(function(){
                $scope.$apply(function(){
                    $scope.records[i] = records.filter(function(r){
                        console.log(r, 'r');
                        if(!_.isEmpty(r)){
                            return r;
                        }
                    });
                    //records._additionalKeywords = '';
                    $ionicScrollDelegate.$getByHandle('importScrollHandle').resize();

                    var myNotification = new Notification('Filter Performed', {
                        body: recordCount + ' records have been extracted'
                    });
                });
            }, 1000);
        }else{
            alert('No keywords found');
        }
    };

    $scope.$watch('currentPage', function(c, p){
        $timeout(function(){
            $scope.$apply(function(){
                $scope.loading = true;
                $ionicScrollDelegate.$getByHandle('importScrollHandle').resize();
                $ionicScrollDelegate.$getByHandle('importScrollHandle').scrollTop(false);

                $timeout(function(){
                    $scope.$apply(function(){
                        $scope.records = $scope.chunks[c];
                        $scope.loading = false;
                        $ionicScrollDelegate.$getByHandle('importScrollHandle').resize();
                        $ionicScrollDelegate.$getByHandle('importScrollHandle').scrollTop(false);
                    });
                });
            });
        });
    });

    $scope.save = function(record, index){
        if(record.category){
          var data = angular.copy(record);

          delete data.category;
          delete data.categoryText;
          delete data.categoriesFound;

          record.saving = true;

          return VenueService
              .import(data, record.category.id)
              .then(function(response){
                  notifier.notify({
                      title: 'Venues Saved',
                      message: 'Your venues have been saved.',
                      sound: true, // Only Notification Center or Windows Toasters
                      wait: true // Wait with callback, until user action is taken against notification
                  });
                  $timeout(function() {
                    $scope.$apply(function() {
                      record = null;
                      delete $scope.records[index];

                      if(_.isEmpty($scope.records)) {
                        $scope.records = null;
                        $scope.loading = false;
                      }
                    });
                  });
              }, function(e){
                record.saving = false;
                alert('Error', e.message);
              });
        }
    };

    $scope.saveAll = function(){
        var canSaveAll = $scope.canSaveAll();
        var series;
        var records;
        if(!canSaveAll) {
          alert('Please set category to all groups.');
        } else {
          $timeout(function() {
            $scope.$apply(function() {
              $scope.savingAll = true;
              $ionicLoading.show({template: 'Saving All Records<br />This may take a while<br />Whant some coffee?'});

              series = _.chain($scope.records).omit('$$hashKey').map(function(record, index) {
                var items = _.omit(record, ['category', 'categoryText', 'categoriesFound']);

                items = _.map(items, function(i) {
                  return i;
                });

                return function(cb) {
                  VenueService
                    .import(items, record.category.id)
                    .then(function() {
                      $timeout(function() {
                        $scope.$apply(function() {
                          record = null;
                          delete $scope.records[index];

                          if(_.isEmpty($scope.records)) {
                            $scope.records = null;
                            $scope.loading = false;
                          }
                        });
                      });

                      cb();
                    }, function(e) {
                      cb(e);
                    });
                }
              }).value();

              async.series(series, function(err, results){
                $timeout(function() {
                  $scope.$apply(function() {
                    $scope.savingAll = false;
                    $ionicLoading.hide();

                    if(err) {
                      console.log(err, 'error');
                      alert('Error', err.message);
                    } else {
                      notifier.notify({
                          title: 'Venues Saved',
                          message: 'Your venues have been saved.',
                          sound: true,
                          wait: true
                      });

                      if($scope.chunks.length > 1) {
                        // Remove saved items
                        $scope.chunks.splice($scope.currentPage, 1);
                        // Go to previous page if this is the last one
                        if($scope.currentPage === $scope.chunks.length) {
                          $scope.records = $scope.chunks[$scope.currentPage - 1];
                          $scope.currentPage = $scope.currentPage - 1;
                        } else {
                          $scope.records = $scope.chunks[$scope.currentPage];
                        }

                      } else {
                        $scope.chunks = [];
                        $scope.pages = null;
                        $scope.currentPage = null;
                        $scope.documents = {};
                        $scope.records = null;
                      }
                    }
                  });
                });
              });
            });
          });
        }
    };

    $scope.canSaveAll = function() {
      var noHasCategory = _.chain($scope.records)
        .omit('$$hashKey')
        .find(function(r){
          if(_.isEmpty(r.category)) {
            return r;
          }
        }).value();

      return !noHasCategory;
    };

    $scope.detail = function(id){
        $scope.previewRecords = $scope.records[id];
        $scope.previewCategoryName = 'Category Preview: ' + id;

        if(!$scope.previewModal){
            $ionicModal.fromTemplateUrl('templates/import-detail-modal.html', {
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

    $scope.hideDetailModal = function(){
        if($scope.previewModal){
            $scope.previewModal.hide();
        }
    }

    $scope.showLocation = function(lat, lng, name, record){
        var params = {
            center: lat + ',' + lng,
            zoom: 15,
            size: '640x600',
            maptype: 'roadmap',
            markers: [
                {
                    location: lat + ',' + lng,
                    label   : 'Venue',
                    color   : 'orange',
                    shadow  : true
                }
            ]
        };
        var w = window.open(gmAPI.staticMap(params), "Map Preview");

        w.focus();
    };

    $scope.categoryLookup = function(record, showAll) {
      if(record && record.categoryText) {
        var text = record.categoryText.toLowerCase();
        var categories = $scope.categories.filter(function(c) {
          var found = false;
          var name = c.name.toLowerCase();
          if(name.indexOf(text) >= 0) {
            found = true;
          }

          if(!_.isEmpty(c.keywords) && _.isArray(c.keywords)) {
            found = c.keywords.find(function(k) {
              // If search is index of keyword
              if(k.indexOf(text) >= 0) {
                return true;
              }

              // If keyword is index of search
              if(text.indexOf(k) >= 0) {
                return true;
              }
            });
          }

          if(found) {
            return found;
          }
        });

        record.categoriesFound = categories;
      } else if(showAll){
        record.categoriesFound = $scope.categories;
      } else {
        record.categoriesFound = [];
      }
    };

    $scope.showAllCategories = function($event, record) {
      if($event && $event.keyCode === 40) {
        $scope.categoryLookup(record, true);
      }
    }

    $scope.setCategory = function(category, record) {
      $timeout(function(){
        $scope.$apply(function(){
          record.categoriesFound = [];
          record.categoryText = category.name;
          record.category = category;
        });
      });
    }

    $scope.$on('$ionicView.enter', function(){
        $timeout(function(){
            $scope.$apply(function(){
                $scope.loadingCategories = true;
            });
        });

        CategoriesService
            .get()
            .then(function(c){
                $scope.categories = c.map(function(cat){
                    return {id: cat.id, name: cat.displayName, keywords: cat.keywords};
                });

                return _.map(c, function(c){return {id: c.id, indicators: c.indicators, keywords: c.keywords};});
            })
            .then(function(results){
                $scope.indicators = results;
            }, function(e){
                $scope.categoriesError = e.message;
            })
            .finally(function(){
                $timeout(function(){
                    $scope.$apply(function(){
                        $scope.loadingCategories = false;
                    });
                });
            });
    });
});
