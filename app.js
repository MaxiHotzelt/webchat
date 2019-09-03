const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const siofu = require('socketio-file-upload');
const session = require('express-session');
const MongoClient = require('mongodb').MongoClient;
const assert = require('assert');
const fs = require('fs');

const port = process.env.PORT || 3000;
const jsonSaveIntervalMs = 30000;

const uri =
    'mongodb+srv://admin:admin@webchatter-jwkgz.mongodb.net/test?retryWrites=true&w=majority';
const messages = [];
const users = [];

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

app.get('/register', (req, res) => {
    res.sendFile(__dirname + '/public/html/register.html');
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

app.post('/registerUser', (req, res) => {
    var foundUser = false;
    users.forEach(user => {
        if (user.username === req.body.username) {
            foundUser = true;
            return res.redirect('/register');
        }
    });

    if (!foundUser) {
        users.push({
            username: req.body.username,
            password: req.body.password
        });

        //save user to mongoDb
        saveUser({ username: req.body.username, password: req.body.password });

        //set session cookie
        req.session.username = req.body.username;

        //redirect to chatroom
        return res.redirect('chat');
    }
});

app.post('/login', (req, res) => {
    users.forEach(user => {
        if (
            user.username === req.body.username &&
            user.password === req.body.password
        ) {
            req.session.username = req.body.username;
            console.log(
                '[INFO] user logged in with name: ' + req.session.username
            );
            return res.redirect('/chat');
        }
    });

    return res.redirect('/');
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

            saveMessage({
                username: username,
                message: msg,
                timestamp: time
            });

            io.emit('server message', username, time, msg);

            socket.broadcast.emit('notification', username, msg);
        }
    });

    //listens on
    socket.on('client isUserAvailable', username => {
        var foundUser = false;
        users.forEach(user => {
            console.log(user.username, username);
            console.log(users);
            if (user.username === username) {
                socket.emit('server isUserAvailable', false);
                foundUser = true;
            }
        });

        if (!foundUser) {
            socket.emit('server isUserAvailable', true);
        }
    });
});

function connectDb() {
    MongoClient.connect(
        uri,
        {
            useUnifiedTopology: true,
            useNewUrlParser: true
        },
        (err, client) => {
            if (err) {
                console.log(err);
            }
            const messagesCollection = client
                .db('messages')
                .collection('messages');
            const usersCollection = client.db('messages').collection('users');

            loadMessages(messagesCollection);
            loadUsers(usersCollection);
            client.close();
        }
    );
}

function loadUsers(collection) {
    collection
        .find({})
        .toArray()
        .then(_users => {
            _users.forEach(user => {
                users.push(user);
            });
        })
        .finally(() => {
            console.log('[INFO] successfully loaded users from mongoDB');
        });
}

function loadMessages(collection) {
    collection
        .find({})
        .toArray()
        .then(_messages => {
            _messages.forEach(message => {
                messages.push(message);
            });
        })
        .finally(() => {
            console.log('[INFO] successfully loaded messages from mongoDB');
        });
}

function saveMessage(message) {
    MongoClient.connect(
        uri,
        {
            useUnifiedTopology: true,
            useNewUrlParser: true
        },
        (err, client) => {
            if (err) {
                console.log(err);
            }
            const messagesCollection = client
                .db('messages')
                .collection('messages');

            // perform actions on the collection object

            messagesCollection.insertOne(message);

            client.close();
        }
    );
}

function saveUser(user) {
    MongoClient.connect(
        uri,
        {
            useUnifiedTopology: true,
            useNewUrlParser: true
        },
        (err, client) => {
            if (err) {
                console.log(err);
            }
            const usersCollection = client.db('messages').collection('users');

            // perform actions on the collection object

            usersCollection.insertOne(user);

            client.close();
        }
    );
}

http.listen(port, function() {
    console.log('listening on port: 3000');
    connectDb();
    //saveMessagesInterval();
});
