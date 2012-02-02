var scoreboard = require('../lib/scoreboard')
var Score = scoreboard.Score;

scoreboard.redis.createClient = function() {
	var client;
	var rtg = require("url").parse("redis://redistogo:405db77262deacef6bedb3fc3c507dc6@barreleye.redistogo.com:9141/");
	client = require("redis").createClient(rtg.port, rtg.hostname);
	client.auth(rtg.auth.split(":")[1]);
	client.on("error", function (err) {
    console.log("Error " + err);
	});

	return client;
};

var score = new Score();


//var keys = scoreboard.getRangeKeys(['ducks', 'fish'], new Date('1/01/2012'), new Date('1/31/2012'));

//console.log(keys);

// score.remove('duck', 'edward');
// score.remove('duck', 'sang');
// score.remove('duck', 'andy');

// score.index('duck', 100, 'edward', function(err, response){console.log(err, response);});
// score.index('duck', 200, 'sang', function(err, response){console.log(err, response);});
// score.index('duck', -10000, 'andy', function(err, response){console.log(err, response);});

// score.index('fish', 5000, 'edward', function(err, response){console.log(err, response);});
// score.index('fish', 200, 'sang', function(err, response){console.log(err, response);});
// score.index('fish',  10000, 'andy', function(err, response){console.log(err, response);});

score.leader({ keys: ['duck', 'fish'], date: { $start: new Date('1/01/2012'), $end: new Date() } })
	.skip(0).limit(-1)
	.run(function(err, response){
		console.log(response);
	});