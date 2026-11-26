// Helpers for driving the Table Simulator UI.
const { load } = require('../_util');

const KEY = 'bj-masa-v1';

function table(settings = {}, before, patch) {
  const t = load('table', { [KEY]: Object.assign({ hr: 1, sur: true, sbo: false, cc: 0, betCheck: false, bots: 2, show: true, mode: 'exam', offer: false, bank: 1e6 }, settings) }, before, patch);
  const { q, all, sleep } = t;
  const ask = () => ((q('#act .ask') || q('#act .verdict') || {}).textContent) || '';
  t.ask = ask;
  t.S = () => t.state(KEY);
  t.start = async () => { await sleep(50); q('#play').click(); await sleep(30); };
  /** Wait until the betting screen is showing, clicking through end-of-hand screens. */
  t.toBet = async () => {
    for (let i = 0; i < 4000 && !ask().startsWith('Place your bet'); i++) {
      await sleep(1);
      const x = q('#newExam') || q('#nextR');
      if (x) x.click();
    }
    return ask().startsWith('Place your bet');
  };
  t.bet = chips => { q('#clr').click(); [].concat(chips).forEach(c => q(`[data-chip="${c}"]`).click()); };
  /** Play the hand out. `pick(buttons)` returns the button to press for a decision. */
  t.playOut = async (pick, onStop) => {
    for (let i = 0; i < 8000; i++) {
      await sleep(1);
      if (ask().startsWith('This hand')) return true;
      const pop = q('#pop');
      if (pop && !pop.hidden) { (q('#pop [data-p=any]') || q('#pop [data-p=ok]')).click(); continue; }
      const stop = all('#coach .cb');
      if (stop.length === 2 && /Stop:/.test(q('#coach').textContent)) { (onStop ? onStop(stop) : stop[0]).click(); continue; }
      const ib = q('#a-I');
      if (ib && !ib.disabled) { q('#a-N').click(); continue; }
      const en = all('#act .act').filter(x => !x.disabled && x.dataset.a);
      if (en.length) pick(en).click();
    }
    return false;
  };
  return t;
}

const random = en => en[Math.floor(Math.random() * en.length)];
const num = s => { const m = String(s).replace(/,/g, '').match(/[−-]?€?[\d.]+/); return m ? parseFloat(m[0].replace('−', '-').replace('€', '')) : 0; };

module.exports = { table, random, num, KEY };
