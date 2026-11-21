// Fast Blackjack: random manual play with side bets and insurance must keep the balance exact,
// the first four cards must match the provably-fair sequence, and Autobet must play perfect basic strategy.
const crypto = require('crypto');
const { HANDS, load, check, done } = require('../_util');

const KEY = 'bj-fast-v1';
const RNK = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'], SU = ['♦', '♥', '♠', '♣'];
const parse = s => s.replace(' (doubled)', '').split(' ').map(t => ({ r: t.slice(0, -1), s: t.slice(-1) }));
const val = c => c.r === 'A' ? 11 : ['10', 'J', 'Q', 'K'].includes(c.r) ? 10 : +c.r;
const tot = cs => { let t = 0, a = 0; for (const c of cs) { t += val(c); if (c.r === 'A') a++; } while (t > 21 && a) { t -= 10; a--; } return t; };
const bj = cs => cs.length === 2 && tot(cs) === 21, red = c => c.s === '♥' || c.s === '♦';
const pp = (a, b) => a.r !== b.r ? 0 : a.s === b.s ? 25 : red(a) === red(b) ? 12 : 6;
function t3(cs) { const su = cs.every(c => c.s === cs[0].s), rk = cs.map(c => RNK.indexOf(c.r)).sort((a, b) => a - b), tr = rk[0] === rk[1] && rk[1] === rk[2], st = !tr && ((rk[2] - rk[0] === 2 && rk[1] - rk[0] === 1) || (rk[0] === 0 && rk[1] === 1 && rk[2] === 12)); return tr && su ? 100 : st && su ? 40 : tr ? 30 : st ? 10 : su ? 5 : 0; }
function expectNet(h, b, ppb, t3b, ins) {
  const hands = h.p.map(s => ({ cs: parse(s), dbl: s.includes('(doubled)') })), dc = parse(h.d), split = hands.length > 1;
  let net = 0; const dt = tot(dc), dbj = bj(dc);
  const first = split ? [hands[0].cs[0], hands[1].cs[0]] : hands[0].cs.slice(0, 2);
  if (ppb) { const m = pp(first[0], first[1]); net += m ? ppb * m : -ppb; }
  if (t3b) { const m = t3([first[0], first[1], dc[0]]); net += m ? t3b * m : -t3b; }
  if (ins) net += dbj ? ins * 2 : -ins;
  for (const x of hands) { const bet = b * (x.dbl ? 2 : 1), t = tot(x.cs), nat = !split && bj(x.cs); if (t > 21) net -= bet; else if (dbj) net += nat ? 0 : -bet; else if (nat) net += bet * 1.5; else if (dt > 21 || t > dt) net += bet; else if (t < dt) net -= bet; }
  return Math.round(net * 100) / 100;
}
const ref = (s, c, n, cnt) => { const out = []; for (let r = 0; out.length < cnt; r++) { const b = crypto.createHmac('sha256', s).update(`${c}:${n}:${r}`).digest(); for (let i = 0; i < 32 && out.length < cnt; i += 4) { const k = Math.floor((b[i] / 256 + b[i + 1] / 65536 + b[i + 2] / 16777216 + b[i + 3] / 4294967296) * 52); out.push(RNK[k % 13] + SU[Math.floor(k / 13)]); } } return out; };

(async () => {
  const t = load('fast', { [KEY]: { bal: 1e5 } });
  const { q, all, sleep } = t, S = () => t.state(KEY);
  const set = (sel, v) => { q(sel).value = v; q(sel).dispatchEvent(new t.w.Event('input')); };
  await sleep(20);
  let bad = 0, seqBad = 0, rounds = 0;
  for (let r = 0; r < HANDS; r++) {
    const b = [1, 5, 10, 2.5][r % 4], ppb = r % 3 === 0 ? 1 : 0, t3b = r % 5 === 0 ? 2 : 0;
    set('#bet', b.toFixed(2)); set('#pp', ppb.toFixed(2)); set('#t3', t3b.toFixed(2));
    const before = S() || { nonce: 0 }, bal0 = before.bal ?? 1e5;
    q('#betBtn').click();
    let ins = 0;
    for (let i = 0; i < 4000; i++) {
      await sleep(0);
      if (!q('#insRow').hidden) { if (Math.random() < .5) { ins = b / 2; q('#insY').click(); } else q('#insN').click(); continue; }
      const en = all('.acts .act').filter(x => !x.disabled);
      if (en.length) { en[Math.floor(Math.random() * en.length)].click(); continue; }
      const s = S(); if (!q('#betBtn').disabled && s.hist.length && s.hist[0].nonce === before.nonce) break;
    }
    const after = S(), h = after.hist[0];
    if (!h || h.nonce !== before.nonce) break;
    const got = Math.round((after.bal - bal0) * 100) / 100;
    if (Math.abs(expectNet(h, b, ppb, t3b, ins) - got) > .001 || Math.abs(h.net - got) > .001) bad++;
    if (h.p.length === 1) { const cs = h.p[0].replace(' (doubled)', '').split(' '), dc = h.d.split(' '); if ([cs[0], dc[0], cs[1], dc[1]].join() !== ref(before.server, h.client, h.nonce, 4).join()) seqBad++; }
    rounds++;
  }
  check('manual hands finished', rounds === HANDS, `${rounds}/${HANDS}`);
  check('balance matches an independent payout calculation', bad === 0, bad);
  check('dealt cards match HMAC(server, client:nonce:round)', seqBad === 0, seqBad);

  q('[data-tab=auto]').click(); set('#bet', '1.00'); set('#nb', String(HANDS));
  const s0 = S().stats;
  q('#autoBtn').click();
  for (let i = 0; i < 4e6 && q('#autoBtn').textContent !== 'Start Autobet'; i++) await sleep(0);
  const s1 = S().stats;
  check('Autobet played every bet', s1.hands - s0.hands === HANDS, s1.hands - s0.hands);
  check('Autobet made no strategy mistakes', s1.mistakes === s0.mistakes, s1.mistakes - s0.mistakes);
  check('no script errors', t.errors.length === 0, t.errors.slice(0, 3));
  done();
})();
