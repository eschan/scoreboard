var redis = require('./redis'),
		moment = require('moment');
var noop = function(){};

exports.version = '0.0.1';

exports.redis = redis;
exports.Score = Score;

/**
 * Create Client
 **/
// exports.createClient = function() {
// 	console.log('new client');
// 	return redis.createClient(); //exports.client || (exports.client = redis.createClient());
// }

/**
 * Get current working date
 **/
exports.getDate = function(date) {
	var d = moment(date);
	return d.format('YYYYMMDD');
}

/**
 * Generate key by format
 * 
 * format: [date]:[key]
 * example: 20120201_likes
 **/
exports.genKey = function(key, date) {
	var d = exports.getDate(date);
	return d + "_" + key;
}

/**
 * Generate unique multi key
 * 
 * format: [date]:[key]
 * example: 20120201_likes
 **/
exports.genUniqueKey = function(keys) {
	return 'myuniquekey';
}

/**
 * Generate Date Range Keys
 * 
 * format: [date]:[key]
 * example: 20120201_likes, 20120202_likes
 **/
exports.getRangeKeys = function(keys, start, end) {
	var ks = [];

	keys.forEach(function(key) {
		var a = new Date(start.valueOf())
		var b = new Date(end.valueOf())
		var s = new moment(a);
		var e = new moment(b);

		var diff = e.diff(s, 'days'); 
		
		// console.log(key, start, end, diff)
		
		if (diff > 0) {
			var working = s;
			for(var i=0; i <= diff; i++) {
				ks.push(exports.genKey(key, working));
				working.add('d', 1);
			}
		} else {
			//throw exception;
		}
	});

	return ks;
}

/**
 * Initialize a 'Score'
 **/
function Score() {
	this.client = redis.createClient();
}

/**
 * Add a score to the scoreboard, appends if key exists
 * @param {String} key
 * @param {Number} score
 * @param {String} value
 **/
Score.prototype.index = function(key, score, value, callback) {
	var db = this.client,
			timeKey = exports.genKey(key.toLowerCase(), new Date()),
			overallKey = key.toLowerCase();
	
	//Timeseries insert
	db.exists(timeKey, function(err, exist) {
		if(!exist) {
			db.zadd(timeKey, score, value, callback || noop);	
		} else {
			db.zincrby(timeKey, score, value, callback || noop);
		}
	});

	//Overall insert
	db.exists(overallKey, function(error, exist) {
		if(!exist) {
			db.zadd(overallKey, score, value, callback || noop);	
		} else {
			db.zincrby(overallKey, score, value, callback || noop);
		}
	});

	return this;
};

/**
 * Remove a score from the scoreboard
 * @param {String} key
 * @param {String} value
 **/
Score.prototype.remove = function(key, value, callback) {
	var db = this.client,
			timeKey = exports.genKey(key),
			overallKey = key;
	
	db.zrem(timeKey, value, callback || noop);
	db.zrem(overallKey, value, callback || noop);
};

/**
 * Get scoreboard order by leader first
 * @param {String | Object} key
 * @param {Number} start
 * @param {Number} max
 **/
Score.prototype.leader = function(conditions, callback) {
	this.query = new Query(conditions, this).type('leader');
	return this.query.find(callback);	
};

/**
 * Get scoreboard order by leader first
 * @param {String | Object} key
 * @param {Number} start
 * @param {Number} max
 **/
Score.prototype.rank = function(conditions, callback) {
	this.query = new Query(conditions, this).type('rank');
	return this.query.find(callback);	
};

/**
 * Get scoreboard order by leader first
 * @param {String | Object} key
 * @param {Number} start
 * @param {Number} max
 **/
Score.prototype.around = function(conditions, callback) {
	this.query = new Query(conditions, this).type('around');
	return this.query.find(callback);	
};


/**
 * Initialize a Query
 **/
function Query(conditions, score) {
	this.conditions = conditions;
	this.keys = conditions.keys;
	this.start = 0;
	this.end = -1
	this.score = score;
}

Query.prototype.type = function(type) {
	this.type = type;
	return this;
};

Query.prototype.find = function(callback) {
	this.callback = callback;
	return this;
};

Query.prototype.in = function(keys) {
	this.keys = keys;
	return this;
};

Query.prototype.limit = function(limit) {
	this.limit = limit;
	return this;
};

Query.prototype.skip = function(skip) {
	this.skip = skip;
	return this;	
}

Query.prototype.run = function(callback) {
	var type = this.type;
	this[type](callback);
};

Query.prototype.leader = function(callback) {
	var keys = [];

	if(this.conditions.date &&
		this.conditions.date.$start && 
		this.conditions.date.$end) {
		
		keys = exports.getRangeKeys(this.keys, this.conditions.date.$start, this.conditions.date.$end);
	} else if (this.keys.length == 1) {
		keys = this.keys;
	} else {
		keys = this.keys;
	}

	if(this.keys.length == 1) {
		this.revrange(keys[0], this.skip, this.limit, callback);
	} else {
		this.multirevrange(keys, this.skip, this.limit, callback);
	}
};

Query.prototype.revrange = function(key, start, end, callback) {
	var db = this.score.client;

	var s = (start > 0) ? start : 0;
	var e = (end > 0) ? ((start + end) - 1) :-1;

	db.zrevrange(key, s, e, function(err, res) {
		callback(err, res);
	});
};

Query.prototype.multirevrange = function(keys, start, end, callback) {
	var db = this.score.client,
		keys = keys,
		multikey = exports.genUniqueKey(keys);

	var s = (start > 0) ? start : 0;
	var e = (end > 0) ? ((start + end) - 1) :-1;

	// console.log(keys, s, e);

	var multi = db.multi();
	multi.zunionstore([multikey, keys.length].concat(keys).concat(['aggregate', 'sum']));
	multi.zrevrange(multikey, s, e); 
	multi.exec(function(err, replies) {
		callback(err, replies[1]);
	});
};


/*
1) leader board - keys (date range)
2) rank - keys, value
3) around - keys, value, depth
*/


// scores.leader({ keys: keys });  																																	//leaderboard overall in these keys
// scores.leader({ keys: keys, date: { $start: start, $end: end } });  															//leaderboard in these keys and date range
// scores.rank({ value: 'edward', keys: keys });  																										//rank overall in these keys
// scores.rank({ value: 'edward', keys: keys, date: { $start: start, $end: end } });  								//rank in these keys and date range
// scores.around({ value: 'edward', keys: keys, depth: 5 });  																				//around position overall in these keys
// scores.around({ value: 'edward', keys: keys, depth: 5, date: { $start: start, $end: end } });  		//around position in these keys and date range



	// .skip(0)
	// .limit(100)
	// .run(function(err, response){
	
	// });
