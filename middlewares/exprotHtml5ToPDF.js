var pdf = require('html-pdf');
var fs = require('fs');
var options = { format:"A3", quality:"75", orientation:"landscape" };
var exports = module.exports = {};

exports.createHtml5ToPdf = function (req, res, next) {
    //console.log("Html : "+req.body.dashboardLayout);
    var html = "<img src='"+req.body.dashboardLayout+"' style='width: 100%;' />";
    var timestamp = Number(new Date());
    var outputPath = "public/PDF/"+req.body.dashboardName+"_"+timestamp+".pdf";

    if(html==undefined || html==null){
        req.app.result = {'status': '302','Response': 'Error in creating PDF'};
        next();
    }
    else{
       /* htmlTopdf({paperFormat:'Legal'}).from.string(html).to(outputPath, function () {
            req.app.result = {'status': '200','Response': "/PDF/"+req.body.dashboardName+"_"+timestamp+".pdf"};
            next();
        })*/

        pdf.create(html,options).toStream(function(err, stream){
            stream.pipe(fs.createWriteStream(outputPath));
            req.app.result = {'status': '200','Response': outputPath};
            next();
        });


    }
};