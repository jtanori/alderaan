angular.module('manager.controllers')

.controller('ImportCtrl', function($scope, $rootScope, $timeout, Upload, UtilsService, VenueService, $ionicLoading, $ionicScrollDelegate, CategoriesService, $ionicModal, GOOGLE_MAPS_API_KEY){
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

    $scope.log = '';
    $scope.records = null;
    $scope.errors = null;
    $scope.loading = true;
    $scope.dirName = '';
    $scope.documents = {};
    $scope.categories = [];
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

            $scope.dirName = file.name.replace('.csv', '');

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
                                console.log('docs not empty', docs);
                                var size = _.size(docs);
                                var keys = _.keys(docs);

                                var index = _.chunk(keys, 25);
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
                                        $scope.pagesArray = _.range($scope.pages);
                                    });
                                });
                            }else{
                                $timeout(function(){
                                    $scope.$apply(function(){
                                        $scope.chunks = [];
                                        $scope.pages = 0;
                                        $scope.currentPage = 0;
                                        $scope.error = 'No valid data found';
                                        $scope.pagesArray = [];
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
                                    }, function(){
                                        console.log('call back', arguments);
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


                                    console.log('category records', $scope.categoryImportModel);
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
                .import(data.category, data.items)
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
                $scope.pagesArray = [];
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
                $scope.currentPage = index*1;
            });
        });
    };

    $scope.runFilter = function(i, altKeywords){
        console.log(i, 'index', $scope.records[i]);

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

                    console.log($scope.records, 'records');
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
        console.log('current page', c, p);
        $timeout(function(){
            $scope.$apply(function(){
                $scope.loading = true;
                $ionicScrollDelegate.$getByHandle('importScrollHandle').resize();
                $ionicScrollDelegate.$getByHandle('importScrollHandle').scrollTop(false);

                $timeout(function(){
                    $scope.$apply(function(){
                        $scope.records = $scope.chunks[c];
                        console.log($scope.records, 'records');
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
            var category = record.category;

            delete data.category;

            var venues = data.map(function(r){
                r.category = category;
                return r;
            });

            record.saving = true;

            CategoriesService
                .saveCollection(venues)
                .then(function(response){
                    console.log('venues saved', response)
                }, function(e){
                    console.log('error saving', e);
                })
                .finally(function(){
                    record.saving = false;
                    record = null;
                });
        }
    }

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
            size: '650x600',
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
                    return {id: cat.id, name: cat.displayName};
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
