# Assassins

Automated administrator for games of [Assassin](https://en.wikipedia.org/wiki/Assassin_\(game\)).

###What you need:

1. CouchDB server

2. Node.js (installed globally)

Start your CouchDB server, go to your project directory, then fire up your Node.js server with
`DEBUG=Assassins:* npm start`

### Known bugs:
if a game changes status from off to on, starting the game, and someone changes their window size so the hamburger kicks in, the hamburger won't work until they reload their page

### Notes:
Jade doesn't like being asked to conditionally extend templates. Check out streaming build systems; see if this project would benefit from them.

Do I want to enable two-person games? I don't think so, we shouldn't need that.

The live kill feed may one day be merged into a portion of the landing page.

I made kills part of a document of its own to avoid document update conflicts when the game is ending.

### To-do:
- add a favicon.ico
- add instructions on how the game works; it wasn't clear for someone I tested the game with. [COMPLETE]
- modular set of kill words -- movies, video games, Bible, famous people, default, simple words, complex words
- allow range of kill options to include upon one's choice
- make kill log optional [COMPLETE]
- option of having a counter displaying how many people are still alive [COMPLETE]
- option of a page listing who is still in the game
- option to whitelist only certain emails to be able to sign up
- email blacklist option
- range of people -- if input is [5, 10] start long timer when 5 players are signed-up, and the actual countdown one at the end of that, or trigger the countdown immediately if 10 players sign up before the long timer winds down
- BIG STEP: create live feed of kills with sockets :) > it may also log a game-start event at the beginning of the game. [COMPLETE, NO GAME START EVENT CURRENTLY]
- set up email-based authentication for people signing up to the game.

Tidbit: if info needs to be sent to ONE socket, check out the default room documentation on socket.io's site; each new socket joins a room named after its id.
Other tidbit: if you need something special, socket.io-redis and socket.io-emitter are pretty neat!
