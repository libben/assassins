$(document).ready(function(){
  var game_id = location.pathname.match(/^\/(\d+)/)[1]; // Returns entry #2 in the array, which is the subgroup we want. note: .match() does not allow subgroups if the regular expression is ended with '/g'
  var socket = io();
  socket.on('connect', function (data) {
    socket.emit('join', game_id); // For some reason at some point I didn't think I needed this. Re-evaluate later.
  });
  socket.on('kill', function (data) {
    console.log('got your kill request')
    // remove p#nokills if it exists, then create the kills list
    if (document.getElementById('nokills')) {
      var nokills_alias = document.getElementById('nokills');
      nokills_alias.parentNode.removeChild(nokills_alias);
      var kills_list = document.createElement('ul');
      kills_list.setAttribute('id', 'kills');
      document.body.appendChild(kills_list);
    }
    var previous_contents = document.getElementById('kills').innerHTML;
    if (data.kill_method === 'suicide') {
      document.getElementById('kills').innerHTML = '<div class=\'row\'><li><p class=\'col-md-7\'>' + data.killer + ' leaked information and was dealt with accordingly.</p></li></div>' + previous_contents;
    } else {
      document.getElementById('kills').innerHTML = '<div class=\'row\'><li><p class=\'col-md-2\'>' + data.killer + '</p><p class=\'col-md-1\'>killed</p><p class=\'col-md-2\'>' + data.victim + '<p class=\'col-md-1\'>via</p><p class=\'col-md-1\'>' + data.kill_method + '.</p></li></div>' + previous_contents;
    }
  });
});
