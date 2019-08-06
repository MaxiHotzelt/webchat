const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

const port = process.env.PORT || 3000;


app.use(express.static("view"));

app.get('/', function (req, res) {
    res.sendFile(__dirname + "/view/index.html")
});

io.on('connection', (socket) => {
    console.log(socket.client.id + ' : Connected');

    socket.on('disconnect', () => {
        console.log(socket + ": Disconnected")
    });

    socket.on('chat message', (msg) => {
        console.log('Message: ' + msg);

        socket.broadcast.emit('chat message', msg);
    });
});

http.listen(port, function () {
    console.log('listening on *:3000');
    console.log(__dirname + "/view/index.html");
});