// Rule presets: Online live (no hole card), US casino (dealer checks under ace and ten), and Custom (anything else).
// Each is played on the real table with a stacked shoe.
const { check, done } = require('../_util');
const { load } = require('../_util');
const { table } = require('./_table');

const US = { decks: 6, s17: true, sur: true, peek: 'both', splits: 4 }, LIVE = { decks: 8, s17: true, sur: false, peek: 'none', splits: 2 };
// Dealing order with no other players: you, dealer, you, (dealer's face-down card), then the draws.
async function deal(rules, ranks, press = [], o = {}) {
  const t = table(Object.assign({ bots: 0, bank: 1000 }, rules, o), null, s => s.replace('const G={', 'const G=window.__G={'));
  await t.start(); await t.toBet(); t.bet(100);
  const G = t.w.__G;
  ranks.forEach((r, k) => { const i = G.pos + k, j = G.shoe.findIndex((c, n) => n >= i && c.r === r); [G.shoe[i], G.shoe[j]] = [G.shoe[j], G.shoe[i]]; });
  const b0 = t.S().bank, todo = press.slice(), offered = [];
  t.q('#deal').click();
  for (let i = 0; i < 6000; i++) {
    await t.sleep(1);
    if (t.ask().startsWith('This hand')) break;
    const ib = t.q('#a-I');
    if (ib && !ib.disabled) { t.q(todo.shift() === 'I' ? '#a-I' : '#a-N').click(); continue; }
    const en = t.all('#act .act').filter(x => !x.disabled && x.dataset.a);
    if (en.length) { offered.push(en.map(b => b.dataset.a).join('')); const a = todo.shift() || 'S'; (en.find(b => b.dataset.a === a) || en.find(b => b.dataset.a === 'S')).click(); }
  }
  return { net: t.S().bank - b0, offered, dealer: G.dealer.cards.map(c => c.r).join(), hist: t.S().hlog[0], coach: t.q('#coach').textContent, errors: t.errors, t };
}

(async () => {
  // Which preset a table is on.
  {
    const fresh = load('table'); await fresh.sleep(40);
    const s = fresh.state('bj-masa-v1') || {};
    check('a new table starts on US casino', fresh.q('#pr-us').checked && /checks it for blackjack/.test(fresh.q('#rulesTxt').textContent), fresh.q('#rulesTxt').textContent.slice(0, 60));
    check('…with the standard chart', /standard chart/.test(fresh.q('#chartNote').textContent));
    const old = load('table', { 'bj-masa-v1': { hr: 1, sur: false, s17: true, decks: 8, bank: 900 } }); await old.sleep(40);
    check('a table saved before the presets keeps its rules: Custom', old.q('#pr-custom').checked && old.q('#pk-ace').checked && old.q('#sp-2').checked && old.q('#d-8').checked);
    const live = old.q('#pr-live'); live.checked = true; live.dispatchEvent(new old.w.Event('change', { bubbles: true }));
    const st = old.state('bj-masa-v1');
    check('choosing Online live sets all its rules', st.peek === 'none' && st.splits === 2 && st.decks === 8 && st.sur === false && st.s17 === true && old.q('#pr-live').checked);
    check('the menu explains the rules and the chart', /no hole card/.test(old.q('#rulesTxt').textContent) && /against an ace: hit 11 and 10, do not split 8,8 or A,A/.test(old.q('#chartNote').textContent));
    const sp = old.q('#sp-4'); sp.checked = true; sp.dispatchEvent(new old.w.Event('change', { bubbles: true }));
    check('changing one rule makes it Custom', old.q('#pr-custom').checked && old.state('bj-masa-v1').splits === 4);
    const us = old.q('#pr-us'); us.checked = true; us.dispatchEvent(new old.w.Event('change', { bubbles: true }));
    check('US casino from the menu', old.q('#pr-us').checked && old.state('bj-masa-v1').decks === 6 && old.state('bj-masa-v1').peek === 'both');
    check('no script errors (menu)', fresh.errors.length + old.errors.length === 0, fresh.errors.concat(old.errors));
  }

  // US casino: the dealer checks under a ten too, so a blackjack there only takes the bet and ends the hand.
  let r = await deal(US, ['9', 'K', '8', 'A']);
  check('US: blackjack under a ten is checked at once, no move, −€100', r.net === -100 && r.offered.length === 0 && /checked under the ten/.test(r.coach), [r.net, r.offered, r.coach.slice(0, 60)]);
  {
    const t = table(Object.assign({ bots: 0, bank: 1000 }, US), null, s => s.replace('const G={', 'const G=window.__G={'));
    await t.start(); await t.toBet(); t.bet(100);
    const G = t.w.__G, seen = [];
    ['9', 'K', '8', '7'].forEach((r, k) => { const i = G.pos + k, j = G.shoe.findIndex((c, n) => n >= i && c.r === r); [G.shoe[i], G.shoe[j]] = [G.shoe[j], G.shoe[i]]; });
    new t.w.MutationObserver(() => { const x = t.q('#cban').textContent; if (x) seen.push(x); }).observe(t.q('#cban'), { childList: true, characterData: true, subtree: true });
    t.q('#deal').click();
    for (let i = 0; i < 3000 && !(t.q('#a-S') && !t.q('#a-S').disabled); i++) await t.sleep(1);
    check('US: the check under a ten is silent when there is no blackjack', !seen.some(x => /NO BLACKJACK/.test(x)), seen);
    const u = table(Object.assign({ bots: 0, bank: 1000 }, US), null, s => s.replace('const G={', 'const G=window.__G={'));
    await u.start(); await u.toBet(); u.bet(100);
    const H = u.w.__G, saw = [];
    ['9', 'A', '8', '7'].forEach((r, k) => { const i = H.pos + k, j = H.shoe.findIndex((c, n) => n >= i && c.r === r); [H.shoe[i], H.shoe[j]] = [H.shoe[j], H.shoe[i]]; });
    new u.w.MutationObserver(() => { const x = u.q('#cban').textContent; if (x) saw.push(x); }).observe(u.q('#cban'), { childList: true, characterData: true, subtree: true });
    u.q('#deal').click();
    for (let i = 0; i < 3000 && !(u.q('#a-S') && !u.q('#a-S').disabled); i++) { await u.sleep(1); const n = u.q('#a-N'); if (n && !n.disabled) n.click(); }
    check('US: after insurance under an ace, NO BLACKJACK is shown', saw.some(x => /NO BLACKJACK/.test(x)), saw);
  }
  r = await deal(US, ['2', 'K', '9', '7', 'Q'], ['D']);
  check('US: 11 vs 10 doubles (the standard chart)', r.hist.x[0][2] === 'D' && r.net === 200, [r.hist.x[0], r.net]);
  r = await deal(US, ['8', '6', '8', 'K', '8', '8', 'K', 'K', 'K', 'K'], ['P', 'P', 'P', 'S', 'S', 'S', 'S']);
  check('US: split up to 4 hands', r.hist.h.length === 4 && r.offered[1].includes('P') && r.offered[2].includes('P') && !r.offered[3].includes('P'), [r.hist.h.length, r.offered]);
  r = await deal(US, ['10', 'K', '6', '9'], ['R']);
  check('US: surrender after the check costs half', r.net === -50, r.net);
  r = await deal(US, ['9', 'A', '8', 'K'], ['I']);
  check('US: ace up, insurance, then the check', r.net === 0 && r.offered.length === 0, [r.net, r.offered]);

  // Online live: no hole card at all.
  r = await deal(LIVE, ['2', 'K', '9', 'Q', 'A'], ['H']);
  check('Live: one dealer card until the players are done', r.dealer === 'K,A' && r.offered.length === 1 && r.net === -100, [r.dealer, r.offered, r.net]);
  r = await deal(LIVE, ['2', 'K', '9', 'Q', 'A'], ['D']);
  check('Live: a dealer blackjack takes the double too', r.net === -200 && r.hist.x[0][2] === 'H' && /no hole card/.test(r.coach), [r.net, r.hist.x[0]]);
  r = await deal(LIVE, ['8', 'A', '8', '3', 'K'], ['N', 'S']);
  check('Live: 8,8 vs an ace is not split (the chart says hit), and there is no check under the ace', r.hist.x[0][2] === 'H' && r.offered.length === 1 && r.dealer.split(',').length >= 2, [r.hist.x[0], r.dealer]);
  r = await deal(LIVE, ['9', 'A', '8', 'K'], ['I', 'S']);
  check('Live: insurance is settled with the second card, after you play', r.net === 0 && r.offered.length === 1 && r.dealer === 'A,K', [r.net, r.offered, r.dealer]);
  r = await deal(LIVE, ['9', '6', '7', 'K'], ['H']);
  check('Live: everybody bust, the dealer takes no second card', r.dealer === '6', r.dealer);
  check('no script errors', r.errors.length === 0, r.errors);
  done();
})();
