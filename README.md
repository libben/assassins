# Assassins

Automated administrator for games of [Assassin](https://en.wikipedia.org/wiki/Assassin_\(game\)).

###What you need:

1. CouchDB server

2. Node.js (installed globally)

Start your CouchDB server, go to your project directory, then fire up your Node.js server with
`DEBUG=libben.github.io:* npm start`

### Known bugs:
none

### Notes:
Jade doesn't like being asked to conditionally extend templates.


### To-do:
- rewrite your querying to be a POSTed form rather than using sockets [COMPLETE]
- rewrite your socketing to emit only to connections viewing the webpages with a certain property in the URL... if such can be done. [COMPLETE]
- seek out: can RabbitMQ be eliminated? [ANSWER: YES, NOW IT HAS BEEN DONE]
- BIG STEP: write logic for reporting a kill
- create email server, then set up email-based authentication for people signing up to the game.
- insert options for each site instance in the create-a-site form... what language of kill-words do you want? How complex? What kill modes are available? How many people needed to start game? How much time between criteria for game start being met and the game actually starting?
- BIG STEP: create live feed of kills with sockets :)
- multiple routing files; app.js should check a database to see if (a) the number of instances is equal or greater than the url parameter being called and (b) whether or not the game is on for that database. Should probably add game_on property to running instances db.
- set up grunt or gulp to streamline starting the servers you need into one command

Tidbit: if info needs to be sent to ONE socket, check out the default room documentation on socket.io's site; each new socket joins a room named after its id.
Other tidbit: if you need something special, socket.io-redis and socket.io-emitter are pretty neat!
