var faceBookSearch = require('../middlewares/facebookSearch');
var facebookPageInsights = require('../middlewares/facebookInsights');

module.exports = function (app) {

    //to search pages
    app.get('/api/v1/facebookSearch', function (req, res) {
        res.render('facebookSearchPages.ejs'); // load the facebookSearchPages.ejs file
    });

    //To get the page list for searched keyword
    app.get('/api/v1/getUserRequest',faceBookSearch.getSearchResult, function (req, res) {
        res.json({pageLists:req.app.result});
    });

    app.get('/api/v1/getUserPage',facebookPageInsights.getPageInsights, function (req, res) {
        res.json({top10Fans:req.app.result});
    });

    module.exports = app;
}