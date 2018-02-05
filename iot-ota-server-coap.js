//
// Reference node-coap library:
// https://github.com/mcollina/node-coap
//
//

var coap = require('coap');
var fs = require('fs');
require('log-timestamp');

//
// Configuration constants
//

// UPDATE_URL without leading or trailing slashes
var UPDATE_URL = "/updates";

// Firmware binary directory
var FW_BIN_DIR = '.'+UPDATE_URL;

console.log("Firmware update server starting up ...");
var server = coap.createServer({ type: 'udp4' });

// Here we want to read and index all '.bin' files.
// Files are of this format:
//   <PID>_<TYPE>_<VERSION>.bin
// PID is matched exactly with what the client sends.
// TYPE is a one-byte field enumerating fm.release.Update.ImageType.
// The files contain the type enumeration name, e.g. "APP".
// 

console.log("Checking available updates in " + FW_BIN_DIR + " ...");
var dirlist = fs.readdirSync(FW_BIN_DIR);

// create a fwInfo structure:
//   file name, pid, type, major, minor, build

var fwInfoList = [];

if (dirlist.length > 0) {

    for (var i in dirlist) {
        var f = dirlist[i];
        var s = f.split('.');
        if (s.length == 2) {
            if (s[s.length-1] == 'fmu') {
                // Got a .fmu file, now try to parse it
                // Separate based on underscore:
                //   OTA-MSP432-CC3100_APP_3_1_0_0x2131231.bin
                var sections = s[0].split("_");
                var pid = sections[0];
                var type = typeToInt(sections[4]);
                var major = sections[1];
                var minor = sections[2];
                var build = sections[3];
                var version = major << 24 | minor << 16 | build;
                
                var info = {
                    name : f,
                    pid : pid,
                    type : type,
                    major : major,
                    minor : minor,
                    build : build,
                    version : version
                };
                
                fwInfoList.push(info);
                var n = Number(i)+1;
                console.log("  " + (n) + " : " + f);
            }
        }
    }
}

console.log(fwInfoList.length + " update files available.");

function typeToInt(str) {

    var type = 0;
    switch (str) {
        case "APP": type = 3; break;
        default: type = 0; break;
    }
    return type;
}


server.on('request', function(req, res) {
    // Req of type IncomingMessage
    // res of type OutgoingMessage
    //
    // req.payload of type Buffer
    //
    // IncomingMessage type has these fields:
    //    - payload (Buffer)
    //    - options
    //    - headers
    //    - code
    //    - method
    //    - url
    //    - rsinfo

    // OutgoingMessage type has these fields:
    //   - code
    //   - statusCode
    //   - setOption()
    //   - reset()
    //
    //
    // We use reset() to signal to the client that we don't
    // have a suitable update.  Otherwise, we send the bytes down.


    var client_id = req.rsinfo.family + ':' + req.rsinfo.address + ':' + req.rsinfo.port;
    console.log("------------------------------------------------");
    console.log("Client request from: " + client_id);
    console.log("Client request URL: " + req.url);

    console.log("payload: " + req.payload);

    console.log("options: ");
    for (var i in req.options) {
        var opt = req.options[i];
        console.log(opt.name + " : " + opt.value.toString('hex'));
    }

    if (req.url == UPDATE_URL) {
       
        // Determine the PID, TYPE and VERSION
        var clientFWInfo = parseGetFWInfo(req.payload)
        
        var fw_file = "";
        var fw_offset = 0;
        
        if (clientFWInfo != null) {
            // match to a suitable candidate image
            // find all matches, then choose the file with the largest (most recent) version.
            
            // and assign it to the fw_file
            var candidate_version = 0;
            for (var i in fwInfoList) {
                var serverFWInfo = fwInfoList[i];
                if (clientFWInfo.pid == serverFWInfo.pid &&
                    clientFWInfo.type == serverFWInfo.type &&
                    clientFWInfo.version < serverFWInfo.version &&
                    serverFWInfo.version > candidate_version)  {
                    // got suitable candidate, record the version in case
                    // there's a better one available
                    candidate_version = serverFWInfo.version;
                    
                    fw_file = serverFWInfo.name;
                    fw_offset = clientFWInfo.offset;
                    console.log(" matching " + fw_file);
                }
            }        
        }
        
        if (fw_file == "") {
            // nothing to update to, issue a reset
            console.log("No update available.");
            res.reset();
        
        } else {
            // Send update
            var fw_bin = fs.readFileSync(FW_BIN_DIR+'/'+fw_file);
            
            // check size of offset against file size
            if (fw_offset < fw_bin.length) {
            
                console.log("Sending firmware binary ["+fw_file+"] bytes: ["+ fw_offset 
                                + ", " + fw_bin.length + "]");
                res.end(fw_bin.slice(fw_offset, fw_bin.length));
            } else {
                console.log("Error: firmware offset ["+fw_offset+"] greater than file length [" + fw_bin.length + "]");
            }
        }
    } else {
        console.log("invalid URL");
        res.reset();
    }
});

server.listen( function() {
    console.log("OTA server listening on coap://localhost:5683");
});


//
// Parse the firmware request information present in 
// the GET request.
//
//  +--------+--------------+------+---------+--------+
//  | PIDLEN | PID          | TYPE | VERSION | OFFSET |
//  +--------+--------------+------+---------+--------+
//       1           n           1       4       4
function parseGetFWInfo(buf)
{
    console.log("Parsing firmware update request...");
    if (buf == undefined || buf.length < 7) {
        return null;
    }
    
    var pidlen = buf.readUInt8(0);
    if (pidlen >= buf.length) {
        return null;
    }
    
    var fwInfo = {
        pid : buf.toString('ascii', 1, 1 + pidlen),
        type : buf.readUInt8(1 + pidlen),
        version : buf.readUInt32LE(2 + pidlen),
        offset : buf.readUInt32LE(6 + pidlen),

    };
    
    console.log(fwInfo);
    
    return fwInfo;
}
