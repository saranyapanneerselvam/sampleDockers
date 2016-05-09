var getReferenceWidgetsList = require('../middlewares/getReferenceWidgets');

/**
 * This is the middleware to get the list of reference widgets based on channels
 * @param app - loading the app which is for using express ,etc
 * @param req - request from client - contains urls,inputs ..
 * @callback dashboard - result from db call
 */
module.exports = function (app) {
    app.get('/api/v1/get/referenceWidgets/:widgetType', getReferenceWidgetsList.referenceWidgets, function (req, res) {
        var referenceWidgets = req.showMetric.referenceWidgets;
        console.log('Here it comes');
        if (referenceWidgets){
            console.log(referenceWidgets);
            res.json({referenceWidgets: referenceWidgets});}
        else
            res.status(500).send({error: ""});
    });
};