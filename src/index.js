'use strict';
var Alexa = require('alexa-sdk');
var https = require('https');


//OPTIONAL: replace with "amzn1.echo-sdk-ams.app.[your-unique-value-here]";
var APP_ID =  "Replace Me"; 
var SKILL_NAME = 'Antipode';
var GEO_API_KEY = 'Replace Me';
var URL_PREFIX = 'https://maps.googleapis.com/maps/api/geocode/json?'

var alexa;

var handlers = {
    'LaunchRequest': function (response) {
        var reprompt = 'Ask me for the antipode of anywhere on earth!';
        this.emit(':ask', 'I am Antipode Finder...Ask me for the antipode of anywhere on earth!', reprompt);
    },
    'SessionEndedRequest': function (response){
        console.log("exiting");
    },
    'GetAntipodeIntent': function (response) {
        this.emit('GetAntipode', this.event.request.intent.slots.Location.value, response);
    },
    'GetAntipode': function (location, response) {
        console.log(location);
	    var url = URL_PREFIX + "address=" +location + "&key=" + GEO_API_KEY;
	    console.log(url);
        var that = this;
        var finalloc;
        var speechOutput;
        getJsonLatLong(location, url, function(finalloc){
            if (finalloc == "none")
            {
                speechOutput = "The Antipode for " + location + " is not on any known land mass. Keep swimming, and please try another location!";
                that.emit(':tellWithCard',speechOutput, SKILL_NAME, speechOutput);
            }
            else if (finalloc == "noloc")
            {
                speechOutput = "Sorry, I wasn't able to find " + location + " on the map. Please try another location!";
                that.emit(':tellWithCard',speechOutput, SKILL_NAME, speechOutput);
            }
            else
            {
                speechOutput = "The Antipode for " + location + " is: somewhere near " + finalloc;
                that.emit(':tellWithCard',speechOutput, SKILL_NAME, speechOutput)
            }
        	
        });
    },
    'AMAZON.HelpIntent': function () {
        var speechOutput = "You can ask me what is the antipode for a particular location, or, you can say exit... What can I help you with?";
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
	    		    callback("noloc");
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
	        	    		callback(finalLoc);
        	    		}
        	    		if (parsed.results.length == 1){
        	    		    antipode = parsed.results[parsed.results.length-1].address_components[0].long_name;
        	    			finalLoc = antipode;
	        	    		speechOutput = "The Antipode for " + location + " is: somewhere near " + finalLoc;
	        	    		console.log('final location is', finalLoc);
	        	    		callback(finalLoc);
        	    		}
        	    		else{
        	    			callback("none");
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