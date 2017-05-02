require('dotenv').load();
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var uglifyJs = require('uglify-js');
var fs = require('fs');
var passport = require('passport');
var session = require('express-session');
var MongoStore = require('connect-mongo')(session);
/*var gracenote = require('node-gracenote');
var clientID = "";
var cleintTag = "";
var userId = "";
var api = new Gracenote(clientId,clientTag,userId);
api.register(function(err, uid) {
    if(err){
      console.log(err);
    }else{
      console.log("UID: "+uid)
    }
});
*/

require('./app_api/models/db');
require('./app_api/config/passport');

var routesFan = require('./app_fantasy/routes/index');
var routesAPI = require('./app_api/routes/index');
//var users = require('./routes/users');

var app = express();

//session setup
if (app.get('env') === 'development') {
	app.use(session({
		secret: 'superdupers3cre7',
		resave: true,
		saveUninitialized: true,
		store: new MongoStore({
			url: 'mongodb://localhost/mySite'
		})
	}))
}else{
	app.use(session({
		secret: 'superdupers3cre7',
		resave: true,
		saveUninitialized: true,
		store: new MongoStore({
			url: process.env.MONGOLAB_URI
		})
	}))
}
app.listen(8090);
// view engine setup
app.set('views', path.join(__dirname, 'app_fantasy', 'views'));
app.set('view engine', 'jade');

//uglify
var angularFiles = [
  //'public/javascripts/bootstrap-switch.js',
  'public/javascripts/angular-toggle-switch.js',
  'public/javascripts/angular-fullscreen.js',
  'app_client/common/services/service.bowser.js',
  'app_client/app.js',
  'app_client/common/services/service.videoManip.js',
  'app_client/common/services/service.detectBrowser.js',
  'app_client/common/services/service.mySiteData.js',
  'app_client/common/services/service.authentication.js',
  'app_client/common/services/service.imageMan.js',
  'app_client/home/home.controller.js',
  'app_client/auth/login/login.controller.js',
  'app_client/auth/register/register.controller.js',
  'app_client/common/directives/pageHeader/pageHeader.directive.js',
  'app_client/common/directives/blogList/blogList.directive.js',
  'app_client/common/directives/background_video/background_video.directive.js',
  'apps/app_calendar/controllers/home.js',
  'apps/app_calendar/app.js',
  'apps/app_blog/controllers/home.js',
  'apps/app_blog/app.js',
  'apps/app_social_stream/providers/facebook.js',
  'apps/app_social_stream/controllers/home.js',
  'apps/app_social_stream/app.js',
  'apps/app_social_stream/directives/facebookLogin.directive.js',
  'apps/app_social_stream/directives/facebook.directive.js',
  'apps/app_social_stream/directives/navbar.directive.js',
];
var uglified = uglifyJs.minify(angularFiles, { compress : false });
fs.writeFile('app_client/lib/mySite.min.js', uglified.code, function (err){
  if(err) {
    console.log(err);
  } else {
    console.log('Script generated and saved: mySite.min.js');
  }
});

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'app_client')));
app.use(express.static(path.join(__dirname, 'apps')));
app.use(express.static(path.join(__dirname, 'bower_components')));
app.use('/api', routesAPI);
app.use('/fan', routesFan);
app.use(function(req, res) {
  if(req.path.includes("calendar")){
    res.sendFile(path.join(__dirname, 'apps', 'app_calendar', 'index.html'));
  }else if(req.path.includes("social")){
	    res.sendFile(path.join(__dirname, 'apps', 'app_social_stream', 'index.html'));
  }else if(req.path.includes("blog")){
    res.sendFile(path.join(__dirname, 'apps', 'app_blog', 'index.html'));
  }else if(req.path.includes("terms")){
    res.sendFile(path.join(__dirname, 'apps', 'app_terms', 'MySite-Terms.htm'));
  }else if(req.path.includes("privacy")){
    res.sendFile(path.join(__dirname, 'apps', 'app_privacy', 'MySiteprivacypolicy.htm'));
  }else if(req.path.includes("webhook")){
	  if (req.body["hub.verify_token"] === 'abc123') {
		  res.status(200).send(req.body["hub.challenge"]);
	  }else if(!req.body["hub.verify_token"]){
		  if(req.body["hub.challenge"]){
			  res.status(200).send(req.body["hub.challenge"]);
		  }else if(req.params["hub.challenge"]){
			  res.status(200).send(req.params["hub.challenge"]);
		  }else if(req.query["hub.challenge"]){
			  res.status(200).send(req.query["hub.challenge"]);
		  }else{
			  res.sendStatus(400).end();
		  }
	  }else{
		  res.sendStatus(400).end();
	  }
  }else{
    res.sendFile(path.join(__dirname, 'app_client', 'index.html'));
  }
});
app.use(passport.initialize());

// error handlers
// Catch unauthorised errors
app.use(function (err, req, res, next) {
  if (err.name === 'UnauthorizedError') {
    res.status(401);
    res.json({"message" : err.name + ": " + err.message});
  }
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});

//Set CORS
app.use(function(req, res, next) {
	  res.header("Access-Control-Allow-Origin", "*");
	  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
	  next();
	});


module.exports = app;
