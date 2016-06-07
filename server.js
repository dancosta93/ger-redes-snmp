/**
 * Created by User on 5/31/2016.
 */
var express = require('express');
var snmp = require("net-snmp");
var StringDecoder = require('string_decoder').StringDecoder;

var app = express();
var bodyParser = require('body-parser'); //parametros para o POST
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies
app.listen(8080);
console.log("App listening on port 8080");

var session = null;

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
