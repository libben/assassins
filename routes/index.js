var express = require('express')
var router = express.Router()
var cradle = require('cradle')
var events = require('events')
module.exports.event_emitter = new events.EventEmitter()
var c = new (cradle.Connection)
var instances_db = c.database('instances')
var Promise = require('es6-promises')
module.exports.game_statuses = {'game_count': 0} // In case the instances database doesn't exist when the server starts up, this ensures requests made to /:game_id/ of any kind still 404 when no game databases exist

var kill_unless_game_on = function (id, response, nxt) { // This will be applied to each route that should only be able to be accessed if the game is on. If it isn't, the route 404s. I'll make the error prettier later
  if (module.exports.game_statuses[id].is_on !== 1) {
    var err = new Error('Not Found')
    err.status = 404
    nxt(err)
  }
}   // Provide for the game being off only allow access to the root of the /:game_id/ route

var kill_unless_game_off = function (id, response, nxt) { // This will be applied to each route that should only be able to be accessed if the game is off. If it isn't, the route 404s. I'll make the error prettier later
  if (module.exports.game_statuses[id].is_on !== 0) {
    var err = new Error('Not Found')
    err.status = 404
    nxt(err)
  }
}

var kill_unless_game_exists = function (id, response, nxt) {
  if (!(/^\d+$/.test(id)) || (module.exports.game_statuses['game_count'] < id)) { // Checks that the string is composed solely of digits, and that that sequence of digits is less than the current game_count
    var err = new Error('Not Found')
    err.status = 404
    nxt(err)
  }
}

instances_db.view('all/ids_and_metadata', function (err, res) { // Sets the above object to have list of live instances of the game, coupled with their game_on status.
  if (err) {
    console.error('Error in section 5242: ' + err.message)
  } else {
    res.forEach(function (key, row) {
      module.exports.game_statuses[key] = {is_on: row.is_on, winner_name: row.winner_name}
    })
  }
})

instances_db.get('game_counter', function (err, doc) {
  if (err) {
    console.error('Error in section 8761: ' + err.message)
  } else {
    module.exports.game_statuses['game_count'] = doc.val // Sets this object property to the total number of games upon server startup
  }
})
/* GET home page. */
router.get('/', function (req, res) {
  res.render('creator', {
    title: 'Create',
    new_game_id: null,
    error: null
  })
})
/* POST home page */
router.post('/', function (req, res) {
  // res.app.locals.comp = true < I thought I needed this, but I can get by evaluating completion based on if there were any errors submitting the request or not
  res.locals.err = null // replace these properties of the app with database calls?
  res.locals.new_game_id = null // This is null at the start. I don't want it to show up as undefined down the road and give me a hassle. It will only be called upon if the new game database is successfully created.
  var check_for_validity = new Promise(function (resolve, reject) {
    instances_db.view('all/ids_and_emails', function (err, resp) { // REMEMBER: 'res' is what we call the response for the entire route. Any responses given while retrieving the route must be given different names.
      if (err) {
        reject(err.message)
      } else if (resp.length === 0) {
        resolve('proceed')
      } else {
        var success_counter = 0
        resp.forEach(function (value) {
          if (value === String(req.body.email)) {
            reject('email_in_use')
          } else {
            success_counter++
            if (success_counter === resp.length) {
              resolve('proceed') // Checks though all instances. If no conflict, the promise is accepted.
            }
          }
        })
      }
    })
  })
  check_for_validity.then(function (result) {
    return new Promise(function (resolve, reject) {
      instances_db.get('game_counter', function (err, doc) {
        if (err) {
          console.error('Error: ' + err.message)
        }
        var number_of_games = Number(doc.val) + 1
        instances_db.merge('game_counter', {val: number_of_games}, function (err, resp) {
          if (err) {
            console.error('Error in section 9909: ' + err.message)
            res.locals.error = 'unknown'
          }
        })
        instances_db.save(String(number_of_games), { // saves metadata about each running game instance as a document in the 'instances' database
          email: req.body.email,
          is_game_on: 0,
          winner_name: null // Perhaps I'll add a field to measure when the games begin for easy referral, but not now
        }, function (err, resp) {
          if (err) {
            console.error('Error in section 9010: ' + err.message)
            res.locals.error = 'unknown'
          }
        })
        var create_new_database = new Promise(function (resolve, reject) {
          c.database('game_' + String(number_of_games)).create(function (err) { // CouchDB does not permit databases beginning with numbers. Thus, I must call upon these by starting them with 'game_'. Also, this is so far up on the chain above the next command related to this database because if the next command triggers right after this error is thrown, I'm given a 412. Yippee. Making a proimse here would work, but it's a simpler solution to move it up in the chain of executed commands.
            if (err) {
              console.error('Error creating (c.database(\'game_\' + String(number_of_games))): ' + err.message)
              res.locals.error = err.message
            } else {
              resolve('proceed')
            }
          })
        })
        create_new_database.then(function (result) {
          c.database('game_' + String(number_of_games)).save('_design/all', {
            views: {
              user_list: { // Will probably have more default views being generated here as I develop further.
                map: 'function (doc) { if (doc.name) { emit(doc, null) } }' // I like keeping this all as one line. Makes things concise.
              },
              alive_user_ids_and_target_ids: {
                map: 'function (doc) { if (doc.target_id && doc.alive === true) { emit(doc._id, doc.target_id) } }'
              }
            }
          })
          c.database('game_' + String(number_of_games)).save('game_on', { // Creates document 'game_on' with property 'val' set to 0
            val: 0,
            countdown: 0,
            game_start_time: null,
            game_end_time: null
          }, function (err, resp) {
            if (err) {
              console.error('Error in section 1123: ' + err.message)
            }
          })
        })
        if (res.locals.err === null) {
          res.locals.new_game_id = number_of_games
          module.exports.game_statuses[number_of_games] = {} // If I don't declare it's an object, when I try to set a property for it, it tells me it can't set the property of undefined.
          module.exports.game_statuses[number_of_games].is_on = 0 // This should have been set elsewhere surprised it wasn't already
          module.exports.game_statuses['game_count'] = number_of_games
          resolve('Success')
        } else {
          console.log('There was an error: ' + res.locals.err) // This means it won't resolve. However, it'll give me information to fix whatever's causing the problem.
        }
      })
    })
  }, function (err) {
    return new Promise(function (resolve, reject) {
      res.locals.err = err
      console.log('Set err to ' + err)
      resolve('Create')
    })
  }).then(function (answer) {
    res.render('creator', {
      title: answer, // Newest change ensure it works
      new_game_id: res.locals.new_game_id,
      error: res.locals.err
    })
  }, null) // This is unsightly
})

router.get('/:game_id', function (req, res, next) {
  res.locals.winner_name = null
  kill_unless_game_exists(req.params.game_id, res, next)
  var promise = new Promise(function (resolve, reject) { // Hopefully this will work. I'm not totally certain on the structure of promises in this case.
    if (module.exports.game_statuses[req.params.game_id].is_on === 1) {
      resolve('on')
    } else if (module.exports.game_statuses[req.params.game_id].is_on === 0) {
      resolve('off')
    } else { // The route is ensured to exist right before this promise is called. Had to change structure of module.exports.game_statuses because winner name was coming up null until I restarted the web server; have to store winner name data in this object now.
      resolve('over')
    }
  })
  promise.then(function (result) {
    res.render('landing', {
      title: 'Landing Page',
      game_status: result,
      winner_name: module.exports.game_statuses[req.params.game_id].winner_name,
      game_id: req.params.game_id
    })
  })
})

router.get('/:game_id/unregister', function (req, res, next) {
  kill_unless_game_off(req.params.game_id, res, next)
  res.render('unregister', {
    title: 'Unregister',
    game_id: req.params.game_id
  })
})

router.post('/:game_id/unregister', function (req, res, next) {
  kill_unless_game_off(req.params.game_id, res, next)
  res.locals.page_title = 'Unregister'
  var db = c.database('game_' + req.params.game_id)
  var check_for_key = new Promise(function (resolve, reject) {
    db.view('all/user_list', function (err, resp) {
      if (err) {
        resolve(err.message)
      } else if (resp.length === 0) {
        resolve('key_not_found')
      } else {
        var n = 0
        resp.forEach(function (key, row) {
          n++
          if (req.body.unregister_key === key.unregister_key) {
            db.remove(key._id, function (err, response) { // Names for the variable referring to responses will get more complex as loops become nested
              if (err) {
                res.locals.error = 'unknown'
                resolve('unknown')
              } else {
                res.locals.page_title = 'Unregistration Successful'
                resolve('unreigstered')
              }
            })
          } else if (n === resp.length) {
            res.locals.error = 'key_not_found'
            resolve('key_not_found')
          }
        })
      }
    })
  })
  check_for_key.then(function (message) {    // Creates syncronicity for unregistration, so the page is not rendered before all response properties have been properly set
    res.render('unregister', {
      title: res.locals.page_title,
      error: res.locals.error,
      game_id: req.params.game_id
    })
  }, null)
})

router.get('/:game_id/signup', function (req, res, next) {
  kill_unless_game_off(req.params.game_id, res, next)
  res.render('signup', {
    title: 'Sign-Up',
    game_id: req.params.game_id,
    error: null
  })
})
router.post('/:game_id/signup', function (req, res, next) {
  kill_unless_game_off(req.params.game_id, res, next)
  res.locals.submit_error = null
  res.locals.page_title = 'Sign-Up'
  var db = c.database('game_' + req.params.game_id)
  res.locals.user_id = (Math.floor((Math.random() * 10000000000))).toString()
  res.locals.unreg_key = (Math.floor((Math.random() * 10000000000))).toString()
  var obj = {}
  var check_if_values_in_use = new Promise(function (resolve, reject) {
    db.view('all/user_list', function (err, resp) {
      if (err) {
        console.error('Error in section 5833: ' + err.message) // All these numbers before error messages are arbitrary, but let me find the errors quickly with CTRL-F.
      } else {
        var response_counter = 0
        if (resp.length === 0) {
          resolve('proceed')
        } else {
          resp.forEach(function (key, row) { // Had (key,row) but I don't think I need 'row'
            obj[key._id] = 1 // Arbitrarily picked 1 as the value here it's not relevent. I just need the id to show up as part of this faux-hash. > {"3488842": 1}
            obj[key.unregister_key] = 1
            if (key.name === req.body.name.trim()) {
              res.locals.error = 'name_in_use'
              resolve('name_in_use')
            } else if (key.email === req.body.email.toLowerCase().trim()) {
              res.locals.error = 'email_in_use'
              resolve('email_in_use')
            }
            response_counter++
            if (response_counter === resp.length) {
              resolve('proceed')
            }
          })
        }
      }
    })
  })
  check_if_values_in_use.then(function (result) {
    return new Promise(function (resolve, reject) {
      if (result === 'proceed') { // Changed this from '... === undefined'. Not sure why it was like that. Also explicitly declaring it's null above now.
        while (obj[res.locals.user_id]) { // This set of two similar loops may ignore DRY conventions
          res.locals.user_id = (Math.floor((Math.random() * 10000000000))).toString()
          console.log('Re-running id generator.')
        }
        while (obj[res.locals.unreg_key]) {
          res.locals.unreg_key = (Math.floor((Math.random() * 10000000000))).toString()
          console.log('Re-running unregistration key generator.')
        }
        db.save(res.locals.user_id, {
          name: req.body.name.trim(),
          email: req.body.email.toLowerCase().trim(),
          unregister_key: res.locals.unreg_key,
          alive: true,
          time_of_death: null,
          method_of_death: null,
          killer: null,
          killword: null,
          target_id: null // the alive: true thing will change from being the default when I implement email verification
        }, function (err, resp) {
          if (err) {
            console.error('Error in section 1212: ' + err.message)
          } else {
            res.locals.page_title = 'Sign-Up Has Completed!'
            resolve('proceed')
            db.view('all/user_list', function (err, resp) { // If there are 10 people signed up, start the countdown to the beginning of the game.
              if (err) {
                console.error('Error in section 7654: ' + err.message)
              }
              if (resp.length > 4) { // this is not a value set in stone. I am seriously thinking it would be a good idea to make this a property in the database, choosable when you create your instance.
                db.get('game_on', function (err, doc) {
                  if (err) {
                    console.error('Error in section 3468: ' + err.message)
                  } else {
                    if (doc.countdown === 0) {
                      module.exports.event_emitter.emit('game_countdown', req.params.game_id)
                      db.merge('game_on', {countdown: 1}, function (err, doc) {
                        if (err) {
                          console.error('Error in section 1241: ' + err.message)
                        }
                      })
                    }
                  }
                })
              }
            })
          }
        })
      } else {
        resolve('proceed')
        console.log('proceeding, there was errors and stuff')
      }
    })
  }).then(function (output) {
    console.log('about to render now')
    res.render('signup', {
      title: res.locals.page_title,
      error: res.locals.error,
      game_id: req.params.game_id
    })
  })
})
// Routes when the game is on
router.get('/:game_id/info', function (req, res, next) {
  kill_unless_game_on(req.params.game_id, res, next)
  res.render('info', {
    title: 'Target Information',
    game_id: req.params.game_id // I had more here but I deleted it. Dunno what it was left over from. If you see this comment later in time, go ahead and delete it
  })
})

router.post('/:game_id/info', function (req, res, next) {
  kill_unless_game_on(req.params.game_id, res, next)
  res.locals.error = null
  res.locals.target_name = null
  res.locals.target_killword = null
  var db = c.database('game_' + req.params.game_id)
  var query_database = new Promise(function (resolve, reject) {
    db.get(req.body.key, function (err, doc) {
      if (err) {
        res.locals.error = 'not_found'
        console.error('Error in section 1919: ' + err.message)
        resolve('not_found')
      } else {
        db.get(doc.target_id, function (err, docu) {
          if (err) {
            res.locals.error = 'unknown'
            console.error('Error in section 2611: ' + err.message)
            resolve('unknown')
          } else {
            res.locals.target_name = docu.name
            res.locals.target_killword = docu.killword
            resolve('proceed')
          }
        })
      }
    })
  })
  query_database.then(function (result) {
    res.render('info', {
      title: 'Target Information',
      target_name: res.locals.target_name,
      target_killword: res.locals.target_killword,
      error: res.locals.error,
      game_id: req.params.game_id
    })
  }, null)
})
/* GET report a kill page */
router.get('/:game_id/report', function (req, res, next) {
  kill_unless_game_on(req.params.game_id, res, next)
  res.render('report', {
    title: 'Report a Kill',
    game_id: req.params.game_id
  })
})
router.post('/:game_id/report', function (req, res, next) {
  res.locals.error = null
  res.locals.new_target_name = null
  res.locals.new_target_killword = null
  res.locals.winner_name = null
  res.locals.page_title = 'Report a Kill'
  kill_unless_game_on(req.params.game_id, res, next)
  var db = c.database('game_' + req.params.game_id)
  var check_ids_validity_and_register_kill = new Promise(function (resolve, reject) {
    db.view('all/alive_user_ids_and_target_ids', function (err, resp) {
      if (err) {
        console.error('Error in section 6543: ' + err.message)
        res.locals.error = 'unknown'
      } else {
        var checked_ids = 0
        resp.forEach(function (key, val) {
          if (key === req.body.killer_key && val === req.body.target_key) {
            if (resp.length > 2) { // only execute this block if there are more targets for the killing
              db.get(val, function (err, response) {
                if (err) {
                  console.error('Error in section 6541: ' + err.message)
                } else {
                  db.get(response.target_id, function (err, doc) {
                    if (err) {
                      console.error('Error in section 7535: ' + err.message)
                    } else {
                      res.locals.new_target_name = doc.name
                      res.locals.new_target_killword = doc.killword
                    }
                  })
                  db.merge(key, {target_id: response.target_id}, function (err) {
                    if (err) {
                      console.error('Error in section 1624: ' + err.message)
                    } else {
                      db.merge(val, {alive: false, target_id: null, time_of_death: Date.now(), kill_method: req.body.kill_method}, function (err) {
                        if (err) {
                          console.error('Error in section 6341: ' + err.message)
                        } else {
                          res.locals.page_title = 'Kill Reported'
                          resolve('Kill Reported')
                        }
                      })
                    }
                  })
                }
              })
            } else if (resp.length === 2) {
              db.merge(val, {alive: false, target_id: null, time_of_death: Date.now(), kill_method: req.body.kill_method}, function (err) {
                if (err) {
                  console.error('Error in section 7463: ' + err.message)
                } else {
                  module.exports.event_emitter.emit('game_over', req.params.game_id)
                  res.locals.page_title = 'You Win!'
                  resolve('You Win!')
                }
              })
            }
          } else {
            checked_ids++
            if (checked_ids === resp.length) {
              res.locals.error = 'key_not_found'
              resolve('key_not_found')
            }
          }
        })
      }
    })
  })
  check_ids_validity_and_register_kill.then(function (result) {
    res.render('report', {
      title: res.locals.page_title,
      error: res.locals.error,
      new_target_name: res.locals.new_target_name,
      new_target_killword: res.locals.new_target_killword,
      game_id: req.params.game_id
    })
  })
})
/* GET leak page. */
router.get('/:game_id/leak', function (req, res, next) {
  kill_unless_game_on(req.params.game_id, res, next)
  res.render('leak', {
    title: 'LEAK INFORMATION',
    game_id: req.params.game_id
  })
})

/* POST leak page */
router.post('/:game_id/leak', function (req, res, next) {
  kill_unless_game_on(req.params.game_id, res, next)
  res.locals.page_title = 'LEAK INFORMATION'
  res.locals.error = null
  var db = c.database('game_' + req.params.game_id)
  var check_id_validity_and_commit_suicide = new Promise(function (resolve, reject) {
    db.view('all/alive_user_ids_and_target_ids', function (err, resp) {
      if (err) {
        console.error('Error in section 6543: ' + err.message)
        res.locals.error = 'unknown'
      } else {
        var checked_ids = 0
        resp.forEach(function (key, val) {
          if (val === req.body.key) {
            db.get(key, function (err, response) {
              if (err) {
                console.error('Error in section 6541: ' + err.message)
              } else {
                db.get(val, function (err, doc) {
                  if (err) {
                    console.error('Error in section 6438: ' + err.message)
                  } else {
                    db.merge(key, {target_id: doc.target_id}, function (err) {
                      if (err) {
                        console.error('Error in section 1624: ' + err.message)
                      } else {
                        db.merge(val, {alive: false, target_id: null, time_of_death: Date.now(), method_of_death: 'suicide'}, function (err) {
                          if (err) {
                            console.error('Error in section 6341: ' + err.message)
                          } else {
                            res.locals.page_title = 'INFORMATION LEAKED'
                            resolve('INFORMATION LEAKED')
                          }
                        })
                      }
                    })
                  }
                })
              }
            })
          } else {
            checked_ids++
            if (checked_ids === resp.length) {
              res.locals.error = 'key_not_found'
              resolve('key_not_found')
            }
          }
        })
      }
    })
  })
  check_id_validity_and_commit_suicide.then(function (result) {
    db.view('all/alive_user_ids_and_target_ids', function (err, resp) {
      if (err) {
        console.error('Error in section 7152: ' + err.message)
      } else {
        if (resp.length === 1) {
          module.exports.event_emitter.emit('game_over', req.params.game_id)
        }
      }
    })
    res.render('leak', {
      title: res.locals.page_title,
      error: res.locals.error,
      game_id: req.params.game_id
    })
  })
})
module.exports.routes = router
