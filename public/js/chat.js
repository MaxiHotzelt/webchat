const messageArea = document.getElementById('messages');
const inputArea = document.getElementById('inputarea').children[1];

/* 
    server stuff
*/

//connect to socketIO
const socket = io();

//add file uploader
const uploader = new SocketIOFileUpload(socket);
uploader.listenOnInput(document.getElementById('siofu_input'));

uploader.addEventListener('complete', e => {
    socket.emit('client image', e.file.name);
});

// listen on chat messages from server
socket.on('server message', (username, time, msg) => {
    appendMessage(createMessage(username, time, msg));
});

socket.on('server image', (username, time, imgPath) => {
    let _imgPath = '/uploads/' + imgPath;
    appendMessage(createImageMessage(username, time, _imgPath));
});

socket.on('redirect', path => {
    console.log('redirected to ' + path);
    window.location.href = path;
});

socket.on('notification', (user, message) => {
    notifyMe(user, message);
});

/* 
    client stuff 
*/

function init() {
    addListeners();
}

function addListeners() {
    document
        .getElementById('inputarea')
        .children[2].addEventListener('click', sendMessage);
    window.addEventListener('keypress', e => {
        if (e.keyCode === 13 && document.activeElement.tagName === 'TEXTAREA') {
            sendMessage();
        }
    });

    // document.getElementById('upload').onchange = e => {
    //     let test = document.getElementById('upload');
    //     if (test.files.length > 0) {
    //         console.log('got a file');
    //     }
    //     console.log('e');
    // };
}

function updateScroll() {
    var element = document.getElementById('messages');
    element.scrollTop = element.scrollHeight;
}

function sendMessage() {
    if (inputArea.value !== '') {
        //send message to server
        socket.emit('client message', inputArea.value);
    }

    clearInputArea();
}

const appendMessage = messageNode => {
    messageArea.appendChild(messageNode);
    updateScroll();
};

function notifyMe(user, message) {
    if (notifictionPermission() && document.visibilityState === 'hidden') {
        new Notification(user, {
            body: message
        });
    }
}

function notifictionPermission() {
    if ('Notification' in window) {
        if (Notification.permission === 'granted') {
            return true;
        } else if (Notification.permission !== 'denied') {
            Notification.requestPermission().then(result => {
                if (result === 'denied') {
                    console.log('No permission for notifications...');
                    return false;
                } else if (result === 'granted') {
                    return true;
                }
            });
        }
    }

    return false;
}

function createImageMessage(user, time, imagePath) {
    let messageWrapperNode = document.createElement('article');
    messageWrapperNode.setAttribute('class', 'message');

    let userNode = document.createElement('cite');
    userNode.appendChild(document.createTextNode(user));

    let timeNode = document.createElement('time');
    timeNode.setAttribute('datetime', time);
    timeNode.appendChild(document.createTextNode(time + ' Uhr'));

    let imgNode = document.createElement('div');
    let img = document.createElement('img');
    img.src = imagePath;
    imgNode.appendChild(img);

    messageWrapperNode.appendChild(userNode);
    messageWrapperNode.appendChild(timeNode);
    messageWrapperNode.appendChild(imgNode);

    return messageWrapperNode;
}

/**
 * Creates a message element, which can be added to the dom
 * @param {String} user
 * @param {String} time
 * @param {String} message
 */
const createMessage = (user, time, message) => {
    let messageWrapperNode = document.createElement('article');
    messageWrapperNode.setAttribute('class', 'message');

    let userNode = document.createElement('cite');
    userNode.appendChild(document.createTextNode(user));

    let timeNode = document.createElement('time');
    timeNode.setAttribute('datetime', time);
    timeNode.appendChild(document.createTextNode(time + ' Uhr'));

    let messageNode = document.createElement('blockquote');
    messageNode.appendChild(document.createTextNode(message));

    messageWrapperNode.appendChild(userNode);
    messageWrapperNode.appendChild(timeNode);
    messageWrapperNode.appendChild(messageNode);

    return messageWrapperNode;
};

const clearInputArea = () => {
    setTimeout(() => {
        document.getElementById('inputarea').children[1].value = '';
    }, 100);
};

init();
