# Hodinková Hra — Watch Game

Webová vzdelávacia hra, ktorá učí deti čítať analógové hodinky. Funguje na tablete aj v PC prehliadači. Bez build kroku — len HTML, CSS a vanilla JS.

A browser-based educational game that teaches kids to read analog clocks. Runs on tablets and PCs. No build step — plain HTML, CSS and vanilla JS.

## Funkcie / Features

- **Učenie / Learn** — preskúmaj časy, vidíš naraz analógové, digitálne aj slovné vyjadrenie. Ťahaj ručičky alebo použi tlačidlá ±5 min, ±1 hod a Náhodne.
- **Test** — náhodne vygenerovaný digitálny čas, dieťa nastaví ručičky a klikne Skontrolovať. 10 kôl, hviezdičky za správne odpovede, ukladá sa najlepšie skóre.
- **4 úrovne obtiažnosti**:
  1. Celé hodiny (`:00`)
  2. Polhodiny (`:00`, `:30`)
  3. Štvrťhodiny (`:00`, `:15`, `:30`, `:45`)
  4. 5-minútové intervaly
- **3 jazyky textu času**: Slovenčina (formálne — *sedem hodín tridsať minút*), Slovenčina (ľudovo — *pol ôsmej*), English (*half past seven*).
- **Touch + myš** — ovládanie cez Pointer Events funguje rovnako na tablete aj PC.
- **Ukladá sa**: vybraná úroveň, jazyk, zvuk, najlepšie skóre pre každú úroveň (v `localStorage`).

## Spustenie / How to run

### Najjednoduchšie — dvojklik na `index.html`
Aplikácia používa klasické `<script>` súbory (nie ES moduly), takže funguje aj cez `file://`. Stačí jednoducho otvoriť `index.html` v prehliadači (Safari, Chrome, Firefox).

```sh
open index.html       # macOS
xdg-open index.html   # Linux
start index.html      # Windows
```

### Cez lokálny server (odporúčané na tablete)
```sh
python3 -m http.server 8000
# potom v prehliadači: http://localhost:8000
```

### Na tablete v rovnakej WiFi sieti
1. Zisti svoju lokálnu IP (`ipconfig getifaddr en0` na macOS).
2. Spusti server ako vyššie.
3. Na tablete otvor `http://<tvoja-ip>:8000`.

### Nasadenie na GitHub Pages
```sh
git push
# v repo nastaveniach: Settings → Pages → Source: main / root
```
Po pár sekundách bude hra dostupná na `https://<user>.github.io/<repo>/`.

## Štruktúra projektu

```
watch-game/
├── index.html              # SPA shell, mountuje aplikáciu
├── styles/
│   ├── base.css            # Reset, typografia, farebné tokeny
│   ├── ui.css              # Tlačidlá, karty, modal, layouty
│   └── clock.css           # Analógové hodinky (SVG štýly)
└── scripts/
    ├── main.js             # Boot, routing medzi obrazovkami, settings
    ├── clock.js            # AnalogClock — SVG render + ťahanie ručičiek
    ├── time.js             # Čistá matematika (uhly, snap, generovanie)
    ├── i18n.js             # Formátovanie SK formálne / SK ľudovo / EN
    ├── learn.js            # Obrazovka Učenie
    ├── test.js             # Obrazovka Test + Výsledky
    └── storage.js          # localStorage wrapper
```

## Kompatibilita / Compatibility

Vyžaduje moderný prehliadač s podporou ES modulov a CSS `clamp()`:
- Chrome / Edge 88+
- Safari 14+ (iPad)
- Firefox 89+
- Chrome on Android 88+
