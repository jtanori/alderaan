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
    		keywordize: function(words, d){
    			var results;
    			try {
    				d = d ? d : ',';
    				results = words.split(d);
    				results = _.chain(results);
    				results = results.invoke('trim').invoke('toLowerCase').uniq().map(good).compact();
                    var nodiactritics = results.map(function(str){return s.cleanDiacritics(str);}).value() || [];

                    results = results.concat(nodiactritics).uniq().value();
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
    				results = results.invoke('trim').invoke('toLowerCase').uniq().map(good).compact();
                    var nodiactritics = results.map(function(str){return s.cleanDiacritics(str);}).value() || [];

                    results = results.concat(nodiactritics).uniq().value();
    			}catch(e){
    				results = [];
    			}finally{
    				return results;
    			}
    		}
    	}
    };
});
