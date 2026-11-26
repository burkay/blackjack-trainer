// The total of all bets (main + Perfect Pairs + 21+3) is shown while betting, and follows every change.
const { check, done } = require('../_util');
const { table } = require('./_table');

(async () => {
  const t = table({ sbo: true, bots: 0, bank: 1000 });
  await t.start(); await t.toBet();
  const tot = () => [t.q('.sbtot b').textContent, t.q('#deal .dtot').textContent.trim()];
  t.bet(100);
  check('main bet only: total €100', tot()[0] === '€100' && tot()[1] === '€100', tot());
  t.q('[data-bt=pp]').click(); t.q('[data-chip="10"]').click(); t.q('[data-chip="10"]').click();
  t.q('[data-bt=t3]').click(); t.q('[data-chip="25"]').click();
  check('with side bets: €100 + €20 + €25 = €145', tot()[0] === '€145' && tot()[1] === '€145', tot());
  t.q('#clr').click();
  check('Clear: total €0', tot()[0] === '€0', tot());
  const o = table({ sbo: false, bots: 0 }); await o.start(); await o.toBet();
  check('side bets off: no total box, DEAL still shows the stake', !o.q('.sbtot') && /€\d/.test(o.q('#deal .dtot').textContent));
  check('no script errors', t.errors.length + o.errors.length === 0, t.errors.concat(o.errors));
  done();
})();
