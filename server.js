/**
 * Created by User on 5/31/2016.
 */
var express = require('express');
var snmp = require("net-snmp");
var StringDecoder = require('string_decoder').StringDecoder;
var bodyParser = require('body-parser'); //parametros para o POST
var _ = require('lodash');

var app = express();
app.use(express.static(__dirname));
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies
app.listen(8080);
console.log("App listening on port 8080");


//http://www.simpleweb.org/ietf/mibs/modules/html/?category=IETF&module=SNMPv2-MIB

var session = null;

var SYSTEM_OIDS = {
    DESCR: '1.3.6.1.2.1.1.1.0',
    SYSUPTIME: '1.3.6.1.2.1.1.3.0',
    CONTACT: '1.3.6.1.2.1.1.4.0',
    USERNAME: '1.3.6.1.2.1.1.5.0',
    LOCATION: '1.3.6.1.2.1.1.6.0'
};

app.post('/api/start', function(req, res){
    session = snmp.createSession(req.body.hostAddress, "public", {version: snmp.Version2c});
    res.status(200).send('');
});

app.get('/api/data', function (req, res) {
    var decoder = new StringDecoder('utf8');

    if(session == null){
        res.status(400).send('');
        return;
    }

    var system_oids = [];

    _.forEach(SYSTEM_OIDS, function(oid){
        system_oids.push(oid);
    });

    session.get(system_oids, function (err, result) {
        if (err) {
            console.log(err);
        }else{
            for (var i = 0; i < result.length; i++) {
                if (result[i].type == 4) {
                    //octet string
                    result[i].value = decoder.write(result[i].value);
                }
            }
        }
        res.json(result);
    });

});
