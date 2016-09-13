var userDetails = require('../middlewares/user');
var userActivity = require('../helpers/user');
var configAuth = require('../config/auth');

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
        if (req.user && req.user.emailVerified==true) res.redirect('/profile');
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
        successRedirect: '/api/v1/signup', // redirect to the secure profile section
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

    app.post('/api/v1/updateLastDashboardId/:id', userDetails.updateLastDashboardId, function (req, res) {
        res.json(req.app.result);
    });

    app.get('/customDataDocumentation', function (req, res) {
        res.render('../public/customDataDocumentation.ejs'); // load the index.ejs file
    });
    
    app.get('/forgotPassword',function (req,res) {
        res.render('../public/getEmail.ejs',{message:null})
    });

    /**
     Function to get email from user and check whether it is registered or not,
     if registered redirect to success message page else show error message
     */
    app.get('/checkAlreadyUserExist',function (req,res) {
        userActivity.checkUserExist(req,res,function (err,user) {
            if(err) return res.status(500).json({error: 'Internal Server Error'});
            else if(!user.isExist) res.render('../public/getEmail.ejs', {message: 'Please enter a registered mail id!'});
            else {
                req.userEmail = user.mailId;
                userActivity.generateToken(req,res,function (err,tokenResponse) {
                    res.render('../public/getEmail.ejs', {message: 'Verification link is sent to your email . Please verify to reset your password !'});
                    //res.render('../public/emailSuccessPage.ejs',{mailId:tokenResponse.mailId,message:'Verification link is sent to your email . Please verify to reset your password !'})
                })
            }
        });
    });
    
    app.get('/verifyUserToken',function (req,res) {
        userActivity.verifyToken(req,res,function (err,tokenUser) {
            if(tokenUser.isTokenValid===true) res.render('../public/passwordRegeneration.ejs',{mailId:tokenUser.user.email});
            else{
                req.logout();
                req.flash('loginMessage','Your link is expired !')
                res.redirect('/api/v1/login');
            }
        });
    });
    app.get('/updateNewPassword',function(req,res){
        userActivity.updateNewPassword(req,res,function(err,updatedUser){
            req.logout();
            req.login(updatedUser.user, function(err) {
                if (err)  return err;
                res.redirect('/profile');
            });
        })
    })
    app.get('/api/v1/emailVerification',userDetails.emailVerification,function(req,res){
        req.logout();
        if(req.app.result.status==configAuth.emailVerification.verified){
            req.session.user=req.app.result.user;
            req.login(req.app.result.user, function(err) {
                if (err)  return err;
                res.redirect('/profile');
            });
        }
        else if(req.app.result.status==configAuth.emailVerification.alreadyVerified){
            req.flash('loginMessage','This account is already verified.Please login to use datapoolt.')
            res.redirect('/api/v1/login');
        }
        else if(req.app.result.status==configAuth.emailVerification.mailResend){
            req.flash('signupMessage','Your activation link has expired.Please check your mail for new activation link')
            res.redirect('/api/v1/signup');
        }
        else if(req.app.result.status==configAuth.emailVerification.inValid){
            req.flash('signupMessage','Your activation link is invalid');
            res.redirect('/api/v1/signup');
        }
    });

};