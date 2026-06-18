(function () {
  const WG = (window.WG = window.WG || {});

  const LEVELS = {
    1: { name: 'whole',   minuteStep: 60, snapMin: 60, tolerance: 0 },
    2: { name: 'half',    minuteStep: 30, snapMin: 30, tolerance: 0 },
    3: { name: 'quarter', minuteStep: 15, snapMin: 15, tolerance: 0 },
    4: { name: 'five',    minuteStep: 5,  snapMin: 5,  tolerance: 2 },
  };

  function clampLevel(level) {
    const n = parseInt(level, 10);
    return [1, 2, 3, 4].includes(n) ? n : 1;
  }

  function normalizeTime({ hour, minute }) {
    let h = ((hour % 12) + 12) % 12;
    let m = ((minute % 60) + 60) % 60;
    return { hour: h, minute: m };
  }

  function randomTime(level) {
    const step = LEVELS[clampLevel(level)].minuteStep;
    const slotsPerHour = 60 / step;
    const totalSlots = 12 * slotsPerHour;
    const slot = Math.floor(Math.random() * totalSlots);
    const hour = Math.floor(slot / slotsPerHour);
    const minute = (slot % slotsPerHour) * step;
    return { hour, minute };
  }

  function randomTimeAvoiding(level, previous) {
    if (!previous) return randomTime(level);
    for (let i = 0; i < 20; i++) {
      const t = randomTime(level);
      if (t.hour !== previous.hour || t.minute !== previous.minute) return t;
    }
    return randomTime(level);
  }

  function timesEqual(a, b, tolerance = 0) {
    const ma = a.hour * 60 + a.minute;
    const mb = b.hour * 60 + b.minute;
    let diff = Math.abs(ma - mb);
    diff = Math.min(diff, 720 - diff);
    return diff <= tolerance;
  }

  function toAngles({ hour, minute }) {
    const minuteAngle = (minute * 6) % 360;
    const hourAngle = ((hour % 12) * 30 + minute * 0.5) % 360;
    return { hourAngle, minuteAngle };
  }

  function minuteFromAngle(angle) {
    const normalized = ((angle % 360) + 360) % 360;
    return Math.round(normalized / 6) % 60;
  }

  function hourFromAngle(angle) {
    const normalized = ((angle % 360) + 360) % 360;
    return Math.floor(normalized / 30) % 12;
  }

  function snapMinute(minute, snapMin) {
    if (snapMin >= 60) return 0;
    if (snapMin <= 1) return Math.round(minute) % 60;
    return (Math.round(minute / snapMin) * snapMin) % 60;
  }

  function snapTime({ hour, minute }, snapMin) {
    if (snapMin >= 60) return { hour: hour % 12, minute: 0 };
    const snapped = snapMinute(minute, snapMin);
    const hourAdj = snapped === 0 && minute > 30 ? (hour + 1) % 12 : hour % 12;
    return { hour: hourAdj, minute: snapped };
  }

  WG.time = {
    LEVELS, clampLevel, normalizeTime, randomTime, randomTimeAvoiding,
    timesEqual, toAngles, minuteFromAngle, hourFromAngle, snapMinute, snapTime,
  };
})();
