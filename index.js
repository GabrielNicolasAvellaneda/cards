var express = require('express');
var cookieParser = require('cookie-parser');
var session = require('express-session');

var app = express();

var stats = {};

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
        var random = Math.floor(Math.random() * indexes.length);
        return random;
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
    this.hands = [];
    this.deck = CardDeck.shuffle(CardDeck.create());
};

CardGame.prototype.playerExists = function (player) {
    return this.players.indexOf(player) != -1;
};

CardGame.prototype.getRandomName = function () {
    return "Player " + this.players.length;
};

CardGame.prototype._distributeCards = function () {
    this.hands[0] = [];
    this.hands[1] = [];
    var hands = this.hands;
    var playerIndex = 0;
    this.deck.forEach(function (c) {
        hands[playerIndex].push(c);
        if (playerIndex == 0) {
            playerIndex = 1;
        } else {
            playerIndex = 0;
        }
    });
};

CardGame.prototype.addPlayer = function (player) {
    if (this.playerExists(player)) {
        throw new Error("Player already exists.");
    }

    this.players.push(player);
    if (this.players.length >= 2) {
        this.state = CardGameStates.Playing;
        this.currentPlayer = player;
        this._distributeCards();
    }
};

CardGame.prototype._checkPlayer = function (player) {
    if (!this.playerExists(player)) {
        throw new Error("Player does not exists!");
    }
};

CardGame.prototype._checkCanPass = function (player) {
   if (this.state != CardGameStates.Playing)  {
       throw new Error("Game is not in playing state.");
   }

    if (this.currentPlayer != player) {
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
    if (this.currentPlayer == this.getPlayer1()) {
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

var getPlayerFromSession = function (session) {
    return session.player;
};

app.set('trust proxy', 1);
app.use(cookieParser());
app.use(session({resave: true, saveUninitialized: true, secret: 'SOMERANDOMSECRETHERE', cookie: { maxAge: 600000 }}));
app.use(function (req, res, next) {
    stats.requets = (stats.requests || 0) + 1;
    var player = getPlayerFromSession(req.session);
    if (isUndefined(player) || !game.playerExists(player)) {
        player = game.getRandomName();
        game.addPlayer(player);
        req.session.player = player;
        console.log("Player defined as " + player);
    }
    next();
});

var getPlayerState = function (player) {
    return {
        cardsOnTable : [],
        hand : game.hands[0],
        currentPlayer : game.currentPlayer,
        gameState : game.state,
        player : player };
};

app.get('/status', function (req, res) {
    console.log('/status');
    var state = getPlayerState(req.session.player);
    res.json(state);
});

app.get('/pass', function (req, res) {
    console.log('/pass');
    var player = getPlayerFromSession(req.session);
    game.pass(player);
    res.end();
});

app.use(express.static(__dirname + '/public'));

var server = app.listen(3000, function () {
    var host = server.address().address;
    var port = server.address().port;

    console.log('Example app listenting at http://%s:%s', host, port);
});