angular.module('manager.controllers')

.controller('VenueCtrl', function($rootScope, $scope, venue){
    var _ = require('lodash');
    const dialog = require('electron').remote.dialog;

    if(_.isEmpty($rootScope.user)){
        window.close();
        return;
    };
})

.controller('VenueConfigurationCtrl', function($rootScope, $scope, $state, $timeout, $ionicLoading, VenuesService){
    var _ = require('lodash');
    const dialog = require('electron').remote.dialog;

    if(_.isEmpty($rootScope.user)){
        window.close();
        return;
    };

    $scope.master = {};
    $scope.model = {};
    $scope.canSave = false;
    $scope.cover = $rootScope.venue.getCover().url;
    $scope.venue = angular.copy($rootScope.venue.attributes);

    $scope.uploadCover = function(file){
        if(file && $scope.model){
            try{
                var x = new FileReader();
                var fileType = file[0].type

                x.onload = function(){
                    $scope.model._banner = x.result;
                    $scope.cover = x.result;
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
        $scope.model._banner = null;
        if($scope.model.file){
            $scope.model.file = null;
            $scope.model.fileType = null;
        }else if($scope.model.bannerUrl){
            $scope.model.bannerUrl = null;
        }
    };

    $scope.cancel = function(){
        console.log('cancel');
    };

    $scope.save = function(){
        var options = angular.copy($scope.model);

        if(!(options._banner || options.fileType)){
            return;
        }

        options.cover = options._banner;
        options.coverFileType = options.fileType;

        delete options._banner;
        delete options.fileType;

        $ionicLoading.show({template: 'Updating'});

        VenuesService
            .update($rootScope.venue.id, options)
            .then(function(response){
                console.log('todo bien', response);
            }, function(e){
                console.log('todo no bien' ,e);
            })
            .finally(function(){
                $ionicLoading.hide();
            });
    };

    $scope.$on('$ionicView.enter', function(){
        $scope.model = angular.copy($scope.master);
    });

    $scope.$watch('model', function(curr, prev){
        if(!_.isEmpty(curr) && !_.isEqual(curr, $scope.master)){
            console.log('can save');
            $scope.canSave = true;
        }
    }, true);
})

.controller('VenueEventCtrl', function($rootScope, $scope, $state, $timeout, $ionicLoading, events, VenuesService, EventsService, $ionicModal){
    var _ = require('lodash');
    const dialog = require('electron').remote.dialog;
    var Papa = require('papaparse');
    var tz = require('moment-timezone');

    if(_.isEmpty($rootScope.user)){
        window.close();
        return;
    };

    $scope.items = [];

    $scope.reload = function(){
        $ionicLoading.show({template: 'Loading Events'});

        EventsService
            .getForVenue($rootScope.venue.id, 0, true)
            .then(function(r){
                console.log('events', r);
                $rootScope.events = r;
                $scope.items = r;
            }, function(e){
                $scope.error = e;
            })
            .finally(function(){
                $ionicLoading.hide();
            });
    };

    $scope.detail = function(){
        if(!$scope.previewModal){
            $ionicModal.fromTemplateUrl('templates/venue/events/import.html', {
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

    $scope.save = function(){
        $ionicLoading.show({template: 'Saving Events'});

        VenuesService
            .importEvents($rootScope.venue.id, $scope.events)
            .then(function(){
                dialog.showMessageBox({title: 'Success', buttons: ['Ok'], type: 'info', message: 'Events Saved'});

                $ionicLoading.show({template: 'Loading Events'})

                EventsService
                    .getForVenue($rootScope.venue.id)
                    .then(function(r){
                        $timeout(function(){
                            $scope.$apply(function(){
                                $scope.items = r;
                            });
                        })
                    }, function(e){
                        $scope.error = e;
                    })
                    .finally(function(){
                        $ionicLoading.hide();
                    });
            }, function(e){
                dialog.showErrorBox('Error', e.message);
            })
            .finally(function(){
                $ionicLoading.hide();
                $scope.closeDetailModal();
            });
    };

    $scope.closeDetailModal = function(){
        $scope.events = [];
        $scope.previewModal.hide();
    }

    $scope.import = function($file){
        if($file && $file.length){
            var file = $file[0];


            Papa.parse(file, {
                //worker: true,
                header: true,
                dynamicTyping: true,
                skipEmptyLines: true,
                complete: function(results){
                    if(results){
                        if(results.data){
                            var data = results.data.map(function(d){
                                var parts = d.date.split('/');
                                //YEAR, MONTH, DAY, default format e.g. 05/26/2016
                                var date = new Date(parts[2], (parts[1] - 1), parts[0]);
                                var featured = _.isEmpty(d.featured) ? false : d.featured.trim();
                                var active = _.isEmpty(d.active) ? false : d.active.trim();

                                if(featured === 'true' || featured === true){
                                    d.featured = true;
                                }else {
                                    d.featured = false;
                                }

                                if(active === 'true' || active === true){
                                    d.active = true;
                                }else{
                                    d.active = false;
                                }

                                date.setHours(d.hour);
                                date.setMinutes(d.minutes);

                                d.startViewableDate = new Date();
                                d.endViewableDate = new Date(date*1 + 24 * 60 * 60 * 1000);
                                d.eventDay = date;

                                delete d.hour;
                                delete d.minutes;
                                delete d.date;

                                return d;
                            });

                            if(data.length){
                                console.log(data);
                                $scope.events = data;
                                $scope.detail();
                            }
                        }
                    }else{
                        $scope.error = 'Nothing to parse, please check your CSV file';
                    }
                }
            });
        }
    };

    $scope.$on('$ionicView.enter', function(){
        if(_.isEmpty($scope.items)){
            $scope.items = events;
        }
        $ionicLoading.hide();
    });
})

.controller('VenueEventAddCtrl', function($rootScope, $scope, $state, $timeout, $ionicLoading, EventsService, currencies, $ionicHistory, HOURS, MINUTES){
    var _ = require('lodash');
    var moment = require('moment');
    const dialog = require('electron').remote.dialog;

    if(_.isEmpty($rootScope.user)){
        window.close();
        return;
    };

    $scope.currencies = currencies;
    $scope.minDate = new Date();

    $scope.master = {
        file: null,
        bannerUrl: null,
        title: null,
        price: 0,
        priceCurrency: null,
        description: null,
        about: null,
        lineUp: null,
        featured: false,
        active: true,
        eventDay: new Date(),
        startViewableDate: new Date(),
        endViewableDate: new Date()*1 + 24 * 60 * 60 * 1000,
        gallery: null,
        www: null,
        contact: null,
        phone: null,
        availableHours: HOURS,
        availableMinutes: MINUTES
    };

    $scope.hours = HOURS;
    $scope.minutes = MINUTES;

    $scope.model = angular.copy($scope.master);

    $scope.canSave = function(){
        var m = $scope.model;

        if(_.isEmpty(m) || !(m._banner || m.bannerUrl) || _.isEmpty(m.title) || _.isEmpty(m.description) || _.isEmpty(m.eventDay)){
            return false;
        }

        return true;
    };

    $scope.uploadCover = function(file, err){
        if(file){
            try{
                var x = new FileReader();

                x.onload = function(){
                    $scope.model._banner = x.result;
                };

                x.readAsDataURL(file[0]);
                $scope.model.file = file[0];
                $scope.model.fileType = file[0].type;
            }catch(e){
                dialog.showErrorBox('Error', e.message);
            }
        }else{
            $scope.model.file = null;
        }
    };

    $scope.removeCover = function(){
        $scope.model._banner = null;
        if($scope.model.file){
            $scope.model.file = null;
            $scope.model.fileType = null;
        }else if($scope.model.bannerUrl){
            $scope.model.bannerUrl = null;
        }
    };

    $scope.save = function(){
        if($scope.canSave()){
            var data = angular.copy($scope.model);

            if(data.file){
                delete data.bannerUrl;
                data.file = data._banner;
            }else if(data.bannerUrl){
                delete data.file;
            }

            data.eventDay = new Date(data.eventDay);

            if(!_.isEmpty(data.minutes)){
                data.eventDay.setMinutes(data.minutes.id);
            }

            if(!_.isEmpty(data.hour)){
                data.eventDay.setHours(data.hour.id);
            }

            data.endViewableDate = new Date(data.eventDay*1 + 24 * 60 * 60 * 1000);
            data.startViewableDate = new Date();

            delete data.hour;
            delete data.minutes;
            delete data._banner;
            delete data.availableHours;
            delete data.availableMinutes;

            _.forEach(data, function(d, i){
                if(_.isNull(d)){
                    delete data[i];
                }
            });

            $ionicLoading.show({template: 'Saving Event'});

            EventsService
                .addEvent($rootScope.venue.id, data)
                .then(function(ev){
                    $rootScope.events.push(ev);
                    dialog.showMessageBox({title: 'Success', buttons: ['Ok'], type: 'info', message: 'Event Saved'});
                    $state.go('venue.events');
                }, function(e){
                    dialog.showErrorBox('Error', e.message);
                })
                .finally(function(){
                    $ionicLoading.hide();
                });

        }
    };

    $scope.$on('$ionicView.enter', function(){
        $ionicLoading.hide();
    });

    $scope.$on('$ionicView.leave', function(){
        $scope.model = angular.copy($scope.master);
    });
})

.controller('VenueEventEditCtrl', function($rootScope, $scope, $state, $timeout, $interval, $ionicLoading, $ionicHistory, EventsService, currencies, event, HOURS, MINUTES){
    var _ = require('lodash');
    var moment = require('moment');
    const dialog = require('electron').remote.dialog;

    if(_.isEmpty($rootScope.user)){
        window.close();
        return;
    };

    $scope.currencies = currencies;
    $scope.minDate = new Date();
    $scope.hours = HOURS;
    $scope.minutes = MINUTES;

    $scope.master = {};
    $scope.model = angular.copy($scope.master);
    $scope.canSave = false;

    $scope.uploadCover = function(file, err){
        if(file){
            try{
                var x = new FileReader();

                x.onload = function(){
                    $scope.model._banner = x.result;
                    $scope.event._banner = x.result;
                };

                x.readAsDataURL(file[0]);
                $scope.event.file = file[0];
                $scope.event.fileType = file[0].type;
            }catch(e){
                dialog.showErrorBox('Error', e.message);
            }
        }else{
            $scope.model.file = null;
        }
    };

    $scope.removeCover = function(){
        $scope.model._banner = null;
        if($scope.model.file){
            $scope.model.file = null;
            $scope.model.fileType = null;
        }else if($scope.model.bannerUrl){
            $scope.model.bannerUrl = null;
        }
    };

    $scope.save = function(){
        if($scope.canSave){
            var data = angular.copy($scope.model);

            if(data._banner){
                data.file = data._banner;
                data.fileType = $scope.event.fileType;
            }

            data.eventDay = new Date(data.eventDay);

            if(!_.isEmpty(data.minutes)){
                data.eventDay.setMinutes(data.minutes.id);
            }else{
                data.eventDay.setMinutes($scope.event.minutes.id);
            }

            if(!_.isEmpty(data.hour)){
                data.eventDay.setHours(data.hour.id);
            }else{
                data.eventDay.setHours($scope.event.hour.id);
            }

            data.endViewableDate = new Date(data.eventDay*1 + 24 * 60 * 60 * 1000);
            data.startViewableDate = new Date();

            delete data.hour;
            delete data.minutes;
            delete data._banner;
            delete data.availableHours;
            delete data.availableMinutes;
            delete data.objectId;
            delete data.venue;
            delete data.createdAt;
            delete data.updatedAt;

            _.forEach(data, function(d, i){
                if(_.isNull(d)){
                    delete data[i];
                }
            });

            $ionicLoading.show({template: 'Updating Event'});

            EventsService
                .patch($rootScope.venue.id, $scope.event.objectId, data)
                .then(function(ev){
                    dialog.showMessageBox({title: 'Success', buttons: ['Ok'], type: 'info', message: 'Event Saved'});
                }, function(e){
                    dialog.showErrorBox('Error', e.message);
                })
                .finally(function(){
                    $ionicLoading.hide();
                });

        }
    };

    $scope.remove = function(){
        var remove = confirm('Are you sure you want to delete this event? There is no undo.');

        if(remove){
            $ionicLoading.show({template: 'Deleting Event...'});

            EventsService
                .remove($rootScope.venue.id, $scope.event.objectId)
                .then(function(){
                    dialog.showMessageBox({title: 'Success', buttons: ['Ok'], type: 'info', message: 'Event Removed'});

                    $timeout(function(){
                        $rootScope.$apply(function(){
                            //Find and remove event
                            var id = $scope.event.objectId;
                            var index = _.findIndex($rootScope.events, function(e){
                                return e.objectId === id;
                            });

                            if(index >= 0){
                                $rootScope.events.splice(index, 1);
                            }
                        })
                    })

                    $state.go('venue.events');
                }, function(e){
                    dialog.showErrorBox('Error', e.message);
                })
                .finally(function(){
                    $ionicLoading.hide();
                });
        }
    };

    $scope.onCurrencyChange = function(currency){
        if($scope.model){
            $scope.model.currency = currency;
        }
    };

    $scope.$on('$ionicView.enter', function(){
        $ionicLoading.hide();

        if(_.isEmpty(event)){
            dialog.showErrorBox('Error', 'Looks like the event does not longer exists, please contact customer support if this is a mistake.');
            $state.go('venue.events');
        }

        var date = new Date(event.eventDay.iso);

        event.hour = HOURS[date.getHours()];
        event.minutes = MINUTES[date.getMinutes()/15];
        event.availableMinutes = MINUTES;
        event.availableHours = HOURS;
        event._banner = (function(){
            if(event.bannerUrl){
                return event.bannerUrl;
            }else if(event.file){
                return event.file.file.url;
            }
        })();

        $scope.event = event;
        $scope.original = angular.copy(event);
    });

    $scope.$on('$ionicView.leave', function(){
        $scope.model = angular.copy($scope.master);
        $scope.event = null;
        $scope.original = null;
    });

    $scope.$watch('model', function(next, prev, scope){

        var hasChanged = _.filter(next, function(v, i){
            if(!$scope.original){
                return false;
            }

            if(i === 'eventDay'){
                var d = moment(new Date($scope.original[i])).format('MM/DD/YYYY');
                v = moment(new Date(v)).format('MM/DD/YYYY');

                if(v === d){
                    return false;
                }else{
                    return true;
                }
            }

            if(_.isEqual(v,$scope.original[i])){
                return false;
            }else{
                return true;
            }
        }).length;

        if(hasChanged){
            $timeout(function(){
                $scope.$apply(function(){
                    $scope.canSave = true;
                });
            });
        }else{
            $timeout(function(){
                $scope.$apply(function(){
                    $scope.canSave = false;
                });
            });
        }
    }, true);
})

.controller('VenueSocialCtrl', function() {

})

.controller('VenueGraphicsCtrl', function() {

})

.controller('VenueAboutCtrl', function() {

})

.controller('VenueReviewsCtrl', function() {

})

.controller('VenueDealsCtrl', function() {

});
