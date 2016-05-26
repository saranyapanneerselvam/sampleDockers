var html5pdf = require("html5-to-pdf");
var exports = module.exports = {};

var http = require('http'),
    fs = require('fs');

exports.createHtml5ToPdf = function (req, res, next) {
    //console.log("Html : "+req.body.dashboardLayout);
    var html = "<img src='"+req.body.dashboardLayout+"' />";
    var timestamp = Number(new Date());
    var outputPath = "PDF/"+timestamp+"_"+req.body.dashboardId+".pdf";

    if(html==undefined || html==null){
        req.app.result = {'status': '302','Response': 'Error in creating PDF'};
        next();
    }
    else{
        html5pdf({paperFormat:'Legal'}).from.string(html).to(outputPath, function () {
            var file = outputPath;
            console.log("File : "+file);
            res.setHeader("Access-Control-Allow-Origin", "*");
            res.setHeader("Access-Control-Allow-Headers", "X-Requested-With");
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', 'attachment; filename=dashboardWidgets.pdf');
            res.download(file);
        })
    }
};