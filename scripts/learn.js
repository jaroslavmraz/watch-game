(function () {
  const WG = (window.WG = window.WG || {});
  const { AnalogClock } = WG;
  const { randomTime, normalizeTime } = WG.time;
  const { formatDigital, formatTextEN, formatTextSKFormal, formatTextSKCasual, getUI } = WG.i18n;

  const STEP_MIN = 5;

  class LearnScreen {
    constructor(container, app) {
      this.container = container;
      this.app = app;
      this.clock = null;
      const level = this.app.state.level || 4;
      this.time = randomTime(level);
    }

    mount() {
      const ui = getUI(this.app.state.phrasing);
      this.container.innerHTML = `
        <div class="play-screen">
          <div class="play-stack">
            <div class="clock-mount" id="learn-clock-mount"></div>
            <div class="time-display">
              <div class="time-digital" id="learn-digital">--:--</div>
              <div class="time-text-group">
                <div class="time-text"><span class="lang-tag">SK · ${ui.phrasingFormal}</span><span id="learn-sk-formal"></span></div>
                <div class="time-text"><span class="lang-tag">SK · ${ui.phrasingCasual}</span><span id="learn-sk-casual"></span></div>
                <div class="time-text"><span class="lang-tag">EN</span><span id="learn-en"></span></div>
              </div>
            </div>
          </div>
          <p class="text-muted text-center" style="font-size: 0.95em; margin-top: 4px;">
            ${ui.dragHint}
          </p>
          <div class="controls-row">
            <button class="btn" id="learn-prev-h">${ui.prevH}</button>
            <button class="btn" id="learn-prev-m">${ui.prevM}</button>
            <button class="btn btn-primary" id="learn-random">${ui.randomize}</button>
            <button class="btn" id="learn-next-m">${ui.nextM}</button>
            <button class="btn" id="learn-next-h">${ui.nextH}</button>
          </div>
        </div>
      `;

      const mountEl = this.container.querySelector('#learn-clock-mount');
      this.clock = new AnalogClock(mountEl, {
        initial: this.time,
        interactive: true,
        snapMin: STEP_MIN,
        onChange: (t) => this._setTime(t, false),
      });

      this.container.querySelector('#learn-prev-h').addEventListener('click', () => this._step(-60));
      this.container.querySelector('#learn-next-h').addEventListener('click', () => this._step(+60));
      this.container.querySelector('#learn-prev-m').addEventListener('click', () => this._step(-STEP_MIN));
      this.container.querySelector('#learn-next-m').addEventListener('click', () => this._step(+STEP_MIN));
      this.container.querySelector('#learn-random').addEventListener('click', () => {
        const level = this.app.state.level || 4;
        this._setTime(randomTime(level), true);
      });

      this._updateText();
    }

    _step(deltaMinutes) {
      const total = (this.time.hour * 60 + this.time.minute + deltaMinutes + 720) % 720;
      const hour = Math.floor(total / 60);
      const minute = total % 60;
      this._setTime({ hour, minute }, true);
    }

    _setTime(time, fromButton) {
      this.time = normalizeTime(time);
      if (fromButton) this.clock.setTime(this.time, true);
      this._updateText();
    }

    _updateText() {
      this.container.querySelector('#learn-digital').textContent = formatDigital(this.time);
      this.container.querySelector('#learn-sk-formal').textContent = formatTextSKFormal(this.time);
      this.container.querySelector('#learn-sk-casual').textContent = formatTextSKCasual(this.time);
      this.container.querySelector('#learn-en').textContent = formatTextEN(this.time);
    }

    unmount() {
      if (this.clock) this.clock.destroy();
      this.clock = null;
      this.container.innerHTML = '';
    }
  }

  WG.LearnScreen = LearnScreen;
})();
