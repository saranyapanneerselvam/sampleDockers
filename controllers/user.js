var userDetails = require('../middlewares/user');

module.exports = function (app, passport) {

    // HOME PAGE (with login links)
    app.get('/', function (req, res) {
        if (req.user) res.redirect('/profile')
        else res.render('index.ejs'); // load the index.ejs file
    });


    // LOGIN ===============================

    app.get('/privacy', function (req, res) {
        res.render('privacy.ejs'); // load the Privacy Policy file
    });


    // show the login form
    app.get('/api/v1/login', function (req, res) {
        console.log(req.connection,req.connection.remoteAddress);
        var ip = req.headers['x-forwarded-for'] ||
            req.connection.remoteAddress ||
            req.socket.remoteAddress ||
            req.connection.socket.remoteAddress;
        console.log('ipaddress',ip)
        if (req.user) res.redirect('/profile')
        else
        // render the page and pass in any flash data if it exists
            res.render('login', {message: req.flash('loginMessage')});
    });

    // process the login form - app.post('/login', do all our passport stuff here);
    app.post('/api/v1/login', passport.authenticate('local-login', {
        successRedirect: '/profile', // redirect to the secure profile section
        failureRedirect: '/api/v1/login', // redirect back to the signup page if there is an error
        failureFlash: true // allow flash messages
    }));

    // SIGNUP - show the signup form
    app.get('/api/v1/signup', function (req, res) {

        // render the page and pass in any flash data if it exists
        res.render('signup.ejs', {message: req.flash('signupMessage')});
    });

    // process the signup form - app.post('/signup', do all our passport stuff here);
    app.post('/api/v1/signup', passport.authenticate('local-signup', {
        successRedirect: '/profile', // redirect to the secure profile section
        failureRedirect: '/api/v1/signup', // redirect back to the signup page if there is an error
        failureFlash: true // allow flash messages
    }));

    app.post('/api/v1/changePassword', userDetails.getUserPassword, function (req, res) {
        res.redirect('/api/v1/login');
    });

    //Get the details of logged in user
    app.get('/api/v1/me', userDetails.getUserDetails, function (req, res) {
        res.json({userDetails: req.app.result});
    });

    // =====================================
    // PROFILE SECTION =====================
    // =====================================
    // we will want this protected so you have to be logged in to visit
    // we will use route middleware to verify this (the isLoggedIn function)
    app.get('/profile', function (req, res) {
        if (req.user)
            res.render('profile.ejs');
        else
            res.redirect('/api/v1/login');
        //res.status(401).json({error:'Authentication required to perform this action'})
    });

    app.get('/signout', function (req, res) {
        req.logout();
        res.redirect('/');

    });

    app.post('/api/v1/updateLastDashboardId/:id', userDetails.updateLastDashboardId, function (req, res) {
        res.json(req.app.result);
    });

    app.get('/customDataDocumentation', function (req, res) {
        res.render('customDataDocumentation.ejs'); // load the index.ejs file
    });
};