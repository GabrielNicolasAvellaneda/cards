/**
 * Created by developer on 04/01/2016.
 */

var Card = function (value) {
    this.value = value;
    this.selected = false;
};

var app = angular.module('app', [])

    .controller('CardHandController', function ($scope) {
        $scope.hand = [1, 2, 1, 4].map(function (x) { return new Card(x); });
        $scope.select = function (c) {
            c.selected = !c.selected;
        };

        $scope.onTable = [1, 2].map(function (x) { return new Card(x); });

        $scope.canPlay = false;

        $scope.pass = function () {
            console.log("pass")
        };

        $scope.play = function () {
            console.log("play");
        };

    });
