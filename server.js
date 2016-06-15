/**
 * Created by User on 5/31/2016.
 */
var express = require('express');
var snmp = require("net-snmp");
var StringDecoder = require('string_decoder').StringDecoder;
var bodyParser = require('body-parser'); //parametros para o POST
var _ = require('lodash');
var decoder = new StringDecoder('utf8');

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
}; //Dados do ITEM 2


var INTERFACES_TABLE = '1.3.6.1.2.1.2.2'; //Tabela para o item 3

app.post('/api/start', function(req, res){
    //Conecta ao IP enviado Item 1
    session = snmp.createSession(req.body.hostAddress, "public", {version: snmp.Version2c});
    res.status(200).send('');
});

app.get('/api/interfaces', function(req, res){
    if(session == null){
        res.status(400).send('');
        return;
    }

    //20 max of rows
    session.table(INTERFACES_TABLE, 20, function(err, result){
        if (err) {
            console.log(err);
            res.status(400).json(err);
            return;
        }else{
            _.forEach(result, function(item){
                //temos que converter as strings
                //Teremos 2 campos String o ifDescr(2) e o ifPhysAddress(6)
                result[2].value = decoder.write(result[2].value);
                result[6].value = decoder.write(result[6].value);
            });

            res.json(result);
        }
    });
});

app.get('/api/data', function (req, res) {

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
            res.status(400).json(err);
            return;
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
