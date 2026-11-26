// Simple view: while playing the felt shows names, bets and streaks; the figures come out at the end of a hand.
// Detailed view: always. The eye button in the top bar switches and remembers it.
const { check, done } = require('../_util');
const { table } = require('./_table');

(async () => {
  const t = table({ bots: 2, sbo: true, bank: 2000, str: 2, rt: { m: [1000, 950], pp: [50, 30], t3: [50, 80] }, botst: { 0: { net: -20, hands: 9, b: 90, w: 70, str: 1 }, 2: { net: 30, hands: 9, b: 120, w: 150, bet: 20, run: 1, str: 3 } } });
  const { q, w } = t;
  const html = w.document.documentElement, felt = q('#felt');
  await t.start(); await t.toBet();
  check('new tables start in the simple view', html.dataset.view === 'simple' && q('#btnView').getAttribute('aria-pressed') === 'false');
  check('while betting the felt is not in hand-end mode', !felt.classList.contains('handend'));
  check('the figures are drawn, the stylesheet hides them until the hand ends', q('.seat.s2 .rtx').textContent.includes('RTP') && /:root\[data-view=simple\] #felt:not\(\.handend\) :is\(\.rtx,\.spl,\.srt\)\{display:none\}/.test(w.document.querySelector('style').textContent));
  t.bet(100); q('#deal').click();
  await t.playOut(en => en.find(b => b.dataset.a === 'S') || en[0]);
  check('at the end of the hand the figures come out', felt.classList.contains('handend'));
  q('#nextR').click(); await t.toBet();
  check('…and go away for the next hand', !felt.classList.contains('handend'));
  q('#btnView').click();
  check('the eye button switches to the detailed view and remembers it', html.dataset.view === 'detail' && t.S().view === 'detail' && q('#btnView').getAttribute('aria-pressed') === 'true');
  q('#btnView').click();
  check('…and back', html.dataset.view === 'simple' && t.S().view === 'simple');
  const d = table({ view: 'detail' }); await d.sleep(40);
  check('a saved detailed view opens detailed', d.w.document.documentElement.dataset.view === 'detail');
  check('no script errors', t.errors.length + d.errors.length === 0, t.errors.concat(d.errors));
  done();
})();
