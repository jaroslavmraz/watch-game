(function () {
  const WG = (window.WG = window.WG || {});
  const { AnalogClock } = WG;
  const { randomTime, randomTimeAvoiding, timesEqual, LEVELS, clampLevel } = WG.time;
  const { formatDigital, formatTextByPhrasing, getUI } = WG.i18n;
  const { recordBest } = WG.storage;

  const TOTAL_ROUNDS = 10;

  function pickStartingTime(level, target) {
    for (let i = 0; i < 20; i++) {
      const t = randomTime(level);
      if (!timesEqual(t, target, LEVELS[level].tolerance)) return t;
    }
    return { hour: (target.hour + 6) % 12, minute: target.minute };
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
        osc.frequency.setValueAtTime(880, t0 + 0.08);
        osc.frequency.setValueAtTime(1320, t0 + 0.18);
        gain.gain.setValueAtTime(0.001, t0);
        gain.gain.exponentialRampToValueAtTime(0.18, t0 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.35);
        osc.start(t0); osc.stop(t0 + 0.4);
      } else {
        osc.frequency.setValueAtTime(220, t0);
        osc.frequency.exponentialRampToValueAtTime(120, t0 + 0.3);
        gain.gain.setValueAtTime(0.001, t0);
        gain.gain.exponentialRampToValueAtTime(0.15, t0 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.32);
        osc.start(t0); osc.stop(t0 + 0.35);
      }
      setTimeout(() => ctx.close(), 500);
    } catch {}
  }

  class TestScreen {
    constructor(container, app) {
      this.container = container;
      this.app = app;
      this.clock = null;
      this.session = null;
    }

    mount() {
      const ui = getUI(this.app.state.phrasing);
      const level = clampLevel(this.app.state.level);
      this.session = { level, round: 1, score: 0, phase: 'answering', target: null, prevTarget: null };
      this._buildSkeleton(ui);
      this._startRound();
    }

    _buildSkeleton(ui) {
      this.container.innerHTML = `
        <div class="play-screen">
          <div class="test-header">
            <div class="round-counter">
              ${ui.round} <strong id="test-round">1</strong> / ${TOTAL_ROUNDS}
            </div>
            <div class="star-tally" id="test-stars" aria-label="${ui.yourScore}">
              <span class="star">★</span><strong id="test-score">0</strong>
            </div>
          </div>

          <div class="play-stack">
            <div class="clock-mount" id="test-clock-mount"></div>
            <div class="time-display test-prompt">
              <p class="prompt-label">${ui.setTo}</p>
              <div class="time-digital" id="test-digital">--:--</div>
              <div class="time-text" id="test-text"></div>
              <div class="feedback" id="test-feedback" aria-live="polite"></div>
              <button class="btn btn-success btn-lg" id="test-action">${ui.check}</button>
            </div>
          </div>
        </div>
      `;
      this.container.querySelector('#test-action').addEventListener('click', () => this._onAction());
    }

    _startRound() {
      const ui = getUI(this.app.state.phrasing);
      const level = this.session.level;
      const target = randomTimeAvoiding(level, this.session.prevTarget);
      this.session.prevTarget = target;
      this.session.target = target;
      this.session.phase = 'answering';

      this.container.querySelector('#test-round').textContent = String(this.session.round);
      this.container.querySelector('#test-digital').textContent = formatDigital(target);
      this.container.querySelector('#test-text').textContent = formatTextByPhrasing(target, this.app.state.phrasing);
      this.container.querySelector('#test-feedback').textContent = '';
      this.container.querySelector('#test-feedback').className = 'feedback';
      const actionBtn = this.container.querySelector('#test-action');
      actionBtn.textContent = ui.check;
      actionBtn.disabled = false;

      const startTime = pickStartingTime(level, target);
      const clockMount = this.container.querySelector('#test-clock-mount');
      if (this.clock) this.clock.destroy();
      this.clock = new AnalogClock(clockMount, {
        initial: startTime,
        interactive: true,
        snapMin: LEVELS[level].snapMin,
        onChange: () => {},
      });
    }

    _onAction() {
      if (this.session.phase === 'answering') this._check();
      else this._nextOrFinish();
    }

    _check() {
      const ui = getUI(this.app.state.phrasing);
      const level = this.session.level;
      const target = this.session.target;
      const current = this.clock.getTime();
      const correct = timesEqual(current, target, LEVELS[level].tolerance);

      this.session.phase = 'checked';
      const fb = this.container.querySelector('#test-feedback');
      const actionBtn = this.container.querySelector('#test-action');

      if (correct) {
        this.session.score++;
        this.container.querySelector('#test-score').textContent = String(this.session.score);
        fb.textContent = ui.correct;
        fb.className = 'feedback correct';
        this.clock.setStatus('correct');
        playTone('correct', this.app.state.soundOn);
      } else {
        fb.textContent = `${ui.wrong}  ${ui.showAnswer} ${formatDigital(target)}`;
        fb.className = 'feedback wrong';
        this.clock.setStatus('wrong');
        playTone('wrong', this.app.state.soundOn);
        setTimeout(() => { this.clock.setTime(target, true); }, 500);
      }

      const isLast = this.session.round >= TOTAL_ROUNDS;
      actionBtn.textContent = isLast ? ui.seeResults : ui.next;
    }

    _nextOrFinish() {
      if (this.session.round >= TOTAL_ROUNDS) {
        this.app.finishTest({ mode: 'test', level: this.session.level, score: this.session.score, maxScore: TOTAL_ROUNDS });
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

  class ResultsScreen {
    constructor(container, app) {
      this.container = container;
      this.app = app;
    }

    mount({ mode, level, score, maxScore }) {
      const ui = getUI(this.app.state.phrasing);
      const playedMode = mode || 'test';
      const totalMax = maxScore || (playedMode === 'quiz' ? 20 : 10);
      const isNewBest = recordBest(this.app.state, playedMode, level, score);
      const finalBest = this.app.state.bestScores[playedMode][level];

      const visibleStars = Math.min(score, totalMax);
      const starString = '★'.repeat(visibleStars) + '☆'.repeat(Math.max(0, totalMax - visibleStars));

      this.container.innerHTML = `
        <div class="results">
          <div class="results-stars" aria-label="${score} stars">${starString}</div>
          <div class="results-score">
            ${ui.yourScore}: <span class="text-mono">${score} / ${totalMax}</span>
          </div>
          <div class="results-best">
            ${ui.best}: ${finalBest} / ${totalMax}
          </div>
          ${isNewBest && score > 0 ? `<div class="results-newbest">⭐ ${ui.newBest}</div>` : ''}
          <div class="results-actions">
            <button class="btn btn-primary" id="res-again">${ui.playAgain}</button>
            <button class="btn" id="res-home">${ui.toHome}</button>
          </div>
        </div>
      `;

      this.container.querySelector('#res-again').addEventListener('click', () => this.app.setScreen(playedMode));
      this.container.querySelector('#res-home').addEventListener('click', () => this.app.setScreen('home'));
    }

    unmount() { this.container.innerHTML = ''; }
  }

  WG.TestScreen = TestScreen;
  WG.ResultsScreen = ResultsScreen;
})();
