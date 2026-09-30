// 'Never silently no fit' contract: Scan.scanLine(...).status / .near (run: node tests/near_fit.js)
const Scan = require('../src/js/01-engine.js');
let bad = 0;
const ok = (c, m) => { if (!c) { bad++; console.log('FAIL', m); } };
const shape = (r, tag) => {
  ok(['exact', 'licensed', 'near', 'none'].includes(r.status), tag + ' status ' + r.status);
  ok(Array.isArray(r.near) && r.near.length <= 3, tag + ' near array');
  if (r.status !== 'near') ok(r.near.length === 0, tag + ' near empty unless status near');
  if (r.fits.length) ok(r.status === 'exact' || r.status === 'licensed', tag + ' fits => exact/licensed');
  r.near.forEach(n => {
    ok(n.meter && Array.isArray(n.clashes) && Number.isInteger(n.extra) && Number.isInteger(n.missing), tag + ' near shape');
    ok(n.confidence >= 0 && n.confidence <= 1, tag + ' confidence range');
  });
};
const sig = r => JSON.stringify(r.near.map(n => [n.meter.id, n.clashes, n.extra, n.missing, n.confidence]));

const good = 'چلے بھی آؤ کہ گلشن کا کاروبار چلے';
const g = Scan.scanLine(good); shape(g, 'faiz');
ok(g.fits.length > 0, 'faiz fits after lexicon fix');
ok(g.status === 'exact' || g.status === 'licensed', 'faiz status');

const ghalib = 'ہزاروں خواہشیں ایسی کہ ہر خواہش پہ دم نکلے';
const base = Scan.scanLine(ghalib); shape(base, 'ghalib');
ok(base.fits.length > 0, 'ghalib base fits');

const broken = [
  'ہزاروں خواہشیں ایسی کہ ہر خواہش پہ دم نکلے کتاب',
  'ہزاروں خواہشیں ایسی کہ ہر خواہش پہ',
  'ہزاروں کتاب ایسی کہ ہر خواہش پہ دم نکلے',
  'چلے بھی آؤ کہ گلشن کا کاروبار چلے چلے بھی',
];
let sawNear = false;
broken.forEach((l, i) => {
  const r = Scan.scanLine(l); shape(r, 'broken' + i);
  if (!r.fits.length) {
    sawNear = true;
    ok(r.status === 'near' && r.near.length > 0, 'broken' + i + ' near');
    ok(r.near.some(n => n.clashes.length || n.extra || n.missing), 'broken' + i + ' has a mismatch');
  }
  ok(sig(r) === sig(Scan.scanLine(l)), 'deterministic ' + i);
});
ok(sawNear, 'at least one broken line produced status near');

['', '   ', '،۔!؟', '!!!???', 'hello world', 'abc گلشن xyz', '‌', 'گل‌شن', '☃☃☃', '١٢٣', null, undefined].forEach(x => {
  try { shape(Scan.scanLine(x), 'garbage ' + JSON.stringify(x)); }
  catch (e) { ok(false, 'threw on ' + JSON.stringify(x) + ': ' + e.message); }
});
['', '  ', '،۔!؟', '!!!'].forEach(x => {
  const r = Scan.scanLine(x); ok(r.status === 'none' && r.near.length === 0, 'none for ' + JSON.stringify(x));
});
if (bad) { console.log(bad + ' failures'); process.exit(1); }
console.log('near_fit: ok');
