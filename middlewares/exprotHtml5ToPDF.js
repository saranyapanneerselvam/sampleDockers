//var pdf = require("html5-to-pdf");
//var pdf = require('html-pdf');

var fs = require('fs');
var options ={};
var PDFDocument, blobStream, doc, stream;
 PDFDocument = require('pdfkit');

// blobStream = require('blob-stream');

var exports = module.exports = {};

exports.createHtml5ToPdf = function (req, res, next) {









    var requestLength = req.body.dashboardLayout.length;
    var timestamp = Number(new Date());
    var getName = "";

    if(req.body.dashboardName==undefined || req.body.dashboardName=="undefined" || req.body.dashboardName==""){
        getName = "No_Name";
    }
    else{
        getName = req.body.dashboardName;
    }
    //document.getElementById("demo").innerHTML = getName;
    options= { paperFormat:"A4", paperOrientation:"landscape",renderDelay:60000,template:'htmlbootstrap'};

    var outputPath = "public/PDF/"+getName+"_"+timestamp+".pdf";

    if(req.body.dashboardLayout==undefined || req.body.dashboardLayout==null){
        req.app.result = {'status': '302','Response': 'Error in creating PDF'};
        next();
    }
    else{
        doc = new PDFDocument({size: 'A4',
            layout: 'landscape', margin: 10});
        // stream = doc.pipe(blobStream());
        doc.image(req.body.dashboardLayout[0]);
        if(req.body.dashboardLayout.length>0){
            for(var ind=1;ind<requestLength;ind++){
                doc.addPage();
                doc.image(req.body.dashboardLayout[ind]);
            }
        }

        /* htmlTopdf({paperFormat:'Legal'}).from.string(html).to(outputPath, function () {
         req.app.result = {'status': '200','Response': "/PDF/"+req.body.dashboardName+"_"+timestamp+".pdf"};
         next();
         })*/
        // pdf(options).concat.from.strings(htmlDocs).to(outputPath, function () {
        //     req.app.result = {'status': '200','Response': '/PDF/'+getName+'_'+timestamp+'.pdf'};
        //     next();
        //     console.log("req.app.result from pdf",req.app.result);
        // });
        // fs.createReadStream(htmlDocs[0])
        //     .pipe(pdf())
        //     .pipe(fs.createWriteStream(outputPath));
        // pdf.create(html, options).toFile(outputPath, function(err, res) {
        //     if (err) return console.log(err);
        //     req.app.result = {'status': '200','Response': '/PDF/'+getName+'_'+timestamp+'.pdf'};
        //     next();
        // });
        // pdf.create(html,options).toStream(function(err, stream){
        //     stream.pipe(fs.createWriteStream(outputPath));
        //     req.app.result = {'status': '200','Response': '/PDF/'+getName+'_'+timestamp+'.pdf'};
        //     next();
        // });
        doc.end();
        doc.pipe(fs.createWriteStream(outputPath));
            req.app.result = {'status': '200','Response': '/PDF/'+getName+'_'+timestamp+'.pdf'};
            next();
        // stream.on('finish', function() {
        //     var blob, url;
        //     blob = stream.toBlob('application/pdf');
        //     req.app.result = {'status': '200','Response': '/PDF/'+getName+'_'+timestamp+'.pdf'};
        //     next();
        //     console.log("req.app.result from pdf inside stream",req.app.result);
            // url = stream.toBlobURL('application/pdf');
            // return iframe.src = url;
        // });
    }

};