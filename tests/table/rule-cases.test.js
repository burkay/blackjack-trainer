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
done();
