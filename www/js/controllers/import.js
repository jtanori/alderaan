angular.module('manager.controllers')

.controller('ImportCtrl', function($scope, $timeout, Upload, UtilsService, VenueService, $ionicLoading, $ionicScrollDelegate, CategoriesService, $ionicModal){
    var Papa = require('papaparse');
    var _ = require('lodash');
    var slugify = require('underscore.string/slugify');
    var writefile = require('writefile');
    var fileSave = require('file-save');
    var fs = require('fs');
    var mkdirp = require('mkdirp');
    var shell = require('electron').shell;
    var notifier = require('node-notifier');

    $scope.log = '';
    $scope.records = null;
    $scope.errors = null;
    $scope.loading = false;
    $scope.dirName = '';
    $scope.documents = {};
    $scope.categories = [];
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

                            results.data
                                .forEach(function(v, i){
                                    var doc = slugify(v.activity_description).toLowerCase();
                                    var venue = VenueService.parse(v, {fromBatch: true});

                                    if($scope.documents[doc]){
                                        $scope.documents[doc].push(venue);
                                    }else{
                                        $scope.documents[doc] = [venue];
                                    }
                                });

                            if(!_.isEmpty($scope.documents)){
                                var size = _.size($scope.documents);
                                var keys = _.keys($scope.documents);

                                var index = _.chunk(keys, 50);
                                var chunks = index.map(function(indexes, i){
                                    var d = {};

                                    indexes.forEach(function(indx, i){
                                        d[indx] = $scope.documents[indx];
                                    });

                                    return d;
                                });

                                $scope.chunks = chunks;

                                //Make smaller items in every chunk
                                $scope.chunks = $scope.chunks.map(function(c){
                                    if(c.length > 500){
                                        console.log('chunk is too big');
                                        return _.chunks(c, 500).splice();
                                    }else{
                                        return c;
                                    }
                                });
                                //$scope.records = $scope.chunks[0];
                                $scope.pages = chunks.length;
                                $scope.currentPage = 0;
                            }else{
                                $scope.chunks = [];
                                $scope.pages = 0;
                                $scope.currentPage = 0;
                                $scope.error = 'No valid data found';
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

    $scope.next = function(){
        $timeout(function(){
            $scope.$apply(function(){
                $scope.loading = true;
                $ionicScrollDelegate.$getByHandle('importScrollHandle').resize();
                $ionicScrollDelegate.$getByHandle('importScrollHandle').scrollTop(false);
            });
        });

        if($scope.currentPage < $scope.pages){
            $timeout(function(){
                $scope.$apply(function(){
                    ++$scope.currentPage;
                });
            });
        }
    };

    $scope.prev = function(){
        $timeout(function(){
            $scope.$apply(function(){
                $scope.loading = true;
                $ionicScrollDelegate.$getByHandle('importScrollHandle').resize();
                $ionicScrollDelegate.$getByHandle('importScrollHandle').scrollTop(false);
            });
        });

        if($scope.currentPage > 0){
            $timeout(function(){
                $scope.$apply(function(){
                    --$scope.currentPage;
                });
            });
        }
    };

    $scope.$watch('currentPage', function(c, p){
        $timeout(function(){
            $scope.$apply(function(){
                $scope.records = $scope.chunks[c];
                $scope.loading = false;
            });
        });
    });

    $scope.parseSection = function(c){
        console.log(c, 'c');
    };

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

    $scope.detail = function(records){
        $scope.previewRecords = records;
        $scope.previewCategoryName = 'Category Preview';

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

    $scope.parse = function(){
        $timeout(function(){
            $scope.$apply(function(){
                $scope.loading = true;
            });
        });

        mkdirp('/tmp/jound-manager-data/' + $scope.dirName, function(err) {

            // path was created unless there was error
            if(err){
                var myNotification = new Notification('Error', {
                    body: err
                });
            }else{
                _.each($scope.documents, function(docs, name){
                    var data = Papa.unparse(docs);
                    var fileName = '/tmp/jound-manager-data/' + $scope.dirName + '/' + name + '.csv';

                    fs.writeFile(fileName, data, function(err) {
                        if(err) {
                            return console.log(err);
                        }

                    });
                });

                var myNotification = new Notification('Complete', {
                    body: 'All files have been saved'
                });

                shell.openItem('/tmp/jound-manager-data/' + $scope.dirName);

                $timeout(function(){
                    $scope.$apply(function(){
                        $scope.records = null;
                        $scope.loading = false;
                        $scope.documents = {};
                    });
                });
            }

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
