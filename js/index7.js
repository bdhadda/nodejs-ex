
function getServiceDetails(index) {
    for( var i=0; i<24; i++) {
        index = index.replace("/", "@");          
    }   
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        if (xhttp.readyState == 4 && xhttp.status == 200) {
        document.getElementById("sds").innerHTML = xhttp.responseText;
        }
    };
    document.getElementById("sds").innerHTML = "";
    var tid = "/6a/" + index;
    xhttp.open("post", tid, true);
    xhttp.send();
}
    
function reloadPage() { window.location.reload(); }

function initAll() { setTimeout('reloadPage()', 120000); }

function getArrivals(st) {
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        if (xhttp.readyState == 4 && xhttp.status == 200) {
        document.getElementById("sds").innerHTML = xhttp.responseText;
        }
    };
    document.getElementById("sds").innerHTML = "";
    var sid = "/7a/" + st;
    xhttp.open("post", sid, true);
    xhttp.send();
}
    
