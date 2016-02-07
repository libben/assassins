var express = require('express');
var router = express.Router();
var http = require('http');
var cradle = require('cradle');
var events = require('events');
module.exports.event_emitter = new events.EventEmitter();
var c = new(cradle.Connection);
var instances_db = c.database('instances');
module.exports.game_statuses = {'game_count': 0}; // In case the instances database doesn't exist when the server starts up, this ensures requests made to /:game_id/ of any kind still 404 when no game databases exist

var kill_unless_game_on = function(id,response,nxt) { // This will be applied to each route that should only be able to be accessed if the game is on. If it isn't, the route 404s. I'll make the error prettier later
  if (module.exports.game_statuses[id] !== 1) {
    var err = new Error('Not Found');
    err.status = 404;
    nxt(err);
  }
};    // Provide for the game being off; only allow access to the root of the /:game_id/ route

var kill_unless_game_off = function(id,response,nxt) { // This will be applied to each route that should only be able to be accessed if the game is off. If it isn't, the route 404s. I'll make the error prettier later
  if (module.exports.game_statuses[id] !== 0) {
    var err = new Error('Not Found');
    err.status = 404;
    nxt(err);
  }
};

var kill_unless_game_exists = function(id,response,nxt) {
  if (!(/^\d+$/.test(id)) || (module.exports.game_statuses['game_count'] < id)) { // Checks that the string is composed solely of digits, and that that sequence of digits is less than the current game_count
    console.log('game_count is: ' + module.exports.game_statuses['game_count']);
    var err = new Error('Not Found');
    err.status = 404;
    nxt(err);
  }
}

instances_db.view('all/ids_and_is_game_on', function(err,resp) { // Sets the above object to have list of live instances of the game, coupled with their game_on status.
  if (err) {
    console.error('Error in section 5242: ' + err.message);
  } else {
    resp.forEach(function(key,val) {
      module.exports.game_statuses[key] = val.value;
    });
  }
});
instances_db.get('game_counter', function(err,doc) {
  if (err) {
    console.error('Error in section 8761: ' + err.message);
  } else {
    module.exports.game_statuses['game_count'] = doc.val; // Sets this object property to the total number of games upon server startup
  }
});

/* GET home page. */
router.get('/', function(req, res) {
  res.render('creator', {
    title: 'Create',
    new_game_id: null,
    error: null
  });
});
/* POST home page */
router.post('/', function(req, res) {
  //res.app.locals.comp = true; < I thought I needed this, but I can get by evaluating completion based on if there were any errors submitting the request or not
  res.locals.err = null; // replace these properties of the app with database calls?
  res.locals.new_game_id = null; // This is null at the start. I don't want it to show up as undefined down the road and give me a hassle. It will only be called upon if the new game database is successfully created.
  var check_for_validity = new Promise(function(resolve,reject) {
    instances_db.view('all/ids_and_emails', function (err, resp) { // REMEMBER: 'res' is what we call the response for the entire route. Any responses given while retrieving the route must be given different names.
      if (err) {
        reject(err.message);
      } else if (resp.length === 0) {
        resolve('proceed');
      } else {
        var success_counter = 0;
        resp.forEach(function (value) {
          if (value === String(req.body.email)) {
            reject('email_in_use');
          } else {
            success_counter++;
            if (success_counter === resp.length) {
              resolve('proceed'); // Checks though all instances. If no conflict, the promise is accepted.
            }
          }
        });
      }
    });
  });
  check_for_validity.then(function(result){
    return new Promise(function(resolve,reject){
      instances_db.get('game_counter', function (err, doc) {
        console.log('game_counter reads ' + doc.val);
        var number_of_games = Number(doc.val) + 1;
        var new_database = c.database('game_' + String(number_of_games)); // CouchDB does not permit databases beginning with numbers. Thus, I must call upon these by starting them with 'game_'. Also, this is so far up on the chain above the next command related to this database because if the next command triggers right after this error is thrown, I'm given a 412. Yippee. Making a proimse here would work, but it's a simpler solution to move it up in the chain of executed commands.
        instances_db.merge('game_counter', {val: number_of_games}, function (err, resp) {
          if (err) {
            console.error("Error in section 9909: " + err.message);
            res.locals.error = 'unknown';
          }
        });
        instances_db.save(String(number_of_games), { // saves metadata about each running game instance as a document in the 'instances' database
          email: req.body.email,
          is_game_on: 0 // Perhaps I'll add a field to measure when the games begin for easy referral, but not now
        }, function(err, resp) {
          if (err) {
            console.error('Error in section 9010: ' + err.message);
            res.locals.error = 'unknown';
          }
        });
        new_database.create(function(err){
          if (err) {
            console.error('Error creating new_database: ' + err.message);
            res.locals.error = err.message;
          }
        });
        new_database.save('_design/all', {
          views: {
            user_list: { // Will probably have more default views being generated here as I develop further.
              map: 'function (doc) { if (doc.name) { emit(doc, null) } }' // I like keeping this all as one line. Makes things concise.
            }
          }
        });
        new_database.save('game_on', { // Creates document 'game_on' with property 'val' set to 0
          val: 0,
          countdown: 0,
          game_start_time: null,
        game_end_time: null
        }, function(err, resp) {
          if (err) {
            console.error('Error in section 1123: ' + err.message);
          }
        });
        if (res.locals.err === null) {
          res.locals.new_game_id = number_of_games;
          module.exports.game_statuses[number_of_games] = 0; // This should have been set elsewhere; surprised it wasn't already
          module.exports.game_statuses['game_count'] = number_of_games;
          resolve('Success');
        } else {
          console.log('There was an error: ' + res.locals.err); // This means it won't resolve. However, it'll give me information to fix whatever's causing the problem.
        }
      });
    });
  },function(err){
    return new Promise(function(resolve,reject) {
      res.locals.err = err;
      console.log('Set err to ' + err);
      resolve('Create');
    });
  }).then(function(answer) {
    res.render('creator', {
      title: answer, // Newest change; ensure it works
      new_game_id: res.locals.new_game_id,
      error: res.locals.err
    });
  },null); // This is unsightly
});

router.get('/:game_id', function(req, res, next) {
  console.log(module.exports.game_statuses);
  kill_unless_game_exists(req.params.game_id,res,next);
  var promise = new Promise(function(resolve,reject) { // Hopefully this will work. I'm not totally certain on the structure of promises in this case.
    if (module.exports.game_statuses[req.params.game_id] === 1) {
      resolve('on');
    } else if (module.exports.game_statuses[req.params.game_id] === 0) {
      resolve('off');
    } else { // The route is ensured to exist right before this promise is called
      resolve('over');
    }
  });
  promise.then(function(result) {
    console.log(result);
    res.render('landing', {
      title: 'Landing Page',
      game_status: result,
      game_id: req.params.game_id
    });
  },null);
});

router.get('/:game_id/unregister', function(req, res, next) {
  kill_unless_game_off(req.params.game_id,res,next);
  res.render('unregister', {
    title: 'Unregister',
    game_id: req.params.game_id
  });
});

router.post('/:game_id/unregister', function(req, res, next) {
  kill_unless_game_off(req.params.game_id,res,next);
  var n = 0;
  res.locals.page_title = 'Unregister';
  var db = c.database('game_' + req.params.game_id);
  var check_for_key = new Promise(function(resolve,reject) {
    db.view('all/user_list', function (err, resp) {
      if (resp.length === 0) {
        resolve('key_not_found');
      } else {
        resp.forEach(function (key,row) {
          n++;
          if (req.body.unregister_key === key.unregister_key) {
            db.remove(key._id, function (err, response) { // Names for the variable referring to responses will get more complex as loops become nested
              if (err) {
                res.locals.error = 'unknown';
                resolve('unknown');
              } else {
                res.locals.page_title = 'Unregistration Successful';
                resolve('unreigstered');
              }
            });
          } else if (n === resp.length) {
            res.locals.error = 'key_not_found';
            resolve('key_not_found');
          }
        });
      }
    });
  });
  check_for_key.then(function(message){    // Creates syncronicity for unregistration, so the page is not rendered before all response properties have been properly set
    res.render('unregister', {
      title: res.locals.page_title,
      error: res.locals.error,
      game_id: req.params.game_id
    });
  },null);
});

router.get('/:game_id/signup', function(req, res, next) {
  kill_unless_game_off(req.params.game_id,res,next);
  res.render('signup', {
    title: 'Sign-Up',
    game_id: req.params.game_id,
    error: null
  });
});
router.post('/:game_id/signup', function(req, res, next) {
  kill_unless_game_off(req.params.game_id,res,next);
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
          name: req.body.name.trim(), email: req.body.email.toLowerCase().trim(), unregister_key: res.locals.unreg_key, alive: true, time_of_death: null, method_of_death: null, killer: null
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
                    if (doc.countdown === 0) {
                      module.exports.event_emitter.emit('game_countdown', req.params.game_id);
                      db.merge('game_on', {countdown: 1}, function (err,doc) {
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
router.get('/:game_id/info', function(req, res, next) {
  kill_unless_game_on(req.params.game_id,res,next);
  res.render('info', {
    title: 'Target Information',
    game_id: req.params.game_id // I had more here but I deleted it. Dunno what it was left over from. If you see this comment later in time, go ahead and delete it
  });
});

router.post('/:game_id/info', function(req, res, next) {
  kill_unless_game_on(req.params.game_id,res,next);
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
router.get('/:game_id/report', function(req, res, next) {
  kill_unless_game_on(req.params.game_id,res,next);
  res.render('index', {
    title: 'Report a Kill',
    game_id: req.params.game_id
  });
});
/* GET leak page. */
router.get('/:game_id/leak', function(req, res, next) {
  kill_unless_game_on(req.params.game_id,res,next);
  res.render('index', {
    title: 'LEAK INFORMATION',
    game_id: req.params.game_id
  });
});
module.exports.routes = router;
