// Wins in a row under every name (win +1, loss clears, push keeps; flame from 2) and your session / overall profit.
const { HANDS, check, done } = require('../_util');
const { table, random } = require('./_table');

const eur = n => new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(n);
const signed = n => (n ? (n > 0 ? '+' : '−') + eur(Math.abs(n)) : '€0');
const next = (n, net) => (net > 0 ? n + 1 : net < 0 ? 0 : n);

(async () => {
  const t = table();
  const { q, sleep } = t;
  await t.start();
  const want = { 0: 0, 1: 0, 2: 0 }, seen = { zero: 0, one: 0, flame: 0, push: 0 };
  let sum = 0, rounds = 0, badText = 0, badFlame = 0, badProfit = 0;
  for (let r = 0; r < HANDS; r++) {
    if (!(await t.toBet())) break;
    t.bet(25);
    const b0 = t.S().bank;
    q('#deal').click();
    if (!(await t.playOut(en => random(en)))) break;
    const s = t.S(), net = s.bank - b0;
    rounds++; sum += net;
    if (!net && want[1]) seen.push++;
    want[1] = next(want[1], net); want[0] = next(want[0], s.botst[0].last); want[2] = next(want[2], s.botst[2].last);
    for (const i of [0, 1, 2]) {
      const el = q(`.seat.s${i} .stk`), n = want[i];
      if (el.textContent !== (n ? String(n) : '')) badText++;
      if (!!el.querySelector('svg') !== n > 1) badFlame++;
      seen[n > 1 ? 'flame' : n ? 'one' : 'zero']++;
    }
    if (q('#s-ses').textContent !== signed(sum) || q('#s-tot').textContent !== signed(sum) || s.ses.hands !== rounds || s.tot.hands !== rounds) badProfit++;
  }
  check('all hands finished', rounds === HANDS, `${rounds}/${HANDS}`);
  check('streak text: number after a win, nothing after a loss, kept on a push', badText === 0, { badText, ...seen });
  check('flame only from two wins in a row', badFlame === 0 && seen.flame > 0 && seen.one > 0 && seen.zero > 0, badFlame);
  check('session and overall profit equal the sum of the results', badProfit === 0, { badProfit, sum });

  const st = t.S();
  q('#resetBank').click(); q('#resetBank').click(); await sleep(20);
  check('bankroll reset keeps the profit figures', t.S().bank === 1000 && t.S().tot.net === sum && t.S().ses.net === sum);
  check('bankroll reset clears the other players\' streaks', q('.seat.s0 .stk').textContent === '' && q('.seat.s2 .stk').textContent === '');
  check('no script errors', t.errors.length === 0, t.errors.slice(0, 3));

  // Reopening the page: a recent session goes on, an old one starts again, overall always stays.
  const open = async o => { const x = table(o); await x.sleep(60); return x; };
  const now = Date.now();
  let x = await open({ ses: { net: 40, hands: 3, t: now - 10 * 60e3 }, tot: { net: 70, hands: 9 }, str: 3 });
  check('reopened within 30 minutes: session and streak go on', x.q('#s-ses').textContent === '+€40' && x.q('#s-tot').textContent === '+€70' && x.q('.seat.s1 .stk').textContent === '3' && !!x.q('.seat.s1 .stk svg'));
  x = await open({ ses: { net: 40, hands: 3, t: now - 31 * 60e3 }, tot: { net: 70, hands: 9 } });
  check('reopened later: new session, overall kept', x.q('#s-ses').textContent === '€0' && x.q('#s-tot').textContent === '+€70');
  x = await open({ hlog: st.hlog, rounds: st.rounds });
  check('saved games from before: overall comes from the hand history', x.q('#s-tot').textContent === signed(st.hlog.reduce((a, r) => a + r.y, 0)), x.q('#s-tot').textContent);
  check('no script errors after reopening', x.errors.length === 0, x.errors);
  done();
})();
