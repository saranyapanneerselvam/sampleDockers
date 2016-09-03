var userDetails = require('../middlewares/user');
var userActivity = require('../helpers/user');
var limitcheck=require('../helpers/pricing')
module.exports = function (app, passport) {

    // HOME PAGE (with login links)
    app.get('/', function (req, res) {
        if (req.user) res.redirect('profile');
        else res.render('../public/home.ejs'); // load the index.ejs file
    });


    // LOGIN ===============================

    app.get('/privacy', function (req, res) {
        res.render('../public/privacy.ejs'); // load the Privacy Policy file
    });

    app.get('/pricing', function (req, res) {
        res.render('../public/pricing.ejs');
    });

    app.get('/features', function (req, res) {
        res.render('../public/productfeatures.ejs');
    });

    app.get('/faqs', function (req, res) {
        res.render('../public/faqs.ejs');
    });

    app.get('/integrations', function (req, res) {
        res.render('../public/integrations.ejs');
    });

    // show the login form
    app.get('/api/v1/login', function (req, res) {
        if (req.user) res.redirect('/profile');
        else
            // render the page and pass in any flash data if it exists
            res.render('../public/login.ejs', {message: req.flash('loginMessage')});
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
        res.render('../public/signup.ejs', {message: req.flash('signupMessage')});
    });

    // process the signup form - app.post('/signup', do all our passport stuff here);
    app.post('/api/v1/signup', passport.authenticate('local-signup', {
        successRedirect: '/profile', // redirect to the secure profile section
        failureRedirect: '/api/v1/signup', // redirect back to the signup page if there is an error
        failureFlash: true // allow flash messages
    }));

    app.post('/api/v1/changePassword', userDetails.getUserPassword, function (req, res) {

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
        if (req.user){
            userActivity.saveUserActivity(req,res,function(err,userReponse){});
            res.render('../public/profile.ejs');
        }
        else res.redirect('/api/v1/login');
    });
    app.get('/reports', function (req, res) {
        res.render('../public/reports.ejs');
    });

    app.get('/signout', function (req, res) {
        req.logout();
        res.redirect('/');
    });
    //get available dashboards or widgets or alerts
    app.get('/api/v1/subscriptionLimits',function (req, res) {
        if (req.user){
            limitcheck.checkUserSubscriptionLimit(req,res,function(err,response){
                res.json(response);
            });
        }
        else res.status(401).json({error: 'Authentication required to perform this action'});
    })
    app.post('/api/v1/updateLastDashboardId/:id', userDetails.updateLastDashboardId, function (req, res) {
        res.json(req.app.result);
    });

    app.get('/customDataDocumentation', function (req, res) {
        res.render('../public/customDataDocumentation.ejs'); // load the index.ejs file
    });
};