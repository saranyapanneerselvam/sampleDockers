// server.js

// set up ======================================================================
// get all the tools we need
var express = require('express');
var router = express.Router();
var app = express();
var fs = require('file-system');
var path = require('path');
var port = process.env.PORT || 8080;
var mongoose = require('mongoose');
var FileStreamRotator = require('file-stream-rotator')
var passport = require('passport');
var flash = require('connect-flash');
var morgan = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var mongoStore = require('connect-mongo')(session);
var moment = require('moment');
var configDB = require('./config/database.js');
//Load the auth file
var configAuth = require('./config/auth');
var sessionConfig = {
    secret: 'ilovescotchscotchyscotchscotch',
    store: new mongoStore({
        mongooseConnection: mongoose.connection
    })
};
var nodemailer = require('nodemailer');
var https = require('https');

// configuration ===============================================================
mongoose.connect(configDB.url); // connect to our database
mongoose.set('debug',true);

require('./helpers/passport')(passport); // pass passport for configuration

//For redirecting http to https
app.use(function(req,res,next){
    if(req.get('X-Forwarded-Proto')=='http'){
        res.redirect('https://datapoolt.co');
    }else{
        next();
    }
});
var logDirectory = __dirname + configAuth.dataFormat.folderName

// ensure log directory exists
fs.existsSync(logDirectory) || fs.mkdirSync(logDirectory)

// create a rotating write stream
var accessLogStream = FileStreamRotator.getStream({
    date_format:configAuth.dataFormat.dateFormat,
    filename: logDirectory + '/errorLog-%DATE%.log',
    frequency: configAuth.dataFormat.frequency
})
app.use(morgan('dev')); // log every request to the console
/*
app.use(morgan({format:configAuth.dataFormat.logDataFormat,stream: {
    write: function(str)
    {
        accessLogStream.write(str);
    }
},skip:function (req, res) { return res.statusCode < 400 }}));
*/
app.use(cookieParser()); // read cookies (needed for auth)
app.use(bodyParser({limit: "50mb"})); // get information from html forms
app.set('view engine', 'ejs'); // set up ejs for templating
app.set('views', path.join(__dirname, 'views/'));
app.use(session(sessionConfig));
app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions
app.use(flash()); // use connect-flash for flash messages stored in session

app.use(express.static(__dirname + '/public'));
app.use('/bower_components',  express.static(__dirname + '/bower_components'));
app.post('/getinvite', function(req,res){

    var formName = req.body.name;
    var formEmail = req.body.email;
    var formPhoneNumber = req.body.phonenumber;
    var formCustomerType = req.body.typeofcustomer;

    verifyRecaptcha(req.body['g-recaptcha-response'], function(success) {
        if (success) {
            // Email Setup
            var transporter = nodemailer.createTransport({
                service: 'Zoho',
                auth: {
                    user: 'invites@datapoolt.co',
                    pass: 'Invites!@#$'
                }
            });
            var mailOptions = {
                from: 'Datapoolt Invites <invites@datapoolt.co>',
                to: 'natarajan@asod.in',
                subject: 'Beta invite Submission',
                // Plain Text Version
                text: 'You have a submission with the following details... Name: '+formName +'Email: '+formEmail +'Phone Number: '+formPhoneNumber + 'Type: '+ formCustomerType,
                // HTML Version
                html: '<p>You got a website submission with the following details...</p>' +
                '<ul>' +
                '<li>Name: <b>'+formName+'</b></li>' +
                '<li>Email: <b>'+formEmail+'</b></li>' +
                '<li>Phone Numer: <b>'+formPhoneNumber+'</b></li>' +
                '<li>Type of customer: <b>'+formCustomerType+'</b></li>'
            };
            var mailOptionsSubmitter = {
                from: 'Datapoolt Invites <invites@datapoolt.co>',
                to: formEmail,
                subject: formName + ', we\'ve received your request for an invite' ,
                // Plain Text Version
                text: 'Aloha, ' + formName + '\n We have received your request for an invite. Expect it very soon in your inbox. Thanks for trying us out. Cheers!',
                // HTML Version
                html: '<p>Aloha,' + formName + '</p>' +
                '<p> We have received your request for an invite. Expect it very soon in your inbox. </p> <p>Thanks for trying us out. Cheers!</p>'
            };
            // Send
            transporter.sendMail(mailOptions, function(error, info){
                if(error)
                    res.redirect('/');
                else
                    res.redirect('/');
            });
            transporter.sendMail(mailOptionsSubmitter, function(error, info){
                if(error){
                    console.log(error);
                }else{
                    console.log('Invite confirmation message sent: ' + info.response);
                }
            });
        } else {
            res.redirect('/');
        }
    });

    function verifyRecaptcha(key, callback) {
        https.get("https://www.google.com/recaptcha/api/siteverify?secret=" + '6LeeViITAAAAADQAkoMFXtVUginSmkkN0XIpPIy3' + "&response=" + key, function(res) {
            var data = "";
            res.on('data', function (chunk) {
                data += chunk.toString();
            });
            res.on('end', function() {
                try {
                    var parsedData = JSON.parse(data);
                    callback(parsedData.success);
                } catch (e) {
                    callback(false);
                }
            });
        });
    }
});

// routes ======================================================================
require('./controllers/facebookAdsAuth')(app);
require('./controllers/facebookAuth')(app);
require('./controllers/googleAuth')(app);
require('./controllers/twitterAuth')(app);
require('./controllers/aweberAuth')(app);
require('./controllers/vimeoAuth')(app);
require('./controllers/instaAuth')(app);
require('./controllers/pinterestAuth')(app);
require('./controllers/instaAuth')(app);
require('./controllers/mailChimpAuth')(app);
require('./controllers/linkedInAuth')(app);
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
require('./controllers/referenceWidgets')(app);
require('./controllers/customIdentity')(app);
require('./controllers/customChannelData')(app);
require('./controllers/recommendedDashboard')(app);
require('./controllers/exportHtml5ToPDF')(app);
require('./controllers/alert')(app);
require('./controllers/bgFetchUpdation')(app);
require('./controllers/youTubeAuth')(app);

router.use(function (req, res, next) {
    req.app = {};
    next();
});

// launch ======================================================================
app.listen(port);
/*https.createServer({
    key: fs.readFileSync('./key.pem', 'utf8'),
    cert: fs.readFileSync('./server.crt', 'utf8')
}, app).listen(port);*/
console.log('The magic happens on port ' + port);
