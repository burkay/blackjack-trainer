// Your blackjack is celebrated only when it is paid: no banner or tone while the dealer may still have one.
const { check, done } = require('../_util');
const { table } = require('./_table');

async function play(ranks, o = {}) {
  const t = table(Object.assign({ bots: 0, sur: false, bank: 1000 }, o), null, s => s.replace('const G={', 'const G=window.__G={').replace('const SND={', 'const SND=window.__SND={'));
  await t.start(); await t.toBet(); t.bet(100);
  const G = t.w.__G, snd = t.w.__SND, log = [];
  snd.play = n => log.push([n, G.dealer.cards.length > 1 && G.dealer.cards[1].up, G.phase]);
  const banners = [];
  const bn = t.q('.seat.s1 .banner'); new t.w.MutationObserver(() => { if (bn.textContent) banners.push([bn.textContent, G.dealer.cards[1] && G.dealer.cards[1].up]); }).observe(bn, { childList: true, characterData: true, subtree: true });
  ranks.forEach((r, k) => { const i = G.pos + k, j = G.shoe.findIndex((c, n) => n >= i && c.r === r); [G.shoe[i], G.shoe[j]] = [G.shoe[j], G.shoe[i]]; });
  const b0 = t.S().bank;
  t.q('#deal').click();
  for (let i = 0; i < 4000 && !t.ask().startsWith('This hand'); i++) { await t.sleep(1); const n = t.q('#a-N'); if (n && !n.disabled) n.click(); }
  await t.sleep(30);
  return { net: t.S().bank - b0, tones: log.filter(x => x[0] === 'bj'), sounds: log.map(x => x[0]), banners, errors: t.errors };
}

(async () => {
  let r = await play(['A', 'K', 'Q', '9']);
  check('blackjack vs a ten: one tone, only after the dealer card is turned', r.net === 150 && r.tones.length === 1 && r.tones[0][1] === true, r.tones);
  check('no early BLACKJACK! banner, one banner when paid', r.banners.length === 1 && /BLACKJACK \+€150/.test(r.banners[0][0]) && r.banners[0][1] === true, r.banners);
  r = await play(['A', 'K', 'Q', 'A']);
  check('blackjack vs a hidden blackjack: no tone at all, a push', r.net === 0 && r.tones.length === 0 && r.sounds.includes('push'), r.sounds);
  check('…and no blackjack banner', !r.banners.some(b => /BLACKJACK/.test(b[0]) && !/DEALER/.test(b[0])), r.banners);
  r = await play(['A', '6', 'K', '9']);
  check('blackjack vs a 6: one tone at the end', r.net === 150 && r.tones.length === 1, r.tones);
  r = await play(['A', 'A', 'K', '9']);
  check('blackjack vs an ace (no insurance): tone only after the check', r.net === 150 && r.tones.length === 1 && r.tones[0][1] === true, r.tones);
  r = await play(['A', 'A', 'K', 'Q']);
  check('blackjack vs a dealer blackjack under an ace: no tone', r.net === 0 && r.tones.length === 0, r.sounds);
  check('no script errors', r.errors.length === 0, r.errors);
  done();
})();
