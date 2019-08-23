const emojis = [{
    key: ':burger:',
    value: String.fromCodePoint(0x1F354)
}, {
    key: ':grinning:',
    value: String.fromCodePoint(0x1F601)
}, {
    key: ':tears-of-joy:',
    value: String.fromCodePoint(0x1F602)
}, {
    key: ':smile:',
    value: String.fromCodePoint(0x1F603)
}, {
    key: ':smiling-eyes:',
    value: String.fromCodePoint(0x1F604)
}, {
    key: ':smiling-eyes-sweat:',
    value: String.fromCodePoint(0x1F605)
}, {
    key: ':smiling-closed-eyes:',
    value: String.fromCodePoint(0x1F606)
}, {
    key: ':devil-smile:',
    value: String.fromCodePoint(0x1F608)
}, {
    key: ':wink:',
    value: String.fromCodePoint(0x1F609)
}, {
    key: ':blush:',
    value: String.fromCodePoint(0x1F60A)
}, {
    key: ':tongue-smiling:',
    value: String.fromCodePoint(0x1F60B)
}, {
    key: ':relieved:',
    value: String.fromCodePoint(0x1F60C)
}, {
    key: ':thumbs-up:',
    value: String.fromCodePoint(0x1F44D)
}, {
    key: ':thumbs-down:',
    value: String.fromCodePoint(0x1F44E)
}, {
    key: ':ok-sign:',
    value: String.fromCodePoint(0x1F44C)
}, {
    key: ':fist:',
    value: String.fromCodePoint(0x1F44A)
}];

/**
 * 
 * @param {String} message 
 */
function checkForEmoji(message) {
    if (message.includes(':')) {
        console.log("searching...")
        emojis.forEach((emoji) => {
            if (message.includes(emoji.key)) {
                inputArea.value = message.replace(emoji.key, emoji.value);
            }
        })
    }


}

inputArea.addEventListener('paste', () => {
    setTimeout(() => {
        checkForEmoji(inputArea.value);
    }, 10);
});

document.addEventListener('keyup', (e) => {
    checkForEmoji(inputArea.value);
})