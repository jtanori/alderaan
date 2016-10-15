angular.module('manager.controllers')

.controller('VenuesCtrl', function($rootScope, $scope, $state, $timeout, User, $ionicLoading, $ionicModal, VenueService, VenuesService, CategoriesService, $localStorage, DEFAULT_CENTER, GEO_DEFAULT_SETTINGS, GOOGLE_MAPS_API_URL, NgMap, DEFAULT_RADIUS){
    var _ = require('lodash');
    const dialog = require('electron').remote.dialog;

    if(_.isEmpty($rootScope.user)){
        $state.go('app.home');
        return;
    }

    $scope.googleMapsURL = GOOGLE_MAPS_API_URL;
    $scope.items = [];
    $scope.loading = false;
    $scope.role = $rootScope.user.getHighestRole();
    $scope.map = {
        center: DEFAULT_CENTER,
        zoom: 13,
        searchTypes: ['address'],
        positionMarker: {
            icon: {
                url: 'img/marker_location.png',
                size: [15,15],
                scaledSize: [15,15],
                anchor: [7.5, 7.5]
            }
        }
    };

    $scope.model = {
        q: null,
        category: null,
        position: null,
        radius: DEFAULT_RADIUS
    };

    $scope.marker = {
        coords: DEFAULT_CENTER,
        id: 1,
        options: {
            draggable: true
        }
    };

    $scope.circle = {
        coords: DEFAULT_CENTER,
        id: 1,
        radius: DEFAULT_RADIUS
    };

    $scope.onPositionMarkerPositionChange = function(event){
        var p = this.getPosition();

        $timeout(function(){
            $scope.$apply(function(){
                $scope.circle.coords = {latitude: p.lat(), longitude:p.lng()};
                $scope.model.position = {latitude: p.lat(), longitude:p.lng()};
            });
        });
    };

    $scope.setRadius = function(){
        $scope.model.radius = this.getRadius();
    };

    $scope.showVenue = function(event, venue){
        $scope.currentModel = venue;
    };

    $scope.editVenue = function(e, venue){
        $localStorage.setObject('current-venue', venue.attributes);
        $localStorage.set('current-venue-id', venue.id);
        $localStorage.set('current-venue-option', e);
        var w = window.open('venue.html', "Venue Editor");
    };

    $scope.add = false;

    $scope.submit = function(){
        $ionicLoading.show({template: '<ion-spinner></ion-spinner><br/>Searching...'});
        var q = '';
        var c = '';

        if(!_.isEmpty($scope.model.q)){
            q = $scope.model.q.split(' ').toString();
        }

        if(!_.isEmpty($scope.model.category)){
            c = $scope.model.category;
        }

        VenuesService
            .search($scope.model.position, $scope.model.radius, q, c)
            .then(function(results){
                $timeout(function(){
                    $scope.$apply(function(){
                        $scope.items = results;
                    });
                });
            }, function(e){
                console.log(e, 'e');
            })
            .finally(function(){
                $ionicLoading.hide();
            });

    };

    var load = function(){
        $ionicLoading.show({template: '<ion-spinner></ion-spinner><br>Loading Venues...'});
        $scope.loading = true;
        $scope.error = null;

        VenueService
            .fetch()
            .then(function(response){
                $timeout(function(){
                    $scope.$apply(function(){
                        if(!_.isEmpty(response)){
                            $scope.items = response;
                        }else{
                            $scope.error = 'No venues found';
                        }
                    });
                });
            }, function(e){
                $timeout(function(){
                    $scope.$apply(function(){
                        $scope.error = e.message;
                    });
                });
            })
            .finally(function(){
                $timeout(function(){
                    $scope.$apply(function(){
                        $ionicLoading.hide();
                        $scope.loading = false;
                    });
                });
            });
    };

    var onMap = function(id){
        NgMap.getMap({id: id}).then(function(map) {
            $scope.map.control = map;
            $scope.getPosition();
        });
    };

    $scope.placeChanged = function () {
        var location = this.getPlace().geometry.location;

        $scope.map.control.setCenter(location);
        $scope.marker.coords = {latitude: location.lat(), longitude: location.lng()};

    };

    $scope.getPosition = function(){
        navigator.geolocation.getCurrentPosition($scope.onPosition, $scope.onPositionError, GEO_DEFAULT_SETTINGS);
    };

    $scope.onPosition = function(pos){
        var crd = pos.coords;

        $timeout(function(){
            $scope.$apply(function(){
                $scope.map.center = {latitude: crd.latitude, longitude: crd.longitude};
                $scope.marker.coords = {latitude: crd.latitude, longitude: crd.longitude};
                $scope.map.zoom = 12;

                $scope.map.control.setCenter(new google.maps.LatLng(crd.latitude, crd.longitude));
            });
        });
    };

    $scope.onPositionError = function(e){
        dialog.showErrorBox('Error', e.message);
    };

    $scope.openModal = function(){
        $scope.model = angular.copy($scope.venueMaster);

        if(!$scope.newVenueModal){
            $ionicModal.fromTemplateUrl('templates/venues/new-modal.html', {
                scope: $scope,
                animation: 'slide-in-up'
            }).then(function(modal) {
                $scope.newVenueModal = modal;
                $scope.newVenueModal.show();

                onMap('venue-new-map');
            });
        }else{
            $scope.newVenueModal.show();
            onMap('venue-new-map');
        }
    };

    $scope.closeModal = function(){
        if($scope.newVenueModal && $scope.newVenueModal.isShown()){
            $scope.newVenueModal.hide();
        }
    };

    $scope.$on('$ionicView.enter', function(){
        switch($scope.role.name.toLowerCase()){
        case 'superadmin':
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
            onMap('venue-search-map');
        default:
            load();
        }
    });
});
