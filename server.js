/**
 * Created by User on 5/31/2016.
 */
var express = require('express');
var snmp = require("net-snmp");
var StringDecoder = require('string_decoder').StringDecoder;

var app = express();
app.listen(8080);
console.log("App listening on port 8080");

app.get('/api/data', function (req, res) {

    var decoder = new StringDecoder('utf8');

    var session = snmp.createSession("127.0.0.1", "public", {version: snmp.Version2c});

    var oids = ['1.3.6.1.2.1.1.5.0', '1.3.6.1.2.1.1.6.0'];

    session.get(oids, function (err, result) {
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
