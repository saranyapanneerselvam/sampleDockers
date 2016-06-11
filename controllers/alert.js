/**
 * Handle alerts
 */
var alertHelper = require('../helpers/alert');
module.exports = function (app) {

    //Create/update a new alert
    app.post('/api/v1/alerts', function (req, res) {
        alertHelper.createUpdateAlert(req,function(err,alert){
        console.log(req.app.result)
            if(!err)
            res.json(req.app.result);
        })

    });

};
