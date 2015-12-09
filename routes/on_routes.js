var express = require('express');
var router = express.Router();
var http = require('http');
/* GET home page. */
router.get('/', function(req, res) { // I have this route in both router files. Not DRY. Probably should adjust
  res.render('index', {
      title: 'Home',
      game_on: true
  });
});
router.get('/info', function(req, res) {
  res.render('info', {
    title: 'Target Information',
    label: 'Target ID',
    button_type: 'querybutton' // All the backend querying happens at /bin/www
  });
});
/* GET report a kill page */
router.get('/report', function(req, res) {
  res.render('index', {
    title: 'Report a Kill'
  });
});
/* GET leak page. */
router.get('/leak', function(req, res) {
  res.render('index', {
    title: 'LEAK INFORMATION'
  });
});

module.exports = router;
