var userDetails = require('../middlewares/user');

module.exports = function (app, passport) {
    // =====================================
    // HOME PAGE (with login links) ========
    // =====================================
    app.get('/', function (req, res) {
        res.render('index.ejs'); // load the index.ejs file
    });


    // LOGIN ===============================

    // show the login form
    app.get('/api/v1/login', function (req, res) {

        // render the page and pass in any flash data if it exists
        res.render('login.ejs',{message: req.flash('loginMessage')});
    });

    // process the login form
    // app.post('/login', do all our passport stuff here);

    app.post('/api/v1/login', passport.authenticate('local-login', {
        successRedirect: '/profile', // redirect to the secure profile section
        failureRedirect: '/api/v1/login', // redirect back to the signup page if there is an error
        failureFlash: true // allow flash messages
    }));

    // =====================================
    // SIGNUP ==============================
    // =====================================
    // show the signup form
    app.get('/api/v1/signup', function (req, res) {

        // render the page and pass in any flash data if it exists
        res.render('signup.ejs');
    });

    // process the signup form
    // app.post('/signup', do all our passport stuff here);
    app.post('/api/v1/signup', passport.authenticate('local-signup', {
        successRedirect: '/api/v1/profile', // redirect to the secure profile section
        failureRedirect: '/api/v1/signup', // redirect back to the signup page if there is an error
        failureFlash: true // allow flash messages
    }));
    //Get the details of logged in user
    app.get('/api/v1/me', userDetails.getUserDetails, function (req, res) {
        console.log('user', req.showMetric.userDetails);
        // res.render({text:'hello'});
        //res.json({ id: req.user.id, username: req.user.username });
    });

    // =====================================
    // PROFILE SECTION =====================
    // =====================================
    // we will want this protected so you have to be logged in to visit
    // we will use route middleware to verify this (the isLoggedIn function)
    app.get('/profile', function (req, res) {
        console.log('user', req.user);
        res.render('profile.ejs');
    });
    app.get('/api/v1/signout', function (req,res) {
        req.logout();
        //res.render('signup.ejs');
    });

    module.exports = app;
};