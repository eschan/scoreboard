# scoreboard

  scoreboard is a light weight leaderboard for node.js.  It can be used keep score and ranks between multiple objects and scoring types. It is backed by Redis and sorted sets.

## Where to use
* Trending Charts
* Realtime Charts
* Historical Charts
* Game mechanics

## Installation

      $ npm install scoreboard

## Example

### Setup
```js    
var scoreboard = require('scoreboard')
var Score = scoreboard.Score;
var scores = new Score();
````

### Redis Connection Settings
```javascript
scoreboard.redis.createClient = function() {
  var client = redis.createClient(1234, '192.168.100.1');
  client.auth('somethingsecret');
  return client;
};
```

### Indexing
 Awarding point to an object is simple. Scoreboard supports multiple leaderboards, and is are partitioned by different a `key`

```js
scores.index('monsters', 100, 'edward');
scores.index('aliens', 100, 'edward');
scores.index('monsters', 50, 'nancy');
scores.index('aliens', 200, 'nancy');
```

### Leaderboard
 To perform a query against the scoreboard to find the leaders, you simple use `Score#leader` with a list of keys, and invoke `run` with a callback to fetch the results

#### Single scoreboard

 Find leader in just `monsters`

```js
scores.leaders({keys:['monsters']}).run(function(err, leaderboard)) {
  console.log(leaderboard);
});
```

 Results

```js
['edward', 'nancy']
```

#### Multiple scoreboards

 Find leader in both `monsters` and `aliens`.  The scores across the two sets are totalled together

```js
scores.leaders({keys:['monsters','aliens']}).run(function(err, leaderboard)) {
  console.log(leaderboard);
});
```

 Results:

```js
['nancy', 'edward']
```

#### Time series plus multiple scoreboards

 Score are stored in Redis on two types of buckets, `overall` and `days`.  Obviously the `overall` buckets are used to track scores thoughout the entire life of the scoreboard.  But `day` buckets allow for more percise queries. 
 
This will return the leaderboard for `monsters` and `aliens` between `1/1/2012` and `1/31/2012`:

```js
scores.leaders({ keys:['monsters','aliens'], date: {$start: new Date('1/1/2012'), $end: new Date('1/31/2012') } })
  .run(function(err, leaderboard)) {
    console.log(leaderboard);
  });
``` 

 Results:

```js
['nancy', 'edward']
```

#### Pagination

 Paginations is super easy with scoreboard.  All you need is `skip` and `limit`

 This will return the top 0 - 100 of the time series leaderboard

```js
scores.leaders({ keys:['monsters','aliens'], date: {$start: new Date('1/1/2012'), $end: new Date('1/31/2012') } })
  .skip(0)
  .limit(100)
  .run(function(err, leaderboard)) {
    console.log(leaderboard);
  });
``` 


## License 

(The MIT License)

Copyright (c) 2012 Edward Chan &lt;edward@knowsee.com&gt;

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.