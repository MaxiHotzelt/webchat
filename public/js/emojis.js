/*

 Emojis

*/

const emojiJsonUrl = 'https://unpkg.com/emoji.json@12.1.0/emoji.json';
let emojis = [];
let colonCount = 0;

init();


async function fetchJson(urlPath) {
    const data = await fetch(urlPath);
    const json = await data.json();

    return json;
}

/**
 * This method fetches a json file, which includes an array of emoji objects. Some values of
 * the objects are then edited to fit our needs.
 * @param {String} urlPath - Path to the json file
 */
async function prepareEmojiJson(urlPath) {
    const data = await fetchJson(urlPath);

    data.forEach(emoji => {
        emoji.codes = '0x' + emoji.codes;
        if (emoji.codes.includes(' ')) {
            emoji.codes = emoji.codes.replace(/\s/g, ',0x');
        }
        emoji.name = emoji.name.replace(':', '');
        emoji.name = ':' + emoji.name.replace(/\s/g, '-') + ':';
    });

    emojis = data;
}

/**
 * 
 * @param {String} message 
 */
function checkForEmoji(message) {
    if (message.includes(':')) {
        console.log("searching...")
        emojis.forEach((emoji) => {
            if (message.includes(emoji.name)) {
                if (emoji.codes.includes(',')) {
                    const code = emoji.codes;
                    const splitIdx = code.indexOf(',');
                    primary = code.slice(0, splitIdx);
                    secondary = code.slice(splitIdx + 1, code.length + 1);

                    console.log(primary + "," + secondary);

                    inputArea.value = message.replace(emoji.name, String.fromCodePoint(primary, secondary));
                } else {
                    inputArea.value = message.replace(emoji.name, String.fromCodePoint(emoji.codes));
                }
            }
        })
    }


}

function init() {
    prepareEmojiJson(emojiJsonUrl);

    inputArea.addEventListener('paste', () => {
        setTimeout(() => {
            checkForEmoji(inputArea.value);
        }, 10);
    });

    document.addEventListener('keyup', (e) => {
        checkForEmoji(inputArea.value);
    })
}