async function getHeader() {

    const head = await fetch('../html/header.html');

    const headHTML = await head.text();
    return headHTML;
}

async function addHeader() {
    document.getElementById('header').innerHTML = await getHeader();

    addListener();
}

addHeader();