const socket = io();

const usernameNode = document.getElementById('username');
let isUserAvailable = document.getElementById('isUserAvailable');

usernameNode.oninput = e => {
    console.log(usernameNode.value);
    socket.emit('client isUserAvailable', usernameNode.value);
};

socket.on('server isUserAvailable', isAvailable => {
    if (isAvailable) {
        isUserAvailable.innerHTML = 'Verfügbar';
    } else {
        isUserAvailable.innerHTML = 'Nicht verfügbar';
    }
});
