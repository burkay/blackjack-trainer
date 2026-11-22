// Drag and drop betting: chips onto the main spot, Perfect Pairs and 21+3 (or their boxes), off again, from spot to spot.
// jsdom has no layout, so every element that matters gets a fixed rectangle.
const { check, done } = require('../_util');
const { table } = require('./_table');

const R = (x, y, w, h) => ({ left: x, top: y, right: x + w, bottom: y + h, width: w, height: h, x, y });
async function open(o = {}) {
  const t = table(Object.assign({ sbo: true, bots: 0, sur: false, bank: 1000 }, o), null, s => s.replace('const G={', 'const G=window.__G={'));
  await t.start(); await t.toBet();
  const G = t.w.__G;
  const at = () => { // rectangles as on a phone: spots on the felt, boxes and chips in the panel below
    const set = (sel, r) => { const e = t.q(sel); if (e) e.getBoundingClientRect = () => r; };
    set('.seat.me .spot', R(190, 400, 60, 60)); set('.sbs.pp', R(148, 412, 38, 38)); set('.sbs.t3', R(254, 412, 38, 38));
    set('[data-bt=m]', R(20, 600, 100, 44)); set('[data-bt=pp]', R(125, 600, 100, 44)); set('[data-bt=t3]', R(230, 600, 100, 44));
    [5, 10, 25, 100, 500].forEach((v, i) => set(`[data-chip="${v}"]`, R(20 + i * 48, 655, 42, 42)));
  };
  const ev = (type, el, x, y) => { const e = new t.w.MouseEvent(type, { bubbles: true, cancelable: true, clientX: x, clientY: y, button: 0 }); el.dispatchEvent(e); };
  t.mid = el => { const r = el.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; };
  t.drag = (from, to, cancel) => {
    at();
    const el = typeof from === 'string' ? t.q(from) : from, [x, y] = t.mid(el), [a, b] = Array.isArray(to) ? to : t.mid(t.q(to));
    ev('pointerdown', el, x, y); ev('pointermove', t.w.document.body, (x + a) / 2, (y + b) / 2); ev('pointermove', t.w.document.body, a, b);
    t.marked = t.all('.drop').map(e => e.dataset.sb || e.dataset.bt || 'spot'); t.ghosts = t.all('.dragc').length;
    ev(cancel ? 'pointercancel' : 'pointerup', t.w.document.body, a, b); at();
  };
  t.tap = sel => { at(); const el = t.q(sel), [x, y] = t.mid(el); ev('pointerdown', el, x, y); ev('pointerup', el, x, y); el.click(); at(); };
  t.bets = () => [G.bet, G.sb.pp, G.sb.t3].join();
  t.clear = () => { t.q('#clr').click(); at(); };
  t.G = G; at();
  return t;
}

(async () => {
  let t = await open(); t.clear();
  t.drag('[data-chip="100"]', '.seat.me .spot');
  check('chip onto your spot: main bet', t.bets() === '100,0,0', t.bets());
  check('the target lights up and the chip follows the finger', t.marked.includes('spot') && t.ghosts === 1, [t.marked, t.ghosts]);
  t.drag('[data-chip="10"]', '.sbs.pp');
  check('chip onto PP: Perfect Pairs', t.bets() === '100,10,0', t.bets());
  t.drag('[data-chip="25"]', '.sbs.t3');
  check('chip onto 21+3', t.bets() === '100,10,25', t.bets());
  t.drag('[data-chip="5"]', '[data-bt=pp]');
  check('chip onto the box in the panel works too', t.bets() === '100,15,25', t.bets());
  t.drag('[data-chip="5"]', [140, 400]);
  check('a near miss goes to the nearest spot', t.bets() === '100,20,25', t.bets());
  t.drag('[data-chip="5"]', [60, 120]);
  check('dropped somewhere else: nothing happens', t.bets() === '100,20,25', t.bets());
  t.drag('[data-chip="5"]', '.sbs.pp', true);
  check('an interrupted drag changes nothing', t.bets() === '100,20,25' && t.all('.dragc').length === 0 && !t.w.document.body.classList.contains('dragging'), t.bets());
  t.drag('.sbs.pp', '.sbs.t3');
  check('from spot to spot: the chips move', t.bets() === '100,0,45', t.bets());
  t.drag('.sbs.t3', [60, 120]);
  check('off the table: the side bet is taken back', t.bets() === '100,0,0', t.bets());
  t.drag('.seat.me .spot', '.sbs.pp');
  check('main bet onto a side bet, up to its limit', t.bets() === '0,100,0', t.bets());
  t.drag('.sbs.pp', '.seat.me .spot');
  check('and back', t.bets() === '100,0,0', t.bets());
  t.tap('[data-chip="25"]');
  check('a tap places nothing and says what to do', t.bets() === '100,0,0' && /Drag the chip onto a spot/.test(t.q('#coach').textContent), [t.bets(), t.q('#coach').textContent.slice(0, 40)]);
  t.q('[data-bt=pp]').click(); t.q('[data-chip="5"]').click();
  check('the keyboard still works (click without a pointer)', t.bets() === '100,5,0', t.bets());
  t.clear();
  check('Clear takes everything off', t.bets() === '0,0,0', t.bets());

  // Limits and refusals always say why.
  t.drag('[data-chip="500"]', '.seat.me .spot'); t.drag('[data-chip="100"]', '.seat.me .spot');
  check('table maximum', t.bets() === '500,0,0' && /Limit: €500/.test(t.q('#coach').textContent), t.bets());
  t.drag('[data-chip="500"]', '.sbs.t3'); t.drag('[data-chip="5"]', '.sbs.t3');
  check('side bet maximum', t.bets() === '500,0,100' && /Limit: €100/.test(t.q('#coach').textContent), t.bets());
  check('no script errors', t.errors.length === 0, t.errors);
  t = await open({ bank: 500 }); t.clear(); t.drag('[data-chip="500"]', '.seat.me .spot'); t.drag('[data-chip="10"]', '.sbs.pp');
  check('whole bankroll on the hand: the side bet is refused with the reason', t.bets() === '500,0,0' && /No money left for this bet/.test(t.q('#coach').textContent) && /€500/.test(t.q('#coach').textContent), t.q('#coach').textContent);
  t.drag('.seat.me .spot', '.sbs.pp');
  check('moving part of it works', t.bets() === '400,100,0', t.bets());

  // A dragged bet is really played.
  t = await open(); t.clear(); t.drag('[data-chip="25"]', '.seat.me .spot'); t.drag('[data-chip="5"]', '.sbs.pp'); t.drag('[data-chip="5"]', '.sbs.t3');
  t.q('#deal').click();
  await t.playOut(en => en.find(b => b.dataset.a === 'S') || en[0]);
  const h = t.S().hlog[0], side = h.s.reduce((a, x) => a + x[2] - x[1], 0);
  check('dragged bets are played and settled', h.s.length === 2 && h.s.every(x => x[1] === 5) && Math.abs(t.S().bank - 1000 - h.y - side) < 1e-9, [h.b, h.s]);
  t.drag('.seat.me .spot', [60, 120]);
  check('outside the betting phase nothing can be dragged', t.all('.dragc').length === 0 && t.G.phase === 'over', t.G.phase);
  t = await open({ sbo: false }); t.clear(); t.drag('[data-chip="10"]', '.seat.me .spot');
  check('side bets off: the main spot still takes chips', t.bets() === '10,0,0', t.bets());
  check('no script errors (end)', t.errors.length === 0, t.errors);
  done();
})();
