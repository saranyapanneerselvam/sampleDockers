/**
 * Update bgFetch in data collection after alert creation
 */
var bgFetchUpdateHelper = require('../helpers/bgFetchUpdation');
module.exports = function (app) {

    //Create/update a new alert
    app.post('/api/v1/bgFetchUpdate', function (req, res) {
        bgFetchUpdateHelper.updateBgFetch(req, function () {
            res.json(req.app.result);
        })
    });

};
