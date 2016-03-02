$(document).ready(function () {
  var socket = io();
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
    document.getElementById('header').innerHTML = '<div class=\'lefty\'><a href=\'/' + game_id + '\' class=\'header-entry\'>Home</a></div><div class=\'righty\'><p class=\'status\' id=\'status\'>the game is: over. ' + data + ' has won!</p></div>'
  });
  socket.on('game_on', function (options) { // pass object of options when the game starts; properties include live_player_count (either false or positive integer) & kill_log (boolean)
    var set_kill_log_option = new Promise (function (resolve, reject) {
      if (options.kill_log) {
        resolve({nav_kill_log: '<li class=\'nav-li\'><a href=\'/' + game_id + '/log\' class=\'nav-entry\'>Kill Log</a></li>', header_kill_log: '<div class=\'lefty menu-bits\'><a href=\'/' + game_id + '/log\' class=\'header-entry\'>Kill Log</a></div>'})
      } else {
        resolve({nav_kill_log: '', header_kill_log: ''})
      }
    })
    set_kill_log_option.then(function(result) {
      if (options.live_player_count) { // this will be a 'false' boolean if we are not passing player counts to the front end
        result.nav_live_player_count = '<li class=\'nav-li\'><p class=\'nav-status\' id=\'nav_live_player_count\'>' + options.live_player_count + ' players still alive</p></li>';
        result.header_live_player_count = '<div class=\'righty menu-bits\'><p class=\'status\' id=\'header_live_player_count\'>' + options.live_player_count + ' players still alive</p></div>';
        return result;
      } else {
        result.nav_live_player_count = '';
        result.header_live_player_count = '';
        return result;
      }
    }).then(function(result) {
      document.getElementById('nav-ul').innerHTML = '<li class=\'nav-li\'><a href=\'/' + game_id + '/\' class=\'nav-entry\'>Home</a></li><li class=\'nav-li\'><a href=\'/' + game_id + '/info\' class=\'nav-entry\'>Get Target Information</a></li><li class=\'nav-li\'><a href=\'/' + game_id + '/report\' class=\'nav-entry\'>Report a Kill</a></li><li class=\'nav-li\'><a href=\'/' + game_id + '/suicide\' class=\'nav-entry\'>Suicide</a></li>' + result.nav_kill_log +'<li class=\'nav-li\'><p id=\'nav-status\' class=\'nav-status\'>the game is: on</p>' + result.nav_live_player_count + '</li>'
      document.getElementById('header').innerHTML = '<div class=\'lefty menu-bits\'><a href=\'/' + game_id + '/\' class=\'header-entry\'>Home</a></div><div class=\'lefty menu-bits\'><a href=\'/' + game_id + '/info\' class=\'header-entry\'>Get Target Information</a></div><div class=\'lefty menu-bits\'><a href=\'/' + game_id + '/report\' class=\'header-entry\'>Report a Kill</a></div><div class=\'lefty menu-bits\'><a href=\'/' + game_id + '/suicide\' class=\'header-entry\'>Suicide</a></div>' + result.header_kill_log +'<div class=\'righty menu-bits\'><p id=\'status\' class=\'status\'>the game is: on</p></div>' + result.header_live_player_count + '<div id=\'menu-hamburger\' class=\'righty\'><p id=\'toggle-button\'>☰</p></div>'
    })
  });
  socket.on('kill', function () {
    if (document.getElementById('live_player_count')) {
      // find the sequence of digits at the beginning of the string
      var old_count = document.getElementById('live_player_count').innerHTML.match(/^d+/);
      document.getElementById('nav_live_player_count').innerHTML = old_count - 1 + ' players still alive';
      document.getElementById('header_live_player_count').innerHTML = old_count - 1 + ' players still alive';
    }
  });
});
