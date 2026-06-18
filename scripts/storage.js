(function () {
  const WG = (window.WG = window.WG || {});

  const KEY = 'watchGame.v1';

  const DEFAULT_MODE_SCORES = { 1: 0, 2: 0, 3: 0, 4: 0 };
  const DEFAULTS = {
    phrasing: 'sk-formal',
    level: 1,
    soundOn: true,
    bestScores: {
      test: { ...DEFAULT_MODE_SCORES },
      quiz: { ...DEFAULT_MODE_SCORES },
    },
  };

  function migrateBestScores(raw) {
    if (!raw || typeof raw !== 'object') {
      return { test: { ...DEFAULT_MODE_SCORES }, quiz: { ...DEFAULT_MODE_SCORES } };
    }
    if (typeof raw['1'] === 'number' || typeof raw[1] === 'number') {
      return { test: { ...DEFAULT_MODE_SCORES, ...raw }, quiz: { ...DEFAULT_MODE_SCORES } };
    }
    return {
      test: { ...DEFAULT_MODE_SCORES, ...(raw.test || {}) },
      quiz: { ...DEFAULT_MODE_SCORES, ...(raw.quiz || {}) },
    };
  }

  function safeLocalStorage() {
    try {
      const t = '__t__';
      window.localStorage.setItem(t, '1');
      window.localStorage.removeItem(t);
      return window.localStorage;
    } catch {
      return null;
    }
  }

  const ls = safeLocalStorage();
  let memoryStore = null;

  function loadState() {
    if (!ls) return memoryStore ?? structuredClone(DEFAULTS);
    try {
      const raw = ls.getItem(KEY);
      if (!raw) return structuredClone(DEFAULTS);
      const parsed = JSON.parse(raw);
      return {
        phrasing:   parsed.phrasing   ?? DEFAULTS.phrasing,
        level:      parsed.level      ?? DEFAULTS.level,
        soundOn:    typeof parsed.soundOn === 'boolean' ? parsed.soundOn : DEFAULTS.soundOn,
        bestScores: migrateBestScores(parsed.bestScores),
      };
    } catch {
      return structuredClone(DEFAULTS);
    }
  }

  function saveState(state) {
    const payload = {
      phrasing:   state.phrasing,
      level:      state.level,
      soundOn:    state.soundOn,
      bestScores: state.bestScores,
    };
    if (!ls) { memoryStore = payload; return; }
    try {
      ls.setItem(KEY, JSON.stringify(payload));
    } catch {
      memoryStore = payload;
    }
  }

  function recordBest(state, mode, level, score) {
    if (!state.bestScores[mode]) state.bestScores[mode] = { ...DEFAULT_MODE_SCORES };
    const current = state.bestScores[mode][level] ?? 0;
    if (score > current) {
      state.bestScores[mode][level] = score;
      saveState(state);
      return true;
    }
    return false;
  }

  function getBest(state, mode, level) {
    return state.bestScores?.[mode]?.[level] ?? 0;
  }

  WG.storage = { loadState, saveState, recordBest, getBest };
})();
