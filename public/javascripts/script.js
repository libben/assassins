$(document).ready(function(){
  var game_id = location.pathname.match(/^\/(\d+)/)[1]; // Returns entry #2 in the array, which is the subgroup we want. note: .match() does not allow subgroups if the regular expression is ended with '/g'
  $('a').each(function() {
    if ($(this).attr('href') === location.pathname) {
      $(this).addClass('current-page');
    }
  });
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
    socket.emit('join', game_id);
  });
  socket.on('count_update', function (data) {
    socket.emit('got_it','Got your socket request with data: ' + data); // delete this line later
    document.getElementById('status').innerHTML = 'the game is: starting in ' + data + ' seconds';
    document.getElementById('nav-status').innerHTML = 'the game is: starting in ' + data + ' seconds';
  });
  socket.on('game_over', function (data) {
    slideout.close();
    document.getElementById('header').innerHTML = '<div class=\'lefty\'><a href=\'/' + game_id + '\' class=\'header-entry\'>Home</a></div><div class=\'lefty\'><a href=\'/' + game_id + '/log\' class=\'header-entry\'>Kill Log</a></div><div class=\'righty\'><p id=\'status\'>the game is: over. ' + data + ' has won!</p></div>'
  });
  socket.on('game_on', function () {
    document.getElementById('nav-ul').innerHTML = '<li class=\'nav-li\'><a href=\'/' + game_id + '/\' class=\'nav-entry\'>Home</a></li><li class=\'nav-li\'><a href=\'/' + game_id + '/info\' class=\'nav-entry\'>Get Target Information</a></li><li class=\'nav-li\'><a href=\'/' + game_id + '/report\' class=\'nav-entry\'>Report a Kill</a></li><li class=\'nav-li\'><a href=\'/' + game_id + '/suicide\' class=\'nav-entry\'>Suicide</a></li><li class=\'nav-li\'><a href=\'/' + game_id + '/log\' class=\'nav-entry\'>Kill Log</a></li><li class=\'nav-li\'><p id=\'nav-status\'>the game is: on</p></li>'
    document.getElementById('header').innerHTML = '<div class=\'lefty menu-bits\'><a href=\'/' + game_id + '/\' class=\'header-entry\'>Home</a></div><div class=\'lefty menu-bits\'><a href=\'/' + game_id + '/info\' class=\'header-entry\'>Get Target Information</a></div><div class=\'lefty menu-bits\'><a href=\'/' + game_id + '/report\' class=\'header-entry\'>Report a Kill</a></div><div class=\'lefty menu-bits\'><a href=\'/' + game_id + '/suicide\' class=\'header-entry\'>Suicide</a></div><div class=\'lefty menu-bits\'><a href=\'/' + game_id + '/log\' class=\'header-entry\'>Kill Log</a></div><div class=\'righty menu-bits\'><p id=\'status\'>the game is: on</p></div><div id=\'menu-hamburger\' class=\'righty\'><p id=\'toggle-button\'>☰</p></div>'
  });
});
