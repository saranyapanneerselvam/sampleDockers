var recommendedDashboard = require('../middlewares/getRecommendedDashboard');


module.exports = function (app) {
    app.get('/api/get/recommendDashboard', recommendedDashboard.recommendDashboard, function (req, res) {
            res.json(req.app.dashboardsDetails);
    });
};