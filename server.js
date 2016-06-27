/**
 * Created by User on 5/31/2016.
 */
var express = require('express');
var snmp = require("net-snmp");
var StringDecoder = require('string_decoder').StringDecoder;
var bodyParser = require('body-parser'); //parametros para o POST
var _ = require('lodash');
var decoder = new StringDecoder('utf8');
var shellJs = require('shelljs');
var app = express();
app.use(express.static(__dirname));
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({extended: true})); // support encoded bodies
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

var MIB_HOST = '1.3.6.1.2.1.25'; // Para o item 4 (hrSystem:1, hrStorage:2, hrDevice:3, hrSWRun:4, hrSWRunPerf:5, hrSWInstalled:6)

/**
 * Inicia um objeto com as configuracoes para o SNMP usar
 */
app.post('/api/start', function (req, res) {
    //Conecta ao IP enviado Item 1
    session = snmp.createSession(req.body.hostAddress, "public", {version: snmp.Version2c});
    res.status(200).send('');
});

/**
 * Retorna as interfaces de rede (modeladas para o ex: 3)
 */
app.get('/api/interfaces', function (req, res) {
    if (session == null) {
        res.status(400).send('');
        return;
    }

    session.table(INTERFACES_TABLE, 20, function (err, result) {
        if (err) {
            res.status(400).json(err);
            return;
        } else {
            var response = [];
            var keys = Object.keys(result); //preciamos usar as keys ja que o array eh associativo, ele retornara o indice do oid como .1 .2 .3, etc.
            for (var i = 0; i < keys.length; i++) {
                var item = result[keys[i]];
                var obj = {};
                //temos que converter as strings
                //O ifDescr(2) eh string entao temos que converter
                if (item[2])
                    obj.descr = decoder.write(item[2]);

                //MTU é o quarto item, e é integer
                if (item[4])
                    obj.mtu = item[4];
                //O phys address nao eh convertido pra string, pois representa o MAC address. Cada item do array esta em decimal, e sera convertido para hexadecimal
                //http://stackoverflow.com/questions/57803/how-to-convert-decimal-to-hex-in-javascript

                if (item[6] && item[6].length > 0)
                    obj.physAddress = convertMacAddress(item[6]);

                response.push(obj);
            }
            res.json(response);
        }
    });
});

//O MAC address eh retornado como um array de inteiro, temos que converter para hexadecimal e transformar em string
function convertMacAddress(addrArray) {
    var convertido = []
    _.forEach(addrArray, function (i) {
        convertido.push(i.toString(16)); //converte na base 16 para converter para hexa
    });

    return convertido.join(":");
}

/**
 * Retorna os dados principais do sistema
 */
app.get('/api/data', function (req, res) {

    if (session == null) {
        res.status(400).send('');
        return;
    }

    var system_oids = [];

    _.forEach(SYSTEM_OIDS, function (oid) {
        system_oids.push(oid);
    });

    session.get(system_oids, function (err, result) {
        if (err) {
            console.log(err);
            res.status(400).json(err);
            return;
        } else {
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


/**
 * Informacao sobre a rede
 */
app.get('/api/network', function (req, res) {

});

/**
 * Informacao sobre memoria
 */
app.get('/api/memory', function (req, res) {

});

/**
 * Checa se uma porta esta aberta usando nmap
 */
app.get('/api/checkPorts', function (req, res) {
    shellJs.exec('nmap -O 127.0.0.1', function(code, stdout, stderr) {
        res.json(stdout);
    });
});


/**
 * Informacao sobre armazenamento
 * Tamanho do HD, espaco livre e ocupado de cada particao em percentuais (Item 4.1)
 */
app.get('/api/storage', function (req, res) {
    //http://oid-info.com/get/1.3.6.1.2.1.25.2.3.1
    //Storage esta dentro da MIB_HOST, usamos o hrStorage (2) e a table - hrStorageTable(3)

    var HR_STORAGE_TABLE = MIB_HOST + ".2.3";

    if (session == null) {
        res.status(400).send('');
        return;
    }

    session.table(HR_STORAGE_TABLE, 20, function (err, result) {
        if (err) {
            res.status(400).json(err);
            return;
        } else {
            var response = [];

            _.forEach(result, function (item) {
                var obj = {};
                obj.type = item[2];
                //.3 eh o hrStorageDescr, precisamos fazer o parse
                if (item[3]) {
                    obj.descr = decoder.write(item[3]);
                }
                obj.allocationUnits = item[4];
                //Divide 2x por 1024, assim retornamos em MB
                obj.storageSize = (item[5] * obj.allocationUnits) / 1024 / 1024; //precisamos multiplicar pela allocation units, o resultado sera em bytes
                obj.storageUsed = (item[6] * obj.allocationUnits) / 1024 / 1024;//precisamos multiplicar pela allocation units
                response.push(obj);
            });

            res.json(response);
        }
    });
});

/**
 * Retorna os softwares instalados
 * Visualizar o nome dos programas instalados e data de instalacao (Item 4.2)
 *
 */
app.get('/api/swInstalled', function (req, res) {
    //http://oid-info.com/get/1.3.6.1.2.1.25.6.3
    //hrSWInstalled esta dentro da MIB_HOST, usamos o hrSWInstalled (6) e a table - hrSWInstalledTable(3)

    var HR_SW_INSTALLED_TABLE = MIB_HOST + ".6.3";

    if (session == null) {
        res.status(400).send('');
        return;
    }

    session.table(HR_SW_INSTALLED_TABLE, 20, function (err, result) {
        if (err) {
            res.status(400).json(err);
            return;
        } else {
            var response = [];

            var TYPES = ["Desconhecido", "Sistema Operacional", "Driver de dispositivo", "Aplicação"];

            _.forEach(result, function (item) {
                var obj = {};
                //.2 eh o hrSWInstalledName, precisamos fazer o parse
                if (item[2]) {
                    obj.name = decoder.write(item[2]);
                }
                if (item[4]) {
                    obj.type = TYPES[item[4] - 1];
                }

                if (item[5]) {
                    obj.installDate = item[5];
                }
                response.push(obj);
            });

            res.json(response);
        }
    });
});

/**
 * Retorna os programas rodando
 * Visualizar os programas em execucao e a qtd. de memoria e CPU que cada processo esta utilizando (Item 4.4)
 *
 */
app.get('/api/swRunning', function (req, res) {
    //http://oid-info.com/get/1.3.6.1.2.1.25.4.2
    //hrSWRun esta dentro da MIB_HOST, usamos o hrSWRun (4) e a table - hrSWRunTable(2)

    var HR_SW_RUN_TABLE = MIB_HOST + ".4.2";

    var HR_SW_RUN_PERF_TABLE = MIB_HOST + ".5.1";

    if (session == null) {
        res.status(400).send('');
        return;
    }

    session.table(HR_SW_RUN_TABLE, 20, function (err, result) {
        if (err) {
            res.status(400).json(err);
            return;
        } else {
            var response = [];

            var RUN_TYPE = ["Desconhecido", "Sistema Operacional", "Driver de dispositivo", "Aplicação"];

            var RUN_STATUS = ["Executando", "Executável (esperando recurso)", "Não Executável (carregado, mas esperando por evento)", "Inválido"];

            try {
                _.forEach(result, function (item) {
                    var obj = {};

                    obj.index = item[1]; //vamos usar o index pra relacionar com a performance depois

                    //.2 eh o hrSWRunName, precisamos fazer o parse
                    if (item[2]) {
                        obj.name = decoder.write(item[2]);
                    }

                    if (item[4]) {
                        obj.swRunPath = decoder.write(item[4]);
                    }

                    if (item[5]) {
                        obj.swRunParameters = decoder.write(item[5]);
                    }
                    if (item[6]) {
                        obj.swRunType = RUN_TYPE[item[6] - 1];
                    }
                    if (item[7]) {
                        obj.swRunStatus = RUN_STATUS[item[7] - 1];
                    }
                    response.push(obj);
                });

                session.table(HR_SW_RUN_PERF_TABLE, 20, function(err, result){
                    if (err) {
                        res.status(400).json(err);
                        return;
                    }
                    var keys = Object.keys(result); //para relacionar com os indexes da table anterior, precisamos das keys
                    for (var i = 0; i < keys.length; i++) {
                        var key = keys[i];
                        var perfData = result[key];
                        //No array criado anteriormente com o swRunning, procuramos nele pelo index
                        var swRunning = _.find(response, function(i){
                            return i.index == key;
                        });
                        if(swRunning){
                            swRunning.perfCpu = perfData[1] / 1000; //TODO como converte isso
                            swRunning.perfMem = perfData[2] / 1024; //a info esta em kb converte pra mb
                        }
                    }
                    res.json(response);
                });
            } catch (ex) {
                console.log(ex);
                res.status(400).json(ex);
                return;
            }
        }
    });
});


