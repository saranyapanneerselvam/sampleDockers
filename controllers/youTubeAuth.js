module.exports = function (app) {
    var request = require('request');
    var user = require('../helpers/user');
    var channels = require('../models/channels');
    var Object = require('../models/objects');
    var ObjectType = require('../models/objectTypes');

    // load the auth variables
    var configAuth = require('../config/auth');
    var googleapis = require('googleapis');//To use google api'
    var OAuth2 = googleapis.auth.OAuth2;
    var oauth2 = require('simple-oauth2')({
        clientID: configAuth.youTubeAuth.clientID,
        clientSecret: configAuth.youTubeAuth.clientSecret,
        site: configAuth.youTubeAuth.site,
        tokenPath: configAuth.youTubeAuth.tokenPath,
        authorizationPath: configAuth.youTubeAuth.authorizationPath
    });

    // Authorization uri definition
    var authorization_uri = oauth2.authCode.authorizeURL({
        redirect_uri: configAuth.youTubeAuth.callbackURL,
        approval_prompt: configAuth.youTubeAuth.approvalPrompt,
        access_type: configAuth.youTubeAuth.accessType,
        scope: configAuth.youTubeAuth.scope,
        state: configAuth.youTubeAuth.state
    });

    // Initial page redirecting to Github
    app.get(configAuth.youTubeAuth.localCallingURL, function (req, res) {
        res.redirect(authorization_uri);
    });

    // Callback service parsing the authorization token and asking for the access token
    app.get(configAuth.youTubeAuth.localCallbackURL, function (req, res) {
        var code = req.query.code;
        oauth2.authCode.getToken({
            code: code,
            redirect_uri: configAuth.youTubeAuth.callbackURL
        }, saveToken);

        function saveToken(error, result) {
            if (error) return res.status(401).json({error: 'Authentication required to perform this action'});
            token = oauth2.accessToken.create(result);

            //To get logged user's userId ,email..
            request('https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=' + token.token.access_token, function (error, response, body) {
                if (!error && response.statusCode == 200) {

                    //To get the profile name .. based on access token
                    request('https://www.googleapis.com/youtube/v3/channels?access_token=' + token.token.access_token+'&part=snippet&mine=true', function (err, responseData, result) {
                        if (!err) {

                            //To parse the access token details
                            var parsedBodyResult = JSON.parse(result);

                            //set the body into userdata
                            req.userEmail = parsedBodyResult.items[0].snippet.title;
                            req.userId = parsedBodyResult.items[0].id;
                            req.profileName = parsedBodyResult.items[0].snippet.title;

                            //set token details to tokens
                            req.tokens = token.token;
                            channels.findOne({code: configAuth.channels.youtube}, function (err, channelDetails) {
                                req.channelId = channelDetails._id;
                                req.channelName = channelDetails.name;
                                req.channelCode = channelDetails._id;

                                //Calling the storeProfiles middleware to store the data
                                user.storeProfiles(req, function (err, response) {
                                    if (err)
                                        res.json('Error');
                                    else {
                                        res.send('success')

                                        //If response of the storeProfiles function is success then render the successAuthentication page
                                        Object.findOne({'profileId':response._id} , function(err, object){
                                            if (err)
                                                return res.status(500).json({error: err});
                                            
                                            else{
                                                if(object!=null){
                                                    res.render('successAuthentication');
                                                }
                                                else{
                                                    ObjectType.findOne({'channelId':response.channelId},function(err,objectTypeList){
                                                        if (err)
                                                            return res.status(500).json({error: err});
                                                        else if (!objectTypeList)
                                                            return res.status(204).json({error: 'No records found'});
                                                        else{
                                                            var  storeObject = new Object();
                                                            storeObject.profileId = response._id;
                                                            storeObject.channelObjectId=req.userId;
                                                            storeObject.name=response.name;
                                                            storeObject.objectTypeId=objectTypeList._id;
                                                            storeObject.updated=new Date();
                                                            storeObject.created=new Date();
                                                            storeObject.save(function(err,objectListItem){
                                                                if(!err){
                                                                    res.render('successAuthentication');
                                                                }
                                                            });
                                                        }

                                                    });
                                                }
                                            }

                                        });
                                    }
                                });
                            });
                        }
                        else return res.status(401).json({error: 'Authentication required to perform this action'});
                    })
                }
            })
        }
    })
};