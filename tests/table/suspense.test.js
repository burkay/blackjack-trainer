// Suspense: a dealer card that can bust the dealer, while your hand is live, is dealt face down, the table dims, and it is
// turned slowly. Nothing changes in the money or the count.
const { check, done } = require('../_util');
const { table } = require('./_table');

async function play(ranks, press, o = {}) {
  const t = table(Object.assign({ bots: 0, sur: false, bank: 1000, peek: 'both', splits: 4, decks: 6 }, o), null,
    s => s.replace('const G={', 'const G=window.__G={').replace('const SND={', 'const SND=window.__SND={'));
  await t.start(); await t.toBet(); t.bet(100);
  const G = t.w.__G, snd = t.w.__SND, felt = t.q('#felt'), seen = { dim: 0, facedown: 0, peel: 0, total: null }, sounds = [];
  snd.play = n => sounds.push(n);
  new t.w.MutationObserver(() => { if (felt.classList.contains('suspense')) seen.dim++; if (t.q('.dealer .card.peel')) seen.peel++; }).observe(felt, { attributes: true, subtree: true, attributeFilter: ['class'] });
  ranks.forEach((r, k) => { const i = G.pos + k, j = G.shoe.findIndex((c, n) => n >= i && c.r === r); [G.shoe[i], G.shoe[j]] = [G.shoe[j], G.shoe[i]]; });
  const b0 = t.S().bank, todo = press.slice();
  t.q('#deal').click();
  for (let i = 0; i < 6000 && !t.ask().startsWith('This hand'); i++) {
    await t.sleep(1);
    if (G.dealer.cards.some((c, k) => k >= 2 && c.up === false)) { seen.facedown++; seen.total = t.q('#dealerTot').textContent; }
    const ins = t.q('#a-N'); if (ins && !ins.disabled) { ins.click(); continue; }
    const en = t.all('#act .act').filter(x => !x.disabled && x.dataset.a);
    if (en.length) { const a = todo.shift() || 'S'; (en.find(b => b.dataset.a === a) || en[0]).click(); }
  }
  return { net: t.S().bank - b0, seen, sounds, rc: G.rc, dim: felt.classList.contains('suspense'), dealer: G.dealer.cards.map(c => c.r).join(), errors: t.errors };
}

(async () => {
  // you 10,9 vs dealer 6 with 10 under it (16): the next card (K) busts the dealer
  let r = await play(['10', '6', '9', '10', 'K'], []);
  check('dealer on 16 with your 19 in play: the card comes face down, the table dims, the card turns slowly', r.seen.facedown > 0 && r.seen.dim > 0 && r.seen.peel > 0, r.seen);
  check('while it is face down the dealer shows 16, the cards already turned', r.seen.total === '16', r.seen.total);
  check('…with the tension sound, and the table is back to normal after', r.sounds.includes('tension') && !r.dim, r.sounds);
  check('…and the money is the same: dealer busts, +€100', r.net === 100 && r.dealer === '6,10,K', [r.net, r.dealer]);
  check('…and the count includes the turned card (10, 9, 6, 10, K: +1 −1 −1 −1 = −2)', r.rc === -2, r.rc);
  r = await play(['10', '6', '9', '10', 'K'], [], { drama: false });
  check('switched off: no suspense', r.seen.facedown === 0 && r.seen.dim === 0 && !r.sounds.includes('tension') && r.net === 100, r.seen);
  r = await play(['10', '5', '9', '8', 'K'], []);
  check('dealer 5,8 = 13: no suspense (only 14, 15, 16)', r.seen.dim === 0 && r.dealer === '5,8,K', [r.seen, r.dealer]);
  r = await play(['10', '6', '9', '5', '3', 'K'], []);
  check('dealer 6,5 = 11: the next card normally; on 14 with suspense, showing 14', r.seen.dim > 0 && r.seen.total === '14' && r.dealer === '6,5,3,K', [r.seen, r.dealer]);
  r = await play(['10', 'A', '9', '4', '10', 'K'], []);
  check('soft 15 (A,4) cannot bust: no suspense there; on hard 15 after the 10: suspense, showing 15', r.seen.total === '15' && r.dealer.startsWith('A,4,10'), [r.seen, r.dealer]);
  r = await play(['10', '6', '6', '10', 'K', '9'], ['H']);
  check('you bust: the dealer does not draw, no suspense', r.seen.dim === 0 && r.net === -100, [r.seen, r.net]);
  r = await play(['10', '7', '9', '10', 'K'], []);
  check('dealer on 17 stands: no suspense', r.seen.dim === 0 && r.dealer === '7,10', [r.seen, r.dealer]);
  check('no script errors', r.errors.length === 0, r.errors);
  done();
})();
