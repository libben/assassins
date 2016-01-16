# Assassins

Automated administrator for games of [Assassin](https://en.wikipedia.org/wiki/Assassin_\(game\)).

###What you need:

1. CouchDB server (databases needs currently under review)

2. RabbitMQ server

3. Node.js (installed globally)

Start your CouchDB and RabbitMQ servers, go to your project directory, then fire up your Node.js server with
`DEBUG=libben.github.io:* npm start`

### Known bugs:
none atm, I'm deep into changing the structure so it wouldn't run as-is anyway.

Ok, it's time for a restructure. Here we go. (A) move game_on to be a property within the database. Instantiate by using routing with /[pattern]/page with each instance having a different collection in the database.

Thus begins the great conversion from req.app to res for information storage within requests.

Current next step: restructure index.jade to fit the parameters its being sent.
