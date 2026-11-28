#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

const ROOT = path.resolve(__dirname, '..');

function makeEl() {
  return {
    style: {},
    dataset: {},
    classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
    addEventListener() {},
    removeEventListener() {},
    setAttribute() {},
    getAttribute() { return null; },
    querySelectorAll() { return []; },
    querySelector() { return null; },
    closest() { return null; },
    focus() {},
    blur() {},
    value: '',
    checked: false,
    textContent: '',
    innerHTML: ''
  };
}

const memStore = new Map();
const localStorageStub = {
  getItem: k => (memStore.has(k) ? memStore.get(k) : null),
  setItem: (k, v) => { memStore.set(k, String(v)); },
  removeItem: k => { memStore.delete(k); },
  clear: () => { memStore.clear(); },
  key: i => [...memStore.keys()][i] || null,
  get length() { return memStore.size; }
};

const docStub = {
  documentElement: makeEl(),
  body: makeEl(),
  hidden: false,
  title: 'SweldoPulse',
  getElementById: () => makeEl(),
  querySelector: () => makeEl(),
  querySelectorAll: () => [],
  addEventListener() {},
  createElement: () => makeEl()
};

const ctx = {
  console, Math, Date, JSON, Number, String, Boolean, Array, Object, Set, Map, RegExp, Error, parseInt, parseFloat, isNaN, isFinite,
  setTimeout: () => 0, clearTimeout: () => {}, setInterval: () => 0, clearInterval: () => {},
  requestAnimationFrame: () => 0, cancelAnimationFrame: () => {},
  document: docStub,
  localStorage: localStorageStub,
  navigator: { userAgent: 'node-test' },
  location: { href: 'https://appassets.sweldopulse.local/', origin: 'https://appassets.sweldopulse.local' },
  matchMedia: () => ({ matches: true, addEventListener() {} }),
  innerWidth: 390,
  addEventListener() {}
};
ctx.window = ctx;
ctx.self = ctx;

const appCode = fs.readFileSync(path.join(ROOT, 'app.js'), 'utf8');
vm.createContext(ctx);
vm.runInContext(appCode, ctx, { filename: 'app.js' });

// Export test hooks cleanly inside VM scope
const api = vm.runInContext(`({
  APP_VERSION, PH_WAGE_PRESETS, settings,
  setShifts: arr => { shifts = arr; },
  setSettings: patch => { Object.assign(settings, patch); _pm.clear(); },
  calcPay, ndOverlapMin, holidayFor, nextDayMultFor, periodOf, estimateStatutory,
  parseScheduleText, resolveTimeRange, semver, sanitizeRestoredSettings
})`, ctx);

let passed = 0;
function test(name, fn) {
  try {
    fn();
    passed++;
    console.log('  PASS:', name);
  } catch (err) {
    console.error('  FAIL:', name);
    console.error('       ', err.message);
    process.exitCode = 1;
  }
}

console.log('Running SweldoPulse Engine QA Tests (v' + api.APP_VERSION + ')...');

// 1. Version parity across release artifacts
test('Version parity across app.js, version.json, sw.js, index.html, ReminderReceiver.java', () => {
  const vj = JSON.parse(fs.readFileSync(path.join(ROOT, 'version.json'), 'utf8'));
  const sw = fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8');
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const rem = fs.readFileSync(path.join(ROOT, 'android/java/com/kakashimoto14/sweldopulse/ReminderReceiver.java'), 'utf8');
  assert.strictEqual(api.APP_VERSION, vj.version);
  assert.ok(vj.apkName.includes(vj.version));
  assert.ok(sw.includes('sweldopulse-v' + vj.version.replace(/\./g, '')));
  assert.ok(html.includes('Version ' + vj.version));
  assert.ok(rem.includes('"' + vj.version + '"'));
});

// 2. Standard 8h day shift
test('calcPay: standard 8h day shift (08:00-16:00 @ ₱73.75)', () => {
  const r = api.calcPay({ start: '08:00', end: '16:00', mult: 1, rate: 73.75, brk: 0, prior: 0, ndRate: 0.10, otHrs: 8 });
  assert.strictEqual(r.reg, 8);
  assert.strictEqual(r.ot, 0);
  assert.strictEqual(r.nd, 0);
  assert.strictEqual(r.gross, 590);
});

// 3. Graveyard 6h shift with 10% Night Diff
test('calcPay: 6h graveyard shift (22:00-04:00 @ ₱73.75, 10% ND)', () => {
  const r = api.calcPay({ start: '22:00', end: '04:00', mult: 1, rate: 73.75, brk: 0, prior: 0, ndRate: 0.10, otHrs: 8 });
  assert.strictEqual(r.reg, 6);
  assert.strictEqual(r.nd, 6);
  assert.strictEqual(r.ndPay, 44.25);
  assert.strictEqual(r.gross, 486.75);
});

// 4. Midnight Holiday Split (Dec 24 Special 1.3x -> Dec 25 Regular Holiday 2.0x)
test('calcPay: Midnight Holiday Split (22:00 Dec 24 @ 1.3x -> 04:00 Dec 25 @ 2.0x, 10% ND)', () => {
  const r = api.calcPay({ start: '22:00', end: '04:00', mult: 1.3, rate: 100, brk: 0, prior: 0, ndRate: 0.10, otHrs: 8, nextMult: 2.0 });
  assert.strictEqual(r.splitApplied, true);
  assert.strictEqual(r.reg, 6);
  assert.strictEqual(r.nd, 6);
  // Pre-midnight: 2h * 100 * 1.3 = 260 (+26 ND = 286)
  // Post-midnight: 4h * 100 * 2.0 = 800 (+80 ND = 880)
  // Total = 1060 base + 106 ND = 1166
  assert.strictEqual(r.ndPay, 106);
  assert.strictEqual(r.gross, 1166);
});

// 5. Overtime on Regular Day (1.25x) vs Holiday (1.30x)
test('calcPay: 10h shift OT factor 1.25x regular vs 1.30x holiday', () => {
  const reg = api.calcPay({ start: '08:00', end: '18:00', mult: 1, rate: 100, brk: 0, prior: 0, ndRate: 0.10, otHrs: 8 });
  assert.strictEqual(reg.gross, 1050); // 8*100 + 2*125
  const hol = api.calcPay({ start: '08:00', end: '18:00', mult: 2, rate: 100, brk: 0, prior: 0, ndRate: 0.10, otHrs: 8 });
  assert.strictEqual(hol.gross, 2120); // 8*200 + 2*260
});

// 6. Unpaid break deducted cleanly
test('calcPay: 9h span with 60m unpaid break = 8h paid, 0h OT', () => {
  const r = api.calcPay({ start: '08:00', end: '17:00', mult: 1, rate: 100, brk: 60, prior: 0, ndRate: 0.10, otHrs: 8 });
  assert.strictEqual(r.reg, 8);
  assert.strictEqual(r.ot, 0);
  assert.strictEqual(r.gross, 800);
});

// 7. PH 2026 & 2027 Holidays & Pre-Holiday Toggle
test('holidayFor: 2027 Good Friday & Pre-Holiday 1.3x toggle', () => {
  api.setSettings({ preHolidayRule: true });
  assert.strictEqual(api.holidayFor('2027-03-26').mult, 2);
  assert.strictEqual(api.holidayFor('2026-11-29').mult, 1.3); // Day before Bonifacio Day
  api.setSettings({ preHolidayRule: false });
  assert.strictEqual(api.holidayFor('2026-11-29'), null);
  api.setSettings({ preHolidayRule: true });
});

// 8. PH 2027 NCR Tranche 2 Wage Presets
test('PH_WAGE_PRESETS: NCR 2027 Tranche 2 & CALABARZON WO IVA-23 present', () => {
  assert.strictEqual(api.PH_WAGE_PRESETS.ncr_2027_nonagri.rate, 97.50);
  assert.strictEqual(api.PH_WAGE_PRESETS.ncr_2027_nonagri.daily, 780);
  assert.strictEqual(api.PH_WAGE_PRESETS.ncr_2027_retail.rate, 92.88);
  assert.strictEqual(api.PH_WAGE_PRESETS['80.63'].daily, 645);
  assert.strictEqual(api.PH_WAGE_PRESETS['73.75'].daily, 590);
  assert.strictEqual(api.PH_WAGE_PRESETS['68.75'].daily, 550);
});

// 9. semi25 (11-25 / 26-10) statutory month aggregation includes prior-month days 26-31
test('estimateStatutory: semi25 2nd cutoff (11-25) includes 26-31 from prior month', () => {
  api.setSettings({ schedule: 'semi25', deductMode: 'split', autoDeduct: true, mwe: false, statMinGross: 0 });
  api.setShifts([
    { id: 1, date: '2026-10-28', startTime: '08:00', endTime: '16:00', hourlyRate: 100, multiplier: 1, reg: 80, ot: 0, nd: 0, ndPay: 0, gross: 8000, status: 'worked' },
    { id: 2, date: '2026-11-15', startTime: '08:00', endTime: '16:00', hourlyRate: 100, multiplier: 1, reg: 40, ot: 0, nd: 0, ndPay: 0, gross: 4000, status: 'worked' }
  ]);
  const d = api.estimateStatutory('2026-11-25', 4000, 4000);
  // Combined monthly gross = 8000 (Oct 28 in 2026-11-10 cutoff) + 4000 (Nov 15 in 2026-11-25 cutoff) = 12000
  // MSC = 12000 -> monthly SSS = 600 -> split 2nd cutoff SSS = 300 (if Oct 28 was dropped, monthly would be 8000 -> SSS 200!)
  assert.strictEqual(d.sss, 300);
});

// 10. Multi-day roster parser
test('parseScheduleText: parses McDonald\'s graveyard roster cleanly', () => {
  api.setSettings({ schedule: 'semi', hourlyRate: 73.75, midnightHolidaySplit: true });
  const rows = api.parseScheduleText('Thu 10p-4a GR\nSat 10p-4a GR\nSun 10p-4a Lobby', '2026-11-23');
  assert.strictEqual(rows.length, 3);
  assert.strictEqual(rows[0].startTime, '22:00');
  assert.strictEqual(rows[0].endTime, '04:00');
  assert.strictEqual(rows[0].note, 'GR');
  assert.strictEqual(rows[2].note, 'Lobby');
});

// 11. Deep cutoffData restore sanitization strips prototype pollution & invalid keys
test('sanitizeRestoredSettings: strips __proto__ / invalid cutoffData keys & validates numbers', () => {
  const dirty = JSON.parse('{"hourlyRate":80.63,"midnightHolidaySplit":false,"cutoffData":{"__proto__":{"polluted":1},"bad_key":{"allowance":99},"2026-11-2":{"allowance":"500","otherDed":-50,"manual":{"sss":250,"ph":"abc","pi":100,"tax":0}}}}');
  const clean = api.sanitizeRestoredSettings(dirty);
  assert.strictEqual(clean.midnightHolidaySplit, false);
  assert.strictEqual(clean.cutoffData.bad_key, undefined);
  assert.strictEqual(Object.prototype.polluted, undefined);
  assert.strictEqual(clean.cutoffData['2026-11-2'].allowance, 500);
  assert.strictEqual(clean.cutoffData['2026-11-2'].otherDed, 0);
  assert.strictEqual(clean.cutoffData['2026-11-2'].manual.sss, 250);
  assert.strictEqual(clean.cutoffData['2026-11-2'].manual.ph, 0);
});

// 12. Semver comparison
test('semver: 2.8.0 > 2.7.2', () => {
  assert.ok(api.semver('2.8.0', '2.7.2') > 0);
  assert.strictEqual(api.semver('2.8.0', '2.8.0'), 0);
});

console.log(`\nAll ${passed} SweldoPulse QA tests finished.`);
if (process.exitCode) process.exit(process.exitCode);
