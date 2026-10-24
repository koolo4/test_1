(function () {
    var state = null;
    var timerId = null;

    function el(id) {
        return document.getElementById(id);
    }

    function shuffle(list) {
        var a = list.slice();
        for (var i = a.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var t = a[i];
            a[i] = a[j];
            a[j] = t;
        }
        return a;
    }

    function clearTimer() {
        if (timerId !== null) {
            clearInterval(timerId);
            timerId = null;
        }
    }

    function hearts(n) {
        var s = '';
        for (var i = 0; i < n; i++) {
            s += '❤';
        }
        return s || '—';
    }

    function updateHud() {
        el('game-score').textContent = String(state.score);
        el('game-lives').textContent = hearts(state.lives);
        el('game-progress').textContent = (state.roundIndex + 1) + ' / ' + state.rounds;
        el('game-mode-title').textContent = state.mode.title;
    }

    function updateKicker(left) {
        var seconds = typeof left === 'number' ? Math.ceil(left / 1000) : null;
        if (seconds === state.lastShownSecond) {
            return;
        }
        state.lastShownSecond = seconds;
        var text = 'Раунд ' + (state.roundIndex + 1) + ' из ' + state.rounds;
        if (seconds !== null) {
            text += ' · ' + seconds + ' с';
        }
        el('game-kicker').textContent = text;
    }

    function startTimer() {
        clearTimer();
        var total = state.mode.timePerRound * 1000;
        var started = Date.now();
        state.lastShownSecond = null;
        delete state.lastShown;
        el('game-timer-fill').style.width = '100%';
        el('game-timer-fill').classList.remove('is-low');
        updateKicker(total);
        timerId = setInterval(function () {
            var left = total - (Date.now() - started);
            if (left < 0) {
                left = 0;
            }
            var fill = el('game-timer-fill');
            fill.style.width = (left / total * 100) + '%';
            fill.classList.toggle('is-low', left <= 5000);
            updateKicker(left);
            if (left === 0) {
                clearTimer();
                answer(-1);
            }
        }, 100);
    }

    function buildOptions(entry) {
        var others = [];
        for (var i = 0; i < state.answers.length; i++) {
            if (state.answers[i] !== entry.answer) {
                others.push(state.answers[i]);
            }
        }
        others = shuffle(others);
        var options = [entry.answer];
        while (options.length < 4 && others.length > 0) {
            options.push(others.pop());
        }
        return shuffle(options);
    }

    function renderRound() {
        var entry = state.pool[state.roundIndex];
        var options = buildOptions(entry);

        state.locked = false;
        state.correctIndex = options.indexOf(entry.answer);

        el('game-clue').innerHTML = entry.clue;
        el('game-question').textContent = state.mode.question;

        var box = el('game-answers');
        box.innerHTML = '';
        for (var i = 0; i < options.length; i++) {
            var btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'answer-btn';
            btn.textContent = options[i];
            btn.setAttribute('data-index', String(i));
            btn.addEventListener('click', onAnswerClick);
            box.appendChild(btn);
        }

        updateHud();
        startTimer();
    }

    function onAnswerClick(e) {
        var idx = parseInt(e.currentTarget.getAttribute('data-index'), 10);
        answer(idx);
    }

    function answer(idx) {
        if (!state || state.locked) {
            return;
        }
        state.locked = true;
        clearTimer();

        var buttons = el('game-answers').querySelectorAll('.answer-btn');
        for (var i = 0; i < buttons.length; i++) {
            buttons[i].disabled = true;
            if (i === state.correctIndex) {
                buttons[i].classList.add('is-correct');
            } else if (i === idx) {
                buttons[i].classList.add('is-wrong');
            }
        }

        if (idx === state.correctIndex) {
            state.correct += 1;
            state.streak += 1;
            var bonus = Math.min(100, 25 * (state.streak - 1));
            state.score += 100 + bonus;
        } else {
            state.lives -= 1;
            state.streak = 0;
        }

        updateHud();
        setTimeout(nextRound, 900);
    }

    function nextRound() {
        if (!state) {
            return;
        }
        if (state.lives <= 0) {
            finish();
            return;
        }
        state.roundIndex += 1;
        if (state.roundIndex >= state.rounds) {
            finish();
            return;
        }
        renderRound();
    }

    function modeKey(mode) {
        if (mode.id) {
            return mode.id;
        }

        for (var key in window.MODES) {
            if (window.MODES[key] === mode) {
                return key;
            }
        }

        return 'default';
    }

    function bestKey(id) {
        return 'dota2quiz.best.' + id;
    }

    function readBest(id) {
        try {
            var value = window.localStorage.getItem(bestKey(id));
            return value === null ? 0 : parseInt(value, 10) || 0;
        } catch (e) {
            return 0;
        }
    }

    function writeBest(id, score) {
        try {
            window.localStorage.setItem(bestKey(id), String(score));
        } catch (e) {
            // приватный режим или переполнение — играем без рекорда
        }
    }

    function finish() {
        clearTimer();
        var mode = state.mode;
        var id = modeKey(mode);
        var previousBest = readBest(id);
        var record = state.score > previousBest;

        if (record) {
            writeBest(id, state.score);
        }

        el('result-emoji').textContent = record ? '🏆' : state.lives > 0 ? '⭐' : '💀';
        el('result-title').textContent = record ? 'Новый рекорд!' : state.lives > 0 ? 'Раунд окончен' : 'Испытание провалено';
        el('result-subtitle').textContent = 'Верных ответов: ' + state.correct + ' из ' + state.rounds;
        el('result-score').textContent = '🏅 Очки: ' + state.score;
        el('result-correct').textContent = '✅ Верно: ' + state.correct;
        el('result-best').textContent = '📈 Рекорд: ' + Math.max(previousBest, state.score);
        var again = el('btn-again');
        if (again) {
            again.onclick = function () {
                start(mode);
            };
        }
        showScreen('screen-result');
    }

    function start(mode) {
        if (!mode || !mode.entries || mode.entries.length < 4) {
            return;
        }
        clearTimer();

        var answers = [];
        for (var i = 0; i < mode.entries.length; i++) {
            if (answers.indexOf(mode.entries[i].answer) === -1) {
                answers.push(mode.entries[i].answer);
            }
        }

        state = {
            mode: mode,
            pool: shuffle(mode.entries).slice(0, mode.rounds),
            rounds: mode.rounds,
            roundIndex: 0,
            score: 0,
            lives: mode.lives,
            correct: 0,
            streak: 0,
            answers: answers,
            locked: false,
            correctIndex: -1,
            lastShownSecond: null
        };

        if (state.pool.length < state.rounds) {
            state.rounds = state.pool.length;
        }

        showScreen('screen-game');
        document.getElementById('screen-game').classList.remove('is-stub');
        renderRound();
    }

    function stop() {
        clearTimer();
        state = null;
    }

    window.Quiz = {
        start: start,
        stop: stop,
        best: readBest
    };
})();