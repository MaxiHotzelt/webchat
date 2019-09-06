const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const siofu = require('socketio-file-upload');
const session = require('express-session');
const MongoClient = require('mongodb').MongoClient;
const mongoose = require('mongoose');
const fs = require('fs');

const dbUrl =
    'mongodb+srv://admin:admin@webchatter-jwkgz.mongodb.net/test?retryWrites=true&w=majority';

mongoose.connect(dbUrl, {
    useUnifiedTopology: true,
    useNewUrlParser: true
});

const port = process.env.PORT || 3000;

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
    let foundUser = false;

    users.forEach(user => {
        if (
            user.username === req.body.username &&
            user.password === req.body.password
        ) {
            req.session.username = req.body.username;
            console.log(
                '[INFO] user logged in with name: ' +
                    req.session.username +
                    ' - called in line ' +
                    __line
            );
            foundUser = true;
            return res.redirect('/chat');
        }
    });
    if (!foundUser) {
        return res.redirect('/');
    }
});

io.use(function(socket, next) {
    sessionMiddleware(socket.client.request, socket.client.request.res, next);
});

io.on('connection', socket => {
    console.log(socket.request.session.username + ' has connected');
    //if there is no username, then redirect the user to the login page
    if (!socket.request.session.username) {
        console.log('[ERROR] no username was found - called in line ' + __line);
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

    socket.on('client image', (file, filename) => {
        const username = socket.request.session.username;
        if (username) {
            const today = new Date();
            const time = today.getHours() + ':' + today.getMinutes();
            messages.push({
                username: username,
                message: null,
                timestamp: time,
                imgName: filename
            });

            saveMessage({
                username: username,
                message: null,
                timestamp: time,
                imgName: filename
            });
            saveFile(file, filename);

            io.emit('server image', username, time, filename);
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

function saveFile(file, filename) {
    MongoClient.connect(
        dbUrl,
        {
            useUnifiedTopology: true,
            useNewUrlParser: true
        },
        (err, client) => {
            if (err) {
                console.log(err);
            }

            const filesCollection = client.db('messages').collection('files');

            fs.writeFile(
                __dirname + '/public/uploads/' + filename,
                file,
                'utf8',
                err => {}
            );

            const img = file.toJSON();
            img.filename = filename;

            filesCollection.insertOne(img);
        }
    );
}

function connectDb() {
    MongoClient.connect(
        dbUrl,
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
            const filesCollection = client.db('messages').collection('files');

            loadMessages(messagesCollection);
            loadUsers(usersCollection);
            loadFiles(filesCollection);
            client.close();
        }
    );
}

function loadFiles(collection) {
    MongoClient.connect(
        dbUrl,
        {
            useUnifiedTopology: true,
            useNewUrlParser: true
        },
        (err, client) => {
            if (err) {
                console.log(err);
            }

            collection
                .find({})
                .toArray()
                .then(_files => {
                    _files.forEach(file => {
                        const img = Buffer.from(file);
                        fs.writeFile(
                            __dirname + '/public/uploads/' + file.filename,
                            img,
                            'utf8',
                            err => {}
                        );
                    });
                })
                .finally(() => {
                    console.log(
                        '[INFO] successfully loaded files from mongoDB - called in line ' +
                            __line
                    );
                });
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
            console.log(
                '[INFO] successfully loaded users from mongoDB - called in line ' +
                    __line
            );
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
            console.log(
                '[INFO] successfully loaded messages from mongoDB - called in line ' +
                    __line
            );
        });
}

function saveUser(user) {
    MongoClient.connect(
        dbUrl,
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

function saveMessage(message) {
    MongoClient.connect(
        dbUrl,
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

Object.defineProperty(global, '__stack', {
    get: function() {
        var orig = Error.prepareStackTrace;
        Error.prepareStackTrace = function(_, stack) {
            return stack;
        };
        var err = new Error();
        Error.captureStackTrace(err, arguments.callee);
        var stack = err.stack;
        Error.prepareStackTrace = orig;
        return stack;
    }
});

Object.defineProperty(global, '__line', {
    get: function() {
        return __stack[1].getLineNumber();
    }
});

Object.defineProperty(global, '__function', {
    get: function() {
        return __stack[1].getFunctionName();
    }
});

http.listen(port, function() {
    console.log('listening on port: 3000 - called in line ' + __line);
    connectDb();
});
