const messageArea = document.getElementById('messages');
const inputArea = document.getElementById('inputarea').children[0];

//connect to socketIO
const socket = io();

/* 
    server stuff
*/

// listen on chat messages from server
socket.on('chat message', msg => {
    const today = new Date();
    const time = today.getHours() + ':' + today.getMinutes();

    appendMessage(createMessage('User', time, msg));
});

/* 
    client stuff 
*/

document.getElementById('themeToggle').addEventListener('click', toggleTheme);
document
    .getElementById('inputarea')
    .children[1].addEventListener('click', sendMessage);
window.addEventListener('keypress', e => {
    if (e.keyCode === 13 && document.activeElement.tagName === 'TEXTAREA') {
        sendMessage();
    }
});

function sendMessage() {
    const today = new Date();
    const time = today.getHours() + ':' + today.getMinutes();

    if (inputArea.value !== '') {
        //send message to server
        socket.emit('chat message', inputArea.value);

        appendMessage(createMessage('User', time, inputArea.value));
    }

    clearInputArea();
}

const appendMessage = messageNode => {
    messageArea.appendChild(messageNode);
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

function toggleTheme() {
    const mainColorDark = '#1F1B24';
    const mainColorLight = 'white';
    const secondaryColor = '#423D46';
    const secondaryColorLight = '#93b1a8';

    const messages = document.getElementsByClassName('message');

    if (getTheme() === 'dark') {
        document.body.style.setProperty('background-color', mainColorLight);

        document
            .getElementById('inputarea')
            .children[0].style.setProperty(
                'background-color',
                secondaryColorLight
            );

        document
            .getElementById('inputarea')
            .children[1].style.setProperty(
                'background-color',
                secondaryColorLight
            );
        for (i = 0; i < messages.length; i++) {
            messages[i].style.setProperty(
                'background-color',
                secondaryColorLight
            );
        }

        document.querySelector('[data-theme]').dataset.theme = 'light';
    } else if (getTheme() === 'light') {
        document.body.style.setProperty('background-color', mainColorDark);

        document
            .getElementById('inputarea')
            .children[0].style.setProperty('background-color', secondaryColor);
        document
            .getElementById('inputarea')
            .children[1].style.setProperty('background-color', secondaryColor);
        for (i = 0; i < messages.length; i++) {
            messages[i].style.setProperty('background-color', secondaryColor);
        }

        document.querySelector('[data-theme]').dataset.theme = 'dark';
    }
}

const getTheme = () => {
    return document.querySelector('[data-theme]').dataset.theme;
};
