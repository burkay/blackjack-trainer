// When the bankroll falls below €10 it gets €1,000 at once, with a pop-up; profit and RTP only count hand results.
const { check, done } = require('../_util');
const { table } = require('./_table');

const C = r => r;
async function hand(bank, ranks, press, o = {}) {
  const t = table(Object.assign({ bots: 0, sur: false, bank, peek: 'both', splits: 4, decks: 6, sbo: false }, o), null, s => s.replace('const G={', 'const G=window.__G={'));
  await t.start(); await t.toBet();
  const G = t.w.__G; G.bet = Math.min(bank, 500); t.w.eval('void 0');
  ranks.forEach((r, k) => { const i = G.pos + k, j = G.shoe.findIndex((c, n) => n >= i && c.r === r); [G.shoe[i], G.shoe[j]] = [G.shoe[j], G.shoe[i]]; });
  const pops = [], todo = press.slice(), offered = [];
  t.q('#deal').click();
  for (let i = 0; i < 6000 && !t.ask().startsWith('This hand'); i++) {
    await t.sleep(1);
    const p = t.q('#pop');
    if (p && !p.hidden && t.q('#pop [data-p=ok]')) { pops.push(t.q('#popc').textContent); t.q('#pop [data-p=ok]').click(); continue; }
    const en = t.all('#act .act').filter(x => !x.disabled && x.dataset.a);
    if (en.length) { offered.push(en.map(b => b.dataset.a).join('')); const a = todo.shift() || 'S'; (en.find(b => b.dataset.a === a) || en[0]).click(); }
  }
  await t.sleep(20);
  const p = t.q('#pop'); if (p && !p.hidden && t.q('#pop [data-p=ok]')) { pops.push(t.q('#popc').textContent); t.q('#pop [data-p=ok]').click(); }
  return { t, s: t.S(), pops, offered };
}

(async () => {
  // all in with 9,9 vs 8: the bet empties the bankroll, €1,000 arrives at once, so the split is possible
  let r = await hand(220, ['9', '8', '9', '7', 'K', 'Q', 'K'], ['P', 'S', 'S']);
  check('bankroll emptied by the bet: +€1,000 and a pop-up', r.pops.length === 1 && /\+€1,000 added/.test(r.pops[0]) && r.s.tu === 1, r.pops);
  check('…so the split was offered and played', r.offered[0].includes('P') && r.s.hlog[0].h.length === 2, r.offered);
  check('profit counts only the hand: 19 and 19 against 15→ (K) 25 bust, +€440', r.s.tot.net === 440 && r.s.bank === 220 + 440 + 1000, [r.s.tot.net, r.s.bank]);
  check('RTP ignores the top-up', r.s.rt.m[0] === 440 && r.s.rt.m[1] === 880, r.s.rt.m);
  check('Stats mention the play money added', /Play money added when the bankroll ran out: €1,000 \(1 top-up of €1,000\)/.test(r.t.q('#pfbox').textContent));

  // lose the last €100: topped up at the end of the hand, Continue with same bet is there
  r = await hand(100, ['10', '9', '7', '10'], []);
  check('last chips lost: +€1,000 when the hand ends', r.s.bank === 1000 && r.s.tu === 1 && r.s.tot.net === -100 && r.pops.length === 1, [r.s.bank, r.s.tu, r.pops.length]);
  check('…and "Continue with same bet" is offered', !!r.t.q('#nxSame'), r.t.all('#act .nxt b').map(b => b.textContent));

  // opening the page with an empty bankroll
  const z = table({ bank: 0, bots: 0 }); await z.sleep(60);
  check('opening with €0: topped up to €1,000 with the pop-up', z.S().bank === 1000 && !z.q('#pop').hidden && /\+€1,000 added/.test(z.q('#popc').textContent));
  z.q('#play').click(); await z.sleep(30);
  z.w.document.dispatchEvent(new z.w.KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
  await z.sleep(250);
  check('after PLAY, Enter closes it', z.q('#pop').hidden);
  // plenty of money: never
  r = await hand(5000, ['10', '9', '7', '10'], []);
  check('enough money: no top-up', r.s.tu === undefined && r.pops.length === 0, r.s.tu);
  check('no script errors', r.t.errors.length + z.errors.length === 0, r.t.errors.concat(z.errors));
  done();
})();
