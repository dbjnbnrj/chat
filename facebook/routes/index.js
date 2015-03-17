var express = require('express');
var FacebookChat = require("facebook-chat");
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res) {
  res.render('index', { title: 'SecChat for Facebook' });
});

// GET /auth/facebook
//   Use passport.authenticate() as route middleware to authenticate the
//   request.  The first step in Facebook authentication will involve
//   redirecting the user to facebook.com.  After authorization, Facebook will
//   redirect the user back to this application at /auth/facebook/callback
router.get('/auth/facebook',
  passport.authenticate('facebook', { scope: ['read_stream', 'publish_actions', 'xmpp_login'] }),
  function(req, res){
    // The request will be redirected to Facebook for authentication, so this
    // function will not be called.
  });

// GET /auth/facebook/callback
//   Use passport.authenticate() as route middleware to authenticate the
//   request.  If authentication fails, the user will be redirected back to the
//   login page.  Otherwise, the primary route function function will be called,
//   which, in this example, will redirect the user to the home page.
router.get('/auth/facebook/callback', 
  passport.authenticate('facebook', { failureRedirect: '/' }),
  function(req, res) {
    res.redirect('/fbchat');
});

router.get('/fbchat', ensureAuthenticated, function(req, res) {
  console.log(req.user);
  res.render('account', { user: req.user });
});


router.get('/logout', function(req, res){
  req.logout();
  res.redirect('/');
});


// Simple route middleware to ensure user is authenticated.
//   Use this route middleware on any resource that needs to be protected.  If
//   the request is authenticated (typically via a persistent login session),
//   the request will proceed.  Otherwise, the user will be redirected to the
//   login page.
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) { return next(); }
  res.redirect('/')
}

module.exports = router;
