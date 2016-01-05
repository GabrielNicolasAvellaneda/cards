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
        $scope.selectCard = function (c) {
            c.selected = !c.selected;
            $scope.selectedCardsCount = $scope.hand.filter(function (c) { return c.selected; }).length;
        };

        $scope.state = {};

        $scope.selectedCardsCount = 0;

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
        .filter('gamestateFormat', function () {
           return function (input) {
               // TODO: Expose common Game Server objects.
                if (input.gameState == 'WaitingForPlayers') {
                    return "Waiting for Players";
                } else if (input.gameState == 'Playing') {
                    return (input.currentPlayer == input.player)? "It's your turn!" : "Please wait for your opponent";
                }
                return input.gameState;
               };
        })
        .filter('selectedFormat', function () {
            return function (n) {
                if (n == 0) {
                    return "Nothing selected...";
                }
                return "Selected " + n + " card" + ((n > 0)? "s" : "");
            };
    });


