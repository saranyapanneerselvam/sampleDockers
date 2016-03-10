// config/passport.js

// load all the things we need
var LocalStrategy = require('passport-local').Strategy;
var FacebookStrategy = require('passport-facebook').Strategy;
var TwitterStrategy = require('passport-twitter').Strategy;
//var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
var GoogleTokenProvider = require('refresh-token').GoogleTokenProvider;

// load up the organization model
var Organization = require('../models/organizations');

// load up the user model
var User = require('../models/user');

// load the auth variables
var configAuth = require('./../config/auth');

// expose this function to our app using module.exports
module.exports = function (passport) {

    // =========================================================================
    // passport session setup ==================================================
    // =========================================================================
    // required for persistent login sessions
    // passport needs ability to serialize and unserialize users out of session

    // used to serialize the user for the session
    passport.serializeUser(function (user, done) {
        done(null, user.id);
    });

    // used to deserialize the user
    passport.deserializeUser(function (id, done) {
        User.findById(id, function (err, user) {
            // console.log('user',user);
            done(err, user);
        });
    });

    // =========================================================================
    // LOCAL SIGNUP ============================================================
    // =========================================================================
    // we are using named strategies since we have one for login and one for signup
    // by default, if there was no name, it would just be called 'local'

    passport.use('local-signup', new LocalStrategy({

            // by default, local strategy uses username and password, we will override with email
            usernameField: 'email',
            passwordField: 'password',
            passReqToCallback: true // allows us to pass back the entire request to the callback
        },
        function (req, email, password, done) {
            console.log('local signup', req);
            // asynchronous
            // User.findOne wont fire unless data is sent back
            process.nextTick(function () {

                // find a user whose email is the same as the forms email
                // we are checking to see if the user trying to login already exists
                User.findOne({'email': email}, function (err, user) {
                    // if there are any errors, return the error
                    if (err)
                        return done(err);

                    // check to see if theres already a user with that email
                    if (user) {
                        return done(null, false, req.flash('signupMessage', 'That email is already taken.'));
                    } else {
                        console.log('req body', req.body);
                        // if there is no user with that email

                        //create the organization
                        var newOrganization = new Organization();
                        newOrganization.name = req.body.organization,
                            newOrganization.country = req.body.country;
                        newOrganization.created = new Date();
                        newOrganization.updated = new Date();
                        // save the Organization
                        newOrganization.save(function (err, response) {
                            console.log('db response', response);
                            if (err)
                                return done(err);
                            else {
                                // create the user
                                var newUser = new User();
                                console.log('newUser', newUser);
                                // set the user's local credentials
                                newUser.email = req.body.email;
                                newUser.name = req.body.name;
                                newUser.pwdHash = newUser.generateHash(req.body.password);
                                newUser.phoneNo = newUser.phone;
                                newUser.orgId = response._id;
                                newUser.created = new Date();
                                newUser.updated = new Date();

                                // save the user
                                newUser.save(function (err, user) {
                                    if (err)
                                        return done(err);
                                    return done(null, user);
                                });
                            }
                            //return done(null, newUser);
                        });

                    }

                });

            });

        }));

    // =========================================================================
    // LOCAL LOGIN =============================================================
    // =========================================================================
    // we are using named strategies since we have one for login and one for signup
    // by default, if there was no name, it would just be called 'local'

    passport.use('local-login', new LocalStrategy({
            // by default, local strategy uses username and password, we will override with email
            usernameField: 'email',
            passwordField: 'password',
            passReqToCallback: true // allows us to pass back the entire request to the callback
        },
        function (req, email, password, done) { // callback with email and password from our form

            //In this we are assigning email to sess.email variable.
            //email comes from HTML page.

            // find a user whose email is the same as the forms email
            // we are checking to see if the user trying to login already exists
            User.findOne({'email': req.body.email}, function (err, user) {
                // if there are any errors, return the error before anything else

                if (err)
                    return done(err);

                // if no user is found, return the message
                if (!user)
                    return done(null, false, req.flash('loginMessage', 'No user found.')); // req.flash is the way to set flashdata using connect-flash

                // if the user is found but the password is wrong
                if (!user.validPassword(req.body.password))
                    return done(null, false, req.flash('loginMessage', 'Oops! Wrong password.')); // create the loginMessage and save it to session as flashdata
                req.session.user = user;

                //Update the last login time
                var date = new Date();
                User.update({
                    'orgId': req.session.user.orgId,
                    '_id': req.session.user._id
                }, {$set: {'lastLoggedIn': date}}, function (err) {
                    if (!err)

                    // all is well, return successful user
                        return done(null, user);
                })


            });

        }));


    // =========================================================================
    // FACEBOOK ================================================================
    // =========================================================================
    passport.use('facebook', new FacebookStrategy({

            // pull in our app id and secret from our auth.js file
            clientID: configAuth.facebookAuth.clientID,
            clientSecret: configAuth.facebookAuth.clientSecret,
            callbackURL: configAuth.facebookAuth.callbackURL,
            profileFields: ["emails", "displayName"]

        },

        // facebook will send back the token and profile
        function (token, refreshToken, profile, done) {
            //console.log("Comes here.....");
            //console.log(profile);

            // asynchronous
            process.nextTick(function () {

                // find the user in the database based on their facebook id
                User.findOne({'facebook.id': profile.id}, function (err, user) {

                    // if there is an error, stop everything and return that
                    // ie an error connecting to the database
                    if (err)
                        return done(err);

                    // if the user is found, then log them in
                    if (user) {
                        return done(null, user); // user found, return that user
                    } else {
                        // if there is no user found with that facebook id, create them
                        var newUser = new User();


                        // set all of the facebook information in our user model

                        console.log("The profile details are --->");
                        console.log(profile);
                        newUser.facebook.id = profile.id; // set the users facebook id
                        newUser.facebook.token = token; // we will save the token that facebook provides to the user
                        newUser.facebook.name = profile.displayName; // look at the passport user profile to see how names are returned
                        newUser.facebook.email = profile.emails[0].value; // facebook can return multiple emails so we'll take the first

                        // save our user to the database

                        newUser.save(function (err) {
                            if (err)
                                throw err;

                            // if successful, return the new user
                            return done(null, newUser);
                        });
                    }

                });
            });

        }));

    // =========================================================================
    // TWITTER =================================================================
    // =========================================================================
    passport.use(new TwitterStrategy({

            consumerKey: configAuth.twitterAuth.consumerKey,
            consumerSecret: configAuth.twitterAuth.consumerSecret,
            callbackURL: configAuth.twitterAuth.callbackURL

        },
        function (token, tokenSecret, profile, done) {

            // make the code asynchronous
            // User.findOne won't fire until we have all our data back from Twitter
            process.nextTick(function () {

                User.findOne({'twitter.id': profile.id}, function (err, user) {

                    // if there is an error, stop everything and return that
                    // ie an error connecting to the database
                    if (err)
                        return done(err);

                    // if the user is found then log them in
                    if (user) {
                        return done(null, user); // user found, return that user
                    } else {
                        // if there is no user, create them
                        var newUser = new User();

                        // set all of the user data that we need
                        newUser.twitter.id = profile.id;
                        newUser.twitter.token = token;
                        newUser.twitter.username = profile.username;
                        newUser.twitter.displayName = profile.displayName;

                        // save our user into the database
                        newUser.save(function (err) {
                            if (err)
                                throw err;
                            return done(null, newUser);
                        });
                    }
                });

            });

        }));

    // =========================================================================
    // GOOGLE ==================================================================
    // =========================================================================


};