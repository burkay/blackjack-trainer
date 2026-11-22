// Hand-built cases for the rule replay (real card order), taken from real hands Burkay played.
// The first cases were dealt with a hole card; the replay still accepts a dealer hand that already has two cards.
const { read, check, done } = require('../_util');

const src = read('table');
const grab = (a, b) => src.slice(src.indexOf(a), src.indexOf(b));
const code = "const UP=['2','3','4','5','6','7','8','9','10','A'];\n" + grab('/*LOGIC*/', '/*END*/') +
  '\nconst cpHand=h=>Object.assign({},h,{cards:h.cards.slice()});\n' + grab('function dealerNeeds(', '/* Real card order') + grab('function cfRun(', 'function cfRecord(');
const S = { sur: true, s17: true, dev: false };
const { cfRun } = new Function('S', code + ';return {cfRun};')(S);
const C = x => ({ r: x.slice(0, -1), s: x.slice(-1) }), H = (...a) => a.map(C);
const snap = o => Object.assign({ hi: 0, pos: 0, rc: 0, bank: 1000, orig: 100, ins: 0, before: [], after: [] }, o);

// 3,8 vs Q (hole 4), rule Double, played Hit. Player after you holds 9,K. Shoe continues 2 A 5 A 8.
{
  const c = snap({ shoe: H('2♠', 'A♠', '5♠', 'A♥', '8♦', '7♣'), me: [{ cards: H('3♦', '8♠'), bet: 100 }], up: C('Q♦'), dealer: H('Q♦', '4♥'),
    before: [[{ cards: H('5♦', '5♠', '10♦'), bet: 40, done: true }]], after: [[{ cards: H('9♦', 'K♥'), bet: 10 }]] });
  const rule = cfRun(c, 'D'), mine = cfRun(c, 'H');
  check('11 vs 10: double gets one card (13); the A and 5 go to the dealer (20)', rule.net === -200 && rule.d.map(k => k.r).join() === 'Q,4,A,5', rule.net);
  check('11 vs 10: your hit line (19) beats the dealer bust', mine.net === 100, mine.net);
}
// A,9 vs 4 (hole 7), rule Stand, played Double. Nobody after you. Shoe continues 10 7.
{
  const c = snap({ shoe: H('10♣', '7♠', '7♥'), me: [{ cards: H('A♠', '9♥'), bet: 100 }], up: C('4♦'), dealer: H('4♦', '7♣') });
  check('A,9 vs 4: standing sends the 10 to the dealer (21)', cfRun(c, 'S').net === -100);
  check('A,9 vs 4: your double makes 20 against 18', cfRun(c, 'D').net === 200);
}
// 4,10,2 (16) vs K (hole 3), rule Hit, played Stand. Next card 6 busts you by the rule.
{
  const c = snap({ shoe: H('6♣', 'J♥', '9♠'), me: [{ cards: H('4♥', '10♣', '2♦'), bet: 100 }], up: C('K♣'), dealer: H('K♣', '3♠'), after: [[{ cards: H('3♦', '9♥'), bet: 10 }]] });
  check('16 vs 10: hitting takes the 6 and busts', cfRun(c, 'H').net === -100);
}
// 9,A (soft 20) vs 4 (hole 4), rule Stand, played Double and drew an A (21). Player 1 (7,5) already stood; Player 2 (3,8) plays after you.
// Shoe continues A 3 5 K. By the rule the A goes to Player 2's double, the dealer draws 3 5 K and busts.
{
  const c = snap({ shoe: H('A♦', '3♣', '5♥', 'K♣', '9♠'), me: [{ cards: H('9♦', 'A♦'), bet: 100 }], up: C('4♥'), dealer: H('4♥', '4♦'),
    before: [[{ cards: H('7♣', '5♣'), bet: 20, done: true }]], after: [[{ cards: H('3♦', '8♣'), bet: 10 }]] });
  const rule = cfRun(c, 'S'), mine = cfRun(c, 'D');
  check('soft 20 vs 4: standing wins €100 (dealer 4,4,3,5,K busts)', rule.net === 100 && rule.d.map(k => k.r).join() === '4,4,3,5,K', [rule.net, rule.d.map(k => k.r).join()]);
  check('soft 20 vs 4: your double wins €200 (bet €200, win €400)', mine.net === 200 && mine.me[0].bet === 200, mine.net);
  check('soft 20 vs 4: breaking the rule = €100 more profit', mine.net - rule.net === 100);
}
// No hole card: the dealer's second card is the next one in the shoe after everybody has played.
// 2,9 vs K, then Q, 5 and A. Hit: you take the Q (21), the next player the 5 (17), the dealer the A: blackjack, €500 lost.
{
  const c = snap({ shoe: H('Q♦', '5♦', 'A♠', '7♠'), me: [{ cards: H('2♠', '9♦'), bet: 500 }], up: C('K♦'), dealer: H('K♦'), after: [[{ cards: H('5♣', '7♠'), bet: 10 }]] });
  const hit = cfRun(c, 'H'), dbl = cfRun(c, 'D');
  check('no hole card: the dealer draws after the players', hit.d.map(k => k.r).join() === 'K,A', hit.d.map(k => k.r).join());
  check('11 vs 10, dealer blackjack: hit loses €500', hit.net === -500, hit.net);
  check('11 vs 10, dealer blackjack: double loses €1,000', dbl.net === -1000, dbl.net);
  const s = snap({ shoe: H('3♦', '9♠', 'K♠', 'A♥', 'A♦'), me: [{ cards: H('8♠', '8♦'), bet: 100 }], up: C('K♦'), dealer: H('K♦') });
  const split = cfRun(s, 'P');
  check('8,8 split, dealer blackjack: every bet is lost', !split || split.d.length !== 2 || split.net === -split.me.reduce((a, h) => a + h.bet, 0), split && [split.net, split.d.map(k => k.r).join()]);
  const a = snap({ shoe: H('K♠'), me: [{ cards: H('9♠', '8♦'), bet: 100 }], up: C('A♦'), dealer: H('A♦'), ins: 50 });
  check('insurance pays 2:1 with the second card', cfRun(a, 'S').net === 0, cfRun(a, 'S').net);
  const b = snap({ shoe: H('9♠'), me: [{ cards: H('A♠', 'K♦'), bet: 100, bj: true, done: true }], up: C('A♦'), dealer: H('A♦'), ins: 50 });
  check('your blackjack against an ace: one dealer card, 3:2 minus the insurance', (x => x.net === 100 && x.d.length === 2)(cfRun(b, 'S')), cfRun(b, 'S').net);
  const z = snap({ shoe: H('K♥', '9♥'), me: [{ cards: H('9♠', '7♦'), bet: 100 }], up: C('6♦'), dealer: H('6♦') });
  check('everybody bust: the dealer draws nothing', cfRun(z, 'H').d.length === 1 && cfRun(z, 'H').net === -100, cfRun(z, 'H').d.length);
}
// The chart without a hole card: these plays change and nothing else.
{
  const { decide } = new Function(code.slice(0, code.indexOf('\nconst cpHand')) + ';return {decide};')();
  const V = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10'], UPS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'A'], diff = new Set();
  for (const s17 of [true, false]) for (const a of V) for (const b of V) for (const u of UPS) for (const canSur of [true, false]) {
    const x = { canDouble: true, canSplit: a === b, canSur, das: true, s17, tc: 0, dev: false };
    const hand = [a, b].map(r => ({ r, s: '♠' })), up = { r: u, s: '♠' };
    const old = decide(hand, up, x).act, now = decide(hand, up, Object.assign({}, x, { enhc: true })).act;
    if (old !== now) diff.add(`${a === b ? `${a},${b}` : 'hard ' + (+a + +b)} vs ${u}${canSur ? ' sur' : ''}${s17 ? '' : ' H17'}: ${old}→${now}`);
  }
  const want = [];
  for (const h of ['', ' H17']) {
    for (const s of ['', ' sur']) { want.push(`hard 11 vs 10${s}${h}: D→H`, `A,A vs A${s}${h}: P→H`); if (h) want.push(`hard 11 vs A${s}${h}: D→H`); for (const u of ['10', 'A']) want.push(`8,8 vs ${u}${s}${h}: P→${s ? 'R' : 'H'}`); }
  }
  check('only 11, 8,8 and A,A change, against a ten or an ace', JSON.stringify([...diff].sort()) === JSON.stringify(want.sort()), [...diff].sort());
  const at = (cards, u, tc) => decide(cards.map(r => ({ r, s: '♠' })), { r: u, s: '♠' }, { canDouble: true, canSplit: false, canSur: false, das: true, s17: true, tc, dev: true, enhc: true }).act;
  check('with deviations: 11 vs 10 doubles from +3; 10 vs 10, 10 vs A and 11 vs A never', at(['5', '6'], '10', 2) === 'H' && at(['5', '6'], '10', 3) === 'D' && [4, 9].every(tc => at(['4', '6'], '10', tc) === 'H' && at(['4', '6'], 'A', tc) === 'H' && at(['5', '6'], 'A', tc) === 'H'));
}
done();
