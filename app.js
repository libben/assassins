var express = require('express');
var path = require('path');
var logger = require('morgan'); // logs requests to console. Remove when publishing.
var cookieParser = require('cookie-parser'); // I'm leaving these alone for now.
var bodyParser = require('body-parser');
var router = require('./routes/index'); // Gives us a variable to link as the source of our routes.
var cradle = require('cradle');
var c = new(cradle.Connection);
var app = express();

// Create necessary database on startup if it doesn't exist already
var instances_database = c.database('instances');
instances_database.exists(function (err,exists) {
  if (err) {
    console.log('Checking if there was an instances database threw an error.');
  } else if (exists) {
    // Do nothing. I should make this more efficient; there's got to be another type of considitonal I can use here
  } else {
    instances_database.create();
    instances_database.save('game_counter', {
      val: 0
    }, function (err,res) {
      if (err) {
        console.log('Creating an instances_database threw an error.');
      }
    });
    instances_database.save('_design/all', {
      views: {
        ids_and_emails: {
          map: 'function(doc) { if (doc.email) { emit(doc._id, doc.email) } }'
        }
      }
    });
  }
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', router.routes);

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
