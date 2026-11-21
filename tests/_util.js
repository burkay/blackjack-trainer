// Shared helpers for the jsdom simulations.
// Each test loads one app's single HTML file, drives it through its own UI and checks the numbers it stores.
const path = require('path');
const fs = require('fs');

const APPS = {
  table: path.join(__dirname, '..', 'apps', 'table-simulator', 'index.html'),
  fast: path.join(__dirname, '..', 'apps', 'fast-blackjack', 'index.html'),
  strategy: path.join(__dirname, '..', 'apps', 'strategy-test', 'index.html'),
  hilo: path.join(__dirname, '..', 'apps', 'hilo-trainer', 'index.html'),
};

// Number of simulated hands per test; raise it for a deeper run, e.g. HANDS=2000 npm test
const HANDS = Math.max(20, parseInt(process.env.HANDS, 10) || 300);

const read = app => fs.readFileSync(APPS[app], 'utf8');

/** Load an app in jsdom with timers shortened. `store` seeds localStorage (key -> object). */
function load(app, store = {}) {
  const { JSDOM } = require('jsdom');
  const util = require('util');
  const dom = new JSDOM(read(app), {
    runScripts: 'dangerously', pretendToBeVisual: true, url: 'https://bj.test/',
    beforeParse(w) {
      const st = w.setTimeout.bind(w);
      w.setTimeout = (f, ms, ...a) => st(f, ms >= 1000 ? 20 : 0, ...a);
      if (!w.TextEncoder) w.TextEncoder = util.TextEncoder;
      w.__cfdbg = [];
      for (const [k, v] of Object.entries(store)) w.localStorage.setItem(k, JSON.stringify(v));
    },
  });
  const w = dom.window, d = w.document;
  const errors = [];
  w.addEventListener('error', e => errors.push(e.message));
  return {
    w, d, errors,
    q: s => d.querySelector(s),
    all: s => [...d.querySelectorAll(s)],
    sleep: ms => new Promise(r => setTimeout(r, ms)),
    state: key => JSON.parse(w.localStorage.getItem(key) || 'null'),
  };
}

let failed = 0;
function check(name, ok, info) {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${info !== undefined ? '  ' + (typeof info === 'string' ? info : JSON.stringify(info)) : ''}`);
  if (!ok) { failed++; process.exitCode = 1; }
}
const done = () => process.exit(failed ? 1 : 0);

module.exports = { APPS, HANDS, read, load, check, done };
