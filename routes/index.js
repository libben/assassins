var express = require('express');
var router = express.Router();
var http = require('http');
var cradle = require('cradle');
var events = require('events');
module.exports.event_emitter = new events.EventEmitter(); // WATCH THIS, SEE IF IT WORKS
var c = new(cradle.Connection);

/* GET home page. */
router.get('/', function(req, res) {
  res.render('creator', {
    title: 'Create',
    new_game_id: null,
    error: false
  });
});
/* POST home page */
router.post('/', function(req, res) {
  //res.app.locals.comp = true; < I thought I needed this, but I can get by evaluating completion based on if there were any errors submitting the request or not
  res.locals.err = null; // replace these properties of the app with database calls?
  res.locals.new_game_id = null; // This is null at the start. I don't want it to show up as undefined down the road and give me a hassle. It will only be called upon if the new game database is successfully created.
  res.locals.title = 'Create';
  var db = c.database('instances');
  db.view('all/ids_and_emails', function (err, resp) { // REMEMBER: 'res' is what we call the response for the entire route. Any responses given while retrieving the route must be given different names.
    if (err) {
      res.locals.err = 'unknown';
      console.log('Set err to unknown');
      console.error('Error in section 2147: ' + err.message);
      module.exports.event_emitter.emit('render');
    } else {
      resp.forEach(function (value) {
        if (value === String(req.body.email)) {
          res.locals.err = 'email_in_use';
          console.log('Set err to email_in_use');
        }
      });
      module.exports.event_emitter.emit('proceed_to_completion');
      console.log('I emitted proceed_to_completion.');
    }
  });
  module.exports.event_emitter.on('proceed_to_completion', function(){
    db.get('game_counter', function (err, doc) {
      console.log('game_counter reads ' + doc.val);
      var number_of_games = Number(doc.val) + 1;
      db.merge('game_counter', {val: number_of_games}, function (err, resp) {
        if (err) {
          console.error("Error in section 9909: " + err.message);
          res.locals.error = 'unknown';
        }
      });
      db.save(String(number_of_games), {
        email: req.body.email
      }, function(err, resp) {
        res.locals.error = 'unknown';
      });
      var new_database = c.database('game_' + String(number_of_games)); // CouchDB does not permit databases beginning with numbers. Thus, I must call upon these by starting them with 'game_'.
      new_database.create();
      console.log('new_database created.');
      new_database.save('_design/all', {
        views: {
          user_list: { // Will probably have more default views being generated here as I develop further.
            map: 'function (doc) { if (doc.name) { emit(doc, null) } }' // I like keeping this all as one line. Makes things concise.
          }
        }
      });
      new_database.save('game_on', { // Creates document 'game_on' with property 'val' set to 0
        val: 0,
        countdown: false
      }, function(err, resp) {
        if (err) {
          console.error('Error in section 1123: ' + err.message);
        }
      });
      if (res.locals.err === null) {
        res.locals.title = 'Success';
        res.locals.new_game_id = number_of_games;
      }
      module.exports.event_emitter.emit('render'); // Ignoring DRY again here
    });
  });
  module.exports.event_emitter.on('render', function() {
    res.render('creator', {
      title: res.locals.title,
      new_game_id: res.locals.new_game_id,
      error: res.locals.err
    });
  });
});
router.get('/:game_id', function(req, res) {
  res.render('landing', {
    title: 'Landing Page',
    game_id: req.params.game_id
  });
});

/*                                          // Unregistration will be added at a later point, after emailing is set up
router.get('/:game_id/unregister', function(req, res) {
  res.render('info', {
    title: 'Unregister',
    game_id: req.params.game_id
  });
});

router.post('/:game_id/unregister', function(req, res) { // Unregistration will need re-tooling
  var n = 0;
  var page_title = 'Unregister';
  db.view('all/all', function (err, resp) {
    resp.forEach(function (key,row) {
      if (req.body.unregister_key === key.unregister_key) {
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

router.get('/:game_id/signup', function(req, res) {
  res.render('signup', {
    title: 'Sign-Up',
    game_id: req.params.game_id
  });
});
router.post('/:game_id/signup', function(req, res) {
  res.locals.submit_error = null;
  var db = c.database('game_' + req.params.game_id);
  res.locals.user_id = (Math.floor((Math.random() * 10000000000))).toString();
  res.locals.unreg_key = (Math.floor((Math.random() * 10000000000))).toString();
  var obj = {};
  db.view('all/user_list', function (err, resp) {
    if (err) {
      console.error('Error in section 5833: ' + err.message); // All these numbers before error messages are arbitrary, but let me find the errors quickly with CTRL-F.
    } else {
      resp.forEach(function (key) { // Had (key,row) but I don't think I need 'row'
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
      if (res.locals.submit_error === null) { // Changed this from '... === undefined'. Not sure why it was like that. Also explicitly declaring it's null above now.
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
        }, function (err, resp) {
          if (err) {
            console.error('Error in section 1212: ' + err.message);
            res.locals.unknown_problem = true; // potentially inefficient code here.
          } else {
            db.view('all/user_list', function(err, resp) { // If there are 10 people signed up, start the countdown to the beginning of the game.
              if (resp.length > 9) { // 9 is not a value set in stone. I am seriously thinking it would be a good idea to make this a property in the database, choosable when you create your instance.
                db.get('game_on', function(err, doc) {
                  if (err) {
                    console.error('Error in section 3468: ' + err.message);
                  } else {
                    if (doc.countdown === false) {
                      module.exports.event_emitter.emit('game_countdown', req.params.game_id);
                      db.merge('game_on', {countdown: true}, function (err,doc) {
                        if (err) {
                          console.error('Error in section 1241: ' + err.message);
                        }
                      });
                    }
                  }
                });
              }
            });
          }
        });
        if (res.locals.unknown_problem) {
          res.locals.submit_error = 'unknown';
          res.locals.page_title = 'Sign-Up';
        } else if (res.locals.submit_error === null){
          res.locals.page_title = 'Sign-Up Has Completed!';
        }
      } else {
        res.locals.page_title = 'Sign-Up';
      }
    }
    res.render('signup', {
      title: res.locals.page_title,
      error: res.locals.submit_error,
      game_id: req.params.game_id
    });
  });
});
// Routes when the game is on
router.get('/:game_id/info', function(req, res) {
  res.render('info', {
    title: 'Target Information',
    game_id: req.params.game_id // I had more here but I deleted it. Dunno what it was left over from. If you see this comment later in time, go ahead and delete it
  });
});
router.post('/:game_id/info', function(req, res) {
  res.params.not_found_error = false;
  res.params.target_name = false;
  res.params.target_killword = false;
  var db = c.database('game_' + req.params.game_id);
  db.get(req.body.key, function (err, doc) {
    if (err) {
      console.error('Error in section 1919: ' + err.message);
      res.locals.not_found_error = true;
    } else {
      res.locals.target_name = doc.name;
      res.locals.target_killword = doc.killword;
    }
  });
  res.render('info', {
    title: 'Target Information',
    target_name: res.locals.target_name,
    target_killword: res.locals.target_killword,
    not_found_error: res.locals.not_found_error,
    game_id: req.params.game_id
  });
});
/* GET report a kill page */
router.get('/:game_id/report', function(req, res) {
  res.render('index', {
    title: 'Report a Kill',
    game_id: req.params.game_id
  });
});
/* GET leak page. */
router.get('/:game_id/leak', function(req, res) {
  res.render('index', {
    title: 'LEAK INFORMATION',
    game_id: req.params.game_id
  });
});
module.exports.routes = router;
