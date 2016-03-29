// server.js

// set up ======================================================================
// get all the tools we need
var express = require('express');
var router = express.Router();
var app = express();
var path = require('path');
var port = process.env.PORT || 8080;
var mongoose = require('mongoose');
var passport = require('passport');
var flash = require('connect-flash');
var morgan = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var mongoStore = require('connect-mongo')(session);
var configDB = require('./config/database.js');
var sessionConfig = {
    secret: 'ilovescotchscotchyscotchscotch',
    store: new mongoStore({
        mongooseConnection: mongoose.connection
    })
}
// configuration ===============================================================
mongoose.connect(configDB.url); // connect to our database
mongoose.set('debug',true);

require('./helpers/passport')(passport); // pass passport for configuration

// set up our express application
app.use(morgan('dev')); // log every request to the console
app.use(cookieParser()); // read cookies (needed for auth)
app.use(bodyParser()); // get information from html forms

app.set('view engine', 'ejs'); // set up ejs for templating
//app.set('views', path.join(__dirname, 'views/'));
// required for passport
//app.use(session({secret: 'ilovescotchscotchyscotchscotch'})); // session secret
app.use(session(sessionConfig));
app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions
app.use(flash()); // use connect-flash for flash messages stored in session

//app.use(express.static(path.join(__dirname, './views')));
//app.set('views', path.join(__dirname, 'public/views'));
app.use(express.static(__dirname + '/public'));
app.use('/bower_components',  express.static(__dirname + '/bower_components'));

// routes ======================================================================
require('./controllers/facebookAuth')(app);
require('./controllers/googleAuth')(app);
require('./controllers/twitterAuth')(app);
require('./controllers/channels')(app);
require('./controllers/metrics')(app);
require('./controllers/profiles')(app);
require('./controllers/dashboards')(app);
require('./controllers/widgets')(app);
require('./controllers/objects')(app);
require('./controllers/getPageMetricResult')(app);
require('./controllers/updateDashboardWidgetData')(app);
require('./controllers/user')(app, passport);
require('./controllers/facebookInsights')(app);


router.use(function (req, res, next) {
    req.showMetric = {};
    next();
})

// launch ======================================================================
app.listen(port);
console.log('The magic happens on port ' + port);