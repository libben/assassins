var express = require('express');
var path = require('path');
var logger = require('morgan'); // logs requests to console. Remove when publishing.
var cookieParser = require('cookie-parser'); // I don't understand middlewares, so I'm leaving these alone for now.
var bodyParser = require('body-parser');
var off_routes = require('./routes/off_routes'); // Gives us a variable to link as the source of our routes.
var on_routes = require('./routes/on_routes');
var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.locals.game_on = 0;

if (app.locals.game_on === 0) {
  app.use('/', off_routes);
} else {
  app.use('/', on_routes);
}

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = app;
