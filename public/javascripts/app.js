/**
 * Created by developer on 04/01/2016.
 */

var Card = function (value, suite, selected) {
    this.value = value;
    this.suite = suite;
    this.selected = selected || false;
};

var app = angular.module('app', [])

    .controller('MainController', function ($scope, $http, $timeout) {
        $scope.hand = [];
        $scope.selectCard = function (c) {
            c.selected = !c.selected;
            $scope.selectedCardsCount = getSelectedCards().length;
        };

        $scope.state = {};

        $scope.selectedCardsCount = 0;

        $scope.onTable = [];

        $scope.canPlay = false;

        var getState = function () {
            $http.get('/status').then(function (result) {
                console.log(result.data);
                $scope.state = result.data;
                if ($scope.hand.length == 0 && result.data.hand) {
                    $scope.hand = result.data.hand.map(function (c) { return new Card(c.value, c.suite)});
                }
                $timeout(getState, 1000);
            });
        };

        getState();

        var getSelectedCards = function () {
            return $scope.hand.filter(function (c) { return c.selected; });
        };

        var removeSelectedCards = function () {
            $scope.hand = $scope.hand.filter(function (c) { return !c.selected});
        };

        $scope.play = function () {
            console.log("play");

            var selectedCards = getSelectedCards();
            removeSelectedCards();
        };

        $scope.pass = function () {
            console.log("pass");

            $http.get('/pass').then(function (result) {
            });
        };

    })
        .filter('gamestateFormat', function () {
           return function (input) {
               // TODO: Expose common Game Server objects.
                if (input.gameState == 'WaitingForPlayers') {
                    return "Waiting for Players";
                } else if (input.gameState == 'Playing') {
                    return (input.currentPlayer == input.playerId)? "It's your turn!" : "Please wait... It's opponent's turn.";
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
    })
        .filter('cardImage', function () {
            return function (card) {
                var value = card.value;
                if (value == "1") {
                    value = "ace";
                } else if (value == 11) {
                    value = "jack";
                } else if (value == 12) {
                    value = "queen";
                } else if (value == 13) {
                    value = "king";
                }

                var suite = card.suite;
                if (suite == "Hearts") {
                    suite = "hearts";
                } else if (suite == "Spades") {
                    suite = "spades";
                } else if (suite == "Diamonds") {
                    suite = "diamonds";
                }

                return value + "_of_" + suite + ".png";
            }
    });


