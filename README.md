# Assassins

Automated administrator for games of [Assassin](https://en.wikipedia.org/wiki/Assassin_\(game\)).

###What you need:

1. CouchDB server

2. Node.js (installed globally)

Start your CouchDB server, go to your project directory, then fire up your Node.js server with
`DEBUG=Assassins:* npm start`

### Known bugs:
none

### Notes:
Jade doesn't like being asked to conditionally extend templates. Check out streaming build systems; see if this project would benefit from them.

Do I want to enable two-person games? I don't think so, we shouldn't need that.

The live kill feed may one day be merged into a portion of the landing page.

I made kills part of a document of its own to avoid document update conflicts when the game is ending.

### To-do:
- make routes that shouldn't be accessed redirect to the landing page instead of 404'ing [COMPLETE]
- create email server, set up sending out of unregistration id at sign-up and actual ID at game start [COMPLETE]
- force inputs to match regex patterns [COMPLETE]
- make each input in the forms on the various views display on a new line [COMPLETE]
- [ALPHA RELEASE]
- add a favicon.ico
- insert options for each site instance in the create-a-site form...

what language of kill-words do you want?

How complex?

What kill modes are available?

How many people needed to start game? [COMPLETE]

How much time between criteria for game start being met and the game actually starting? [COMPLETE] 

- BIG STEP: create live feed of kills with sockets :) > it may also log a game-start event at the beginning of the game. [COMPLETE, NO GAME START EVENT CURRENTLY]
- set up email-based authentication for people signing up to the game.
- create a front-end to speak of [WORKING ON IT]
- [NEXT RELEASE (DEVELOPMENT FURTHER THAN THIS POINT IS UNKNOWN)]

Tidbit: if info needs to be sent to ONE socket, check out the default room documentation on socket.io's site; each new socket joins a room named after its id.
Other tidbit: if you need something special, socket.io-redis and socket.io-emitter are pretty neat!
