// House rules played on the real table with a stacked shoe: no hole card, one split, insurance settled at the end.
const { check, done } = require('../_util');
const { table } = require('./_table');

// No other players. Dealing order: you, dealer, you, then the draws; the dealer's second card comes last.
async function deal(ranks, press, o = {}) {
  const t = table(Object.assign({ bots: 0, sur: false, bank: 1000 }, o), null, s => s.replace('const G={', 'const G=window.__G={'));
  await t.start(); await t.toBet(); t.bet(100);
  const G = t.w.__G;
  ranks.forEach((r, k) => { const i = G.pos + k, j = G.shoe.findIndex((c, n) => n >= i && c.r === r); [G.shoe[i], G.shoe[j]] = [G.shoe[j], G.shoe[i]]; });
  const before = t.S().bank, todo = press.slice(), offered = [];
  t.q('#deal').click();
  for (let i = 0; i < 6000; i++) {
    await t.sleep(1);
    if (t.ask().startsWith('This hand')) break;
    const ib = t.q('#a-I');
    if (ib && !ib.disabled) { const a = todo.shift(); t.q(a === 'I' ? '#a-I' : '#a-N').click(); continue; }
    const en = t.all('#act .act').filter(x => !x.disabled && x.dataset.a);
    if (en.length) { offered.push(en.map(b => b.dataset.a).join('')); const a = todo.shift() || 'S'; (en.find(b => b.dataset.a === a) || en.find(b => b.dataset.a === 'S')).click(); }
  }
  const s = t.S();
  return { net: s.bank - before, hist: s.hlog[0], coach: t.q('#coach').textContent, dealer: G.dealer.cards.map(c => c.r).join(), rc: G.rc, offered, errors: t.errors };
}

(async () => {
  let r = await deal(['2', 'K', '9', 'Q', 'A'], ['H']);
  check('one dealer card, the second after you: K then A', r.dealer === 'K,A', r.dealer);
  check('hit on 11 vs 10 loses €100 and is the chart play', r.net === -100 && r.hist.x[0][1] === 'H' && r.hist.x[0][2] === 'H', [r.net, r.hist.x[0]]);
  r = await deal(['2', 'K', '9', 'Q', 'A'], ['D']);
  check('double on 11 vs 10 loses €200; the rule would have lost €100', r.net === -200 && r.hist.b === 200 && r.hist.c[1] === 'H' && r.hist.c[3] === -100, [r.net, r.hist.c]);
  check('the coach says the double money is lost too', /It takes every bet, your double and split money too/.test(r.coach), r.coach);
  r = await deal(['8', 'K', '8', 'Q', '8', 'A'], ['P', 'S', 'S']);
  check('split 8,8: both bets are lost', r.net === -200 && r.hist.h.length === 2, [r.net, r.hist.h]);
  check('a pair is split only once: no split on the second 8,8', r.offered.length === 3 && !r.offered[1].includes('P') && !r.offered[2].includes('P'), r.offered);
  r = await deal(['8', '6', '8', '3', 'K', 'K', 'K', 'K'], ['P', 'D', 'S']);
  check('double after a split is offered', r.offered[1].includes('D'), r.offered);
  r = await deal(['A', '6', 'A', '5', '9', 'K', 'K'], ['P']);
  check('split aces get one card each', r.hist.h.every(h => h[0].split(' ').length === 2) && r.offered.length === 1, [r.hist.h, r.offered]);
  r = await deal(['9', 'A', '8', 'K'], ['I', 'S']);
  check('insurance: you play first, then it pays 2:1 (net 0)', r.net === 0 && r.dealer === 'A,K' && r.offered.length === 1, [r.net, r.dealer, r.offered]);
  r = await deal(['9', 'A', '8', '9'], ['I', 'S']);
  check('insurance lost and 17 vs 20 lost: −€150', r.net === -150, r.net);
  r = await deal(['9', 'A', '8', 'K'], ['N', 'S']);
  check('no insurance, dealer blackjack under an ace: −€100', r.net === -100, r.net);
  r = await deal(['A', 'K', 'Q', 'A'], []);
  check('your blackjack against a dealer blackjack: push', r.net === 0, r.net);
  r = await deal(['A', 'K', 'Q', '9'], []);
  check('your blackjack pays 3:2; the dealer takes one card under a ten', r.net === 150 && r.dealer === 'K,9', [r.net, r.dealer]);
  r = await deal(['A', '6', 'Q', '9'], []);
  check('your blackjack against a 6: paid at once, no dealer card', r.net === 150 && r.dealer === '6', [r.net, r.dealer]);
  r = await deal(['9', '6', '7', 'K', '5'], ['H']);
  check('you bust: the dealer draws nothing', r.net === -100 && r.dealer === '6', [r.net, r.dealer]);
  r = await deal(['10', 'K', '6', 'A'], ['R'], { sur: true });
  check('surrender (if switched on) still loses everything to a dealer blackjack', r.net === -100, r.net);
  check('no script errors', r.errors.length === 0, r.errors);
  const m = table({ hr: 0, sur: true, s17: false }); await m.sleep(40);
  check('saved games move to the house rules once', m.q('#su-0').checked && m.q('#r-s17').checked);
  done();
})();
