(function () {
  const WG = (window.WG = window.WG || {});
  const { toAngles, snapMinute, normalizeTime } = WG.time;

  const SVG_NS = 'http://www.w3.org/2000/svg';
  const CX = 100, CY = 100;

  function el(tag, attrs = {}, children = []) {
    const node = document.createElementNS(SVG_NS, tag);
    for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
    for (const c of children) node.appendChild(c);
    return node;
  }

  function pointAt(angleDeg, radius) {
    const rad = (angleDeg - 90) * Math.PI / 180;
    return { x: CX + radius * Math.cos(rad), y: CY + radius * Math.sin(rad) };
  }

  class AnalogClock {
    constructor(container, opts = {}) {
      this.container = container;
      this.time = opts.initial ? normalizeTime(opts.initial) : { hour: 10, minute: 10 };
      this.interactive = !!opts.interactive;
      this.snapMin = opts.snapMin ?? 1;
      this.onChange = opts.onChange || (() => {});
      this.activeHand = null;
      this.pointerId = null;
      this.svg = null;
      this.hourHand = null;
      this.minuteHand = null;
      this.hourHit = null;
      this.minuteHit = null;
      this.boundMove = (e) => this._onPointerMove(e);
      this.boundUp = (e) => this._onPointerUp(e);
      this._render();
    }

    _render() {
      const svg = el('svg', {
        class: 'clock' + (this.interactive ? ' interactive' : ''),
        viewBox: '0 0 200 200',
        role: this.interactive ? 'application' : 'img',
        'aria-label': this.interactive ? 'Nastav hodinky / Set the clock' : 'Analógové hodinky',
      });

      svg.appendChild(el('circle', { class: 'clock-face-bg', cx: CX, cy: CY, r: 95 }));
      svg.appendChild(el('circle', { class: 'clock-rim', cx: CX, cy: CY, r: 95 }));
      svg.appendChild(el('circle', { class: 'clock-rim-inner', cx: CX, cy: CY, r: 88 }));

      const ticks = el('g', { class: 'ticks' });
      for (let i = 0; i < 60; i++) {
        const angle = i * 6;
        const isMajor = i % 5 === 0;
        const outer = pointAt(angle, 95);
        const inner = pointAt(angle, isMajor ? 84 : 90);
        ticks.appendChild(el('line', {
          class: 'clock-tick ' + (isMajor ? 'major' : 'minor'),
          x1: inner.x, y1: inner.y, x2: outer.x, y2: outer.y,
        }));
      }
      svg.appendChild(ticks);

      const numbers = el('g', { class: 'numbers' });
      for (let n = 1; n <= 12; n++) {
        const angle = n * 30;
        const p = pointAt(angle, 71);
        const text = el('text', { class: 'clock-number', x: p.x, y: p.y });
        text.textContent = String(n);
        numbers.appendChild(text);
      }
      svg.appendChild(numbers);

      this.hourHand = el('line', {
        class: 'clock-hand hour',
        x1: CX, y1: CY, x2: CX, y2: CY - 48,
        'data-hand': 'hour',
      });
      this.hourHit = el('line', {
        class: 'clock-hand-hit',
        x1: CX, y1: CY, x2: CX, y2: CY - 48,
        'data-hand': 'hour',
      });

      this.minuteHand = el('line', {
        class: 'clock-hand minute',
        x1: CX, y1: CY, x2: CX, y2: CY - 75,
        'data-hand': 'minute',
      });
      this.minuteHit = el('line', {
        class: 'clock-hand-hit',
        x1: CX, y1: CY, x2: CX, y2: CY - 75,
        'data-hand': 'minute',
      });

      svg.appendChild(this.hourHand);
      svg.appendChild(this.minuteHand);
      if (this.interactive) {
        svg.appendChild(this.hourHit);
        svg.appendChild(this.minuteHit);
      }

      svg.appendChild(el('circle', { class: 'clock-center', cx: CX, cy: CY, r: 6 }));
      svg.appendChild(el('circle', { class: 'clock-center-cap', cx: CX, cy: CY, r: 2.4 }));

      if (this.interactive) {
        this.hourHit.addEventListener('pointerdown', (e) => this._onPointerDown(e, 'hour'));
        this.minuteHit.addEventListener('pointerdown', (e) => this._onPointerDown(e, 'minute'));
      }

      this.container.innerHTML = '';
      this.container.appendChild(svg);
      this.svg = svg;
      this._applyAngles();
    }

    _applyAngles() {
      const { hourAngle, minuteAngle } = toAngles(this.time);
      this.hourHand.style.transform = `rotate(${hourAngle}deg)`;
      this.minuteHand.style.transform = `rotate(${minuteAngle}deg)`;
      if (this.hourHit) this.hourHit.style.transform = `rotate(${hourAngle}deg)`;
      if (this.minuteHit) this.minuteHit.style.transform = `rotate(${minuteAngle}deg)`;
    }

    setTime(time, animate = true) {
      this.time = normalizeTime(time);
      if (!animate) {
        this.svg.classList.add('dragging');
        this._applyAngles();
        this.svg.getBoundingClientRect();
        this.svg.classList.remove('dragging');
      } else {
        this._applyAngles();
      }
    }

    getTime() { return { ...this.time }; }

    setStatus(status) {
      this.svg.classList.remove('correct', 'wrong');
      if (status === 'correct' || status === 'wrong') {
        this.svg.classList.add(status);
      }
    }

    setSnap(snapMin) { this.snapMin = snapMin; }

    setInteractive(value) {
      if (this.interactive === !!value) return;
      this.interactive = !!value;
      this._render();
    }

    _onPointerDown(ev, hand) {
      ev.preventDefault();
      this.activeHand = hand;
      this.pointerId = ev.pointerId;
      this.svg.classList.add('dragging');
      (hand === 'hour' ? this.hourHit : this.minuteHit).classList.add('dragging-this');
      try { ev.target.setPointerCapture(ev.pointerId); } catch {}
      window.addEventListener('pointermove', this.boundMove);
      window.addEventListener('pointerup', this.boundUp);
      window.addEventListener('pointercancel', this.boundUp);
      this._updateFromPointer(ev.clientX, ev.clientY);
    }

    _onPointerMove(ev) {
      if (this.pointerId !== ev.pointerId) return;
      this._updateFromPointer(ev.clientX, ev.clientY);
    }

    _onPointerUp(ev) {
      if (this.pointerId !== ev.pointerId) return;
      this.svg.classList.remove('dragging');
      this.hourHit.classList.remove('dragging-this');
      this.minuteHit.classList.remove('dragging-this');
      window.removeEventListener('pointermove', this.boundMove);
      window.removeEventListener('pointerup', this.boundUp);
      window.removeEventListener('pointercancel', this.boundUp);
      if (this.activeHand) this._snapAndCommit();
      this.activeHand = null;
      this.pointerId = null;
    }

    _snapAndCommit() {
      if (this.snapMin >= 60) {
        const minute = this.time.minute;
        const hourAdj = minute >= 30 ? (this.time.hour + 1) % 12 : this.time.hour;
        this.time = { hour: hourAdj, minute: 0 };
      } else if (this.snapMin > 1) {
        const snapped = snapMinute(this.time.minute, this.snapMin);
        let hour = this.time.hour;
        if (snapped === 0 && this.time.minute >= 30) hour = (hour + 1) % 12;
        this.time = { hour, minute: snapped };
      }
      this._applyAngles();
      this.onChange(this.getTime());
    }

    _updateFromPointer(clientX, clientY) {
      const pt = this.svg.createSVGPoint();
      pt.x = clientX; pt.y = clientY;
      const ctm = this.svg.getScreenCTM();
      if (!ctm) return;
      const svgPt = pt.matrixTransform(ctm.inverse());
      const dx = svgPt.x - CX;
      const dy = svgPt.y - CY;
      let angle = Math.atan2(dx, -dy) * 180 / Math.PI;
      if (angle < 0) angle += 360;

      if (this.activeHand === 'minute') {
        const oldMin = this.time.minute;
        const minute = Math.round(angle / 6) % 60;
        let hour = this.time.hour;
        if (oldMin > 45 && minute < 15) hour = (hour + 1) % 12;
        else if (oldMin < 15 && minute > 45) hour = (hour + 11) % 12;
        this.time = { hour, minute };

        this.minuteHand.style.transform = `rotate(${angle}deg)`;
        this.minuteHit.style.transform = `rotate(${angle}deg)`;
        const hourAngle = (hour * 30 + angle / 12) % 360;
        this.hourHand.style.transform = `rotate(${hourAngle}deg)`;
        this.hourHit.style.transform = `rotate(${hourAngle}deg)`;
      } else if (this.activeHand === 'hour') {
        const minuteOffset = this.time.minute * 0.5;
        const hourContinuous = (angle - minuteOffset + 360) / 30;
        const hour = ((Math.round(hourContinuous) % 12) + 12) % 12;
        this.time = { hour, minute: this.time.minute };

        this.hourHand.style.transform = `rotate(${angle}deg)`;
        this.hourHit.style.transform = `rotate(${angle}deg)`;
      }
      this.onChange(this.getTime());
    }

    destroy() {
      window.removeEventListener('pointermove', this.boundMove);
      window.removeEventListener('pointerup', this.boundUp);
      window.removeEventListener('pointercancel', this.boundUp);
      this.container.innerHTML = '';
    }
  }

  WG.AnalogClock = AnalogClock;
})();
