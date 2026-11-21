// Fast Blackjack provably-fair engine: the in-page SHA-256 / HMAC must match Node's crypto,
// cards must follow HMAC(serverSeed, "client:nonce:round") exactly, and side-bet payouts must classify correctly.
const crypto = require('crypto');
const { read, check, done } = require('../_util');

const src = read('fast');
const js = src.slice(src.indexOf('/* ---------- SHA-256'), src.indexOf('/*END-RNG*/'));
const logic = src.slice(src.indexOf('/* ---------- strategy'), src.indexOf('/*END-LOGIC*/'));
const M = new Function(js + logic + ';return {SHA256,hmac,hex,cardsFor,DECK,perfectPairs,twentyOne3};')();

let bad = 0;
for (let i = 0; i < 1500; i++) {
  const b = crypto.randomBytes(Math.floor(Math.random() * 300));
  if (M.hex(M.SHA256(new Uint8Array(b))) !== crypto.createHash('sha256').update(b).digest('hex')) bad++;
  const k = crypto.randomBytes(Math.floor(Math.random() * 100)), m = crypto.randomBytes(Math.floor(Math.random() * 100));
  if (M.hex(M.hmac(new Uint8Array(k), new Uint8Array(m))) !== crypto.createHmac('sha256', k).update(m).digest('hex')) bad++;
}
check('SHA-256 and HMAC match Node crypto', bad === 0, bad);

const ref = (s, c, n, cnt) => { const out = []; for (let r = 0; out.length < cnt; r++) { const b = crypto.createHmac('sha256', s).update(`${c}:${n}:${r}`).digest(); for (let i = 0; i < 32 && out.length < cnt; i += 4) out.push(Math.floor((b[i] / 256 + b[i + 1] / 65536 + b[i + 2] / 16777216 + b[i + 3] / 4294967296) * 52)); } return out; };
let cm = 0;
for (let n = 0; n < 200; n++) if (M.cardsFor('srv' + n, 'cli', n, 20).map(x => M.DECK.indexOf(x)).join() !== ref('srv' + n, 'cli', n, 20).join()) cm++;
check('cards follow the published formula', cm === 0, cm);

const cnt = new Array(52).fill(0);
for (let n = 0; n < 4000; n++) M.cardsFor('x', 'y', n, 16).forEach(c => cnt[M.DECK.indexOf(c)]++);
check('every card comes up about equally often', Math.min(...cnt) > 1000 && Math.max(...cnt) < 1500, [Math.min(...cnt), Math.max(...cnt)]);

const C = (r, s) => ({ r, s });
const pp = [M.perfectPairs(C('8', '♠'), C('8', '♠')), M.perfectPairs(C('8', '♠'), C('8', '♣')), M.perfectPairs(C('8', '♠'), C('8', '♥')), M.perfectPairs(C('8', '♠'), C('9', '♠'))];
check('Perfect Pairs 25 / 12 / 6 / none', pp[0][1] === 25 && pp[1][1] === 12 && pp[2][1] === 6 && pp[3] === null);
const t3 = [[C('A', '♠'), C('2', '♠'), C('3', '♠')], [C('Q', '♠'), C('K', '♥'), C('A', '♠')], [C('7', '♠'), C('7', '♠'), C('7', '♠')], [C('7', '♠'), C('7', '♥'), C('7', '♠')], [C('2', '♠'), C('9', '♠'), C('K', '♠')], [C('K', '♠'), C('A', '♥'), C('2', '♠')]].map(M.twentyOne3);
check('21+3 40 / 10 / 100 / 30 / 5 / none', t3[0][1] === 40 && t3[1][1] === 10 && t3[2][1] === 100 && t3[3][1] === 30 && t3[4][1] === 5 && t3[5] === null);
done();
