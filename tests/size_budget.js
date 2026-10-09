/* The page is one offline file (index.html). Its size is a budget, not an accident: this fails when the build outgrows
   tests/size_budget.json. Raising the budget is a decision — say in the commit what grew and why.
   Run after `npm run build`: node tests/size_budget.js */
const fs = require('fs'), path = require('path'), zlib = require('zlib');
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'));
const budget = JSON.parse(fs.readFileSync(path.join(__dirname, 'size_budget.json'), 'utf8'));
const raw = html.length, gz = zlib.gzipSync(html, { level: 9 }).length;
const mb = n => (n / 1e6).toFixed(2) + ' MB';
let fail = 0;
[['raw', raw, budget.raw], ['gzip', gz, budget.gzip]].forEach(([k, n, max]) => {
  const ok = n <= max;
  if (!ok) fail++;
  console.log(`  ${ok ? '✓' : '✗'} ${k.padEnd(4)} ${mb(n)} of ${mb(max)} (${(100 * n / max).toFixed(1)}%)`);
});
console.log(fail ? 'SIZE BUDGET: over budget' : 'SIZE BUDGET: within budget');
process.exit(fail ? 1 : 0);
