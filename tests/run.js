// Runs every *.test.js under tests/ one after another and prints a summary.
// --hands=<n> (or HANDS=<n>) sets how many hands each simulation plays (default 300).
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const files = [];
(function walk(dir) {
  for (const f of fs.readdirSync(dir).sort()) {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) walk(p);
    else if (f.endsWith('.test.js')) files.push(p);
  }
})(__dirname);

// Options: --hands=N (hands per simulation), any other argument filters test files by path.
const args = process.argv.slice(2);
const handsArg = args.find(a => a.startsWith('--hands='));
if (handsArg) process.env.HANDS = handsArg.split('=')[1];
const only = args.filter(a => !a.startsWith('--'));
let failed = 0;
for (const f of files) {
  const rel = path.relative(__dirname, f);
  if (only.length && !only.some(o => rel.includes(o))) continue;
  const t0 = Date.now();
  console.log(`\n▶ ${rel}`);
  const r = spawnSync(process.execPath, [f], { stdio: 'inherit', env: process.env });
  console.log(`  ${r.status === 0 ? 'ok' : 'FAILED'} in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
  if (r.status !== 0) failed++;
}
console.log(failed ? `\n${failed} test file(s) failed` : '\nAll tests passed');
process.exit(failed ? 1 : 0);
