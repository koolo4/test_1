// Навигация между экранами

function showScreen(id) {
    var screens = document.querySelectorAll('.screen');
    for (var i = 0; i < screens.length; i++) {
        screens[i].classList.remove('is-active');
    }
    var target = document.getElementById(id);
    if (target) {
        target.classList.add('is-active');
    }
}

function showMenu() {
    if (window.Quiz && typeof window.Quiz.stop === 'function') {
        window.Quiz.stop();
    }
    showScreen('screen-menu');
    document.getElementById('screen-game').classList.remove('is-stub');
}

function openMode(card) {
    var mode = card.getAttribute('data-mode');
    var titleEl = card.querySelector('.mode-card__title');
    var emojiEl = card.querySelector('.mode-card__emoji');
    var title = titleEl ? titleEl.textContent.trim() : '';
    var emoji = emojiEl ? emojiEl.textContent.trim() : '';

    document.getElementById('game-mode-title').textContent = title;
    document.getElementById('game-stub-emoji').textContent = emoji;
    document.getElementById('game-stub-title').textContent = title;

    var game = document.getElementById('screen-game');

    if (window.Quiz && window.MODES && window.MODES[mode]) {
        game.classList.remove('is-stub');
        showScreen('screen-game');
        window.Quiz.start(window.MODES[mode]);
    } else {
        game.classList.add('is-stub');
        showScreen('screen-game');
    }
}

function bind() {
    var cards = document.querySelectorAll('.mode-card');
    for (var i = 0; i < cards.length; i++) {
        cards[i].addEventListener('click', function () {
            openMode(this);
        });
    }

    var back = document.getElementById('btn-back');
    if (back) back.addEventListener('click', showMenu);

    var stubBack = document.getElementById('btn-stub-back');
    if (stubBack) stubBack.addEventListener('click', showMenu);

    var toMenu = document.getElementById('btn-menu');
    if (toMenu) toMenu.addEventListener('click', showMenu);

    window.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
            showMenu();
        }
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bind);
} else {
    bind();
}