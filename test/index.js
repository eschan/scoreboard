var should = require('should');
var scoreboard = require('../');
var Score = scoreboard.Score;

var score = new Score(); 

describe('scoreboard', function() {
  describe('#getDate', function() {
    it('test date string', function() {
	    var d = new Date('2/1/2012');
	    var dstr = scoreboard.getDate(d);
	    dstr.should.eql('20120201');
    })
  })

  describe('#genKey', function() {
    it('test key generation', function() {
	  	var d = new Date('2/1/2012');
	  	var key = scoreboard.genKey('foo', d);
	  	key.should.eql('20120201_foo');
    })
  })
 
  describe('#getRangeKeys', function() {
    it('test single date range key generation', function(){
			var keys = scoreboard.getRangeKeys(['foo'], new Date('2/1/2012'),  new Date('2/2/2012'));
			keys.should.include('20120201_foo');
			keys.should.include('20120202_foo');
    })
  })

  describe('#getRangeKeys', function() {
    it('test multiple date range key generation', function(){
			var keys = scoreboard.getRangeKeys(['foo', 'bar'], new Date('2/1/2012'),  new Date('2/2/2012'));
			keys.should.include('20120201_foo');
			keys.should.include('20120202_foo');
			keys.should.include('20120201_bar');
			keys.should.include('20120202_bar');
    })
  })

  describe('#getUniqueKey', function() {
    it('test multiple date range key generation', function(){
			var key = scoreboard.genUniqueKey(['foo', 'bar']);
			console.log(key);
			key.should.have.length(22);
			key.should.include('multi:');
    })
  })
})

describe('score', function(){
	describe('#index', function() {
    it('test index and get value', function(done) {
			score.index('foo', 1, 'bar', function(err) {
				score.leader({ keys: ['foo'] })
				.skip(0).limit(-1)
				.run(function(err, response) {
					response.should.include('bar');
					done();
				});
			});
    })
  })

  describe('#leader', function() {
    it('test multi index and get value', function(done) {
			score.index('foo', 1, 'bar', function(err) {
				score.index('poo', 1, 'par', function(err) {
					score.leader({ keys: ['foo', 'poo'] })
					.skip(0).limit(-1)
					.run(function(err, response) {
						response.should.include('bar');
						response.should.include('par');
						done();
					});
				});
			});
    })
  })

  describe('#leader', function() {
    it('test multi index and get value in range', function(done) {
			score.index('foo', 1, 'bar', function(err) {
				score.index('poo', 1, 'par', function(err) {
					score.leader({ keys: ['foo', 'poo'], date: { $start: new Date('1/31/2012'), $end: new Date() } })
					.skip(0).limit(-1)
					.run(function(err, response) {
						response.should.include('bar');
						response.should.include('par');
						done();
					});
				});
			});
    })
  })
});