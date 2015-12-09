# Assassins

Automated administrator for games of [Assassin](https://en.wikipedia.org/wiki/Assassin_\(game\)).

###What you need:

1. CouchDB server with a database called "Assassins" for storing players

2. RabbitMQ server

3. Node.js (installed globally)

Start your CouchDB and RabbitMQ servers, go to your project directory, then fire up your Node.js server with
`DEBUG=libben.github.io:* npm start`

### Known bugs:
Changing app.locals.game_on from /bin/www does not affect which routing file is used as I hoped it would. This is probably due to some property of Express.js I don't know about; fret not, there's a few things I can think of to try to work around this problem.

### Next big project: set up automated outbound email.

### Note to self:
For goodness' sake, learn Git, Ben.
http://www.git-scm.com/book/en/v2
