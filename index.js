var express = require('express');
var cookieParser = require('cookie-parser');
var session = require('express-session');

var app = express();

var stats = {};

var CardGameStates = {
    WaitingForPlayers : "WaitingForPlayers",
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

var game = new CardGame();

var isUndefined = function (x) {
    return x == undefined;
};

app.set('trust proxy', 1);
app.use(cookieParser());
app.use(session({resave: true, saveUninitialized: true, secret: 'SOMERANDOMSECRETHERE', cookie: { maxAge: 60000 }}));
app.use(function (req, res, next) {
    stats.requets = (stats.requests || 0) + 1;
    var player = req.session.player;
    if (isUndefined(player) || !game.playerExists(player)) {
        player = game.getRandomName();
        game.players.push(player);
        req.session.player = player;
        console.log("Player defined as " + player);
    }
    next();
});

var getPlayerState = function (player) {
    return { player : player };
};

app.get('/status', function (req, res) {
    console.log('/status');
    var state = getPlayerState(req.session.player);
    res.json(state);
});

app.use(express.static(__dirname + '/public'));

var server = app.listen(3000, function () {
    var host = server.address().address;
    var port = server.address().port;

    console.log('Example app listenting at http://%s:%s', host, port);
});