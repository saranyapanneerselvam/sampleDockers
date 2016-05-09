var nodePDF = require('nodepdf');

var fs = require('fs');
var screenshot = require('node-webkit-screenshot');

var webshot = require('webshot');
var webPage = require('webpage');
var phantom = require('phantomjs');


module.exports = function (app) {
    app.get('/export/:dashboardId/:startDate/:endDate',function (req, res) {
        res.render('export.ejs',{dashboardId: req.params.dashboardId, startDate: req.params.startDate, endDate: req.params.endDate});
    });

    app.get('/exportPDF/:dashboardId/:startDate/:endDate',function (req, res) {
        console.log('inside export pdf function',req.params);

/*
        webshot(
            'http://localhost:8080/export/'+req.params.dashboardId + '/' + req.params.startDate + '/' + req.params.endDate,
            'hello_world.png',
            {
                siteType:'url',
                shotSize: {
                    width: 'window',
                    height: 'all'
                },
                renderDelay: 30000,
                errorIfJSException: true
            },
            function(err) {
            // screenshot now saved to hello_world.png
                console.log('webshot error', err);
        });



         screenshot({
             url : 'http://localhost:8080/export/'+req.params.dashboardId + '/' + req.params.startDate + '/' + req.params.endDate,
             width : 1024,
             height: 10000,
             delay: 30
         }).then(function(buffer){
             fs.writeFile('./out.png', buffer, function(){
                 // This will close the screenshot service
                 console.log('closing screenshot');
                 screenshot.close();
             });
         });
*/

         var pdf = new nodePDF(
             'http://localhost:8080/export/'+req.params.dashboardId + '/' + req.params.startDate + '/' + req.params.endDate, 'pdfgenerated.pdf', {
                 'viewportSize': {
                     'width': 1440,
                     'height': 900
                 },
                 'paperSize': {
                     'format': 'A4',
                     'orientation': 'portrait',
                     'margin': {
                        'top': '1cm',
                        'right': '1cm',
                        'bottom': '1cm',
                        'left': '1cm'
                     }
                 },
                 'args': '--debug=true',
                 'outputQuality': '100', //set embedded image quality 0 - 100
                 'zoomFactor': 1,
                 'captureDelay': 40000
         });
        pdf.on('error', function(msg){
            console.log('nodepdf error',msg);
        });

        pdf.on('done', function(pathToFile){
            console.log('nodepdf done',pathToFile);
        });

        // listen for stdout from phantomjs
        pdf.on('stdout', function(stdout){
            console.log('nodepdf stdout',stdout);
        });

        // listen for stderr from phantomjs
        pdf.on('stderr', function(stderr){
            console.log('nodepdf stderr',stderr);
        });

    });

};