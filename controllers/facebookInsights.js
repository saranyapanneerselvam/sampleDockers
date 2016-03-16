var faceBookSearch = require('../middlewares/facebookSearch');
var facebookPageInsights = require('../middlewares/facebookInsights');

module.exports = function (app) {

//to search pages
    app.get('/facebookSearch', function (req, res) {
        res.render('facebookSearchPages.ejs'); // load the index.ejs file
    });

    //to handle the user request
    app.get('/getUserRequest',faceBookSearch.getSearchResult, function (req, res) {
        console.log('req',req.app.result.length);
        res.json({pageLists:req.app.result});
        //res.render('showPages.ejs',{pageLists:req.app.result}); // load the index.ejs file
    });

    app.get('/getUserPage',facebookPageInsights.getPageInsights, function (req, res) {
        console.log('req',req.app.result.length);
        res.json({pageLists:req.app.result});
        //res.render('showPages.ejs',{pageLists:req.app.result}); // load the index.ejs file
    });

    module.exports = app;
}