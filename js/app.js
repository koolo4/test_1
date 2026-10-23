// Навигация и заглушка

// Показывает экран
function showScreen(id) {
    const screens = document.querySelectorAll('.screen');
    screens.forEach(screen => {
        screen.classList.remove('is-active');
    });
    document.getElementById(id).classList.add('is-active');
}

// Скрывает экран игры и показывает меню
function showMenu() {
    showScreen('screen-menu');
    document.getElementById('screen-game').classList.remove('is-stub');
}

// Обработчик клика на карточку
document.querySelectorAll('.mode-card').forEach(card => {
    card.addEventListener('click', () => {
        const mode = card.getAttribute('data-mode');
        const title = card.querySelector('.mode-card__title').textContent;

        // Показываем экран игры
        showScreen('screen-game');

        // Устанавливаем заголовок режима
        document.getElementById('game-mode-title').textContent = title;

        // Проверяем, есть ли Quiz и режим
        if (window.Quiz && window.MODES[mode]) {
            // Если есть, убираем заглушку
            document.getElementById('screen-game').classList.remove('is-stub');
            // Запускаем игру
            window.Quiz.start(window.MODES[mode]);
        } else {
            // Иначе показываем заглушку
            document.getElementById('screen-game').classList.add('is-stub');
        }
    });
});

// Обработчик нажатия клавиши Esc
window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        showMenu();
    }
});

// Обработчик кнопки '← В меню'
document.getElementById('btn-back').addEventListener('click', () => {
    showMenu();
});

// Обработчик кнопки 'Вернуться в меню'
document.getElementById('btn-stub-back').addEventListener('click', () => {
    showMenu();
});