var express = require('express');
var router = express.Router();
var http = require('http');
var cradle = require('cradle');
var events = require('events');
var open = require('amqplib').connect('amqp://localhost');
var event_emitter = new events.EventEmitter();
var c = new(cradle.Connection);

event_emitter.on('game_countdown', function() {
  open.then(function(conn) {
    ok = conn.createChannel(); // I should come up with a new name for this variable. 'ok', though concise, gives no information.
    ok = ok.then(function(ch) {
      var q = 'sockety';
      ch.assertQueue(q, {durable: false});
      ch.sendToQueue(q, new Buffer('start_timer'));
      console.log(" [x] Sent 'start_timer'");
    });
  });
});});

/* GET home page. */
router.get('/', function(req, res) {
  res.render('index', {
    title: 'Create',
    new_game_id: null,
    error: false
  });
});
/* POST home page */
router.post('/', function(req,res) {
  //req.app.locals.comp = true; < I thought I needed this, but I can get by evaluating completion based on if there were any errors submitting the request or not
  res.locals.err = false; // replace these properties of the app with database calls?
  res.locals.new_game_id = null; // This is null at the start. I don't want it to show up as undefined down the road and give me a hassle. It will only be called upon if the new game database is successfully created.
  res.locals.title = 'Create';
  var db = c.database('instances');
  db.view('all/all', function (err, res) {
    if (err) {
      res.locals.err = 'unknown';
      console.log('Set err to unknown');
    } else {
      res.forEach(function (row) {
        if (row.email === req.body.email) {
          res.locals.err = 'email_in_use';
          console.log('Set err to email_in_use');
        }
      });
    }
    event_emitter.emit('proceed_to_completion');
    console.log('I emitted proceed_to_completion.');
  });
  event_emitter.on('proceed_to_completion', function(){
    if (res.locals.err = false) {
      db.get('game_counter', function (err, doc) {
        console.log('game_counter reads ' + doc.val); // Remember to save the incrementally increasing property as 'val' when you create the database 'instances' with the document 'game_counter'
        var number_of_games = Number(doc.val) + 1;
        db.merge('game_counter', {val: number_of_games}, function (err, res) {
          if (err) {
            res.locals.error = 'unknown';
          }
        });
        var new_database = c.database(p);
        new_database.create();
        new_database.save('_design/all'), {
          views: {
            user_list: { // Will probably have more default views being generated here as I develop further.
              map: 'function (doc) { if (doc.name) { emit(doc, null) } }'; // I like keeping this all as one line. Makes things concise.
            }
          }
        }
        res.locals.new_game_id = number_of_games;
        res.locals.title = 'Success';
      });
    }
  });
  res.render('index', {
    title: res.locals.title,
    new_game_id: res.locals.new_game_id,
    error: res.locals.err
  })
});
router.get('/:in', function(req, res) { // LAST TIME YOU LEFT OFF YOU WERE ABOUT TO MAKE A HOME PAGE
  res.render('landing', {
    title: 'Landing Page'
  });
});
router.get('/:in/unregister', function(req, res) {
  res.render('info', {
    title: 'Unregister'
  });
});
/*
router.post('/:in/unregister', function(req, res) { // Unregistration will need re-tooling
  var n = 0;
  var page_title = 'Unregister';
  db.view('all/all', function (err, resp) {
    resp.forEach(function (key,row) {
      if (req.body.unregister_key === key.unregister_key) { // Need to auto-generate unregister_key on signup
        n++;
        db.remove(key._id, function (err, res) {
          if (err) {
            res.locals.error === 'unknown';
          } else {
            res.locals.page_title = 'Unregistration Successful';
          }
        });
      }
    });
  });
  if (n === 0) {
    res.locals.error === 'key_not_found';
  }
  res.render('unregister', {
    title: res.locals.page_title,
    error: res.locals.error
  });
});
*/

router.get('/:in/signup', function(req, res) {
  res.render('signup', {
    title: 'Sign-Up',
    game_id: req.params.in
  });
});
router.post('/:in/signup', function(req, res) {
  var db = c.database(req.params.in);
  res.locals.user_id = (Math.floor((Math.random() * 10000000000))).toString();
  res.locals.unreg_key = (Math.floor((Math.random() * 10000000000))).toString();
  var obj = {};
  var page_title = 'Sign-Up';
  db.view('all/user_list', function (err, resp) {
    resp.forEach(function (key,row) {
      obj[key._id] = 1; // Arbitrarily picked 1 as the value here; it's not relevent. I just need the id to show up as part of this faux-hash. > {"3488842": 1}
      obj[key.unregister_key] = 1;
      if (key.name === req.body.name.trim()) {
        res.locals.submit_error = 'name_in_use';
        console.log('Error thrown - name in use');
      } else if (key.email === req.body.email.toLowerCase().trim()) {
        res.locals.submit_error = 'email_in_use';
        console.log('Error thrown - email in use');
      }
    });
    event_emitter.emit('success_conditional');
  });
  event_emitter.on('success_conditional', function() {
    if (res.locals.submit_error === undefined) {
      while (obj[res.locals.user_id]) { // This set of two similar loops may ignore DRY conventions
          res.locals.user_id = (Math.floor((Math.random() * 10000000000))).toString();
          console.log('Re-running id generator.');
      }
      while (obj[res.locals.unreg_key]) {
          res.locals.unreg_key = (Math.floor((Math.random() * 10000000000))).toString();
          console.log('Re-running unregistration key generator.');
      }
      db.save(res.locals.user_id, {
        name: req.body.name.trim(), email: req.body.email.toLowerCase().trim(), unregister_key: res.locals.unreg_key
      }, function (err, res) {
        if (err) {
          console.log(err);
          res.locals.unknown_problem = true; // potentially inefficient code here.
        }
        event_emitter.emit('game_ready_check');
      });
      event_emitter.on('game_ready_check', function() {
        db.view('all/user_list', function(err, res) { // If there are 10 people signed up, start the countdown to the beginning of the game.
          if (res.length > 9) { // 9 is not a value set in stone. I am seriously thinking it would be a good idea to make this a property in the database, choosable when you create your instance.
            event_emitter.emit('game_countdown');
            console.log('I emitted \'game_countdown\'');
          }
        });
      });q.app
      if (res.locals.unknown_problem) {
        res.locals.submit_error = 'unknown';
        page_title = 'Sign-Up';
      } else if (res.locals.submit_error === undefined){
        page_title = 'Sign-Up Has Completed!';
      }
    } else {
      page_title = 'Sign-Up';
    }
    res.render('signup', {
      title: page_title,
      error: res.locals.submit_error
    });
  });
});
// Routes when the game is on
router.get('/:in/info', function(req, res) {
  res.render('info', {
    title: 'Target Information',
    label: 'Target ID',
    button_type: 'querybutton' // All the backend querying happens at /bin/www
  });                     // Hey, I really could use POSTing a form instead of sockets here. That way I wouldn't have to spend more time figuring out how to extract a URL parameter for use in /bin/www as the database to be retrieving info from
});
/* GET report a kill page */
router.get('/:in/report', function(req, res) {
  res.render('index', {
    title: 'Report a Kill'
  });
});
/* GET leak page. */
router.get('/:in/leak', function(req, res) {
  res.render('index', {
    title: 'LEAK INFORMATION'
  });
});
module.exports = router;
