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

var CardGame = function () {
    this.state = CardGameStates.WaitingForPlayers;
    this.players = [];
};

CardGame.prototype.playerExists = function (player) {
    return this.players.indexOf(player) != -1;
};

CardGame.prototype.getRandomName = function () {
    return "Player " + this.players.length;
};

CardGame.prototype.addPlayer = function (player) {
    if (this.playerExists(player)) {
        throw new Error("Player already exists.");
    }

    this.players.push(player);
    if (this.players.length >= 2) {
        this.state = CardGameStates.Playing;
        this.currentPlayer = player;
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