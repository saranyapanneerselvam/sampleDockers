var configAuth = require ('../config/auth');
var channels = require('../models/channels');
var objects = require('../models/objects');
var objectType = require('../models/objectTypes');
var request = require('request');
var user = require('../helpers/user');
module.exports = function(app) {

    var oauth2 = require('simple-oauth2')({
        clientID: configAuth.vimeoAuth.clientID,
        clientSecret: configAuth.vimeoAuth.clientSecret,
        site: configAuth.vimeoAuth.site,
        tokenPath: configAuth.vimeoAuth.tokenPath,
        authorizationPath: configAuth.vimeoAuth.authorizationPath
    });

    var authorization_uri = oauth2.authCode.authorizeURL({
        redirect_uri: configAuth.vimeoAuth.redirect_uri,
        scope: configAuth.vimeoAuth.scope,
        state: configAuth.vimeoAuth.state
    });


    app.get(configAuth.vimeoAuth.localCallingURL, function (req, res) {
        res.redirect(authorization_uri);
    });

    app.get(configAuth.vimeoAuth.localCallbackURL, function (req, res) {

        var code = req.query.code;
        oauth2.authCode.getToken({
            code: code,
            redirect_uri: configAuth.vimeoAuth.redirect_uri
        }, saveToken);



        function saveToken(error, result) {


            if (error) {
                return res.status(401).json({error: 'Authentication required to perform this action'});
            }

            var accessToken = result.access_token;

            request(configAuth.vimeoAuth.accessTokenURL + accessToken, function (error, response, body) {

                if (!error && response.statusCode == 200) {
                    var parsedData = JSON.parse(body);

                    req.userId = parsedData.uri.split("/")[2];
                    req.profileName = parsedData.name;
                    req.userEmail=parsedData.name;
                    req.tokens = accessToken;

                    channels.findOne({code: configAuth.channels.vimeo}, function (err, channelDetails) {

                        if (err)
                            return res.status(500).json({error: err});
                        else if (!channelDetails)
                            return res.status(204).json({error: 'No records found'});
                        else {
                            req.channelId = channelDetails._id;
                            req.channelName = channelDetails.name;
                            req.channelCode = channelDetails.code;
                            req.code=channelDetails.code;
                            // req.userEmail = profile.email;
                           // req.userId = profile.id;

                           user.storeProfiles(req,res, function (err,response) {

                                if (err) res.json('Error');
                                else {
                                            /*objectType.find({'channelId': response.channelId}, function (err, objectTypeList) {

                                                if (err)
                                                    return res.status(500).json({error: err});
                                                else if (!objectTypeList.length)
                                                    return res.status(204).json({error: 'No records found'});
                                                else {
                                                    for (var key = 0; key < objectTypeList.length; key++) {
                                                        var objectIds = objectTypeList[key]._id;
                                                        if (objectTypeList[key].type === configAuth.objectType.vimeochannel) {
                                                            var query = 'https://api.vimeo.com/users/' + response.userId + '/channels?access_token='
                                                            getObjectLists(query,objectIds);

                                                        }
                                                        else {
                                                            var query = 'https://api.vimeo.com/users/' + response.userId + '/videos?access_token='

                                                            getObjectLists(query,objectIds);
                                                        }
                                                    }
                                                        function getObjectLists(query,objectIds) {
                                                            var objectsName = objectTypeList[key].type;


                                                            // var acurl='https://api.vimeo.com/users/'+response.userId+'/channels?access_token='

                                                            request(query  + result.access_token, function (error, result, body) {

                                                                var parsedData = JSON.parse(body);


                                                                if (!parsedData.data) {

                                                                    res.render('successAuthentication');
                                                                }
                                                                else {
                                                                    for (var i = 0; i < parsedData.total;i++) {




                                                                    var objectItem = new objects();
                                                                    var profileId = response._id;
                                                                    var name = parsedData.data[i].name;
                                                                    var objectTypeId = objectIds;
                                                                    var channelObjectId = parsedData.data[i].uri.split("/")[2]
                                                                    var updated = new Date();
                                                                    var created = new Date();

                                                                    objects.update({
                                                                        profileId: response._id,
                                                                        channelObjectId: channelObjectId
                                                                    }, {
                                                                        $setOnInsert: {created: created},
                                                                        $set: {
                                                                            name: name,
                                                                            objectTypeId: objectTypeId,
                                                                            updated: updated
                                                                        }
                                                                    }, {upsert: true}, function (err, objectListItem) {

                                                                        console.log(objectListItem);
                                                                        if (err)
                                                                            return res.status(500).json({error: 'Internal server error'});
                                                                        else if (!objectListItem)
                                                                            return res.status(204).json({error: 'No records found'});

                                                                    })
                                                                }
                                                                }

                                                            })


                                                        }
                                                        res.render('../public/successAuthentication');

                                                }

                                            })*/
                                    res.render('../public/successAuthentication');


                                }
                            });

                        }


                    })

                  /* console.log('req.tokens',req.tokens);
                  //  res.render('successAuthentication');
                  // user.storeProfiles(req, function (err) {

                        if (err)
                            res.json('Error');
                        else
                            res.render('successAuthentication');

                    })*/


                }


            })


        }



    })

}










