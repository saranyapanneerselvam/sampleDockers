var recommendedDashboard = require('../middlewares/getRecommendedDashboard');


module.exports = function (app) {
    app.get('/api/get/recommendDashboard', recommendedDashboard.recommendDashboard, function (req, res) {
        var dashboardsDetails = req.showMetric.dashboardsDetails;
        if (dashboardsDetails){
            console.log('welcome Here',dashboardsDetails);
            res.json(dashboardsDetails);}
        else
            res.status(500).send({error: ""});
    });
};