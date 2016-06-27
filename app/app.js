/**
 * Created by Daniel Costa <danielcosta123@gmail.com> on 11/20/2015.
 */

'use strict';

angular.module('MyApp', ['ui.bootstrap'])
    .constant('URL', "http://127.0.0.1:8080/")
    .constant('_', window._); //lodash

angular.module('MyApp')
    .controller('AppController', function ($scope, $http, URL) {

        var vm = this;

        vm.perPage = 20;

        $scope.findValue = findValue;


        var SYSTEM_OIDS = {
            DESCR: '1.3.6.1.2.1.1.1.0',
            SYSUPTIME: '1.3.6.1.2.1.1.3.0',
            CONTACT: '1.3.6.1.2.1.1.4.0',
            USERNAME: '1.3.6.1.2.1.1.5.0',
            LOCATION: '1.3.6.1.2.1.1.6.0'
        };

        $scope.SYSTEM_OIDS = SYSTEM_OIDS;

        $scope.data = undefined;

        $scope.params = {};
        $scope.params.destAddress = "";
        $scope.params.hostAddress = "127.0.0.1";

        /**
         * Testa rotas com mtr
         */
        $scope.testRoute = function(){
            $scope.loading = true;
            $scope.routeError = false;
            $scope.routes = [];
            $http.post(URL + "api/testRoute", {destAddress: $scope.params.destAddress})
                .then(function (data) {
                    data.data = data.data.replace(/ +(?= )/g,''); //transforma todos os espacos multiplos em apenas um espaco
                    //descarta os 2 primeiros
                    $scope.routes = data.data.split("\n");
                    $scope.routes.shift();
                    $scope.routes.shift();
                    $scope.loading = false;
                },function(err){
                    $scope.loading = false;
                    $scope.routeError = true;
                    console.log(err);
                });
        };

        /**
         * Checa portas abertas com nmap
         */
        $scope.checkPorts = function(){
            $scope.loading = true;
            $scope.portsOpen = [];
            $http.post(URL + "api/checkPorts", {hostAddress: $scope.params.hostAddress})
                .then(function (data) {
                    data.data = data.data.replace(/ +(?= )/g,''); //transforma todos os espacos multiplos em apenas um espaco
                    //as linhas com as portas abertas estao entre a linha que inicia com PORT(o header) e a que comeca com Device type
                    var firstSplit = data.data.split("PORT");
                    // console.log(firstSplit);
                    var secondSplit = firstSplit[1].split("Device type");
                    // console.log(secondSplit);
                    var thirdSplit = secondSplit[0].split("\n");
                    // console.log(thirdSplit);
                    //Agora ignoramos o primeiro e o ultimo item
                    thirdSplit.shift();
                    thirdSplit.pop();
                    $scope.portsOpen = thirdSplit;
                    $scope.loading = false;
                },function(err){
                    $scope.portsError = true;
                    $scope.loading = false;
                    console.log(err);
                });
        };

        /**
         * Carrega os dados de interfaces de rede
         */
        $scope.loadInterfaces = function(){
            $scope.loading = true;
            $scope.interfaces = [];
            $http.get(URL + "api/interfaces")
                .then(function (data) {
                    $scope.loading = false;
                    $scope.interfaces = data.data;
                },function(err){
                    $scope.interfaceError = true;
                    $scope.loading = false;
                    console.log(err);
                });
        };

        /**
         * Carrega os dados de armazenamento
         */
        $scope.loadStorage = function(){
            $scope.loading = true;
            $scope.storage = [];
            $http.get(URL + "api/storage")
                .then(function (data) {
                    $scope.loading = false;
                    $scope.storage = data.data;
                },function(err){
                    $scope.storageError = true;
                    $scope.loading = false;
                    console.log(err);
                });
        };

        /**
         * Carrega os dados de softwares instalados
         */
        $scope.loadSwInstalled = function(){
            vm.swInstalledPage = 1;
            $scope.loading = true;
            $scope.swInstalled = [];
            $http.get(URL + "api/swInstalled")
                .then(function (data) {
                    $scope.loading = false;
                    $scope.swInstalled = data.data;
                },function(err){
                    $scope.swInstalledError = true;
                    $scope.loading = false;
                    console.log(err);
                });
        };

        /**
         * Carrega os dados de Softwares Rodando
         */
        $scope.loadSwRunning = function(){
            vm.swRunningPage = 1;
            $scope.loading = true;
            $scope.swRunning = [];
            $http.get(URL + "api/swRunning")
                .then(function (data) {
                    $scope.loading = false;
                    $scope.swRunning = data.data;
                },function(err){
                    $scope.swRunningError = true;
                    $scope.loading = false;
                    console.log(err);
                });
        };

        /**
         * Inicializa os parametros iniciais para realizar os comandos SNMP
         */
        $scope.connect = function () {
            $scope.loading = true;
            $http.post(URL + 'api/start', {hostAddress: $scope.params.hostAddress})
                .then(function () {
                    $scope.loading = false;
                    $scope.connected = true;
                    init();
                });
        };

        /**
         * Converte uma data retornada num snmptable (temos na hrSWInstalled)
         * @param date
         * @returns {string}
         */
        $scope.parseDate = function(date){
            var year = date[1];
            var month = date[2];
            var day = date[3];

            return day + "/" + month + "/" + year;
        };

        /**
         * Funcao rodada ao iniciar
         * Pega os dados principais (do sistema)
         */
        function init() {
            $scope.loading = true;
            $http.get(URL + "api/data")
                .then(function (data) {
                    $scope.loading = false;
                    $scope.data = data.data;
                });
        }

        /**
         * Acha o valor pela OID no array retornado de dados do system
         * @param oid
         * @returns {*}
         */
        function findValue(oid) {
            if (!$scope.data) return "";
            var result = _.find($scope.data, function (item) {
                return item.oid == oid;
            });

            return result.value;
        }
    });