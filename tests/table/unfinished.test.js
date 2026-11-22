// Closing the page in the middle of a hand: the money on the table counts as lost, in the bankroll, the profit, the RTP and
// for the house alike. It must never undo a hand, and never count twice.
const { HANDS, check, done } = require('../_util');
const { table, random } = require('./_table');

const C = x => ({ r: x.slice(0, -1), s: x.slice(-1) });
async function dealt(cards, o = {}, sides) {
  const t = table(Object.assign({ bots: 0, sur: false, sbo: true, bank: 1000, str: 3 }, o), null, s => s.replace('const G={', 'const G=window.__G={'));
  await t.start(); await t.toBet(); t.bet(100);
  for (const [k, v] of sides || []) { t.q(`[data-bt=${k}]`).click(); t.q(`[data-chip="${v}"]`).click(); }
  const G = t.w.__G;
  cards.map(C).forEach((w, k) => { const i = G.pos + k, j = G.shoe.findIndex((c, n) => n >= i && c.r === w.r && c.s === w.s); [G.shoe[i], G.shoe[j]] = [G.shoe[j], G.shoe[i]]; });
  t.q('#deal').click();
  return t;
}
const ready = async (t, sel) => { for (let i = 0; i < 4000 && !(t.q(sel) && !t.q(sel).disabled); i++) await t.sleep(1); };
// let the click be handled, but no timer: the hand stays open
const tick = async () => { for (let i = 0; i < 20; i++) await null; };
const reopen = async s => { const u = table(s); await u.sleep(80); return u; };
const sum = s => Object.values(s.hs).reduce((a, x) => a + x[0] - x[1], 0);

(async () => {
  // Before any move: the bet is gone all the same.
  let t = await dealt(['9♠', '6♦', '7♦', '5♣', 'K♥']);
  let u = await reopen(t.S()), s = u.S();
  check('closed right after the bet went down: −€100', s.bank === 900 && s.tot.net === -100 && s.tot.hands === 1, [s.bank, s.tot]);
  await ready(t, '#a-S');
  u = await reopen(t.S()); s = u.S();
  check('closed before the first move: −€100 in bankroll, profit, RTP and house', s.bank === 900 && s.tot.net === -100 && s.ses.net === -100 && s.rt.m.join() === '100,0' && sum(s) === 100, [s.bank, s.tot.net, s.rt.m, sum(s)]);
  check('the streak ends', s.str === 0 && u.q('.seat.s1 .stk').textContent === '');
  check('the history says so', s.hlog.length === 1 && s.hlog[0].u === 1 && s.hlog[0].y === -100 && s.hlog[0].h[0][0] === '9♠ 7♦', s.hlog[0]);
  check('the coach explains it', /Unfinished hand: −€100/.test(u.q('#coach').textContent), u.q('#coach').textContent);
  u.q('#btnHist').click();
  check('the hand history page shows it', /Unfinished/.test(u.q('#hList').textContent));
  const u2 = await reopen(u.S());
  check('it is booked only once', u2.S().tot.net === -100 && u2.S().hlog.length === 1 && u2.S().pend === null && !/Unfinished/.test(u2.q('#coach').textContent));

  // After a double: both bets.
  t = await dealt(['6♠', '6♦', '5♦', '2♣', 'K♥', '9♥']);
  await ready(t, '#a-D'); t.q('#a-D').click(); await tick();
  u = await reopen(t.S()); s = u.S();
  check('closed after a double: −€200', s.bank === 800 && s.tot.net === -200 && s.rt.m.join() === '200,0' && sum(s) === 200, [s.bank, s.tot.net, s.rt.m]);

  // After a split, and with insurance.
  t = await dealt(['8♠', '6♦', '8♦', '3♣', '4♥', 'K♥']);
  await ready(t, '#a-P'); t.q('#a-P').click(); await tick();
  u = await reopen(t.S()); s = u.S();
  check('closed after a split: −€200', s.bank === 800 && s.tot.net === -200 && s.hlog[0].h.length === 2, [s.bank, s.tot.net]);
  t = await dealt(['9♠', 'A♦', '7♦', '5♣', 'K♥']);
  await ready(t, '#a-I'); t.q('#a-I').click(); await ready(t, '#a-S');
  u = await reopen(t.S()); s = u.S();
  check('closed with insurance on the table: −€150', s.bank === 850 && s.tot.net === -150, [s.bank, s.tot.net]);

  // Side bets that were already decided keep their result.
  t = await dealt(['9♠', '6♦', '9♠', '5♣', 'K♥'], {}, [['pp', 10], ['t3', 5]]);
  await ready(t, '#a-S');
  u = await reopen(t.S()); s = u.S();
  check('a won side bet stays won: −100 + 250 − 5', s.bank === 1145 && s.tot.net === 145 && s.rt.pp.join() === '10,260' && s.rt.t3.join() === '5,0' && sum(s) === -145, [s.bank, s.tot.net, s.rt]);

  // The result was known, only the chips were still moving: it counts as it was.
  u = await reopen({ bank: 1100, str: 1, pend: { t: Math.floor(Date.now() / 1000), m: 100, w: 200, done: 1, h: ['K♠ Q♠'], d: '9♠ 9♦', dt: 18, s: [] } }); s = u.S();
  check('closed while being paid: the win counts', s.bank === 1100 && s.tot.net === 100 && s.str === 2 && !s.hlog[0].u && !/Unfinished/.test(u.q('#coach').textContent), [s.bank, s.tot.net, s.str]);
  // A hand left open hours ago is not part of the new session.
  u = await reopen({ bank: 900, pend: { t: Math.floor(Date.now() / 1000) - 7200, m: 100, w: 0, h: ['K♠ 6♠'], d: '9♠', dt: 9, s: [] } }); s = u.S();
  check('left open hours ago: overall yes, new session no', s.tot.net === -100 && s.ses.net === 0, [s.tot.net, s.ses]);
  check('a broken entry is ignored', (await reopen({ pend: { m: 'x' } })).S() !== undefined && (await reopen({ pend: 5 })).errors.length === 0);

  // Ordinary play: nothing pending after a hand, and at any moment bankroll and profit agree after reopening.
  t = table({ sbo: true, bank: 1e6 }); await t.start();
  let bad = 0, n = 0, left = 0;
  for (let r = 0; r < Math.min(HANDS, 60); r++) {
    if (!(await t.toBet())) break;
    t.bet(25); t.q('[data-bt=pp]').click(); t.q('[data-chip="5"]').click(); t.q('#deal').click();
    const stopAt = Math.random() < .5 ? 1 + Math.floor(Math.random() * 3) : 0; let k = 0, snap = null;
    if (!(await t.playOut(en => { if (++k === stopAt) snap = t.S(); return random(en); }))) break;
    n++; if (t.S().pend) left++;
    if (snap) { const v = await reopen(snap), z = v.S(); if (Math.abs(z.bank - 1e6 - z.tot.net) > 1e-6 || v.errors.length) bad++; }
    if (Math.abs(t.S().bank - 1e6 - t.S().tot.net) > 1e-6) bad++;
  }
  check('nothing pending after a finished hand', n > 0 && left === 0, { hands: n, left });
  check('bankroll and overall profit always agree, also after closing mid-hand', bad === 0, bad);
  check('no script errors', t.errors.length === 0, t.errors.slice(0, 3));
  done();
})();
