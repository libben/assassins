$(document).ready(function(){
  $('.btn-up').click(function(){
    if (document.getElementById('btn').classList[1] === 'btn-up') {
      $('#btn').removeClass('btn-up');    // Change from pressable
      $('#btn').addClass('btn-p');        // to unpressable
      $('body').append('<h3>[placeholder text]</h3>');
      $('body').append('<br>');
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
      }
      var bar = setTimeout(function() {$('body').append('<p>Seconds until reload:</p>');}, 1500);
      var foo = setInterval(rem, 1500);
    }
  });
});
