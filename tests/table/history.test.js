// Hand history: one record per hand, numbers that add up, and rule-broken records that match the stats.
const { HANDS, check, done } = require('../_util');
const { table, random } = require('./_table');

(async () => {
  const t = table({ mode: 'train', betCheck: true });
  const { q, all, sleep } = t;
  await t.start();
  for (let r = 0; r < HANDS; r++) {
    if (!(await t.toBet())) break;
    t.bet([10, 25, 100][r % 3]);
    q('#deal').click(); await sleep(2);
    let broke = false;
    await t.playOut(random, stop => { if (!broke && Math.random() < .6) { broke = true; return stop[1]; } return stop[0]; });
  }
  const S = t.S(), L = S.hlog;
  const sumY = L.reduce((a, r) => a + r.y, 0);
  check('one record per hand, newest first', L.length === HANDS && L[0].n > L[L.length - 1].n, L.length);
  check('Win − Bet = result on every record', L.every(r => Math.abs(r.w - r.b - r.y) < 1e-9));
  check('records add up to the bankroll change', Math.abs(sumY - (S.bank - 1e6)) < 1e-6, { sumY, bank: S.bank - 1e6 });
  check('rule-broken records match the stats', L.filter(r => r.c).length === S.cf.n, { log: L.filter(r => r.c).length, stats: S.cf.n });
  check('bet check recorded on each hand', L.every(r => r.k));
  q('#k-rb').click(); await sleep(5);
  check('top-bar indicator opens the history on "Rule broken"', !q('#histPg').hidden && /Rule broken/.test(q('#hFil [aria-pressed=true]').textContent));
  q('#hList .hr').click();
  check('a row expands to its details', !q('#hList .hd').hidden && q('#hList .hd').textContent.length > 20);
  check('no script errors', t.errors.length === 0, t.errors.slice(0, 3));
  done();
})();
