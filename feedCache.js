var RSS = require('rss');
var Q = require('q');
var Twitter = require('twitter');

var config = require('./config.json');

var feedCache = (function () {
  var lifetime = config.cacheLifetime;
  var search = config.search;
  var expiry = 0;
  var feed = null;

  // https://www.npmjs.com/package/rss
  var feedOptions = {
    title: config.title,
  };

  var client = new Twitter({
    consumer_key: config.twitter.consumer_key,
    consumer_secret: config.twitter.consumer_secret,
    access_token_key: config.twitter.access_token_key,
    access_token_secret: config.twitter.access_token_secret
  });

  var cacheTweets = function cacheTweets() {
    var deferred = Q.defer();

    client.get('search/tweets', {q: search}, function(error, tweets, response) {
      if ( error ) {
        deferred.reject(new Error(error));
      } else {
        console.log(
          'Got ' + tweets.statuses.length + ' tweets ' +
          'on ' + new Date() +
          '. rate limit: ' + response.headers['x-rate-limit-remaining']
        );
        deferred.resolve(tweets.statuses);
      }
    });
    return deferred.promise;
  };

  var getFeed = function() {
    var deferred = Q.defer();
    var now = new Date();
    if (expiry < new Date()) {
      cacheTweets().then(function(tweets) {
        feed = new RSS(feedOptions);
        tweets.map(function (tweet) {
          feed.item({
            title: tweet.user.name + ' @'+tweet.user.screen_name,
            description: tweet.text,
            pubdate: tweet.created_at,
            guid: tweet.id,
          });
        });
        var now = new Date();
        expiry = now.setSeconds(now.getSeconds() + lifetime);
        deferred.resolve(feed);
      });
    } else {
      deferred.resolve(feed);
    }
    return deferred.promise;
  };

  var setLifetime = function setLifetime(timeout) {
    lifetime = timeout;
  };

  return {
    get: getFeed,
    setLifetime: setLifetime
  };
})();

module.exports = feedCache;
