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

        $scope.OIDS = {
            USERNAME: '1.3.6.1.2.1.1.5.0',
            LOCATION: '1.3.6.1.2.1.1.6.0'
        };

        $scope.data = undefined;

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

        init();
    });