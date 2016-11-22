window.app

.constant('API_URL', 'http://api-stage.jound.mx')
.constant('APP_ID', '2d42ca0c-8ca7-40e4-a8f7-b5a09b07a96c')
.constant('JS_KEY', 'f2673746-8a8e-499e-9cfa-3c9194b8ffaa')
.constant('GOOGLE_MAPS_API_URL', 'https://maps.googleapis.com/maps/api/js?key=AIzaSyDlo3eTkN9_-X-z8ps-pcZgAcMKEELdI8s&libraries=places,geometry')
.constant('GOOGLE_MAPS_API_KEY', 'AIzaSyDlo3eTkN9_-X-z8ps-pcZgAcMKEELdI8s')
.constant('PUBNUB_PUBLISH_KEY', 'pub-c-3347ea90-98c9-465f-b5bf-d4ff2751214e')
.constant('PUBNUB_SUBSCRIBE_KEY', 'sub-c-3ced1554-8f72-11e6-bb6b-0619f8945a4f')
.constant('LANGS', ['EN', 'FR', 'IT', 'PT', 'RU'])
.constant('DEFAULT_CENTER', { latitude: 23.634501, longitude: -102.552784 })
.constant('DEFAULT_RADIUS', 1000)
.constant('MINUTES', (function(){
    var x = _.range(0, 60, 15);

    return x.map(function(i){
        return {id: i, name: i < 10 ? '0' + i : i};
    });
})())
.constant('HOURS', (function(){
    var x = _.range(0, 24);

    return x.map(function(i){
        return {id: i, name: i < 10 ? '0' + i : i};
    });
})())
.constant('GEO_DEFAULT_SETTINGS', {
    enableHighAccuracy: true,
    timeout: 5000,
    maximumAge: 0
})
.constant('_', require('lodash'))
.constant('s', require('underscore.string'));
