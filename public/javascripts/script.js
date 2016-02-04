$(document).ready(function(){
  var game_id = location.pathname.match(/^\/(\d+)\//)[1]; // Returns entry #2 in the array, which is the subgroup we want. note: .match() does not allow subgroups if the regular expression is ended with '/g'
  var socket = io(); // Syntax stays like this until deployment
  socket.on('connect', function(data) {
    socket.emit('join', game_id); // For some reason at some point I didn't think I needed this. Re-evaluate later.
  });
  socket.on('count_update', function(data) {
    socket.emit('got_it','Got your socket request with data: ' + data); // delete this line later
    document.getElementById('countdown_text').innerHTML = data + ' seconds until game begins.';
  });
  socket.on('game_on', function() {
    var countdown_timer = document.getElementById('countdown_text');
    countdown_timer.parentNode.removeChild(countdown_timer); // Stack Overflow says javascipt permits infanticide, but not suicide, that's why it's like this
  });
});
