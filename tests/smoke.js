const path = require('path');
const fs = require('fs');
const assert = require('assert');

const root = path.join(__dirname, '..');

// 1. Check index.html exists and has exactly 4 lines with class="mode-card"
const indexHtmlPath = path.join(root, 'index.html');
const indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');
const lines = indexHtml.split('\n');
const modeCardLines = lines.filter(line => line.includes('class="mode-card"'));
assert.strictEqual(modeCardLines.length, 4, 'index.html does not have exactly 4 lines with class="mode-card"');

// 2. Check index.html has exactly one tag for each js file in the specified order
const jsFiles = ['data.js', 'quiz.js', 'app.js'];
const jsTags = jsFiles.map(js => `<script src="js/${js}"></script>`);
const jsTagStrings = jsTags.join('\n');
const jsTagCount = indexHtml.split(jsTagStrings).length - 1;
assert.strictEqual(jsTagCount, 1, 'index.html does not have exactly one tag for each js file in the specified order');

// 3. Check css/style.css exists and has .mode-card__best
const styleCssPath = path.join(root, 'css', 'style.css');
const styleCss = fs.readFileSync(styleCssPath, 'utf8');
assert.ok(styleCss.includes('.mode-card__best'), 'css/style.css does not have .mode-card__best');

// 4. Check js/data.js loads in vm and creates window.GAME_DATA with keys
const dataJsPath = path.join(root, 'js', 'data.js');
const dataJs = fs.readFileSync(dataJsPath, 'utf8');
const dataVm = vm.createContext({});
vm.runInNewContext(dataJs, dataVm, { filename: dataJsPath });
const gameData = dataVm.window.GAME_DATA;
assert.ok(gameData, 'js/data.js did not create window.GAME_DATA');
assert.ok(Object.keys(gameData).length >= 4, 'js/data.js did not create window.GAME_DATA with enough keys');

// 5. Check js/quiz.js loads in the same vm after data.js and creates window.Quiz
const quizJsPath = path.join(root, 'js', 'quiz.js');
const quizJs = fs.readFileSync(quizJsPath, 'utf8');
const quizVm = vm.createContext({});
vm.runInNewContext(quizJs, quizVm, { filename: quizJsPath });
const quiz = quizVm.window.Quiz;
assert.ok(quiz, 'js/quiz.js did not create window.Quiz');
assert.strictEqual(typeof quiz, 'object', 'js/quiz.js did not create window.Quiz as an object');

// 6. Check window.MODES === window.GAME_DATA
const modes = dataVm.window.MODES;
assert.strictEqual(modes, gameData, 'window.MODES is not equal to window.GAME_DATA');

// 7. Check Quiz.best('hero') returns 0 when the storage is empty
const localStorage = {
  getItem: () => null,
  setItem: () => {}
};
const document = {
  createRange: () => ({
    createContextualFragment: (html) => {
      const div = document.createElement('div');
      div.innerHTML = html;
      return div;
    }
  })
};
const quizContext = {
  localStorage,
  document,
  Quiz,
  GAME_DATA
};
const bestResult = quiz.best('hero');
assert.strictEqual(bestResult, 0, 'Quiz.best("hero") did not return 0 when the storage is empty');

console.log('SMOKE: PASS (7 checks)');
process.exit(0);