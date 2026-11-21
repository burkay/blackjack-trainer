// The Table Simulator and Fast Blackjack must give the same basic-strategy play (S17, DAS, no surrender)
// for every two- and three-card hand against every dealer up card.
const { read, check, done } = require('./_util');

const t = read('table'), f = read('fast');
const tableLogic = "const UP=['2','3','4','5','6','7','8','9','10','A'];\n" + t.slice(t.indexOf('/*LOGIC*/'), t.indexOf('/*END*/'));
const fastLogic = f.slice(f.indexOf('/* ---------- strategy'), f.indexOf('/*END-LOGIC*/'));
const T = new Function(tableLogic + ';return {decide};')();
const F = new Function(fastLogic + ';return {decide};')();
const UPS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'A'], vals = ['A', 2, 3, 4, 5, 6, 7, 8, 9, 10];
const card = v => ({ r: v === 'A' ? 'A' : String(v), s: '♠' });
let n = 0, bad = 0;
const diffs = [];
const cmp = (cards, up, x) => { n++; const a = T.decide(cards, up, x).act, b = F.decide(cards, up, x).act; if (a !== b) { bad++; if (diffs.length < 5) diffs.push(`${cards.map(c => c.r)} vs ${up.r}: table ${a}, fast ${b}`); } };
for (const a of vals) for (const b of vals) for (let ui = 0; ui < 10; ui++) for (const cd of [true, false])
  cmp([card(a), card(b)], card(UPS[ui]), { canDouble: cd, canSplit: a === b, canSur: false, das: true, s17: true, tc: 0, dev: false });
for (const a of vals) for (const b of vals) for (const c of vals) for (let ui = 0; ui < 10; ui++)
  cmp([card(a), card(b), card(c)], card(UPS[ui]), { canDouble: false, canSplit: false, canSur: false, das: true, s17: true, tc: 0, dev: false });
check('both games agree on every hand', bad === 0, { compared: n, mismatches: bad, diffs });
done();
