var app = require('../app');
var express = require('express');
var router = express.Router();
var cradle = require('cradle');
var events = require('events');
var open = require('amqplib').connect('amqp://localhost');
var eventEmitter = new events.EventEmitter();
var db = new(cradle.Connection)().database('assassins');
console.log('routes thinks it is ' + app.locals.game_on);
eventEmitter.on('game_countdown', function() {
  open.then(function(conn) {
    ok = conn.createChannel();
    ok = ok.then(function(ch) {
      var q = 'sockety';
      ch.assertQueue(q, {durable: false});
      ch.sendToQueue(q, new Buffer('start_timer'));
      console.log(" [x] Sent 'start_timer'");
    });
  });
});
/* GET home page. */
router.get('/', function(req, res) {
  res.render('index', {
      title: 'Home'
  });
});
if (1 === 1) { // If the game's on, these routes are available
  router.get('/unregister', function(req, res) {
    res.render('info', {
      title: 'Unregister'
    });
  });
  router.post('/unregister', function(req, res) {
    var n = 0;
    var page_title = 'Unregister';
    db.view('all/all', function (err, resp) {
      resp.forEach(function (key,row) {
        if (req.body.unregister_key === key.unregister_key) { // Need to auto-generate unregister_key on signup
          n++;
          db.remove(key._id, function (err, res) {
            if (err) {
              req.app.locals.delete_error === 'unknown';
            } else {
              var page_title = 'Unregistration Successful'; /// This may not work
            }
          });
        }
      });
    });
    if (n === 0) {
      req.app.locals.delete_error === 'key_not_found';
    }
    res.render('unregister', {
      title: page_title,
      error: req.app.locals.delete_error
    });
  });

  router.get('/signup', function(req, res) {
    res.render('signup', {
      title: 'Sign-Up'
    });
  });
  router.post('/signup', function(req, res) {
    req.app.locals.user_id = (Math.floor((Math.random() * 10000000000))).toString();
    req.app.locals.unreg_key = (Math.floor((Math.random() * 10000000000))).toString();
    var obj = {};
    var page_title = 'Sign-Up';
    db.view('all/all', function (err, resp) {
      resp.forEach(function (key,row) {
        obj[key._id] = 1; // Arbitrarily picked 1 as the value here; it's not relevent
        obj[key.unregister_key] = 1;
        if (key.name === req.body.name.trim()) {
          req.app.locals.submit_error = 'name_in_use';
          console.log('Error thrown - name in use');
        } else if (key.email === req.body.email.toLowerCase().trim()) {
          req.app.locals.submit_error = 'email_in_use';
          console.log('Error thrown - email in use');
        }
      });
      eventEmitter.emit('success_conditional');
    });
    eventEmitter.on('success_conditional', function() {
      if (req.app.locals.submit_error === undefined) {
        while (obj[req.app.locals.user_id]) { // This set of two similar loops may ignore DRY conventions
            req.app.locals.user_id = (Math.floor((Math.random() * 10000000000))).toString();
            console.log('Re-running id generator.');
        }
        while (obj[req.app.locals.unreg_key]) {
            req.app.locals.unreg_key = (Math.floor((Math.random() * 10000000000))).toString();
            console.log('Re-running unregistration key generator.');
        }
        db.save(req.app.locals.user_id, {
          name: req.body.name.trim(), email: req.body.email.toLowerCase().trim(), unregister_key: req.app.locals.unreg_key
        }, function (err, res) {
          if (err) {
            console.log(err);
            req.app.locals.unknown_problem = true; // potentially inefficient code here.
          }
          eventEmitter.emit('game_ready_check');
        });
        eventEmitter.on('game_ready_check', function() {
          db.view('all/all', function(err, res) { // If there are 10 people signed up, start the countdown to the beginning of the game.
            if (res.length > 9) {
              eventEmitter.emit('game_countdown');
              console.log('I emitted \'game_countdown\'');
            }
          });
        });
        if (req.app.locals.unknown_problem) {
          req.app.locals.submit_error = 'unknown';
          page_title = 'Sign-Up';
        } else if (req.app.locals.submit_error === undefined){
          page_title = 'Sign-Up Has Completed!';
        }
      } else {
        page_title = 'Sign-Up';
      }
      res.render('signup', {
        title: page_title,
        error: req.app.locals.submit_error
      });
    });
  });
} else { // otherwise, these routes are available
  router.get('/info', function(req, res) {
    res.render('info', {
      title: 'Target Information',
      label: 'Target ID',
      button_type: 'querybutton'
    });
  });

  router.get('/report', function(req, res) {
    res.render('index', {
      title: 'Report a Kill'
    });
  });
  /* GET leak page. */
  router.get('/leak', function(req, res) {
    res.render('index', {
      title: 'LEAK INFORMATION'
    });
  });
}
module.exports = router;
