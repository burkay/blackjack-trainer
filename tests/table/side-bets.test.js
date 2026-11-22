// Perfect Pairs and 21+3: pay table, exact odds behind the RTP figures, and the bets on the real table.
const { read, HANDS, check, done } = require('../_util');
const { table, random } = require('./_table');

const src = read('table');
const { perfectPairs, poker3, RTP } = new Function('S', src.slice(src.indexOf('/*SIDE*/'), src.indexOf('/*ENDSIDE*/')) + ';return {perfectPairs,poker3,RTP};')({});
const RK = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'], SU = ['♠', '♥', '♦', '♣'];
const C = x => ({ r: x.slice(0, -1), s: x.slice(-1) });
const p3 = (...a) => { const r = poker3(a.map(C)); return r ? r.join(' ') : ''; };
const pp = (a, b) => { const r = perfectPairs(C(a), C(b)); return r ? r.join(' ') : ''; };

check('Perfect Pairs pay table', pp('8♠', '8♠') === 'Perfect pair 25' && pp('8♥', '8♦') === 'Coloured pair 12' && pp('8♠', '8♦') === 'Mixed pair 6' && pp('K♠', 'Q♠') === '' && pp('10♠', 'K♠') === '');
check('21+3 pay table', p3('7♦', '7♦', '7♦') === 'Suited trips 100' && p3('5♣', '7♣', '6♣') === 'Straight flush 40' && p3('7♦', '7♣', '7♦') === 'Three of a kind 30' && p3('5♣', '7♦', '6♣') === 'Straight 10' && p3('2♣', '9♣', 'K♣') === 'Flush 5');
check('21+3: ace is high and low, no wrap-around; two pairs of suits are nothing', p3('Q♣', 'A♦', 'K♣') === 'Straight 10' && p3('3♣', 'A♦', '2♣') === 'Straight 10' && p3('K♣', 'A♦', '2♣') === '' && p3('7♦', '7♣', '8♦') === '' && p3('A♣', 'K♣', 'Q♣') === 'Straight flush 40');

// Count every pair / triple of card types with how often it can be dealt from 8 and 6 decks; must match the RTP shown.
const cards = []; for (const r of RK) for (const s of SU) cards.push({ r, s });
for (const D of [8, 6]) {
  let n = 0, back = 0;
  cards.forEach((a, i) => cards.forEach((b, j) => { const w = D * (i === j ? D - 1 : D), r = perfectPairs(a, b); n += w; back += r ? w * (r[1] + 1) : 0; }));
  check(`${D} decks: Perfect Pairs RTP is exact`, Math.abs(back / n * 100 - RTP[D].pp) < .006, (back / n * 100).toFixed(3));
  n = 0; back = 0;
  cards.forEach((a, i) => cards.forEach((b, j) => cards.forEach((c, k) => { const w = D * (D - (i === j)) * (D - (i === k) - (j === k)), r = poker3([a, b, c]); n += w; back += r ? w * (r[1] + 1) : 0; })));
  check(`${D} decks: 21+3 RTP is exact`, Math.abs(back / n * 100 - RTP[D].t3) < .006, (back / n * 100).toFixed(3));
}

const open = (o = {}) => table(Object.assign({ sbo: true, bots: 0, sur: false, bank: 1000 }, o), null, s => s.replace('const G={', 'const G=window.__G={'));
const stack = (G, want) => want.map(C).forEach((w, k) => { const i = G.pos + k, j = G.shoe.findIndex((c, n) => n >= i && c.r === w.r && c.s === w.s); [G.shoe[i], G.shoe[j]] = [G.shoe[j], G.shoe[i]]; });
const chips = (t, where, list) => { t.q(`[data-bt=${where}]`).click(); list.forEach(v => t.q(`[data-chip="${v}"]`).click()); };
async function hand(t, want) { if (want) stack(t.w.__G, want); const b0 = t.S().bank; t.q('#deal').click(); await t.playOut(en => en.find(b => b.dataset.a === 'S') || en[0]); return t.S().bank - b0; }

(async () => {
  let t = open(); await t.start(); await t.toBet(); t.bet(100); chips(t, 'pp', [10]); chips(t, 't3', [5, 5]);
  check('chips go on the chosen side bet', /Pairs€10/.test(t.q('[data-bt=pp]').textContent) && /21\+3€10/.test(t.q('[data-bt=t3]').textContent) && /Bet€100/.test(t.q('[data-bt=m]').textContent));
  // 9♠ 9♠ vs 9♠, dealer then 7 K: perfect pair 25:1 (+250) and suited trips 100:1 (+1000), hand 18 beats a bust.
  let net = await hand(t, ['9♠', '9♠', '9♠', '7♦', 'K♥']);
  let s = t.S(), h = s.hlog[0];
  check('perfect pair and suited trips are paid 25:1 and 100:1', net === 100 + 250 + 1000, net);
  check('history keeps hand and side bets apart', h.y === 100 && h.b === 100 && JSON.stringify(h.s) === JSON.stringify([['pp', 10, 260, 'Perfect pair'], ['t3', 10, 1010, 'Suited trips']]), [h.y, h.s]);
  check('profit counts everything; the streak only the hand', s.ses.net === 1350 && s.tot.net === 1350 && s.str === 1, [s.ses.net, s.str]);
  check('the end of the hand shows them', /Perfect pair 25:1 \+€250/.test(t.q('#act').textContent) && /Suited trips 100:1 \+€1,000/.test(t.q('#act').textContent));
  check('your RTP per game', JSON.stringify(s.rt) === JSON.stringify({ m: [100, 200], pp: [10, 260], t3: [10, 1010] }), s.rt);
  check('the RTP table shows game and own figures', /99\.46%/.test(t.q('#rtpbox').textContent) && /95\.90%/.test(t.q('#rtpbox').textContent) && /96\.30%/.test(t.q('#rtpbox').textContent) && /200\.0%/.test(t.q('#rtpbox').textContent), t.q('#rtpbox').textContent.slice(0, 120));
  check('next hand repeats the bet and the side bets', /Next Hand with €100 \+ €20/.test(t.q('#nxSame').textContent), t.q('#nxSame').textContent);
  // Losing side bets, winning hand: streak goes to 2.
  t.q('#nextR').click(); await t.toBet();
  net = await hand(t, ['10♠', '6♦', 'K♥', '10♣', 'J♥']);
  s = t.S();
  check('lost side bets: +100 − 20, streak still grows', net === 80 && s.str === 2 && s.hlog[0].y === 100, [net, s.str]);
  t.q('#nextR').click(); await t.toBet();
  t.q('[data-bt=pp]').click(); t.q('#clr').click(); t.q('[data-bt=t3]').click(); t.q('#clr').click();
  net = await hand(t, ['10♠', '6♦', 'K♥', '10♣', 'J♥']);
  check('cleared side bets are off', net === 100 && !t.S().hlog[0].s, [net, t.S().hlog[0].s]);
  check('no script errors', t.errors.length === 0, t.errors);

  // Limits: €100 per side bet, never more than the bankroll.
  t = open(); await t.start(); await t.toBet(); t.bet(100); chips(t, 'pp', [100, 100]);
  check('side bet limit €100', t.w.__G.sb.pp === 100, t.w.__G.sb.pp);
  t = open({ bank: 60 }); await t.start(); await t.toBet(); t.bet([25, 25]); chips(t, 't3', [25]);
  check('side bets never exceed the bankroll', t.w.__G.bet + t.w.__G.sb.t3 <= 60 && t.w.__G.sb.t3 === 10, t.w.__G.sb);
  // Option off: no side-bet controls, no spots.
  t = open({ sbo: false }); await t.start(); await t.toBet();
  check('option off: no controls and no spots', !t.q('.sbt') && t.all('.sbs').every(e => e.hidden));
  t.q('#sbo-1').checked = true; t.q('#sbo-1').dispatchEvent(new t.w.Event('change', { bubbles: true }));
  check('option on from the menu', !!t.q('.sbt') && t.S().sbo === true && t.all('.sbs').every(e => !e.hidden));

  // Many random hands with other players: the bankroll always moves by hand + side bets.
  t = open({ bots: 2, bank: 1e6 }); await t.start();
  let bad = 0, n = 0, wins = 0, sum = 0;
  for (let r = 0; r < HANDS; r++) {
    if (!(await t.toBet())) break;
    t.bet(25);
    for (const k of ['pp', 't3']) { t.q(`[data-bt=${k}]`).click(); t.q('#clr').click(); if (Math.random() < .7) t.q(`[data-chip="${random([5, 10, 25])}"]`).click(); }
    const b0 = t.S().bank; t.q('#deal').click();
    if (!(await t.playOut(random))) break;
    const x = t.S(), hh = x.hlog[0], side = (hh.s || []).reduce((a, y) => a + y[2] - y[1], 0);
    n++; sum += hh.y + side; wins += (hh.s || []).filter(y => y[2]).length;
    if (Math.abs(x.bank - b0 - hh.y - side) > 1e-9 || Math.abs(x.tot.net - sum) > 1e-9) bad++;
  }
  check('bankroll change = hand + side bets on every hand', n === HANDS && bad === 0, { hands: n, bad, sideWins: wins });
  check('no script errors (random play)', t.errors.length === 0, t.errors.slice(0, 3));
  done();
})();
