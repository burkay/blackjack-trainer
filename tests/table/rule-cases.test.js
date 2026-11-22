// Hand-built cases for the rule replay (real card order), taken from real hands Burkay played.
const { read, check, done } = require('../_util');

const src = read('table');
const grab = (a, b) => src.slice(src.indexOf(a), src.indexOf(b));
const code = "const UP=['2','3','4','5','6','7','8','9','10','A'];\n" + grab('/*LOGIC*/', '/*END*/') +
  '\nconst cpHand=h=>Object.assign({},h,{cards:h.cards.slice()});\n' + grab('function seatNet(', '/* Real card order') + grab('function cfRun(', 'function cfRecord(');
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
// 2,9 vs K (hole A). Under a ten the dealer does not check and a blackjack takes every bet: hit loses €500, double €1,000.
{
  const c = snap({ shoe: H('Q♦', '5♦', '7♠'), me: [{ cards: H('2♠', '9♦'), bet: 500 }], up: C('K♦'), dealer: H('K♦', 'A♠'), after: [[{ cards: H('5♣', '7♠'), bet: 10 }]] });
  check('11 vs 10, hidden blackjack: hit loses €500', cfRun(c, 'H').net === -500, cfRun(c, 'H').net);
  check('11 vs 10, hidden blackjack: double loses €1,000', cfRun(c, 'D').net === -1000, cfRun(c, 'D').net);
  const s = snap({ shoe: H('3♦', '9♠', 'K♠', 'K♥'), me: [{ cards: H('8♠', '8♦'), bet: 100 }], up: C('K♦'), dealer: H('K♦', 'A♠') });
  const split = cfRun(s, 'P');
  check('8,8 split, hidden blackjack: every bet is lost', split.net === -split.me.reduce((a, h) => a + h.bet, 0) && split.net <= -200, split.net);
  const n = snap({ shoe: H('3♦'), me: [{ cards: H('A♣', 'Q♣'), bet: 100, bj: true, done: true }], up: C('K♦'), dealer: H('K♦', 'A♠') });
  check('your own blackjack pushes', cfRun(n, 'S').net === 0, cfRun(n, 'S').net);
  const z = snap({ shoe: H('K♥', '9♥'), me: [{ cards: H('9♠', '7♦'), bet: 100 }], up: C('6♦'), dealer: H('6♦', '5♠') });
  check('everybody bust: the dealer takes no more cards', cfRun(z, 'H').d.length === 2 && cfRun(z, 'H').net === -100, cfRun(z, 'H').d.length);
}
// The chart under that rule: exactly two plays change, both against a ten.
{
  const { decide } = new Function(code.slice(0, code.indexOf('\nconst cpHand')) + ';return {decide};')();
  const V = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10'], UPS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'A'], diff = new Set();
  for (const s17 of [true, false]) for (const a of V) for (const b of V) for (const u of UPS) for (const canSur of [true, false]) {
    const x = { canDouble: true, canSplit: a === b, canSur, das: true, s17, tc: 0, dev: false };
    const hand = [a, b].map(r => ({ r, s: '♠' })), up = { r: u, s: '♠' };
    const old = decide(hand, up, x).act, now = decide(hand, up, Object.assign({}, x, { enhc: true })).act;
    if (old !== now) diff.add(`${a === b ? `${a},${b}` : 'hard ' + (+a + +b)} vs ${u}${canSur ? ' sur' : ''}: ${old}→${now}`);
  }
  const want = ['8,8 vs 10 sur: P→R', '8,8 vs 10: P→H', 'hard 11 vs 10 sur: D→H', 'hard 11 vs 10: D→H'].sort();
  check('only 11 and 8,8 against a ten change', JSON.stringify([...diff].sort()) === JSON.stringify(want), [...diff].sort());
  const at = (cards, u, tc, enhc = true) => decide(cards.map(r => ({ r, s: '♠' })), { r: u, s: '♠' }, { canDouble: true, canSplit: false, canSur: false, das: true, s17: true, tc, dev: true, enhc }).act;
  check('with deviations: 11 vs 10 doubles from +3, 10 vs 10 never', at(['5', '6'], '10', 2) === 'H' && at(['5', '6'], '10', 3) === 'D' && [4, 9].every(tc => at(['4', '6'], '10', tc) === 'H'));
  check('against an ace the deviations are the usual ones', [-3, 0, 1, 4, 6].every(tc => at(['5', '6'], 'A', tc) === at(['5', '6'], 'A', tc, false) && at(['4', '6'], 'A', tc) === at(['4', '6'], 'A', tc, false)) && at(['5', '6'], 'A', 1) === 'D');
}
done();
