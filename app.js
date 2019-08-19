const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const session = require('express-session');
// const users = require('./middleware/users');


const port = process.env.PORT || 3000;
app.set('trust proxy', 1);
app.use(express.static("public"));
app.use(express.urlencoded({
    extended: true
})) // for parsing application/x-www-form-urlencoded
app.use(session({
    name: "myName",
    resave: false,
    saveUninitialized: false,
    secret: 'mySecret',
    cookie: {
        secure: true,
        sameSite: true,
        maxAge: 60000
    }
}));

const checkLogin = (req, res, next) => {
    console.log(req.session);
    console.log(req.body.username);
    if (!req.session.username) {
        res.send('You are not authorized to view this page! Please Login first.');
    } else {
        next();
    }
}

app.get('/', function (req, res) {
    res.sendFile(__dirname + "/public/html/login.html");
});

app.get('/chat', checkLogin, (req, res) => {
    res.sendFile(__dirname + "/public/html/chat.html");
});

app.post('/login', (req, res) => {
    // if (users.getUsers().includes(req.body.username)) {
    //     res.redirect('/');
    // } else {
    req.session.username = req.body.username;
    console.log(req.session);

    // users.addUser(req.body.username);
    return res.redirect('/chat');
    // }

    // res.redirect('/');
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
});