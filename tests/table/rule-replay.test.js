// "You vs the rule" replay. Replaying the move you actually made (instead of the chart's move) from the same snapshot,
// in real card order, must reproduce the real result exactly — that proves the replay engine matches the game engine.
// In training mode the player breaks the rule at most once per hand and follows the coach afterwards.
const { HANDS, check, done } = require('../_util');
const { table, random } = require('./_table');

(async () => {
  const t = table({ mode: 'train', s17: Math.random() < .5, sur: true });
  const { q, w, sleep } = t;
  await t.start();
  for (let r = 0; r < HANDS; r++) {
    if (!(await t.toBet())) break;
    t.bet([10, 25, 100][r % 3]);
    q('#deal').click();
    let broke = false;
    await t.playOut(random, stop => { if (!broke && Math.random() < .7) { broke = true; return stop[1]; } return stop[0]; });
    await sleep(1);
  }
  const dbg = w.__cfdbg, bad = dbg.filter(x => x.mirror !== null && Math.abs(x.mirror - x.you) > 1e-9);
  const S = t.S();
  check('hands with a broken rule were recorded', dbg.length > HANDS / 5 && S.cf.n === dbg.length, { recorded: dbg.length, stats: S.cf.n });
  check('replaying your own move reproduces the real result', bad.length === 0, { mismatches: bad.length, sample: bad[0] });
  check('no replay ran out of cards', dbg.every(x => x.mirror !== null));
  check('no script errors', t.errors.length === 0, t.errors.slice(0, 3));
  done();
})();
