var express = require('express');
var cookieParser = require('cookie-parser');
var app = express();

var totalRequests = 0;

var players = [];

var getRandomName = function () {
    return "Player " + players.length;
};

app.use(cookieParser());

app.get('/', function (req, res) {
    console.log(req.cookies);
    totalRequests++;
    var player = getRandomName();
    players.push(player);
    res.send('You are the player: ' + player);

});

var server = app.listen(3000, function () {
    var host = server.address().address;
    var port = server.address().port;

    console.log('Example app listenting at http://%s:%s', host, port);
});