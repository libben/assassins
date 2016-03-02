#!/usr/bin/env node

/**
 * Module dependencies.
 */

var app = require('../app')
var router = require('../routes/index')
var debug = require('debug')('Assassins:server')
var http = require('http')
var cradle = require('cradle')
var c = new (cradle.Connection)
var Promise = require('es6-promises')
var postmark = require('postmark')
var client = new postmark.Client('REPLACE')
var instances_db = c.database('instances')
/*
 * Get port from environment and store in Express.
 */

var port = normalizePort(process.env.PORT || '8080')
app.set('port', port)

/*
 * Create HTTP server.
 */

var server = http.createServer(app)

/*
 * Socketing protocol.
 */
var io = require('socket.io')(server)
io.on('connection', function (socket) {
  console.log('a user connected')
  socket.on('got_it', function (data) {
    console.log('- ' + data)
  })
  socket.on('disconnect', function () {
    console.log('a user disconnected')
  })
  socket.on('join', function (data) {
    console.log('user joined and says, "' + data + '"')
    socket.join(data)
  })
})
router.event_emitter.on('game_countdown', function (game_id) {
  var db = c.database('game_' + game_id)
  db.merge('game_on', {countdown: 1}, function (err, res) {
    if (err) {
      console.error('Error in section 1241: ' + err.message)
    }
  })
  db.get('game_on', function (err, doc) {
    if (err) {
      console.error('Error in section 6319: ' + err.message)
    } else {
      var count = doc.countdown_length
      var counter = setInterval(function () {
        console.log('emitted count_update')
        io.to(game_id).emit('count_update', count)
        count = count - 1
        // I'm saying to do this when the count is less than zero because when I set it to trigger at (count < 1) the timer disappeared when it showed the number 2.
        if (count < 0) {
          clearInterval(counter)
          // properties that can be accessed from the front end are explicitly declared; otherwise there would be a security lapse in which a client could view any facet of the game document
          io.to(game_id).emit('game_on', {kill_log: doc.kill_log, live_player_count: doc.live_player_count})
          db.merge('game_on', {val: 1, countdown: 0, game_start_time: Date.now()}, function (err, res) {
            if (err) {
              console.error('Error at location 4627: ' + err.message)
            }
          })
          instances_db.merge(game_id, {is_game_on: 1}, function (err, res) {
            if (err) {
              console.error('Error at location 2736: ' + err.message)
            } else {
              router.game_statuses[game_id].is_on = 1 // This setting doesn't have to be done within this loop, but that's what I'm doing
            }
          })
          db.view('all/user_list', function (err, res) {
            // Will stick this into a json file soon, so I can call upon multiple arrays of words
            var killword_list = ['Barrack Obama', 'Santa Claus', 'Justin Bieber', 'Ted Cruz', 'Donald Trump', 'Hillary Clinton', 'vista', 'Facebook', 'Batman', 'New Hampshire', 'Africa', 'Lucky Charms', 'Milky Way', 'South Dakota', 'Darth Vader', 'Kylo Ren', 'Han Solo', 'honey badger', 'George Clooney', 'Peyton Manning', 'Mike Trout', 'Jurassic Park', 'prime rib', 'Matt Damon', 'Leonardo DiCaprio', 'My Little Pony', 'West Virginia', 'Instagram', 'Snapchat', 'Twitter', 'Michigan']
            /* var simple_killword_list = ['tiger', 'eagle', 'bacon', 'temple', 'salmon', 'igloo', 'swimming pool', 'eraser']
            var comic_book_killword_list = ['Iron Man', 'Captain America', 'Thor', 'Batman', 'Wonder Woman', 'Beast Boy', 'Robin', 'Spiderman', 'Wolverine', 'Starfire', 'Doctor Octopus', 'Superman', 'Lex Luthor', 'Lois Lane', 'Doomsday', 'Doctor Doom', 'The Joker', 'Mr. Freeze', 'The Flash', 'Green Arrow', 'Clark Kent']
            var movie_killword_list = ['Titanic', 'Avatar', 'Pulp Fiction', 'Gone with the Wind', 'Citizen Kane', 'Vertigo', 'Shawshank Redemption', 'Ben Hur', 'Psycho', 'Inception', '2001: A Space Odyssey']
            var book_killword_list = ['The Bible', 'The Koran', 'The Great Gatsby', 'War and Peace', 'East of Eden', 'Atlas Shrugged', 'Slaughterhouse Five', 'Catch 22', 'The Iliad', 'The Odyssey', 'Death of a Salesman', 'To Kill a Mockingbird', 'Jane Eyre', 'The Scarlet Letter', 'The Hunger Games', 'Harry Potter', 'The Lion, the Witch, and the Wardrobe']*/
            if (err) {
              console.error('Error in section 1468: ' + err.message)
            } else {
              var set_killwords = new Promise(function (resolve, reject) {
                var successful_killword_attributions = 0
                var id_array = []
                res.forEach(function (key, val) {
                  // Arrays start at position zero, so I don't need to add a plus 1 at the end here
                  var random_number = Math.floor(Math.random() * killword_list.length)
                  db.merge(key._id, {killword: killword_list[random_number]}, function (err, response) {
                    if (err) {
                      console.error('Error in section 6541: ' + err.message)
                    } else {
                      id_array.push(key._id) // simplifies adding my ids to the array
                      client.sendEmail({
                        'From': 'mailbot@assassins.ga',
                        'To': key.email,
                        'Subject': 'The Game Has Begun',
                        'TextBody': 'It is time to play. Your access code at http://assassins.ga/' + game_id + '/info is ' + key._id
                      })
                      killword_list.splice(random_number, 1) // Removes one element starting at the place dictated by the random number. This ensures no two people get the same killword.
                      successful_killword_attributions++
                      if (successful_killword_attributions === res.length) {
                        if (router.game_statuses[game_id].live_player_count === 'true') {
                          router.game_statuses[game_id].live_player_count = id_array.length
                          instances_db.merge(game_id, {live_player_count: id_array.length}, function (err) {
                            if (err) {
                              console.error('Error in section 6430: ' + err.message)
                            }
                          })
                        }
                        resolve(id_array)
                      }
                    }
                  })
                })
              })
              set_killwords.then(function (output) {
                for (var i = 0; i < output.length - 2; i++) { // Wikipedia says length - 2 is the way you're supposed to do this. No clue why, but it works fine. Credits to Knuth, Fisher, and Yates for the basis for this shuffle
                  var j = Math.floor(Math.random() * (output.length - i)) // this loop scrambles the array
                  var original_i = output[i]
                  output[i] = output[i + j]
                  output[i + j] = original_i
                  if (i === output.length - 3) {
                    return output
                  }
                }
              }).then(function (output) {
                var merge_last_player = new Promise(function (resolve, reject) {
                  db.merge(output[output.length - 1], { target_id: output[0] }, function (err) {
                    if (err) {
                      console.error('Error in section 8772: ' + err.message)
                    }
                    resolve('proceed')
                  })
                })
                merge_last_player.then(function (result) {
                  for (var i = 0; i < output.length - 1; i++) {
                    db.merge(output[ i ], { target_id: output[i + 1] }, function (err) {
                      if (err) {
                        console.error('Error in section 9852: ' + err.message)
                      }
                    })
                  }
                })
              })
            }
          })
        }
      }, 1000)
    }
  })
})

/* Triggers when a game ends */
router.event_emitter.on('game_over', function (game_id) {
  router.game_statuses[game_id].is_on = null
  var db = c.database('game_' + game_id)
  db.merge('game_on', {game_end_time: Date.now()}, function (err) {
    if (err) {
      console.error('Error in section 6211: ' + err.message)
    }
  })
  db.view('all/alive_user_ids_and_target_ids', function (err, res) {
    if (err) {
      console.error('Error in section 4621: ' + err.message)
    } else {
      res.forEach(function (key, val) { // this loop should only set the value once
        db.get(key, function (err, doc) {
          if (err) {
            console.error('Error in section 5311: ' + err.message)
          } else {
            io.to(game_id).emit('game_over', doc.name)
            router.game_statuses[game_id].winner_name = doc.name
            router.game_statuses[game_id].game_log = true
            // Start showing a game log when the game is over
            instances_db.merge(game_id, {email: null, is_game_on: null, winner_name: doc.name, game_log: true}, function (err) {
              if (err) {
                console.error('Error in section 2473: ' + err.message)
              }
            })
          }
        })
      })
    }
  })
})

/* Triggers when someone is killed */

router.event_emitter.on('kill', function (data) {
  var db = c.database('game_' + data.game_id)
  // Subtract one from the live_player_count when someone's killed
  router.game_statuses[data.game_id].live_player_count --
  var killdata = {killer: data.killer, victim: data.victim, kill_method: data.kill_method}
  db.get('kills', function (err, res) {
    if (err) {
      console.error('Error in section 5328: ' + err.message)
    } else {
      var existing_kills = res.val
      existing_kills.push(killdata)
      db.merge('kills', {val: existing_kills}, function (err) {
        if (err) {
          console.error('Error in section 8311: ' + err.message)
        }
      })
    }
  })
  io.to(data.game_id).emit('kill', killdata)
})

/**
 * Listen on provided port, on all network interfaces.
 */

server.listen(port)
server.on('error', onError)
server.on('listening', onListening)

/**
 * Normalize a port into a number, string, or false.
 */

function normalizePort (val) {
  var port = parseInt(val, 10)

  if (isNaN(port)) {
    // named pipe
    return val
  }

  if (port >= 0) {
    // port number
    return port
  }

  return false
}

/**
 * Event listener for HTTP server "error" event.
 */

function onError (error) {
  if (error.syscall !== 'listen') {
    throw error
  }

  var bind = typeof port === 'string'
    ? 'Pipe ' + port
    : 'Port ' + port

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges')
      process.exit(1)
      break
    case 'EADDRINUSE':
      console.error(bind + ' is already in use')
      process.exit(1)
      break
    default:
      throw error
  }
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening () {
  var addr = server.address()
  var bind = typeof addr === 'string'
    ? 'pipe ' + addr
    : 'port ' + addr.port
  debug('Listening on ' + bind)
}
