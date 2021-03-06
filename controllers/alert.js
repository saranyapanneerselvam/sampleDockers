/**
 * Handle alerts
 */
var alertHelper = require('../helpers/alert');
module.exports = function (app) {

    //Create/update a new alert
    app.post('/api/v1/alerts', function (req, res) {
        alertHelper.createUpdateAlert(req, function () {
            res.json(req.app.result);
        })
    });

    //Get alerts for specified widgetId
    app.get('/api/v1/get/alerts/:widgetId', alertHelper.getAlertForWidget, function (req, res) {
        res.json(req.app.result);
    });

    //Remove alerts for a widget
    app.post('/api/v1/remove/alerts/:widgetId', alertHelper.removeAlertForWidget, function (req, res) {
        res.json(req.app.result);
    });
};
