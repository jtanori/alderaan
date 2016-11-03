angular.module('manager.services')

.factory('VenueService', function(UtilsService, $q, $http, API_URL, $rootScope){
    'use strict';

    var _ = require('lodash');
    var s = require('underscore.string');
    var Category = Parse.Object.extend('Category');

    var toCoords = function(v){
        if(_.isNumber(v)){
            return v;
        }
        if(_.isString(v)){
            return v.replace(",", '.')*1;
        }

        return null;
    };

    var parseVenue = function(venue, attributes){
        //Check if the thing is valid at all, no name, no position, no fucking record.
        if(venue.latitud && venue.longitud){
            venue.latitude = toCoords(venue.latitud);
            venue.longitude = toCoords(venue.longitud);
            delete venue.latitud;
            delete venue.longitud;
        }else if(_.isString(venue.latitude) || _.isString(venue.longitude)){
            venue.latitude = toCoords(venue.latitude);
            venue.longitude = toCoords(venue.longitude);
        }

        if(_.isNumber(venue.latitude) && _.isNumber(venue.longitude)){
            if(venue.id){venue.deneueId = venue.id+""; delete venue.id;}//Remove source id (legacy)
            if(_.isNumber(venue.postal_code)){venue.postal_code = venue.postal_code+"";}
            if(_.isNumber(venue.phone_number)){venue.phone_number = venue.phone_number+"";}
            if(_.isNumber(venue.exterior_number)){venue.exterior_number = venue.exterior_number+"";}
            if(_.isNumber(venue.activity_type)){venue.activity_type = venue.activity_type+"";}
            if(_.isNumber(venue.road_name)){venue.road_name = venue.road_name+"";}
            if(_.isNumber(venue.road_name_1)){venue.road_name_1 = venue.road_name_1+"";}//It may happen that PapaParse converts a name such as 43 or 13 to number (logically)
            if(_.isNumber(venue.road_name_2)){venue.road_name_2 = venue.road_name_2+"";}
            if(_.isNumber(venue.road_name_3)){venue.road_name_3 = venue.road_name_3+"";}
            if(_.isNumber(venue.basic_geostatistical_area)){venue.basic_geostatistical_area = venue.basic_geostatistical_area+"";}
            if(_.isNumber(venue.shopping_center_store_number)){venue.shopping_center_store_number = venue.shopping_center_store_number+"";}
            if(_.isNumber(venue.building)){venue.building = venue.building+"";}
            if(_.isNumber(venue.exterior_letter)){venue.exterior_letter = venue.exterior_letter+"";}
            if(_.isNumber(venue.internal_number)){venue.internal_number = venue.internal_number+"";}
            if(_.isNumber(venue.internal_letter)){venue.internal_letter = venue.internal_letter+"";}
            if(_.isNumber(venue.settling_name)){venue.settling_name = venue.settling_name+"";}

            venue.name = s(venue.name).titleize().value();
            venue.slug = s(venue.name).slugify().value();
            venue.vecinity_type = s(venue.vecinity_type).titleize().value();
            venue.settling_type = s(venue.settling_type).titleize().value();
            venue.settling_name = s(venue.settling_name).titleize().value();
            venue.facility_type = s(venue.facility_type).titleize().value();
            venue.email_address = s(venue.email_address).toLowerCase().value();
            venue.road_type = s(venue.road_type).titleize().value();
            venue.road_type_1 = s(venue.road_type_1).titleize().value();
            venue.road_type_2 = s(venue.road_type_2).titleize().value();
            venue.road_type_3 = s(venue.road_type_3).titleize().value();
            venue.road_name = s(venue.road_name).titleize().value();
            venue.road_name_1 = s(venue.road_name_1).titleize().value();
            venue.road_name_2 = s(venue.road_name_2).titleize().value();
            venue.road_name_3 = s(venue.road_name_3).titleize().value();
            venue.locality = s(venue.locality).titleize().value();
            venue.municipality = s(venue.municipality).titleize().value();
            venue.federal_entity = s(venue.federal_entity).titleize().value();

            //Cleanup after
            _.each(venue, function(v, k){
                if(_.isString(v)){
                    venue[k] = v.trim();
                }

                if(_.isNumber(v)){
                    return;
                }

                if(_.isEmpty(v)){
                    delete venue[k];
                }
            });

            venue.full_address = '';

            if(!_.isEmpty(venue.road_type)){
                venue.full_address = venue.road_type + ' ' + venue.road_name;

                if(!_.isEmpty(venue.road_type_1)){
                    venue.full_address += ' y ' + venue.road_type_1 + ' ' + venue.road_name_1;
                }
                if(!_.isEmpty(venue.road_type_2)){
                    venue.full_address += ' entre ' + venue.road_type_2 + ' ' + venue.road_name_2;
                }
                if(!_.isEmpty(venue.road_type_3)){
                    venue.full_address += ' y  ' + venue.road_type_3 + ' ' + venue.road_name_3;
                }
            }

            if(_.isEmpty(venue.keywords)){
                venue.keywords = [];
            }else if(_.isString(venue.keywords)){
                venue.keywords = UtilsService.strings.keywordize(venue.keywords);
            }

            //Publish by default
            venue.online = true;
            //Add name keywords
            var keywords = venue.name.split(" ") + ',' + venue.activity_description.split(' ');
            keywords = _.chain(keywords.split(',')).compact().invoke('toLowerCase').invoke('trim').concat(UtilsService.strings.keywordize(venue.name, ' ')).uniq().value();
            keywords = UtilsService.strings.sanitize(keywords);

            venue.keywords = venue.keywords.concat(keywords);
            venue.keywords = _.uniq(venue.keywords);
            //Extend with custom attributes
            venue = _.extend(venue, attributes);
            return venue;
        } else {
            return null;
        }
    };

    var fetch = function(){
        var defer = $q.defer();

        $http
            .get(API_URL + '/manager/venues')
            .then(function(c){
                if(!_.isEmpty(c)){
                    defer.resolve(c.data);
                }else{
                    defer.reject({message: 'No venues found', code: 404});
                }
            }, function(e){
                defer.reject(e);
            });

        return defer.promise;
    };

    var batchImport = function(items, category){
        var defer = $q.defer();
        var requests = [];
        if(category && items && $rootScope.user.is('SuperAdmin') || $rootScope.user.is('Admin')){
            if(items.length > 200) {
              items = _.chunk(items, 200);
              requests = items.map(function(i) {
                return $http.post(API_URL + '/manager/venues/import', {category: category, items: i});
              });
            } else {
              requests.push($http.post(API_URL + '/manager/venues/import', {category: category, items: items}));
            }

            $q
              .all(requests)
              .then(function(c){
                  if(!_.isEmpty(c)){
                    console.log(c, 'c');
                      defer.resolve(c.data);
                  }else{
                      defer.reject({message: 'No venues imported', code: 404});
                  }
              }, function(e){
                  defer.reject(e);
              });
        }else{
            $q.reject({message: 'Please provide all the details needed for import\nYou need to be a privileged user, set a category and pass a set of items to import.'});
        }

        return defer.promise;
    };

    return {
    	parse: parseVenue,
      fetch: fetch,
      import: batchImport
    };
})

.factory('VenueModel', function(API_URL){

    function Factory() {
        this.create = function (data) {

            var venue = {
                get: function(v){
                    if(this.attributes && this.attributes[v]){
                        return this.attributes[v];
                    }
                },
                getURL: function(){
                    return API_URL + '/venues/' + this.id;
                },
                getWWW: function(){
                    if(this.get('www')){
                        return this.get('www').replace(/^(https?|ftp):\/\//, '');
                    }
                },
                getAddress: function(){
                    var address = '';
                    var n = this.get('exterior_number');
                    var castedN = parseInt(n, 10);

                    if(!_.isEmpty(this.get('road_type'))){
                        address += _.escape(this.get('road_type')) + ' ' + _.escape(this.get('road_name'));
                    }

                    if(!_.isEmpty(this.get('road_type_1'))){
                        address += ' entre ' + _.escape(this.get('road_type_1')) + ' ' + _.escape(this.get('road_name_1'));
                    }

                    if(!_.isEmpty(this.get('road_type_2'))){
                        address += ' y ' + _.escape(this.get('road_type_2')) + ' ' + _.escape(this.get('road_name_2'));
                    }

                    if(n){
                        if(!_.isNaN(castedN) && _.isNumber(castedN)){
                            address += ' #' + _.escape(n);
                        }else if(!_.isString(n)){
                            if(n === 'SN' || n === 'sn'){
                                address += ' Sin numero';
                            }else {
                                address += ' #' + _.escape(n);
                            }
                        }
                    }

                    return address;
                },
                getVecinity: function(){
                    var address = '';

                    if(this.get('settling_type') && this.get('settling_name')){
                        address += this.get('settling_type') + ' ' + this.get('settling_name');
                    }else if(this.get('settling_name')){
                        address += 'Colonia ' + this.get('settling_name');
                    }

                    return address;
                },
                getCityName: function(){
                    var city = '';
                    var l = this.get('locality');
                    var m = this.get('municipality');

                    if(!_.isEmpty(l)){
                        city = l;
                    }else{
                        city = m;
                    }

                    return city;
                },
                getCity: function(){
                    var city = '';
                    var l = this.get('locality');
                    var m = this.get('municipality');
                    var s = this.get('federal_entity');

                    if(l === m){
                        city += l + ', ' + s;
                    }else {
                        city += l + ', ' + m + ', ' + s;
                    }

                    if(this.get('postal_code')){
                        city += ' C.P ' + _.escape(this.get('postal_code'));
                    }

                    return city;
                },
                getCover: function(){
                    var l = this.get('cover');

                    if(l && l.file){
                        return {url: l.file.url, isDefault: false};
                    }else {
                        return {url:'img/splash.jpg', isDefault: true};
                    }
                },
                getLogo: function(){
                    var l;

                    try {
                        l = this.get('logo').file ? this.get('logo').file : this.get('logo').get('file');

                        if(l.url){
                            return {url: l.url(), isDefault: false};
                        }else if(l._url){
                            return {url: l._url, isDefault: false};
                        }
                    }catch(e){
                        return {url:'img/venue_default_large.jpg', isDefault: true};
                    }
                },
                getHashTags: function(){
                    var keywords = this.get('keywords').map(function(h){
                        if(h[0] === '#' || h[0] === '@'){
                            return h;
                        }else{
                            return '#' + h;
                        }
                    });

                    return keywords;
                },
                getTwitterHashtags: function(){
                    var tags = this.getHashTags();

                    if(tags.length >= 5){
                        tags.splice(5, tags.length - 1);
                    }

                    return tags;
                },
                getImages: function(){
                    var images = this.get('images') || [];

                    if(!_.isEmpty(images)){
                        images = images.map(function(i){return {url:i};});
                    }

                    return images;
                },
                getBasicData: function(){
                    return {
                        name: this.get('name'),
                        address: this.getAddress(),
                        city: this.getCity(),
                        vecinity: this.getVecinity(),
                        phoneNumber: this.get('phone_number'),
                        url: this.get('www'),
                        activity: this.get('activity_description'),
                        logo: this.getLogo(),
                        cover: this.getCover(),
                        email: this.get('email_address'),
                        www: this.getWWW()
                    };
                }
            };

            venue.attributes = data;
            venue.id = data.objectId;

            return venue;
        }
    };

    return Factory;
})

.factory('VenuesService', function($q, $http, $rootScope, VenueModel/*, SanitizeService, AppConfig*/, User/*, Facebook*/, API_URL) {

    var _currentResults = [];
    var _currentFeaturedResults = [];
    var _currentVenue;
    var Venue = new VenueModel();

    var global = {
        search: function(p, r, q, c, excludedVenues){
            var deferred = $q.defer();

            if(!p || !r){
                deferred.reject({message: 'VenuesService.search requires at least two arguments', code: 101});
            }

            var qs = 'lat=' + p.latitude + '&lng=' + p.longitude;

            if(q){
                qs += '&q=' + q;
            }

            if(c){
                qs += '&category=' + c;
            }

            if(r){
                qs += '&radius=' + r;
            }

            $http
                .get(API_URL + '/search?' + qs )
                .then(function(c){
                    if(!_.isEmpty(c)){
                        c.data.results = c.data.results.map(function(v){
                            return Venue.create(v);
                        });

                        deferred.resolve(c.data.results);
                    }else{
                        deferred.reject({message: 'No encontramos resultados, intenta buscar en un rango mas amplio.', keywords: q, code: 404});
                    }
                }, function(e){
                    deferred.reject({message: e.message, code: e.code});
                });

            /*



            var query = new Parse.Query(VenueModel);
            var category;
            var geoPoint = new Parse.GeoPoint({latitude: p.coords.latitude, longitude: p.coords.longitude});

            if(q){
                q = q.split(' ');
                q = _.chain(q).compact().uniq().invoke('trim').invoke('toLowerCase').value();

                if(q.length === 1){
                    q = q[0].toLowerCase();
                    query.equalTo('keywords', q);
                }else if(q.length > 1){
                    q = SanitizeService.strings.sanitize(q);
                    query.containsAll('keywords', q);
                }
            }

            if(c && c !== 'all'){
                category = new CategoryModel();
                category.id = c;
                query.equalTo('category', category);
            }

            if(!_.isEmpty(excludedVenues)){
                query.notContainedIn('objectId', excludedVenues || []);
            }

            //Search near current position
            query
                .select(AppConfig.QUERY.VENUE_DEFAULT_FIELDS)
                .near('position', geoPoint)
                .withinKilometers('position', geoPoint, r/1000)
                .include(['logo', 'cover', 'page', 'claimed_by'])
                .limit(200)
                .find()
                .then(
                    function(results){
                        if(results.length){
                            //Remove duplicates
                            results = _.uniq(results, true, function(r){
                                return r.get('name') + '-' + r.get('position').latitude + '-' + r.get('position').longitude;
                            });

                            _currentResults = results;
                            deferred.resolve(results, q);
                        }else{
                            deferred.reject({message: 'No encontramos resultados, intenta buscar en un rango mas amplio.', keywords: q, code: 404});
                        }
                    }, function(e){
                        deferred.reject(e);
                    }
                );*/

            return deferred.promise;
        },
        getFeatured: function(p, r, c, excludedVenues){
            var deferred = $q.defer();

            if(!p || !r){
                deferred.reject({message: 'VenuesService.getFeatured requires at least two arguments', code: 101});
            }

            var query = new Parse.Query(VenueModel);
            var geoPoint = new Parse.GeoPoint({latitude: p.coords.latitude, longitude: p.coords.longitude});
            var Category = Parse.Object.extend('Category');

            if(c){
                query.equalTo('category', new Category({id: c}));
            }

            //Search near current position
            Parse.Config
                .get()
                .then(function(c){
                    var r = {
                        limit: c.get('defaultFeaturedLimit') || 50,
                        radius: c.get('defaultFeaturedRadius') || $rootScope.settings.searchRadius
                    };

                    if(!_.isEmpty(excludedVenues)){
                        query.notContainedIn('objectId', excludedVenues || []);
                    }

                    query
                        .select(AppConfig.QUERY.VENUE_DEFAULT_FIELDS)
                        .near('position', geoPoint)
                        .withinKilometers('position', geoPoint, r.radius/1000)
                        .include(['logo', 'cover', 'page', 'claimed_by'])
                        .equalTo('featured', true)
                        .limit(r.limit)
                        .find()
                        .then(
                            function(results){
                                if(results.length){
                                    _currentResults = results;
                                    deferred.resolve(results);
                                }else{
                                    deferred.reject({message: 'No encontramos resultados, intenta buscar en un rango mas amplio.'});
                                }
                            }, function(e){
                                deferred.reject(e);
                            }
                        );
                }, function(e){
                    deferred.reject(e);
                });

            return deferred.promise;
        },
        getById: function(id){
            var deferred = $q.defer();

            $http
                .get(API_URL + '/manager/venues/' + id)
                .then(function(response){
                    deferred.resolve(Venue.create(response.data[0]));
                }, function(response){
                    deferred.reject(response);
                });

            return deferred.promise;
        },
        getProductById: function(venueId, productId){
            var deferred = $q.defer();

            if(!_.isEmpty(_currentVenue) && _currentVenue.id === venueId){
                $http
                    .get(API_URL + '/venues/' + venueId + '/products/' + productId)
                    .then(function(response){
                        if(response && response.data && response.data.product){
                            deferred.resolve({venue: _currentVenue, product: response.data.product});
                        }else{
                            deferred.reject({message: 'Product not found', code: 404});
                        }
                    }, function(response){
                        deferred.reject(response);
                    });
            }else if(!_.isEmpty(venueId) && !_.isEmpty(productId)){
                $http
                    .post(API_URL + '/getProductForVenue', {id: productId, venue: venueId})
                    .then(function(response){
                        if(response && response.data && response.data.venue && response.data.product){
                            deferred.resolve({venue: response.data.venue, product: response.data.product});
                        }else{
                            deferred.reject({message: 'Product not found', code: 404});
                        }
                    }, function(response){
                        deferred.reject(response);
                    });
            } else{
                deferred.reject({message: 'Product not found', code: 404});
            }

            return deferred.promise;
        },
        convertToParseObject: function(venue){
            var v = Venue.create(venue);

            return v;
        },
        getChannel: function(config){
            var deferred = $q.defer();

            if(!config){
                deferred.reject({message: 'No channel config provided'});
            } else {

                if(config.type === 'facebook'){
                    Facebook
                        .getLoginStatus(function(response){
                            if(response && response.status === 'connected'){
                                config.accessToken = response.authResponse.accessToken;

                                $http
                                    .post(API_URL + '/getChannelForVenue', config)
                                    .then(function(response){
                                        deferred.resolve(response.data);
                                    }, function(e){
                                        deferred.reject(e);
                                    });
                            }else{
                                Facebook
                                    .login(function(response){
                                        if(response && !_.isEmpty(response.accessToken)){
                                            config.accessToken = response.authResponse.accessToken;

                                            $http
                                                .post(API_URL+ '/getChannelForVenue', config)
                                                .then(function(response){
                                                    deferred.resolve(response.data);
                                                }, function(e){
                                                    deferred.reject(e);
                                                });
                                        }else{
                                            deferred.reject({message: 'Fallo la autorizacion'});
                                        }
                                    }, function(e){
                                        deferred.reject(e);
                                    });
                            }
                        }, function(e){
                            deferred.reject(e);
                        });
                }else{
                    $http
                        .post(API_URL + '/getChannelForVenue', config)
                        .then(function(response){
                            deferred.resolve(response.data);
                        }, function(response){
                            deferred.reject(response);
                        });
                }
            }

            return deferred.promise;
        },
        getProductsForVenue: function(venueId, skip){
            var deferred = $q.defer();
            var config = {id: venueId};

            if(skip && _.isNumber(skip) && skip > 0){
                config.skip = skip;
            }

            $http
                .get(API_URL + '/venues/' + venueId + '/products', config)
                .then(function(response){
                    deferred.resolve(response.data.results);
                }, function(response){
                    deferred.reject(response);
                });

            return deferred.promise;
        },
        getReviewsForVenue: function(venueId, skip, pageSize, sinceDate, maxDate){
            var deferred = $q.defer();
            var config = {id: venueId};

            if(skip && _.isNumber(skip) && skip > 0){
                config.skip = skip;
            }

            if(pageSize && _.isNumber(pageSize)){
                config.pageSize = pageSize;
            }

            if(sinceDate){
                config.sinceDate = sinceDate;
                config.skip = 0;
            }

            if(maxDate){
                config.maxDate = maxDate;
                config.skip = 0;
            }

            $http
                .post(API_URL + '/getReviewsForVenue', config)
                .then(function(response){
                    deferred.resolve(response.data.results);
                }, function(response){
                    deferred.reject(response);
                });

            return deferred.promise;
        },
        getDealsForVenue: function(venueId, skip){
            var deferred = $q.defer();
            var config = {id: venueId};

            if(skip && _.isNumber(skip) && skip > 0){
                config.skip = skip;
            }

            $http
                .post(API_URL + '/getDealsForVenue', config)
                .then(function(response){
                    deferred.resolve(response.data.results);
                }, function(response){
                    deferred.reject(response);
                });

            return deferred.promise;
        },
        getEventsForVenue: function(venueId, skip){
            var deferred = $q.defer();
            var config = {id: venueId};

            if(skip && _.isNumber(skip) && skip > 0){
                skip = '?skip=' + skip;
            }else{
                skip = '';
            }

            $http
                .get(API_URL + '/venues/'+ venueId + '/events' + skip)
                .then(function(response){
                    deferred.resolve(response.data.results);
                }, function(response){
                    deferred.reject(response.data.error);
                });

            return deferred.promise;
        },
        addEvent: function(venueId, data){
            var deferred = $q.defer();

            if(venueId && data){
                $http
                    .post(API_URL + '/manager/venues/'+ venueId + '/events', {data: data})
                    .then(function(response){
                        deferred.resolve(response.data.results);
                    }, function(response){
                        deferred.reject(response.data.error || response.data);
                    });
            }else{
                deferred.reject({message: 'An error has ocurred, please try again or contact customer support.'});
            }

            return deferred.promise;
        },
        saveReview: function(id, text, userId, rating){
            var deferred = $q.defer();
            var config = {id: id, text: text, rating: rating, userId: userId};

            if(_.isEmpty(id)) {
                deferred.reject('No venue ID provided');
            }else if(_.isEmpty(text)) {
                deferred.reject('No review to post provided');
            }else if(_.isEmpty(userId)) {
                deferred.reject('No user ID provided');
            }else {
                $http
                    .post(API_URL + '/saveReviewForVenue', config)
                    .then(function(response){
                        deferred.resolve(response.data.results);
                    }, function(response){
                        deferred.reject(response);
                    });
            }

            return deferred.promise;
        },
        updatePage: function(id, attr, val){
            var deferred = $q.defer();

            if(_.isEmpty(attr)) {
                deferred.reject('Please provide an attribute to update');
            }else if(_.isEmpty(id)) {
                deferred.reject('Please provide a page id');
            }else {
                $http
                    .post(API_URL + '/updatePage', {id: id, attr: attr, val: val})
                    .then(function(response){
                        deferred.resolve(response.data.results);
                    }, function(response){
                        deferred.reject(response);
                    });
            }

            return deferred.promise;
        },
        current: function(venue){
            if(venue){
                _currentVenue = venue;
            }

            return _currentVenue;
        },
        claim: function(id, details){
            var deferred = $q.defer();

            if(_.isEmpty(details)) {
                deferred.reject('Please provide details object.');
            }else if(_.isEmpty(User.current())) {
                deferred.reject('Please login to claim a business');
            }else {
                $http
                    .post(API_URL + '/venues/' + id + '/claim', {id: id, userId: User.current().id, details: details})
                    .then(function(response){
                        deferred.resolve(response.data.results);
                    }, function(response){
                        deferred.reject(response);
                    });
            }

            return deferred.promise;
        },
        isClaimed: function(id){
            var deferred = $q.defer();

            if(_.isEmpty(id)) {
                deferred.reject('Please provide a venue id.');
            }else {
                $http
                    .get(API_URL + '/venues/' + id + '/claimed')
                    .then(function(response){
                        deferred.resolve(response.data.results);
                    }, function(response){
                        deferred.reject(response);
                    });
            }

            return deferred.promise;
        },
        report: function(id, details, problemType){
            //Fix this for web
            var device = $cordovaDevice.getDevice();
            var cordova = $cordovaDevice.getCordova();
            var model = $cordovaDevice.getModel();
            var platform = $cordovaDevice.getPlatform();
            var uuid = $cordovaDevice.getUUID();
            var version = $cordovaDevice.getVersion();
            var userId = User.current().id;
            var parseVersion = Parse.VERSION;
            var deferred = $q.defer();

            if(_.isEmpty(id)) {
                deferred.reject('Please provide a venue id.');
            }else {
                $http
                    .post(API_URL + '/venues/' + id + '/report', {
                        id: id,
                        userId: User.current().id,
                        device: device,
                        cordova: cordova,
                        model: model,
                        platform: platform,
                        uuid: uuid,
                        version: version,
                        parseVersion: parseVersion,
                        details: details,
                        problemType: problemType
                    })
                    .then(function(response){
                        deferred.resolve(response.data.results);
                    }, function(response){
                        deferred.reject(response);
                    });
            }

            return deferred.promise;
        },
        new: function(p, name, phone, image, isOwner){
            var deferred = $q.defer();
            var File = Parse.Object.extend('File');
            var P = Parse.Object.extend('Page');
            var F,file, f;
            var save = function(savedFile){
                var config = {
                    position: p,
                    name: name,
                    phone: phone,
                    userId: User.current().id
                };

                if(isOwner){
                    config.owner = true;
                }

                if(savedFile && savedFile.id){
                    config.imageId = savedFile.id;
                }

                plugin.google.maps.Geocoder.geocode({position: p}, function(results) {
                    if (results.length) {
                        config.address = results[0];
                    }

                    $http
                        .post(API_URL + '/newVenue', config)
                        .then(function(response){
                            var v = new VenueModel();

                            v.set(response.data.venue);

                            deferred.resolve(v);
                        }, function(response){
                            deferred.reject(response);
                        });
                });


            };

            if(_.isEmpty(p) || _.isEmpty(name) || _.isEmpty(phone)) {
                deferred.reject('Please provide a position, name and phone number.');
            }else {
                if(image){
                    F = new Parse.File('front-image', {base64: image});
                    F
                        .save()
                        .then(function(savedFile){
                            f = new File({file: savedFile});
                            f
                                .save()
                                .then(function(){
                                    save(f);
                                }, function(e){
                                    deferred.reject(e);
                                });
                        }, function(e){
                            deferred.reject(e);
                        });

                }else{
                    save();
                }
            }

            return deferred.promise;
        },

        getAddressComponents: function(p){
            var deferred = $q.defer();

            $http
                .post(API_URL + '/address', {
                    extended: true,
                    latitude: p.lat,
                    longitude: p.lng
                })
                .then(function(response){
                    deferred.resolve(response.data.results);
                }, function(response){
                    deferred.reject(response.data.error);
                });

            return deferred.promise;
        },

        savePhotoForVenue: function(data, id){
            var deferred = $q.defer();

            $http
                .post(API_URL + '/savePhotoForVenue', {
                    id: id,
                    data: data
                })
                .then(function(response){
                    deferred.resolve(response.data.url);
                }, function(response){
                    deferred.reject(response.data.error);
                });

            return deferred.promise;
        },

        getEventById: function(eventId){
            var deferred = $q.defer();

            $http
                .post(API_URL + '/getEventById', {
                    id: eventId
                })
                .then(function(response){
                    deferred.resolve(response.data);
                }, function(response){
                    deferred.reject(response.data.error);
                });

            return deferred.promise;
        },

        importEvents: function(id, data){
            var deferred = $q.defer();

            $http
                .post(API_URL + '/manager/venues/' + id + '/events/import', {
                    items: data
                })
                .then(function(response){
                    deferred.resolve(response.data);
                }, function(response){
                    if(_.isEmpty(response) || _.isEmpty(response.data) || _.isEmpty(response.data.error)){
                        var error = {message: 'Unknown error'};
                    }else{
                        var error = response.data.error;
                    }

                    deferred.reject(error);
                });

            return deferred.promise;
        },

        update: function(id, data){
            var deferred = $q.defer();

            $http
                .put(API_URL + '/manager/venues/' + id, {
                    data: data
                })
                .then(function(response){
                    deferred.resolve(Venue.create(response.data));
                }, function(response){
                    if(_.isEmpty(response) || _.isEmpty(response.data) || _.isEmpty(response.data.error)){
                        var error = {message: 'Unknown error'};
                    }else{
                        var error = response.data.error;
                    }

                    deferred.reject(error);
                });

            return deferred.promise;
        }
    };

    return global;
});
