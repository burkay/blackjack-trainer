// Other players: Player 1 bets reverse martingale, Player 2 flat; their P/L under their names adds up; the reset button works.
const { HANDS, check, done } = require('../_util');
const { table } = require('./_table');

(async () => {
  const t = table();
  const { q, sleep } = t;
  await t.start();
  let bad = 0, label = 0, s2 = 0, s0 = 0, top = 0;
  for (let r = 0; r < HANDS; r++) {
    if (!(await t.toBet())) break;
    const before = (t.S().botst || { 2: { bet: 10 } })[2].bet;
    if (r > 0 && !q('.seat.s2 .sl').textContent.includes('next €' + before)) label++;
    t.bet(10); q('#deal').click();
    await t.playOut(en => en.find(b => b.dataset.a === 'S') || en[0]);
    const st = t.S().botst, last = st[2].last;
    s2 += last; s0 += st[0].last; top = Math.max(top, before);
    const want = last > 0 ? (before * 2 > 500 ? 10 : before * 2) : last < 0 ? 10 : before;
    if (st[2].bet !== want) bad++;
  }
  const st = t.S().botst;
  check('reverse martingale: double after a win, €10 after a loss, same after a push', bad === 0, { bad, highestBet: top });
  check('next bet shows under Player 1', label === 0, label);
  check('P/L lines add up', st[2].net === s2 && st[0].net === s0 && st[2].hands === HANDS, { p1: st[2].net, p2: st[0].net });
  q('#resetBots').click(); q('#resetBots').click();
  const z = t.S().botst;
  check('reset button clears both players', z[0].net === 0 && z[0].hands === 0 && z[2].net === 0 && z[2].bet === 10);
  check('no script errors', t.errors.length === 0, t.errors.slice(0, 3));
  done();
})();
