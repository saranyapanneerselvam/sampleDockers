window.onload = function () {

    var FBimpressions = document.getElementById("impressions").getAttribute("value");
    var FBdates = document.getElementById("dates").getAttribute("value");
    console.log("Coming heree on front end....." + FBimpressions + FBdates);

    var overlayData1 = {
        labels: FBdates.split(","),
        datasets: [{
            label: "Impressions",
            type: "bar",
            yAxesGroup: "1",
            fillColor: "#3498db",
            strokeColor: "#3498db",
            highlightFill: "rgba(151,137,200,0.75)",
            highlightStroke: "rgba(151,137,200,1)",
            data: FBimpressions.split(",")
        }]
    };

    console.log("Overlay data = ");
    console.log(overlayData1);

    window.myOverlayChart = new Chart(document.getElementById("line").getContext("2d")).Overlay(overlayData1, {
        populateSparseData: true,
        overlayBars: false,
        datasetFill: false
    });
}
legend(document.getElementById("lineLegend"), overlayData1);
