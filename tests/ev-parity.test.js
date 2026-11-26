// The expected-value block is the same in the Table Simulator and both drills, so a mistake costs the same everywhere.
const { read, check, done } = require('./_util');

const grab = app => { const s = read(app); return s.slice(s.indexOf('/*EV*/'), s.indexOf('/*ENDEV*/')); };
const t = grab('table'), st = grab('strategy'), hi = grab('hilo');
check('the EV block is in all three apps', t.length > 2000 && st.length > 2000 && hi.length > 2000, [t.length, st.length, hi.length]);
check('…and identical', t === st && t === hi);
const { evPlaysV, evInsurance } = new Function(t + ';return {evPlaysV,evInsurance};')();
const x = o => Object.assign({ canDouble: true, canSplit: true, canSur: false, das: true, s17: true, tc: 0 }, o);
let o = evPlaysV([10, 2], 2, x()); check('12 vs 2: stand −0.293, hit −0.253', Math.abs(o.S + .2928) < .0015 && Math.abs(o.H + .2534) < .0015, o);
o = evPlaysV([11, 7], 9, x()); check('soft 18 vs 9: hit beats stand by 0.083', Math.abs(o.H - o.S - .0825) < .002, o);
o = evPlaysV([8, 8], 10, x({ das: false })); const d = evPlaysV([8, 8], 10, x({ das: true }));
check('double after split adds value to a split', d.P > o.P, [o.P, d.P]);
check('insurance: losing at count 0, about break-even at +3, winning at +5', evInsurance(0) < -.03 && Math.abs(evInsurance(3)) < .02 && evInsurance(5) > 0, [evInsurance(0), evInsurance(3), evInsurance(5)]);
done();
