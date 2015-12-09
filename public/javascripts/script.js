$(document).ready(function(){
  var socket = io.connect('http://localhost:3000');
  socket.on('connect', function(data) {
    socket.emit('join','Hello world from client');
  });
  socket.on('count_update', function(data) {
    socket.emit('got_it','Got your socket request.');
    document.getElementById('countdown_text').innerHTML = data + ' seconds until game begins.';
  });
  socket.on('game_on', function() {
    var timey = document.getElementById('countdown_text');
    timey.parentNode.removeChild(timey); // Stack Overflow says javascipt permits infanticide, but not suicide, that's why it's like this
  });
  $('.Unpressed').click(function(){
    if (document.getElementById('querybutton').classList[2] === 'Unpressed') {
      $('#btn').removeClass('Unpressed');    // Change from pressable
      $('#btn').addClass('Pressed');        // to unpressable
      socket.emit('query',document.getElementById('key').value);
      socket.on('response', function(data) {
        $('body').append('<h3> Name: '+ data.name + '</h3>');
        $('body').append('<h3> Killword: '+ data.killword + '</h3>');
        $('body').append('<br>');
      })
      i = 0;
      function rem() {
        var x = '<p id="c">'+(10-i)+'</p>';
        $('#c').remove();
        $('body').append(x);
        i++;
        if (i>9) {
          clearInterval(foo);
          location.reload();
        }
      var bar = setTimeout(function() {$('body').append('<p>Seconds until reload:</p>');}, 1200);
      var foo = setInterval(rem, 1200);
      }
    }
  });
});
