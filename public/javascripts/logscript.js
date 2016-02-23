$(document).ready(function() {
  var game_id = location.pathname.match(/^\/(\d+)/)[1]; // Returns entry #2 in the array, which is the subgroup we want. note: .match() does not allow subgroups if the regular expression is ended with '/g'
  $('a').each(function() {
    if ($(this).attr('href') === location.pathname) {
      $(this).addClass('current-page');
    }
  })
  var slideout = new Slideout({
    'panel': document.getElementById('panel'),
    'menu': document.getElementById('menu'),
    'side': 'right',
    'padding': 256,
    'tolerance': 70
  });
  $('#toggle-button').on('click', function() {
    slideout.toggle();
  });
  var socket = io();
  socket.on('connect', function (data) {
    socket.emit('join', game_id); // For some reason at some point I didn't think I needed this. Re-evaluate later.
  });
  socket.on('kill', function (data) {
    // remove p#nokills if it exists, then create the kills list
    if (document.getElementById('nokills')) {
      var nokills_alias = document.getElementById('nokills');
      nokills_alias.parentNode.removeChild(nokills_alias);
      var kills_list = document.createElement('ul');
      kills_list.setAttribute('id', 'kills');
      var container = document.getElementById('container');
      container.appendChild(kills_list);
    }
    var previous_contents = document.getElementById('kills').innerHTML;
    if (data.kill_method === 'suicide') {
      document.getElementById('kills').innerHTML = '<li><p class=\'suicide\'>' + data.killer + ' committed suicide.' + previous_contents;
    } else {
      document.getElementById('kills').innerHTML = '<li><p class=\'killer name\'>' + data.killer + '</p><p class=\'killed flavor\'>killed</p><p class=\'victim name\'>' + data.victim + '<p class=\'via flavor\'>via</p><p class=\'method\'>' + data.kill_method + '.</p></li>' + previous_contents;
    }
  });
  socket.on('game_over', function (data) {
    slideout.close();
    document.getElementById('header').innerHTML = '<div class=\'lefty\'><a href=\'/' + game_id + '\' class=\'header-entry\'>Home</a></div><div class=\'lefty\'><a href=\'/' + game_id + '/log\' class=\'header-entry\'>Kill Log</a></div><div class=\'righty\'><p id=\'status\'>the game is: over. ' + data + ' has won!</p></div>'
  });
});
