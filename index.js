var express = require('express');
var cookieParser = require('cookie-parser');
//var session = require('express-session');

var app = express();

var stats = {};
var players = [];

var getRandomName = function () {
    return "Player " + players.length;
};

var playerExists = function (player) {
    return players.indexOf(player) != -1;
};

var isUndefined = function (x) {
    return x == undefined;
};

app.set('trust proxy', 1);
app.use(cookieParser());

app.get('/', function (req, res) {
    console.log(req.cookies);
    stats.requets = (stats.requests || 0) + 1;
    var player = req.cookies.player;
    if (isUndefined(player) || !playerExists(player)) {
        player = getRandomName();
        players.push(player);
        res.cookie('player', player, {maxAge: 900000, httpOnly: true});
        console.log("Player defined as " + player);
    }

    res.send('You are the player: ' + player);
});

var server = app.listen(3000, function () {
    var host = server.address().address;
    var port = server.address().port;

    console.log('Example app listenting at http://%s:%s', host, port);
});