// Game-data logging to Supabase, against a fake server: anonymous sign-in once, player row once,
// events in batches with the user's token, retry after a server error, nothing sent from file:// pages.
const { load, check, done } = require('./_util');
const { table } = require('./table/_table');

function fakeSupabase(w, plan = {}) {
  const calls = [];
  let eventsFail = plan.eventsFail || 0;
  w.fetch = async (url, init = {}) => {
    const u = new URL(url), body = init.body ? JSON.parse(init.body) : null;
    calls.push({ path: u.pathname + u.search, headers: init.headers || {}, body });
    const res = (status, json) => ({ ok: status < 300, status, json: async () => json });
    if (u.pathname === '/auth/v1/signup') return res(200, { access_token: 'at1', refresh_token: 'rt1', expires_in: 3600, user: { id: 'u1' } });
    if (u.pathname === '/rest/v1/players') return res(201);
    if (u.pathname === '/rest/v1/events') return eventsFail-- > 0 ? res(503) : res(201);
    return res(404);
  };
  return calls;
}
const until = async (sleep, f, n = 400) => { for (let i = 0; i < n && !f(); i++) await sleep(5); return f(); };
const sent = calls => calls.filter(c => c.path === '/rest/v1/events').flatMap(c => c.body || []);

(async () => {
  // Strategy test: one answer -> sign-in, player row, one event.
  {
    let calls;
    const t = load('strategy', {}, w => { calls = fakeSupabase(w, { eventsFail: 1 }); });
    await t.sleep(50);
    t.q('#acts .act:not([disabled])').click();
    await until(t.sleep, () => sent(calls).length >= 1 && calls.filter(c => c.path === '/rest/v1/events').length >= 2);
    const ev = sent(calls), signups = calls.filter(c => c.path === '/auth/v1/signup');
    const pl = calls.filter(c => c.path.startsWith('/rest/v1/players'));
    check('strategy: one anonymous sign-in', signups.length === 1, signups.length);
    check('strategy: player row created once with the user id', pl.length === 1 && pl[0].body.id === 'u1', pl.map(c => c.body));
    check('strategy: event sent after a server error, with player, app and kind', ev.length >= 1 && ev[ev.length - 1].player_id === 'u1' && ev[ev.length - 1].app === 'strategy' && ev[ev.length - 1].kind === 'answer', ev[ev.length - 1]);
    const last = calls.filter(c => c.path === '/rest/v1/events').pop();
    check('strategy: events carry the publishable key and the user token', /^sb_publishable_/.test(last.headers.apikey) && last.headers.Authorization === 'Bearer at1');
    check('strategy: answer holds pick, right play and result', ['pick', 'right', 'ok', 'hand', 'up', 'ms'].every(k => k in ev[ev.length - 1].data), ev[ev.length - 1].data);
    await until(t.sleep, () => (t.state('bj-cloud-q-strategy') || []).length === 0);
    check('strategy: queue empty after sending', (t.state('bj-cloud-q-strategy') || []).length === 0);
    check('strategy: no script errors', t.errors.length === 0, t.errors);
  }
  // Table Simulator: a played hand is logged as "hand" with cards and result.
  {
    let calls;
    const t = table({}, w => { calls = fakeSupabase(w); });
    await t.start();
    await t.toBet(); t.bet(25); t.q('#deal').click();
    await t.playOut(btns => btns.find(b => b.id === 'a-S') || btns[0]);
    await until(t.sleep, () => sent(calls).some(e => e.kind === 'hand'));
    const h = sent(calls).find(e => e.kind === 'hand');
    check('table: hand event sent', !!h && h.app === 'table', h && h.kind);
    check('table: hand event has bet, net, cards, dealer and bankroll', !!h && ['b', 'y', 'h', 'd', 'bank', 'mode'].every(k => k in h.data), h && Object.keys(h.data));
    check('table: same session for the second event (no new sign-in)', calls.filter(c => c.path === '/auth/v1/signup').length === 1);
    check('table: no script errors', t.errors.length === 0, t.errors);
  }
  // A page without fetch (or opened from disk) sends nothing and still works.
  {
    const t = load('hilo');
    await t.sleep(50);
    const b = t.q('.opt'); if (b) b.click();
    await t.sleep(50);
    check('hilo without fetch: nothing queued', t.state('bj-cloud-q-hilo') === null);
    check('hilo without fetch: no script errors', t.errors.length === 0, t.errors);
  }
  done();
})();
