// Bet check popup: never left open during a hand, no stale coach buttons, money still adds up.
const { HANDS, check, done } = require('../_util');
const { table, num } = require('./_table');

(async () => {
  const t = table({ mode: 'train', betCheck: true, bank: 1e5 });
  const { q, sleep } = t;
  const popOpen = () => !q('#pop').hidden && !q('#pop').classList.contains('out');
  await t.start();
  const tally = { pop: 0, stalePop: 0, staleBtns: 0, mismatch: 0, rounds: 0 };
  for (let r = 0; r < HANDS; r++) {
    if (!(await t.toBet())) break;
    t.bet([[10], [100], [25], [5, 5], [500]][r % 5]);
    const B0 = t.S().bank;
    q('#deal').click(); await sleep(2);
    if (popOpen()) {
      tally.pop++;
      const ch = ['fix', 'any', 'edit'][r % 3];
      q(`#pop [data-p=${ch}]`).click(); await sleep(2);
      if (ch === 'edit') { if (popOpen()) tally.stalePop++; q('#deal').click(); await sleep(2); }
    }
    for (let i = 0; i < 6000; i++) {
      await sleep(1);
      const a = t.ask();
      if (/vs dealer|Dealing|ace/i.test(a)) {
        if (popOpen()) tally.stalePop++;
        if (q('#coach .cbs') && !/Stop:/.test(q('#coach').textContent)) tally.staleBtns++;
      }
      if (a.startsWith('This hand')) { const net = a.includes('push') ? 0 : num(a.replace('This hand:', '').replace('+', '')); if (Math.abs(t.S().bank - B0 - net) > 1e-9) tally.mismatch++; tally.rounds++; break; }
      if (a.startsWith('Dealer shows an ace')) { q('#a-N').click(); continue; }
      const s = q('#a-S');
      if (s && !s.disabled && /vs dealer/.test(a)) { s.click(); await sleep(1); const m = q('#coach .cb.main'); if (m) m.click(); }
    }
  }
  check('popup appeared for wrong bets', tally.pop > 0, tally.pop);
  check('popup never open during a hand', tally.stalePop === 0);
  check('no leftover coach buttons', tally.staleBtns === 0);
  check('bankroll matches every hand', tally.mismatch === 0 && tally.rounds === HANDS, tally);
  check('no script errors', t.errors.length === 0, t.errors.slice(0, 3));
  done();
})();
