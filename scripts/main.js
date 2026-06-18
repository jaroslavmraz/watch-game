(function () {
  const WG = (window.WG = window.WG || {});
  const { LearnScreen, TestScreen, QuizScreen, ResultsScreen } = WG;
  const { loadState, saveState, getBest } = WG.storage;
  const { getUI, applyStaticI18n } = WG.i18n;
  const { clampLevel } = WG.time;

  class HomeScreen {
    constructor(container, app) {
      this.container = container;
      this.app = app;
    }

    mount() {
      const ui = getUI(this.app.state.phrasing);
      const activeLevel = this.app.state.level;

      const cards = [1, 2, 3, 4].map(n => {
        const testBest = getBest(this.app.state, 'test', n);
        const quizBest = getBest(this.app.state, 'quiz', n);
        const badges = [];
        if (testBest > 0) badges.push(`<span class="badge badge-test">★ ${testBest}/10</span>`);
        if (quizBest > 0) badges.push(`<span class="badge badge-quiz">★ ${quizBest}/20</span>`);
        const badgesHtml = badges.length ? `<div class="level-best-row">${badges.join('')}</div>` : '';
        return `
          <button class="level-card" data-level="${n}" aria-pressed="${activeLevel === n ? 'true' : 'false'}">
            <span class="level-num">${n}</span>
            <span class="level-label">${ui['level' + n]}</span>
            <span class="text-muted" style="font-size: 0.8em;">${ui['level' + n + 'Short']}</span>
            ${badgesHtml}
          </button>
        `;
      }).join('');

      this.container.innerHTML = `
        <div class="home">
          <h2 class="home-hero">${ui.pickLevel}</h2>
          <div class="level-grid">${cards}</div>
          <div class="mode-row mode-row-3">
            <button class="btn-mode btn-mode-primary" id="home-learn">
              <span class="mode-icon">📚</span>
              <span class="mode-body">
                <span class="mode-title">${ui.learn}</span>
                <span class="mode-sub">${ui.learnDesc}</span>
              </span>
            </button>
            <button class="btn-mode btn-mode-secondary" id="home-test">
              <span class="mode-icon">⌚</span>
              <span class="mode-body">
                <span class="mode-title">${ui.test}</span>
                <span class="mode-sub">${ui.testDesc}</span>
              </span>
            </button>
            <button class="btn-mode btn-mode-accent" id="home-quiz">
              <span class="mode-icon">📖</span>
              <span class="mode-body">
                <span class="mode-title">${ui.quiz}</span>
                <span class="mode-sub">${ui.quizDesc}</span>
              </span>
            </button>
          </div>
        </div>
      `;

      this.container.querySelectorAll('[data-level]').forEach(btn => {
        btn.addEventListener('click', () => {
          const level = parseInt(btn.dataset.level, 10);
          this.app.setLevel(level);
          this.container.querySelectorAll('[data-level]').forEach(b => {
            b.setAttribute('aria-pressed', b === btn ? 'true' : 'false');
          });
        });
      });

      this.container.querySelector('#home-learn').addEventListener('click', () => this.app.setScreen('learn'));
      this.container.querySelector('#home-test').addEventListener('click', () => this.app.setScreen('test'));
      this.container.querySelector('#home-quiz').addEventListener('click', () => this.app.setScreen('quiz'));
    }

    unmount() { this.container.innerHTML = ''; }
  }

  const SCREEN_FACTORIES = {
    home:    HomeScreen,
    learn:   LearnScreen,
    test:    TestScreen,
    quiz:    QuizScreen,
    results: ResultsScreen,
  };

  class App {
    constructor() {
      this.state = loadState();
      this.currentScreen = null;
      this.currentInstance = null;
      this.lastResults = null;

      this._setupHeader();
      this._setupSettingsModal();
      this.applyLanguage();
      this.setScreen('home');
    }

    applyLanguage() { applyStaticI18n(this.state.phrasing); }

    setScreen(name, data) {
      if (this.currentInstance?.unmount) this.currentInstance.unmount();
      document.body.dataset.screen = name;
      const backBtn = document.getElementById('btn-back');
      backBtn.hidden = (name === 'home');

      const Cls = SCREEN_FACTORIES[name];
      const container = document.getElementById('screen-' + name);
      this.currentScreen = name;
      this.currentInstance = new Cls(container, this);
      if (name === 'results') {
        this.currentInstance.mount(data || this.lastResults || { level: this.state.level, score: 0 });
      } else {
        this.currentInstance.mount();
      }
    }

    finishTest(results) {
      this.lastResults = results;
      this.setScreen('results', results);
    }

    setPhrasing(phrasing) {
      if (!['sk-formal', 'sk-casual', 'en'].includes(phrasing)) return;
      this.state.phrasing = phrasing;
      saveState(this.state);
      this.applyLanguage();
      if (this.currentScreen) this.setScreen(this.currentScreen, this.lastResults);
    }

    setLevel(level) {
      this.state.level = clampLevel(level);
      saveState(this.state);
    }

    setSound(on) {
      this.state.soundOn = !!on;
      saveState(this.state);
    }

    _setupHeader() {
      document.getElementById('btn-back').addEventListener('click', () => this.setScreen('home'));
      document.getElementById('btn-settings').addEventListener('click', () => this._openSettings());
    }

    _setupSettingsModal() {
      const modal = document.getElementById('settings-modal');
      const phrasingSel = document.getElementById('setting-phrasing');
      const soundCheck = document.getElementById('setting-sound');

      phrasingSel.value = this.state.phrasing;
      soundCheck.checked = this.state.soundOn;

      phrasingSel.addEventListener('change', (e) => this.setPhrasing(e.target.value));
      soundCheck.addEventListener('change', (e) => this.setSound(e.target.checked));

      modal.querySelectorAll('[data-close-modal]').forEach(btn => {
        btn.addEventListener('click', () => { modal.hidden = true; });
      });

      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !modal.hidden) modal.hidden = true;
      });
    }

    _openSettings() {
      const modal = document.getElementById('settings-modal');
      document.getElementById('setting-phrasing').value = this.state.phrasing;
      document.getElementById('setting-sound').checked = this.state.soundOn;
      modal.hidden = false;
    }
  }

  // Boot
  document.addEventListener('DOMContentLoaded', () => new App());
})();
