angular.module('manager.services')

.factory('VenueService', function(UtilsService){
    'use strict';

    var _ = require('lodash');
    var s = require('underscore.string');

    var parseVenue = function(venue, attributes){
        //Check if the thing is valid at all, no name, no position, no fucking record.
        if(_.isNumber(venue.latitud) && _.isNumber(venue.longitud)){
            //Mea culpa, didn't fix all headers on the CSV files
            if(venue.latitud){venue.latitude = parseFloat(venue.latitud, 10); delete venue.latitud;}//Fix spanish name for lat/lng
            if(venue.longitud){venue.longitude = parseFloat(venue.longitud, 10); delete venue.longitud;}
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

            //Publish by default
            venue.online = true;
            //Set category object
            //venue.category = category;

            //Save historycal data
            //var user = new Parse.User();
            //user.id = sess.user.objectId;

            //venue.createdBy = user;
            //Add name keywords
            venue.keywords = venue.name.split(" ") + ',' + venue.activity_description.split(' ');
            venue.keywords = _.chain(venue.keywords.split(',')).compact().invoke('toLowerCase').invoke('trim').concat(UtilsService.strings.keywordize(venue.name, ' ')).uniq().value();
            venue.keywords = UtilsService.strings.sanitize(venue.keywords);
            //Extend with custom attributes
            venue = _.extend(venue, attributes);
            //venue.position = new Parse.GeoPoint({latitude: venue.latitude, longitude: venue.longitude});
            //venue.updateHistory = [{op: 'created', timestamp: (new Date())*1, by: sess.user.objectId}];
            //Add name to object object for latter save
            //venueObject = new LocationModel(venue);
            //venueObject.setACL(ACL);
            //Push to venues object
            //objects.push(venueObject);
            return venue;
        } else {
            return null;
        }
    };

    return {
    	parse: parseVenue
    };
});
