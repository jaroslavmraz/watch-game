(function () {
  const WG = (window.WG = window.WG || {});

  const EN_HOUR_NAMES = ['twelve', 'one', 'two', 'three', 'four', 'five', 'six',
    'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'];

  const EN_MINUTE_WORDS = {
    5: 'five', 10: 'ten', 15: 'fifteen', 20: 'twenty', 25: 'twenty-five',
    30: 'thirty', 35: 'thirty-five', 40: 'forty', 45: 'forty-five', 50: 'fifty', 55: 'fifty-five',
  };

  const SK_HOUR_CARDINAL_NOM = ['', 'jedna', 'dve', 'tri', 'štyri', 'päť', 'šesť',
    'sedem', 'osem', 'deväť', 'desať', 'jedenásť', 'dvanásť'];

  const SK_HOUR_CARDINAL_ACC = ['', 'jednu', 'dve', 'tri', 'štyri', 'päť', 'šesť',
    'sedem', 'osem', 'deväť', 'desať', 'jedenásť', 'dvanásť'];

  const SK_HOUR_ORDINAL_GEN_FEM = ['', 'prvej', 'druhej', 'tretej', 'štvrtej', 'piatej',
    'šiestej', 'siedmej', 'ôsmej', 'deviatej', 'desiatej', 'jedenástej', 'dvanástej'];

  const SK_MINUTE_GEN = {
    5: 'päť', 10: 'desať', 15: 'pätnásť', 20: 'dvadsať', 25: 'dvadsaťpäť',
    30: 'tridsať', 35: 'tridsaťpäť', 40: 'štyridsať', 45: 'štyridsaťpäť',
    50: 'päťdesiat', 55: 'päťdesiatpäť',
  };

  function displayHour(h) { return h === 0 ? 12 : h; }
  function nextDisplayHour(h) {
    const d = displayHour(h);
    return d === 12 ? 1 : d + 1;
  }
  function hodinaForm(n) {
    if (n === 1) return 'hodina';
    if (n >= 2 && n <= 4) return 'hodiny';
    return 'hodín';
  }

  function formatDigital({ hour, minute }) {
    const h = displayHour(hour);
    return `${h}:${String(minute).padStart(2, '0')}`;
  }

  function formatTextEN({ hour, minute }) {
    const h = displayHour(hour);
    const nextH = nextDisplayHour(hour);
    if (minute === 0) return `${EN_HOUR_NAMES[h]} o'clock`;
    if (minute === 15) return `quarter past ${EN_HOUR_NAMES[h]}`;
    if (minute === 30) return `half past ${EN_HOUR_NAMES[h]}`;
    if (minute === 45) return `quarter to ${EN_HOUR_NAMES[nextH]}`;
    if (minute < 30) return `${EN_MINUTE_WORDS[minute]} past ${EN_HOUR_NAMES[h]}`;
    return `${EN_MINUTE_WORDS[60 - minute]} to ${EN_HOUR_NAMES[nextH]}`;
  }

  function formatTextSKFormal({ hour, minute }) {
    const h = displayHour(hour);
    const hourPart = `${SK_HOUR_CARDINAL_NOM[h]} ${hodinaForm(h)}`;
    if (minute === 0) return hourPart;
    return `${hourPart} ${SK_MINUTE_GEN[minute]} minút`;
  }

  function formatTextSKCasual({ hour, minute }) {
    const h = displayHour(hour);
    const nextH = nextDisplayHour(hour);
    if (minute === 0) {
      return `${SK_HOUR_CARDINAL_NOM[h]} ${hodinaForm(h)}`;
    }
    if (minute === 15) return `štvrť na ${SK_HOUR_CARDINAL_ACC[nextH]}`;
    if (minute === 30) return `pol ${SK_HOUR_ORDINAL_GEN_FEM[nextH]}`;
    if (minute === 45) return `tri štvrte na ${SK_HOUR_CARDINAL_ACC[nextH]}`;
    if (minute < 30) {
      return `${SK_MINUTE_GEN[minute]} minút po ${SK_HOUR_ORDINAL_GEN_FEM[h]}`;
    }
    return `o ${SK_MINUTE_GEN[60 - minute]} minút ${SK_HOUR_CARDINAL_NOM[nextH]}`;
  }

  function formatTextByPhrasing(time, phrasing) {
    switch (phrasing) {
      case 'en':        return formatTextEN(time);
      case 'sk-formal': return formatTextSKFormal(time);
      case 'sk-casual': return formatTextSKCasual(time);
      default:          return formatTextSKFormal(time);
    }
  }

  const PHRASING_LABEL = {
    'sk-formal': 'Slovenčina (formálne)',
    'sk-casual': 'Slovenčina (ľudovo)',
    'en':        'English',
  };

  const UI_SK = {
    appTitle: 'Hodinková Hra', back: 'Späť', settings: 'Nastavenia',
    language: 'Jazyk / Language', sound: 'Zvuk', home: 'Domov',
    learn: 'Skúmaj hodinky', learnDesc: 'Vyskúšaj rôzne časy',
    test: 'Nastav hodinky', testDesc: 'Posuň ručičky na správny čas',
    quiz: 'Prečítaj hodiny', quizDesc: 'Vyber správny popis času',
    quizPickSK: 'Vyber slovenský popis:',
    quizPickEN: 'Vyber anglický popis:',
    continueEN: 'Teraz po anglicky',
    skStyleFormal: 'formálne',
    skStyleCasual: 'ľudovo',
    pickLevel: 'Vyber úroveň',
    level1: 'Celé hodiny', level2: 'Polhodiny', level3: 'Štvrťhodiny', level4: '5-minútové',
    level1Short: ':00', level2Short: ':00, :30', level3Short: ':00, :15, :30, :45', level4Short: 'každých 5 min',
    best: 'Najlepšie', randomize: 'Náhodne',
    prevH: '−1 hod', nextH: '+1 hod', prevM: '−5 min', nextM: '+5 min',
    prevLg: '◀', nextLg: '▶',
    check: 'Skontrolovať', next: 'Ďalej',
    correct: 'Správne! 🎉', wrong: 'Skús to znova!',
    showAnswer: 'Správny čas:',
    round: 'Kolo', yourScore: 'Tvoje skóre',
    newBest: 'Nový rekord!', playAgain: 'Hrať znova', toHome: 'Domov',
    seeResults: 'Pozrieť výsledky',
    dragHint: 'Chyť a potiahni ručičky', setTo: 'Nastav čas:',
    phrasingFormal: 'formálne', phrasingCasual: 'ľudovo', phrasingEN: 'english',
  };

  const UI_EN = {
    appTitle: 'Clock Game', back: 'Back', settings: 'Settings',
    language: 'Language / Jazyk', sound: 'Sound', home: 'Home',
    learn: 'Explore the clock', learnDesc: 'Try different times',
    test: 'Set the clock', testDesc: 'Move hands to match the time',
    quiz: 'Read the clock', quizDesc: 'Pick the right description',
    quizPickSK: 'Pick the Slovak description:',
    quizPickEN: 'Pick the English description:',
    continueEN: 'Now in English',
    skStyleFormal: 'formal',
    skStyleCasual: 'casual',
    pickLevel: 'Pick a level',
    level1: 'Whole hours', level2: 'Half hours', level3: 'Quarter hours', level4: '5-minute',
    level1Short: ':00', level2Short: ':00, :30', level3Short: ':00, :15, :30, :45', level4Short: 'every 5 min',
    best: 'Best', randomize: 'Random',
    prevH: '−1 hr', nextH: '+1 hr', prevM: '−5 min', nextM: '+5 min',
    prevLg: '◀', nextLg: '▶',
    check: 'Check', next: 'Next',
    correct: 'Correct! 🎉', wrong: 'Try again!',
    showAnswer: 'Correct time:',
    round: 'Round', yourScore: 'Your score',
    newBest: 'New best!', playAgain: 'Play again', toHome: 'Home',
    seeResults: 'See results',
    dragHint: 'Drag the hands', setTo: 'Set the time:',
    phrasingFormal: 'formal', phrasingCasual: 'casual', phrasingEN: 'english',
  };

  function getUI(phrasing) {
    return phrasing === 'en' ? UI_EN : UI_SK;
  }

  function applyStaticI18n(phrasing) {
    const ui = getUI(phrasing);
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.dataset.i18n;
      if (ui[key]) el.textContent = ui[key];
    });
    document.documentElement.lang = phrasing === 'en' ? 'en' : 'sk';
  }

  WG.i18n = {
    formatDigital, formatTextEN, formatTextSKFormal, formatTextSKCasual, formatTextByPhrasing,
    getUI, applyStaticI18n, PHRASING_LABEL,
  };
})();
