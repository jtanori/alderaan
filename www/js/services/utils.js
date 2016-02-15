angular.module('manager.services')

.factory('UtilsService', function(){
    'use strict';

    var _ = require('lodash');
    var s = require('underscore.string');

    var nobueno = [
    	'S.A',
    	'SA',
    	'Sa',
    	'sA',
    	's.a',
    	'S.A.',
    	's.A.',
    	's.a.',
    	'S.a.',
    	'C.V',
    	'c.v',
    	'C.v',
    	'c.V',
    	'C.V.',
    	'C.v.',
    	'c.v.',
    	'c.V.',
    	'CV',
    	'Cv',
    	'cV',
    	'de',
    	'DE',
    	'DEL',
    	'del',
    	'Del',
    	'DeL',
    	'DEl',
    	'deL',
    	'dEL',
    	'dEl',
        'bcs',
        'por',
        'menor',
        'comercio',
        'excepto',
        'sin',
        'nombre',
        'venta',
        'compra',
        'para',
        'otra'
    ];

    var good = function(r){
    	r = r.toLowerCase();
    	var n = !_.isNaN(r*1);
    	if( (_.indexOf(nobueno, r) === -1) && (r.length > 2) && !n){
    		return r;
    	}
    	return false;
    };

    return {
    	strings: {
    		good: good,
    		keywordize: function(s, d){
    			var results;
    			try {
    				d = d ? d : ',';
    				results = s.split(d);
                    var nodiactritics = results.map(function(str){return s.cleanDiacritics(str);}) || [];
                    results = results.concat(nodiactritics);
    				results = _.chain(results);
    				results = results.invoke('trim').invoke('toLowerCase').uniq().map(good).compact().value();
    			}catch(e){
    				results = [];
    			}finally{
    				return results;
    			}
    		},
    		sanitize: function(words){
    			var results;
    			try{
    				results = _.chain(words);
                    var nodiactritics = results.map(function(str){return s.cleanDiacritics(str);}) || [];
                    results = results.concat(nodiactritics);
    				results = results.invoke('trim').invoke('toLowerCase').uniq().map(good).compact().value();
    			}catch(e){
    				results = [];
    			}finally{
    				return results;
    			}
    		}
    	}
    };
});
