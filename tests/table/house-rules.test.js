// House rules played on the real table with a stacked shoe: the second dealer card face down from the start, checked under an
// ace but not under a ten, one split, insurance.
const { check, done } = require('../_util');
const { table } = require('./_table');

// No other players. Dealing order: you, dealer, you, dealer's face-down card, then the draws.
async function deal(ranks, press, o = {}) {
  const t = table(Object.assign({ bots: 0, sur: false, bank: 1000 }, o), null, s => s.replace('const G={', 'const G=window.__G={'));
  await t.start(); await t.toBet(); t.bet(100);
  const G = t.w.__G;
  ranks.forEach((r, k) => { const i = G.pos + k, j = G.shoe.findIndex((c, n) => n >= i && c.r === r); [G.shoe[i], G.shoe[j]] = [G.shoe[j], G.shoe[i]]; });
  const before = t.S().bank, todo = press.slice(), offered = [];
  let hidden = null, rcSeen = null;
  t.q('#deal').click();
  for (let i = 0; i < 6000; i++) {
    await t.sleep(1);
    if (t.ask().startsWith('This hand')) break;
    const ib = t.q('#a-I');
    if (ib && !ib.disabled) { const a = todo.shift(); t.q(a === 'I' ? '#a-I' : '#a-N').click(); continue; }
    const en = t.all('#act .act').filter(x => !x.disabled && x.dataset.a);
    if (en.length) { if (!hidden) { hidden = G.dealer.cards.map(c => c.up); rcSeen = G.rc; } offered.push(en.map(b => b.dataset.a).join('')); const a = todo.shift() || 'S'; (en.find(b => b.dataset.a === a) || en.find(b => b.dataset.a === 'S')).click(); }
  }
  const s = t.S();
  return { net: s.bank - before, hist: s.hlog[0], coach: t.q('#coach').textContent, dealer: G.dealer.cards.map(c => c.r).join(), rc: G.rc, hidden, rcSeen, pend: s.pend, offered, errors: t.errors };
}

(async () => {
  let r = await deal(['2', 'K', '9', 'A', 'Q'], ['H']);
  check('the second card is dealt at the start, face down', JSON.stringify(r.hidden) === '[true,false]' && r.dealer === 'K,A', [r.hidden, r.dealer]);
  check('a face-down card is not counted until it is turned', r.rcSeen === 0 && r.rc === r.rcSeen - 2, [r.rcSeen, r.rc]);
  check('under a ten there is no check: you play first', r.offered.length === 1, r.offered);
  check('hit on 11 vs 10 loses €100 and is the chart play', r.net === -100 && r.hist.x[0][1] === 'H' && r.hist.x[0][2] === 'H', [r.net, r.hist.x[0]]);
  r = await deal(['2', 'K', '9', 'A', 'Q'], ['D']);
  check('double on 11 vs 10 loses €200; the rule would have lost €100', r.net === -200 && r.hist.b === 200 && r.hist.c[1] === 'H' && r.hist.c[3] === -100, [r.net, r.hist.c]);
  check('the coach says the double money is lost too', /It takes every bet, your double and split money too/.test(r.coach), r.coach);
  r = await deal(['8', 'K', '8', 'A', 'Q', '8'], ['P', 'S', 'S']);
  check('split 8,8 vs 10: both bets are lost', r.net === -200 && r.hist.h.length === 2, [r.net, r.hist.h]);
  check('a pair is split only once: no split on the second 8,8', r.offered.length === 3 && !r.offered[1].includes('P') && !r.offered[2].includes('P'), r.offered);
  r = await deal(['8', '6', '8', 'K', '3', 'K', 'K', 'K'], ['P', 'D', 'S']);
  check('double after a split is offered', r.offered[1].includes('D'), r.offered);
  r = await deal(['A', '6', 'A', 'K', '5', '9', 'K'], ['P']);
  check('split aces get one card each', r.hist.h.every(h => h[0].split(' ').length === 2) && r.offered.length === 1, [r.hist.h, r.offered]);
  r = await deal(['9', 'A', '8', 'K'], ['I']);
  check('ace up: checked after insurance, the hand ends at once, insurance pays 2:1 (net 0)', r.net === 0 && r.dealer === 'A,K' && r.offered.length === 0, [r.net, r.dealer, r.offered]);
  check('the coach explains the check', /checked under the ace/.test(r.coach) && /insurance pays 2:1/.test(r.coach), r.coach);
  r = await deal(['9', 'A', '8', 'K'], ['N']);
  check('ace up, no insurance, blackjack: only the bet is lost, no move to make', r.net === -100 && r.offered.length === 0, [r.net, r.offered]);
  r = await deal(['9', 'A', '8', '9'], ['I', 'S']);
  check('ace up, no blackjack: you play on; insurance and 17 vs 20 lose €150', r.net === -150 && r.offered.length === 1, [r.net, r.offered]);
  r = await deal(['8', 'A', '8', '7', '3', 'K'], ['N', 'P', 'S', 'S']);
  check('8,8 vs an ace: split is the chart play again', r.hist.x[0][1] === 'P' && r.hist.x[0][2] === 'P', r.hist.x[0]);
  r = await deal(['A', 'A', 'A', '7', '3', 'K'], ['N', 'P']);
  check('A,A vs an ace: split is the chart play again', r.hist.x[0][2] === 'P', r.hist.x[0]);
  r = await deal(['A', 'K', 'Q', 'A'], []);
  check('your blackjack against a hidden blackjack: push', r.net === 0, r.net);
  r = await deal(['A', 'A', 'Q', 'K'], ['N']);
  check('your blackjack against a blackjack under an ace: push', r.net === 0, r.net);
  r = await deal(['A', 'K', 'Q', '9'], []);
  check('your blackjack pays 3:2 and the dealer draws nothing', r.net === 150 && r.dealer === 'K,9', [r.net, r.dealer]);
  r = await deal(['9', '6', '7', '5', 'K'], ['H']);
  check('you bust: the dealer turns the card and draws nothing', r.net === -100 && r.dealer === '6,5', [r.net, r.dealer]);
  r = await deal(['10', 'K', '6', 'A'], ['R'], { sur: true });
  check('surrender (if switched on) vs a ten loses everything to a hidden blackjack', r.net === -100, r.net);
  r = await deal(['10', 'A', '6', '7'], ['N', 'R'], { sur: true });
  check('surrender vs an ace after the check: half the bet', r.net === -50, r.net);
  // The saved open hand must not give the face-down card away.
  {
    const t = table({ bots: 0, sur: false, bank: 1000 }, null, s => s.replace('const G={', 'const G=window.__G={'));
    await t.start(); await t.toBet(); t.bet(100); t.q('#deal').click();
    for (let i = 0; i < 4000 && !(t.q('#a-S') && !t.q('#a-S').disabled) && !t.ask().startsWith('This hand') && !t.q('#a-N'); i++) await t.sleep(1);
    const p = t.S().pend; if (p) check('the saved open hand shows only the dealer\'s up card', p.d.split(' ').length === 1, p.d);
  }
  check('no script errors', r.errors.length === 0, r.errors);
  const m = table({ hr: 0, sur: true, s17: false }); await m.sleep(40);
  check('saved games move to the house rules once', m.q('#su-0').checked && m.q('#r-s17').checked);
  done();
})();
