var exprotHtml5ToPDF = require('../middlewares/exprotHtml5ToPDF');

module.exports = function (app) {

    //Create a new PDF
    app.post('/api/v1/createHtml5ToPdf/dashboard',exprotHtml5ToPDF.createHtml5ToPdf, function (req, res, next) {
        res.json(req.app.result);
    });
    app.post('/api/v1/createLogoToPdf/createFolder',exprotHtml5ToPDF.createLogoToPdf, function (req, res, next) {

        res.json(req.app.result);
    });
    app.post('/api/v1/fetchLogoToPdf/dashboard',exprotHtml5ToPDF.fetchLogoToPdf, function (req, res, next) {

        res.json(req.app.result);
    });
    app.post('/api/v1/removeLogoToPdf/dashboard',exprotHtml5ToPDF.removeLogoToPdf,function (req, res, next) {
        res.json(req.app.result);
    });

};