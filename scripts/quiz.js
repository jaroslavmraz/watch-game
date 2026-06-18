(function () {
  const WG = (window.WG = window.WG || {});
  const { AnalogClock } = WG;
  const { randomTime, randomTimeAvoiding, timesEqual, LEVELS, clampLevel } = WG.time;
  const { formatTextEN, formatTextByPhrasing, getUI } = WG.i18n;

  const TOTAL_ROUNDS = 10;
  const MAX_SCORE = TOTAL_ROUNDS * 2;

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function generateOptions(target, level) {
    const opts = [target];
    let tries = 0;
    while (opts.length < 4 && tries < 60) {
      const t = randomTime(level);
      if (!opts.some(o => timesEqual(o, t, 0))) {
        opts.push(t);
      }
      tries++;
    }
    // For low levels with < 4 unique options, pad with random times (shouldn't happen at lvl 1+ since 12 options)
    while (opts.length < 4) {
      opts.push({ hour: opts.length, minute: 0 });
    }
    return shuffle(opts);
  }

  function playTone(kind, soundOn) {
    if (!soundOn) return;
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      const t0 = ctx.currentTime;
      if (kind === 'correct') {
        osc.frequency.setValueAtTime(660, t0);
        osc.frequency.setValueAtTime(990, t0 + 0.1);
        gain.gain.setValueAtTime(0.001, t0);
        gain.gain.exponentialRampToValueAtTime(0.15, t0 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.25);
        osc.start(t0); osc.stop(t0 + 0.3);
      } else {
        osc.frequency.setValueAtTime(220, t0);
        osc.frequency.exponentialRampToValueAtTime(140, t0 + 0.2);
        gain.gain.setValueAtTime(0.001, t0);
        gain.gain.exponentialRampToValueAtTime(0.13, t0 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.25);
        osc.start(t0); osc.stop(t0 + 0.28);
      }
      setTimeout(() => ctx.close(), 400);
    } catch {}
  }

  class QuizScreen {
    constructor(container, app) {
      this.container = container;
      this.app = app;
      this.clock = null;
      this.session = null;
    }

    mount() {
      const level = clampLevel(this.app.state.level);
      this.session = {
        level,
        round: 1,
        score: 0,
        phase: 'sk',
        target: null,
        prevTarget: null,
        options: [],
      };
      this._buildSkeleton();
      this._startRound();
    }

    _buildSkeleton() {
      const ui = getUI(this.app.state.phrasing);
      this.container.innerHTML = `
        <div class="play-screen">
          <div class="test-header">
            <div class="round-counter">
              ${ui.round} <strong id="quiz-round">1</strong> / ${TOTAL_ROUNDS}
            </div>
            <div class="star-tally" aria-label="${ui.yourScore}">
              <span class="star">★</span><strong id="quiz-score">0</strong> / ${MAX_SCORE}
            </div>
          </div>

          <div class="play-stack">
            <div class="clock-mount" id="quiz-clock-mount"></div>
            <div class="time-display quiz-panel">
              <p class="prompt-label" id="quiz-question-label"></p>
              <div class="quiz-options" id="quiz-options"></div>
              <div class="feedback" id="quiz-feedback" aria-live="polite"></div>
              <button class="btn btn-success btn-lg" id="quiz-action" hidden>${ui.next}</button>
            </div>
          </div>
        </div>
      `;
      this.container.querySelector('#quiz-action').addEventListener('click', () => this._next());
    }

    _startRound() {
      const level = this.session.level;
      const target = randomTimeAvoiding(level, this.session.prevTarget);
      const options = generateOptions(target, level);
      this.session.prevTarget = target;
      this.session.target = target;
      this.session.options = options;
      this.session.phase = 'sk';
      this.session.skPhrasing = Math.random() < 0.5 ? 'sk-formal' : 'sk-casual';

      this.container.querySelector('#quiz-round').textContent = String(this.session.round);
      this.container.querySelector('#quiz-feedback').textContent = '';
      this.container.querySelector('#quiz-feedback').className = 'feedback';
      this.container.querySelector('#quiz-action').hidden = true;

      const clockMount = this.container.querySelector('#quiz-clock-mount');
      if (this.clock) this.clock.destroy();
      this.clock = new AnalogClock(clockMount, {
        initial: target,
        interactive: false,
      });

      this._renderQuestion();
    }

    _renderQuestion() {
      const ui = getUI(this.app.state.phrasing);
      const labelEl = this.container.querySelector('#quiz-question-label');
      const optsEl = this.container.querySelector('#quiz-options');

      const phase = this.session.phase;
      const isSK = phase === 'sk';

      let labelText;
      if (isSK) {
        const styleLabel = this.session.skPhrasing === 'sk-formal' ? ui.skStyleFormal : ui.skStyleCasual;
        labelText = `${ui.quizPickSK} (${styleLabel})`;
      } else {
        labelText = ui.quizPickEN;
      }
      labelEl.textContent = labelText;
      labelEl.className = 'prompt-label quiz-phase-label ' + (isSK ? 'phase-sk' : 'phase-en');

      const formatter = isSK
        ? (t) => formatTextByPhrasing(t, this.session.skPhrasing)
        : (t) => formatTextEN(t);

      optsEl.innerHTML = this.session.options.map((opt, i) => `
        <button class="quiz-option" data-idx="${i}">
          ${formatter(opt)}
        </button>
      `).join('');

      optsEl.querySelectorAll('[data-idx]').forEach(btn => {
        btn.addEventListener('click', () => this._pick(parseInt(btn.dataset.idx, 10)));
      });
    }

    _pick(idx) {
      if (this.session.phase !== 'sk' && this.session.phase !== 'en') return;

      const ui = getUI(this.app.state.phrasing);
      const picked = this.session.options[idx];
      const correct = timesEqual(picked, this.session.target, 0);
      const optsEl = this.container.querySelector('#quiz-options');
      const fb = this.container.querySelector('#quiz-feedback');

      optsEl.querySelectorAll('[data-idx]').forEach(btn => {
        const i = parseInt(btn.dataset.idx, 10);
        const isTarget = timesEqual(this.session.options[i], this.session.target, 0);
        if (isTarget) btn.classList.add('correct');
        if (i === idx && !correct) btn.classList.add('wrong');
        btn.disabled = true;
      });

      if (correct) {
        this.session.score++;
        this.container.querySelector('#quiz-score').textContent = String(this.session.score);
        fb.textContent = ui.correct;
        fb.className = 'feedback correct';
        this.clock.setStatus('correct');
        playTone('correct', this.app.state.soundOn);
      } else {
        fb.textContent = ui.wrong;
        fb.className = 'feedback wrong';
        this.clock.setStatus('wrong');
        playTone('wrong', this.app.state.soundOn);
      }

      const actionBtn = this.container.querySelector('#quiz-action');
      const isLastQuestion = this.session.phase === 'en' && this.session.round >= TOTAL_ROUNDS;
      const goingToEN = this.session.phase === 'sk';
      actionBtn.textContent = isLastQuestion ? ui.seeResults : (goingToEN ? ui.continueEN : ui.next);
      actionBtn.hidden = false;
    }

    _next() {
      if (this.session.phase === 'sk') {
        this.session.phase = 'en';
        this.container.querySelector('#quiz-feedback').textContent = '';
        this.container.querySelector('#quiz-feedback').className = 'feedback';
        this.container.querySelector('#quiz-action').hidden = true;
        this.clock.setStatus(null);
        this._renderQuestion();
        return;
      }
      if (this.session.round >= TOTAL_ROUNDS) {
        this.app.finishTest({ mode: 'quiz', level: this.session.level, score: this.session.score, maxScore: MAX_SCORE });
        return;
      }
      this.session.round++;
      this._startRound();
    }

    unmount() {
      if (this.clock) this.clock.destroy();
      this.clock = null;
      this.session = null;
      this.container.innerHTML = '';
    }
  }

  WG.QuizScreen = QuizScreen;
})();
