angular.module('manager.controllers')

.controller('CategoriesCtrl', function($scope, $timeout, $ionicPlatform, CategoriesService, $ionicLoading){
    $scope.categories = [];
    $scope.error = null;

    $scope.refresh = function(force){
        $timeout(function(){
            $scope.$apply(function(){
                $scope.loading = true;
            });
        });

        CategoriesService
            .get(force || false)
            .then(function(results){
                if(results){
                    $scope.categories = results;
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
                    });
                });
            });
    };

    $scope.$on('$ionicView.enter', function(){
        if(!$scope.categories.length){
            $scope.refresh();
        }
    });
})

.controller('CategoryCtrl', function($scope, $timeout, $stateParams, CategoriesService, $ionicLoading, $ionicPopup, UtilsService, LANGS, $ionicScrollDelegate){
    var _ = require('lodash');
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
                $scope.category = c;

                geti18n();
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
            template: 'Are you sure you want to delete this category?'
        });

        confirmPopup.then(function(res) {
            if(res) {
                console.log('You are sure');
            } else {
                console.log('You are not sure');
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
