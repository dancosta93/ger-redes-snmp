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

        $scope.hostAddress = "127.0.0.1";

        var SYSTEM_OIDS = {
            DESCR: '1.3.6.1.2.1.1.1.0',
            SYSUPTIME: '1.3.6.1.2.1.1.3.0',
            CONTACT: '1.3.6.1.2.1.1.4.0',
            USERNAME: '1.3.6.1.2.1.1.5.0',
            LOCATION: '1.3.6.1.2.1.1.6.0'
        };

        $scope.SYSTEM_OIDS = SYSTEM_OIDS;

        $scope.data = undefined;

        $scope.checkPorts = function(){
            $http.get(URL + "api/checkPorts", {hostAddress: $scope.hostAddress})
                .then(function (data) {
                    $scope.portsData = data.data.split("\n");
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
            $http.post(URL + 'api/start', {hostAddress: $scope.hostAddress})
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