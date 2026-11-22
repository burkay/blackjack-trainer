// RTP of every player and the house: what each player's bets paid back, and the house profit as the other side of all of them.
const { HANDS, check, done } = require('../_util');
const { table, random } = require('./_table');

const pct = (b, w) => `${(w / b * 100).toFixed(1)}%`;
const eur = n => new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(n);
const signed = n => (n ? (n > 0 ? '+' : '−') + eur(Math.abs(n)) : '€0');

(async () => {
  const t = table({ sbo: true });
  const { q } = t;
  await t.start();
  let n = 0, all = 0, badHouse = 0, badBots = 0, badText = 0;
  const net = { 0: 0, 2: 0 };
  for (let r = 0; r < HANDS; r++) {
    if (!(await t.toBet())) break;
    t.bet(25);
    for (const k of ['pp', 't3']) { q(`[data-bt=${k}]`).click(); q('#clr').click(); if (Math.random() < .5) q('[data-chip="5"]').click(); }
    const b0 = t.S().bank;
    q('#deal').click();
    if (!(await t.playOut(random))) break;
    const s = t.S(), bet = Object.values(s.hs).reduce((a, x) => a + x[0], 0), paid = Object.values(s.hs).reduce((a, x) => a + x[1], 0);
    n++; all += s.bank - b0 + s.botst[0].last + s.botst[2].last;
    if (Math.abs(bet - paid + all) > 1e-6) badHouse++;
    for (const i of [0, 2]) {
      net[i] += s.botst[i].last;
      if (Math.abs(s.botst[i].w - s.botst[i].b - net[i]) > 1e-6 || s.botst[i].b < 10 * n) badBots++;
      if (q(`.seat.s${i} .rtx`).textContent !== `RTP ${pct(s.botst[i].b, s.botst[i].w)}`) badText++;
    }
    if (q('.seat.s1 .rtx').textContent !== `${signed(s.tot.net)} · RTP ${pct(s.rt.m[0], s.rt.m[1])}`) badText++;
    if (!q('#house').textContent.startsWith(`House ${signed(-all)} · keeps `)) badText++;
    if (q('#s-hse').textContent !== signed(-all)) badText++;
  }
  check('all hands finished', n === HANDS, `${n}/${HANDS}`);
  check('house profit = everything all players lost, side bets included', badHouse === 0, { badHouse, house: -all });
  check('other players: paid back − bet = their profit', badBots === 0, badBots);
  check('RTP under every name and house profit on the rack are right', badText === 0, badText);
  const s = t.S(), total = Object.values(s.hs).reduce((a, x) => a + x[0], 0);
  check('the house took your bets and theirs', Math.abs(total - s.rt.m[0] - s.rt.pp[0] - s.rt.t3[0] - s.botst[0].b - s.botst[2].b) < 1e-6, total);
  const rows = t.all('#rtpbox tbody tr').map(r => r.textContent);
  check('stats table lists you, both side bets, both players and the house', rows.length === 6 && ['You', 'You · Pairs', 'You · 21+3', 'Player 1', 'Player 2', 'House keeps'].every((x, i) => rows[i].startsWith(x)), rows);
  check('the table agrees with the rack', rows[5].includes(signed(-all)), rows[5]);

  q('#resetBots').click(); q('#resetBots').click();
  check('resetting the players clears their RTP but not the house', q('.seat.s0 .rtx').textContent === '' && q('.seat.s2 .rtx').textContent === '' && q('#house').textContent.startsWith(`House ${signed(-all)}`), q('#house').textContent);
  check('no script errors', t.errors.length === 0, t.errors.slice(0, 3));

  // A game saved before this existed: no RTP for the others yet, the house starts from your own earlier bets.
  const o = table({ hlog: s.hlog, rounds: s.rounds, botst: { 0: { net: -30, hands: 5 }, 2: { net: 20, hands: 5, bet: 10, run: 0 } } });
  await o.sleep(60);
  const b = s.hlog.reduce((a, r) => a + r.b, 0), w = s.hlog.reduce((a, r) => a + r.w, 0);
  check('older saves: your RTP from the history, none yet for the others', o.q('.seat.s1 .rtx').textContent === `${signed(w - b)} · RTP ${pct(b, w)}` && o.q('.seat.s0 .rtx').textContent === '', o.q('.seat.s1 .rtx').textContent);
  check('older saves: the house starts from your bets and what the others had lost', o.q('#house').textContent.startsWith(`House ${signed(b - w + 10)}`), o.q('#house').textContent);
  // Nothing played yet.
  const e = table({ hlog: [], rounds: 0 }); await e.sleep(60);
  check('a new game shows no figures', e.q('#house').textContent === 'House' && e.all('.rtx').every(x => x.textContent === ''), e.q('#house').textContent);
  check('no script errors after loading', o.errors.length + e.errors.length === 0, o.errors.concat(e.errors));
  done();
})();
