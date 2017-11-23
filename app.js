var log = console.log;
const http = require('http'),
    fs = require('fs'),
    path = require('path'),
    contentTypes = require('./utils/content-types'),
    sysInfo = require('./utils/sys-info'),
    env = process.env,
    urllib = require('url'),
    soap = require('soap');

const dash = "-- : --";
var express = require('express');
var app = express();


app.get('/1/:begin/:end', function (req, res) {
    //log("req=", req);
    var st = req.params.begin;
    var en = req.params.end;
    log("st =", st);
    log("en =", en);
    //res.send('Got:' + st + " " + en);
    var url = "/" + st + "/" + en;

    res.writeHead(200, {
        "Content-Type": "text/html"
    });
    //res.write("A: " + process.env.TZ);
    //process.env.TZ = 'Europe/London';
    //res.write("       Z: " + process.env.TZ);
    log(url);
    var sts = url.substring(1).toUpperCase().split('/')
    log(sts, sts.length);
    for (var i = 0; i < sts.length; i++) {
        log(i, sts[i]);
    }
    if (sts.length == 1 && sts[0] == "") {
        var hmsg = "<font size='9'>";
        hmsg += "Please add station(s) to end of address";
        hmsg += "<br>e.g. /PAD/SLO for Paddington to Slough";
        hmsg += "</font>";
        return res.end(hmsg);
    }
    var railUrl = 'https://lite.realtime.nationalrail.co.uk/OpenLDBWS/wsdl.aspx?ver=2012-01-13';
    var soapHeader = '<AccessToken><TokenValue>b522e810-ce57-44f5-9e2e-f1a13de95fa0</TokenValue></AccessToken>';
    var options = {
        numRows: 6,
        crs: sts[0],
        filterCrs: sts[1],
        filterType: 'to'
    };

    soap.createClient(railUrl, function (err, client) {
        client.addSoapHeader(soapHeader);
        client.GetDepartureBoard(options, function (err, result) {
            try {
                var info = getTrainTimes(err, result);
                log("ID=", info.SID);
                //if (info.SID == null) { throw 1001; }
                res.write(info.TT);
                res.write("<hr>", sd);
                var sd = ""
                if ((typeof info.SID !== 'undefined') && (info.SID !== null)) {
                    client.GetServiceDetails({
                        serviceID: info.SID
                    }, function (err, result2) {
                        sd = getTrainProgress(result2);
                        log("Service Details=", sd);
                        res.write(sd);
                        res.end("</body></html>");
                    });
                } else {
                    res.end("</body></html>");
                }
            } catch (err) {
                log("Error:", err);
                res.end("<!DOCTYPE html> <html><head></head><body><font size='9'>ERROR</font></body></html>");
            }
        });
    });
});


app.get('/1/:begin', function (req, res) {
    //log("req=", req);
    var st = req.params.begin;
    var en = "";
    log("st =", st);
    log("en =", en);
    //res.send('Got:' + st + " " + en);
    var url = "/" + st + "/" + en;

    res.writeHead(200, {
        "Content-Type": "text/html"
    });
    //res.write("A: " + process.env.TZ);
    //process.env.TZ = 'Europe/London';
    //res.write("       Z: " + process.env.TZ);
    log(url);
    var sts = url.substring(1).toUpperCase().split('/')
    log(sts, sts.length);
    for (var i = 0; i < sts.length; i++) {
        log(i, sts[i]);
    }
    if (sts.length == 1 && sts[0] == "") {
        var hmsg = "<font size='9'>";
        hmsg += "Please add station(s) to end of address";
        hmsg += "<br>e.g. /PAD/SLO for Paddington to Slough";
        hmsg += "</font>";
        return res.end(hmsg);
    }
    var railUrl = 'https://lite.realtime.nationalrail.co.uk/OpenLDBWS/wsdl.aspx?ver=2012-01-13';
    var soapHeader = '<AccessToken><TokenValue>b522e810-ce57-44f5-9e2e-f1a13de95fa0</TokenValue></AccessToken>';
    var options = {
        numRows: 6,
        crs: sts[0],
        filterCrs: sts[1],
        filterType: 'to'
    };

    soap.createClient(railUrl, function (err, client) {
        client.addSoapHeader(soapHeader);
        client.GetDepartureBoard(options, function (err, result) {
            try {
                var info = getTrainTimes(err, result);
                log("ID=", info.SID);
                if (info.SID == null) {
                    throw 1001;
                }
                res.write(info.TT);
                res.write("<hl>", sd);
                var sd = ""
                if ((typeof info.SID !== 'undefined') && (info.SID !== null)) {
                    client.GetServiceDetails({
                        serviceID: info.SID
                    }, function (err, result2) {
                        sd = getTrainProgress(result2);
                        log("Service Details=", sd);
                        res.write(sd);
                        res.end("</body></html>");
                    });
                } else {
                    res.end("</body></html>");
                }
            } catch (err) {
                log("Error:", err);
                res.end("<!DOCTYPE html> <html><head></head><body><font size='9'>ERROR</font></body></html>");
            }
        });
    });
});


function getTrainTimes(err, result) {
    log("In getTrainTimes");
    var sid = null;
    var data = "<!DOCTYPE html> <html><head><title>The Next Train from ...</title>";
    data += "<script>";
    data += "function reloadPage() { window.location.reload(); }";
    data += "function initAll() { setTimeout('reloadPage()', 60000); }";
    data += "</script>";
    data += "</head><body onLoad='initAll()'>";
    log(err);
    if (err) {
        data = data + "<br>Error in GetDepartureBoard<br>";
    } else { // 1
        var deptBoard = result['GetDepartureBoardResult'];
        log(result);
        log(deptBoard);
        if (deptBoard.trainServices !== undefined) {
            data += "<h1>";
            if (deptBoard.filterLocationName === undefined) {
                data += "From " + deptBoard.locationName;
            } else {
                data += deptBoard.locationName + " to " + deptBoard.filterLocationName;
            }
            data += "</h1>";
            var trServices = deptBoard['trainServices'];
            log("\nTrain Service=", trServices);
            log("\nOrigin=", trServices.service[0].origin);
            log("##################");
            if (trServices === undefined) {
                data += "No Services<br>";
            } else { //0
                var aService = trServices['service'];
                var obj1 = aService;
                log(obj1);
                for (var i = 0; i < obj1.length; i++) {
                    var toLoc = obj1[i].destination.location[0].locationName;
                    var std = obj1[i].std;
                    var etd = obj1[i].etd;
                    var id = obj1[i].serviceID;
                    log(id);
                    data += "<font size='9'>" + std;
                    if (etd == "On time") {
                        data += " (<font size='9' style='color:Green'>" + etd + "</font>)";
                    } else if ((etd == "Cancelled") || (etd == "Delayed")) {
                        data += " (<b style='color:red'><font size='6'>";
                        data += etd;
                        data += "</font></b>)";
                    } else {
                        data += " (<b style='color:red'>";
                        data += etd;
                        data += "</b>)";
                    }
                    log("Filter loc=", deptBoard.filterLocationName);
                    if (deptBoard.filterLocationName === undefined) {
                        data += " " + toLoc.substring(0, 13);
                    }
                    data += "</font><br>";
                } // for
            } // else 0
            data += "<br>";
            if (typeof obj1[0].serviceID !== 'undefined') {
                sid = obj1[0].serviceID;
            }
        } else { // deptBoard.trainServices !== undefined
            log("No train Service data available");
            data += "<b style='color:red'><font size='6'>";
            data += "No data available";
            data += "</font></b>";

        }
    } // else1
    //log("@END", data, sid);
    return {
        TT: data,
        SID: sid
    };
}



function getTrainProgress(pd) {
    log(pd);
    log("---------------------------------");
    log(pd.GetServiceDetailsResult);
    //log(pd.GetServiceDetailsResult.previousCallingPoints);
    //log(pd.GetServiceDetailsResult.previousCallingPoints.callingPointList);
    //log(pd.GetServiceDetailsResult.previousCallingPoints.callingPointList[0].attributes);
    //log(pd.GetServiceDetailsResult.previousCallingPoints.callingPointList[0].callingPoint);
    var oSdr = pd.GetServiceDetailsResult;
    var d = oSdr.generatedAt;
    var pcp = "<br><h2>" + "Details of the ";
    if (oSdr.sta !== undefined) {
        pcp += oSdr.sta + " train" + " Platform: " + oSdr.platform + "</h2>";
    } else {
        if (oSdr.platform !== undefined) {
            pcp += "next train" + "&nbsp;&nbsp;&nbsp;&nbsp; Platform: " + oSdr.platform + "</h2>";
        } else {
            pcp += "next train" + "</h2>";
        }
    }
    var luat = "Last Updated at " + ('00' + (1 + d.getHours())).slice(-2) + ":" + ('00' + d.getMinutes()).slice(-2);
    log(luat);
    if (oSdr.isCancelled) {
        pcp += "<br><font size='9'>" + oSdr.disruptionReason + "</font><br>";
    } else {
        var oPcp = pd.GetServiceDetailsResult.previousCallingPoints
        if (oPcp !== null) {
            var cp = oPcp.callingPointList[0].callingPoint;
            log("cp=", cp);
            pcp += "<br>";
            var doneFlag = false;
            if (typeof cp !== 'undefined') {
                for (var i = cp.length - 1; i > -1; i--) {
                    pcp += "<font size='9'>";
                    pcp += cp[i].st + " ";
                    if (typeof cp[i].at !== 'undefined') {

                        if (cp[i].at == "On time") {
                            pcp += " (<font size='9' style='color:Green'>" + cp[i].at + "</font>) ";
                        } else {
                            pcp += " (<b style='color:red'>";
                            pcp += cp[i].at;
                            pcp += "</b>) ";
                        }

                        //pcp += "(" + cp[i].at + ") ";
                        doneFlag = true;
                    } else {
                        pcp += "( --:-- ) ";
                    }
                    pcp += cp[i].locationName;
                    pcp += "</font><br>";
                    if (doneFlag) {
                        break;
                    }
                }
            }
        } else {
            pcp += "<br><font size='9'>No Information available</font><br>";
        }
    }

    //pcp += "B: " + process.env.TZ;
    //process.env.TZ = 'Europe/London';
    //pcp += "       Y: " + process.env.TZ;

    pcp += "<br><font size='9'>" + luat + "</font>";
    return pcp;
}


app.get('/2', function (req, res) {
    var url = req.url;
    var url_parts = urllib.parse(url, true);
    var query = url_parts.query;
    var from="", to="", tim="", day="";
    if (query.from !== undefined) {from = query.from};
    if (query.to !== undefined) {to = query.to};
    if (query.tim !== undefined) {tim = query.tim};
    if (query.day !== undefined) {day = query.day};
    log(url, query, from, to, tim);
    fs.readFile("departuresdb.bin", function (err, data) {
        if (err) {
            res.writeHead(404);
            res.end('Not found');
        } else {
            log("Read file");
            let ext = path.extname(url).slice(1);
            //log(ext);
            res.setHeader('Content-Type', 'text/html');
            if (ext === 'html') {
                res.setHeader('Cache-Control', 'no-cache, no-store');
            }
            var db = JSON.parse(data);
            for (var i=0; i<db.length; i++) {
                var k = (db[i].k).split("/");
                //log("----------------------------------")
                //log(from.length, k[0].length);
                //log((from.length>0), (to.length>0), (tim.length>0));
                //log (((from.length > 0) && !(k[0] === from)), (k[0] === from), (k[0] !== from));
                //log(k[0],k[1], k[2]);
                var s = true;
                if ((from.length > 0) && !(k[0] == from)) {s = false};
                if ((to.length > 0) && !(k[1] == to)) {s = false};
                if ((tim.length > 0) && !(k[2] == tim)) {s = false};
                if ((day.length > 0) && !(db[i].d == day)) {s = false};

                if (s) {
                    log(db[i]);
                    res.write(JSON.stringify(db[i]) + "<br>");
                };
            }
            res.end();
        }
    });

});

app.get('/3/:tid', function (req, res) {
    var url = req.url;
    var tid = req.params.tid;
    log(url);
    var railUrl = 'https://lite.realtime.nationalrail.co.uk/OpenLDBWS/wsdl.aspx?ver=2012-01-13';
    var soapHeader = '<AccessToken><TokenValue>b522e810-ce57-44f5-9e2e-f1a13de95fa0</TokenValue></AccessToken>';
    soap.createClient(railUrl, function (err, client) {
        client.addSoapHeader(soapHeader);
        client.GetServiceDetails({
            serviceID: tid
        }, function (err, result2) {
            var sd = getTrainProgress(result2);
            log("Service Details=", sd);
            res.setHeader('Content-Type', 'text/plain');
            res.write(sd);
            res.end("---END---");
        });
    });

});

/////////////////////////////////////////////////////////// 4 ////////////////////////////////////////////////////////////////////////


app.get('/4/:begin/:end', function (req, res) {
    //log("req=", req);
    var st = req.params.begin;
    var en = req.params.end;
    if (en == "all") {
        en = "";
    }
    log("st =", st);
    log("en =", en);
    //res.send('Got:' + st + " " + en);
    var url = "/" + st + "/" + en;
    log(typeof(url), url);

    res.writeHead(200, {
        "Content-Type": "text/html"
    });
    //res.write("A: " + process.env.TZ);
    //process.env.TZ = 'Europe/London';
    //res.write("       Z: " + process.env.TZ);
    log(url);
    var sts = url.substring(1).toUpperCase().split('/')
    log(sts, sts.length);
    for (var i = 0; i < sts.length; i++) {
        log(i, sts[i]);
    }
    if (sts.length == 1 && sts[0] == "") {
        var hmsg = "<font size='4'>";
        hmsg += "Please add station(s) to end of address";
        hmsg += "<br>e.g. /PAD/SLO for Paddington to Slough";
        hmsg += "</font>";
        return res.end(hmsg);
    }
    var railUrl = 'https://lite.realtime.nationalrail.co.uk/OpenLDBWS/wsdl.aspx?ver=2012-01-13';
    var soapHeader = '<AccessToken><TokenValue>b522e810-ce57-44f5-9e2e-f1a13de95fa0</TokenValue></AccessToken>';
    var options = {
        numRows: 6,
        crs: sts[0],
        filterCrs: sts[1],
        filterType: 'to'
    };

    soap.createClient(railUrl, function (err, client) {
        client.addSoapHeader(soapHeader);
        client.GetDepartureBoard(options, function (err, result) {
            try {
                var info = get4TrainTimes(err, result);
                log("ID=", info.SID);
                //if (info.SID == null) { throw 1001; }
                res.write(info.TT);
                res.write("<hr>", sd);
                var sd = ""
                if ((typeof info.SID !== 'undefined') && (info.SID !== null)) {
                    client.GetServiceDetails({
                        serviceID: info.SID
                    }, function (err, result2) {
                        sd = get4TrainProgress(result2);
                        log("Service Details=", sd);
                        res.write(sd);
                        sd = get4TrainPost(result2);
                        res.write(sd);
                        res.end("</body></html>");
                        log("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
                        log("   ");
                    });



                } else {
                    res.end("</body></html>");
                }
            } catch (err) {
                log("Error:", err);
                res.end("<!DOCTYPE html> <html><head></head><body><font size='4'>ERROR</font></body></html>");
            }
        });
    });
});

var departuresDB = [];

function updateDeparturesDB(crs, toCrs, day, std, pt) {
    var k = crs + "/" + toCrs + "/" + std;

    //console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@");
    //console.log(k);

    if (departuresDB.length == 0) {
        //Load db from file
        log("Loading db file");
        var filename = 'departuresdb.bin';
        if (!fs.existsSync(filename)) {
            //Create empty file
            log("Creating file")
            var fd = fs.openSync(filename, 'w');
            log("Closing")
            fs.closeSync(fd);
        }
        try {
            log("Reading file")
            var data = fs.readFileSync(filename);
            //log("data=", JSON.parse(data));
            //log("Before", departuresDB);
            departuresDB = JSON.parse(data);
            //log("After", departuresDB);
        } catch (err) {
            log("Error reading DB file:", err)
        }

    }

    var iFound = -1;
    var iFoundOther = -1;
    //for (var i = 0; i < departuresDB.length; i++) {
    for (var i = departuresDB.length - 1; i >= 0; i--) {
        //console.log((k == departuresDB[i].id));
        if (k == departuresDB[i].k) {
            if (day == departuresDB[i].d) {
                iFound = i;
                break;
            } else {
                iFoundOther = i;
            }
        }
    }
    /*
    if (iFoundOther > -1) {
        log("Found=", iFound, " Other=", iFoundOther, " Other Platform= ", departuresDB[iFoundOther].p);
    } else {
        
        log("Found=", iFound, " Other=", iFoundOther);
    }
    */
    if (iFound > -1) {
        //console.log("Found at index ", iFound, " Platform= ", departuresDB[iFound].p, "  Given", pt);
        if (pt != departuresDB[iFound].p) {
            if (pt !== undefined) {
                //log("Updating platform info");
                departuresDB[iFound].p = pt;
                //log("now and updating file", departuresDB[iFound].p)
                fs.writeFile('departuresdb.bin', JSON.stringify(departuresDB), function (err) {
                    if (err) {
                        console.error(err);
                    }
                })
            }
        }
    } else {
        //console.log("Not found", k);
        if (pt !== undefined) {
            //log("Inserted", k, pt);
            departuresDB.push({
                "k": k,
                d: day,
                p: pt
            });
            fs.writeFile('departuresdb.bin', JSON.stringify(departuresDB), function (err) {
                if (err) {
                    console.error(err);
                }
            })
        } else {
            var i;
            //log("No platform data to insert");
        }
    }
    //console.log("DB Length=", departuresDB.length);
    var retVal = 0;
    if (iFound > -1) {
        // Found key
        retVal = {
                isFound: true,
            platform: departuresDB[iFound].p
        };
    } else {
        // Not found so inserted if platform given
        //If found on another day return that platform
        if (iFoundOther > -1) {
            // Found on another day
            retVal = {
                isFound: true,
                platform: "[" + departuresDB[iFoundOther].p + "]"
            };

        } else {
            // Not found at all
            retVal = {
                isFound: false,
                platform: 0
            };
        }
    }
    return retVal;
}
function get4TrainTimes(err, result) {
    log("In getTrainTimes");
    var sid = null;
    var data = "<!DOCTYPE html> <html><head><title>Commuting</title>";
    data += "<script>";
    data += "function reloadPage() { window.location.reload(); }";
    data += "function initAll() { setTimeout('reloadPage()', 120000); }";
    data += "</script>";
    data += "<meta name='viewport' content='width=device-width, initial-scale=1'>";
    data += "</head><body onLoad='initAll()'>";
    log("Error=", err);
    if (err) {
        data = data + "<br>Error in GetDepartureBoard<br>";
    } else { // 1
        var deptBoard = result['GetDepartureBoardResult'];
        log("result=", result);
	log("%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%")
        log("deptBoard=", deptBoard);
	log("%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%")
        if (deptBoard.trainServices !== undefined) {
            data = "<!DOCTYPE html> <html><head><title>Commuting";
            if (deptBoard.filterLocationName !== undefined) {
                data += " to " + deptBoard.filterLocationName ;
            }
            data += "</title><script>";
            data += "function reloadPage() { window.location.reload(); }";
            data += "function initAll() { setTimeout('reloadPage()', 120000); }";
            data += "</script>";
		    data += "<meta name='viewport' content='width=device-width, initial-scale=1'>";
            data += "</head><body onLoad='initAll()'>";            
            data += "<hr><font size='3'><b>";
            if (deptBoard.filterLocationName === undefined) {
                data += "From " + deptBoard.locationName;
            } else {
                data += deptBoard.locationName + " to " + deptBoard.filterLocationName;
            }
            data += "</b></font><br>";

            var trServices = deptBoard['trainServices'];
            log("\nTrain Service=", trServices);
            log("\nOrigin=", trServices.service[0].origin);
            log("##################");
            if (trServices === undefined) {
                data += "No Services<br>";
            } else { //0
                var aService = trServices['service'];
                var obj1 = aService;
                log("aService=", obj1);
                for (var i = 0; i < obj1.length; i++) {
                    var toLoc = obj1[i].destination.location[0].locationName;
                    var std = obj1[i].std;
                    var etd = obj1[i].etd;
                    var id = obj1[i].serviceID;
                    var pt = obj1[i].platform;
                    var destCrs = obj1[i].destination.location[0].crs;
                    var ret = updateDeparturesDB(deptBoard.crs, destCrs ,deptBoard.generatedAt.getDay(),  std, pt);
                    log(ret.isFound, ret.platform);
                    /*
                    if ((pt === undefined) && (ret.isFound)) {
                        pt = ret.platform;
                    }
                    */
                    log("Platform=", pt);
                    log("DB entry=", deptBoard.locationName, std, pt)
                    log("id=", id);
                    data += "<font size='4'>" + std;
                    if (etd == "On time") {
                        data += " (<font size='4' style='color:Green'>" + etd + "</font>)";
                    } else if ((etd == "Cancelled") || (etd == "Delayed")) {
                        data += " (<b style='color:red'><font size='3'>";
                        data += etd;
                        data += "</font></b>)";
                    } else {
                        data += " (<b style='color:red'><font size='4'>";
                        data += etd;
                        data += "</font></b>)";
                    }
                    log("Filter loc=", deptBoard.filterLocationName);
                    if (deptBoard.filterLocationName === undefined) {
                        data += " " + toLoc.substring(0, 20);
                    }
                    if (pt !== undefined) {
                        data += "<b> P: " + pt + "</b>";
                    }
                    if (ret.isFound) {
                        data += "<b> [" + ret.platform + "]</b>";
                    }
                    data += "</font><br>";
                } // for
            } // else 0
            data += " ";
            if (typeof obj1[0].serviceID !== 'undefined') {
                sid = obj1[0].serviceID;
            }
        } else { // deptBoard.trainServices !== undefined
            log("No train Service data available");
            data += "<b style='color:red'><font size='4'>";
            data += "No data available";
            data += "</font></b>";

        }
    } // else1
    //log("@END", data, sid);
    return {
        TT: data,
        SID: sid,
    };
}

function get4TrainProgress(pd) {
    // Details where the train has got to, it's progress up requested station
    log("-------------- get4TrainProgress Start-------------------");
    log(pd);
    log(pd.GetServiceDetailsResult);
    log("-------------- get4TrainProgress -------------------");
    //log(pd.GetServiceDetailsResult.previousCallingPoints);
    //log(pd.GetServiceDetailsResult.previousCallingPoints.callingPointList);
    //log(pd.GetServiceDetailsResult.previousCallingPoints.callingPointList[0].attributes);
    //log(pd.GetServiceDetailsResult.previousCallingPoints.callingPointList[0].callingPoint);
    var oSdr = pd.GetServiceDetailsResult;
    var d = oSdr.generatedAt;
    var pcp = "<font size='3'><b>" + "Details of the ";
    log("sta=", oSdr.sta);
    if (typeof (oSdr.sta) !== 'undefined') {
        pcp += oSdr.std + " train" ;
    } else {
        pcp += "next train" ;
    }

    if (typeof (oSdr.platform) !== 'undefined') {
        pcp += "<br>Platform: " + oSdr.platform + "</b></font>";
    } else {
        pcp += "</b></font>";
    }
    
    var luat = "Last Updated at " + ('00' + (d.getHours())).slice(-2) + ":" + ('00' + d.getMinutes()).slice(-2) + "GMT";
    log(luat);
    if (oSdr.isCancelled) {
        pcp += "<br><font size='4'>" + oSdr.disruptionReason + "</font><br>";
    } else {
        var oPcp = pd.GetServiceDetailsResult.previousCallingPoints
        if (oPcp !== null) {
            var cp = oPcp.callingPointList[0].callingPoint;
            log("cp=", cp);
            //pcp += "<hr>";
            var doneFlag = false;
            pcp += "<font size='4'>";
            if (typeof cp !== 'undefined') {
                pcp += "<table border='0'>";
                log("cp len=", cp.length)
                var i0 = 0;
                if (cp.length > 4) {
                    i0 = cp.length - 4;
                }
                for (var i = i0; i < cp.length; i++) {
                    log("\ni=", i, "cp[i]=", cp[i]);
                    //log("pcp=", pcp, "\n");
                    pcp += "<tr>";
                    //pcp += "<font size='14'>";
                    pcp += "<td>" + cp[i].st + "</td>";
                    if (typeof cp[i].at !== 'undefined') { //undefined means has not left here yet
                        pcp += "<td align='center' style='width:70px' >";
                        if (cp[i].at == "On time") {
                            pcp += "(<font size='2' style='color:Green'>" + cp[i].at + "</font>)";
                        } else if (cp[i].at == "No report") {
                            pcp += "(<font size='2' style='color:red'>" + cp[i].at + "</font>)";
                        } else if (cp[i].at == "Delayed") {
                            pcp += "(<font size='2' style='color:red'>" + cp[i].at + "</font>)";
                        } else {
                            pcp += "(&nbsp;&nbsp;<b style='color:red'><font size='3'>";
                            pcp += cp[i].at;
                            pcp += "</font></b>&nbsp;&nbsp;)";
                        }
                        pcp += "</td>";
                        //pcp += "(" + cp[i].at + ") ";
                        //doneFlag = true;
                    } else {
                        pcp += "<td align='center'>(&nbsp;&nbsp;--:--&nbsp;&nbsp;)</td>";
                    }
                    pcp += "<td>";
                    pcp += cp[i].locationName;
                    pcp += "</td>";
                    //pcp += "<br>";
                    pcp += "</tr>";
                    if (doneFlag) {
                        break;
                    }
                }
                pcp += "<tr>";
                pcp += "<td><b>" + oSdr.std + "</b></td><td align='center' style='width:70px' ><b>" ;
                if ((oSdr.atd == "On time") || (oSdr.etd == "On time")) {
                    pcp += "(&nbsp;&nbsp;<font size='2' style='color:Green'>" + oSdr.std + "</font>&nbsp;&nbsp;)";
                } else {
                    pcp += "(&nbsp;&nbsp;<b style='color:red'><font size='2'>";
                    pcp += oSdr.etd;
                    pcp += "</font></b>&nbsp;&nbsp;)";
                }
                pcp +=  "</b></td>";
                pcp +=  "<td><b>" + oSdr.locationName + "<b></td>";
                pcp += "</tr>"  ;
                pcp += "</table>";
            }
            pcp += "</font>";
        } else {
            //Previous Calling point = Nulll, so train starts here
            var oGsdr = pd.GetServiceDetailsResult
            pcp += "<table border='0'>";
            pcp += "<tr>";
            pcp += "<td>" + oGsdr.std + "</td>";
            pcp += "<td align='center' style='width:70px' >";
            log("type of atd=", typeof oGsdr.adt)
            if (typeof oGsdr.atd === 'undefined') { //undefined means has not left here yet
                pcp += "(<font size='2' style='color:Green'>" + oGsdr.etd + "</font>)";
            } else {
                pcp += "(<font size='2' style='color:Blue'>" + oGsdr.atd + "</font>)";
            }
            pcp += "</td>";
            pcp += "<td>" + oGsdr.locationName + "</td>"; 
        }
        
    }

    //pcp += "B: " + process.env.TZ;
    //process.env.TZ = 'Europe/London';
    //pcp += "       Y: " + process.env.TZ;

    //pcp += "<br><font size='4'>" + luat + "</font>";
    return pcp;
}

function get4TrainPost(pd) {
    // Details where the train after requested station
    log(pd);
    log("--------------- get4TrainPost ------------------");
    log(pd.GetServiceDetailsResult);
    //log(pd.GetServiceDetailsResult.previousCallingPoints);
    //log(pd.GetServiceDetailsResult.previousCallingPoints.callingPointList);
    //log(pd.GetServiceDetailsResult.previousCallingPoints.callingPointList[0].attributes);
    //log(pd.GetServiceDetailsResult.previousCallingPoints.callingPointList[0].callingPoint);
    var oSdr = pd.GetServiceDetailsResult;
    var d = oSdr.generatedAt;
    //var pcp = "<font size='3'><b>" + "Details of the ";
    var pcp ="";
/*    
    if (oSdr.sta !== undefined) {
        pcp += oSdr.sta + " train" + "<br>Platform: " + oSdr.platform + "</b></font>";
    } else {
        if (oSdr.platform !== undefined) {
            pcp += "next train" + "<br>Platform: " + oSdr.platform + "</b></font>";
        } else {
            pcp += "next train" + "</b></font>";
        }
    }
*/    
    var luat = "Last Updated at " + ('00' + (d.getHours())).slice(-2) + ":" + ('00' + d.getMinutes()).slice(-2);
    log(luat);
    if (oSdr.isCancelled) {
        pcp += "<br><font size='4'>" + oSdr.disruptionReason + "</font><br>";
    } else {
        var oPcp = pd.GetServiceDetailsResult.subsequentCallingPoints
        if (oPcp !== null) {
            var cp = oPcp.callingPointList[0].callingPoint;
            log("cp=", cp);
            //pcp += "<hr>";
            var doneFlag = false;
            pcp += "<font size='4'>";
            if (typeof cp !== 'undefined') {
                pcp += "<table border='0'>";
                for (var i = 0; i < cp.length; i++) {
                    log("\ni=", i, "cp[i]=", cp[i]);
                    //log("pcp=", pcp, "\n");
                    pcp += "<tr>";
                    //pcp += "<font size='14'>";
                    pcp += "<td>" + cp[i].st + "</td>";
                    if (typeof cp[i].at !== 'undefined') { //undefined means has not left here yet
                        pcp += "<td align='center' style='width:70px' >";
                        if (cp[i].at == "On time") {
                            pcp += " (<font size='3' style='color:Green'>" + cp[i].at + "</font>) ";
                        } else {
                            pcp += " (<b style='color:red'><font size='3'>";
                            pcp += cp[i].at;
                            pcp += "</font></b>) ";
                        }
                        pcp += "</td>";
                        //pcp += "(" + cp[i].at + ") ";
                        //doneFlag = true;
                    } else {
                        pcp += "<td align='center' style='width:70px' >(&nbsp;&nbsp;--:--&nbsp;&nbsp;)</td>";
                    }
                    pcp += "<td>";
                    pcp += cp[i].locationName;
                    pcp += "</td>";
                    //pcp += "<br>";
                    pcp += "</tr>";
                    if (doneFlag) {
                        break;
                    }
                }
                pcp += "</table>";
            }
        } else {
            pcp += "<br><br>No more details available<br>";
        }
        pcp += "</font>";
    }

    //pcp += "B: " + process.env.TZ;
    //process.env.TZ = 'Europe/London';
    //pcp += "       Y: " + process.env.TZ;

    pcp += "<br><font size='2'>" + luat + "  (GMT)</font>";
    return pcp;
}

/////////////////////////////////////////////////////////// 5 ////////////////////////////////////////////////////////////////////////
app.get('/5/:begin/:end', function (req, res) {
    //log("req=", req);
    var st = req.params.begin;
    var en = req.params.end;
    
    if (en == "all") { en = ""; }
    log("st =", st);
    log("en =", en);
    var url = "/" + st + "/" + en;

    res.writeHead(200, {
        "Content-Type": "text/html"
    });

    
    var sts = url.substring(1).toUpperCase().split('/')
    log(sts, sts.length);
    for (var i = 0; i < sts.length; i++) { log(i, sts[i]); }
    if (sts.length == 1 && sts[0] == "") {
        var hmsg = "<font size='4'>";
        hmsg += "Please add station(s) to end of address";
        hmsg += "<br>e.g. /PAD/SLO for Paddington to Slough";
        hmsg += "</font>";
        return res.end(hmsg);
    }
    
    var railUrl = 'https://lite.realtime.nationalrail.co.uk/OpenLDBWS/wsdl.aspx?ver=2012-01-13';
    var soapHeader = '<AccessToken><TokenValue>b522e810-ce57-44f5-9e2e-f1a13de95fa0</TokenValue></AccessToken>';
    var options = {
        numRows: 6,
        crs: sts[0],
        filterCrs: sts[1],
        filterType: 'to'
    };

    soap.createClient(railUrl, function (err, client) {
        client.addSoapHeader(soapHeader);
        client.GetDepartureBoard(options, function (err, result) {
            try {
                var info = get5newTrainTimes(err, result);
                log("ID=", info.SID);
                log("trainTimes=\n", info.TRAINTIMES);
                //if (info.SID == null) { throw 1001; }
                res.write(info.TT);
                //res.write("<hr>");
                var tt = info.TRAINTIMES;
                if (tt.length > 1) {
                    res.write("<hr><font size='3'><b>From " + tt[0].from); 
                    if (tt[0].to !== undefined) {
                        res.write(" to " +tt[0].to);
                    }
                    res.write("</b></font><br>");
                    res.write("<table border='0'>");
                    for (var i=1; i<tt.length; i++) {
                        var t = tt[i];
                        res.write("<tr>");
                        res.write("<td>" + t.std + " </td> ");                        
                        res.write("<td>(" + t.etd + ") </td> ");                        
                        res.write("<td>" + t.to + " </td> ");                        
                        if (t.platform !== undefined) {
                            res.write("<td> P:" + t.platform + " </td> ");
                        } else {
                            res.write("<td>" + " " + " </td> ");
                        }
                        res.write("</tr>");
                    }
                    res.write("</table>");
                    res.write("<hr");
                }
                
                res.end("</body></html>");
 
            } catch (err) {
                log("Error:", err);
                res.end("<!DOCTYPE html> <html><head></head><body><font size='5'>ERROR</font></body></html>");
            }
        });
    });
});

function get5TrainTimes(err, result) {
    log("In getTrainTimes");
    var trainTimes = [];
    var sid = null;
    var data = "<!DOCTYPE html> <html><head><title>Commuting</title>";
    data += "<script>";
    data += "function reloadPage() { window.location.reload(); }";
    data += "function initAll() { setTimeout('reloadPage()', 120000); }";
    data += "</script>";
    data += "</head><body onLoad='initAll()'>";
    log("Error=", err);
    if (err) {
        data = data + "<br>Error in GetDepartureBoard<br>";
    } else { // 1
        var deptBoard = result['GetDepartureBoardResult'];
        log("result=", result);
	    log("%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%")
        log("deptBoard=", deptBoard);
	    log("%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%")
        // Load trainTimes from Depature board object
        if (deptBoard.trainServices !== undefined) {
            var service = deptBoard.trainServices.service;
            trainTimes.push({
                from:       deptBoard.locationName,
                fromcrs:    deptBoard.crs,
                to:         deptBoard.filterLocationName,
                tocrs:      deptBoard.filtercrs
            });
            for (var i =0; i < service.length; i++) {
                trainTimes.push ({
                    std: service[i].std,
                    etd: service[i].etd,
                    to:  service[i].destination.location[0].locationName,
                    platform: service[i].platform  
                });
            }
            
        } else {
            
        }
        log("Train Times=\n", trainTimes);
        
        
        if (deptBoard.trainServices !== undefined) {
            data = "<!DOCTYPE html> <html><head><title>Commuting to " +  deptBoard.filterLocationName + "</title>";
            data += "<script>";
            data += "function reloadPage() { window.location.reload(); }";
            data += "function initAll() { setTimeout('reloadPage()', 120000); }";
            data += "</script>";
            data += "</head><body onLoad='initAll()'>";            
            data += "<hr><font size='3'><b>";
            if (deptBoard.filterLocationName === undefined) {
                data += "From " + deptBoard.locationName;
            } else {
                data += deptBoard.locationName + " to " + deptBoard.filterLocationName;
            }
            data += "</b></font><br>";

            var trServices = deptBoard['trainServices'];
            log("\nTrain Service=", trServices);
            log("\nOrigin=", trServices.service[0].origin);
            log("##################");
            if (trServices === undefined) {
                data += "No Services<br>";
            } else { //0
                var aService = trServices['service'];
                var obj1 = aService;
                log("aService=", obj1);
                for (var i = 0; i < obj1.length; i++) {
                    var toLoc = obj1[i].destination.location[0].locationName;
                    var std = obj1[i].std;
                    var etd = obj1[i].etd;
                    var id = obj1[i].serviceID;
                    var pt = obj1[i].platform;
                    log("Platform=", pt);
                    log("DB entry=", deptBoard.locationName, std, pt)
                    log("id=", id);
                    data += "<font size='4'>" + std;
                    if (etd == "On time") {
                        data += " (<font size='4' style='color:Green'>" + etd + "</font>)";
                    } else if ((etd == "Cancelled") || (etd == "Delayed")) {
                        data += " (<b style='color:red'><font size='3'>";
                        data += etd;
                        data += "</font></b>)";
                    } else {
                        data += " (<b style='color:red'><font size='4'>";
                        data += etd;
                        data += "</font></b>)";
                    }
                    log("Filter loc=", deptBoard.filterLocationName);
                    if (deptBoard.filterLocationName === undefined) {
                        data += " " + toLoc.substring(0, 20);
                    }
                    if (pt !== undefined) {
                        data += "<b> P: " + pt + "</b>";
                    }
                    data += "</font><br>";
                } // for
            } // else 0
            data += " ";
            if (typeof obj1[0].serviceID !== 'undefined') {
                sid = obj1[0].serviceID;
            }
        } else { // deptBoard.trainServices !== undefined
            log("No train Service data available");
            data += "<b style='color:red'><font size='4'>";
            data += "No data available";
            data += "</font></b>";

        }
    } // else1
    //log("@END", data, sid);
    return {
        TT: data,
        SID: sid,
        TRAINTIMES: trainTimes
    };
}

function get5TrainProgress(pd) {
    // Details where the train has got to, it's progress up requested station
    log("-------------- get5TrainProgress Start-------------------");
    log(pd);
    log(pd.GetServiceDetailsResult);
    log("-------------- get5TrainProgress -------------------");
    //log(pd.GetServiceDetailsResult.previousCallingPoints);
    //log(pd.GetServiceDetailsResult.previousCallingPoints.callingPointList);
    //log(pd.GetServiceDetailsResult.previousCallingPoints.callingPointList[0].attributes);
    //log(pd.GetServiceDetailsResult.previousCallingPoints.callingPointList[0].callingPoint);
    var oSdr = pd.GetServiceDetailsResult;
    var d = oSdr.generatedAt;
    var pcp = "<font size='3'><b>" + "Details of the ";
    log("sta=", oSdr.sta);
    if (typeof (oSdr.sta) !== 'undefined') {
        pcp += oSdr.std + " train" ;
    } else {
        pcp += "next train" ;
    }

    if (typeof (oSdr.platform) !== 'undefined') {
        pcp += "<br>Platform: " + oSdr.platform + "</b></font>";
    } else {
        pcp += "</b></font>";
    }
    
    var luat = "Last Updated at " + ('00' + (d.getHours())).slice(-2) + ":" + ('00' + d.getMinutes()).slice(-2);
    log(luat);
    if (oSdr.isCancelled) {
        pcp += "<br><font size='4'>" + oSdr.disruptionReason + "</font><br>";
    } else {
        var oPcp = pd.GetServiceDetailsResult.previousCallingPoints
        if (oPcp !== null) {
            var cp = oPcp.callingPointList[0].callingPoint;
            log("cp=", cp);
            //pcp += "<hr>";
            var doneFlag = false;
            pcp += "<font size='4'>";
            if (typeof cp !== 'undefined') {
                pcp += "<table border='0'>";
                log("cp len=", cp.length)
                var i0 = 0;
                if (cp.length > 4) {
                    i0 = cp.length - 4;
                }
                for (var i = i0; i < cp.length; i++) {
                    log("\ni=", i, "cp[i]=", cp[i]);
                    //log("pcp=", pcp, "\n");
                    pcp += "<tr>";
                    //pcp += "<font size='14'>";
                    pcp += "<td>" + cp[i].st + "</td>";
                    if (typeof cp[i].at !== 'undefined') { //undefined means has not left here yet
                        pcp += "<td align='center' style='width:70px' >";
                        if (cp[i].at == "On time") {
                            pcp += "(<font size='3' style='color:Green'>" + cp[i].at + "</font>)";
                        } else if (cp[i].at == "No report") {
                            pcp += "(<font size='2' style='color:red'>" + cp[i].at + "</font>)";
                        } else if (cp[i].at == "Delayed") {
                            pcp += "(<font size='2' style='color:red'>" + cp[i].at + "</font>)";
                        } else {
                            pcp += "(&nbsp;&nbsp;<b style='color:red'><font size='3'>";
                            pcp += cp[i].at;
                            pcp += "</font></b>&nbsp;&nbsp;)";
                        }
                        pcp += "</td>";
                        //pcp += "(" + cp[i].at + ") ";
                        //doneFlag = true;
                    } else {
                        pcp += "<td align='center'>(&nbsp;&nbsp;--:--&nbsp;&nbsp;)</td>";
                    }
                    pcp += "<td>";
                    pcp += cp[i].locationName;
                    pcp += "</td>";
                    //pcp += "<br>";
                    pcp += "</tr>";
                    if (doneFlag) {
                        break;
                    }
                }
                pcp += "<tr>";
                pcp += "<td><b>" + oSdr.std + "</b></td><td align='center' style='width:70px' ><b>" ;
                if ((oSdr.atd == "On time") || (oSdr.etd == "On time")) {
                    pcp += "(&nbsp;&nbsp;<font size='3' style='color:Green'>" + oSdr.std + "</font>&nbsp;&nbsp;)";
                } else {
                    pcp += "(&nbsp;&nbsp;<b style='color:red'><font size='3'>";
                    pcp += oSdr.etd;
                    pcp += "</font></b>&nbsp;&nbsp;)";
                }
                pcp +=  "</b></td>";
                pcp +=  "<td><b>" + oSdr.locationName + "<b></td>";
                pcp += "</tr>"  ;
                pcp += "</table>";
            }
        } else {
            //Previous Calling point = Nulll, so train starts here
            var oGsdr = pd.GetServiceDetailsResult
            pcp += "<table border='0'>";
            pcp += "<tr>";
            pcp += "<td>" + oGsdr.std + "</td>";
            pcp += "<td align='center' style='width:70px' >";
            log("type of atd=", typeof oGsdr.adt)
            if (typeof oGsdr.atd === 'undefined') { //undefined means has not left here yet
                pcp += "(<font size='3' style='color:Green'>" + oGsdr.etd + "</font>)";
            } else {
                pcp += "(<font size='3' style='color:Blue'>" + oGsdr.atd + "</font>)";
            }
            pcp += "</td>";
            pcp += "<td>" + oGsdr.locationName + "</td>"; 
        }
        pcp += "</font>";
    }

    //pcp += "B: " + process.env.TZ;
    //process.env.TZ = 'Europe/London';
    //pcp += "       Y: " + process.env.TZ;

    //pcp += "<br><font size='4'>" + luat + "</font>";
    return pcp;
}

function get5TrainPost(pd) {
    // Details where the train after requested station
    log(pd);
    log("--------------- get5TrainPost ------------------");
    log(pd.GetServiceDetailsResult);
    //log(pd.GetServiceDetailsResult.previousCallingPoints);
    //log(pd.GetServiceDetailsResult.previousCallingPoints.callingPointList);
    //log(pd.GetServiceDetailsResult.previousCallingPoints.callingPointList[0].attributes);
    //log(pd.GetServiceDetailsResult.previousCallingPoints.callingPointList[0].callingPoint);
    var oSdr = pd.GetServiceDetailsResult;
    var d = oSdr.generatedAt;
    //var pcp = "<font size='3'><b>" + "Details of the ";
    var pcp ="";
/*    
    if (oSdr.sta !== undefined) {
        pcp += oSdr.sta + " train" + "<br>Platform: " + oSdr.platform + "</b></font>";
    } else {
        if (oSdr.platform !== undefined) {
            pcp += "next train" + "<br>Platform: " + oSdr.platform + "</b></font>";
        } else {
            pcp += "next train" + "</b></font>";
        }
    }
*/    
    var luat = "Last Updated at " + ('00' + (d.getHours())).slice(-2) + ":" + ('00' + d.getMinutes()).slice(-2);
    log(luat);
    if (oSdr.isCancelled) {
        pcp += "<br><font size='4'>" + oSdr.disruptionReason + "</font><br>";
    } else {
        var oPcp = pd.GetServiceDetailsResult.subsequentCallingPoints
        if (oPcp !== null) {
            var cp = oPcp.callingPointList[0].callingPoint;
            log("cp=", cp);
            //pcp += "<hr>";
            var doneFlag = false;
            pcp += "<font size='4'>";
            if (typeof cp !== 'undefined') {
                pcp += "<table border='0'>";
                for (var i = 0; i < cp.length; i++) {
                    //log("\ni=", i, "cp[i]=", cp[i]);
                    //log("pcp=", pcp, "\n");
                    pcp += "<tr>";
                    //pcp += "<font size='14'>";
                    pcp += "<td>" + cp[i].st + "</td>";
                    if (typeof cp[i].at !== 'undefined') { //undefined means has not left here yet
                        pcp += "<td align='center' style='width:70px' >";
                        if (cp[i].at == "On time") {
                            pcp += " (<font size='3' style='color:Green'>" + cp[i].at + "</font>) ";
                        } else {
                            pcp += " (<b style='color:red'><font size='3'>";
                            pcp += cp[i].at;
                            pcp += "</font></b>) ";
                        }
                        pcp += "</td>";
                        //pcp += "(" + cp[i].at + ") ";
                        //doneFlag = true;
                    } else {
                        pcp += "<td align='center' style='width:70px' >(&nbsp;&nbsp;--:--&nbsp;&nbsp;)</td>";
                    }
                    pcp += "<td>";
                    pcp += cp[i].locationName;
                    pcp += "</td>";
                    //pcp += "<br>";
                    pcp += "</tr>";
                    if (doneFlag) {
                        break;
                    }
                }
                pcp += "</table>";
            }
        } else {
            pcp += "<br><br>No more details available<br>";
        }
        pcp += "</font>";
    }

    //pcp += "B: " + process.env.TZ;
    //process.env.TZ = 'Europe/London';
    //pcp += "       Y: " + process.env.TZ;

    pcp += "<br><font size='4'>" + " " + "</font>";
    return pcp;
}



function get5newTrainTimes(err, result) {
    log("In getTrainTimes");
    var trainTimes = [];
    var sid = null;
    var data = "<!DOCTYPE html> <html><head><title>Commuting</title>";
    data += "<script>";
    data += "function reloadPage() { window.location.reload(); }";
    data += "function initAll() { setTimeout('reloadPage()', 120000); }";
    data += "</script>";
    data += "</head><body onLoad='initAll()'>";
    log("Error=", err);
    if (err) {
        data = data + "<br>Error in GetDepartureBoard<br>";
    } else { // 1
        var deptBoard = result['GetDepartureBoardResult'];
        log("result=", result);
	    log("%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%")
        log("deptBoard=", deptBoard);
	    log("%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%")
        // Load trainTimes from Depature board object
        if (deptBoard.trainServices !== undefined) {
            var service = deptBoard.trainServices.service;
            trainTimes.push({
                from:       deptBoard.locationName,
                fromcrs:    deptBoard.crs,
                to:         deptBoard.filterLocationName,
                tocrs:      deptBoard.filtercrs
            });
            for (var i =0; i < service.length; i++) {
                trainTimes.push ({
                    std: service[i].std,
                    etd: service[i].etd,
                    to:  service[i].destination.location[0].locationName,
                    platform: service[i].platform  
                });
            }
            
        } else {
            
        }
        log("Train Times=\n", trainTimes);
        
        
        if (deptBoard.trainServices !== undefined) {
            data = "<!DOCTYPE html> <html><head><title>Commuting to " +  deptBoard.filterLocationName + "</title>";
            data += "<script>";
            data += "function reloadPage() { window.location.reload(); }";
            data += "function initAll() { setTimeout('reloadPage()', 120000); }";
            data += "</script>";
            data += "</head><body onLoad='initAll()'>";            
            data += "<hr><font size='3'><b>";
            if (deptBoard.filterLocationName === undefined) {
                data += "From " + deptBoard.locationName;
            } else {
                data += deptBoard.locationName + " to " + deptBoard.filterLocationName;
            }
            data += "</b></font><br>";

            var trServices = deptBoard['trainServices'];
            log("\nTrain Service=", trServices);
            log("\nOrigin=", trServices.service[0].origin);
            log("##################");
            if (trServices === undefined) {
                data += "No Services<br>";
            } else { //0
                var aService = trServices['service'];
                var obj1 = aService;
                log("aService=", obj1);
                for (var i = 0; i < obj1.length; i++) {
                    var toLoc = obj1[i].destination.location[0].locationName;
                    var std = obj1[i].std;
                    var etd = obj1[i].etd;
                    var id = obj1[i].serviceID;
                    var pt = obj1[i].platform;
                    log("Platform=", pt);
                    log("DB entry=", deptBoard.locationName, std, pt)
                    log("id=", id);
                    data += "<font size='4'>" + std;
                    if (etd == "On time") {
                        data += " (<font size='4' style='color:Green'>" + etd + "</font>)";
                    } else if ((etd == "Cancelled") || (etd == "Delayed")) {
                        data += " (<b style='color:red'><font size='3'>";
                        data += etd;
                        data += "</font></b>)";
                    } else {
                        data += " (<b style='color:red'><font size='4'>";
                        data += etd;
                        data += "</font></b>)";
                    }
                    log("Filter loc=", deptBoard.filterLocationName);
                    if (deptBoard.filterLocationName === undefined) {
                        data += " " + toLoc.substring(0, 20);
                    }
                    if (pt !== undefined) {
                        data += "<b> P: " + pt + "</b>";
                    }
                    data += "</font><br>";
                } // for
            } // else 0
            data += " ";
            if (typeof obj1[0].serviceID !== 'undefined') {
                sid = obj1[0].serviceID;
            }
        } else { // deptBoard.trainServices !== undefined
            log("No train Service data available");
            data += "<b style='color:red'><font size='4'>";
            data += "No data available";
            data += "</font></b>";

        }
    } // else1
    //log("@END", data, sid);
    return {
        TT: data,
        SID: sid,
        TRAINTIMES: trainTimes
    };
}

// Configure App
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
var ejs = require('ejs');
// Use Middleware


// Define routes

app.get('/6/:begin/:end', function (req, res) {
    try {
        var st = req.params.begin;
        var en = req.params.end;

        if (en == "all") { en = ""; }

        var url = "/" + st + "/" + en;

        var sts = url.substring(1).toUpperCase().split('/')
 
        var railUrl = 'https://lite.realtime.nationalrail.co.uk/OpenLDBWS/wsdl.aspx?ver=2012-01-13';
        var soapHeader = '<AccessToken><TokenValue>b522e810-ce57-44f5-9e2e-f1a13de95fa0</TokenValue></AccessToken>';
        var options = {
            numRows: 6,
            crs: sts[0],
            filterCrs: sts[1],
            filterType: 'to'
        };

        soap.createClient(railUrl, function (err, client) {
            client.addSoapHeader(soapHeader);
            client.GetDepartureBoard(options, function (err, result) {
                if (err) {
                    log("Error:", err);
                } else {
                    try {
                        var trainBoard = getTrainBoard(err, result);
                        var tb = trainBoard.trainBoard;
                        res.render("index6", {
                            from:   tb[0].from,
                            to:     tb[0].to,
                            luat:   tb[0].luat,
                            trains: tb.slice(1)
                        });
                    } catch (err) {
                        log("Error:", err);
                        res.render("error", {
                            "err":    err.message,
                            "stack":  err.stack
                        });
                    }
                }        
            });
        });
        } catch (err) {
            log("Error:", err);
        }
});


function getTrainBoard(err, result) {
    var trainBoard = [];
    var sid = null;
    var deptBoard = result['GetDepartureBoardResult'];
    var msg = "";
    if (deptBoard.nrccMessages !== undefined) {
        msg = deptBoard.nrccMessages;
    }

    var d = deptBoard.generatedAt;
    var luat = "Last Updated at " + ('00' + (d.getHours())).slice(-2) + ":" + ('00' + d.getMinutes()).slice(-2) + ":" + ('00' + d.getSeconds()).slice(-2);

    if (deptBoard.trainServices !== undefined) {
        if (deptBoard.filterLocationName === undefined) {
            trainBoard.push({"from" : deptBoard.locationName, "to" : "", "luat": luat});
        } else {
            trainBoard.push({"from" : deptBoard.locationName, "to" : deptBoard.filterLocationName, "luat": luat});
        }
        var trServices = deptBoard['trainServices'];
        if (trServices !== undefined) {
            var aService = trServices['service'];
            for (var i = 0; i < aService.length; i++) {
                var toLoc = aService[i].destination.location[0].locationName;
                var std = aService[i].std;
                var etd = aService[i].etd;
                var id = aService[i].serviceID;
                var pt = aService[i].platform;
                var destCrs = aService[i].destination.location[0].crs;
                var origin = aService[i].origin.location[0].locationName;
                var ret = updateDeparturesDB(deptBoard.crs, destCrs ,deptBoard.generatedAt.getDay(),  std, pt);
                //log(ret.isFound, ret.platform);
                if ((pt === undefined) && (ret.isFound)) {
                    pt = ret.platform;
                }
                trainBoard.push({
                    "toloc" : toLoc, 
                    "std"   : std,
                    "etd"   : etd,
                    "id"    : id,
                    "pt"    : pt,
                    "dcrs"  : destCrs,
                    "origin": origin
                });
                //var ret = updateDeparturesDB(deptBoard.crs, destCrs ,deptBoard.generatedAt.getDay(),  std, pt);
            } // for
        }
    } 
    return { trainBoard };
}

app.all('/6a/:trainid', function (req, res) {
    var tid = req.params.trainid;
    for( var i=0; i<24; i++) {
        tid = tid.replace("@", "/");
    }

    //log("Train id =", tid)

    var railUrl = 'https://lite.realtime.nationalrail.co.uk/OpenLDBWS/wsdl.aspx?ver=2012-01-13';
    var soapHeader = '<AccessToken><TokenValue>b522e810-ce57-44f5-9e2e-f1a13de95fa0</TokenValue></AccessToken>';

    soap.createClient(railUrl, function (err, client) {
        client.addSoapHeader(soapHeader);
        if ((typeof tid !== 'undefined') && (tid !== null)) {
            client.GetServiceDetails({ serviceID: tid }, function (err, result2) {
                if( result2 != null) {
                    var sd = getTrainDetail(result2);
                    var td = renderTrainDetails(sd);
                    res.end(td);
                } else {
                    res.end("No Data");
                }
            });
        }   
    });
});


function getTrainDetail(pd) {
    var cps = [];
    var std, atd, loc, crs;
    var oSdr = pd.GetServiceDetailsResult;


    var oPcp = pd.GetServiceDetailsResult.previousCallingPoints
    if (oPcp !== null) {
        var cp = oPcp.callingPointList[0].callingPoint;

        if (typeof cp !== 'undefined') {
          for (var i = 0; i < cp.length; i++) {
                std = cp[i].st;
                if (typeof cp[i].at !== 'undefined') { //undefined means has not left here yet
                    atd = cp[i].at;
                } else {
                    atd = dash;
                }
                loc = cp[i].locationName;
                crs = cp[i].crs;
                //console.log(std, atd, loc);
                cps.push({
                    "std": std,
                    "atd": atd,
                    "loc": loc,
                    "crs": crs
                });
            }
            // Start station
            cps.push({
                "std": oSdr.std,
                "atd": (typeof oSdr.atd === 'undefined' ?  dash : oSdr.atd),
                "loc": oSdr.locationName,
                "crs": oSdr.crs
            });
        }
    } else {
        //Previous Calling point = Null, so train starts here
        var oGsdr = pd.GetServiceDetailsResult
        cps.push({
            "std": oGsdr.std,
            "atd": (typeof oGsdr.atd === 'undefined' ?  oGsdr.etd : oGsdr.atd),
            "loc": oGsdr.locationName,
            "crs": oGsdr.crs
        });
    }

    // Subsequent Calling Points
    var oScp = pd.GetServiceDetailsResult.subsequentCallingPoints
    if (oScp !== null) {
        var cp = oScp.callingPointList[0].callingPoint;

        if (typeof cp !== 'undefined') {
          for (var i = 0; i < cp.length; i++) {
                std = cp[i].st;
                if (typeof cp[i].at !== 'undefined') { //undefined means has not left here yet
                    atd = cp[i].at;
                } else {
                    atd = dash;
                }
                loc = cp[i].locationName;
                crs = cp[i].crs;
                //console.log(std, atd, loc);
                cps.push({
                    "std": std,
                    "atd": atd,
                    "loc": loc,
                    "crs": crs
                });
            }
        }
    }
    return cps;
}


function renderTrainDetails(sd){
    var template = fs.readFileSync(__dirname + '/views/partials/aTrainDetails.ejs', 'utf-8');
    var detailsHTML = ejs.render(template, {sd : sd});
    return detailsHTML;
}


function getArrivalBoard(err, result) {
    var trainBoard = [];
    var sid = null;
    var deptBoard = result['GetArrivalBoardResult'];
    var msg = "";
    if (deptBoard.nrccMessages !== undefined) {
        msg = deptBoard.nrccMessages;
    }

    var d = deptBoard.generatedAt;
    var luat = "Last Updated at " + ('00' + (d.getHours())).slice(-2) + ":" + ('00' + d.getMinutes()).slice(-2) + ":" + ('00' + d.getSeconds()).slice(-2);

    if (deptBoard.trainServices !== undefined) {
        if (deptBoard.filterLocationName === undefined) {
            trainBoard.push({"from" : deptBoard.locationName, "to" : "", "luat": luat});
        } else {
            trainBoard.push({"from" : deptBoard.locationName, "to" : deptBoard.filterLocationName, "luat": luat});
        }
        var trServices = deptBoard['trainServices'];
        if (trServices !== undefined) {
            var aService = trServices['service'];
            for (var i = 0; i < aService.length; i++) {
                var toLoc = aService[i].destination.location[0].locationName;
                var sta = aService[i].sta;
                var eta = aService[i].eta;
                var id = aService[i].serviceID;
                var pt = aService[i].platform;
                var destCrs = aService[i].destination.location[0].crs;
                var origin = aService[i].origin.location[0].locationName;
                //var ret = updateDeparturesDB(deptBoard.crs, destCrs ,deptBoard.generatedAt.getDay(),  std, pt);
                //log(ret.isFound, ret.platform);
                trainBoard.push({
                    "toloc" : toLoc, 
                    "sta"   : sta,
                    "eta"   : eta,
                    "id"    : id,
                    "pt"    : pt,
                    "dcrs"  : destCrs,
                    "origin": origin
                });
                //var ret = updateDeparturesDB(deptBoard.crs, destCrs ,deptBoard.generatedAt.getDay(),  std, pt);
            } // for
        }
    } 
    return { trainBoard };
}


app.all('/7a/:crs', function (req, res) {
    try {
        var st = req.params.crs.toUpperCase();

        var railUrl = 'https://lite.realtime.nationalrail.co.uk/OpenLDBWS/wsdl.aspx?ver=2012-01-13';
        var soapHeader = '<AccessToken><TokenValue>b522e810-ce57-44f5-9e2e-f1a13de95fa0</TokenValue></AccessToken>';
        var options1 = { numRows: 10, crs: st };

        soap.createClient(railUrl, function (err, client) {
            client.addSoapHeader(soapHeader);
            client.GetArrivalBoard(options1, function (err, result1) {
                if (err) {
                    log("Error1A:", err);
                } else {
                    try {
                            var test = 1;
                            var arrivalBoard = getArrivalBoard(err, result1);
                            var tb1 = arrivalBoard.trainBoard;
                            if (tb1[0] === undefined) {
                                res.render("nodata");
                            } else {
                                res.render("index7a", {
                                        from:   tb1[0].from,
                                        to:     tb1[0].to,
                                        luat:   tb1[0].luat,
                                        trains: tb1.slice(1)
                                    });
                            }
                            
                        } catch (err) {
                            log("Error:", err);
                            res.render("error", {
                                "err":    err.message,
                                "stack":  err.stack
                            });
                        }
                    }        
            });
        });


        } catch (err) {
            log("Error:", err);
        }
});


app.get('/7/:begin/:end1/:end2', function (req, res) {
    try {
        var st = req.params.begin.toUpperCase();
        var en1 = req.params.end1.toUpperCase();
        var en2 = req.params.end2.toUpperCase();
        console.log("st=", st,"en1=", en1, "en2=", en2);
        console.log(req.params);

        if(en2.toLowerCase() == "styles.css") {
            res.sendFile(path.join(__dirname, 'css/styles.css'));
            return;
        }

        if(en2.toLowerCase() == "index7.js") {
            res.sendFile(path.join(__dirname, 'js/index7.js'));
            return;
        }


        if (en1 == "all") { en1 = ""; }

        var railUrl = 'https://lite.realtime.nationalrail.co.uk/OpenLDBWS/wsdl.aspx?ver=2012-01-13';
        var soapHeader = '<AccessToken><TokenValue>b522e810-ce57-44f5-9e2e-f1a13de95fa0</TokenValue></AccessToken>';
        var options1 = { numRows: 6, crs: st, filterCrs: en1, filterType: 'to' };
        var options2 = { numRows: 6, crs: st, filterCrs: en2, filterType: 'to' };

        soap.createClient(railUrl, function (err, client) {
            client.addSoapHeader(soapHeader);
            client.GetDepartureBoard(options1, function (err, result1) {
                if (err) {
                    log("Error1:", err);
                } else {
                    client.addSoapHeader(soapHeader);
                    client.GetDepartureBoard(options2, function (err, result2) {
                        if (err) {
                            log("Error2:", err);
                        } else {
                            try {
                                var trainBoard = getTrainBoard(err, result1);
                                var tb1 = trainBoard.trainBoard;
                                trainBoard = getTrainBoard(err, result2);
                                var tb2 = trainBoard.trainBoard;
                                //console.log("tb1=", tb1);
                                //console.log("tb2=", tb2);
                                if ((tb1[0] === undefined) || (tb2[0] === undefined)) {
                                    res.render("nodata");
                                } else {
                                    res.render("index7", {
                                            from1:   tb1[0].from,
                                            to1:     tb1[0].to,
                                            luat1:   tb1[0].luat,
                                            trains1: tb1.slice(1),
                                            from2:   tb2[0].from,
                                            to2:     tb2[0].to,
                                            luat2:   tb2[0].luat,
                                            trains2: tb2.slice(1)
                                        });
                                }
                                } catch (err) {
                                    log("Error:", err);
                                    res.render("error", {
                                        "err":    err.message,
                                        "stack":  err.stack
                                    });
                                }
                        }        
                    });
                                
                }        
            });
        });



        } catch (err) {
            log("Error:", err);
        }
});
