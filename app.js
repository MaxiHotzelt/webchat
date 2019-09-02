const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const siofu = require('socketio-file-upload');
const session = require('express-session');
const fs = require('fs');

const port = process.env.PORT || 3000;
const jsonSaveIntervalMs = 30000;

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
app.use(sessionMiddleware);
app.use(siofu.router);

app.get('/', function(req, res) {
    res.sendFile(__dirname + '/public/html/login.html');
});

app.get(
    '/chat',
    (req, res, next) => {
        if (!req.session.username) {
            console.log('[ERROR] no username was found');
            res.redirect('/');
        } else {
            next();
        }
    },
    (req, res) => {
        res.sendFile(__dirname + '/public/html/chat.html');
    }
);

app.post('/login', (req, res) => {
    req.session.username = req.body.username;
    console.log('[INFO] user logged in with name: ' + req.session.username);
    return res.redirect('/chat');
});

io.use(function(socket, next) {
    sessionMiddleware(socket.client.request, socket.client.request.res, next);
});

io.on('connection', socket => {
    console.log(socket.request.session.username + ' has connected');
    //if there is no username, then redirect the user to the login page
    if (!socket.request.session.username) {
        console.log('[ERROR] no username was found');
        socket.emit('redirect', '/');
    } else {
        messages.forEach(message => {
            if (message.imgName) {
                socket.emit(
                    'server image',
                    message.username,
                    message.timestamp,
                    message.imgName
                );
            } else {
                socket.emit(
                    'server message',
                    message.username,
                    message.timestamp,
                    message.message
                );
            }
        });
    }
    socket.on('disconnect', () => {
        console.log(socket.request.session.username + ' has disconnected');
    });

    //init file uploader and set settings
    let uploader = new siofu();
    uploader.dir = __dirname + '/public/uploads';
    uploader.listen(socket);

    socket.on('client image', fileName => {
        const username = socket.request.session.username;
        if (username) {
            const today = new Date();
            const time = today.getHours() + ':' + today.getMinutes();
            messages.push({
                username: username,
                message: null,
                timestamp: time,
                imgName: fileName
            });

            io.emit('server image', username, time, fileName);
        }
    });

    //listens to messages from clients
    socket.on('client message', msg => {
        const username = socket.request.session.username;
        if (username) {
            const today = new Date();
            const time = today.getHours() + ':' + today.getMinutes();
            messages.push({
                username: username,
                message: msg,
                timestamp: time
            });

            io.emit('server message', username, time, msg);

            socket.broadcast.emit('notification', username, msg);
        }
    });
});

function saveMessagesInterval() {
    setInterval(() => {
        saveMessages();
    }, jsonSaveIntervalMs);
}

function saveMessages() {
    fs.writeFile(
        __dirname + '/messages.json',
        JSON.stringify(messages),
        err => {}
    );
    console.log('[INFO] successfully saved messages to JSON file');
}

function loadMessages() {
    let data = fs.readFileSync(__dirname + '/messages.json');
    const loadedmsges = JSON.parse(data);
    loadedmsges.forEach(message => {
        messages.push(message);
    });

    console.log('[INFO] successfully loaded messages from JSON file');
}

http.listen(port, function() {
    console.log('listening on port: 3000');
    loadMessages();
    saveMessagesInterval();
});
