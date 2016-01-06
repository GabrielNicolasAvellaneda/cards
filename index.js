var express = require('express');
var cookieParser = require('cookie-parser');
var session = require('express-session');

var app = express();

var stats = {};


var Player = function (name, hand) {
    this.name = name;
    this.hand = hand || [];
};

Player.prototype.equals = function (other) {
    return this.name == other.name;
};

Player.prototype.addCard = function (card) {
    this.hand.push(card);
};

Player.prototype.removeCards = function (cards) {
    var self = this;
    cards.forEach(function (c) {
        self.hand.removeCard(c);
    });
    return this.hand;
};

Player.prototype.indexOfCard = function (card) {
    this.hand.forEach(function (x, i) {
        if (x.equals(card))  {
            return i;
        }
    });
};

Player.prototype.removeCard = function (card) {
    var index = this.indexOf(card);
    if (index != -1) {
        this.hand.splice(index, 1);
    }
    return this.hand;
};

var CardGameStates = {
    WaitingForPlayers : "WaitingForPlayers",
    Playing : "Playing",
    GameOver : "GameOver"
};

var CardSuites = {
    Hearts : "Hearts",
    Spades : "Spades",
    Diamonds : "Diamonds",
    Clubs : "Clubs"
};

var Card = function (value, suite) {
    this.value = value;
    this.suite = suite;
};

Card.prototype.equals = function (other) {
   return this.value = other.value && this.suite == other.suite;
};

var CardDeck = {};
CardDeck.create = function () {
    var deck = [];
    var suites = [CardSuites.Hearts, CardSuites.Spades, CardSuites.Diamonds, CardSuites.Clubs];
    suites.forEach(function (suite) {
        for (var value = 1; value <= 13; value++) {
            deck.push(new Card(value, suite));
        }
    });
    return deck;
};

CardDeck.shuffle = function (deck) {
    // TODO: Refactor this into a generator like function.
    var indexes = [];
    for (var i = 0; i < deck.length; i++) {
        indexes.push(i);
    }

    var randomIndex = function () {
        return Math.floor(Math.random() * indexes.length);
    };

    var shuffled = [];
    while (indexes.length > 0) {
        var index = randomIndex();
        shuffled.push(deck[index]);
        indexes.splice(index, 1);
    }
    return shuffled;
};

var CardGame = function () {
    this.state = CardGameStates.WaitingForPlayers;
    this.players = [];
    this.deck = CardDeck.shuffle(CardDeck.create());
};

CardGame.prototype.playerExists = function (playerId) {
    return this.getPlayer(playerId) != undefined;
};

CardGame.prototype.getRandomName = function () {
    return "Player " + this.players.length;
};

CardGame.prototype._nextPlayerGen = function (start) {
    var index = start || -1;
    var self = this;
    return function () {
        index++;
        if (index >= self.players.length) {
            index = 0;
        }
        return self.players[index];
    };
};

CardGame.prototype._distributeCards = function () {
    var nextPlayer = this._nextPlayerGen();
    this.deck.forEach(function (c) {
        var player = nextPlayer();
        player.addCard(c);
    });
};

CardGame.prototype.getPlayer = function (playerId) {
    return this.players.find(function (p) { return p.name == playerId});
};

CardGame.prototype.addPlayer = function (player) {
    if (this.playerExists(player)) {
        throw new Error("Player already exists.");
    }

    this.players.push(player);
    if (this.players.length >= 2) {
        this.state = CardGameStates.Playing;
        console.log('setting current player');
        this.currentPlayer = player;
        this._distributeCards();
    }
};

CardGame.prototype._checkPlayer = function (player) {
    if (!this.playerExists(player.name)) {
        throw new Error("Player does not exists!");
    }
};

CardGame.prototype.isTurnOf = function (player) {
    return this.currentPlayer && this.currentPlayer.equals(player);
};

CardGame.prototype._checkCanPass = function (player) {
   if (this.state != CardGameStates.Playing)  {
       throw new Error("Game is not in playing state.");
   }

    if (!this.isTurnOf(player)) {
       throw new Error("It's not your turn.");
   }
};

CardGame.prototype.getPlayer1 = function () {
    return this.players[0];
};

CardGame.prototype.getPlayer2 = function () {
    return this.players[1];
};

CardGame.prototype._nextTurn = function () {
    if (this.currentPlayer.equals(this.getPlayer1())) {
        this.currentPlayer = this.getPlayer2();
    } else {
        this.currentPlayer = this.getPlayer1();
    }
};

CardGame.prototype.pass = function (player) {
    this._checkPlayer(player);
    this._checkCanPass(player);

    this._nextTurn();
};

var game = new CardGame();

var isUndefined = function (x) {
    return x == undefined;
};

var getPlayerIdFromSession = function (session) {
    return session.playerId;
};

app.set('trust proxy', 1);
app.use(cookieParser());
app.use(session({resave: true, saveUninitialized: true, secret: 'SOMERANDOMSECRETHERE', cookie: { maxAge: 600000 }}));
app.use(function (req, res, next) {
    stats.requets = (stats.requests || 0) + 1;
    var playerId = getPlayerIdFromSession(req.session);
    if (isUndefined(playerId) || !game.playerExists(playerId)) {
        playerId = game.getRandomName();
        game.addPlayer(new Player(playerId));
        req.session.playerId = playerId;
        console.log("Player defined as " + playerId);
    }
    next();
});

var getPlayerState = function (playerId) {
    return {
        cardsOnTable : [],
        hand : game.getPlayer(playerId).hand,
        currentPlayer : (game.currentPlayer && game.currentPlayer.name) || null,
        gameState : game.state,
        playerId : playerId };
};

app.get('/status', function (req, res) {
    console.log('/status');
    var state = getPlayerState(req.session.playerId);
    res.json(state);
});

app.get('/pass', function (req, res) {
    console.log('/pass');
    var playerId = getPlayerIdFromSession(req.session);
    var player = game.getPlayer(playerId);
    game.pass(player);
    res.end();
});

app.use(express.static(__dirname + '/public'));

var server = app.listen(3000, function () {
    var host = server.address().address;
    var port = server.address().port;

    console.log('Example app listenting at http://%s:%s', host, port);
});