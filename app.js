const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const session = require('express-session');

const port = process.env.PORT || 3000;

const messages = [];



const sessionMiddleware = session({
    name: 'userinfo',
    key: 'user_sid',
    resave: true,
    saveUninitialized: false,
    secret: 'mySecret',
    cookie: {
        sameSite: true,
        maxAge: 60000 * 60
    }
});

app.use(express.static('public'));
app.use(
    express.urlencoded({
        extended: true
    })
);
app.use(
    sessionMiddleware
);

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/public/html/login.html');
});

app.get('/chat', (req, res) => {
    res.sendFile(__dirname + '/public/html/chat.html');
});

app.post('/login', (req, res) => {
    req.session.username = req.body.username;
    console.log('session username: ' + req.session.username);
    return res.redirect('/chat');
});

io.use(function (socket, next) {
    sessionMiddleware(socket.client.request, socket.client.request.res, next);
});

io.on('connection', socket => {
    console.log(socket.request.session.username + " has connected")


    http.getConnections((err, num) => {
        console.log(num);
    });
    //if there is no username, then redirect the user to the login page
    if (!socket.request.session.username) {
        console.log('redirecting');
        socket.emit('redirect', '/');
    } else {
        messages.forEach(message => {
            socket.emit('server message', message.username, message.timestamp, message.message);
        });
    }
    socket.on('disconnect', () => {
        console.log(socket.request.session.username + " has disconnected");
    });

    //listens to messages from clients
    socket.on('client message', (msg) => {
        const username = socket.request.session.username;
        if (username) {
            const today = new Date();
            const time = today.getHours() + ':' + today.getMinutes();
            messages.push({
                username: username,
                message: msg,
                timestamp: time
            })

            io.emit('server message', username, time, msg);
        }
    });

});

http.listen(port, function () {
    console.log('listening on port: 3000');
});

process.on('exit', () => {
    console.log('Process exit: About to exit.')
});

process.on('SIGINT', () => {
    console.log('Process SIGINT: About to exit.')
});

http.on('close', () => {
    console.log('On: About to exit.')
});

http.once('close', () => {
    console.log('Once: About to exit.')
})