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
};
var nodemailer = require('nodemailer');
// configuration ===============================================================
mongoose.connect(configDB.url); // connect to our database
mongoose.set('debug',false);

require('./helpers/passport')(passport); // pass passport for configuration

// set up our express application
app.use(morgan('dev')); // log every request to the console
app.use(cookieParser()); // read cookies (needed for auth)
app.use(bodyParser()); // get information from html forms

app.set('view engine', 'ejs'); // set up ejs for templating
app.set('views', path.join(__dirname, 'views/'));
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

app.post('/getinvite', function(req,res){

    var transporter = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
            user: 'natarajan@asod.in',
            pass: 'Pr0wl3r14'
        }
    });

// Email Setup
    var mailOptions = {
        from: 'Datapoolt Team <natarajan@asod.in>',
        to: 'natarajan@showmetric.co',
        subject: 'Beta invite Submission',
        // Plain Text Version
        text: 'You have a submission with the following details... Name: '+req.body.name +'Email: '+req.body.email +'Phone Number: '+req.body.phonenumber + 'Type: '+ req.body.typeofcustomer,
        // HTML Version
        html: '<p>You got a website submission with the following details...</p>' +
        '<ul>' +
        '<li>Name: <b>'+req.body.name+'</b></li>' +
        '<li>Email: <b>'+req.body.email+'</b></li>' +
        '<li>Phone Numer: <b>'+req.body.phonenumber+'</b></li>' +
        '<li>Type of customer: <b>'+req.body.typeofcustomer+'</b></li>'
    };

// Send
    transporter.sendMail(mailOptions, function(error, info){
        if(error){
            console.log(error);
            res.redirect('/');
        }else{
            console.log('Message sent: ' + info.response);
            res.redirect('/');
        }
    });

});
// routes ======================================================================
require('./controllers/facebookAdsAuth')(app);
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
require('./controllers/googleAdwordsAuth')(app);
require('./controllers/pdfExport')(app);
require('./controllers/referenceWidgets')(app);
require('./controllers/customIdentity')(app);
require('./controllers/customChannelData')(app);
require('./controllers/recommendedDashboard')(app);

router.use(function (req, res, next) {
    req.app = {};
    next();
});

// launch ======================================================================
app.listen(port);
console.log('The magic happens on port ' + port);