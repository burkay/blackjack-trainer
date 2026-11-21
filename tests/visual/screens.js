// Screenshots of the apps at desktop, large and phone sizes, for eyeballing layout changes.
// Needs Chrome or Chromium. Found automatically on macOS, Windows and Linux; otherwise set CHROME to its path.
// npm run screens   (output: tests/visual/out/*.png)
const path = require('path');
const fs = require('fs');
const puppeteer = require('puppeteer-core');
const { APPS } = require('../_util');

const CHROME = process.env.CHROME || ['/usr/bin/google-chrome', '/usr/bin/chromium', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe'].find(p => fs.existsSync(p));
const OUT = path.join(__dirname, 'out');
const wait = ms => new Promise(r => setTimeout(r, ms));
const SIZES = [['desktop', 1440, 900], ['large', 2576, 1360], ['phone', 390, 844]];

(async () => {
  if (!CHROME) { console.error('Set CHROME to a Chrome/Chromium executable.'); process.exit(1); }
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await puppeteer.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  for (const [name, w, h] of SIZES) {
    const p = await browser.newPage();
    await p.setViewport({ width: w, height: h });
    await p.evaluateOnNewDocument(() => { if (!sessionStorage.getItem('seeded')) { sessionStorage.setItem('seeded', 1); localStorage.setItem('bj-masa-v1', JSON.stringify({ cc: 0, betCheck: false, fast: true, mode: 'train', bots: 2, ts: Date.now() })); } });
    await p.goto('file://' + APPS.table); await wait(800);
    await p.evaluate(() => document.querySelector('#play').click()); await wait(1200);
    await p.evaluate(() => { const q = s => document.querySelector(s); q('#clr').click(); q('[data-chip="100"]').click(); q('#deal').click(); });
    for (let i = 0; i < 60; i++) {
      await wait(300);
      const a = await p.evaluate(() => document.querySelector('#act').textContent.trim());
      if (a.startsWith('This hand')) break;
      await p.evaluate(() => { const q = s => document.querySelector(s); const m = q('#coach .cb.main'); if (m) return m.click(); const n = q('#a-N'); if (n && !n.disabled) return n.click(); const s = q('#a-S'); if (s && !s.disabled) s.click(); });
    }
    await wait(800);
    await p.screenshot({ path: path.join(OUT, `table-${name}.png`) });
    await p.click('#btnHist'); await wait(400);
    await p.screenshot({ path: path.join(OUT, `history-${name}.png`) });
    await p.goto('file://' + APPS.fast); await wait(600);
    await p.screenshot({ path: path.join(OUT, `fast-${name}.png`) });
    await p.close();
    console.log('saved', name);
  }
  await browser.close();
})();
