// "You vs the rule" replay. Replaying the move you actually made (instead of the chart's move) from the same snapshot,
// in real card order, must reproduce the real result exactly — that proves the replay engine matches the game engine.
// In training mode the player breaks the rule at most once per hand and follows the coach afterwards.
const { HANDS, check, done } = require('../_util');
const { table, random } = require('./_table');

// Every way the dealer can check (US: both, Custom: ace only, Online live: no hole card), a third of the hands each.
const RULES = [['US', { peek: 'both', splits: 4, decks: 6 }], ['ace only', { peek: 'ace', splits: 2, decks: 8 }], ['no hole card', { peek: 'none', splits: 2, decks: 8 }]];
(async () => {
  for (const [name, rules] of RULES) {
    const t = table(Object.assign({ mode: 'train', s17: Math.random() < .5, sur: true }, rules));
    const { q, w, sleep } = t;
    await t.start();
    const n = Math.ceil(HANDS / 3);
    for (let r = 0; r < n; r++) {
      if (!(await t.toBet())) break;
      t.bet([10, 25, 100][r % 3]);
      q('#deal').click();
      let broke = false;
      await t.playOut(random, stop => { if (!broke && Math.random() < .7) { broke = true; return stop[1]; } return stop[0]; });
      await sleep(1);
    }
    const dbg = w.__cfdbg, bad = dbg.filter(x => x.mirror !== null && Math.abs(x.mirror - x.you) > 1e-9);
    const S = t.S();
    check(`${name}: hands with a broken rule were recorded`, dbg.length > n / 5 && S.cf.n === dbg.length, { recorded: dbg.length, stats: S.cf.n });
    check(`${name}: replaying your own move reproduces the real result`, bad.length === 0, { mismatches: bad.length, sample: bad[0] });
    check(`${name}: no replay ran out of cards`, dbg.every(x => x.mirror !== null));
    check(`${name}: no script errors`, t.errors.length === 0, t.errors.slice(0, 3));
  }
  done();
})();
