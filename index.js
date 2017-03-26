var express = require('express');
var morgan = require('morgan');
var feedCache = require('./feedCache');
var config = require('./config.json');

var app = express();

app.use(morgan('combined'));

app.get('/', function (req, res) {
  feedCache.get()
  .then(function(feed) {
    res.set('Content-Type', 'text/xml');
    res.send(feed.xml());
  });
});

app.listen(config.app.port, function () {
  console.log(
    'twitrss ' + config.title + ': searching for ' + config.search +
    ' and listening on port ' + config.app.port
  );
});
