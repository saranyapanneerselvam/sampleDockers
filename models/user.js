// app/models/user.js
// load the things we need
var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');

// define the schema for our user model
var userSchema = mongoose.Schema({
    orgId: String,
    name: String,
    email: String,
    phoneNo: String,
    pwdHash: String,
    emailVerified: Boolean,
    emailVerification: {
        tokenId: String,
        expires: Date,
        used: Boolean
    },
    passwordReset: {
        tokenId: String,
        expires: Date,
        used: Boolean
    },
    roleId: Object,
    dashboards: Array,
    lastLoggedIn: Date,
    lastDashboardId: Object,
    active: Boolean,
    created: Date,
    updated: Date,
    deleted: Date
});

// methods ======================
// generating a hash
userSchema.methods.generateHash = function (password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

// checking if password is valid
userSchema.methods.validPassword = function (password) {
    return bcrypt.compareSync(password, this.pwdHash);
};

// create the model for users and expose it to our app
module.exports = mongoose.model('User', userSchema);