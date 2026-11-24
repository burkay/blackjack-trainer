// End of a hand: three choices on top (Continue with same bet, Change Bet, Change Shoe). Change Shoe shuffles and deals on with
// the same bet and side bets; the new-shoe offer after a bad run is a note under the same buttons.
const { check, done } = require('../_util');
const { table } = require('./_table');

async function over(offer, o = {}) {
  const t = table(Object.assign({ bots: 0, sur: false, sbo: true, offer: true, bank: 5000, mode: 'exam' }, o), null,
    s => s.replace('const G={', 'const G=window.__G={').replace('function renderAct(){', 'window.__ra=()=>renderAct();function renderAct(){'));
  await t.start(); await t.toBet();
  t.bet(100); t.q('[data-bt=pp]').click(); t.q('[data-chip="10"]').click(); t.q('[data-bt=t3]').click(); t.q('[data-chip="5"]').click();
  t.q('#deal').click(); await t.playOut(en => en.find(b => b.dataset.a === 'S') || en[0]);
  t.G = t.w.__G; if (offer) { t.G.offer = { why: 'You lost 5 hands in a row.' }; t.w.__ra(); }
  return t;
}
const dealt = async t => { const G = t.G, n0 = t.S().rounds; for (let i = 0; i < 4000 && !(G.phase === 'play' || G.phase === 'ins' || (G.phase === 'over' && t.S().rounds > n0)); i++) await t.sleep(1); return G.phase !== 'bet'; };
const names = t => t.all('#act .nxt .act b').map(b => b.textContent);

(async () => {
  let t = await over(false);
  check('three choices, in this order', JSON.stringify(names(t)) === JSON.stringify(['Continue with same bet', 'Change Bet', 'Change Shoe']), names(t));
  check('they come first in the panel', t.q('#act').firstElementChild.classList.contains('nxt'), t.q('#act').firstElementChild.className);
  check('the stake is shown', /€100 \+ €15, deal now/.test(t.q('#nxSame').textContent) && /fresh shoe, €100 \+ €15/.test(t.q('#newShoe').textContent), t.q('#nxSame').textContent);
  const p1 = t.G.pos; t.q('#nxSame').click();
  check('Continue: dealt at once from the same shoe with the same bets', await dealt(t) && t.G.pos > p1 && t.G.bet === 100 && t.G.sb.pp === 10 && t.G.sb.t3 === 5, [t.G.phase, t.G.bet, t.G.sb]);

  t = await over(false); let sh = t.G.shoe; t.q('#newShoe').click();
  check('Change Shoe: shuffled, then dealt with the same bets', await dealt(t) && t.G.shoe !== sh && t.G.bet === 100 && t.G.sb.pp === 10 && t.G.sb.t3 === 5, [t.G.phase, t.G.sb]);

  t = await over(false); t.q('#nextR').click();
  for (let i = 0; i < 2000 && !t.ask().startsWith('Place your bet'); i++) await t.sleep(1);
  check('Change Bet: the betting screen with the bets ready', t.ask().startsWith('Place your bet') && t.G.bet === 100 && t.G.sb.pp === 10, [t.ask().slice(0, 14), t.G.bet]);
  t.q('#newShoe').click(); for (let i = 0; i < 2000 && t.G.shuffling !== false; i++) await t.sleep(1); await t.sleep(30);
  check('New shoe from the betting screen only shuffles', t.G.phase === 'bet' && t.G.pos === 0, [t.G.phase, t.G.pos]);

  // After a bad run: the same three buttons, Change Shoe highlighted, the offer as a note under them.
  t = await over(true);
  check('offer: same three buttons, first in the panel', JSON.stringify(names(t)) === JSON.stringify(['Continue with same bet', 'Change Bet', 'Change Shoe']) && t.q('#act').firstElementChild.classList.contains('nxt'), names(t));
  check('offer: Change Shoe is highlighted and the note explains', t.q('#newShoe').classList.contains('hint') && /New shoe\? You lost 5 hands in a row/.test(t.q('p.offer').textContent));
  sh = t.G.shoe; t.q('#newShoe').click();
  check('offer, Change Shoe: shuffled and dealt with the same bets', await dealt(t) && t.G.shoe !== sh && t.G.bet === 100 && t.G.sb.t3 === 5, [t.G.phase, t.G.pos]);
  t = await over(true); const p4 = t.G.pos;
  t.w.document.dispatchEvent(new t.w.KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
  check('offer, Enter: continue with the same shoe and bets', await dealt(t) && t.G.pos > p4 && t.G.bet === 100, t.G.phase);
  t = await over(true); sh = t.G.shoe;
  t.w.document.dispatchEvent(new t.w.KeyboardEvent('keydown', { key: 'n', bubbles: true }));
  check('N: change the shoe and deal on', await dealt(t) && t.G.shoe !== sh, t.G.phase);
  check('no script errors', t.errors.length === 0, t.errors);
  done();
})();
