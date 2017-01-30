'use strict';
var Alexa = require('alexa-sdk');
var https = require('https');


//OPTIONAL: replace with "amzn1.echo-sdk-ams.app.[your-unique-value-here]";
var APP_ID =  "replace me"; 
var SKILL_NAME = 'Antipode';
var GEO_API_KEY = 'replace me';
var URL_PREFIX = 'https://maps.googleapis.com/maps/api/geocode/json?'

var alexa;

var handlers = {
    'LaunchRequest': function (response) {
        this.emit(':tell', "Ask me for the antipode of anywhere on earth!");
    },
    'GetAntipodeIntent': function (response) {
        this.emit('GetAntipode', this.event.request.intent.slots.Location.value, response);
    },
    'GetAntipode': function (location, response) {
        console.log(location);
	    var url = URL_PREFIX + "address=" +location + "&key=" + GEO_API_KEY;
	    console.log(url);
        var that = this;
        var speechOutput;
        getJsonLatLong(location, url, function(speechOutput){
        	that.emit(':tellWithCard',speechOutput, SKILL_NAME, location);
        });
    },
    'AMAZON.HelpIntent': function () {
        var speechOutput = "You can ask me what is underneath a particular location, or, you can say exit... What can I help you with?";
        var reprompt = "What can I help you with?";
        this.emit(':ask', speechOutput, reprompt);
    },
    'AMAZON.CancelIntent': function () {
        this.emit(':tell', 'Goodbye!');
    },
    'AMAZON.StopIntent': function () {
        this.emit(':tell', 'Goodbye!');
    },
}; 

exports.handler = function(event, context, callback) {
    var alexa = Alexa.handler(event, context);
    alexa.APP_ID = APP_ID;
    alexa.registerHandlers(handlers);
    alexa.execute();
};

function getJsonLatLong(location, url, callback){

	var req = https.get(url, function(res) {
	    	var body = '';

	    	res.on('data', function(str){
	    		body += str;
	    	});

	    	res.on('end', function(){
	    		var parsed = JSON.parse(body);
	    		var long;
	    		var lat;
	    		var long_old;
	    		if (parsed.results.length > 0){
	    		    lat = -1*parsed.results[0].geometry.location.lat;
	    		    long_old = parsed.results[0].geometry.location.lng;
	    		}
	    		else{
	    		    callback("I'm sorry but I can't seem to find " + location );
	    		}
	    		
	    		if (long_old > 0)
	    		{
	    		    long = long_old - 180;
	    		}
	    		else {
	    		    long = long_old + 180;
	    		}
    			var url = URL_PREFIX + "latlng=" +lat+","+long + "&key=" + GEO_API_KEY;
    			console.log('url: ', url);
        		var finalLoc = "";
        		https.get(url, function(res) {
        	    	var body = '';
        
        	    	res.on('data', function(str){
        	    		body += str;
        	    	});
        
        	    	res.on('end', function(){
        	    		var parsed = JSON.parse(body);
        	    		var antipode;
        	    		var speechOutput;
        	    		if (parsed.results.length > 1){
        	    		    antipode = parsed.results[parsed.results.length-2].address_components[0].long_name;
        	    			var antipode_country = parsed.results[parsed.results.length-1].address_components[0].long_name;
        	    			finalLoc = antipode + " in " + antipode_country;
	        	    		speechOutput = "The Antipode for " + location + " is: somewhere near " + finalLoc;
	        	    		console.log('final location is', finalLoc);
	        	    		callback(speechOutput);
        	    		}
        	    		if (parsed.results.length == 1){
        	    		    antipode = parsed.results[parsed.results.length-1].address_components[0].long_name;
        	    			finalLoc = antipode;
	        	    		speechOutput = "The Antipode for " + location + " is: somewhere near " + finalLoc;
	        	    		console.log('final location is', finalLoc);
	        	    		callback(speechOutput);
        	    		}
        	    		else{
        	    			callback("The Antipode for " + location + " is not available and probably in the middle of the ocean")
        	    		}
        	    		
        	    	});
        	    });
        	    		//this.emit('GetLocationFromLatLong', lat, long, location);
        	    	}).on('error', function (e) {
        	        console.log("Got error: ", e);
        	        callback("There was an error finding the antipode for " + location + ". Please try another location")
        	    
    	    	});
    	    });
}