/**
 * Created by Daniel Costa <danielcosta123@gmail.com> on 9/19/2015.
 */
(function () {
    'use strict';
    angular.module('MyApp')
        .directive('bootstrapPanel', [
            function () {
                return {
                    restrict: 'E',
                    templateUrl: 'panel/panel.html',
                    scope: {
                        title: '@',
                        type: '@'
                    },
                    transclude:true
                };
            }]);
}());
