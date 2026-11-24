// Every hand: Win − Bet must equal the hand result, and the bankroll must move by exactly that much.
// Random plays (hit, stand, double, split, surrender) and random insurance.
const { HANDS, check, done } = require('../_util');
const { table, random, num } = require('./_table');

const RULES = [['US', { peek: 'both', splits: 4, decks: 6 }], ['ace only', { peek: 'ace', splits: 2, decks: 8 }], ['no hole card', { peek: 'none', splits: 2, decks: 8 }]];
(async () => {
  for (const [name, rules] of RULES) {
  const n = Math.ceil(HANDS / 3);
    const t = table(rules);
    const { q, all, sleep } = t;
    await t.start();
    let bad = 0, rounds = 0;
    const seen = { dbl: 0, split: 0, sur: 0, ins: 0 };
    for (let r = 0; r < n; r++) {
      if (!(await t.toBet())) break;
      t.bet([10, 25, 100][r % 3]);
      const B0 = t.S().bank;
      q('#deal').click();
      for (let i = 0; i < 8000; i++) {
        await sleep(1);
        const a = t.ask();
        if (a.startsWith('This hand')) {
          const net = a.includes('push') ? 0 : num(a.replace('This hand:', '').replace('+', ''));
          const box = all('.hsum div').map(x => num(x.querySelector('b').textContent));
          if (Math.abs(box[1] - box[0] - net) > 1e-9 || Math.abs(t.S().bank - B0 - net) > 1e-9) bad++;
          rounds++;
          break;
        }
        const ib = q('#a-I');
        if (ib && !ib.disabled) { if (Math.random() < .5) { ib.click(); seen.ins++; } else q('#a-N').click(); continue; }
        const en = all('#act .act').filter(x => !x.disabled && x.dataset.a);
        if (en.length) { const b = random(en); if (b.dataset.a === 'D') seen.dbl++; if (b.dataset.a === 'P') seen.split++; if (b.dataset.a === 'R') seen.sur++; b.click(); }
      }
    }
    check(`${name}: all hands finished`, rounds === n, `${rounds}/${n}`);
    check(`${name}: Win − Bet = result = bankroll change`, bad === 0, { bad, ...seen });
    check(`${name}: no script errors`, t.errors.length === 0, t.errors.slice(0, 3));
  }
  done();
})();
