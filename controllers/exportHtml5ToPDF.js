var exprotHtml5ToPDF = require('../middlewares/exprotHtml5ToPDF');
 
module.exports = function (app) {

    //Create a new PDF
    app.post('/api/v1/createHtml5ToPdf/dashboard',exprotHtml5ToPDF.createHtml5ToPdf, function (req, res, next) {
        res.json(req.app.result);
    });


};