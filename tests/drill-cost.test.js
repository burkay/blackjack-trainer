// The drills put a price on every wrong answer, from the same EV model as the table.
const { load, check, done } = require('./_util');

(async () => {
  // Strategy test: answer every question with Stand; on the ones where Stand is wrong the cost line shows.
  const t = load('strategy', { 'st-v3': null });
  await t.sleep(50);
  let wrong = 0, priced = 0, flat = 0, right = 0, bad = 0;
  for (let i = 0; i < 60; i++) {
    const s = t.q('#b-S');
    if (!s || s.disabled) { const n = t.q('#next'); if (n) n.click(); await t.sleep(5); continue; }
    s.click(); await t.sleep(5);
    const fb = t.q('#fb').textContent, isWrong = /Yanlış/.test(fb);
    if (isWrong) { wrong++; if (/ortalama maliyeti: bahsin %[\d,]+ kadarı \(100 €'luk bahiste [\d,]+ €\)/.test(fb)) priced++; else if (/neredeyse fark yok/.test(fb)) flat++; else bad++; }
    else { right++; if (/ortalama maliyeti|neredeyse fark/.test(fb)) bad++; }
    const n = t.q('#next'); if (n) n.click(); await t.sleep(5);
  }
  check('strategy test: every wrong answer gets a cost line, right answers none', wrong > 10 && bad === 0 && priced + flat === wrong, { wrong, priced, flat, right, bad });
  check('strategy test: the miss list shows the share of the bet', /maliyet: bahsin %[\d,]+ kadarı/.test(t.q('#miss').textContent), t.q('#miss').textContent.slice(0, 120));
  check('strategy test: no script errors', t.errors.length === 0, t.errors);

  // Hi-Lo trainer, deviations: answer with the wrong one of the two plays every time
  const h = load('hilo');
  await h.sleep(50);
  [...h.d.querySelectorAll('#tabs button')].find(b => /Sapma/.test(b.textContent)).click();
  await h.sleep(20);
  let n = 0, ins = 0, play = 0, badH = 0;
  for (let i = 0; i < 40; i++) {
    const ask = h.q('#q');
    const opts = [...h.d.querySelectorAll('#q [data-a]')].filter(b => !b.disabled);
    if (!opts.length) { const x = h.q('#next'); if (x) x.click(); await h.sleep(5); continue; }
    // the wrong one: for insurance the other button, for plays anything but the right answer is hard to know here,
    // so click every button in turn on fresh questions until a wrong one is hit
    opts[i % opts.length].click(); await h.sleep(5);
    const fb = h.q('#fb').textContent;
    if (/Yanlış/.test(fb)) {
      n++;
      if (/Sigorta indeksi/.test(fb)) ins++; else play++;
      if (!/ortalama maliyeti: bahsin|neredeyse fark yok/.test(fb)) badH++;
    }
    const x = h.q('#next'); if (x) x.click(); await h.sleep(5);
  }
  check('Hi-Lo deviations: every wrong answer gets a cost line', n > 5 && badH === 0, { wrong: n, insurance: ins, plays: play, bad: badH });
  check('Hi-Lo: no script errors', h.errors.length === 0, h.errors);
  done();
})();
