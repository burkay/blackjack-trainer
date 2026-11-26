// Expected cost of a move off the chart: the EV model against known values, and where the cost is shown.
const { read, check, done } = require('../_util');
const { table } = require('./_table');

const src = read('table');
const g = (a, b) => src.slice(src.indexOf(a), src.indexOf(b));
const { evPlays, evCost } = new Function('eur', "const UP=['2','3','4','5','6','7','8','9','10','A'];" + g('/*LOGIC*/', '/*END*/') + g('/*EV*/', '/*ENDEVT*/') + ';return {evPlays,evCost};')(n => '€' + n);
const C = r => ({ r, s: '♠' }), X = o => Object.assign({ canDouble: true, canSplit: true, canSur: false, s17: true, tc: 0, dev: false }, o);
const ev = (cards, up, o) => evPlays(cards.map(C), C(up), X(o));
const near = (a, b) => Math.abs(a - b) < .0015;

// Known infinite-deck values (dealer stands on soft 17, dealer checked for blackjack)
let e = ev(['10', '2'], '2'); check('12 vs 2: stand −0.293, hit −0.253', near(e.S, -.2928) && near(e.H, -.2534), e);
e = ev(['5', '6'], '6'); check('11 vs 6: double +0.667, hit +0.334', near(e.D, .6674) && near(e.H, .3337), e);
e = ev(['10', '6'], '10'); check('16 vs 10: stand −0.540, hit −0.540', near(e.S, -.5404) && near(e.H, -.5398), e);
e = ev(['A', '7'], '9'); check('soft 18 vs 9: stand −0.183, hit −0.101', near(e.S, -.1832) && near(e.H, -.1007), e);
e = ev(['9', '9'], '7'); check('9,9 vs 7: standing beats splitting', e.S > e.P, e);
// Under a ten that is not checked, a hidden blackjack takes the double too: 11 vs 10 then hits
e = ev(['5', '6'], '10', { np10: true }); check('11 vs 10, not checked: hit beats double', e.H > e.D && near(e.H, .0334), e);
e = ev(['8', '8'], '10', { np10: true, canSur: true }); check('8,8 vs 10, not checked: surrender beats split', e.R > e.P, e);
// costs in euros
check('standing on 12 vs 2 with €100: about €3.94', evCost(['10', '2'].map(C), C('2'), X(), 'H', 'S', 100) === 3.94);
check('a play the chart agrees with costs nothing', evCost(['10', '6'].map(C), C('10'), X(), 'H', 'H', 100) === 0);

(async () => {
  // Exam: stand on 12 vs 2 (chart: hit). The hand note, the history and Stats show the expected cost.
  const t = table({ mode: 'exam', bots: 0, sur: false, peek: 'ace', splits: 2, decks: 8, bank: 1000 }, null, s => s.replace('const G={', 'const G=window.__G={'));
  await t.start(); await t.toBet(); t.bet(100);
  const G = t.w.__G;
  ['10', '2', '2', '9', 'K'].forEach((r, k) => { const i = G.pos + k, j = G.shoe.findIndex((c, n) => n >= i && c.r === r); [G.shoe[i], G.shoe[j]] = [G.shoe[j], G.shoe[i]]; });
  t.q('#deal').click();
  await t.playOut(en => en.find(b => b.dataset.a === 'S'));
  const s = t.S(), h = s.hlog[0];
  check('history keeps the expected cost of the hand', h.e === 3.94 && h.x[0][4] === 3.94, [h.e, h.x[0]]);
  check('…the stats keep it next to the actual result', s.cf.ev === 3.94 && s.cf.evn === 1, s.cf);
  check('Stats compare actual and expected', /made no difference; by the odds it should have cost about €3.94/.test(t.q('#cfbox').textContent), t.q('#cfbox').textContent.slice(0, 160));
  t.q('#btnHist').click();
  check('the history page shows it', /expected −€3.94/.test(t.q('#hList').textContent));

  // Training: the stop message prices the move
  const u = table({ mode: 'train', bots: 0, sur: false, peek: 'ace', splits: 2, decks: 8, bank: 1000 }, null, s => s.replace('const G={', 'const G=window.__G={'));
  await u.start(); await u.toBet(); u.bet(100);
  const H = u.w.__G;
  ['10', '2', '2', '9', 'K'].forEach((r, k) => { const i = H.pos + k, j = H.shoe.findIndex((c, n) => n >= i && c.r === r); [H.shoe[i], H.shoe[j]] = [H.shoe[j], H.shoe[i]]; });
  u.q('#deal').click();
  for (let i = 0; i < 3000 && !(u.q('#a-S') && !u.q('#a-S').disabled); i++) await u.sleep(1);
  u.q('#a-S').click();
  check('the stop message says what Stand costs here', /Stand here costs about €3.94 on average/.test(u.q('#coach').textContent), u.q('#coach').textContent);
  u.all('#coach .cb')[1].click();
  for (let i = 0; i < 3000 && !u.ask().startsWith('This hand'); i++) await u.sleep(1);
  check('after "Stand anyway", the hand note shows the expected cost', /Expected cost of breaking the rule: about €3.94 on average \(3.9% of the bet\)/.test(u.q('#act').textContent), (u.q('#act .cfl') || { textContent: '' }).textContent.slice(0, 200));
  check('no script errors', t.errors.length + u.errors.length === 0, t.errors.concat(u.errors));
  done();
})();
