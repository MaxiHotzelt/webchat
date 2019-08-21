const messageArea = document.getElementById('messages');
const inputArea = document.getElementById('inputarea').children[0];

/* 
    server stuff
*/

//connect to socketIO
const socket = io();


// listen on chat messages from server
socket.on('server message', (username, time, msg) => {
    appendMessage(createMessage(username, time, msg));
});

socket.on('redirect', (path) => {
    console.log("redirected to " + path);
    window.location.href = path;
})

/* 
    client stuff 
*/

function init() {
    addListeners();
}

function addListeners() {
    document
        .getElementById('inputarea')
        .children[1].addEventListener('click', sendMessage);
    window.addEventListener('keypress', e => {
        if (e.keyCode === 13 && document.activeElement.tagName === 'TEXTAREA') {
            sendMessage();
        }
    });
}

function updateScroll() {
    var element = document.getElementById("messages");
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
        document.getElementById('inputarea').children[0].value = '';
    }, 100);
};




init();