/**
 * Created by developer on 04/01/2016.
 */

var Card = function (value) {
    this.value = value;
    this.selected = false;
};

var app = angular.module('app', [])

    .controller('MainController', function ($scope, $http, $timeout) {
        $scope.hand = [1, 2, 1, 4, 5, 6, 7, 8, 8, 9].map(function (x) { return new Card(x); });
        $scope.select = function (c) {
            c.selected = !c.selected;
        };

        $scope.onTable = [1, 2].map(function (x) { return new Card(x); });

        $scope.canPlay = false;

        $scope.pass = function () {
            console.log("pass")
        };

        var getState = function () {
            $http.get('/status').then(function (result) {
                console.log(result.data);
                $scope.state = result.data;
                $timeout(getState, 1000);
            });
        };

        getState();

        $scope.play = function () {
            console.log("play");
        };

    })
        .filter('gamestate', function () {
           return function (input) {
            if (input == 'WaitingForPlayers') {
                return "Waiting for Players";
            }
            return "NO_TEXT";
           };
        });
