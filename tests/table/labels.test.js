// Totals on the felt are plain numbers: A,A shows 12, a dealer A,6 shows 17. "Soft" stays in the explanations only.
const { check, done } = require('../_util');
const { table } = require('./_table');

async function first(ranks, o = {}) {
  const t = table(Object.assign({ bots: 0, sur: false, mode: 'train', bank: 1000 }, o), null, s => s.replace('const G={', 'const G=window.__G={'));
  await t.start(); await t.toBet(); t.bet(100);
  const G = t.w.__G;
  ranks.forEach((r, k) => { const i = G.pos + k, j = G.shoe.findIndex((c, n) => n >= i && c.r === r); [G.shoe[i], G.shoe[j]] = [G.shoe[j], G.shoe[i]]; });
  t.q('#deal').click();
  for (let i = 0; i < 4000; i++) { await t.sleep(1); if (t.q('#a-N') && !t.q('#a-N').disabled) t.q('#a-N').click(); if (t.q('#a-S') && !t.q('#a-S').disabled) break; }
  return t;
}
const badge = t => t.q('.seat.s1 .bw').textContent;

(async () => {
  let t = await first(['A', '6', 'A', '7']);
  check('A,A shows 12, not soft 12', badge(t) === '12', badge(t));
  check('the question still names it in words', /A,A \(pair\) vs dealer 6/.test(t.ask()), t.ask());
  t = await first(['A', '7', '7', 'A']);
  check('A,7 shows 18', badge(t) === '18', badge(t));
  t.q('#a-S').click();
  for (let i = 0; i < 4000 && !t.ask().startsWith('This hand'); i++) await t.sleep(1);
  check('a dealer A,7 shows 18, not soft 18', t.ask().startsWith('This hand') && t.q('#dealerTot').textContent === '18', [t.ask().slice(0, 20), t.q('#dealerTot').textContent]);
  t = await first(['9', 'A', '8', '6']);
  check('dealer ace up before the check shows A', t.q('#dealerTot').textContent === 'A', t.q('#dealerTot').textContent);
  check('no script errors', t.errors.length === 0, t.errors);
  done();
})();
