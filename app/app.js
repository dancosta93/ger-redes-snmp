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

        $scope.testRoute = function(){
            $http.post(URL + "api/testRoute", {destAddress: $scope.params.destAddress})
                .then(function (data) {
                    $scope.routes = data.data.split("\n");
                    console.log($scope.routes);
                });
        };

        $scope.checkPorts = function(){
            $http.post(URL + "api/checkPorts", {hostAddress: $scope.params.hostAddress})
                .then(function (data) {
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
                });
        };

        $scope.loadInterfaces = function(){
            $http.get(URL + "api/interfaces")
                .then(function (data) {
                    $scope.interfaces = data.data;
                });
        };

        $scope.loadStorage = function(){
            $http.get(URL + "api/storage")
                .then(function (data) {
                    console.log(data);
                    $scope.storage = data.data;
                });
        };

        $scope.loadSwInstalled = function(){
            $http.get(URL + "api/swInstalled")
                .then(function (data) {
                    console.log(data);
                    $scope.swInstalled = data.data;
                });
        };

        $scope.loadSwRunning = function(){
            $http.get(URL + "api/swRunning")
                .then(function (data) {
                    console.log(data);
                    $scope.swRunning = data.data;
                });
        };

        $scope.connect = function () {
            $http.post(URL + 'api/start', {hostAddress: $scope.params.hostAddress})
                .then(function () {
                    $scope.connected = true;
                    init();
                });
        };

        function init() {
            $http.get(URL + "api/data")
                .then(function (data) {
                    console.log(data);
                    $scope.data = data.data;
                });
        }

        function findValue(oid) {
            if (!$scope.data) return "";
            var result = _.find($scope.data, function (item) {
                return item.oid == oid;
            });

            return result.value;
        }
    });