let lightTheme = document.getElementById('lightTheme');

function addListener() {
    document.getElementById('themeToggle').addEventListener('click', toggleTheme);
}

lightTheme.disabled = true;

function toggleTheme() {
    if (getTheme() === 'dark') {
        lightTheme.disabled = false;

        document.querySelector('[data-theme]').dataset.theme = 'light';
    } else if (getTheme() === 'light') {
        lightTheme.disabled = true;

        document.querySelector('[data-theme]').dataset.theme = 'dark';
    }
}


const getTheme = () => {
    return document.querySelector('[data-theme]').dataset.theme;
};