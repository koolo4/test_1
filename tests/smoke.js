// Самодостаточная проверка сайта. Запуск: node tests/smoke.js
// Никаких npm-зависимостей — только встроенные модули Node.js.
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');
let checks = 0;

function check(condition, message) {
    if (!condition) {
        console.error('SMOKE: FAIL — ' + message);
        process.exit(1);
    }
    checks += 1;
}

function read(relative) {
    const file = path.join(root, relative);
    if (!fs.existsSync(file)) {
        console.error('SMOKE: FAIL — нет файла ' + relative);
        process.exit(1);
    }
    return fs.readFileSync(file, 'utf8');
}

// 1. Разметка: ровно четыре карточки режимов.
const html = read('index.html');
const cards = html.split('\n').filter(line => line.includes('class="mode-card"'));
check(cards.length === 4, 'в index.html должно быть ровно 4 карточки, найдено ' + cards.length);

// 2. Порядок скриптов: data.js → quiz.js → app.js, каждый ровно один раз.
const order = ['data.js', 'quiz.js', 'app.js'];
for (const name of order) {
    const count = (html.match(new RegExp('<script src="js/' + name + '"', 'g')) || []).length;
    check(count === 1, 'тег js/' + name + ' должен быть ровно один, найдено ' + count);
}
const positions = order.map(name => html.indexOf('<script src="js/' + name + '"'));
check(positions[0] < positions[1] && positions[1] < positions[2],
    'порядок скриптов нарушен: нужно data.js, затем quiz.js, затем app.js');

// 3. Стиль подписи рекорда на месте.
const css = read('css/style.css');
check(css.includes('.mode-card__best'), 'в css/style.css нет правила .mode-card__best');

// 4. Данные: четыре режима, в каждом не меньше четырёх уникальных ответов.
const sandbox = {
    window: {},
    document: { getElementById: () => null, querySelectorAll: () => [] },
    setInterval: () => 0,
    clearInterval: () => {},
    setTimeout: () => 0,
    Date: Date,
    Math: Math
};
sandbox.window.localStorage = {
    getItem: () => null,
    setItem: () => {}
};
vm.createContext(sandbox);

vm.runInContext(read('js/data.js'), sandbox, { filename: 'js/data.js' });
const data = sandbox.window.GAME_DATA;
check(Boolean(data), 'js/data.js не создал window.GAME_DATA');
for (const key of ['hero', 'build', 'item', 'quote']) {
    check(Boolean(data[key]), 'нет режима ' + key);
    const answers = new Set((data[key].entries || []).map(entry => entry.answer));
    check(answers.size >= 4, 'в режиме ' + key + ' меньше четырёх уникальных ответов');
}

// 5. Движок загружается и экспортирует Quiz. Ловит потерю ";" перед (function …).
vm.runInContext(read('js/quiz.js'), sandbox, { filename: 'js/quiz.js' });
const quiz = sandbox.window.Quiz;
check(Boolean(quiz), 'js/quiz.js не создал window.Quiz');
check(typeof quiz === 'object', 'window.Quiz должен быть объектом');
check(typeof quiz.start === 'function', 'нет Quiz.start');
check(typeof quiz.stop === 'function', 'нет Quiz.stop');
check(typeof quiz.best === 'function', 'нет Quiz.best');

// 6. MODES указывает на те же данные.
check(sandbox.window.MODES === data, 'window.MODES не совпадает с window.GAME_DATA');

// 7. При пустом хранилище рекорд равен нулю.
check(quiz.best('hero') === 0, 'Quiz.best("hero") должен возвращать 0 при пустом хранилище');

console.log('SMOKE: PASS (' + checks + ' checks)');
process.exit(0);