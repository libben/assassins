$(document).ready(function(){
  var socket = io.connect('http://localhost:3000'); // Wow, I really don't need this script on pages without the /:game_id/ parameter! How interesting.
  socket.on('connect', function(data) {
    socket.emit('join','Hello world from client'); // Will delete later
    socket.join(game_id); // should join the channel to the game_id being passed to it
  });
  socket.on('count_update', function(data) {
    socket.to(game_id).emit('got_it','Got your socket request.'); // delete this line later
    document.getElementById('countdown_text').innerHTML = data + ' seconds until game begins.';
  });
  socket.on('game_on', function() {
    var countdown_timer = document.getElementById('countdown_text');
    countdown_timer.parentNode.removeChild(timey); // Stack Overflow says javascipt permits infanticide, but not suicide, that's why it's like this
  });
});
