const APP_VERSION = '2.8.0';
const DEFAULT_REPO = 'Kakashimoto14/SuweldoPulse';
const SHIFTS_KEY = 'sweldo_pulse_shifts_v2', SETTINGS_KEY = 'sweldo_pulse_settings_v2', GIGS_KEY = 'sweldo_pulse_gigs_v1', EXP_KEY = 'sweldo_pulse_expenses_v1', DEBTS_KEY = 'sweldo_pulse_debts_v1', LOCK_KEY = 'sweldo_pulse_lock_v1', BK_KEY = 'sweldo_pulse_last_backup', TOUR_KEY = 'sweldo_pulse_tour_done_v1';
const $ = id => document.getElementById(id), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const root = document.documentElement;
const p2 = n => String(n).padStart(2, '0');
const r2 = n => Math.round((+n || 0) * 100) / 100;
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONF = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const nf = new Intl.NumberFormat('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const peso = n => (n < 0 ? '-' : '') + '₱' + nf.format(Math.abs(+n || 0));
const MASK = '₱••••••';
const money = n => settings.hide ? MASK : peso(n);
const esc = s => String(s).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
const fh = n => (Math.round(n * 100) / 100) + 'h';
const setText = (el, t) => { if (el && el.textContent !== t) el.textContent = t; };
const setHTML = (el, h) => { if (el && el._h !== h) { el.innerHTML = h; el._h = h; } };

/* ================= dates ================= */
const dstr = d => `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`;
const today = () => dstr(new Date());
const pd = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const dayNum = s => { const [y, m, d] = s.split('-').map(Number); return Math.round(Date.UTC(y, m - 1, d) / 864e5); };
let _uid = 0;
function nextId() { const n = Date.now() * 100; _uid = Math.max(_uid + 1, n); return _uid; }
const tmin = t => { if (!t || !/^\d{1,2}:\d{2}$/.test(t)) return 0; const [h, m] = t.split(':').map(Number); return h * 60 + m; };
const t12 = t => { const [h, m] = t.split(':'); const H = +h; return `${H % 12 === 0 ? 12 : H % 12}:${m} ${H >= 12 ? 'PM' : 'AM'}`; };
const fmtDay = ds => { const d = pd(ds); return `${DOW[d.getDay()]}, ${MON[d.getMonth()]} ${d.getDate()}`; };

/* ================= state ================= */
let shifts = [], gigs = [], expenses = [], debts = [];
let settings = {
  hourlyRate: 73.75, calabarzonArea: '73.75', schedule: 'semi', sss: 0, philhealth: 0, pagibig: 0, tax: 0, otherDed: 0,
  accentTheme: 'indigo', darkMode: false, themeMode: '', budgetNeeds: 70, budgetWants: 20, budgetSavings: 10,
  notifEnabled: false, notifTime: '22:00', lastNotifDate: '', goal: 0, deductMode: 'first', statMinGross: 2000, mwe: true, autoDeduct: null, hide: false, payLag: 0, repo: '', lastUpd: 0,
  last: { start: '16:00', end: '22:00', brk: 0 },
  cutoffData: {}, customPresets: [], vaults: [], bills: [], incomeScope: 'all',
  autoDownloadUpd: true, updWifiOnly: true, autoBackup: true, lastAutoBk: 0,
  dueNotifEnabled: true, dueNotifTime: '09:00', planNudgeEnabled: true, maskWidgetWhenLocked: true, allowScreenshots: false,
  workProfile: 'crew', preHolidayRule: true, midnightHolidaySplit: true, ndRate: 0.10, otThreshold: 8, liteMode: 'auto', cardStyle: 'surface', notifiedUpdVer: '', updEtag: '', updCachedRel: null,
  rosterTemplates: [], activeTimer: null, jobs: [], activeJobId: ''
};
let selKey = '', periodKeys = [], curView = 'home';
const ui = { f: 'all', q: '', sort: 'desc', limit: 60, cal: false, calDay: '', budTab: 'overview', dueF: 'all', insTab: 'overview', insYear: new Date().getFullYear(), insMonth: new Date().getMonth() };
let editingId = null, editingGigId = null, editingVaultId = null, editingBillId = null, editingDebtId = null, modalKind = 'shift', modalBrk = 0, modalStatus = 'worked', modalGigStatus = 'paid', expCat = 'needs', billCat = 'needs', debtKind = 'paylater', budNet = 0, checkinShiftId = null;

const ACCENTS = {
  mono: { a: '#111827', ad: '#F8FAFC', fgd: '#0B0D12', h: '#030712', sl: '#EDF0F5', bl: '#CFD6E2', tl: '#111827', sd: 'rgba(248,250,252,.10)', bd: 'rgba(248,250,252,.22)', td: '#F8FAFC', g: 'rgba(15,23,42,.18)', w1: '#1C2029', w2: '#12151C', w3: '#0A0C10', lg: 'rgba(148,163,184,.14)', cl: '#111827', cd: '#F8FAFC' },
  midnight: { a: '#1E3A8A', ad: '#3B63C9', h: '#1E40AF', sl: '#EAF0FF', bl: '#BCCBF5', tl: '#1E3A8A', sd: 'rgba(59,99,201,.18)', bd: 'rgba(96,130,220,.34)', td: '#93B4FA', g: 'rgba(30,58,138,.26)', w1: '#1B2D5E', w2: '#132044', w3: '#0B1329', lg: 'rgba(59,99,201,.18)', cl: '#1E3A8A', cd: '#60A5FA' },
  forest: { a: '#166534', ad: '#10B981', h: '#14532D', sl: '#E8F7EE', bl: '#B6E3C6', tl: '#166534', sd: 'rgba(16,185,129,.16)', bd: 'rgba(16,185,129,.34)', td: '#6EE7B7', g: 'rgba(22,101,52,.26)', w1: '#123D2A', w2: '#0D2B1E', w3: '#071B12', lg: 'rgba(16,185,129,.16)', cl: '#15803D', cd: '#34D399' },
  graphite: { a: '#1F2937', ad: '#64748B', h: '#111827', sl: '#EEF1F5', bl: '#CBD2DC', tl: '#1F2937', sd: 'rgba(100,116,139,.18)', bd: 'rgba(148,163,184,.34)', td: '#CBD5E1', g: 'rgba(31,41,55,.26)', w1: '#232936', w2: '#171C26', w3: '#0E1118', lg: 'rgba(100,116,139,.18)', cl: '#334155', cd: '#94A3B8' },
  wine: { a: '#881337', ad: '#C5285A', h: '#6B0F2B', sl: '#FFF0F4', bl: '#F3BFCD', tl: '#881337', sd: 'rgba(197,40,90,.18)', bd: 'rgba(220,70,120,.34)', td: '#FDA4AF', g: 'rgba(136,19,55,.26)', w1: '#4D1429', w2: '#360D1D', w3: '#210711', lg: 'rgba(197,40,90,.18)', cl: '#9F1239', cd: '#FB7185' },
  teal: { a: '#0F766E', ad: '#14B8A6', h: '#115E59', sl: '#E6F7F5', bl: '#B3E0DB', tl: '#0F766E', sd: 'rgba(20,184,166,.16)', bd: 'rgba(20,184,166,.34)', td: '#5EEAD4', g: 'rgba(15,118,110,.26)', w1: '#103F3D', w2: '#0B2D2C', w3: '#061C1B', lg: 'rgba(20,184,166,.16)', cl: '#0F766E', cd: '#2DD4BF' },
  plum: { a: '#581C87', ad: '#8B5CF6', h: '#4A1773', sl: '#F5ECFD', bl: '#DDBFF3', tl: '#581C87', sd: 'rgba(139,92,246,.16)', bd: 'rgba(139,92,246,.34)', td: '#C4B5FD', g: 'rgba(88,28,135,.26)', w1: '#351952', w2: '#241138', w3: '#150922', lg: 'rgba(139,92,246,.18)', cl: '#6D28D9', cd: '#A78BFA' },
  indigo: { a: '#4F46E5', ad: '#6366F1', h: '#4338CA', sl: '#EEF2FF', bl: '#C7D2FE', tl: '#4338CA', sd: 'rgba(99,102,241,.16)', bd: 'rgba(99,102,241,.34)', td: '#A5B4FC', g: 'rgba(79,70,229,.24)', w1: '#23265A', w2: '#171A40', w3: '#0E1029', lg: 'rgba(99,102,241,.18)', cl: '#4F46E5', cd: '#818CF8' },
  purple: { a: '#7C3AED', ad: '#A855F7', h: '#6D28D9', sl: '#F5F3FF', bl: '#DDD6FE', tl: '#6D28D9', sd: 'rgba(168,85,247,.16)', bd: 'rgba(168,85,247,.34)', td: '#D8B4FE', g: 'rgba(124,58,237,.24)', w1: '#361A5C', w2: '#251142', w3: '#150928', lg: 'rgba(168,85,247,.18)', cl: '#7C3AED', cd: '#C084FC' },
  rose: { a: '#E11D48', ad: '#F43F5E', h: '#BE123C', sl: '#FFF1F2', bl: '#FECDD3', tl: '#BE123C', sd: 'rgba(244,63,94,.16)', bd: 'rgba(244,63,94,.34)', td: '#FDA4AF', g: 'rgba(225,29,72,.24)', w1: '#521527', w2: '#3B0E1C', w3: '#240811', lg: 'rgba(244,63,94,.18)', cl: '#E11D48', cd: '#FB7185' },
  amber: { a: '#D97706', ad: '#F59E0B', h: '#B45309', sl: '#FFFBEB', bl: '#FDE68A', tl: '#B45309', sd: 'rgba(245,158,11,.16)', bd: 'rgba(245,158,11,.34)', td: '#FCD34D', g: 'rgba(217,119,6,.24)', w1: '#4A2C0A', w2: '#331E07', w3: '#1F1204', lg: 'rgba(245,158,11,.16)', cl: '#D97706', cd: '#FBBF24' },
  emerald: { a: '#059669', ad: '#10B981', h: '#047857', sl: '#ECFDF5', bl: '#A7F3D0', tl: '#047857', sd: 'rgba(16,185,129,.16)', bd: 'rgba(16,185,129,.34)', td: '#6EE7B7', g: 'rgba(5,150,105,.24)', w1: '#0D3B2E', w2: '#092920', w3: '#051913', lg: 'rgba(16,185,129,.16)', cl: '#059669', cd: '#34D399' }
};

/* ================= 2026 DOLE PH Wage Presets & Work Situation Profiles ================= */
const PH_WAGE_PRESETS = {
  ncr_2027_nonagri: { rate: 97.50, daily: 780, chip: 'NCR 2027' },
  ncr_2027_retail: { rate: 92.88, daily: 743, chip: 'NCR 2027' },
  ncr_nonagri: { rate: 94.38, daily: 755, chip: 'NCR 2026' },
  ncr_retail: { rate: 89.75, daily: 718, chip: 'NCR 2026' },
  '80.63': { rate: 80.63, daily: 645, chip: 'Region IV-A' },
  '73.75': { rate: 73.75, daily: 590, chip: 'Region IV-A' },
  '68.75': { rate: 68.75, daily: 550, chip: 'Region IV-A' },
  r3_nonagri: { rate: 75.00, daily: 600, chip: 'Region III' },
  r6_nonagri: { rate: 73.75, daily: 590, chip: 'Region VI' },
  r7_classa: { rate: 72.75, daily: 582, chip: 'Region VII' },
  r11_nonagri: { rate: 67.50, daily: 540, chip: 'Region XI' }
};
const WORK_PROFILES = {
  crew: { label: 'Working Student / Part-Time Crew', schedule: 'semi', preHolidayRule: true, ndRate: 0.10, otThreshold: 8, autoDeduct: true, deductMode: 'first', statMinGross: 2000, mwe: true },
  fulltime: { label: 'Full-Time Hourly / Retail', schedule: 'semi', preHolidayRule: false, ndRate: 0.10, otThreshold: 8, autoDeduct: true, deductMode: 'split', statMinGross: 0, mwe: true },
  bpo: { label: 'BPO / Night Shift', schedule: 'semi25', preHolidayRule: false, ndRate: 0.15, otThreshold: 8, autoDeduct: true, deductMode: 'split', statMinGross: 0, mwe: false },
  weekly: { label: 'Daily-Paid / Weekly Worker', schedule: 'weekly', preHolidayRule: false, ndRate: 0.10, otThreshold: 8, autoDeduct: true, deductMode: 'split', statMinGross: 0, mwe: true },
  freelance: { label: 'Freelance / Side-Gig Focused', schedule: 'monthly', preHolidayRule: false, ndRate: 0, otThreshold: 0, autoDeduct: false, deductMode: 'split', statMinGross: 0, mwe: true }
};

function loadState() {
  let raw = null;
  try { raw = localStorage.getItem(SETTINGS_KEY); if (raw) settings = { ...settings, ...JSON.parse(raw) }; } catch (e) {}
  if (!settings.themeMode) settings.themeMode = raw ? (settings.darkMode ? 'dark' : 'light') : 'system';
  if (settings.autoDeduct === null || settings.autoDeduct === undefined) settings.autoDeduct = !(raw && (settings.sss + settings.philhealth + settings.pagibig + settings.tax) > 0);
  if (!settings.last || !settings.last.start) settings.last = { start: '16:00', end: '22:00', brk: 0 };
  const hadCutoffData = raw && JSON.parse(raw || '{}').cutoffData !== undefined;
  if (!settings.cutoffData || typeof settings.cutoffData !== 'object') settings.cutoffData = {};
  if (!Array.isArray(settings.customPresets)) settings.customPresets = [];
  if (!Array.isArray(settings.vaults)) settings.vaults = [];
  if (!Array.isArray(settings.bills)) settings.bills = [];
  if (settings.incomeScope !== 'payroll' && settings.incomeScope !== 'all') settings.incomeScope = 'all';
  if (!hadCutoffData && +settings.otherDed > 0) { const ck = curPeriod().key; settings.cutoffData[ck] = { ...(settings.cutoffData[ck] || {}), otherDed: +settings.otherDed }; settings.otherDed = 0; }
  if (settings.statMinGross === undefined || settings.statMinGross === null) settings.statMinGross = 2000;
  if (typeof settings.preHolidayRule !== 'boolean') settings.preHolidayRule = true;
  if (typeof settings.midnightHolidaySplit !== 'boolean') settings.midnightHolidaySplit = true;
  if (!Array.isArray(settings.rosterTemplates)) settings.rosterTemplates = [];
  if (!Array.isArray(settings.jobs)) settings.jobs = [];
  if (!isFinite(Number(settings.ndRate))) settings.ndRate = 0.10;
  if (!isFinite(Number(settings.otThreshold))) settings.otThreshold = 8;
  if (!['auto', 'on', 'off'].includes(settings.liteMode)) settings.liteMode = 'auto';
  if (!['surface', 'obsidian', 'tinted'].includes(settings.cardStyle)) settings.cardStyle = 'surface';
  if (!settings.workProfile) settings.workProfile = 'crew';
  let repairedIds = false;
  try { const rawS = JSON.parse(localStorage.getItem(SHIFTS_KEY) || '[]'); shifts = normalizeShifts(rawS, () => { repairedIds = true; }); } catch (e) { shifts = []; }
  try { gigs = normalizeGigs(JSON.parse(localStorage.getItem(GIGS_KEY) || '[]')); } catch (e) { gigs = []; }
  try { expenses = normalizeExpenses(JSON.parse(localStorage.getItem(EXP_KEY) || '[]')); } catch (e) { expenses = []; }
  try { debts = normalizeDebts(JSON.parse(localStorage.getItem(DEBTS_KEY) || '[]')); } catch (e) { debts = []; }
  ensureJobs();
  if (repairedIds) { safeSetItem(SHIFTS_KEY, JSON.stringify(shifts)); }
}
function uniqueIdOf(rawId, seen, onRepair) {
  const n = Number(rawId);
  if (Number.isSafeInteger(n) && n > 0 && !seen.has(n)) { seen.add(n); return n; }
  if (onRepair) onRepair();
  let id = nextId();
  while (seen.has(id)) id = nextId();
  seen.add(id);
  return id;
}
function normalizeShifts(arr, onRepair) {
  if (!Array.isArray(arr)) return [];
  const seen = new Set();
  return arr.filter(s => s && /^\d{4}-\d{2}-\d{2}$/.test(s.date) && isFinite(s.gross)).map(s => ({
    id: uniqueIdOf(s.id, seen, onRepair), date: s.date, startTime: s.startTime || '', endTime: s.endTime || '', note: s.note || '',
    hourlyRate: +s.hourlyRate || settings.hourlyRate, reg: +s.reg || 0, nd: +s.nd || 0, ot: +s.ot || 0, multiplier: +s.multiplier || 1,
    gross: +s.gross || 0, ndPay: s.ndPay === undefined ? undefined : +s.ndPay, breakMin: +s.breakMin || 0,
    status: (s.status === 'worked' || s.status === 'scheduled' || s.status === 'cancelled') ? s.status : ''
  }));
}
function normalizeGigs(arr) {
  if (!Array.isArray(arr)) return [];
  const seen = new Set();
  return arr.filter(g => g && /^\d{4}-\d{2}-\d{2}$/.test(g.date) && isFinite(g.amount)).map(g => ({
    id: uniqueIdOf(g.id, seen), date: g.date,
    startTime: /^\d{2}:\d{2}$/.test(g.startTime || '') ? g.startTime : '',
    endTime: /^\d{2}:\d{2}$/.test(g.endTime || '') ? g.endTime : '',
    stream: String(g.stream || 'Side Gig').trim() || 'Side Gig',
    title: String(g.title || '').trim(), amount: r2(Math.max(0, +g.amount || 0)), status: g.status === 'pending' ? 'pending' : 'paid',
    dueDate: /^\d{4}-\d{2}-\d{2}$/.test(g.dueDate || '') ? g.dueDate : ''
  }));
}
function normalizeExpenses(arr) {
  if (!Array.isArray(arr)) return [];
  const seen = new Set();
  return arr.filter(x => x && /^\d{4}-\d{2}-\d{2}$/.test(x.date) && isFinite(x.amount)).map(x => ({
    id: uniqueIdOf(x.id, seen), date: x.date, cat: x.cat === 'wants' ? 'wants' : 'needs',
    note: String(x.note || '').trim() || 'Expense', amount: r2(Math.max(0, +x.amount || 0)),
    billId: x.billId || null
  }));
}
const shiftStatusOf = s => s.status || (s.date > today() ? 'scheduled' : 'worked');
const isShiftActive = s => shiftStatusOf(s) !== 'cancelled';
let dv = 0, _idx = null, _idxV = -1, _gidx = null, _gidxV = -1, _eidx = null, _eidxV = -1; const _pdc = new Map();
let _psT = 0;
let _quotaWarnAt = 0;
function safeSetItem(key, val) {
  try { localStorage.setItem(key, val); return true; }
  catch (e) {
    try {
      Object.keys(localStorage).filter(k => k.startsWith('sp_snapshot_')).forEach(k => localStorage.removeItem(k));
      localStorage.setItem(key, val);
      return true;
    } catch (e2) {
      if (Date.now() - _quotaWarnAt > 15000) {
        _quotaWarnAt = Date.now();
        if (typeof toast === 'function') toast('Storage almost full — export a backup to avoid losing logs');
      }
      return false;
    }
  }
}
const persistShifts = () => { dv++; safeSetItem(SHIFTS_KEY, JSON.stringify(shifts)); scheduleAutoBackup(); syncDueAndPlanAlarms(); };
const persistGigs = () => { dv++; safeSetItem(GIGS_KEY, JSON.stringify(gigs)); scheduleAutoBackup(); };
function normalizeDebts(arr) {
  if (!Array.isArray(arr)) return [];
  const seen = new Set();
  return arr.filter(d => d && d.name && isFinite(d.amount)).map(d => {
    const amt = r2(Math.max(0, +d.amount || 0));
    const kind = (d.kind === 'owe' || d.kind === 'owed') ? d.kind : 'paylater';
    const paidAmt = kind === 'paylater' ? 0 : r2(Math.min(amt, Math.max(0, +d.paidAmount || 0)));
    const payments = Array.isArray(d.payments) ? d.payments.filter(p => p && isFinite(p.amount) && +p.amount > 0).map(p => ({ date: String(p.date || ''), amount: r2(+p.amount) })) : [];
    return {
      id: uniqueIdOf(d.id, seen), kind, name: String(d.name).trim(), amount: amt,
      dueDate: /^\d{4}-\d{2}-\d{2}$/.test(d.dueDate || '') ? d.dueDate : '',
      paidTerms: Math.max(0, parseInt(d.paidTerms, 10) || 0),
      totalTerms: Math.max(1, parseInt(d.totalTerms, 10) || 1),
      paidAmount: paidAmt, payments,
      note: String(d.note || '').trim(),
      settled: !!d.settled
    };
  });
}
function debtRemaining(d) {
  if (!d || d.settled) return 0;
  if (d.kind === 'paylater') return r2(d.amount * Math.max(1, d.totalTerms - d.paidTerms));
  return r2(Math.max(0, d.amount - (+d.paidAmount || 0)));
}
const persistExpenses = () => { dv++; safeSetItem(EXP_KEY, JSON.stringify(expenses)); scheduleAutoBackup(); };
const persistDebts = () => { dv++; safeSetItem(DEBTS_KEY, JSON.stringify(debts)); scheduleAutoBackup(); syncDueAndPlanAlarms(); };
const persistSettings = () => { dv++; if (_psT) { clearTimeout(_psT); _psT = 0; } syncActiveJobFromSettings(); safeSetItem(SETTINGS_KEY, JSON.stringify(settings)); };
const persistSettingsDebounced = () => { dv++; clearTimeout(_psT); _psT = setTimeout(() => { _psT = 0; syncActiveJobFromSettings(); safeSetItem(SETTINGS_KEY, JSON.stringify(settings)); }, 220); };
const flushSettings = () => { if (_psT) { clearTimeout(_psT); _psT = 0; syncActiveJobFromSettings(); safeSetItem(SETTINGS_KEY, JSON.stringify(settings)); } };
document.addEventListener('visibilitychange', () => { if (document.hidden) flushSettings(); });
window.addEventListener('pagehide', flushSettings);

/* ================= theme ================= */
const mq = window.matchMedia ? matchMedia('(prefers-color-scheme: dark)') : null;
const isDark = () => settings.themeMode === 'dark' || settings.themeMode === 'amoled' || (settings.themeMode === 'system' && mq && mq.matches);
function isLowEndHardware() {
  try { if (window.AndroidBridge && typeof AndroidBridge.isLowRamDevice === 'function' && AndroidBridge.isLowRamDevice()) return true; } catch (e) {}
  return !!((navigator.deviceMemory && navigator.deviceMemory <= 4) || (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4));
}
function isLiteActive() {
  const m = settings.liteMode || 'auto';
  return m === 'on' || (m === 'auto' && isLowEndHardware());
}
function applyLiteMode() {
  const on = isLiteActive();
  root.classList.toggle('lite', on);
  if ($('set-lite')) $('set-lite').value = settings.liteMode || 'auto';
  if ($('lite-sub')) setText($('lite-sub'), settings.liteMode === 'auto' ? (on ? 'Auto: Lite active for smoother speed on this device' : 'Auto: Full animations active') : (on ? 'Lite mode active — minimal GPU load' : 'Full animations active'));
}
function setLiteMode(val) {
  settings.liteMode = ['auto', 'on', 'off'].includes(val) ? val : 'auto';
  persistSettings(); applyLiteMode();
  toast(isLiteActive() ? 'Lite motion enabled for smoother performance' : 'Full animations enabled');
}
function setCardStyle(mode) {
  settings.cardStyle = ['surface', 'obsidian', 'tinted'].includes(mode) ? mode : 'surface';
  persistSettings(); applyTheme();
  const names = { surface: 'Surface (clean banking)', obsidian: 'Obsidian (dark card)', tinted: 'Tinted (matte accent)' };
  toast(`Card finish: ${names[settings.cardStyle]}`);
}
function applyTheme(first) {
  const tsvg = document.querySelector('.theme-svg');
  if (first && tsvg) { tsvg.classList.add('no-t'); requestAnimationFrame(() => requestAnimationFrame(() => tsvg.classList.remove('no-t'))); }
  const dark = isDark(), P = ACCENTS[settings.accentTheme] || ACCENTS.indigo, st = root.style;
  const cs = settings.cardStyle || 'surface';
  root.classList.toggle('dark', dark); root.classList.toggle('amoled', settings.themeMode === 'amoled');
  root.classList.toggle('card-obsidian', cs === 'obsidian'); root.classList.toggle('card-tinted', cs === 'tinted');
  st.setProperty('--accent', dark && P.ad ? P.ad : P.a); st.setProperty('--accent-hover', P.h);
  st.setProperty('--btn-primary-fg', (dark && P.fgd) ? P.fgd : '#FFFFFF');
  st.setProperty('--accent-soft', dark ? P.sd : P.sl); st.setProperty('--accent-soft-border', dark ? P.bd : P.bl);
  st.setProperty('--accent-text', dark ? P.td : P.tl); st.setProperty('--accent-glow', P.g);
  const darkChart = dark || cs === 'obsidian';
  st.setProperty('--chart-line', darkChart ? (P.cd || P.ad || P.a) : (P.cl || P.a));
  st.setProperty('--w-g1', P.w1 || P.a); st.setProperty('--w-g2', P.w2 || P.a); st.setProperty('--w-g3', P.w3 || P.h);
  st.setProperty('--lock-glow', dark ? (P.lg || P.sd) : 'rgba(15,23,42,.06)');
  applyLiteMode();
  const barBg = settings.themeMode === 'amoled' ? '#000000' : (dark ? '#0B0D12' : '#F4F5F8');
  const m = $('meta-theme'); if (m) m.setAttribute('content', barBg);
  if (window.AndroidBridge && typeof AndroidBridge.setSystemBars === 'function') { try { AndroidBridge.setSystemBars(barBg, dark); } catch (e) {} }
  const cut = $('moon-cutout'); if (cut) { cut.setAttribute('cx', dark ? '16.5' : '24'); cut.setAttribute('cy', dark ? '8.5' : '4'); cut.setAttribute('r', dark ? '5.2' : '0'); }
  $$('#theme-seg button').forEach(b => b.classList.toggle('on', b.dataset.m === settings.themeMode));
  $$('#card-style-seg button').forEach(b => b.classList.toggle('on', b.dataset.cs === cs));
  $$('.theme-sw').forEach(b => b.classList.toggle('on', b.dataset.theme === settings.accentTheme));
  if (!first && typeof syncWidget === 'function') syncWidget();
}
let themeBusy = false;
function switchTheme(apply, origin) {
  const vt = document.startViewTransition;
  if (!vt || themeBusy || isLiteActive() || (matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches)) { apply(); return; }
  const r = origin && origin.getBoundingClientRect ? origin.getBoundingClientRect() : null;
  const x = r ? r.left + r.width / 2 : innerWidth - 36, y = r ? r.top + r.height / 2 : 36;
  const maxR = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
  const done = () => { themeBusy = false; };
  themeBusy = true; setTimeout(done, 900);
  try {
    const t = vt.call(document, () => { apply(); });
    t.ready.then(() => document.documentElement.animate({ clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${maxR}px at ${x}px ${y}px)`] }, { duration: 230, easing: 'cubic-bezier(.3,0,.2,1)', pseudoElement: '::view-transition-new(root)' })).catch(() => {});
    t.finished.then(done, done);
  } catch (e) { done(); apply(); }
}
function toggleDark(el) { switchTheme(() => { settings.themeMode = isDark() ? 'light' : 'dark'; persistSettings(); applyTheme(); }, el); }
function setThemeMode(m, el) { if (settings.themeMode === m) return; switchTheme(() => { settings.themeMode = m; persistSettings(); applyTheme(); }, el); }
function setAccent(k) { if (!ACCENTS[k]) return; settings.accentTheme = k; persistSettings(); applyTheme(); }
if (mq && mq.addEventListener) mq.addEventListener('change', () => { if (settings.themeMode === 'system') applyTheme(); });

/* ================= periods ================= */
const _pm = new Map();
function periodOf(ds, sch = settings.schedule) {
  const ck = sch + ds; if (_pm.has(ck)) return _pm.get(ck);
  const d = pd(ds), y = d.getFullYear(), m = d.getMonth(), day = d.getDate();
  let s, e, key, badge;
  if (sch === 'monthly') { s = new Date(y, m, 1); e = new Date(y, m + 1, 0); key = `${y}-${p2(m + 1)}`; badge = 'Monthly'; }
  else if (sch === 'weekly') { const dow = (d.getDay() + 6) % 7; s = new Date(y, m, day - dow); e = new Date(y, m, day - dow + 6); key = dstr(s); badge = 'Weekly'; }
  else if (sch === 'semi25') {
    if (day >= 11 && day <= 25) { s = new Date(y, m, 11); e = new Date(y, m, 25); key = `${y}-${p2(m + 1)}-25`; badge = '2nd cutoff'; }
    else if (day <= 10) { s = new Date(y, m - 1, 26); e = new Date(y, m, 10); key = `${y}-${p2(m + 1)}-10`; badge = '1st cutoff'; }
    else { const ny = m === 11 ? y + 1 : y, nm = (m + 1) % 12; s = new Date(y, m, 26); e = new Date(ny, nm, 10); key = `${ny}-${p2(nm + 1)}-10`; badge = '1st cutoff'; }
  }
  else if (day <= 15) { s = new Date(y, m, 1); e = new Date(y, m, 15); key = `${y}-${p2(m + 1)}-1`; badge = '1st cutoff'; }
  else { s = new Date(y, m, 16); e = new Date(y, m + 1, 0); key = `${y}-${p2(m + 1)}-2`; badge = '2nd cutoff'; }
  let label;
  if (sch === 'monthly') label = `${MONF[m]} ${y}`;
  else if (s.getMonth() === e.getMonth()) label = `${MON[s.getMonth()]} ${s.getDate()} – ${e.getDate()}, ${e.getFullYear()}`;
  else label = `${MON[s.getMonth()]} ${s.getDate()} – ${MON[e.getMonth()]} ${e.getDate()}, ${e.getFullYear()}`;
  const P = { key, badge, label, start: s, end: e, startStr: dstr(s), endStr: dstr(e), sort: dayNum(dstr(s)) };
  _pm.set(ck, P); return P;
}
function periodFromKey(key) {
  let m;
  if ((m = key.match(/^(\d{4})-(\d{2})-10$/))) return periodOf(`${m[1]}-${m[2]}-10`, 'semi25');
  if ((m = key.match(/^(\d{4})-(\d{2})-25$/))) return periodOf(`${m[1]}-${m[2]}-25`, 'semi25');
  if ((m = key.match(/^(\d{4})-(\d{2})-([12])$/))) return periodOf(`${m[1]}-${m[2]}-${m[3] === '1' ? '01' : '16'}`, 'semi');
  if ((m = key.match(/^(\d{4})-(\d{2})-(\d{2})$/))) return periodOf(key, 'weekly');
  if ((m = key.match(/^(\d{4})-(\d{2})$/))) return periodOf(`${key}-01`, 'monthly');
  return periodOf(today());
}
const curPeriod = () => periodOf(today());
function shiftsIn(key) {
  if (_idxV !== dv || !_idx) { _idx = new Map(); shifts.forEach(s => { const k = periodOf(s.date).key; (_idx.get(k) || _idx.set(k, []).get(k)).push(s); }); _idxV = dv; _pdc.clear(); }
  return (_idx.get(key) || []).slice();
}
function gigsIn(key) {
  if (_gidxV !== dv || !_gidx) { _gidx = new Map(); gigs.forEach(g => { const k = periodOf(g.date).key; (_gidx.get(k) || _gidx.set(k, []).get(k)).push(g); }); _gidxV = dv; }
  return (_gidx.get(key) || []).slice();
}
function expensesIn(key) {
  if (_eidxV !== dv || !_eidx) { _eidx = new Map(); expenses.forEach(e => { const k = periodOf(e.date).key; (_eidx.get(k) || _eidx.set(k, []).get(k)).push(e); }); _eidxV = dv; }
  return (_eidx.get(key) || []).slice();
}
let _bpSig = '';
function buildPeriods() {
  const cur = curPeriod();
  if (!selKey) selKey = cur.key;
  const sig = `${dv}|${selKey}|${cur.key}|${settings.schedule}`;
  if (sig === _bpSig) return;
  _bpSig = sig;
  let hi = cur, lo = cur;
  shifts.forEach(s => { const p = periodOf(s.date); if (p.sort > hi.sort) hi = p; if (p.sort < lo.sort) lo = p; });
  gigs.forEach(g => { const p = periodOf(g.date); if (p.sort > hi.sort) hi = p; if (p.sort < lo.sort) lo = p; });
  expenses.forEach(e => { const p = periodOf(e.date); if (p.sort > hi.sort) hi = p; if (p.sort < lo.sort) lo = p; });
  const sp = periodFromKey(selKey); if (sp.sort > hi.sort) hi = sp; if (sp.sort < lo.sort) lo = sp;
  const keys = []; let p = hi, guard = 0;
  while (guard++ < 80) { keys.push(p.key); if (p.sort <= lo.sort) break; p = periodOf(dstr(addDays(p.start, -1))); }
  periodKeys = keys;
  const counts = {}; shifts.forEach(s => { const k = periodOf(s.date).key; counts[k] = (counts[k] || 0) + 1; });
  const html = keys.map(k => { const P = periodFromKey(k), n = counts[k] || 0; return `<option value="${k}">${P.label}${k === cur.key ? ' • Current' : ''}${n ? ` • ${n}` : ''}</option>`; }).join('');
  const P = periodFromKey(selKey);
  $$('[data-period-select]').forEach(sel => { setHTML(sel, html); sel.value = selKey; });
  $$('[data-period-label]').forEach(el => setText(el, P.label));
  $$('[data-jump-cur]').forEach(el => el.classList.toggle('hidden', selKey === cur.key));
}
function jumpCurrent() { const k = curPeriod().key; if (selKey === k) return; selKey = k; ui.limit = 60; ui.calDay = ''; render(); replayEnter(); }
function selectPeriod(k) { selKey = k; ui.limit = 60; ui.calDay = ''; render(); replayEnter(); }
function stepPeriod(dir) {
  const i = periodKeys.indexOf(selKey), j = i - dir;
  if (j >= 0 && j < periodKeys.length) { selKey = periodKeys[j]; ui.limit = 60; ui.calDay = ''; render(); replayEnter(); }
  else toast(dir < 0 ? 'No earlier cutoffs yet' : "That's the latest cutoff");
}

/* ================= holidays (PH) ================= */
const HOL_FIXED = { '01-01': ["New Year's Day", 2], '04-09': ['Araw ng Kagitingan', 2], '05-01': ['Labor Day', 2], '06-12': ['Independence Day', 2], '11-30': ['Bonifacio Day', 2], '12-25': ['Christmas Day', 2], '12-30': ['Rizal Day', 2],
  '08-21': ['Ninoy Aquino Day', 1.3], '11-01': ["All Saints' Day", 1.3], '12-08': ['Immaculate Conception', 1.3], '12-31': ['Last Day of the Year', 1.3] };
const HOL_YEAR = {
  2026: { '02-17': ['Chinese New Year', 1.3], '03-20': ["Eid'l Fitr", 2], '04-02': ['Maundy Thursday', 2], '04-03': ['Good Friday', 2], '04-04': ['Black Saturday', 1.3], '05-27': ["Eid'l Adha", 2], '11-02': ["All Souls' Day", 1.3], '12-24': ['Christmas Eve', 1.3] },
  2027: { '02-06': ['Chinese New Year', 1.3], '03-10': ["Eid'l Fitr", 2], '03-25': ['Maundy Thursday', 2], '03-26': ['Good Friday', 2], '03-27': ['Black Saturday', 1.3], '05-17': ["Eid'l Adha", 2], '11-02': ["All Souls' Day", 1.3], '12-24': ['Christmas Eve', 1.3] },
  2028: { '01-26': ['Chinese New Year', 1.3], '02-27': ["Eid'l Fitr", 2], '04-13': ['Maundy Thursday', 2], '04-14': ['Good Friday', 2], '04-15': ['Black Saturday', 1.3], '05-05': ["Eid'l Adha", 2], '11-02': ["All Souls' Day", 1.3], '12-24': ['Christmas Eve', 1.3] }
};
function baseHolidayFor(ds) {
  if (!ds || !/^\d{4}-\d{2}-\d{2}$/.test(ds)) return null;
  const y = +ds.slice(0, 4), md = ds.slice(5), d = pd(ds);
  const h = (HOL_YEAR[y] && HOL_YEAR[y][md]) || HOL_FIXED[md];
  if (h) return { name: h[0], mult: h[1], kind: h[1] >= 2 ? 'regular' : 'special' };
  if (d.getMonth() === 7 && d.getDay() === 1 && d.getDate() + 7 > 31) return { name: 'National Heroes Day', mult: 2, kind: 'regular' };
  return null;
}
function holidayFor(ds) {
  const cur = baseHolidayFor(ds);
  if (cur) return cur;
  // Day before any Regular Holiday (2.0x) is auto-detected as 1.30x when Pre-Holiday rule is enabled
  if (settings.preHolidayRule === false) return null;
  if (!ds || !/^\d{4}-\d{2}-\d{2}$/.test(ds)) return null;
  const nextDs = dstr(addDays(pd(ds), 1));
  const nextHol = baseHolidayFor(nextDs);
  if (nextHol && nextHol.mult >= 2) {
    return { name: `Day before ${nextHol.name}`, mult: 1.3, kind: 'preholiday', holidayName: nextHol.name };
  }
  return null;
}
function holidayBadgeText(h) {
  if (!h) return '';
  if (h.kind === 'regular' || h.mult >= 2) return `${h.name} · Regular holiday (2×)`;
  if (h.kind === 'preholiday') return `${h.name} · Pre-holiday duty (1.3×)`;
  return `${h.name} · Special non-working holiday (1.3×)`;
}
function unappliedHolidayShifts(key) {
  return shiftsIn(key).filter(s => {
    if (!isShiftActive(s)) return false;
    const h = holidayFor(s.date);
    return !!(h && s.multiplier < h.mult - 0.005);
  });
}
function updateHolidayFixBanners() {
  const miss = unappliedHolidayShifts(selKey);
  const show = miss.length > 0;
  const names = [...new Set(miss.map(s => (holidayFor(s.date) || {}).name).filter(Boolean))].slice(0, 2).join(', ');
  const t = `${miss.length} shift${miss.length > 1 ? 's' : ''} missing holiday rate`;
  const sub = `${names}${miss.length > 2 ? ' & more' : ''} — tap to apply 1.3× / 2×`;
  [['hol-fix-shifts', 'hf-s-t', 'hf-s-s'], ['hol-fix-payslip', 'hf-p-t', 'hf-p-s']].forEach(([barId, tId, sId]) => {
    const bar = $(barId); if (!bar) return;
    bar.classList.toggle('hidden', !show);
    if (show) { setText($(tId), t); setText($(sId), sub); }
  });
}
function fixCutoffHolidays() {
  const miss = unappliedHolidayShifts(selKey);
  if (!miss.length) return toast('All holiday shifts are already updated');
  const prev = miss.map(s => ({ id: s.id, mult: s.multiplier, date: s.date }));
  const days = new Set();
  miss.forEach(s => {
    const h = holidayFor(s.date);
    if (h) { s.multiplier = h.mult; days.add(s.date); }
  });
  days.forEach(ds => { recalcDay(ds); unlockCutoffSnapshot(periodOf(ds).key, true); });
  persistSettings(); persistShifts(); render();
  toast(`Updated ${miss.length} holiday shift${miss.length > 1 ? 's' : ''} ✓`, {
    label: 'Undo',
    fn: () => {
      prev.forEach(p => { const s = shifts.find(x => x.id === p.id); if (s) s.multiplier = p.mult; });
      days.forEach(recalcDay); persistShifts(); render(); toast('Holiday update undone');
    }
  });
}

/* ================= O(1) exact interval pay engine ================= */
function ndOverlapMin(a, b) {
  if (b <= a) return 0;
  // Night window (10:00 PM – 6:00 AM) across [0, 4320): [0,360), [1320,1800), [2760,3240)
  let tot = 0;
  if (a < 360) tot += Math.max(0, Math.min(b, 360) - Math.max(a, 0));
  if (b > 1320 && a < 1800) tot += Math.max(0, Math.min(b, 1800) - Math.max(a, 1320));
  if (b > 2760 && a < 3240) tot += Math.max(0, Math.min(b, 3240) - Math.max(a, 2760));
  return tot;
}
function nextDayMultFor(ds) {
  if (!ds || !/^\d{4}-\d{2}-\d{2}$/.test(ds)) return null;
  const nextHol = holidayFor(dstr(addDays(pd(ds), 1)));
  return nextHol ? nextHol.mult : 1;
}
function calcPay({ start, end, mult, rate, brk = 0, prior = 0, ndRate = null, otHrs = null, nextMult = null }) {
  let s = tmin(start), e = tmin(end);
  if (s === e) return null;
  if (e < s) e += 1440;
  const span = e - s;
  brk = Math.min(brk, Math.max(0, span - 1));
  const bs = s + Math.floor((span - brk) / 2), be = bs + brk;
  const rawSegs = brk > 0 ? [[s, bs], [be, e]] : [[s, e]];
  const splitActive = nextMult !== null && Math.abs(nextMult - mult) > 0.001 && e > 1440;
  const segs = [];
  for (let i = 0; i < rawSegs.length; i++) {
    const a = rawSegs[i][0], b = rawSegs[i][1];
    if (b <= a) continue;
    if (splitActive && a < 1440 && b > 1440) {
      segs.push([a, 1440, mult], [1440, b, nextMult]);
    } else {
      segs.push([a, b, (splitActive && a >= 1440) ? nextMult : mult]);
    }
  }
  const nr = ndRate !== null ? Math.max(0, +ndRate || 0) : Math.max(0, +(settings.ndRate ?? 0.10) || 0);
  const otH = otHrs !== null ? +otHrs : (+(settings.otThreshold ?? 8));
  const otMin = otH > 0 ? Math.round(otH * 60) : 1e9;
  let done = Math.round(prior * 60), reg = 0, ot = 0, ndTot = 0, gross = 0, ndPay = 0;
  for (let i = 0; i < segs.length; i++) {
    const a = segs[i][0], b = segs[i][1], m = segs[i][2], len = b - a;
    if (len <= 0) continue;
    const base = rate * m / 60, otRate = base * (m > 1 ? 1.30 : 1.25);
    const rLen = Math.min(len, Math.max(0, otMin - done));
    const oLen = len - rLen;
    let ndR = 0, ndO = 0;
    if (rLen > 0) { reg += rLen; ndR = ndOverlapMin(a, a + rLen); }
    if (oLen > 0) { ot += oLen; ndO = ndOverlapMin(a + rLen, b); }
    gross += rLen * base + oLen * otRate;
    ndPay += (ndR * base + ndO * otRate) * nr;
    ndTot += ndR + ndO;
    done += len;
  }
  return { reg: r2(reg / 60), ot: r2(ot / 60), nd: r2(ndTot / 60), ndPay: r2(ndPay), gross: r2(gross + ndPay), paid: (reg + ot) / 60, splitApplied: splitActive, nextMult: splitActive ? nextMult : mult };
}
function recalcDay(date) {
  const list = shifts.filter(s => s.date === date && s.startTime && s.endTime).sort((a, b) => tmin(a.startTime) - tmin(b.startTime) || a.id - b.id);
  const nm = settings.midnightHolidaySplit !== false ? nextDayMultFor(date) : null;
  let prior = 0;
  list.forEach(s => {
    const active = isShiftActive(s);
    const r = calcPay({ start: s.startTime, end: s.endTime, mult: s.multiplier, rate: s.hourlyRate, brk: s.breakMin || 0, prior: active ? prior : 0, nextMult: nm });
    if (!r) return; s.reg = r.reg; s.ot = r.ot; s.nd = r.nd; s.ndPay = r.ndPay; s.gross = r.gross;
    if (active) prior += r.paid;
  });
}
const ndPayOf = s => s.ndPay !== undefined ? s.ndPay : s.nd * s.hourlyRate * s.multiplier * 0.10;
function totals(list) {
  const active = list.filter(isShiftActive);
  const t = { gross: 0, basic: 0, nd: 0, otp: 0, reg: 0, ndH: 0, otH: 0, n: active.length };
  active.forEach(s => { t.gross += s.gross; t.basic += s.reg * s.hourlyRate; t.nd += ndPayOf(s); t.reg += s.reg; t.ndH += s.nd; t.otH += s.ot; });
  t.gross = r2(t.gross); t.basic = r2(t.basic); t.nd = r2(t.nd); t.otp = r2(Math.max(0, t.gross - t.basic - t.nd)); t.hrs = t.reg + t.otH; return t;
}

/* ================= statutory & tax (2026 PH Crew Accurate) ================= */
function estimateStatutory(key, gross, basic) {
  const sch = settings.schedule, perMonth = sch === 'monthly' ? 1 : (sch === 'weekly' ? 52 / 12 : 2);
  const basePay = (basic !== undefined && basic > 0) ? basic : gross;
  const isSemi = sch === 'semi' || sch === 'semi25';
  const isFirst = (sch === 'semi' && /-1$/.test(key)) || (sch === 'semi25' && /-10$/.test(key));
  const isSecond = (sch === 'semi' && /-2$/.test(key)) || (sch === 'semi25' && /-25$/.test(key));
  const ym = dstr(periodFromKey(key).end).slice(0, 7);
  // For 1st semi-monthly cutoff, never pull in 2nd-cutoff shifts retroactively;
  // For 2nd cutoff (both 1-15/16-end and 26-10/11-25), combine exact 1st + 2nd cutoff shifts
  let monthly, monthlyBasic;
  if (isFirst) {
    monthly = gross * 2;
    monthlyBasic = basePay * 2;
  } else if (isSemi && isSecond) {
    const firstKey = sch === 'semi25' ? key.replace(/-25$/, '-10') : key.replace(/-2$/, '-1');
    const paired = [...shiftsIn(firstKey), ...shiftsIn(key)].filter(isShiftActive);
    const monthActual = paired.reduce((a, s) => a + s.gross, 0);
    const monthBasicActual = paired.reduce((a, s) => a + s.reg * s.hourlyRate, 0);
    monthly = Math.max(monthActual, gross * perMonth);
    monthlyBasic = Math.max(monthBasicActual, basePay * perMonth);
  } else {
    const monthActual = shifts.filter(s => s.date.startsWith(ym) && isShiftActive(s)).reduce((a, s) => a + s.gross, 0);
    const monthBasicActual = shifts.filter(s => s.date.startsWith(ym) && isShiftActive(s)).reduce((a, s) => a + s.reg * s.hourlyRate, 0);
    monthly = Math.max(monthActual, gross * perMonth);
    monthlyBasic = Math.max(monthBasicActual, basePay * perMonth);
  }
  const msc = Math.min(35000, Math.max(5000, Math.floor((monthly + 250) / 500) * 500));
  const sssM = msc * 0.05;
  const phM = Math.min(100000, Math.max(10000, monthlyBasic)) * 0.025;
  // Pag-IBIG: 2% of Basic Pay per cutoff (1% if monthly basic <= 1,500), capped at 200/month
  const piRate = monthlyBasic <= 1500 ? 0.01 : 0.02;
  const piCap = 200 / perMonth;
  const pi = r2(Math.min(piCap, basePay * piRate));
  const piM = Math.min(200, monthlyBasic * piRate);

  const mode = settings.deductMode || 'first';
  const minG = Math.max(0, +(settings.statMinGross ?? 2000) || 0);
  let f = 1 / perMonth, skippedLow = false, deferred = false, sssNote = '';

  if (isSemi) {
    if (mode === 'first') {
      if (isFirst) {
        if (minG > 0 && gross < minG) { f = 0; skippedLow = true; sssNote = `below ${peso(minG)}`; }
        else { f = 1; sssNote = '1st cutoff'; }
      } else {
        const firstKey = sch === 'semi25' ? key.replace(/-25$/, '-10') : key.replace(/-2$/, '-1');
        const firstGross = shiftsIn(firstKey).filter(isShiftActive).reduce((a, s) => a + s.gross, 0);
        const firstPaidStat = minG > 0 ? (firstGross >= minG) : (firstGross > 0);
        if (!firstPaidStat) {
          if (minG > 0 && gross < minG) { f = 0; skippedLow = true; sssNote = `below ${peso(minG)}`; }
          else { f = 1; deferred = firstGross > 0; sssNote = firstGross > 0 ? 'deferred from 1st' : '2nd cutoff catch-up'; }
        } else {
          f = 0; sssNote = 'paid on 1st';
        }
      }
    } else if (mode === 'last') {
      if (isSecond) {
        if (minG > 0 && gross < minG) { f = 0; skippedLow = true; sssNote = `below ${peso(minG)}`; }
        else { f = 1; sssNote = '2nd cutoff'; }
      } else {
        f = 0; sssNote = '2nd cutoff only';
      }
    } else {
      if (minG > 0 && gross < minG) { f = 0; skippedLow = true; sssNote = `below ${peso(minG)}`; }
      else { f = 0.5; sssNote = 'split 50%'; }
    }
  } else {
    if (minG > 0 && gross < minG) { f = 0; skippedLow = true; sssNote = `below ${peso(minG)}`; }
  }

  let taxM = 0;
  if (!settings.mwe) {
    const t = Math.max(0, monthly - sssM - phM - piM) * 12;
    const a = t <= 250000 ? 0 : t <= 400000 ? (t - 250000) * .15 : t <= 800000 ? 22500 + (t - 400000) * .20 : t <= 2000000 ? 102500 + (t - 800000) * .25 : t <= 8000000 ? 402500 + (t - 2000000) * .30 : 2202500 + (t - 8000000) * .35;
    taxM = a / 12;
  }
  return { sss: r2(sssM * f), ph: r2(phM * f), pi, tax: r2(taxM / perMonth), monthly, msc, f, skippedLow, deferred, sssNote, piRate };
}
const getCutoffExtra = key => (settings.cutoffData && settings.cutoffData[key]) || {};
function ensureCutoffExtra(key) { if (!settings.cutoffData || typeof settings.cutoffData !== 'object') settings.cutoffData = {}; if (!settings.cutoffData[key]) settings.cutoffData[key] = {}; return settings.cutoffData[key]; }
const getAllowance = key => r2(Math.max(0, +getCutoffExtra(key).allowance || 0));
const getOtherDed = key => r2(Math.max(0, +(getCutoffExtra(key).otherDed !== undefined ? getCutoffExtra(key).otherDed : 0) || 0));
const getManualDed = key => { const m = getCutoffExtra(key).manual; return m ? { sss: +m.sss || 0, ph: +m.ph || 0, pi: +m.pi || 0, tax: +m.tax || 0 } : { sss: +settings.sss || 0, ph: +settings.philhealth || 0, pi: +settings.pagibig || 0, tax: +settings.tax || 0 }; };
const getActualNet = key => { const v = getCutoffExtra(key).actualNet; return (v === null || v === undefined || v === '') ? null : r2(Math.max(0, +v)); };
function deductionsFor(key, gross, allow = 0, basic = 0) {
  const z = { sss: 0, ph: 0, pi: 0, tax: 0, oth: 0, total: 0, est: null };
  const grossAll = r2(gross + allow);
  if (grossAll <= 0) return z;
  let d;
  if (settings.autoDeduct) {
    if (gross > 0) { const e = estimateStatutory(key, gross, basic); d = { sss: e.sss, ph: e.ph, pi: e.pi, tax: e.tax, est: e }; }
    else d = { sss: 0, ph: 0, pi: 0, tax: 0, est: null };
  } else {
    const m = getManualDed(key); d = { sss: m.sss, ph: m.ph, pi: m.pi, tax: m.tax, est: null };
  }
  d.oth = getOtherDed(key);
  let tot = d.sss + d.ph + d.pi + d.tax + d.oth;
  if (tot > grossAll) { // deductions can never exceed total earnings in the cutoff
    const f = grossAll / tot; ['sss', 'ph', 'pi', 'tax', 'oth'].forEach(k => { d[k] = Math.floor(d[k] * f * 100) / 100; }); d.capped = true;
  }
  d.total = r2(d.sss + d.ph + d.pi + d.tax + d.oth); return d;
}
function getCutoffSnapshot(key) {
  const s = getCutoffExtra(key).snapshot;
  return (s && typeof s === 'object' && s.t && s.d && isFinite(s.net)) ? s : null;
}
function lockCutoffSnapshot(key, isAuto) {
  const k = key || selKey || curPeriod().key;
  const ex = ensureCutoffExtra(k);
  delete ex.snapshot;
  _pdc.clear();
  const D = periodData(k);
  ex.snapshot = {
    lockedAt: Date.now(), auto: !!isAuto,
    t: { ...D.t }, allow: D.allow, grossAll: D.grossAll,
    d: { sss: D.d.sss, ph: D.d.ph, pi: D.d.pi, tax: D.d.tax, oth: D.d.oth, total: D.d.total, capped: !!D.d.capped },
    net: D.net
  };
  _pdc.clear();
}
function unlockCutoffSnapshot(key, quiet) {
  const k = key || selKey || curPeriod().key;
  if (settings.cutoffData && settings.cutoffData[k] && settings.cutoffData[k].snapshot) {
    delete settings.cutoffData[k].snapshot;
    _pdc.clear();
    if (!quiet) { persistSettings(); render(); toast('Cutoff unlocked — recalculating live'); }
    return true;
  }
  return false;
}
function toggleCutoffLock() {
  const k = selKey || curPeriod().key;
  if (getCutoffSnapshot(k)) { unlockCutoffSnapshot(k, false); return; }
  const D = periodData(k);
  if (D.grossAll <= 0) return toast('Log shifts in this cutoff before locking');
  lockCutoffSnapshot(k, false);
  persistSettings(); render();
  toast('Payslip snapshot locked ✓');
}
function periodData(key) {
  const list = shiftsIn(key); if (_pdc.has(key)) return _pdc.get(key);
  const gList = gigsIn(key);
  const actual = getActualNet(key);
  const gigPaid = r2(gList.filter(g => g.status !== 'pending').reduce((a, g) => a + g.amount, 0));
  const gigPending = r2(gList.filter(g => g.status === 'pending').reduce((a, g) => a + g.amount, 0));
  const gigTotal = r2(gigPaid + gigPending);
  const snap = getCutoffSnapshot(key);
  if (snap) {
    const d = { sss: +snap.d.sss || 0, ph: +snap.d.ph || 0, pi: +snap.d.pi || 0, tax: +snap.d.tax || 0, oth: +snap.d.oth || 0, total: +snap.d.total || 0, capped: !!snap.d.capped, est: null };
    const r = { list, gList, t: { ...snap.t }, allow: +snap.allow || 0, grossAll: +snap.grossAll || 0, d, net: +snap.net || 0, actual, gigPaid, gigPending, gigTotal, netAll: r2((+snap.net || 0) + gigPaid), locked: true, lockedAuto: !!snap.auto };
    _pdc.set(key, r); return r;
  }
  const t = totals(list), allow = getAllowance(key), grossAll = r2(t.gross + allow), d = deductionsFor(key, t.gross, allow, t.basic);
  const net = r2(Math.max(0, grossAll - d.total));
  const r = { list, gList, t, allow, grossAll, d, net, actual, gigPaid, gigPending, gigTotal, netAll: r2(net + gigPaid), locked: false, lockedAuto: false };
  _pdc.set(key, r); return r;
}

/* ================= navigation ================= */
const greet = () => { const h = new Date().getHours(); return h < 5 ? 'Still up?' : h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'; };
const VIEWS = { home: ['Home', 'Cutoff overview', 0], budget: ['Budget', 'Envelopes, spend & vaults', 0], insights: ['Insights', 'Yearly analytics & ledger', 0], shifts: ['Shifts', 'History & search', 1], deductions: ['Payslip', 'Breakdown & net pay', 3], settings: ['Settings', 'Pay, security & more', 4] };
function replayEnter() { /* Kept lightweight with zero forced layout reflows for low-end devices */ }
function go(v) {
  const m = VIEWS[v]; if (!m) return;
  if (v !== curView) {
    const fwd = m[2] >= (VIEWS[curView] || VIEWS.home)[2];
    $$('.view').forEach(x => x.classList.remove('active', 'fwd', 'back'));
    const nv = $('view-' + v); nv.classList.add('active', fwd ? 'fwd' : 'back');
    window.scrollTo(0, 0);
  }
  curView = v; renderView(v);
  $('nav-pill').style.transform = `translate3d(${m[2] * 100}%,0,0)`;
  const tab = (v === 'budget' || v === 'insights') ? 'home' : v;
  $$('.nav-it').forEach(b => b.classList.toggle('on', b.id === 'nav-' + tab));
  $$('.sb-it').forEach(b => b.classList.toggle('on', b.id === 'sb-' + v));
  setText($('hdr-title'), m[0]); setText($('hdr-sub'), v === 'home' ? greet() : m[1]);
}

/* ================= toast & sheets & confirm ================= */
let toastT = 0, toastAct = null;
function toast(msg, act) {
  const el = $('toast'), btn = $('toast-act');
  setText($('toast-msg'), msg);
  toastAct = act && act.fn || null; btn.classList.toggle('hidden', !act); if (act) btn.textContent = act.label;
  el.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove('on'), act ? 6000 : 2400);
}
$('toast-act').addEventListener('click', () => { const f = toastAct; toastAct = null; $('toast').classList.remove('on'); if (f) f(); });
let openCount = 0;
function openSheet(id) { const el = $(id); if (el.classList.contains('open')) return; el.classList.add('open'); if (++openCount === 1) root.style.overflow = 'hidden'; }
function closeSheet(id) { const el = $(id); if (!el.classList.contains('open')) return; el.classList.remove('open'); if (--openCount <= 0) { openCount = 0; root.style.overflow = ''; } }
let cfRes = null, cfTyped = '';
function askConfirm({ title, body, ok = 'Delete', danger = true, typed = '', cancel = 'Cancel' }) {
  return new Promise(res => {
    if (cfRes) cfRes(false);
    cfRes = res; cfTyped = typed.toUpperCase();
    setText($('cf-title'), title); $('cf-body').innerHTML = body;
    const b = $('cf-ok'); b.textContent = ok; b.className = 'btn press ' + (danger ? 'danger' : 'primary'); b.disabled = !!typed;
    $('cf-ic').className = 'confirm-ic' + (danger ? '' : ' neutral'); setText($('cf-cancel'), cancel);
    const inp = $('cf-input'); inp.value = ''; inp.placeholder = typed ? `Type ${typed} to confirm` : ''; inp.classList.toggle('hidden', !typed);
    openSheet('confirm'); if (typed) setTimeout(() => inp.focus(), 250);
  });
}
function confirmTyped() { $('cf-ok').disabled = $('cf-input').value.trim().toUpperCase() !== cfTyped; }
function confirmAnswer(v) { if (v && cfTyped && $('cf-input').value.trim().toUpperCase() !== cfTyped) return; closeSheet('confirm'); const r = cfRes; cfRes = null; if (r) r(v); }

/* ================= rendering ================= */
let shownAmt = 0, amtRaf = 0;
function setAmt(val) {
  const box = $('hero-amt'), I = $('amt-int'), De = $('amt-dec'); cancelAnimationFrame(amtRaf);
  box.classList.toggle('mask', !!settings.hide);
  if (settings.hide) { I.textContent = '••••••'; De.textContent = ''; shownAmt = val; return; }
  const draw = v => { const s = nf.format(v), i = s.lastIndexOf('.'); I.textContent = s.slice(0, i); De.textContent = s.slice(i); };
  const from = shownAmt, diff = val - from;
  if (isLiteActive() || Math.abs(diff) < 0.01) { shownAmt = val; draw(val); return; }
  const t0 = performance.now(), D = 420;
  const step = now => { const k = Math.min(1, (now - t0) / D), e = 1 - Math.pow(1 - k, 4); shownAmt = from + diff * e; draw(shownAmt); if (k < 1) amtRaf = requestAnimationFrame(step); else { shownAmt = val; draw(val); } };
  amtRaf = requestAnimationFrame(step);
}
function toggleHide() {
  settings.hide = !settings.hide; persistSettings(); shownAmt = 0;
  render();
}
function shiftLabel(s) { return s.note || (s.multiplier >= 2 ? 'Holiday shift' : s.multiplier > 1 ? 'Special day shift' : 'Shift'); }
function shiftRow(s, del) {
  const grouped = !!del, d = pd(s.date), st = shiftStatusOf(s), range = s.startTime && s.endTime ? `${t12(s.startTime)} – ${t12(s.endTime)}` : fh(s.reg + s.ot);
  const b = [];
  if (st === 'cancelled') b.push(`<span class="dot-b cx">Cancelled</span>`);
  else {
    if (s.nd > 0) b.push(`<span class="dot-b nd">${fh(s.nd)} ND</span>`);
    if (s.ot > 0) b.push(`<span class="dot-b ot">${fh(s.ot)} OT</span>`);
    if (s.multiplier > 1) b.push(`<span class="dot-b hl">${s.multiplier}×</span>`);
    if (st === 'scheduled') b.push(`<span class="dot-b sc">Planned</span>`);
  }
  return `<div class="shift press${st === 'cancelled' ? ' cancelled' : ''}" role="button" tabindex="0" onclick="openShift(${s.id})"><div class="tag${s.multiplier > 1 ? ' hol' : ''}">${grouped ? `<b>${+(s.reg + s.ot).toFixed(1)}</b><small>hrs</small>` : `<b>${d.getDate()}</b><small>${DOW[d.getDay()]}</small>`}</div>
  <div class="grow"><p class="t">${esc(shiftLabel(s))}</p><p class="s num"><span>${range}</span>${b.join('')}</p></div>
  <span class="amt num">${st === 'cancelled' ? '₱0.00' : peso(s.gross)}</span>${del ? `<button type="button" class="trash" onclick="event.stopPropagation();deleteShift(${s.id})" aria-label="Delete shift"><svg class="ic sm"><use href="#i-trash"/></svg></button>` : ''}</div>`;
}
function gigRow(g, del) {
  const d = pd(g.date), range = g.startTime && g.endTime ? `<span>${t12(g.startTime)} – ${t12(g.endTime)}</span>` : '', b = [`<span class="dot-b gg">${esc(g.stream)}</span>`];
  if (g.status === 'pending') {
    if (g.dueDate) { const dm = dueMeta(g.dueDate); b.push(`<span class="dot-b ${dm.urgent ? 'cx' : 'ot'}">${esc(dm.label)}</span>`); }
    else b.push('<span class="dot-b sc">Pending</span>');
  }
  return `<div class="shift press" role="button" tabindex="0" onclick="openGig(${g.id})"><div class="tag gig"><b>${d.getDate()}</b><small>${DOW[d.getDay()]}</small></div>
  <div class="grow"><p class="t">${esc(g.title || g.stream)}</p><p class="s num">${range}${b.join('')}</p></div>
  <span class="amt num pos-ok">+${peso(g.amount)}</span>${del ? `<button type="button" class="trash" onclick="event.stopPropagation();deleteGig(${g.id})" aria-label="Delete side gig"><svg class="ic sm"><use href="#i-trash"/></svg></button>` : ''}</div>`;
}
const sortShifts = (a, b) => b.date.localeCompare(a.date) || (b.startTime || '').localeCompare(a.startTime || '') || b.id - a.id;
function dayRange(P) { const out = []; for (let d = P.start; dstr(d) <= P.endStr; d = addDays(d, 1)) out.push(dstr(d)); return out; }
const _sparkSigs = {}, _sparkMeta = {}, _sparkTimers = {};
function renderSpark(P, list, ti, W, elId = 'spark', valFn = s => s.gross) {
  const el = $(elId); if (!el) return;
  const H = 38, days = dayRange(P), n = days.length, by = {};
  list.forEach(s => { by[s.date] = (by[s.date] || 0) + (+valFn(s) || 0); });
  let cum = 0; const daily = days.map(d => r2(by[d] || 0)), pts = daily.map(v => (cum = r2(cum + v))), max = cum;
  const x = i => n > 1 ? i / (n - 1) * W : 0, y = v => max > 0 ? H - 5 - (v / max) * (H - 12) : H - 6;
  _sparkMeta[elId] = { days, pts, daily, max, W, H, ti };
  let html = `<line class="base" x1="0" y1="${H - 5}" x2="${W}" y2="${H - 5}"/>`;
  if (max <= 0) {
    html += `<line class="idle" x1="0" y1="${H - 5}" x2="${W}" y2="${H - 5}"/>`;
  } else {
    const seg = (a, b) => pts.slice(a, b + 1).map((v, k) => `${k ? 'L' : 'M'}${x(a + k).toFixed(1)} ${y(v).toFixed(1)}`).join(' ');
    if (ti >= 1) { const d = seg(0, ti); html += `<path class="area" d="${d} L${x(ti).toFixed(1)} ${H - 5} L0 ${H - 5} Z"/><path class="ln" d="${d}"/>`; }
    if (ti < n - 1) html += `<path class="fu" d="${seg(Math.max(0, ti), n - 1)}"/>`;
    if (ti >= 0 && ti < n) html += `<circle class="hd-r" cx="${x(ti).toFixed(1)}" cy="${y(pts[ti]).toFixed(1)}" r="5.5"/><circle class="hd" cx="${x(ti).toFixed(1)}" cy="${y(pts[ti]).toFixed(1)}" r="2.6"/>`;
  }
  html += `<g id="${elId}-scrub" class="hidden"><line class="scrub-ln" x1="0" y1="2" x2="0" y2="${H - 5}"/><circle class="scrub-r" cx="0" cy="0" r="6"/><circle class="scrub-dot" cx="0" cy="0" r="3"/></g>`;
  const sig = selKey + '|' + W + '|' + html;
  if (sig === _sparkSigs[elId]) return; _sparkSigs[elId] = sig;
  el.setAttribute('viewBox', `0 0 ${W} ${H}`); el.innerHTML = html;
  clearSparkScrub(elId);
}
function clearSparkScrub(elId) {
  clearTimeout(_sparkTimers[elId]);
  const g = $(elId + '-scrub'), tip = $(elId + '-tip');
  if (g) g.classList.add('hidden');
  if (tip) tip.classList.add('hidden');
}
function updateSparkScrub(elId, clientX) {
  const m = _sparkMeta[elId], svg = $(elId), tip = $(elId + '-tip'), g = $(elId + '-scrub');
  if (!m || !svg || !tip || !g || !m.days.length) return;
  const rect = svg.getBoundingClientRect();
  if (!rect.width) return;
  const frac = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
  const n = m.days.length, idx = n > 1 ? Math.round(frac * (n - 1)) : 0;
  const sx = n > 1 ? (idx / (n - 1)) * m.W : 0;
  const sy = m.max > 0 ? m.H - 5 - (m.pts[idx] / m.max) * (m.H - 12) : m.H - 6;
  const ln = g.firstChild, rC = g.children[1], dC = g.children[2];
  if (ln) { ln.setAttribute('x1', sx.toFixed(1)); ln.setAttribute('x2', sx.toFixed(1)); }
  if (rC) { rC.setAttribute('cx', sx.toFixed(1)); rC.setAttribute('cy', sy.toFixed(1)); }
  if (dC) { dC.setAttribute('cx', sx.toFixed(1)); dC.setAttribute('cy', sy.toFixed(1)); }
  g.classList.remove('hidden');
  const dObj = pd(m.days[idx]), dLbl = `${MON[dObj.getMonth()]} ${dObj.getDate()}`;
  const valStr = settings.hide ? MASK : peso(m.pts[idx]);
  const addStr = (!settings.hide && m.daily[idx] > 0) ? ` (+${shortPeso(m.daily[idx])})` : '';
  setText(tip, `${dLbl} · ${valStr}${addStr}`);
  tip.classList.remove('hidden');
  const tw = tip.offsetWidth || 120, px = frac * rect.width;
  const left = Math.max(0, Math.min(rect.width - tw, px - tw / 2));
  tip.style.left = left.toFixed(1) + 'px';
}
function initSparkScrub() {
  [['spark-box', 'spark'], ['gig-spark-box', 'gig-spark']].forEach(([boxId, elId]) => {
    const box = $(boxId); if (!box || box._scrubInit) return;
    box._scrubInit = true;
    let active = false, startX = 0, moved = false;
    box.addEventListener('pointerdown', e => {
      active = true; moved = false; startX = e.clientX;
      clearTimeout(_sparkTimers[elId]);
      e.stopPropagation();
      try { box.setPointerCapture(e.pointerId); } catch (err) {}
      updateSparkScrub(elId, e.clientX);
    });
    box.addEventListener('pointermove', e => {
      if (active) {
        if (Math.abs(e.clientX - startX) > 6) moved = true;
        e.stopPropagation();
        updateSparkScrub(elId, e.clientX);
      } else if (e.pointerType === 'mouse') {
        updateSparkScrub(elId, e.clientX);
      }
    });
    const endScrub = e => {
      if (!active) return;
      active = false;
      try { box.releasePointerCapture(e.pointerId); } catch (err) {}
      if (!moved) {
        clearTimeout(_sparkTimers[elId]);
        _sparkTimers[elId] = setTimeout(() => clearSparkScrub(elId), 2000);
      } else {
        clearSparkScrub(elId);
      }
    };
    box.addEventListener('pointerup', endScrub);
    box.addEventListener('pointercancel', endScrub);
    box.addEventListener('pointerleave', e => { if (!active && e.pointerType === 'mouse') clearSparkScrub(elId); });
  });
}
const activeNetOf = D => D.netAll;
let _walletIdx = 0;
function slideWallet(idx) {
  const c = $('wallet-carousel'); if (!c) return;
  _walletIdx = idx ? 1 : 0;
  c.scrollTo({ left: _walletIdx * (c.clientWidth + 10), behavior: 'smooth' });
  $$('#wallet-dots .acct-tab').forEach(b => b.classList.toggle('on', +b.dataset.wi === _walletIdx));
}
function onWalletScroll() {
  const c = $('wallet-carousel'); if (!c || !c.clientWidth) return;
  const idx = c.scrollLeft > c.clientWidth * 0.45 ? 1 : 0;
  if (idx !== _walletIdx) {
    _walletIdx = idx;
    $$('#wallet-dots .acct-tab').forEach(b => b.classList.toggle('on', +b.dataset.wi === _walletIdx));
  }
}
function openGigsFromCard() {
  const D = periodData(selKey);
  if (!D.gList.length) { openGig(); return; }
  go('shifts');
  setFilter('gigs');
}
function setGigAmt(val) {
  const box = $('hero-gig-amt'), I = $('gamt-int'), De = $('gamt-dec');
  if (!box || !I || !De) return;
  box.classList.toggle('mask', !!settings.hide);
  if (settings.hide) { I.textContent = '••••••'; De.textContent = ''; return; }
  const s = nf.format(val), i = s.lastIndexOf('.');
  I.textContent = s.slice(0, i); De.textContent = s.slice(i);
}
function syncWidget() {
  if (!window.AndroidBridge) return;
  try {
    const cur = curPeriod(), D = periodData(cur.key), td = today();
    const left = Math.max(0, dayNum(cur.endStr) - dayNum(td));
    const netText = money(D.net);
    const badgeText = `${cur.badge} · ${left === 0 ? 'ends today' : left + 'd left'}`;
    const gigPart = (D.gigPaid > 0 && !settings.hide) ? ` · +${peso(D.gigPaid)} gigs` : '';
    const metaText = `${fh(D.t.hrs)} · ${D.t.n} shift${D.t.n === 1 ? '' : 's'}${gigPart}`;
    const goal = +settings.goal || 0;
    let extra = '';
    if (goal > 0) {
      const pc = Math.min(100, Math.round(D.net / goal * 100));
      extra = settings.hide ? `Goal ${pc}%` : (pc >= 100 ? 'Pay goal reached ✓' : `Goal ${pc}% · ${peso(Math.max(0, goal - D.net))} left`);
    } else {
      const exList = expensesIn(cur.key);
      const sp = r2(exList.reduce((a, e) => a + e.amount, 0));
      if (sp > 0) extra = settings.hide ? `${exList.length} expenses logged` : `Spent ${peso(sp)} · ${peso(r2(D.netAll - sp))} left`;
    }
    const dark = isDark(), theme = settings.themeMode === 'amoled' ? 'amoled' : (dark ? 'dark' : 'light');
    const P = ACCENTS[settings.accentTheme] || ACCENTS.indigo;
    const accent = dark && P.ad ? P.ad : P.a;
    const accentFg = (dark && P.fgd) ? P.fgd : '#FFFFFF';
    const accentText = dark ? P.td : P.tl;
    const cardStyle = settings.cardStyle || 'surface';
    const tintBg = P.w2 || P.a;
    const exListCur = expensesIn(cur.key);
    const spCur = r2(exListCur.reduce((a, e) => a + e.amount, 0));
    const remBudget = money(r2(D.netAll - spCur));
    const nextDue = getNextUpcomingDue();
    const dueTitle = nextDue ? nextDue.badge : 'Next due';
    const dueLine = nextDue ? `${nextDue.name} · ${peso(nextDue.amount)}` : 'No upcoming PayLater or bills';
    const dueUrgent = !!(nextDue && nextDue.urgent);
    const pinLocked = !!(lockCfg() && settings.maskWidgetWhenLocked !== false);
    if (typeof AndroidBridge.updateWidgetV2 === 'function') {
      AndroidBridge.updateWidgetV2(JSON.stringify({
        net: netText, badge: badgeText, meta: metaText, period: cur.label,
        gross: money(D.grossAll), ded: settings.hide ? MASK : '−' + peso(D.d.total),
        extra, remBudget, dueTitle, dueLine, dueUrgent, appHide: !!settings.hide, pinLocked,
        theme, cardStyle, tintBg, accent, accentFg, accentText
      }));
    } else if (typeof AndroidBridge.updateWidget === 'function') {
      AndroidBridge.updateWidget(netText, badgeText, metaText, cur.label);
    }
  } catch (e) {}
}
function openGoalSettings() { go('settings'); setTimeout(() => { const el = $('set-goal'); if (el) { el.scrollIntoView({ block: 'center', behavior: 'smooth' }); el.focus(); } }, 220); }
function renderHome() {
  const P = periodFromKey(selKey), D = periodData(selKey), cur = curPeriod(), isCur = P.key === cur.key, isPast = P.sort < cur.sort, td = today();
  // Slide 0: Main Payroll Account Card (Banking / Trading style)
  const activeJob = getActiveJob(); const jobPrefix = (activeJob && activeJob.name && activeJob.name !== 'Main job') ? activeJob.name : 'Main payroll';
  setText($('w-label'), `${jobPrefix} · ${P.badge}${isCur ? '' : (isPast ? ' · closed' : ' · upcoming')}`);
  $('w-live').style.display = isCur ? '' : 'none';
  setAmt(D.net);
  const prevP = periodOf(dstr(addDays(P.start, -1))), prevD = periodData(prevP.key);
  const wDelta = $('w-delta');
  if (wDelta) {
    if (prevD.net > 0 && D.net > 0) {
      const pct = Math.round(((D.net - prevD.net) / prevD.net) * 1000) / 10;
      const up = pct >= 0;
      wDelta.className = 'w-delta num ' + (up ? 'up' : 'dn');
      setText(wDelta, settings.hide ? (up ? '▲ Up' : '▼ Down') : `${up ? '▲ +' : '▼ '}${pct}% vs prev`);
    } else if (D.net > 0) {
      wDelta.className = 'w-delta num up';
      setText(wDelta, `${D.t.n} shift${D.t.n === 1 ? '' : 's'} logged`);
    } else {
      wDelta.className = 'w-delta num hidden';
    }
  }
  const planned = D.list.filter(s => shiftStatusOf(s) === 'scheduled'), planSum = planned.reduce((a, s) => a + s.gross, 0), lag = Math.max(0, +settings.payLag || 0), parts = [];
  if (lag > 0) { const pdte = addDays(P.end, lag), diff = dayNum(dstr(pdte)) - dayNum(td); parts.push(`Payday ${MON[pdte.getMonth()]} ${pdte.getDate()}${diff >= 0 && diff <= 14 ? (diff === 0 ? ' · today' : ` · in ${diff}d`) : ''}`); }
  if (planSum > 0) parts.push(settings.hide ? `${planned.length} planned` : `${peso(planSum)} planned`);
  setText($('w-sub'), parts.join(' · ') || (D.t.n ? '' : 'No shifts in this cutoff yet'));
  setText($('ws-g'), money(D.grossAll)); setText($('ws-d'), settings.hide ? MASK : '−' + peso(D.d.total)); setText($('ws-h'), D.t.n ? `${fh(D.t.hrs)} · ${D.t.n}sh` : '0h');
  const left = dayNum(P.endStr) - dayNum(td), total = dayNum(P.endStr) - dayNum(P.startStr) + 1;
  let f, n, u;
  if (isCur) { f = Math.min(1, (dayNum(td) - dayNum(P.startStr) + 1) / total); n = left === 0 ? '0' : String(left); u = left === 1 ? 'day' : 'days'; }
  else if (isPast) { f = 1; n = '✓'; u = 'closed'; }
  else { const st = dayNum(P.startStr) - dayNum(td); f = 0; n = String(st); u = 'to start'; }
  setText($('ring-n'), n); setText($('ring-u'), u); $('ring-pg').style.strokeDashoffset = String(100.5 * (1 - f));
  $('ring').title = isCur ? `Cutoff ends ${MON[P.end.getMonth()]} ${P.end.getDate()}` : 'Cutoff status';
  const goal = +settings.goal || 0; $('w-goal').classList.toggle('hidden', !(goal > 0));
  if (goal > 0) {
    const pc = Math.min(100, Math.round(D.net / goal * 100));
    let gLabel = 'Goal';
    if (!settings.hide) {
      if (pc >= 100) gLabel = 'Goal reached ✓';
      else {
        const rem = r2(goal - D.net);
        const avgShift = D.t.n > 0 ? (D.t.gross / D.t.n) : (settings.hourlyRate * 6);
        const needSh = avgShift > 0 ? Math.max(0.5, Math.round((rem / avgShift) * 10) / 10) : 0;
        gLabel = `Goal ${pc}% · ${peso(rem)} left${needSh ? ` (~${needSh} sh)` : ''}`;
      }
    }
    setText($('g-txt'), gLabel); $('g-fill').style.transform = `scaleX(${pc / 100})`;
  }
  const W = Math.max(200, Math.min(document.documentElement.clientWidth || 360, innerWidth >= 768 ? 420 : 500) - 56), ti = isCur ? dayRange(P).indexOf(td) : (isPast ? dayRange(P).length - 1 : -1);
  renderSpark(P, D.list.filter(isShiftActive), ti, W, 'spark', s => s.gross);

  // Slide 1: Sibling Side Gigs Account Card (Unified Fintech Theme)
  setText($('wg-label'), `Side gigs · ${P.badge}`);
  setGigAmt(D.gigPaid);
  const gCnt = D.gList.length;
  setText($('gig-ring-n'), String(gCnt)); setText($('gig-ring-u'), gCnt === 1 ? 'gig' : 'gigs');
  const paidRatio = D.gigTotal > 0 ? Math.min(1, D.gigPaid / D.gigTotal) : 0;
  if ($('gig-ring-pg')) $('gig-ring-pg').style.strokeDashoffset = String(100.5 * (1 - paidRatio));
  const byStream = new Map();
  D.gList.forEach(g => { byStream.set(g.stream, (byStream.get(g.stream) || 0) + g.amount); });
  const topStream = [...byStream.entries()].sort((a, b) => b[1] - a[1])[0];
  const wgDelta = $('wg-delta');
  if (wgDelta) {
    if (D.gigPending > 0) {
      wgDelta.className = 'w-delta num warn';
      setText(wgDelta, settings.hide ? 'Pending' : `${peso(D.gigPending)} pending`);
    } else if (D.gigPaid > 0) {
      wgDelta.className = 'w-delta num up';
      setText(wgDelta, '100% settled');
    } else {
      wgDelta.className = 'w-delta num hidden';
    }
  }
  setText($('wg-sub'), topStream ? `Top stream: ${topStream[0]}` : 'No side gigs logged in this cutoff yet');
  renderSpark(P, D.gList.filter(g => g.status !== 'pending'), ti, W, 'gig-spark', g => g.amount);
  const pPct = D.gigTotal > 0 ? Math.round(D.gigPaid / D.gigTotal * 100) : 0;
  const pePct = D.gigTotal > 0 ? Math.max(0, 100 - pPct) : 0;
  if ($('wg-bar-paid')) $('wg-bar-paid').style.width = pPct + '%';
  if ($('wg-bar-pend')) $('wg-bar-pend').style.width = pePct + '%';
  setText($('wgs-paid'), money(D.gigPaid)); setText($('wgs-pend'), money(D.gigPending)); setText($('wgs-tot'), money(D.netAll));
  setText($('wd-gig-cnt'), gCnt > 0 ? `(${gCnt})` : '');
  setText($('wt-pay-amt'), shortPeso(D.net));
  setText($('wt-gig-amt'), shortPeso(D.gigPaid));

  // Recent activity (shifts + side gigs)
  const recItems = [...D.list.map(s => ({ k: 's', date: s.date, id: s.id, st: s.startTime || '', o: s })), ...D.gList.map(g => ({ k: 'g', date: g.date, id: g.id, st: g.startTime || '23:59', o: g }))]
    .sort((a, b) => b.date.localeCompare(a.date) || b.st.localeCompare(a.st) || b.id - a.id);
  const rec = recItems.slice(0, 3);
  setText($('recent-h'), recItems.length > 3 ? `Latest of ${recItems.length} entries` : 'Activity this cutoff');
  setHTML($('recent-list'), rec.length ? rec.map(x => x.k === 'g' ? gigRow(x.o, false) : shiftRow(x.o, false)).join('') : `<div class="empty"><b>Nothing logged yet</b>Tap “Log shift” or “Bulk week” to see your pay build up.</div>`);
  const lb = +localStorage.getItem(BK_KEY) || 0, nag = $('backup-nag'), need = shifts.length && (!lb || Date.now() - lb > 14 * 864e5);
  nag.classList.toggle('hidden', !need); if (need) setText(nag, `⚠ ${lb ? 'Last backup was over 2 weeks ago' : 'You have no backup yet'} — tap to back up`);
  renderTimer();
  renderCheckin();
  renderBudget(D.netAll, D.net, D.gigPaid);
  renderTrend();
  syncWidget();
  syncDueAndPlanAlarms();
}
function shortPeso(v) {
  if (settings.hide) return '•••';
  if (!v) return '₱0';
  if (v >= 1000) return '₱' + (v / 1000).toFixed(v >= 10000 ? 0 : 1).replace(/\.0$/, '') + 'k';
  return '₱' + Math.round(v);
}
function shortPeriodLbl(P) {
  if (settings.schedule === 'monthly') return MON[P.start.getMonth()];
  return `${MON[P.start.getMonth()]} ${P.start.getDate()}`;
}
function renderTrend() {
  const card = $('trend-card'); if (!card) return;
  if (!shifts.length) { card.classList.add('hidden'); return; }
  card.classList.remove('hidden');
  const cols = []; let p = periodFromKey(selKey);
  for (let i = 0; i < 6; i++) { cols.unshift({ P: p, D: periodData(p.key) }); p = periodOf(dstr(addDays(p.start, -1))); }
  const max = Math.max(0, ...cols.map(c => activeNetOf(c.D)));
  const curNet = activeNetOf(cols[5].D), prevNet = activeNetOf(cols[4].D), delta = $('trend-delta');
  if (prevNet > 0) {
    const pc = Math.round((curNet - prevNet) / prevNet * 100);
    setText(delta, settings.hide ? 'vs prev' : `${pc >= 0 ? '▲ +' : '▼ '}${pc}% vs prev`);
    delta.className = 'chip num ' + (pc >= 0 ? 'ok' : 'bad');
  } else {
    setText(delta, 'Last 6 cutoffs'); delta.className = 'chip mute num';
  }
  setHTML($('trend-bars'), cols.map(c => {
    const isSel = c.P.key === selKey, v = activeNetOf(c.D), sc = max > 0 ? Math.max(0.08, v / max) : 0.08;
    return `<button type="button" class="trend-col press${isSel ? ' cur' : ''}${v <= 0 ? ' zero' : ''}" onclick="selectPeriod('${c.P.key}')" title="${esc(c.P.label)}: ${peso(v)}">` +
      `<span class="trend-val num">${shortPeso(v)}</span>` +
      `<div class="trend-track"><div class="trend-bar" style="transform:scaleY(${sc.toFixed(3)})"></div></div>` +
      `<span class="trend-lbl">${shortPeriodLbl(c.P)}</span></button>`;
  }).join(''));
}
const DONUT_C = 2 * Math.PI * 46;
function shiftEndMs(s) {
  const d = pd(s.date);
  if (!s.startTime || !s.endTime) return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 0).getTime();
  const sm = tmin(s.startTime), em = tmin(s.endTime);
  const endDate = em <= sm ? addDays(d, 1) : d;
  return new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate(), Math.floor(em / 60), em % 60, 0).getTime();
}
function renderCheckin() {
  const card = $('checkin-card'); if (!card) return;
  const nowMs = Date.now();
  const pastPlanned = shifts.filter(s => {
    if (shiftStatusOf(s) !== 'scheduled') return false;
    return nowMs >= shiftEndMs(s) + 600000; // 10 mins after shift end (handles overnight shifts accurately)
  }).sort((a, b) => a.date.localeCompare(b.date) || (a.startTime || '').localeCompare(b.startTime || ''));
  const s = pastPlanned[0];
  checkinShiftId = s ? s.id : null;
  card.classList.toggle('hidden', !s);
  if (!s) return;
  setText($('ci-badge'), pastPlanned.length > 1 ? `1 of ${pastPlanned.length}` : 'Confirm');
  setText($('ci-title'), `Did you work your ${shiftLabel(s)} shift?`);
  setText($('ci-sub'), `${fmtDay(s.date)}${s.startTime && s.endTime ? ` · ${t12(s.startTime)}–${t12(s.endTime)}` : ''} · ${peso(s.gross)}`);
}
function resolveCheckin(act) {
  const id = checkinShiftId; if (!id) return;
  const s = shifts.find(x => x.id === id); if (!s) return;
  if (act === 'edit') { openShift(id); return; }
  if (act === 'remove') {
    shifts = shifts.filter(x => x.id !== id);
    recalcDay(s.date); persistShifts(); render();
    toast('Planned shift removed', {
      label: 'Undo',
      fn: () => { shifts.push(s); recalcDay(s.date); persistShifts(); render(); toast('Shift restored'); }
    });
    return;
  }
  s.status = 'worked';
  recalcDay(s.date); persistShifts(); render();
  toast('Confirmed as Worked ✓');
}
function setBudTab(t) {
  ui.budTab = t;
  $$('#bud-tabs button').forEach(b => b.classList.toggle('on', b.dataset.bt === t));
  ['overview', 'expenses', 'dues', 'vaults'].forEach(k => { const el = $('bud-p-' + k); if (el) el.classList.toggle('hidden', k !== t); });
  if (t === 'overview') renderHome();
  if (t === 'expenses') renderExpenses();
  if (t === 'dues') renderDues();
  if (t === 'vaults') renderVaults();
}
function addMonthsStr(ds, n) {
  if (!ds) return '';
  const d = pd(ds), targetM = d.getMonth() + n, y = d.getFullYear() + Math.floor(targetM / 12), m = ((targetM % 12) + 12) % 12;
  const maxDay = new Date(y, m + 1, 0).getDate();
  return dstr(new Date(y, m, Math.min(d.getDate(), maxDay)));
}
function dueMeta(ds) {
  if (!ds) return { label: 'No due date', cls: 'mute', urgent: false, diff: 9999 };
  const diff = dayNum(ds) - dayNum(today());
  if (diff < 0) return { label: `Overdue ${Math.abs(diff)}d`, cls: 'bad', urgent: true, diff };
  if (diff === 0) return { label: 'Due today', cls: 'bad', urgent: true, diff };
  if (diff === 1) return { label: 'Due tomorrow', cls: 'warn', urgent: true, diff };
  if (diff <= 5) return { label: `Due in ${diff}d`, cls: 'warn', urgent: false, diff };
  const d = pd(ds);
  return { label: `Due ${MON[d.getMonth()]} ${d.getDate()}`, cls: 'mute', urgent: false, diff };
}
function getNextUpcomingDue() {
  const active = debts.filter(d => !d.settled && d.kind !== 'owed' && d.dueDate)
    .map(d => ({ ...d, m: dueMeta(d.dueDate) }))
    .sort((a, b) => a.m.diff - b.m.diff);
  if (active.length) {
    const x = active[0];
    return { name: x.name, amount: x.kind === 'paylater' ? x.amount : debtRemaining(x), badge: x.m.label, urgent: x.m.urgent, diff: x.m.diff };
  }
  const ck = curPeriod().key, paidIds = new Set(expensesIn(ck).filter(e => e.billId).map(e => e.billId));
  const unpaidBill = (settings.bills || []).find(b => billDueIn(b, ck) && !paidIds.has(b.id));
  if (unpaidBill) {
    return { name: unpaidBill.name, amount: r2(+unpaidBill.amount || 0), badge: 'Cutoff bill due', urgent: false, diff: 5 };
  }
  return null;
}
function setDueFilter(f) {
  ui.dueF = f;
  $$('#dues-filters .fchip').forEach(b => b.classList.toggle('on', b.dataset.df === f));
  renderDues();
}
let partPayId = null;
function renderDues() {
  const activeOwe = debts.filter(d => !d.settled && d.kind !== 'owed');
  const totalBal = r2(activeOwe.reduce((a, d) => a + debtRemaining(d), 0));
  const owedMe = r2(debts.filter(d => !d.settled && d.kind === 'owed').reduce((a, d) => a + debtRemaining(d), 0));
  setText($('dues-sub'), `${money(totalBal)} to pay${owedMe > 0 ? ` · ${money(owedMe)} owed to you` : ''}`);
  let list = debts.filter(d => {
    if (ui.dueF === 'paid') return !!d.settled;
    if (d.settled) return false;
    if (ui.dueF === 'all') return true;
    return d.kind === ui.dueF;
  }).sort((a, b) => {
    const da = a.dueDate ? dayNum(a.dueDate) : 999999, db = b.dueDate ? dayNum(b.dueDate) : 999999;
    return da - db || b.id - a.id;
  });
  if (!list.length) {
    setHTML($('dues-list'), `<div class="empty"><b>${ui.dueF === 'paid' ? 'No settled items yet' : 'No active dues'}</b>Tap “+ Add” to track SPayLater, GLoan, Atome, Hulugan, or personal Utang.</div>`);
    return;
  }
  setHTML($('dues-list'), list.map(d => {
    const dm = dueMeta(d.dueDate);
    const isPL = d.kind === 'paylater', isOwed = d.kind === 'owed';
    const remBal = debtRemaining(d);
    const paidAmt = isPL ? 0 : r2(+d.paidAmount || 0);
    const pc = isPL
      ? (d.totalTerms > 0 ? Math.min(100, Math.round(d.paidTerms / d.totalTerms * 100)) : 0)
      : (d.settled ? 100 : (d.amount > 0 ? Math.min(100, Math.round(paidAmt / d.amount * 100)) : 0));
    const kindTag = isPL ? `${d.paidTerms}/${d.totalTerms} paid` : (isOwed ? 'Owed to you' : 'You owe');
    const subLeft = isPL
      ? `Per due: <b style="color:var(--t1)">${money(d.amount)}</b>`
      : (paidAmt > 0 ? `Paid ${money(paidAmt)} of ${money(d.amount)}` : (isOwed ? 'Receivable' : 'Balance'));
    const actions = d.settled
      ? '<span class="chip ok">Paid ✓</span>'
      : (isPL
          ? `<button type="button" class="btn primary sm press" style="min-height:32px;padding:0 12px" onclick="payDebt(${d.id})">Pay</button>`
          : `<button type="button" class="btn soft sm press" style="min-height:32px;padding:0 10px" onclick="openPartPay(${d.id})">+ Pay</button><button type="button" class="btn primary sm press" style="min-height:32px;padding:0 10px" onclick="payDebt(${d.id})">Settle</button>`);
    return `<div class="due-card${d.settled ? ' settled' : ''}">` +
      `<div class="row between"><div class="grow" onclick="openDebtSheet(${d.id})" role="button" tabindex="0"><p class="card-t">${esc(d.name)}</p><p class="card-s num">${kindTag}${d.note ? ' · ' + esc(d.note) : ''}</p></div>` +
      `<div class="row" style="gap:6px">${!d.settled && d.dueDate ? `<span class="chip ${dm.cls} num">${dm.label}</span>` : ''}${actions}</div></div>` +
      `<div class="due-meta"><span class="muted num">${subLeft}</span><b class="num ${isOwed ? 'pos-ok' : ''}">${d.settled ? money(d.amount) : `${money(remBal)} left`}</b></div>` +
      ((isPL || paidAmt > 0) ? `<div class="env-bar" style="margin-top:0"><i class="ok" style="transform:scaleX(${(pc / 100).toFixed(3)})"></i></div>` : '') +
      `</div>`;
  }).join(''));
}
function setDebtKind(k) {
  debtKind = k;
  $$('#db-kind button').forEach(b => b.classList.toggle('on', b.dataset.dk === k));
  $('db-terms-row').classList.toggle('hidden', k !== 'paylater');
  $('db-presets').classList.toggle('hidden', k !== 'paylater');
  if ($('db-paidamt-row')) $('db-paidamt-row').classList.toggle('hidden', k === 'paylater' || editingDebtId === null);
  setText($('db-name-lbl'), k === 'paylater' ? 'App / Provider' : 'Person / Lender');
  $('db-name').placeholder = k === 'paylater' ? 'e.g. SPayLater, GLoan, Atome' : 'e.g. Juan, Coworker';
  setText($('db-amt-lbl'), k === 'paylater' ? 'Amount per due' : 'Total amount');
}
function pickDebtPreset(n) { $('db-name').value = n; }
function openDebtSheet(id = null) {
  editingDebtId = id;
  const d = id !== null ? debts.find(x => x.id === id) : null;
  setText($('debt-sheet-t'), d ? 'Edit PayLater / Utang' : 'Add PayLater / Utang');
  setText($('db-save'), d ? 'Update' : 'Save');
  $('db-del').classList.toggle('hidden', !d);
  setDebtKind(d ? d.kind : 'paylater');
  $('db-name').value = d ? d.name : '';
  $('db-amt').value = d ? d.amount : '';
  $('db-due').value = d ? (d.dueDate || '') : today();
  $('db-paid').value = d ? d.paidTerms : 0;
  $('db-total').value = d ? d.totalTerms : 3;
  if ($('db-paid-amt')) $('db-paid-amt').value = d && d.paidAmount ? d.paidAmount : '';
  $('db-note').value = d ? (d.note || '') : '';
  if ($('db-settled-row')) {
    $('db-settled-row').classList.toggle('hidden', !d);
    $('db-settled').checked = !!(d && d.settled);
  }
  openSheet('debt-sheet');
}
function saveDebt() {
  const name = $('db-name').value.trim(); if (!name) return toast('Enter a name or provider');
  const amount = r2(Math.max(0, parseFloat($('db-amt').value) || 0)); if (!(amount > 0)) return toast('Enter an amount');
  const dueDate = $('db-due').value || '';
  const totalTerms = debtKind === 'paylater' ? Math.max(1, parseInt($('db-total').value, 10) || 1) : 1;
  const paidTerms = debtKind === 'paylater' ? Math.min(totalTerms, Math.max(0, parseInt($('db-paid').value, 10) || 0)) : 0;
  const note = $('db-note').value.trim();
  const existing = editingDebtId !== null ? debts.find(x => x.id === editingDebtId) : null;
  let paidAmount = 0;
  if (debtKind !== 'paylater' && existing && $('db-paid-amt')) {
    paidAmount = r2(Math.min(amount, Math.max(0, parseFloat($('db-paid-amt').value) || 0)));
  }
  let settled = false;
  if (debtKind === 'paylater') {
    settled = paidTerms >= totalTerms;
    if (existing && $('db-settled') && !$('db-settled-row').classList.contains('hidden') && $('db-settled').checked) settled = true;
  } else if (existing) {
    const sw = ($('db-settled') && !$('db-settled-row').classList.contains('hidden')) ? !!$('db-settled').checked : !!existing.settled;
    settled = sw || paidAmount >= amount;
    if (!settled && paidAmount >= amount) paidAmount = 0;
  }
  if (existing) {
    Object.assign(existing, { kind: debtKind, name, amount, dueDate, paidTerms, totalTerms, paidAmount, note, settled });
  } else {
    debts.push({ id: nextId(), kind: debtKind, name, amount, dueDate, paidTerms, totalTerms, paidAmount: 0, payments: [], note, settled });
  }
  editingDebtId = null; persistDebts(); closeSheet('debt-sheet'); render(); toast('Saved to Dues');
}
async function deleteDebtFromSheet() {
  const id = editingDebtId; if (id === null) return;
  const d = debts.find(x => x.id === id); if (!d) return;
  closeSheet('debt-sheet'); editingDebtId = null;
  const ok = await askConfirm({ title: 'Delete this item?', body: `Remove <b>${esc(d.name)}</b>? Already logged expenses are not removed.`, ok: 'Delete' });
  if (!ok) return;
  debts = debts.filter(x => x.id !== id); persistDebts(); render(); toast('Removed from Dues');
}
function openPartPay(id) {
  const d = debts.find(x => x.id === id); if (!d || d.settled || d.kind === 'paylater') return;
  partPayId = id;
  const rem = debtRemaining(d);
  setText($('pp-title'), d.kind === 'owed' ? `Received from ${d.name}` : `Pay ${d.name}`);
  setText($('pp-sub'), `Remaining balance: ${peso(rem)} of ${peso(d.amount)}`);
  $('pp-amt').value = '';
  syncPartPayPreview();
  openSheet('partpay-sheet');
  setTimeout(() => $('pp-amt').focus(), 200);
}
function setPartPayFrac(frac) {
  const d = debts.find(x => x.id === partPayId); if (!d) return;
  const rem = debtRemaining(d);
  $('pp-amt').value = r2(rem * frac);
  syncPartPayPreview();
}
function syncPartPayPreview() {
  const d = debts.find(x => x.id === partPayId); if (!d) return;
  const rem = debtRemaining(d), val = r2(Math.max(0, parseFloat($('pp-amt').value) || 0));
  const after = r2(Math.max(0, rem - val));
  setText($('pp-after'), val > 0 ? (after <= 0 ? 'Settles balance in full ✓' : `Balance after payment: ${peso(after)}`) : `Remaining balance: ${peso(rem)}`);
  $('pp-save-btn').disabled = !(val > 0);
}
function submitPartPay() {
  const id = partPayId; if (!id) return;
  const d = debts.find(x => x.id === id); if (!d || d.settled) return;
  const rem = debtRemaining(d), raw = r2(Math.max(0, parseFloat($('pp-amt').value) || 0));
  if (!(raw > 0)) return toast('Enter a payment amount');
  const payAmt = r2(Math.min(rem, raw));
  closeSheet('partpay-sheet'); partPayId = null;
  applyDebtPayment(d, payAmt);
}
function applyDebtPayment(d, payAmt) {
  const prev = { ...d, payments: Array.isArray(d.payments) ? d.payments.slice() : [] };
  const P = periodFromKey(selKey), cur = curPeriod();
  const payDate = P.key === cur.key ? today() : P.endStr;
  let loggedExp = null;
  if (d.kind === 'paylater') {
    d.paidTerms = Math.min(d.totalTerms, (d.paidTerms || 0) + 1);
    if (d.paidTerms >= d.totalTerms) d.settled = true;
    else if (d.dueDate) d.dueDate = addMonthsStr(d.dueDate, 1);
    loggedExp = { id: nextId(), date: payDate, cat: 'needs', note: `${d.name} (${d.paidTerms}/${d.totalTerms})`, amount: d.amount, billId: null };
    expenses.push(loggedExp); persistExpenses();
  } else {
    d.paidAmount = r2(Math.min(d.amount, (+d.paidAmount || 0) + payAmt));
    if (!Array.isArray(d.payments)) d.payments = [];
    d.payments.push({ date: payDate, amount: payAmt });
    if (d.paidAmount >= d.amount - 0.005) { d.paidAmount = d.amount; d.settled = true; }
    if (d.kind === 'owe') {
      loggedExp = { id: nextId(), date: payDate, cat: 'needs', note: d.settled ? `Paid ${d.name}` : `Partial pay · ${d.name}`, amount: payAmt, billId: null };
      expenses.push(loggedExp); persistExpenses();
    }
  }
  persistDebts(); render();
  const msg = d.kind === 'owed'
    ? (d.settled ? `${d.name} settled ✓` : `Recorded ${peso(payAmt)} from ${d.name}`)
    : (d.settled ? `Settled ${d.name} (${peso(payAmt)}) ✓` : `Paid ${peso(payAmt)} to ${d.name}`);
  toast(msg, {
    label: 'Undo',
    fn: () => {
      Object.assign(d, prev);
      if (loggedExp) { expenses = expenses.filter(e => e.id !== loggedExp.id); persistExpenses(); }
      persistDebts(); render(); toast('Payment undone');
    }
  });
}
function payDebt(id) {
  const d = debts.find(x => x.id === id); if (!d || d.settled) return;
  applyDebtPayment(d, d.kind === 'paylater' ? d.amount : debtRemaining(d));
}
function renderBudget(net, payNet = net, gigNet = 0) {
  budNet = net;
  const n = +settings.budgetNeeds, w = +settings.budgetWants, s = +settings.budgetSavings, an = r2(net * n / 100), aw = r2(net * w / 100), as = r2(net * s / 100);
  const exList = expensesIn(selKey);
  const spN = r2(exList.filter(e => e.cat === 'needs').reduce((a, e) => a + e.amount, 0));
  const spW = r2(exList.filter(e => e.cat === 'wants').reduce((a, e) => a + e.amount, 0));
  const spTot = r2(spN + spW), leftAll = r2(net - spTot);
  setText($('bc-save'), 'Save ' + money(as)); $('bc-bn').style.width = n + '%'; $('bc-bw').style.width = w + '%'; $('bc-bs').style.width = s + '%';
  setText($('bc-pn'), n + '%'); setText($('bc-pw'), w + '%'); setText($('bc-ps'), s + '%'); setText($('bc-an'), money(an)); setText($('bc-aw'), money(aw)); setText($('bc-as'), money(as));
  const sl = $('bc-spent-line');
  if (sl) {
    sl.classList.toggle('hidden', !(spTot > 0));
    if (spTot > 0) setText(sl, settings.hide ? `${exList.length} expenses logged` : `Spent ${peso(spTot)} · ${leftAll >= 0 ? peso(leftAll) + ' remaining' : peso(Math.abs(leftAll)) + ' over net'}`);
  }
  let off = 0; [['dn', n], ['dw', w], ['ds', s]].forEach(([id, p]) => { const el = $(id), full = DONUT_C * p / 100, len = Math.max(0, full - (p > 0 && p < 100 ? 3 : 0)); el.style.strokeDasharray = `${len} ${DONUT_C - len}`; el.style.strokeDashoffset = String(-off); off += full; });
  const btl = $('bc-tot-line');
  if (btl) {
    btl.classList.toggle('hidden', !(gigNet > 0));
    if (gigNet > 0) setText(btl, settings.hide ? 'Total: Payroll + Side gigs' : `Total ${peso(net)} (Payroll ${peso(payNet)} + Gigs ${peso(gigNet)})`);
  }
  setText($('d-lbl'), spTot > 0 ? 'Remaining' : (gigNet > 0 ? 'Total earnings' : 'Net pay'));
  setText($('d-net'), money(spTot > 0 ? leftAll : net));
  setText($('bud-period2'), periodFromKey(selKey).label);
  const remN = r2(an - spN), remW = r2(aw - spW);
  setText($('bp-n'), `${n}% · spent ${money(spN)}`); setText($('bp-w'), `${w}% · spent ${money(spW)}`); setText($('bp-s'), `${s}% target`);
  setText($('ba-n'), money(an)); setText($('ba-w'), money(aw)); setText($('ba-s'), money(as));
  setText($('br-n'), remN >= 0 ? `${money(remN)} left` : `${money(Math.abs(remN))} over`);
  setText($('br-w'), remW >= 0 ? `${money(remW)} left` : `${money(Math.abs(remW))} over`);
  $('br-n').style.color = remN < 0 ? 'var(--bad)' : '';
  $('br-w').style.color = remW < 0 ? 'var(--bad)' : '';
  const rn = an > 0 ? Math.min(1, spN / an) : (spN > 0 ? 1 : 0), rw = aw > 0 ? Math.min(1, spW / aw) : (spW > 0 ? 1 : 0);
  const ebn = $('eb-n'), ebw = $('eb-w');
  if (ebn) { ebn.style.transform = `scaleX(${rn.toFixed(3)})`; ebn.className = spN > an ? 'bad' : (rn > 0.85 ? 'warn' : 'needs'); }
  if (ebw) { ebw.style.transform = `scaleX(${rw.toFixed(3)})`; ebw.className = spW > aw ? 'bad' : (rw > 0.85 ? 'warn' : 'wants'); }
  setText($('bud-net'), (gigNet > 0 ? 'Total: ' : 'Net: ') + money(net));
  setText($('bud-period'), gigNet > 0 ? (settings.hide ? `Total earnings · ${periodFromKey(selKey).label}` : `Payroll ${peso(payNet)} + Gigs ${peso(gigNet)} · ${periodFromKey(selKey).label}`) : `Payroll · ${periodFromKey(selKey).label}`);
  const actDues = debts.filter(d => !d.settled && d.kind !== 'owed');
  const duesBal = r2(actDues.reduce((a, d) => a + debtRemaining(d), 0));
  const vList = Array.isArray(settings.vaults) ? settings.vaults : [];
  const vTot = r2(vList.reduce((a, v) => a + (+v.saved || 0), 0));
  if ($('bs-rem')) {
    setText($('bs-rem'), money(leftAll)); $('bs-rem').style.color = leftAll < 0 ? 'var(--bad)' : '';
    setText($('bs-rem-sub'), leftAll >= 0 ? 'Available cash' : 'Over cutoff net');
    setText($('bs-spent'), money(spTot)); setText($('bs-spent-sub'), `${exList.length} item${exList.length === 1 ? '' : 's'}`);
    setText($('bs-dues'), money(duesBal)); setText($('bs-dues-sub'), actDues.length ? `${actDues.length} active` : 'All clear');
    setText($('bs-vaults'), money(vTot)); setText($('bs-vaults-sub'), `${vList.length} goal${vList.length === 1 ? '' : 's'}`);
  }
  if (curView === 'budget') {
    if (ui.budTab === 'overview') renderCashflow(leftAll);
    if (ui.budTab === 'expenses') renderExpenses();
    if (ui.budTab === 'dues') renderDues();
    if (ui.budTab === 'vaults') renderVaults();
  }
}
function billDueIn(b, key) {
  if (!b.cycle || b.cycle === 'both' || (settings.schedule !== 'semi' && settings.schedule !== 'semi25')) return true;
  if (b.cycle === '1') return /-(1|10)$/.test(key);
  if (b.cycle === '2') return /-(2|25)$/.test(key);
  return true;
}
function renderBills(exList) {
  const all = Array.isArray(settings.bills) ? settings.bills : [];
  const due = all.filter(b => billDueIn(b, selKey));
  const paidIds = new Set(exList.filter(e => e.billId).map(e => e.billId));
  const paidCount = due.filter(b => paidIds.has(b.id)).length;
  const dueSum = r2(due.reduce((a, b) => a + (+b.amount || 0), 0));
  setText($('bill-sub'), due.length ? `${paidCount}/${due.length} paid · ${money(dueSum)} total` : (all.length ? 'No bills due in this cutoff' : 'Save rent, load, internet or tuition once'));
  if (!due.length) {
    setHTML($('bill-list'), all.length ? '<p class="note">Your saved bills are scheduled for the other cutoff.</p>' : '<p class="note">Tap “+ Add bill” to create a 1-tap payday checklist.</p>');
    return;
  }
  setHTML($('bill-list'), due.map(b => {
    const paid = paidIds.has(b.id);
    const cyc = b.cycle === '1' ? '1st cutoff' : (b.cycle === '2' ? '2nd cutoff' : 'Every cutoff');
    return `<div class="bill-row${paid ? ' paid' : ''}">` +
      `<i class="exp-dot ${b.cat === 'wants' ? 'c-wants' : 'c-needs'}"></i>` +
      `<div class="grow" onclick="openBillSheet(${b.id})" role="button" tabindex="0"><p style="font-weight:600">${esc(b.name)}</p><p class="card-s num">${money(b.amount)} · ${cyc}</p></div>` +
      (paid
        ? `<span class="chip ok">Paid ✓</span>`
        : `<button type="button" class="btn primary sm press" style="min-height:32px;padding:0 12px" onclick="markBillPaid(${b.id})">Pay</button>`) +
      `</div>`;
  }).join(''));
}
function setBillCat(c) { billCat = c; $$('#bl-cat button').forEach(b => b.classList.toggle('on', b.dataset.bc === c)); }
function openBillSheet(id = null) {
  editingBillId = id;
  const b = id !== null ? (settings.bills || []).find(x => x.id === id) : null;
  setText($('bill-sheet-t'), b ? 'Edit recurring bill' : 'New recurring bill');
  setText($('bl-save'), b ? 'Update bill' : 'Save bill');
  $('bl-del').classList.toggle('hidden', !b);
  $('bl-name').value = b ? b.name : '';
  $('bl-amt').value = b ? b.amount : '';
  $('bl-cycle').value = b ? (b.cycle || 'both') : 'both';
  setBillCat(b ? (b.cat || 'needs') : 'needs');
  openSheet('bill-sheet');
}
function saveBill() {
  const name = $('bl-name').value.trim(); if (!name) return toast('Enter a bill name');
  const amount = r2(Math.max(0, parseFloat($('bl-amt').value) || 0)); if (!(amount > 0)) return toast('Enter a valid amount');
  const cycle = $('bl-cycle').value || 'both';
  if (!Array.isArray(settings.bills)) settings.bills = [];
  if (editingBillId !== null) {
    const b = settings.bills.find(x => x.id === editingBillId);
    if (b) Object.assign(b, { name, amount, cycle, cat: billCat });
  } else {
    settings.bills.push({ id: nextId(), name, amount, cycle, cat: billCat });
  }
  editingBillId = null; persistSettings(); closeSheet('bill-sheet'); renderExpenses(); toast('Recurring bill saved');
}
async function deleteBillFromSheet() {
  const id = editingBillId; if (id === null) return;
  const b = (settings.bills || []).find(x => x.id === id); if (!b) return;
  closeSheet('bill-sheet'); editingBillId = null;
  const ok = await askConfirm({ title: 'Delete recurring bill?', body: `Remove <b>${esc(b.name)}</b> from future checklists? Already logged expenses stay untouched.`, ok: 'Delete' });
  if (!ok) return;
  settings.bills = settings.bills.filter(x => x.id !== id); persistSettings(); renderExpenses(); toast('Bill removed');
}
function markBillPaid(id) {
  const b = (settings.bills || []).find(x => x.id === id); if (!b) return;
  const P = periodFromKey(selKey), cur = curPeriod();
  const date = P.key === cur.key ? today() : P.endStr;
  const exp = { id: nextId(), date, cat: b.cat === 'wants' ? 'wants' : 'needs', note: b.name, amount: r2(+b.amount || 0), billId: b.id };
  expenses.push(exp); persistExpenses(); render();
  toast(`Paid ${b.name} (${peso(exp.amount)})`, { label: 'Undo', fn: () => { expenses = expenses.filter(x => x.id !== exp.id); persistExpenses(); render(); toast('Payment undone'); } });
}
function renderExpenses() {
  const list = expensesIn(selKey).sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id);
  renderBills(list);
  const tot = r2(list.reduce((a, e) => a + e.amount, 0));
  setText($('exp-sub'), `${list.length} item${list.length === 1 ? '' : 's'} · ${money(tot)} spent in ${periodFromKey(selKey).label}`);
  if (!list.length) {
    setHTML($('exp-list'), '<div class="empty"><b>No expenses logged</b>Tap “+ Log expense” to track Needs &amp; Wants against this cutoff.</div>');
    return;
  }
  setHTML($('exp-list'), list.map(e =>
    `<div class="exp-row"><i class="exp-dot ${e.cat === 'wants' ? 'c-wants' : 'c-needs'}"></i>` +
    `<div class="grow"><p style="font-weight:600">${esc(e.note)}</p><p class="card-s num">${fmtDay(e.date)} · ${e.cat === 'wants' ? 'Wants' : 'Needs'}${e.billId ? ' · Bill' : ''}</p></div>` +
    `<b class="num neg">−${money(e.amount)}</b>` +
    `<button type="button" class="trash" onclick="deleteExpense(${e.id})" aria-label="Delete expense"><svg class="ic sm"><use href="#i-trash"/></svg></button></div>`
  ).join(''));
}
function setExpCat(c) { expCat = c; $$('#ex-cat button').forEach(b => b.classList.toggle('on', b.dataset.ec === c)); }
function pickExpTag(lbl, cat) { $('ex-note').value = lbl; setExpCat(cat); }
function openExpSheet() {
  const P = periodFromKey(selKey), cur = curPeriod();
  $('ex-amt').value = ''; $('ex-note').value = '';
  $('ex-date').value = P.key === cur.key ? today() : P.endStr;
  setExpCat('needs');
  setText($('exp-sheet-sub'), `Tracked in ${P.label}`);
  openSheet('exp-sheet');
}
function saveExpense() {
  const amt = r2(Math.max(0, parseFloat($('ex-amt').value) || 0));
  if (!(amt > 0)) return toast('Enter an amount');
  const date = $('ex-date').value || today(), note = $('ex-note').value.trim() || (expCat === 'wants' ? 'Wants' : 'Needs');
  expenses.push({ id: nextId(), date, cat: expCat, note, amount: amt });
  persistExpenses(); closeSheet('exp-sheet'); render(); toast(`Logged ${peso(amt)} (${expCat})`);
}
function deleteExpense(id) {
  const e = expenses.find(x => x.id === id); if (!e) return;
  expenses = expenses.filter(x => x.id !== id); persistExpenses(); render();
  toast('Expense removed', { label: 'Undo', fn: () => { expenses.push(e); persistExpenses(); render(); toast('Expense restored'); } });
}
function renderVaults() {
  const list = Array.isArray(settings.vaults) ? settings.vaults : [];
  const tot = r2(list.reduce((a, v) => a + (+v.saved || 0), 0));
  setText($('vault-total-sub'), `${money(tot)} saved across ${list.length} vault${list.length === 1 ? '' : 's'}`);
  if (!list.length) {
    setHTML($('vault-list'), '<div class="empty"><b>No savings vaults yet</b>Create a vault (Emergency Fund, Tuition, Upgrade) to track your savings across cutoffs.</div>');
    return;
  }
  setHTML($('vault-list'), list.map(v => {
    const sv = r2(+v.saved || 0), tg = r2(+v.target || 0), pc = tg > 0 ? Math.min(100, Math.round(sv / tg * 100)) : 100;
    return `<div class="vault-card">` +
      `<div class="row between"><div class="grow" onclick="openVaultSheet(${v.id})" role="button" tabindex="0"><p class="card-t">${esc(v.name)}</p><p class="card-s num">${money(sv)}${tg > 0 ? ` of ${money(tg)} · ${pc}%` : ' saved'}</p></div>` +
      `<div class="row" style="gap:6px"><button type="button" class="btn soft sm press" style="min-height:32px;padding:0 10px" onclick="quickVaultAdd(${v.id})">+ Add</button><button type="button" class="btn ghost sm press" style="min-height:32px;padding:0 10px" onclick="openVaultSheet(${v.id})">Edit</button></div></div>` +
      `<div class="env-bar" style="margin-top:2px"><i class="ok" style="transform:scaleX(${(pc / 100).toFixed(3)})"></i></div></div>`;
  }).join(''));
}
function openVaultSheet(id = null) {
  editingVaultId = id;
  const v = id !== null ? (settings.vaults || []).find(x => x.id === id) : null;
  setText($('vlt-title'), v ? 'Edit vault' : 'New savings vault');
  setText($('v-save'), v ? 'Update vault' : 'Create vault');
  $('v-del').classList.toggle('hidden', !v);
  $('v-name').value = v ? v.name : '';
  $('v-target').value = v && v.target ? v.target : '';
  $('v-saved').value = v && v.saved ? v.saved : '';
  const cutSave = r2(budNet * (+settings.budgetSavings || 0) / 100), btn = $('v-add-cutoff-btn');
  btn.classList.toggle('hidden', !(cutSave > 0));
  if (cutSave > 0) setText(btn, `+ Add this cutoff's savings (${peso(cutSave)})`);
  openSheet('vault-sheet');
}
function addCutoffSavingsToVault() {
  const cutSave = r2(budNet * (+settings.budgetSavings || 0) / 100);
  if (!(cutSave > 0)) return;
  const cur = parseFloat($('v-saved').value) || 0;
  $('v-saved').value = r2(cur + cutSave);
  toast(`Added ${peso(cutSave)} — tap Save vault`);
}
function quickVaultAdd(id) {
  const v = (settings.vaults || []).find(x => x.id === id); if (!v) return;
  openVaultSheet(id);
}
function saveVault() {
  const name = $('v-name').value.trim(); if (!name) return toast('Enter a vault name');
  const target = r2(Math.max(0, parseFloat($('v-target').value) || 0));
  const saved = r2(Math.max(0, parseFloat($('v-saved').value) || 0));
  if (!Array.isArray(settings.vaults)) settings.vaults = [];
  if (editingVaultId !== null) {
    const v = settings.vaults.find(x => x.id === editingVaultId);
    if (v) Object.assign(v, { name, target, saved });
  } else {
    settings.vaults.push({ id: nextId(), name, target, saved });
  }
  editingVaultId = null; persistSettings(); closeSheet('vault-sheet'); renderVaults(); toast('Vault saved');
}
async function deleteVaultFromSheet() {
  const id = editingVaultId; if (id === null) return;
  const v = (settings.vaults || []).find(x => x.id === id); if (!v) return;
  closeSheet('vault-sheet'); editingVaultId = null;
  const ok = await askConfirm({ title: 'Delete this vault?', body: `Remove <b>${esc(v.name)}</b>? Your shifts and pay data are not affected.`, ok: 'Delete' });
  if (!ok) return;
  settings.vaults = settings.vaults.filter(x => x.id !== id); persistSettings(); renderVaults(); toast('Vault deleted');
}
function budRead() { return ['bi-n', 'bi-w', 'bi-s'].map(id => Math.max(0, parseFloat($(id).value) || 0)); }
function budgetInput() { const [a, b, c] = budRead(), t = Math.round((a + b + c) * 10) / 10, ok = Math.abs(t - 100) < .01, el = $('bud-total'); setText(el, ok ? '100% ✓' : `${t}% — must be 100`); el.className = 'chip num ' + (ok ? 'ok' : 'bad'); $('bud-save').disabled = !ok; }
function budgetPreset(a, b, c) { $('bi-n').value = a; $('bi-w').value = b; $('bi-s').value = c; budgetInput(); }
function saveBudget() { const [a, b, c] = budRead(); if (Math.abs(a + b + c - 100) >= .01) return; settings.budgetNeeds = a; settings.budgetWants = b; settings.budgetSavings = c; persistSettings(); render(); toast(`Budget saved (${a}/${b}/${c})`); }

const FILTERS = [['all', 'All'], ['reg', 'Regular'], ['spc', 'Special'], ['hol', 'Holiday'], ['night', 'Night'], ['ot', 'Overtime'], ['plan', 'Planned'], ['gigs', 'Side gigs']];
function buildFilters() { $('shift-filters').innerHTML = FILTERS.map(([k, l]) => `<button type="button" class="fchip press" data-f="${k}" onclick="setFilter('${k}')">${l}</button>`).join(''); setFilter(ui.f, true); }
function setFilter(k, quiet) { ui.f = k; ui.limit = 60; $$('#shift-filters .fchip').forEach(b => b.classList.toggle('on', b.dataset.f === k)); if (!quiet) renderShifts(); }
let _searchT = 0;
function onSearch(v) { ui.q = v.trim().toLowerCase(); ui.limit = 60; $('q-clear').classList.toggle('hidden', !v); clearTimeout(_searchT); _searchT = setTimeout(renderShifts, v ? 140 : 0); }
function clearSearch() { $('shift-q').value = ''; onSearch(''); }
function moreShifts() { ui.limit += 60; renderShifts(); }
function toggleSort() { ui.limit = 60; ui.sort = ui.sort === 'desc' ? 'asc' : 'desc'; setText($('sort-btn').lastElementChild, ui.sort === 'desc' ? 'Newest' : 'Oldest'); renderShifts(); }
const FMATCH = { all: () => true, reg: s => s.multiplier === 1 && isShiftActive(s), spc: s => s.multiplier > 1 && s.multiplier < 2 && isShiftActive(s), hol: s => s.multiplier >= 2 && isShiftActive(s), night: s => s.nd > 0 && isShiftActive(s), ot: s => s.ot > 0 && isShiftActive(s), plan: s => shiftStatusOf(s) === 'scheduled', gigs: () => false };
function toggleCal() {
  ui.cal = !ui.cal; if (!ui.cal) ui.calDay = '';
  const btn = $('cal-toggle'); if (btn) { btn.classList.toggle('on', ui.cal); btn.setAttribute('aria-pressed', String(ui.cal)); }
  renderShifts();
}
function pickCalDay(ds) { ui.calDay = (ui.calDay === ds) ? '' : ds; ui.limit = 60; renderShifts(); }
function openShiftOnDate(ds) { openShift(); $('m-date').value = ds; onDateChange(false); }
function renderCalendar() {
  const box = $('shift-cal'); if (!box) return;
  box.classList.toggle('hidden', !ui.cal);
  if (!ui.cal) return;
  const P = periodFromKey(selKey), list = shiftsIn(selKey), td = today();
  const by = {};
  list.forEach(s => { const m = by[s.date] || (by[s.date] = { reg: false, nd: false, ot: false, hl: false }); if (s.multiplier > 1) m.hl = true; if (s.ot > 0) m.ot = true; if (s.nd > 0) m.nd = true; if (s.multiplier === 1 && s.ot === 0 && s.nd === 0) m.reg = true; });
  const startGrid = addDays(P.start, -P.start.getDay());
  const endGrid = addDays(P.end, 6 - P.end.getDay());
  let cells = '';
  for (let d = startGrid; dstr(d) <= dstr(endGrid); d = addDays(d, 1)) {
    const ds = dstr(d), inP = ds >= P.startStr && ds <= P.endStr, info = by[ds];
    const dots = [];
    if (info) {
      if (info.reg) dots.push('<i class="cal-dot reg"></i>');
      if (info.nd) dots.push('<i class="cal-dot nd"></i>');
      if (info.ot) dots.push('<i class="cal-dot ot"></i>');
      if (info.hl) dots.push('<i class="cal-dot hl"></i>');
    }
    const cls = `cal-cell${inP ? ' press' : ' out'}${ds === td && inP ? ' td' : ''}${ui.calDay === ds ? ' sel' : ''}`;
    cells += `<button type="button" class="${cls}" ${inP ? `onclick="pickCalDay('${ds}')"` : 'disabled tabindex="-1"'}><span class="num">${d.getDate()}</span><span class="cal-dots">${dots.slice(0, 3).join('')}</span></button>`;
  }
  const h = `<div class="cal-dow">${DOW.map(w => `<span>${w[0]}</span>`).join('')}</div><div class="cal-grid">${cells}</div>` +
    `<div class="cal-leg"><span><i class="cal-dot reg"></i>Regular</span><span><i class="cal-dot nd"></i>Night</span><span><i class="cal-dot ot"></i>OT</span><span><i class="cal-dot hl"></i>Holiday</span></div>`;
  setHTML(box, h);
}
function renderShifts() {
  renderCalendar();
  updateHolidayFixBanners();
  const searching = !!ui.q;
  const dayBar = $('cal-day-bar');
  if (dayBar) { dayBar.classList.toggle('hidden', !ui.calDay || searching); if (ui.calDay) setText($('cal-day-txt'), `Showing ${fmtDay(ui.calDay)}`); }
  if (ui.f === 'gigs') {
    let gl = searching ? gigs : gigsIn(selKey);
    if (!searching && ui.calDay) gl = gl.filter(g => g.date === ui.calDay);
    if (searching) gl = gl.filter(g => (`${g.stream} ${g.title} ${g.date} ${fmtDay(g.date)}`).toLowerCase().includes(ui.q));
    gl = [...gl].sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id); if (ui.sort === 'asc') gl.reverse();
    const gt = r2(gl.reduce((a, g) => a + g.amount, 0));
    setText($('shift-sum'), gl.length ? `${searching ? 'All cutoffs · ' : ''}${gl.length} side gig${gl.length > 1 ? 's' : ''} · ${peso(gt)}` : '');
    if (!gl.length) { setHTML($('shift-list'), `<div class="empty"><b>No side gigs${searching ? ' found' : ' in this cutoff'}</b>Tap + and choose Side gig to log flat-rate income.</div>`); return; }
    const groups = []; gl.slice(0, ui.limit).forEach(g => { const gr = groups[groups.length - 1]; if (gr && gr.d === g.date) gr.l.push(g); else groups.push({ d: g.date, l: [g] }); });
    setHTML($('shift-list'), groups.map(gr => `<div class="day-h"><span>${fmtDay(gr.d)}</span><span class="num">+${peso(gr.l.reduce((a, g) => a + g.amount, 0))}</span></div>` + gr.l.map(g => gigRow(g, true)).join('')).join(''));
    return;
  }
  let list = searching ? shifts : shiftsIn(selKey);
  if (!searching && ui.calDay) list = list.filter(s => s.date === ui.calDay);
  list = list.filter(FMATCH[ui.f] || FMATCH.all);
  if (searching) list = list.filter(s => (`${s.note} ${s.date} ${fmtDay(s.date)} ${MONF[pd(s.date).getMonth()]}`).toLowerCase().includes(ui.q));
  list = [...list].sort(sortShifts); if (ui.sort === 'asc') list.reverse();
  const t = totals(list);
  const extraGigs = (ui.f === 'all' && !searching) ? gigsIn(selKey).filter(g => !ui.calDay || g.date === ui.calDay) : [];
  const gigSum = r2(extraGigs.reduce((a, g) => a + g.amount, 0));
  setText($('shift-sum'), list.length ? `${searching ? 'All cutoffs · ' : ''}${t.n} shift${t.n === 1 ? '' : 's'} · ${fh(t.hrs)} · ${peso(t.gross)}${extraGigs.length ? ` + ${extraGigs.length} gig${extraGigs.length > 1 ? 's' : ''}` : ''}` : (extraGigs.length ? `${extraGigs.length} side gig${extraGigs.length > 1 ? 's' : ''} · ${peso(gigSum)}` : (searching ? 'Searching all cutoffs' : '')));
  if (!list.length && !extraGigs.length) {
    if (!searching && ui.calDay) {
      setHTML($('shift-list'), `<div class="empty"><b>No shift on ${fmtDay(ui.calDay)}</b>Forgot to log this day?<div style="margin-top:12px"><button type="button" class="btn soft sm press" onclick="openShiftOnDate('${ui.calDay}')">+ Log shift for ${fmtDay(ui.calDay)}</button></div></div>`); return;
    }
    const anyHere = shiftsIn(selKey).length > 0;
    setHTML($('shift-list'), `<div class="empty"><b>${searching || ui.f !== 'all' ? 'No matching shifts' : 'No shifts in this cutoff'}</b>${searching || (ui.f !== 'all' && anyHere) ? 'Try a different search or filter.' : 'Tap + to log your first shift.'}</div>`); return;
  }
  const total = list.length, shown = list.slice(0, ui.limit);
  const groups = []; shown.forEach(s => { const g = groups[groups.length - 1]; if (g && g.d === s.date) g.l.push(s); else groups.push({ d: s.date, l: [s] }); });
  const gigHtml = extraGigs.length ? `<div class="day-h"><span>Side gigs this cutoff</span><span class="num pos-ok">+${peso(gigSum)}</span></div>` + extraGigs.sort((a, b) => b.date.localeCompare(a.date)).map(g => gigRow(g, true)).join('') : '';
  setHTML($('shift-list'), groups.map(g => `<div class="day-h"><span>${fmtDay(g.d)}</span><span class="num">${peso(g.l.filter(isShiftActive).reduce((a, s) => a + s.gross, 0))}</span></div>` + g.l.map(s => shiftRow(s, true)).join('')).join('') + (total > shown.length ? `<button type="button" class="btn ghost block press" onclick="moreShifts()">Show ${Math.min(60, total - shown.length)} more · ${total - shown.length} left</button>` : '') + gigHtml);
}
function renderPayslip() {
  updateHolidayFixBanners();
  const P = periodFromKey(selKey), D = periodData(selKey), t = D.t, d = D.d;
  setText($('ps-badge'), P.badge);
  setText($('ps-hours'), `${fh(t.reg)} regular · ${fh(t.ndH)} night · ${fh(t.otH)} overtime`);
  setText($('ps-basic'), peso(t.basic)); setText($('ps-nd'), '+' + peso(t.nd)); setText($('ps-ot'), '+' + peso(t.otp));
  $('ps-allow-row').classList.toggle('hidden', !(D.allow > 0));
  if (D.allow > 0) setText($('ps-allow'), '+' + peso(D.allow));
  setText($('ps-gross'), peso(D.grossAll));
  setText($('ps-sss'), '−' + peso(d.sss)); setText($('ps-ph'), '−' + peso(d.ph)); setText($('ps-pi'), '−' + peso(d.pi)); setText($('ps-tax'), '−' + peso(d.tax)); setText($('ps-oth'), '−' + peso(d.oth));
  setText($('ps-tot-ded'), '−' + peso(d.total));
  setText($('ps-net'), peso(D.net));
  const lBtn = $('ps-lock-btn'), lBar = $('ps-lock-bar');
  if (lBtn) {
    lBtn.classList.toggle('hidden', !D.locked && D.grossAll <= 0);
    lBtn.classList.toggle('on', !!D.locked);
    setText($('ps-lock-txt'), D.locked ? 'Locked' : 'Lock');
  }
  if (lBar) {
    lBar.classList.toggle('hidden', !D.locked);
    if (D.locked) setText($('ps-lock-msg'), D.lockedAuto ? 'Auto-locked after reconciliation — safe from rate/rule edits' : "Snapshot locked — rate & rule changes won't alter this cutoff");
  }
  if ($('ded-adj-sub')) setText($('ded-adj-sub'), D.locked ? 'This cutoff is locked — unlock above to edit deductions' : 'Saved for this cutoff — past cutoffs stay locked');
  if ($('ded-adj-card')) $('ded-adj-card').style.opacity = D.locked ? '.68' : '';
  const setTag = (id, txt, cls) => { const el = $(id); if (!el) return; el.classList.toggle('hidden', !txt); if (txt) { setText(el, txt); el.className = 'ps-basis' + (cls ? ' ' + cls : ''); } };
  if (D.locked) {
    setTag('ps-sss-tag', 'locked', 'ok');
    setTag('ps-ph-tag', 'locked', 'ok');
    setTag('ps-pi-tag', 'locked', 'ok');
  } else if (settings.autoDeduct && d.est) {
    const tc = d.est.skippedLow ? 'warn' : (d.est.deferred ? 'warn' : '');
    setTag('ps-sss-tag', d.est.sssNote, tc);
    setTag('ps-ph-tag', d.est.sssNote, tc);
    setTag('ps-pi-tag', `${Math.round(d.est.piRate * 100)}% basic`, '');
  } else {
    setTag('ps-sss-tag', settings.autoDeduct ? '' : 'manual', '');
    setTag('ps-ph-tag', settings.autoDeduct ? '' : 'manual', '');
    setTag('ps-pi-tag', settings.autoDeduct ? '' : 'manual', '');
  }
  // Actual pay reconciliation
  const badge = $('recon-badge'), msg = $('recon-msg'), sub = $('ps-net-recon'), clr = $('actual-clear');
  if (D.actual === null) {
    setText(badge, 'Not checked'); badge.className = 'chip mute num';
    msg.classList.add('hidden'); sub.classList.add('hidden'); clr.classList.add('hidden');
  } else {
    const diff = r2(D.actual - D.net);
    clr.classList.remove('hidden'); msg.classList.remove('hidden'); sub.classList.remove('hidden');
    if (Math.abs(diff) < 0.01) {
      setText(badge, 'Matched ✓'); badge.className = 'chip ok num';
      setText(msg, 'Matches SweldoPulse estimate exactly ✓'); msg.className = 'recon-msg ok';
      setText(sub, 'Actual payout matched ✓');
    } else if (diff < 0) {
      const s = peso(Math.abs(diff));
      setText(badge, settings.hide ? 'Short' : `−${s} short`); badge.className = 'chip bad num';
      setText(msg, settings.hide ? 'Lower than estimate — check your employer payslip.' : `Short by ${s} — check night diff, OT, holiday pay, or extra deductions.`); msg.className = 'recon-msg bad';
      setText(sub, settings.hide ? 'Actual: short' : `Actual: ${peso(D.actual)} · −${s} short`);
    } else {
      const s = peso(diff);
      setText(badge, settings.hide ? 'Over' : `+${s} over`); badge.className = 'chip ok num';
      setText(msg, settings.hide ? 'Higher than estimate.' : `${s} higher than estimate — may include extra allowances, incentives, or rounding.`); msg.className = 'recon-msg ok';
      setText(sub, settings.hide ? 'Actual: over' : `Actual: ${peso(D.actual)} · +${s} over`);
    }
  }
  const n = $('stat-note'), capNote = d.capped ? ' Deductions are limited to your total earnings for this cutoff.' : '';
  if (settings.autoDeduct && d.est) {
    const lowTxt = d.est.skippedLow ? ` · SSS/PhilHealth skipped (below ${peso(settings.statMinGross || 0)} threshold)` : (d.est.deferred ? ' · includes deferred 1st-cutoff SSS/PhilHealth' : '');
    n.textContent = `SSS MSC ${peso(d.est.msc)} · Pag-IBIG ${Math.round(d.est.piRate * 100)}% of Basic (${peso(t.basic)}) · ${settings.mwe ? 'MWE tax-exempt' : 'TRAIN tax'}${lowTxt}.${capNote}`;
  } else n.textContent = "2026 PH Crew rules: SSS 5% MSC (₱250 min), PhilHealth 2.5% (₱250 min), Pag-IBIG 2% of Basic Pay (max ₱100/cutoff)." + capNote;
  const gn = $('ps-gig-note');
  if (gn) {
    gn.classList.toggle('hidden', !(D.gigTotal > 0));
    if (D.gigTotal > 0) setText(gn, `Plus ${peso(D.gigPaid)} paid side gigs${D.gigPending > 0 ? ` (${peso(D.gigPending)} pending)` : ''} in this cutoff — kept separate from employer payroll deductions.`);
  }
  const y = P.end.getFullYear(), basicYear = shifts.filter(s => isShiftActive(s) && periodOf(s.date).end.getFullYear() === y).reduce((a, s) => a + s.reg * s.hourlyRate, 0);
  setText($('t13-sub'), `Earned in ${y} so far`); setText($('t13-ytd'), peso(basicYear / 12));
  syncDedUI();
  calc13();
}
function calc13() { const h = +$('t13-hrs').value || 0, m = +$('t13-mo').value || 12; setText($('t13-res'), peso(h * (52 / 12) * m * settings.hourlyRate / 12)); }
let _rq = 0;
const dirty = { home: true, shifts: true, deductions: true, insights: true };
const RENDERERS = { home: () => renderHome(), budget: () => renderHome(), shifts: () => renderShifts(), deductions: () => renderPayslip(), insights: () => renderInsights() };
function renderView(v) { const k = v === 'budget' ? 'home' : v; if (!RENDERERS[v] || !dirty[k]) return; dirty[k] = false; RENDERERS[v](); }
function doRender() { _rq = 0; buildPeriods(); dirty.home = dirty.shifts = dirty.deductions = dirty.insights = true; renderView(curView); }
function render() { if (!_rq) _rq = requestAnimationFrame(doRender); }
function renderNow() { cancelAnimationFrame(_rq); doRender(); }

/* ---- payslip deductions & per-cutoff extras controls ---- */
function syncDedUI() {
  $$('#ded-mode button').forEach(b => b.classList.toggle('on', (b.dataset.m === 'auto') === !!settings.autoDeduct));
  $('ded-auto').classList.toggle('hidden', !settings.autoDeduct); $('ded-manual').classList.toggle('hidden', !!settings.autoDeduct);
  $('stat-mode').value = settings.deductMode || 'first'; $('stat-mwe').checked = !!settings.mwe;
  const smEl = $('stat-min'); if (smEl && document.activeElement !== smEl) smEl.value = (settings.statMinGross !== undefined && settings.statMinGross !== null) ? settings.statMinGross : 2000;
  const k = selKey || curPeriod().key, m = getManualDed(k), allow = getAllowance(k), oth = getOtherDed(k), act = getActualNet(k);
  const set = (id, v) => { const el = $(id); if (el && document.activeElement !== el) el.value = (v !== null && v !== undefined && v !== 0 && v !== '') ? v : ''; };
  set('in-sss', m.sss); set('in-ph', m.ph); set('in-pi', m.pi); set('in-tax', m.tax); set('in-allow', allow); set('in-oth', oth);
  const aEl = $('in-actual'); if (aEl && document.activeElement !== aEl) aEl.value = act !== null ? act : '';
}
function setDedMode(auto) {
  const k = selKey || curPeriod().key;
  if (!auto && settings.autoDeduct && !getCutoffExtra(k).manual) {
    const D = periodData(k); if (D.d.est) { ensureCutoffExtra(k).manual = { sss: D.d.sss, ph: D.d.ph, pi: D.d.pi, tax: D.d.tax }; }
  }
  settings.autoDeduct = auto; persistSettings(); syncDedUI(); render();
}
function saveManual() {
  const k = selKey || curPeriod().key, v = id => Math.max(0, parseFloat($(id).value) || 0);
  const rec = ensureCutoffExtra(k);
  rec.manual = { sss: v('in-sss'), ph: v('in-ph'), pi: v('in-pi'), tax: v('in-tax') };
  if (rec.snapshot) delete rec.snapshot;
  persistSettingsDebounced(); render();
}
function saveCutoffExtras() {
  const k = selKey || curPeriod().key, rec = ensureCutoffExtra(k);
  const v = id => Math.max(0, parseFloat($(id).value) || 0);
  const allowChanged = Math.abs((+rec.allowance || 0) - v('in-allow')) > 0.001;
  const othChanged = Math.abs((+rec.otherDed || 0) - v('in-oth')) > 0.001;
  rec.allowance = v('in-allow');
  rec.otherDed = v('in-oth');
  if ((allowChanged || othChanged) && rec.snapshot) delete rec.snapshot;
  const rawAct = $('in-actual') ? $('in-actual').value.trim() : '';
  rec.actualNet = rawAct === '' ? null : Math.max(0, parseFloat(rawAct) || 0);
  if (rec.actualNet !== null && !rec.snapshot) {
    lockCutoffSnapshot(k, true);
  } else if (rec.actualNet === null && rec.snapshot && rec.snapshot.auto) {
    delete rec.snapshot;
  }
  persistSettingsDebounced(); render();
}
function clearActualPay() {
  const k = selKey || curPeriod().key;
  if (settings.cutoffData && settings.cutoffData[k]) {
    settings.cutoffData[k].actualNet = null;
    if (settings.cutoffData[k].snapshot && settings.cutoffData[k].snapshot.auto) delete settings.cutoffData[k].snapshot;
  }
  const aEl = $('in-actual'); if (aEl) aEl.value = '';
  persistSettings(); render(); toast('Actual pay cleared');
}
function fillFromEstimate() {
  const k = selKey || curPeriod().key, D = periodData(k); if (D.t.gross <= 0) return toast('Log shifts in this cutoff first');
  const e = estimateStatutory(k, D.t.gross, D.t.basic); ensureCutoffExtra(k).manual = { sss: e.sss, ph: e.ph, pi: e.pi, tax: e.tax };
  persistSettings(); syncDedUI(); render(); toast('Filled from estimate');
}
function setStatOpt() { settings.deductMode = $('stat-mode').value; settings.mwe = $('stat-mwe').checked; if ($('stat-min')) settings.statMinGross = Math.max(0, parseFloat($('stat-min').value) || 0); persistSettingsDebounced(); render(); }

/* ================= shift sheet ================= */
function populateTimes() {
  let h = ''; for (let m = 0; m < 1440; m += 30) { const v = `${p2(Math.floor(m / 60))}:${p2(m % 60)}`; h += `<option value="${v}">${t12(v)}</option>`; }
  ['m-start', 'm-end', 'notif-time', 'due-notif-time', 'bk-start', 'bk-end'].forEach(id => { if ($(id)) $(id).innerHTML = h; });
  const optH = '<option value="">Any time</option>' + h;
  ['g-start', 'g-end'].forEach(id => { if ($(id)) $(id).innerHTML = optH; });
}
function ensureTimeOpt(sel, val) {
  if (!sel || !val || !/^\d{2}:\d{2}$/.test(val)) return;
  if ([...sel.options].some(o => o.value === val)) { sel.value = val; return; }
  const opt = document.createElement('option'); opt.value = val; opt.textContent = t12(val);
  const targetM = tmin(val), after = [...sel.options].find(o => tmin(o.value) > targetM);
  sel.insertBefore(opt, after || null); sel.value = val;
}
function setBreak(n) { modalBrk = n; $$('#m-break button').forEach(b => b.classList.toggle('on', +b.dataset.b === n)); updatePreview(); }
function priorHours(date, startMin, excludeId) {
  return shifts.filter(s => s.date === date && s.id !== excludeId && isShiftActive(s) && s.startTime && s.endTime && tmin(s.startTime) < startMin)
    .reduce((a, s) => { const r = calcPay({ start: s.startTime, end: s.endTime, mult: s.multiplier, rate: s.hourlyRate, brk: s.breakMin || 0 }); return a + (r ? r.paid : 0); }, 0);
}
function toggleShiftRateBox() {
  const box = $('m-rate-box'); if (!box) return;
  box.classList.toggle('hidden');
  if (!box.classList.contains('hidden')) setTimeout(() => { const inp = $('m-rate'); if (inp) inp.focus(); }, 60);
}
function resetShiftRate() {
  const inp = $('m-rate'); if (inp) inp.value = settings.hourlyRate;
  $('m-rate-box').classList.add('hidden');
  updatePreview();
}
function readModal() {
  const date = $('m-date').value || today(), start = $('m-start').value, end = $('m-end').value, mult = parseFloat($('m-mult').value) || 1;
  const rawRate = $('m-rate') ? parseFloat($('m-rate').value) : NaN;
  const fallbackRate = editingId !== null ? (shifts.find(s => s.id === editingId) || {}).hourlyRate || settings.hourlyRate : settings.hourlyRate;
  const rate = (isFinite(rawRate) && rawRate > 0) ? r2(rawRate) : fallbackRate;
  const nm = settings.midnightHolidaySplit !== false ? nextDayMultFor(date) : null;
  const r = calcPay({ start, end, mult, rate, brk: modalBrk, prior: priorHours(date, tmin(start), editingId), nextMult: nm });
  return { date, start, end, mult, rate, brk: modalBrk, r };
}
function setLogKind(k) {
  modalKind = k;
  $$('#m-kind button').forEach(b => b.classList.toggle('on', b.dataset.k === k));
  $('m-shift-form').classList.toggle('hidden', k !== 'shift');
  $('m-gig-form').classList.toggle('hidden', k !== 'gig');
  if (k === 'gig') {
    setText($('shift-title'), editingGigId !== null ? 'Edit side gig' : 'Log side gig');
    setText($('shift-hint'), 'Flat-rate income · kept separate from payroll deductions');
    renderGigStreams();
  } else {
    setText($('shift-title'), editingId !== null ? 'Edit shift' : 'Log shift');
    updatePreview();
  }
}
function setShiftStatus(st) { modalStatus = st; $$('#m-status button').forEach(b => b.classList.toggle('on', b.dataset.s === st)); updatePreview(); }
function setGigStatus(st) { modalGigStatus = st; $$('#g-status button').forEach(b => b.classList.toggle('on', b.dataset.gs === st)); if ($('g-due-wrap')) $('g-due-wrap').classList.toggle('hidden', st !== 'pending'); }
function updatePreview() {
  const v = readModal();
  $('m-next').classList.toggle('hidden', !(tmin(v.end) < tmin(v.start)));
  setText($('m-gross-lbl'), modalStatus === 'cancelled' ? 'Cancelled shift' : (modalStatus === 'scheduled' ? 'Projected gross' : 'Gross pay'));
  setText($('m-gross'), modalStatus === 'cancelled' ? '₱0.00' : (v.r ? peso(v.r.gross) : '₱0.00'));
  if ($('m-rate-btn')) setText($('m-rate-btn'), `${peso(v.rate)}/hr`);
  const spTxt = (v.r && v.r.splitApplied) ? ` · 12AM split ${v.mult}×→${v.r.nextMult}×` : '';
  setText($('shift-hint'), modalStatus === 'cancelled' ? 'Excluded from pay & hours (kept in log history)' : (v.r ? `${fh(v.r.reg)} reg · ${fh(v.r.nd)} ND · ${fh(v.r.ot)} OT${spTxt}` : 'End time must differ from start time'));
  const P = periodOf(v.date); setText($('m-cut'), `${P.badge}\n${P.label}`); $('m-cut').style.whiteSpace = 'pre-line';
}
function onDateChange(keepMult) {
  const date = $('m-date').value || today(), h = holidayFor(date), box = $('m-holiday');
  if (h) { box.textContent = holidayBadgeText(h); box.classList.remove('hidden'); if (!keepMult) $('m-mult').value = h.mult.toFixed(2); }
  else { box.classList.add('hidden'); if (!keepMult) $('m-mult').value = '1.00'; }
  if (!keepMult) setShiftStatus(date > today() ? 'scheduled' : 'worked');
  updatePreview();
}
function openShift(id = null) {
  editingId = id; editingGigId = null;
  const s = id !== null ? shifts.find(x => x.id === id) : null;
  $('m-kind').classList.toggle('hidden', !!s);
  $('m-save').textContent = s ? 'Update shift' : 'Save shift';
  $('m-del').classList.toggle('hidden', !s);
  $('g-del').classList.add('hidden'); $('g-save').textContent = 'Save side gig';
  const cur = curPeriod(), P = periodFromKey(selKey);
  $('g-date').value = P.key === cur.key ? today() : P.endStr; $('g-amt').value = ''; $('g-title').value = ''; $('g-stream').value = ''; if ($('g-start')) $('g-start').value = ''; if ($('g-end')) $('g-end').value = ''; if ($('g-due')) $('g-due').value = ''; setGigStatus('paid');
  $('m-rate-box').classList.add('hidden');
  if (s) {
    $('m-date').value = s.date; ensureTimeOpt($('m-start'), s.startTime || '16:00'); ensureTimeOpt($('m-end'), s.endTime || '22:00');
    $('m-rate').value = s.hourlyRate || settings.hourlyRate;
    $('m-mult').value = s.multiplier.toFixed(2); if (!$('m-mult').value) $('m-mult').value = '1.00'; $('m-note').value = s.note || ''; modalBrk = s.breakMin || 0; modalStatus = shiftStatusOf(s); onDateChange(true);
  } else {
    const L = settings.last;
    $('m-date').value = P.key === cur.key ? today() : P.endStr; ensureTimeOpt($('m-start'), L.start || '16:00'); ensureTimeOpt($('m-end'), L.end || '22:00'); $('m-rate').value = settings.hourlyRate; $('m-note').value = ''; modalBrk = L.brk || 0; onDateChange(false);
  }
  setLogKind('shift'); setShiftStatus(modalStatus); renderPresets(); renderStationChips(); setBreak(modalBrk); openSheet('shift-sheet');
}
function openGig(id = null) {
  editingId = null; editingGigId = id;
  const g = id !== null ? gigs.find(x => x.id === id) : null;
  $('m-kind').classList.toggle('hidden', !!g);
  $('g-del').classList.toggle('hidden', !g); $('g-save').textContent = g ? 'Update side gig' : 'Save side gig';
  const cur = curPeriod(), P = periodFromKey(selKey);
  $('g-date').value = g ? g.date : (P.key === cur.key ? today() : P.endStr);
  $('g-amt').value = g ? g.amount : '';
  $('g-stream').value = g ? g.stream : '';
  $('g-title').value = g ? g.title : '';
  if ($('g-start')) { if (g && g.startTime) ensureTimeOpt($('g-start'), g.startTime); else $('g-start').value = ''; }
  if ($('g-end')) { if (g && g.endTime) ensureTimeOpt($('g-end'), g.endTime); else $('g-end').value = ''; }
  if ($('g-due')) $('g-due').value = (g && g.dueDate) ? g.dueDate : '';
  setGigStatus(g ? g.status : 'paid');
  setLogKind('gig'); openSheet('shift-sheet');
}
function closeShift() { closeSheet('shift-sheet'); editingId = null; editingGigId = null; }
let _gigStreamItems = [];
function pickGigStreamIdx(i) { const n = _gigStreamItems[i]; if (n !== undefined) { $('g-stream').value = n; syncGigChips(); } }
function renderGigStreams() {
  const box = $('g-streams'); if (!box) return;
  const seen = new Map();
  gigs.forEach(g => { const k = g.stream.toLowerCase(); const cur = seen.get(k) || { n: g.stream, c: 0 }; cur.c++; seen.set(k, cur); });
  const list = [...seen.values()].sort((a, b) => b.c - a.c).map(x => x.n).slice(0, 6);
  ['Catering', 'Freelance', 'Sound System', 'Affiliate', 'Side Gig'].forEach(d => { if (!list.some(x => x.toLowerCase() === d.toLowerCase())) list.push(d); });
  _gigStreamItems = list.slice(0, 7);
  setHTML(box, _gigStreamItems.map((n, i) => `<button type="button" class="schip press" data-gs-chip="${esc(n.toLowerCase())}" onclick="pickGigStreamIdx(${i})">${esc(n)}</button>`).join(''));
  syncGigChips();
}
function syncGigChips() { const v = ($('g-stream').value || '').trim().toLowerCase(); $$('#g-streams .schip').forEach(b => b.classList.toggle('on', b.dataset.gsChip === v)); }
function saveGig(forceAllowUntimed = false) {
  const amt = r2(Math.max(0, parseFloat($('g-amt').value) || 0));
  if (!(amt > 0)) return toast('Enter an amount earned');
  const date = $('g-date').value || today(), stream = $('g-stream').value.trim() || 'Side Gig', title = $('g-title').value.trim(), status = modalGigStatus;
  const dueDate = status === 'pending' && $('g-due') ? ($('g-due').value || '') : '';
  const startTime = ($('g-start') && $('g-start').value) || '', endTime = ($('g-end') && $('g-end').value) || '';
  if ((startTime && !endTime) || (!startTime && endTime)) return toast('Pick both start and end times, or leave both as Any time');
  if (startTime && endTime && startTime === endTime) return toast('Gig end time must differ from start time');

  if (startTime && endTime) {
    const ovSh = findOverlappingShifts(date, startTime, endTime, null);
    const ovGg = findOverlappingGigs(date, startTime, endTime, editingGigId);
    const conflicts = [...ovSh.map(s => ({ type: 'shift', o: s })), ...ovGg.map(g => ({ type: 'gig', o: g }))];
    if (conflicts.length) {
      openConflictSheet({
        title: 'Overlapping schedule',
        body: 'This side gig overlaps an existing duty or gig. Edit or delete the conflicting entry, or adjust your hours.',
        items: conflicts,
        canKeepBoth: false,
        onReplace: () => {
          deleteConflictItems(conflicts);
          commitSaveGig({ date, startTime, endTime, stream, title, amount: amt, status, dueDate });
        }
      });
      return;
    }
  } else if (!forceAllowUntimed) {
    const sameShifts = shifts.filter(s => s.date === date && isShiftActive(s));
    if (sameShifts.length) {
      const conflicts = sameShifts.map(s => ({ type: 'shift', o: s }));
      openConflictSheet({
        title: 'Duty & side gig on same day',
        body: 'You already have a shift logged on this day. Add gig start/end times to check overlap automatically, or choose what to do below.',
        items: conflicts,
        canKeepBoth: true,
        onReplace: () => {
          deleteConflictItems(conflicts);
          commitSaveGig({ date, startTime, endTime, stream, title, amount: amt, status, dueDate });
        },
        onKeepBoth: () => commitSaveGig({ date, startTime, endTime, stream, title, amount: amt, status, dueDate })
      });
      return;
    }
  }
  commitSaveGig({ date, startTime, endTime, stream, title, amount: amt, status, dueDate });
}
function commitSaveGig({ date, startTime, endTime, stream, title, amount, status, dueDate = '' }) {
  const wasEdit = editingGigId !== null;
  if (wasEdit) {
    const g = gigs.find(x => x.id === editingGigId);
    if (g) Object.assign(g, { date, startTime, endTime, stream, title, amount, status, dueDate });
  } else {
    gigs.push({ id: nextId(), date, startTime, endTime, stream, title, amount, status, dueDate });
  }
  persistGigs(); selKey = periodOf(date).key; closeShift(); render();
  toast(wasEdit ? 'Side gig updated' : `Added ${peso(amount)} (${stream})`);
}
async function deleteGig(id) {
  const g = gigs.find(x => x.id === id); if (!g) return;
  const ok = await askConfirm({ title: 'Delete side gig?', body: `<b>${esc(g.title || g.stream)}</b><br>${fmtDay(g.date)} · ${peso(g.amount)}`, ok: 'Delete' });
  if (!ok) return;
  gigs = gigs.filter(x => x.id !== id); persistGigs(); render();
  toast('Side gig deleted', { label: 'Undo', fn: () => { gigs.push(g); persistGigs(); render(); toast('Side gig restored'); } });
}
function deleteGigFromSheet() { const id = editingGigId; closeShift(); setTimeout(() => deleteGig(id), 200); }
function shortT(t) { const [h, m] = t.split(':').map(Number); const H = h % 12 === 0 ? 12 : h % 12; return `${H}${m ? ':' + p2(m) : ''}${h >= 12 ? 'p' : 'a'}`; }
let _presetItems = [], _stationItems = [];
function applyPresetItem(i) { const p = _presetItems[i]; if (p) preset(p.start, p.end, p.label, p.brk, true); }
function pickStationIdx(i) { const n = _stationItems[i]; if (n !== undefined) { $('m-note').value = n; syncStationHighlight(); } }
function renderPresets() {
  const box = $('m-presets'); if (!box) return;
  const pinned = Array.isArray(settings.customPresets) ? settings.customPresets : [];
  const seen = new Set(pinned.map(p => `${p.start}|${p.end}|${p.brk || 0}|${(p.label || '').toLowerCase()}`));
  const freq = new Map();
  shifts.forEach(s => {
    if (!s.startTime || !s.endTime) return;
    const lbl = (s.note || '').trim(), k = `${s.startTime}|${s.endTime}|${s.breakMin || 0}|${lbl.toLowerCase()}`;
    if (seen.has(k)) return;
    const cur = freq.get(k) || { start: s.startTime, end: s.endTime, brk: s.breakMin || 0, label: lbl, c: 0 };
    cur.c++; if (lbl) cur.label = lbl; freq.set(k, cur);
  });
  const learned = [...freq.values()].sort((a, b) => b.c - a.c).slice(0, 3);
  _presetItems = [];
  let h = '';
  pinned.forEach((p, idx) => {
    const pi = _presetItems.push({ start: p.start, end: p.end, brk: p.brk || 0, label: p.label || '' }) - 1;
    const txt = p.label ? `${p.label} · ${shortT(p.start)}–${shortT(p.end)}` : `${shortT(p.start)}–${shortT(p.end)}`;
    h += `<button type="button" class="fchip on pin-chip" onclick="applyPresetItem(${pi})"><span>${esc(txt)}</span><span class="pin-x" role="button" aria-label="Remove preset" onclick="event.stopPropagation();removePreset(${idx})">×</span></button>`;
  });
  learned.forEach(p => {
    const pi = _presetItems.push({ start: p.start, end: p.end, brk: p.brk || 0, label: p.label || '' }) - 1;
    const txt = p.label ? `${p.label} · ${shortT(p.start)}–${shortT(p.end)}` : `${shortT(p.start)}–${shortT(p.end)}`;
    h += `<button type="button" class="fchip" onclick="applyPresetItem(${pi})">${esc(txt)}</button>`;
  });
  h += `<button type="button" class="fchip" onclick="preset('14:00','18:00','4h shift',0,false)">4h</button>` +
       `<button type="button" class="fchip" onclick="preset('16:00','22:00','6h shift',0,false)">6h</button>` +
       `<button type="button" class="fchip" onclick="preset('08:00','17:00','8h + 1h break',60,false)">8h + break</button>` +
       `<button type="button" class="fchip" onclick="extendEnd(1)" style="color:var(--accent-text);border-color:var(--accent-soft-border);background:var(--accent-soft)">+1h</button>`;
  setHTML(box, h);
}
function pinCurrentPreset() {
  const start = $('m-start').value, end = $('m-end').value;
  if (start === end) return toast('Pick valid start and end times first');
  const label = $('m-note').value.trim(), brk = modalBrk || 0;
  if (!Array.isArray(settings.customPresets)) settings.customPresets = [];
  const sig = `${start}|${end}|${brk}|${label.toLowerCase()}`;
  if (settings.customPresets.some(p => `${p.start}|${p.end}|${p.brk || 0}|${(p.label || '').toLowerCase()}` === sig)) return toast('Already pinned');
  settings.customPresets.unshift({ start, end, brk, label });
  if (settings.customPresets.length > 6) settings.customPresets.pop();
  persistSettings(); renderPresets(); toast('Preset pinned');
}
function removePreset(idx) {
  if (!Array.isArray(settings.customPresets)) return;
  settings.customPresets.splice(idx, 1); persistSettings(); renderPresets(); toast('Preset removed');
}
function renderStationChips() {
  const box = $('m-stations'); if (!box) return;
  const map = new Map();
  shifts.forEach(s => { const n = (s.note || '').trim(); if (!n) return; const k = n.toLowerCase(); const cur = map.get(k) || { n, c: 0 }; cur.c++; cur.n = n; map.set(k, cur); });
  const list = [...map.values()].sort((a, b) => b.c - a.c).map(x => x.n).slice(0, 8);
  ['Regular Shift', 'Opening', 'Mid', 'Closing'].forEach(d => { if (list.length < 4 && !list.some(x => x.toLowerCase() === d.toLowerCase())) list.push(d); });
  _stationItems = list;
  setHTML(box, list.map((n, i) => `<button type="button" class="schip press" data-st="${esc(n.toLowerCase())}" onclick="pickStationIdx(${i})">${esc(n)}</button>`).join(''));
  syncStationHighlight();
}
function syncStationHighlight() { const v = ($('m-note').value || '').trim().toLowerCase(); $$('#m-stations .schip').forEach(b => b.classList.toggle('on', b.dataset.st === v)); }
function preset(a, b, label, brk, forceLabel) { $('m-start').value = a; $('m-end').value = b; if (forceLabel || !$('m-note').value) $('m-note').value = label || ''; syncStationHighlight(); setBreak(brk || 0); }
function extendEnd(h) { const e = $('m-end'); const n = (tmin(e.value) + h * 60) % 1440; e.value = `${p2(Math.floor(n / 60))}:${p2(n % 60)}`; updatePreview(); toast(`End time +${h}h`); }
function intervalOf(date, start, end) {
  const base = dayNum(date) * 1440, a0 = base + tmin(start);
  let a1 = base + tmin(end);
  if (tmin(end) <= tmin(start)) a1 += 1440;
  return [a0, a1];
}
function intervalsOverlap(a, b) { return a[0] < b[1] && b[0] < a[1]; }
function findOverlappingShifts(date, start, end, excludeId) {
  if (!date || !start || !end) return [];
  const iv = intervalOf(date, start, end);
  return shifts.filter(s => {
    if (s.id === excludeId || !isShiftActive(s) || !s.startTime || !s.endTime) return false;
    return intervalsOverlap(iv, intervalOf(s.date, s.startTime, s.endTime));
  });
}
function findOverlappingGigs(date, start, end, excludeGigId) {
  if (!date || !start || !end) return [];
  const iv = intervalOf(date, start, end);
  return gigs.filter(g => {
    if (g.id === excludeGigId || !g.startTime || !g.endTime) return false;
    return intervalsOverlap(iv, intervalOf(g.date, g.startTime, g.endTime));
  });
}
let _conflictCtx = null;
function openConflictSheet({ title, body, items, canKeepBoth = false, onReplace, onKeepBoth }) {
  _conflictCtx = { items, onReplace, onKeepBoth };
  setText($('cfl-title'), title);
  setText($('cfl-body'), body);
  $('cfl-keep-btn').classList.toggle('hidden', !canKeepBoth);
  setText($('cfl-replace-btn'), items.length > 1 ? `Delete ${items.length} conflicting & save new` : 'Delete conflicting & save new');
  setHTML($('cfl-list'), items.map((it, idx) => {
    if (it.type === 'shift') {
      const s = it.o;
      return `<div class="conflict-item"><div class="grow" style="min-width:0"><p style="font-weight:700;font-size:13px">${esc(shiftLabel(s))}</p><p class="card-s num">${fmtDay(s.date)} · ${t12(s.startTime)}–${t12(s.endTime)} · ${peso(s.gross)}</p></div><button type="button" class="btn soft sm press" style="min-height:32px;padding:0 11px" onclick="conflictEditItem(${idx})">Edit</button></div>`;
    }
    const g = it.o;
    const tr = g.startTime && g.endTime ? ` · ${t12(g.startTime)}–${t12(g.endTime)}` : ' · Any time';
    return `<div class="conflict-item"><div class="grow" style="min-width:0"><p style="font-weight:700;font-size:13px">${esc(g.title || g.stream)} <span class="dot-b gg">Gig</span></p><p class="card-s num">${fmtDay(g.date)}${tr} · +${peso(g.amount)}</p></div><button type="button" class="btn soft sm press" style="min-height:32px;padding:0 11px" onclick="conflictEditItem(${idx})">Edit</button></div>`;
  }).join(''));
  openSheet('conflict-sheet');
}
function closeConflictSheet() { closeSheet('conflict-sheet'); _conflictCtx = null; }
function conflictEditItem(idx) {
  const it = _conflictCtx && _conflictCtx.items[idx];
  closeConflictSheet();
  if (!it) return;
  if (it.type === 'shift') openShift(it.o.id);
  else openGig(it.o.id);
}
function conflictReplace() {
  const fn = _conflictCtx && _conflictCtx.onReplace;
  closeConflictSheet();
  if (fn) fn();
}
function conflictKeepBoth() {
  const fn = _conflictCtx && _conflictCtx.onKeepBoth;
  closeConflictSheet();
  if (fn) fn();
}
function deleteConflictItems(items) {
  const shiftIds = new Set(items.filter(x => x.type === 'shift').map(x => x.o.id));
  const gigIds = new Set(items.filter(x => x.type === 'gig').map(x => x.o.id));
  const days = new Set();
  if (shiftIds.size) {
    shifts.filter(s => shiftIds.has(s.id)).forEach(s => days.add(s.date));
    shifts = shifts.filter(s => !shiftIds.has(s.id));
    days.forEach(ds => { recalcDay(ds); unlockCutoffSnapshot(periodOf(ds).key, true); });
    persistShifts();
  }
  if (gigIds.size) {
    gigs = gigs.filter(g => !gigIds.has(g.id));
    persistGigs();
  }
}
function commitSaveShift(v, note) {
  let old = null;
  if (editingId !== null) {
    const s = shifts.find(x => x.id === editingId);
    if (s) { old = s.date; Object.assign(s, { date: v.date, startTime: v.start, endTime: v.end, note, hourlyRate: v.rate, multiplier: v.mult, breakMin: v.brk, status: modalStatus }); }
  } else shifts.push({ id: nextId(), date: v.date, startTime: v.start, endTime: v.end, note, hourlyRate: v.rate, reg: 0, nd: 0, ot: 0, multiplier: v.mult, gross: 0, breakMin: v.brk, status: modalStatus });
  recalcDay(v.date); if (old && old !== v.date) recalcDay(old);
  const P = periodOf(v.date);
  const unlockedEdited = unlockCutoffSnapshot(P.key, true) || (old ? unlockCutoffSnapshot(periodOf(old).key, true) : false);
  settings.last = { start: v.start, end: v.end, brk: v.brk }; persistSettings(); persistShifts();
  selKey = P.key; const wasEdit = editingId !== null;
  closeShift(); render(); toast((wasEdit ? `Updated in ${P.label}` : `Added to ${P.label}`) + (unlockedEdited ? ' · cutoff unlocked' : ''));
}
async function saveShift(forceAllowUntimedGig = false) {
  const v = readModal();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v.date)) return toast('Choose a valid shift date');
  if (!v.start || !v.end || !v.r) return toast('End time must differ from start time');
  if (v.r.gross <= 0) return toast('Choose a valid time range');
  if (modalStatus !== 'cancelled' && v.r.paid > 16 && !await askConfirm({ title: 'Very long shift', body: `This shift is <b>${fh(v.r.paid)}</b> of paid time. Is that right?`, ok: 'Yes, save it', danger: false })) return;
  const note = $('m-note').value.trim();
  if (modalStatus !== 'cancelled') {
    const ovSh = findOverlappingShifts(v.date, v.start, v.end, editingId);
    const ovGg = findOverlappingGigs(v.date, v.start, v.end, null);
    const hardConflicts = [...ovSh.map(s => ({ type: 'shift', o: s })), ...ovGg.map(g => ({ type: 'gig', o: g }))];
    if (hardConflicts.length) {
      openConflictSheet({
        title: 'Duplicate or overlapping hours',
        body: 'Overlapping duty hours are not allowed. Update/edit the conflicting shift below or delete it to save this one.',
        items: hardConflicts,
        canKeepBoth: false,
        onReplace: () => { deleteConflictItems(hardConflicts); commitSaveShift(v, note); }
      });
      return;
    }
    if (!forceAllowUntimedGig) {
      const untimedGigs = gigs.filter(g => g.date === v.date && (!g.startTime || !g.endTime));
      if (untimedGigs.length) {
        const items = untimedGigs.map(g => ({ type: 'gig', o: g }));
        openConflictSheet({
          title: 'Side gig on the same day',
          body: 'You have an untimed side gig on this day. Choose whether to edit/delete it or keep both if the hours do not overlap.',
          items,
          canKeepBoth: true,
          onReplace: () => { deleteConflictItems(items); commitSaveShift(v, note); },
          onKeepBoth: () => commitSaveShift(v, note)
        });
        return;
      }
    }
  }
  commitSaveShift(v, note);
}
/* ================= weekly roster bulk logger ================= */
let bulkMon = null, bulkSel = new Set(), bulkBrk = 0, _bkPresetItems = [];
function mondayOf(d) { const x = new Date(d.getFullYear(), d.getMonth(), d.getDate()); const dow = (x.getDay() + 6) % 7; x.setDate(x.getDate() - dow); return x; }
function openBulkSheet() {
  bulkMon = mondayOf(new Date()); bulkSel.clear();
  const L = settings.last || { start: '16:00', end: '22:00', brk: 0 };
  ensureTimeOpt($('bk-start'), L.start || '16:00'); ensureTimeOpt($('bk-end'), L.end || '22:00'); $('blk-note').value = ''; setBulkBreak(L.brk || 0);
  renderBulkTemplates(); renderBulkPresets(); renderBulkWeek(); openSheet('bulk-sheet');
}
function stepBulkWeek(dir) { bulkMon = addDays(bulkMon, dir * 7); bulkSel.clear(); renderBulkWeek(); }
function toggleBulkDay(ds) { if (bulkSel.has(ds)) bulkSel.delete(ds); else bulkSel.add(ds); renderBulkWeek(); }
function setBulkBreak(n) { bulkBrk = n; $$('#bk-break button').forEach(b => b.classList.toggle('on', +b.dataset.bb === n)); updateBulkPreview(); }
function applyBulkPreset(i) { const p = _bkPresetItems[i]; if (!p) return; ensureTimeOpt($('bk-start'), p.start); ensureTimeOpt($('bk-end'), p.end); $('blk-note').value = p.label || ''; setBulkBreak(p.brk || 0); }
function renderBulkPresets() {
  const box = $('bk-presets'); if (!box) return;
  const pinned = Array.isArray(settings.customPresets) ? settings.customPresets : [];
  const seen = new Set(pinned.map(p => `${p.start}|${p.end}|${p.brk || 0}|${(p.label || '').toLowerCase()}`));
  const freq = new Map();
  shifts.forEach(s => { if (!s.startTime || !s.endTime) return; const lbl = (s.note || '').trim(), k = `${s.startTime}|${s.endTime}|${s.breakMin || 0}|${lbl.toLowerCase()}`; if (seen.has(k)) return; const cur = freq.get(k) || { start: s.startTime, end: s.endTime, brk: s.breakMin || 0, label: lbl, c: 0 }; cur.c++; freq.set(k, cur); });
  _bkPresetItems = [...pinned.slice(0, 4), ...[...freq.values()].sort((a, b) => b.c - a.c).slice(0, 3)];
  let h = _bkPresetItems.map((p, i) => `<button type="button" class="fchip" onclick="applyBulkPreset(${i})">${esc(p.label ? p.label + ' · ' : '')}${shortT(p.start)}–${shortT(p.end)}</button>`).join('');
  if (!h) h = `<button type="button" class="fchip" onclick="$('bk-start').value='16:00';$('bk-end').value='22:00';setBulkBreak(0)">6h (4p–10p)</button><button type="button" class="fchip" onclick="$('bk-start').value='18:00';$('bk-end').value='00:00';setBulkBreak(0)">6h ND (6p–12a)</button><button type="button" class="fchip" onclick="$('bk-start').value='08:00';$('bk-end').value='17:00';setBulkBreak(60)">8h + 1h break</button>`;
  setHTML(box, h);
}
function renderBulkWeek() {
  const sun = addDays(bulkMon, 6);
  setText($('bk-week-range'), `${MON[bulkMon.getMonth()]} ${bulkMon.getDate()} – ${MON[sun.getMonth()]} ${sun.getDate()}`);
  let h = '';
  for (let i = 0; i < 7; i++) {
    const d = addDays(bulkMon, i), ds = dstr(d), on = bulkSel.has(ds), hol = holidayFor(ds);
    h += `<button type="button" class="wday press${on ? ' on' : ''}" onclick="toggleBulkDay('${ds}')"><span>${DOW[d.getDay()].slice(0, 2)}</span><b class="num">${d.getDate()}</b>${hol ? '<i class="hdot"></i>' : ''}</button>`;
  }
  setHTML($('bk-days'), h);
  updateBulkPreview();
}
function updateBulkPreview() {
  const st = $('bk-start').value, en = $('bk-end').value, days = [...bulkSel].sort();
  let totGross = 0, totHrs = 0;
  days.forEach(ds => {
    const hol = holidayFor(ds), mult = hol ? hol.mult : 1;
    const nm = settings.midnightHolidaySplit !== false ? nextDayMultFor(ds) : null;
    const r = calcPay({ start: st, end: en, mult, rate: settings.hourlyRate, brk: bulkBrk, prior: 0, nextMult: nm });
    if (r) { totGross += r.gross; totHrs += r.paid; }
  });
  setText($('bk-gross'), peso(totGross));
  setText($('bk-summary'), days.length ? `${days.length} day${days.length > 1 ? 's' : ''} · ${fh(totHrs)}` : 'Tap days above');
  setText($('bk-save-btn'), days.length ? `Add ${days.length} shift${days.length > 1 ? 's' : ''}` : 'Select days to add');
  $('bk-save-btn').disabled = !days.length || st === en;
}
function saveBulkShifts() {
  const st = $('bk-start').value, en = $('bk-end').value, note = $('blk-note').value.trim(), days = [...bulkSel].sort(), td = today();
  if (!days.length || st === en) return;
  let added = 0, skipped = 0;
  days.forEach((ds, idx) => {
    if (findOverlappingShifts(ds, st, en, null).length || findOverlappingGigs(ds, st, en, null).length) { skipped++; return; }
    const hol = holidayFor(ds);
    shifts.push({ id: nextId(), date: ds, startTime: st, endTime: en, note, hourlyRate: settings.hourlyRate, reg: 0, nd: 0, ot: 0, multiplier: hol ? hol.mult : 1, gross: 0, breakMin: bulkBrk, status: ds > td ? 'scheduled' : 'worked' });
    recalcDay(ds); unlockCutoffSnapshot(periodOf(ds).key, true); added++;
  });
  if (added) { settings.last = { start: st, end: en, brk: bulkBrk }; persistSettings(); persistShifts(); selKey = periodOf(days[days.length - 1]).key; }
  closeSheet('bulk-sheet'); render();
  toast(added ? `Added ${added} shift${added > 1 ? 's' : ''}${skipped ? ` · ${skipped} skipped (overlap)` : ''}` : 'Skipped — overlapping shift already logged');
}
/* ================= yearly insights & statutory ledger ================= */
let _insCache = null;
function setInsTab(t) {
  ui.insTab = t;
  $$('#ins-tabs button').forEach(b => b.classList.toggle('on', b.dataset.it === t));
  $('ins-p-overview').classList.toggle('hidden', t !== 'overview');
  $('ins-p-statutory').classList.toggle('hidden', t !== 'statutory');
}
function toggleInsScope() {
  settings.incomeScope = settings.incomeScope === 'payroll' ? 'all' : 'payroll';
  persistSettings(); renderInsights();
  toast(settings.incomeScope === 'all' ? 'Insights: Payroll + Side gigs' : 'Insights: Main payroll only');
}
function stepInsightYear(dir) { ui.insYear += dir; renderInsights(); }
function pickInsightMonth(m) { ui.insMonth = m; drawInsightMonthDetail(); }
function computeYearData(yr) {
  const months = Array.from({ length: 12 }, (_, m) => ({ m, gross: 0, net: 0, gigs: 0, hrs: 0, shifts: 0, sss: 0, ph: 0, pi: 0, tax: 0, oth: 0 }));
  // Assign each cutoff by its pay-period end year (handles weekly Dec 29–Jan 4 cutoffs with zero loss or double-counting)
  const pKeys = new Set();
  shifts.forEach(s => { if (!isShiftActive(s)) return; const P = periodOf(s.date); if (P.end.getFullYear() === yr) pKeys.add(P.key); });
  gigs.forEach(g => { if (g.status === 'pending') return; const P = periodOf(g.date); if (P.end.getFullYear() === yr) pKeys.add(P.key); });
  const yShifts = [], yGigs = [];
  pKeys.forEach(k => {
    const P = periodFromKey(k);
    const D = periodData(k), mo = months[P.end.getMonth()];
    D.list.filter(isShiftActive).forEach(s => yShifts.push(s));
    D.gList.filter(g => g.status !== 'pending').forEach(g => yGigs.push(g));
    mo.gross = r2(mo.gross + D.grossAll);
    mo.net = r2(mo.net + D.net);
    mo.gigs = r2(mo.gigs + D.gigPaid);
    mo.hrs = r2(mo.hrs + D.t.hrs);
    mo.shifts += D.t.n;
    mo.sss = r2(mo.sss + D.d.sss); mo.ph = r2(mo.ph + D.d.ph); mo.pi = r2(mo.pi + D.d.pi); mo.tax = r2(mo.tax + D.d.tax); mo.oth = r2(mo.oth + D.d.oth);
  });
  const totGross = r2(yShifts.reduce((a, s) => a + s.gross, 0));
  const totHrs = r2(yShifts.reduce((a, s) => a + s.reg + s.ot, 0));
  const basicYr = r2(yShifts.reduce((a, s) => a + s.reg * s.hourlyRate, 0));
  const totNet = r2(months.reduce((a, x) => a + x.net, 0));
  const totGigs = r2(months.reduce((a, x) => a + x.gigs, 0));
  const st = { sss: r2(months.reduce((a, x) => a + x.sss, 0)), ph: r2(months.reduce((a, x) => a + x.ph, 0)), pi: r2(months.reduce((a, x) => a + x.pi, 0)), tax: r2(months.reduce((a, x) => a + x.tax, 0)) };
  const bySt = new Map();
  yShifts.forEach(s => { const k = shiftLabel(s); const cur = bySt.get(k) || { n: k, v: 0, c: 0 }; cur.v += s.gross; cur.c++; bySt.set(k, cur); });
  yGigs.forEach(g => { const k = g.stream + ' (gig)'; const cur = bySt.get(k) || { n: k, v: 0, c: 0 }; cur.v += g.amount; cur.c++; bySt.set(k, cur); });
  const top = [...bySt.values()].sort((a, b) => b.v - a.v).slice(0, 5);
  return { yr, months, totGross, totHrs, totShifts: yShifts.length, basicYr, totNet, totGigs, st, top, cutoffCount: pKeys.size };
}
function drawInsightMonthDetail() {
  if (!_insCache) return;
  const mo = _insCache.months[ui.insMonth] || _insCache.months[0];
  const allMode = settings.incomeScope === 'all' && _insCache.totGigs > 0;
  const val = allMode ? r2(mo.net + mo.gigs) : mo.net;
  setText($('ins-mo-detail'), `${MONF[mo.m]} ${_insCache.yr}: ${money(val)} net · ${fh(mo.hrs)} · ${mo.shifts} shift${mo.shifts === 1 ? '' : 's'}${mo.gigs > 0 ? ` · +${money(mo.gigs)} gigs` : ''}`);
  $$('#ins-mbars .m-col').forEach((el, i) => el.classList.toggle('sel', i === ui.insMonth));
}
function renderInsights() {
  const D = computeYearData(ui.insYear); _insCache = D;
  const allMode = settings.incomeScope === 'all' && D.totGigs > 0;
  setText($('ins-year-lbl'), String(D.yr));
  const isb = $('ins-scope-btn'); if (isb) { isb.classList.toggle('hidden', !gigs.length); isb.classList.toggle('on', allMode); setText(isb, allMode ? 'Total' : 'Payroll'); }
  setText($('ins-net'), money(allMode ? r2(D.totNet + D.totGigs) : D.totNet));
  setText($('ins-net-sub'), `${D.cutoffCount} active cutoff${D.cutoffCount === 1 ? '' : 's'}${D.totGigs > 0 ? ` · +${money(D.totGigs)} gigs` : ''}`);
  const eff = D.totHrs > 0 ? r2(D.totGross / D.totHrs) : 0, boost = D.totHrs > 0 ? r2(eff - settings.hourlyRate) : 0;
  setText($('ins-eff'), D.totHrs > 0 ? `${peso(eff)}/hr` : '—');
  setText($('ins-eff-sub'), D.totHrs > 0 ? `${boost >= 0 ? '+' : ''}${peso(boost)}/hr vs base` : 'No hours yet');
  setText($('ins-hrs'), fh(D.totHrs)); setText($('ins-hrs-sub'), `${D.totShifts} shift${D.totShifts === 1 ? '' : 's'}`);
  setText($('ins-13th'), money(D.basicYr / 12));
  const vals = D.months.map(x => allMode ? r2(x.net + x.gigs) : x.net), max = Math.max(0, ...vals);
  setHTML($('ins-mbars'), D.months.map((x, i) => {
    const v = vals[i], sc = max > 0 ? Math.max(0.06, v / max) : 0.06;
    return `<button type="button" class="m-col press${v <= 0 ? ' zero' : ''}${i === ui.insMonth ? ' sel' : ''}" onclick="pickInsightMonth(${i})"><div class="m-track"><div class="m-bar" style="transform:scaleY(${sc.toFixed(3)})"></div></div><span class="m-lbl">${MON[i][0]}</span></button>`;
  }).join(''));
  drawInsightMonthDetail();
  if (!D.top.length) {
    setHTML($('ins-stations'), '<p class="note">Log shifts or side gigs in this year to see your top earners.</p>');
  } else {
    const topMax = D.top[0].v || 1;
    setHTML($('ins-stations'), D.top.map(r => `<div class="rank-row"><div class="row between"><span style="font-weight:600">${esc(r.n)} <span class="muted num" style="font-size:11.5px">(${r.c})</span></span><b class="num">${money(r.v)}</b></div><div class="env-bar" style="margin-top:2px"><i class="needs" style="transform:scaleX(${(r.v / topMax).toFixed(3)})"></i></div></div>`).join(''));
  }
  // Statutory Ledger
  setText($('st-sss'), money(D.st.sss)); setText($('st-ph'), money(D.st.ph)); setText($('st-pi'), money(D.st.pi)); setText($('st-tax'), money(D.st.tax));
  const rows = D.months.filter(x => (x.sss + x.ph + x.pi + x.tax) > 0 || x.gross > 0);
  if (!rows.length) {
    setHTML($('st-table'), '<tbody><tr><td colspan="5" style="text-align:center;color:var(--t3);padding:18px 0">No payroll records in ' + D.yr + ' yet.</td></tr></tbody>');
  } else {
    const grand = r2(D.st.sss + D.st.ph + D.st.pi + D.st.tax);
    const body = rows.map(x => `<tr><td>${MON[x.m]}</td><td>${peso(x.sss)}</td><td>${peso(x.ph)}</td><td>${peso(x.pi)}</td><td>${peso(x.tax)}</td></tr>`).join('') +
      `<tr><td>Total</td><td>${peso(D.st.sss)}</td><td>${peso(D.st.ph)}</td><td>${peso(D.st.pi)}</td><td>${peso(D.st.tax)}</td></tr>`;
    setHTML($('st-table'), `<thead><tr><th>Mo</th><th>SSS</th><th>PhilH</th><th>Pag-IBIG</th><th>Tax</th></tr></thead><tbody>${body}</tbody>`);
  }
}
async function copyStatutoryLedger() {
  const D = _insCache || computeYearData(ui.insYear);
  const lines = [`SweldoPulse Statutory Ledger (${D.yr})`, 'Month | SSS | PhilHealth | Pag-IBIG | Tax'];
  D.months.filter(x => (x.sss + x.ph + x.pi + x.tax + x.gross) > 0).forEach(x => lines.push(`${MON[x.m]} | ${peso(x.sss)} | ${peso(x.ph)} | ${peso(x.pi)} | ${peso(x.tax)}`));
  lines.push(`TOTAL | ${peso(D.st.sss)} | ${peso(D.st.ph)} | ${peso(D.st.pi)} | ${peso(D.st.tax)}`);
  toast((await copyText(lines.join('\n'))) ? 'Statutory ledger copied' : "Couldn't copy");
}
async function deleteShift(id) {
  const s = shifts.find(x => x.id === id); if (!s) return;
  const ok = await askConfirm({ title: 'Delete this shift?', body: `<b>${esc(shiftLabel(s))}</b><br>${fmtDay(s.date)}${s.startTime ? ` · ${t12(s.startTime)} – ${t12(s.endTime)}` : ''}<br>${peso(s.gross)} gross will be removed from this cutoff.`, ok: 'Delete' });
  if (!ok) return;
  shifts = shifts.filter(x => x.id !== id); recalcDay(s.date); unlockCutoffSnapshot(periodOf(s.date).key, true); persistSettings(); persistShifts(); render();
  toast('Shift deleted', { label: 'Undo', fn: () => { shifts.push(s); recalcDay(s.date); persistShifts(); render(); toast('Shift restored'); } });
}
function deleteFromSheet() { const id = editingId; closeShift(); setTimeout(() => deleteShift(id), 200); }
async function clearCutoff() {
  const P = periodFromKey(selKey), list = shiftsIn(selKey);
  if (!list.length) return toast('No shifts in this cutoff');
  const ok = await askConfirm({ title: 'Clear this cutoff?', body: `This removes all <b>${list.length}</b> shift${list.length > 1 ? 's' : ''} in <b>${P.label}</b>. Other cutoffs are not touched.`, ok: 'Delete all', typed: 'DELETE' });
  if (!ok) return;
  const ids = new Set(list.map(s => s.id)); shifts = shifts.filter(s => !ids.has(s.id)); persistShifts(); render();
  toast(`${list.length} shift${list.length > 1 ? 's' : ''} deleted`, { label: 'Undo', fn: () => { shifts.push(...list); persistShifts(); render(); toast('Shifts restored'); } });
}

/* ================= smart roster import / export (v2.3) ================= */
let _ioParsed = [], _ioPrevT = 0, _ioWeekOff = null;
const IO_TEMPLATE = () => {
  const d0 = addDays(new Date(), 1), d1 = addDays(new Date(), 2), d2 = addDays(new Date(), 3);
  return `${MON[d0.getMonth()]} ${d0.getDate()} | 4:00 PM - 10:00 PM | Lobby\n${MON[d1.getMonth()]} ${d1.getDate()} | 6:00 PM - 12:00 AM | Grill\n${MON[d2.getMonth()]} ${d2.getDate()} | OFF`;
};
function openIO() {
  const dow = new Date().getDay();
  _ioWeekOff = (dow === 0 || dow === 6) ? 1 : 0; // On Sat/Sun, default weekday-only schedules to Next week
  $$('#io-wk-seg button').forEach(b => b.classList.toggle('on', +b.dataset.wk === _ioWeekOff));
  openSheet('io-sheet'); updateIoPreview();
}
function setIoWeek(off) {
  _ioWeekOff = off ? 1 : 0;
  $$('#io-wk-seg button').forEach(b => b.classList.toggle('on', +b.dataset.wk === _ioWeekOff));
  updateIoPreview();
}
async function copyIoTemplate() {
  toast((await copyText(IO_TEMPLATE())) ? 'Standard template copied' : "Couldn't copy template");
}
async function pasteIntoIo() {
  try {
    const txt = await navigator.clipboard.readText();
    if (txt) { $('io-text').value = txt; updateIoPreview(); toast('Pasted from clipboard'); return; }
  } catch (e) {}
  $('io-text').focus(); toast('Long-press inside the box to paste');
}
function clearIoText() { $('io-text').value = ''; updateIoPreview(); }
function fillExample() {
  const d0 = addDays(new Date(), 1), d1 = addDays(new Date(), 2), d2 = addDays(new Date(), 3);
  $('io-text').value = `${MON[d0.getMonth()]}. ${d0.getDate()} - 6-12mn (${DOW[d0.getDay()]}.)\nLOBBY\n${MON[d1.getMonth()]} ${d1.getDate()} | 8-5 (1h break) | Prepping\n${MON[d2.getMonth()]} ${d2.getDate()} | OFF\nM/W/F 4-10pm Grill`;
  updateIoPreview();
}
async function copyText(text) {
  try { await navigator.clipboard.writeText(text); return true; } catch (e) {}
  try { const ta = document.createElement('textarea'); ta.value = text; ta.style.cssText = 'position:fixed;opacity:0'; document.body.appendChild(ta); ta.select(); const ok = document.execCommand('copy'); ta.remove(); return ok; } catch (e) { return false; }
}
async function exportText() {
  const list = shiftsIn(selKey).sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime));
  if (!list.length) return toast('No shifts in this cutoff to export');
  const lines = list.map(s => `${s.date} | ${t12(s.startTime || '16:00')} - ${t12(s.endTime || '22:00')} | ${s.note || 'Shift'}`).join('\n');
  $('io-text').value = lines; updateIoPreview();
  toast((await copyText(lines)) ? `Copied ${list.length} shift${list.length > 1 ? 's' : ''}` : 'Exported below');
}
function parseTimePart(raw) {
  if (!raw) return null;
  const c = raw.trim().toLowerCase().replace(/\./g, '').replace(/\s+/g, '');
  if (c === '12mn' || c === 'mn' || c === 'midnight' || c === '24:00') return { h: 0, m: 0, mer: 'mn' };
  if (c === '12nn' || c === 'nn' || c === 'noon') return { h: 12, m: 0, mer: 'nn' };
  const m = c.match(/^(\d{1,2})(?::(\d{2}))?(am|pm|a|p|mn|nn)?$/);
  if (!m) return null;
  const h = +m[1], mi = +(m[2] || 0);
  let mer = m[3] || '';
  if (mer === 'a') mer = 'am';
  if (mer === 'p') mer = 'pm';
  if (h > 23 || mi > 59) return null;
  return { h, m: mi, mer };
}
function resolveTimeRange(rawA, rawB) {
  const a = parseTimePart(rawA), b = parseTimePart(rawB);
  if (!a || !b) return null;
  const to24 = (t, mer) => {
    let h = t.h;
    if (mer === 'mn') h = h === 12 ? 0 : h;
    else if (mer === 'nn') h = 12;
    else if (mer === 'pm') { if (h < 12) h += 12; }
    else if (mer === 'am') { if (h === 12) h = 0; }
    return h;
  };
  let h1, h2;
  if (a.mer && b.mer) { h1 = to24(a, a.mer); h2 = to24(b, b.mer); }
  else if (!a.mer && b.mer) {
    h2 = to24(b, b.mer);
    if (b.mer === 'mn') h1 = (a.h < 12 && a.h >= 1) ? a.h + 12 : a.h;
    else if (b.mer === 'nn') h1 = a.h === 12 ? 0 : a.h;
    else if (b.mer === 'pm') h1 = (a.h <= b.h && a.h < 12) ? a.h + 12 : a.h;
    else h1 = (a.h > b.h && a.h < 12) ? a.h + 12 : a.h;
  } else if (a.mer && !b.mer) {
    h1 = to24(a, a.mer);
    if (b.h === 12) h2 = h1 >= 12 ? 0 : 12;
    else { h2 = b.h; if (h2 <= h1 && h2 + 12 <= 23 && (h2 + 12 - h1) <= 14) h2 += 12; }
  } else {
    if (a.h > 12 || b.h > 12) { h1 = a.h; h2 = b.h; }
    else if (a.h >= 7 && a.h <= 11 && b.h === 12) { h1 = a.h; h2 = 12; } // morning to noon (e.g. 8-12 -> 8am-12pm)
    else if (a.h >= 1 && a.h <= 6 && b.h > a.h) { h1 = a.h + 12; h2 = b.h === 12 ? 0 : b.h + 12; } // afternoon/closing (e.g. 3-9, 6-12)
    else if (a.h >= 7 && a.h <= 11 && b.h >= 1 && b.h <= 7) { h1 = a.h; h2 = b.h + 12; } // morning to afternoon (e.g. 10-4)
    else if (a.h === 12 && b.h >= 1 && b.h <= 10) { h1 = 12; h2 = b.h + 12; } // noon to evening (e.g. 12-6)
    else { h1 = a.h; h2 = b.h === 12 ? 0 : b.h; }
  }
  if (h1 > 23 || h2 > 23) return null;
  const s = `${p2(h1)}:${p2(a.m)}`, e = `${p2(h2)}:${p2(b.m)}`;
  return s === e ? null : { start: s, end: e };
}
const MM_MAP = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, sept: 9, oct: 10, nov: 11, dec: 12 };
const MON_RE_STR = '(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t|tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)';
function inferYearForMonth(mon1to12) {
  const now = new Date(), curY = now.getFullYear(), curM = now.getMonth() + 1;
  if (curM >= 11 && mon1to12 <= 2) return curY + 1;
  if (curM <= 2 && mon1to12 >= 11) return curY - 1;
  return curY;
}
function parseDateStrict(line) {
  let m = line.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (m && +m[2] >= 1 && +m[2] <= 12 && +m[3] >= 1 && +m[3] <= 31) return `${m[1]}-${p2(m[2])}-${p2(m[3])}`;
  // Check Day-Month first (e.g. "30-Nov 4-10pm", "30 Nov 4-10pm") so Month-Day never steals the shift start hour
  m = line.match(new RegExp(`\\b(\\d{1,2})(?:st|nd|rd|th)?(?:\\s+|-|\\/)(${MON_RE_STR})\\.?(?:,?\\s*(\\d{4}))?\\b`, 'i'));
  if (m && +m[1] >= 1 && +m[1] <= 31) {
    const mo = MM_MAP[m[2].toLowerCase().slice(0, 4) === 'sept' ? 'sept' : m[2].toLowerCase().slice(0, 3)];
    return `${m[3] || inferYearForMonth(mo)}-${p2(mo)}-${p2(m[1])}`;
  }
  m = line.match(new RegExp(`\\b(${MON_RE_STR})(?:\\.?\\s*|-|\\/)(\\d{1,2})(?:st|nd|rd|th)?(?!(?:\\s*(?:am|pm|mn|nn)|:|[-–—]\\s*\\d))(?:,?\\s*(\\d{4}))?\\b`, 'i'));
  if (m && +m[2] >= 1 && +m[2] <= 31) {
    const mo = MM_MAP[m[1].toLowerCase().slice(0, 4) === 'sept' ? 'sept' : m[1].toLowerCase().slice(0, 3)];
    return `${m[3] || inferYearForMonth(mo)}-${p2(mo)}-${p2(m[2])}`;
  }
  m = line.match(/(?:^|[\s(\[])(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?(?=[\s)\],|:;-]|$)/);
  if (m && +m[1] >= 1 && +m[1] <= 12 && +m[2] >= 1 && +m[2] <= 31) {
    let y = m[3] ? String(m[3]) : String(inferYearForMonth(+m[1])); if (y.length === 2) y = '20' + y;
    return `${y}-${p2(m[1])}-${p2(m[2])}`;
  }
  return null;
}
function stripDateFromLine(line) {
  return line
    .replace(/\d{4}-\d{1,2}-\d{1,2}/, ' ')
    .replace(new RegExp(`\\b\\d{1,2}(?:st|nd|rd|th)?(?:\\s+|-|\\/)${MON_RE_STR}\\.?(?:,?\\s*\\d{4})?\\b`, 'i'), ' ')
    .replace(new RegExp(`\\b${MON_RE_STR}(?:\\.?\\s*|-|\\/)\\d{1,2}(?:st|nd|rd|th)?(?!(?:\\s*(?:am|pm|mn|nn)|:|[-–—]\\s*\\d))(?:,?\\s*\\d{4})?\\b`, 'i'), ' ')
    .replace(/(?:^|[\s(\[])\d{1,2}\/\d{1,2}(?:\/\d{2,4})?(?=[\s)\],|:;-]|$)/, ' ');
}
function isOffLine(s) {
  return /^(?:day\s*off|rest\s*day|off|rd|vl|sl|leave|no\s*duty|no\s*shift|none|[-–—]+)$/i.test(s.trim());
}
function parseDowTokens(prefix, weekOff = 0) {
  const MAP = { mon: 0, monday: 0, m: 0, tue: 1, tues: 1, tuesday: 1, tu: 1, wed: 2, wednesday: 2, w: 2, thu: 3, thur: 3, thurs: 3, thursday: 3, th: 3, fri: 4, friday: 4, f: 4, sat: 5, saturday: 5, sa: 5, sun: 6, sunday: 6, su: 6 };
  const clean = prefix.replace(/[():]/g, ' ').trim();
  if (!clean) return [];
  const toks = clean.split(/[\s,/+&]+/).filter(Boolean);
  if (!toks.length || toks.length > 7) return [];
  const idxs = [];
  for (const t of toks) {
    const k = t.toLowerCase().replace(/\.$/, '');
    if (MAP[k] === undefined) return [];
    if (!idxs.includes(MAP[k])) idxs.push(MAP[k]);
  }
  const mon = addDays(mondayOf(new Date()), weekOff * 7);
  return idxs.map(i => dstr(addDays(mon, i)));
}
function cleanNoteText(s) {
  return (s || '')
    .replace(/^\(?\s*(?:mon|tue|tues|wed|thu|thur|thurs|fri|sat|sun)(?:day)?\.?\s*\)?\s*[-|:•]*\s*/i, '')
    .replace(/^[-|•:]+\s*/, '')
    .replace(/\s*[-|•:]+$/, '')
    .trim();
}
function extractBreakFromLine(line) {
  let brk = 0, text = line;
  const re60 = /\(?\s*(?:w\/?\s*|with\s+|less\s+)?(?:1\s*(?:hr|hrs|hour|hours|h)|60\s*(?:mins?|m))\s*(?:unpaid\s*)?(?:break|brk)\s*\)?|\(?\s*less\s+(?:1\s*(?:hr|h)|60\s*m)\s*\)?/i;
  const re30 = /\(?\s*(?:w\/?\s*|with\s+|less\s+)?(?:30\s*(?:mins?|m)|(?:0\.5|half)\s*(?:hr|hour|h))\s*(?:unpaid\s*)?(?:break|brk)\s*\)?|\(?\s*less\s+30\s*(?:mins?|m)\s*\)?/i;
  if (re60.test(text)) { brk = 60; text = text.replace(re60, ' '); }
  else if (re30.test(text)) { brk = 30; text = text.replace(re30, ' '); }
  return { brk, text: text.replace(/\s{2,}/g, ' ').trim() };
}
function parseScheduleText(raw) {
  const lines = raw.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const reRange = /\b(\d{1,2}(?::\d{2})?\s*(?:am|pm|mn|nn|a|p)\.?|\b12mn\b|\b12nn\b|\d{1,2}(?::\d{2})?)\s*(?:-|–|—|\bto\b)\s*(\d{1,2}(?::\d{2})?\s*(?:am|pm|mn|nn|a|p)\.?|\b12mn\b|\b12nn\b|\d{1,2}(?::\d{2})?)\b/i;
  const out = [];
  const seenKeys = new Set();
  let ctxDate = null, usedDow = false;
  lines.forEach(rawLine => {
    const { brk, text: line } = extractBreakFromLine(rawLine);
    const strictDate = parseDateStrict(line);
    const cleaned = strictDate ? stripDateFromLine(line) : line;
    const remClean = cleaned.replace(/[|:-]+/g, ' ').trim();
    if (isOffLine(remClean) || isOffLine(line)) { ctxDate = null; return; }
    const tm = cleaned.match(reRange);
    if (!tm) {
      if (strictDate) { ctxDate = strictDate; return; }
      const l = out[out.length - 1];
      if (l && brk > 0 && !l.brk) {
        l.brk = brk;
        const rr = calcPay({ start: l.start, end: l.end, mult: l.mult, rate: settings.hourlyRate, brk, prior: 0 });
        if (rr) l.gross = rr.gross;
      }
      const cn = cleanNoteText(line);
      if (l && !l.labeled && cn && !isOffLine(cn) && !parseDowTokens(cn, 0).length) { l.note = cn; l.labeled = true; }
      return;
    }
    const tr = resolveTimeRange(tm[1], tm[2]);
    if (!tr) return;
    let dates = [], dateGuessed = false;
    if (strictDate) { dates = [strictDate]; ctxDate = strictDate; }
    else {
      const pre = cleaned.slice(0, tm.index).replace(/[-|:•]+$/, '').trim();
      const dows = parseDowTokens(pre, _ioWeekOff || 0);
      if (dows.length) { dates = dows; usedDow = true; }
      else if (ctxDate) dates = [ctxDate];
      else { dates = [dstr(addDays(new Date(), out.length))]; dateGuessed = true; }
    }
    let note = '', labeled = false;
    const parts = line.split('|').map(x => x.trim());
    if (parts.length >= 3 && parts[2] && !isOffLine(parts[2])) { note = cleanNoteText(parts[2]); labeled = !!note; }
    else {
      const after = cleanNoteText(cleaned.slice(tm.index + tm[0].length));
      if (after && !isOffLine(after)) { note = after; labeled = true; }
    }
    dates.forEach(date => {
      const sig = `${date}|${tr.start}|${tr.end}`;
      if (seenKeys.has(sig)) return;
      seenKeys.add(sig);
      const hol = holidayFor(date), mult = hol ? hol.mult : 1;
      const nm = settings.midnightHolidaySplit !== false ? nextDayMultFor(date) : null;
      const r = calcPay({ start: tr.start, end: tr.end, mult, rate: settings.hourlyRate, brk, prior: 0, nextMult: nm });
      const iv = intervalOf(date, tr.start, tr.end);
      const ovExisting = findOverlappingShifts(date, tr.start, tr.end, null).length > 0 || findOverlappingGigs(date, tr.start, tr.end, null).length > 0;
      const ovBatch = out.some(x => intervalsOverlap(iv, intervalOf(x.date, x.start, x.end)));
      const dup = ovExisting || ovBatch;
      out.push({ date, start: tr.start, end: tr.end, note, labeled, mult, brk, dateGuessed, hol: hol ? hol.name : '', holKind: hol ? hol.kind : '', gross: r ? r.gross : 0, dup, ovExisting, ovBatch, checked: !dup });
    });
  });
  if ($('io-wk-row')) $('io-wk-row').classList.toggle('hidden', !usedDow);
  return out;
}
let _ioLastRaw = '';
function queueIoPreview() { clearTimeout(_ioPrevT); _ioPrevT = setTimeout(updateIoPreview, 110); }
function toggleIoRow(i, on) { if (_ioParsed[i]) { _ioParsed[i].checked = !!on; syncIoSummary(); } }
function editIoNote(i, val) { if (_ioParsed[i]) { _ioParsed[i].note = val.trim(); } }
function cycleIoBreak(i) {
  const o = _ioParsed[i]; if (!o) return;
  o.brk = o.brk === 0 ? 30 : (o.brk === 30 ? 60 : 0);
  const r = calcPay({ start: o.start, end: o.end, mult: o.mult, rate: settings.hourlyRate, brk: o.brk, prior: 0 });
  o.gross = r ? r.gross : 0;
  renderIoList();
  syncIoSummary();
}
function syncIoSummary() {
  const sel = _ioParsed.filter(x => x.checked);
  const tot = r2(sel.reduce((a, x) => a + x.gross, 0));
  setText($('io-prev-count'), `${sel.length} of ${_ioParsed.length} shift${_ioParsed.length === 1 ? '' : 's'} selected`);
  setText($('io-prev-gross'), peso(tot));
  setText($('io-imp-btn'), sel.length ? `Import ${sel.length} shift${sel.length > 1 ? 's' : ''}` : 'Import shifts');
  $('io-imp-btn').disabled = _ioParsed.length > 0 && sel.length === 0;
}
function renderIoList() {
  if ($('io-guess-warn')) $('io-guess-warn').classList.toggle('hidden', !_ioParsed.some(x => x.dateGuessed));
  setHTML($('io-prev-list'), _ioParsed.map((o, i) => {
    const brkLbl = o.brk === 60 ? '1h brk' : (o.brk === 30 ? '30m brk' : '0m brk');
    const holChip = o.hol ? `<span class="dot-b hl">${o.mult}× ${esc(o.hol)}</span>` : 'Regular';
    const dupChip = o.ovExisting ? '<span class="dot-b cx">Overlaps saved shift</span>' : (o.ovBatch ? '<span class="dot-b cx">Overlaps row above</span>' : '');
    return `<div class="io-row${o.dup ? ' dup' : ''}">` +
      `<input type="checkbox"${o.checked ? ' checked' : ''} onchange="toggleIoRow(${i},this.checked)" aria-label="Select shift">` +
      `<div class="grow" style="min-width:0"><p style="font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${fmtDay(o.date)} · ${t12(o.start)}–${t12(o.end)}</p>` +
      `<p class="card-s" style="display:flex;align-items:center;gap:5px;flex-wrap:wrap">${holChip}${dupChip}${o.dateGuessed ? '<span class="dot-b ot">⚠ Date guessed</span>' : ''}</p>` +
      `<div class="row" style="gap:6px;margin-top:4px"><input class="io-note-in grow" style="margin-top:0" value="${esc(o.note)}" placeholder="Station / note (optional)" oninput="editIoNote(${i},this.value)"><button type="button" class="io-brk-btn press${o.brk ? ' on' : ''}" onclick="cycleIoBreak(${i})" title="Tap to change unpaid break">${brkLbl}</button></div></div>` +
      `<b class="num">${peso(o.gross)}</b></div>`;
  }).join(''));
}
function updateIoPreview() {
  clearTimeout(_ioPrevT);
  const raw = ($('io-text').value || '').trim();
  _ioLastRaw = raw;
  const wrap = $('io-prev-wrap');
  if (!raw) { _ioParsed = []; wrap.classList.add('hidden'); if ($('io-wk-row')) $('io-wk-row').classList.add('hidden'); $('io-imp-btn').disabled = false; setText($('io-imp-btn'), 'Import shifts'); return; }
  _ioParsed = parseScheduleText(raw);
  wrap.classList.toggle('hidden', !_ioParsed.length);
  if (!_ioParsed.length) { $('io-imp-btn').disabled = false; setText($('io-imp-btn'), 'Import shifts'); return; }
  renderIoList();
  syncIoSummary();
}
function commitImportPicked(picked) {
  const td = today(), days = new Set();
  picked.forEach(o => {
    const hol = holidayFor(o.date);
    const mult = hol ? hol.mult : (o.mult || 1);
    shifts.push({ id: nextId(), date: o.date, startTime: o.start, endTime: o.end, note: o.note, hourlyRate: settings.hourlyRate, reg: 0, nd: 0, ot: 0, multiplier: mult, gross: 0, breakMin: o.brk || 0, status: o.date > td ? 'scheduled' : 'worked' });
    days.add(o.date);
  });
  days.forEach(ds => { recalcDay(ds); unlockCutoffSnapshot(periodOf(ds).key, true); });
  selKey = periodOf([...days].sort().pop()).key;
  $('io-text').value = ''; _ioParsed = []; _ioLastRaw = ''; $('io-prev-wrap').classList.add('hidden'); if ($('io-wk-row')) $('io-wk-row').classList.add('hidden');
  persistSettings(); persistShifts(); render(); closeSheet('io-sheet');
  toast(`Imported ${picked.length} shift${picked.length > 1 ? 's' : ''}`);
}
function importText() {
  clearTimeout(_ioPrevT);
  const raw = $('io-text').value.trim(); if (!raw) return toast('Paste your schedule first');
  if (!_ioParsed.length || _ioLastRaw !== raw) { _ioParsed = parseScheduleText(raw); _ioLastRaw = raw; }
  const picked = _ioParsed.filter(x => x.checked);
  if (!picked.length) return toast(_ioParsed.length ? 'Select at least one shift to import' : 'No valid shifts found — try the standard template');
  // Block intra-batch overlaps among selected rows
  for (let i = 0; i < picked.length; i++) {
    const a = intervalOf(picked[i].date, picked[i].start, picked[i].end);
    for (let j = i + 1; j < picked.length; j++) {
      if (intervalsOverlap(a, intervalOf(picked[j].date, picked[j].start, picked[j].end))) {
        return toast(`Selected shifts overlap on ${fmtDay(picked[j].date)} — uncheck one first`);
      }
    }
  }
  // Check against existing saved shifts & timed gigs
  const existingConflicts = [], seenC = new Set();
  picked.forEach(o => {
    findOverlappingShifts(o.date, o.start, o.end, null).forEach(s => { if (!seenC.has('s' + s.id)) { seenC.add('s' + s.id); existingConflicts.push({ type: 'shift', o: s }); } });
    findOverlappingGigs(o.date, o.start, o.end, null).forEach(g => { if (!seenC.has('g' + g.id)) { seenC.add('g' + g.id); existingConflicts.push({ type: 'gig', o: g }); } });
  });
  if (existingConflicts.length) {
    openConflictSheet({
      title: 'Imported shifts overlap existing entries',
      body: 'Overlapping duty hours are not allowed. Delete the conflicting shift(s) to import these, or cancel and edit.',
      items: existingConflicts,
      canKeepBoth: false,
      onReplace: () => { deleteConflictItems(existingConflicts); commitImportPicked(picked); }
    });
    return;
  }
  commitImportPicked(picked);
}

/* ================= settings screen ================= */
function updateDailyHint() {
  if ($('set-daily-hint')) setText($('set-daily-hint'), `Daily (8h): ${peso(r2((+settings.hourlyRate || 0) * 8))}`);
  const p = PH_WAGE_PRESETS[settings.calabarzonArea];
  if ($('set-region-chip')) setText($('set-region-chip'), p ? p.chip : 'Custom');
}
function syncSettingsUI() {
  $('set-rate').value = settings.hourlyRate;
  const areaEl = $('set-area');
  if (areaEl) areaEl.value = PH_WAGE_PRESETS[settings.calabarzonArea] ? settings.calabarzonArea : 'custom';
  $('set-sched').value = settings.schedule;
  if ($('set-profile')) $('set-profile').value = settings.workProfile || 'custom';
  if ($('set-prehol')) $('set-prehol').checked = settings.preHolidayRule !== false;
  if ($('set-midsplit')) $('set-midsplit').checked = settings.midnightHolidaySplit !== false;
  syncJobUI();
  if ($('set-nd-rate')) $('set-nd-rate').value = String(+(settings.ndRate ?? 0.10));
  if ($('set-ot-hrs')) $('set-ot-hrs').value = String(+(settings.otThreshold ?? 8));
  updateDailyHint();
  $('set-goal').value = settings.goal || ''; $('set-lag').value = settings.payLag || ''; $('upd-repo').value = repoName(); $('upd-rel').href = `https://github.com/${repoName()}/releases`; $('notif-on').checked = !!settings.notifEnabled; $('notif-time').value = settings.notifTime || '22:00';
  $('bi-n').value = settings.budgetNeeds; $('bi-w').value = settings.budgetWants; $('bi-s').value = settings.budgetSavings; budgetInput();
  $('ver-label').textContent = `Version ${APP_VERSION}`;
  if ($('sb-ver')) setText($('sb-ver'), `v${APP_VERSION}`);
  if ($('upd-auto-dl')) $('upd-auto-dl').checked = settings.autoDownloadUpd !== false;
  if ($('upd-wifi-only')) $('upd-wifi-only').checked = settings.updWifiOnly !== false;
  if ($('upd-wifi-row')) $('upd-wifi-row').classList.toggle('hidden', settings.autoDownloadUpd === false);
  if ($('due-notif-on')) $('due-notif-on').checked = settings.dueNotifEnabled !== false;
  if ($('due-notif-time')) $('due-notif-time').value = settings.dueNotifTime || '09:00';
  if ($('plan-nudge-on')) $('plan-nudge-on').checked = settings.planNudgeEnabled !== false;
  notifSub(); syncDedUI(); applyTheme(); renderSecurity(); syncUpdateUI();
}
function applyWorkProfile(key) {
  settings.workProfile = key || 'custom';
  const prof = WORK_PROFILES[key];
  if (prof) {
    Object.assign(settings, {
      schedule: prof.schedule, preHolidayRule: prof.preHolidayRule, ndRate: prof.ndRate,
      otThreshold: prof.otThreshold, autoDeduct: prof.autoDeduct, deductMode: prof.deductMode,
      statMinGross: prof.statMinGross, mwe: prof.mwe
    });
    _pm.clear(); selKey = curPeriod().key;
    toast(`Profile applied: ${prof.label}`);
  }
  persistSettings(); syncSettingsUI(); render();
}
function recalcCurrentCutoff() {
  const k = selKey || curPeriod().key;
  if (getCutoffSnapshot(k)) return toast('This cutoff is locked — unlock it on Payslip first');
  const list = shiftsIn(k);
  if (!list.length) return toast('No shifts in this cutoff to recalculate');
  const days = new Set(list.map(s => s.date));
  days.forEach(recalcDay);
  persistShifts(); render();
  toast(`Recalculated ${list.length} shift${list.length === 1 ? '' : 's'} with updated rules ✓`);
}
function onWorkRulesChange() {
  settings.workProfile = 'custom';
  if ($('set-profile')) $('set-profile').value = 'custom';
  if ($('set-prehol')) settings.preHolidayRule = $('set-prehol').checked;
  if ($('set-midsplit')) settings.midnightHolidaySplit = $('set-midsplit').checked;
  if ($('set-nd-rate')) settings.ndRate = Math.max(0, parseFloat($('set-nd-rate').value) || 0);
  if ($('set-ot-hrs')) settings.otThreshold = Math.max(0, parseInt($('set-ot-hrs').value, 10) || 0);
  persistSettings(); render();
  const hasUnlocked = shiftsIn(selKey || curPeriod().key).length > 0 && !getCutoffSnapshot(selKey || curPeriod().key);
  toast('Work rules updated', hasUnlocked ? { label: 'Recalc cutoff', fn: recalcCurrentCutoff } : undefined);
}
function applyArea() {
  const v = $('set-area').value; settings.calabarzonArea = v;
  const preset = PH_WAGE_PRESETS[v];
  if (preset) { $('set-rate').value = preset.rate; settings.hourlyRate = preset.rate; }
  updateDailyHint(); persistSettings(); render();
  toast(`Rate set to ${peso(settings.hourlyRate)}/hr · applies to new shifts`);
}
function onRateInput() {
  const v = Math.max(0, parseFloat($('set-rate').value) || 0); settings.hourlyRate = v;
  const match = Object.keys(PH_WAGE_PRESETS).find(k => Math.abs(PH_WAGE_PRESETS[k].rate - v) < 0.005);
  settings.calabarzonArea = match || 'custom';
  if ($('set-area')) $('set-area').value = settings.calabarzonArea;
  updateDailyHint(); persistSettingsDebounced(); render();
}
function onSchedule() {
  settings.schedule = $('set-sched').value; settings.workProfile = 'custom';
  if ($('set-profile')) $('set-profile').value = 'custom';
  _pm.clear(); selKey = curPeriod().key; persistSettings(); render(); toast('Cutoff cycle updated');
}
function saveLag(v) { settings.payLag = Math.max(0, Math.min(31, parseInt(v, 10) || 0)); persistSettings(); render(); toast(settings.payLag ? `Payday: ${settings.payLag} days after cutoff` : 'Payday hidden'); }
function saveGoal(v) { settings.goal = Math.max(0, parseFloat(v) || 0); persistSettings(); render(); toast(settings.goal ? 'Pay goal saved' : 'Pay goal removed'); }

/* ---- reminders ---- */
const hasNativeAlarm = () => !!(window.AndroidBridge && typeof AndroidBridge.scheduleReminder === 'function');
function syncNativeReminder() {
  if (!hasNativeAlarm()) return;
  try {
    const [h, m] = (settings.notifTime || '22:00').split(':').map(Number);
    AndroidBridge.scheduleReminder(!!settings.notifEnabled, isFinite(h) ? h : 22, isFinite(m) ? m : 0);
  } catch (e) {}
  syncDueAndPlanAlarms();
}
function syncDueAndPlanAlarms() {
  if (!window.AndroidBridge) return;
  try {
    const dueOn = settings.dueNotifEnabled !== false;
    const [dh, dm] = (settings.dueNotifTime || '09:00').split(':').map(Number);
    const activeDues = debts
      .filter(d => !d.settled && d.kind !== 'owed' && d.dueDate)
      .map(d => ({ name: d.name, amount: d.kind === 'paylater' ? d.amount : debtRemaining(d), dueDate: d.dueDate }));
    if (typeof AndroidBridge.scheduleDueItems === 'function') {
      AndroidBridge.scheduleDueItems(dueOn, isFinite(dh) ? dh : 9, isFinite(dm) ? dm : 0, JSON.stringify(activeDues));
    } else if (typeof AndroidBridge.scheduleDueAlerts === 'function') {
      const urgent = activeDues.map(d => ({ ...d, m: dueMeta(d.dueDate) })).filter(d => d.m.diff <= 3).sort((a, b) => a.m.diff - b.m.diff);
      if (dueOn && urgent.length) {
        const first = urgent[0];
        const title = urgent.length === 1 ? `${first.name} — ${first.m.label}` : `${urgent.length} dues need attention`;
        const body = urgent.slice(0, 3).map(x => `${x.name} (${peso(x.amount)} · ${x.m.label})`).join(' | ');
        AndroidBridge.scheduleDueAlerts(true, isFinite(dh) ? dh : 9, isFinite(dm) ? dm : 0, title, body);
      } else {
        AndroidBridge.scheduleDueAlerts(false, isFinite(dh) ? dh : 9, isFinite(dm) ? dm : 0, '', '');
      }
    }

    const planOn = settings.planNudgeEnabled !== false;
    const nowMs = Date.now();
    const upcomingPlans = [];
    shifts.forEach(s => {
      if (shiftStatusOf(s) !== 'scheduled' || !s.startTime) return;
      const [y, mo, da] = s.date.split('-').map(Number);
      const [hh, mm] = s.startTime.split(':').map(Number);
      const startMs = new Date(y, mo - 1, da, hh, mm, 0).getTime();
      const trig = startMs - 3600000; // 1 hour before
      if (trig > nowMs + 60000) {
        upcomingPlans.push({
          triggerAtMs: trig,
          title: `Shift in 1 hour: ${shiftLabel(s)}`,
          body: `${t12(s.startTime)}–${t12(s.endTime)} · Est. ${peso(s.gross)}`
        });
      }
    });
    upcomingPlans.sort((a, b) => a.triggerAtMs - b.triggerAtMs);
    if (typeof AndroidBridge.schedulePlannedList === 'function') {
      AndroidBridge.schedulePlannedList(planOn, JSON.stringify(upcomingPlans.slice(0, 25)));
    } else if (typeof AndroidBridge.schedulePlannedShift === 'function') {
      if (planOn && upcomingPlans.length) {
        AndroidBridge.schedulePlannedShift(upcomingPlans[0].triggerAtMs, upcomingPlans[0].title, upcomingPlans[0].body);
      } else {
        AndroidBridge.schedulePlannedShift(0, '', '');
      }
    }
  } catch (e) {}
}
async function toggleDueNotif() {
  const cb = $('due-notif-on');
  if (cb.checked && 'Notification' in window && Notification.permission !== 'granted') {
    const p = await Notification.requestPermission();
    if (p !== 'granted') { cb.checked = false; return toast('Allow notifications in Android settings'); }
  }
  settings.dueNotifEnabled = cb.checked; persistSettings(); syncDueAndPlanAlarms();
  toast(cb.checked ? `Due alerts on (${t12(settings.dueNotifTime || '09:00')})` : 'Due alerts off');
}
function saveDueNotifTime() {
  settings.dueNotifTime = $('due-notif-time').value; persistSettings(); syncDueAndPlanAlarms();
  toast(`Due alert time: ${t12(settings.dueNotifTime)}`);
}
async function togglePlanNudge() {
  const cb = $('plan-nudge-on');
  if (cb.checked && 'Notification' in window && Notification.permission !== 'granted') {
    const p = await Notification.requestPermission();
    if (p !== 'granted') { cb.checked = false; return toast('Allow notifications in Android settings'); }
  }
  settings.planNudgeEnabled = cb.checked; persistSettings(); syncDueAndPlanAlarms();
  toast(cb.checked ? '1-hour pre-shift nudge on' : 'Pre-shift nudge off');
}
async function sendTestNotif() {
  if ('Notification' in window && Notification.permission !== 'granted') {
    const p = await Notification.requestPermission();
    if (p !== 'granted') return toast('Allow notifications in Android settings');
  }
  if (window.AndroidBridge && typeof AndroidBridge.sendTestNotification === 'function') {
    AndroidBridge.sendTestNotification();
    toast('Test notification sent');
  } else {
    await showSystemNotification('SweldoPulse notifications active', { body: 'Shift reminders, PayLater due alerts, and planned-shift nudges are ready.' });
    toast('Test notification sent');
  }
}
window.onNotifPermission = function (granted) {
  const r = window.__notifPermRes; window.__notifPermRes = null;
  if (r) r(granted ? 'granted' : 'denied');
  notifSub();
};
window.onReminderTap = function () { runOrQueueUnlocked(() => openShift()); };
function notifSub() {
  const el = $('notif-sub'); if (!('Notification' in window)) { el.textContent = 'Not supported here'; return; }
  const nativeDenied = window.AndroidBridge && typeof AndroidBridge.hasNotifPermission === 'function' && settings.notifEnabled && !AndroidBridge.hasNotifPermission();
  el.textContent = (Notification.permission === 'denied' || nativeDenied) ? 'Allow notifications in Android settings' : (settings.notifEnabled ? `Daily at ${t12(settings.notifTime || '22:00')}${hasNativeAlarm() ? ' · works in background' : ''}` : 'Daily alert to log your shift');
}
async function toggleNotif() {
  const cb = $('notif-on');
  if (cb.checked) {
    if (!('Notification' in window)) { cb.checked = false; return toast('Notifications not supported here'); }
    const perm = await Notification.requestPermission();
    if (perm !== 'granted') { cb.checked = false; settings.notifEnabled = false; persistSettings(); syncNativeReminder(); notifSub(); return toast('Allow notifications in Android settings'); }
    settings.notifEnabled = true; toast(`Reminder set for ${t12(settings.notifTime)}`);
  } else { settings.notifEnabled = false; toast('Reminders off'); }
  persistSettings(); syncNativeReminder(); notifSub();
}
function saveNotifTime() { settings.notifTime = $('notif-time').value; persistSettings(); syncNativeReminder(); notifSub(); toast(`Reminder time: ${t12(settings.notifTime)}`); }
async function showSystemNotification(title, options) {
  if (window.AndroidBridge) { AndroidBridge.notify(title, (options && options.body) || ''); return true; }
  try { const reg = await navigator.serviceWorker.ready; if (reg && reg.showNotification) { await reg.showNotification(title, options); return true; } } catch (e) {}
  try { new Notification(title, options); return true; } catch (e) { return false; }
}
async function triggerReminder() {
  if (!('Notification' in window)) return;
  if (Notification.permission === 'default') await Notification.requestPermission();
  if (Notification.permission === 'granted') await showSystemNotification('SweldoPulse — log your shift', { body: 'Finished your shift? Tap to record your hours.', icon: './icon-192.png', tag: 'sweldo-shift-reminder' });
}
function checkReminder() {
  if (!settings.notifEnabled || hasNativeAlarm()) return; const now = new Date(), k = today(); if (settings.lastNotifDate === k) return;
  const [h, m] = (settings.notifTime || '22:00').split(':').map(Number), n = now.getHours() * 60 + now.getMinutes(), r = h * 60 + m;
  if (n >= r && n <= r + 90) { settings.lastNotifDate = k; persistSettings(); triggerReminder(); }
}

/* ---- updates (in-app auto-downloader + 4-layer verification) ---- */
const semver = (a, b) => { const x = String(a).replace(/^v/i, '').split('.').map(n => +n || 0), y = String(b).replace(/^v/i, '').split('.').map(n => +n || 0); for (let i = 0; i < 3; i++) { const d = (x[i] || 0) - (y[i] || 0); if (d) return d > 0 ? 1 : -1; } return 0; };
const repoName = () => (settings.repo || DEFAULT_REPO).trim().replace(/^https?:\/\/github\.com\//i, '').replace(/\.git$/i, '').replace(/^\/+|\/+$/g, '');
const hasNativeUpdater = () => !!(window.AndroidBridge && typeof AndroidBridge.downloadUpdate === 'function');
const fmtBytes = b => b >= 1048576 ? (b / 1048576).toFixed(2) + ' MB' : (b >= 1024 ? Math.round(b / 1024) + ' KB' : (b || 0) + ' B');
let latestRel = null, updState = { state: 'idle', version: '', progress: 0, downloaded: 0, total: 0, error: '', canInstall: true };
function saveRepo(v) { v = String(v).trim(); settings.repo = (v && v !== DEFAULT_REPO) ? v : ''; settings.updEtag = ''; settings.updCachedRel = null; persistSettings(); $('upd-repo').value = repoName(); $('upd-rel').href = `https://github.com/${repoName()}/releases`; syncBgUpdateAlarm(); toast('Update source saved'); }
function saveUpdOpts() {
  settings.autoDownloadUpd = $('upd-auto-dl') ? $('upd-auto-dl').checked : true;
  settings.updWifiOnly = $('upd-wifi-only') ? $('upd-wifi-only').checked : true;
  if ($('upd-wifi-row')) $('upd-wifi-row').classList.toggle('hidden', !settings.autoDownloadUpd);
  persistSettings();
  if (settings.autoDownloadUpd && window.AndroidBridge && typeof AndroidBridge.hasNotifPermission === 'function' && !AndroidBridge.hasNotifPermission()) {
    Notification.requestPermission();
  }
  toast(settings.autoDownloadUpd ? (settings.updWifiOnly ? 'Auto-download on (Wi-Fi only)' : 'Auto-download on') : 'Auto-download off');
}
let _updChecking = false;
function syncBgUpdateAlarm() {
  if (window.AndroidBridge && typeof AndroidBridge.configureUpdateCheck === 'function') {
    try { AndroidBridge.configureUpdateCheck(repoName(), APP_VERSION, true); } catch (e) {}
  }
}
async function ghGet(url, ms = 9000, extraHeaders = null) {
  const c = new AbortController(), t = setTimeout(() => c.abort(), ms);
  try {
    const opts = { cache: 'no-store', signal: c.signal };
    if (extraHeaders) opts.headers = extraHeaders;
    const r = await fetch(url, opts);
    return { ok: r.ok, status: r.status, r };
  }
  catch (e) { return { ok: false, status: 0, why: e.name === 'AbortError' ? 'timed out' : 'blocked / no connection' }; }
  finally { clearTimeout(t); }
}
const parseRelease = j => {
  const apk = (j.assets || []).find(a => /\.apk$/i.test(a.name || '') && a.browser_download_url);
  return {
    v: j.tag_name || j.name || '',
    notes: j.body || '',
    apkUrl: apk ? apk.browser_download_url : '',
    apkBytes: apk ? (+apk.size || 0) : 0,
    releaseUrl: j.html_url || `https://github.com/${repoName()}/releases/latest`,
    size: apk ? (apk.size / 1048576).toFixed(2) + ' MB' : '',
    pre: !!j.prerelease
  };
};
async function findLatestRelease(forceFresh = false) {
  const repo = repoName(), log = []; let rel = null;
  // 1. ETag-cached GitHub Releases API (304 Not Modified never counts against 60/hr rate limit!)
  const hdrs = (!forceFresh && settings.updEtag && settings.updCachedRel) ? { 'If-None-Match': settings.updEtag } : null;
  let r = await ghGet(`https://api.github.com/repos/${repo}/releases/latest`, 9000, hdrs);
  log.push(`latest ${r.status || r.why}`);
  if (r.status === 304 && settings.updCachedRel) {
    rel = settings.updCachedRel;
  } else if (r.ok) {
    try {
      const etag = r.r.headers ? r.r.headers.get('ETag') : '';
      rel = parseRelease(await r.r.json());
      if (etag) settings.updEtag = etag;
      if (rel) settings.updCachedRel = rel;
    } catch (e) {}
  }
  // 2. Fallback to releases list if latest endpoint didn't resolve
  if (!rel) {
    r = await ghGet(`https://api.github.com/repos/${repo}/releases?per_page=6`);
    log.push(`list ${r.status || r.why}`);
    if (r.ok) {
      try {
        const a = (await r.r.json()).filter(x => !x.draft);
        if (a.length) { rel = parseRelease(a.sort((p, q) => semver(q.tag_name, p.tag_name))[0]); settings.updCachedRel = rel; }
      } catch (e) {}
    }
  }
  // 3. Fast zero-rate-limit raw version.json check (catches brand-new releases even if API is rate-limited)
  if (!rel) {
    r = await ghGet(`https://raw.githubusercontent.com/${repo}/HEAD/version.json?t=${Date.now()}`, 8000);
    log.push(`file ${r.status || r.why}`);
    if (r.ok) {
      try {
        const j = await r.r.json();
        if (j.version) rel = { v: j.version, notes: j.notes || '', apkUrl: '', apkBytes: 0, releaseUrl: `https://github.com/${repo}/releases/latest`, size: '', fromFile: true };
      } catch (e) {}
    }
  }
  return { rel, log };
}
function updFailText(log) {
  const st = log.map(l => l.split(' ')[1]);
  if (st.every(s => s === 'blocked' || s === 'timed')) return "Can't reach GitHub — check your connection (mobile data / Wi-Fi, VPN or private DNS can block it).";
  if (st.some(s => s === '403')) return 'GitHub is rate-limiting this network. Try again in a few minutes, or use the Releases page.';
  return `GitHub answered, but found no release for “${repoName()}”. Make sure the repo name is right and public, and that a release (not just a tag) is published. Edit it under “Update source”.`;
}
function syncNativeUpdateStatus() {
  if (!hasNativeUpdater()) return;
  try {
    const j = JSON.parse(AndroidBridge.getUpdateStatus() || '{}');
    if (j && j.state) updState = { ...updState, ...j };
  } catch (e) {}
  syncUpdateUI();
}
function syncUpdateUI() {
  const rel = latestRel, newer = !!(rel && semver(rel.v, APP_VERSION) > 0);
  const ready = updState.state === 'ready' && (!updState.version || semver(updState.version, APP_VERSION) > 0);
  const dl = updState.state === 'downloading';
  const err = updState.state === 'error' && updState.error;
  const ver = (ready && updState.version) || (rel && rel.v) || updState.version || '';
  // Home banner: show when verified update is ready to install or actively downloading
  const hb = $('upd-home-banner');
  if (hb) {
    if (ready) {
      hb.classList.remove('hidden');
      setText($('uhb-title'), `SweldoPulse ${ver} is ready`);
      setText($('uhb-sub'), 'Verified in app · closes briefly to install');
      setText($('uhb-btn'), 'Install'); $('uhb-btn').disabled = false;
    } else if (dl) {
      hb.classList.remove('hidden');
      setText($('uhb-title'), `Downloading ${ver || 'update'}…`);
      setText($('uhb-sub'), updState.total ? `${fmtBytes(updState.downloaded)} / ${fmtBytes(updState.total)}` : 'Downloading in background');
      setText($('uhb-btn'), `${updState.progress}%`); $('uhb-btn').disabled = true;
    } else if (newer && rel && rel.apkUrl) {
      hb.classList.remove('hidden');
      setText($('uhb-title'), `Update ${rel.v} available`);
      setText($('uhb-sub'), rel.size ? `${rel.size} · tap to download in app` : 'Tap to download in app');
      setText($('uhb-btn'), 'Download'); $('uhb-btn').disabled = false;
    } else {
      hb.classList.add('hidden');
    }
  }
  // Settings update card
  const box = $('upd-box'), badge = $('upd-badge'), diag = $('upd-diag'), pw = $('upd-prog-wrap'), act = $('upd-act-btn'), can = $('upd-cancel-btn');
  if (!box || !act) return;
  const showBox = !!(ready || dl || rel || err);
  box.classList.toggle('hidden', !showBox);
  if (!showBox) return;
  setText($('upd-title'), ready ? `Ready to install · ${ver}` : dl ? `Downloading · ${ver}` : (newer ? `Update available · ${ver}` : `You're up to date · ${ver || APP_VERSION}`));
  setText($('upd-size'), ready && updState.total ? fmtBytes(updState.total) : (rel && rel.size ? rel.size : ''));
  setText($('upd-notes'), rel && rel.notes ? String(rel.notes).replace(/[#*`>]/g, '').slice(0, 160) : (ready ? 'APK verified (size, header & package check passed). Tap below to install and restart.' : ''));
  pw.classList.toggle('hidden', !dl);
  if (dl) {
    $('upd-prog-fill').style.transform = `scaleX(${Math.max(0.03, (updState.progress || 0) / 100)})`;
    setText($('upd-prog-txt'), updState.total ? `${fmtBytes(updState.downloaded)} / ${fmtBytes(updState.total)}` : 'Downloading APK…');
    setText($('upd-prog-pct'), `${updState.progress || 0}%`);
  }
  can.classList.toggle('hidden', !dl);
  if (ready) {
    setText(badge, 'Ready to install'); badge.className = 'chip ok';
    setText(act, `Install ${ver} & restart`); act.className = 'btn primary grow sm press'; act.disabled = false;
    diag.classList.add('hidden');
  } else if (dl) {
    setText(badge, `Downloading ${updState.progress || 0}%`); badge.className = 'chip';
    setText(act, 'Downloading…'); act.className = 'btn soft grow sm press'; act.disabled = true;
    diag.classList.add('hidden');
  } else if (err) {
    setText(badge, 'Retry needed'); badge.className = 'chip bad';
    setText(act, 'Retry download'); act.className = 'btn primary grow sm press'; act.disabled = false;
    diag.textContent = updState.error; diag.classList.remove('hidden');
  } else if (newer) {
    setText(badge, 'Update ready'); badge.className = 'chip warn';
    if (rel && rel.apkUrl) {
      setText(act, rel.size ? `Download update (${rel.size})` : 'Download update');
      act.className = 'btn primary grow sm press'; act.disabled = false;
      diag.classList.add('hidden');
    } else {
      setText(act, 'Open release page'); act.className = 'btn ghost grow sm press'; act.disabled = false;
      diag.textContent = `Release ${rel.v} was found, but no .apk file is attached yet (GitHub Actions may still be building it).`;
      diag.classList.remove('hidden');
    }
  } else if (rel) {
    setText(badge, 'Up to date'); badge.className = 'chip ok';
    setText(act, 'Open release page'); act.className = 'btn ghost grow sm press'; act.disabled = false;
  }
}
function handleHomeUpdateBtn() {
  if (updState.state === 'ready') return promptInstallUpdate();
  if (latestRel && latestRel.apkUrl) return startInAppDownload(false);
  go('settings');
}
function handleUpdateAction() {
  if (updState.state === 'ready') return triggerNativeInstall();
  if (updState.state === 'downloading') return;
  if (latestRel && semver(latestRel.v, APP_VERSION) > 0 && latestRel.apkUrl) {
    if (hasNativeUpdater()) return startInAppDownload(false);
    window.open(latestRel.apkUrl, '_blank', 'noopener');
    return;
  }
  const url = (latestRel && latestRel.releaseUrl) || `https://github.com/${repoName()}/releases`;
  window.open(url, '_blank', 'noopener');
}
function startInAppDownload(autoNotify) {
  if (!latestRel || !latestRel.apkUrl) return toast('No APK file attached to this release yet');
  if (!hasNativeUpdater()) { window.open(latestRel.apkUrl, '_blank', 'noopener'); return; }
  updState = { ...updState, state: 'downloading', version: latestRel.v, progress: 0, downloaded: 0, total: latestRel.apkBytes || 0, error: '' };
  syncUpdateUI();
  const ok = AndroidBridge.downloadUpdate(latestRel.apkUrl, latestRel.v, latestRel.apkBytes || 0, !!autoNotify);
  if (!ok) { updState.state = 'error'; updState.error = 'Could not start download.'; syncUpdateUI(); }
  else if (!autoNotify) toast(`Downloading ${latestRel.v} in app…`);
}
function cancelInAppUpdate() {
  if (hasNativeUpdater()) AndroidBridge.cancelUpdate();
}
async function promptInstallUpdate() {
  syncNativeUpdateStatus();
  if (updState.state !== 'ready') { go('settings'); return; }
  const ver = updState.version || (latestRel && latestRel.v) || 'new version';
  const ok = await askConfirm({
    title: `Install SweldoPulse ${ver}?`,
    body: 'The update has been verified. The app will close briefly so Android can finish installing — all your shifts and settings stay safe.',
    ok: 'Install now',
    danger: false
  });
  if (ok) triggerNativeInstall();
}
function triggerNativeInstall() {
  if (!hasNativeUpdater()) return;
  const res = AndroidBridge.installDownloadedUpdate();
  if (res === 'started') {
    toast('Opening Android installer…');
  } else if (res === 'need_permission') {
    toast('Allow "Install unknown apps" for SweldoPulse, then return here');
  } else if (res && res.startsWith('error:')) {
    updState = { ...updState, state: 'error', error: res.slice(6) };
    syncUpdateUI();
    toast('Update file invalid — tap Retry download');
  }
}
window.onUpdateProgress = function (pct, dl, tot) {
  updState.state = 'downloading'; updState.progress = pct; updState.downloaded = dl; updState.total = tot;
  syncUpdateUI();
};
window.onUpdateReady = function (ver, bytes) {
  updState = { ...updState, state: 'ready', version: ver || updState.version, progress: 100, downloaded: bytes || 0, total: bytes || 0, error: '' };
  syncUpdateUI();
  if (!lockVisible()) toast(`SweldoPulse ${updState.version} ready to install`, { label: 'Install', fn: () => promptInstallUpdate() });
};
window.onUpdateError = function (msg) {
  updState = { ...updState, state: 'error', error: msg || 'Download failed. Tap Retry.' };
  syncUpdateUI();
  toast('Update download failed');
};
window.onUpdateCancelled = function () {
  updState = { ...updState, state: 'idle', progress: 0, downloaded: 0, error: '' };
  syncUpdateUI();
  toast('Download cancelled');
};
window.onInstallPermResult = function (ok) {
  if (ok) { triggerNativeInstall(); }
  else { toast('Permission needed to install updates inside the app'); }
};
window.onUpdateNotifTap = function () {
  syncNativeUpdateStatus();
  runOrQueueUnlocked(() => promptInstallUpdate());
};
function notifyNewReleaseOnce(rel) {
  if (!rel || !rel.v || semver(rel.v, APP_VERSION) <= 0) return;
  if (settings.notifiedUpdVer && semver(rel.v, settings.notifiedUpdVer) <= 0) return;
  settings.notifiedUpdVer = rel.v;
  persistSettings();
  const cleanNotes = rel.notes ? String(rel.notes).replace(/[#*`>]/g, '').trim().slice(0, 120) : 'Tap to download and install the latest update.';
  if (window.AndroidBridge && typeof AndroidBridge.notifyUpdateAvailable === 'function') {
    try { AndroidBridge.notifyUpdateAvailable(rel.v, cleanNotes); } catch (e) {}
  } else if ('Notification' in window && Notification.permission === 'granted') {
    showSystemNotification(`SweldoPulse ${rel.v} is available`, { body: cleanNotes, icon: './icon-192.png', tag: 'sweldo-update' });
  }
}
async function checkUpdates(manual) {
  if (_updChecking && !manual) return;
  _updChecking = true;
  const btn = $('upd-btn'), badge = $('upd-badge'), diag = $('upd-diag');
  syncNativeUpdateStatus();
  if (manual) { btn.disabled = true; btn.textContent = 'Checking…'; badge.textContent = 'Checking'; badge.className = 'chip mute'; diag.classList.add('hidden'); }
  try {
    const { rel, log } = await findLatestRelease(!!manual);
    settings.lastUpd = Date.now(); persistSettings();
    latestRel = rel;
    const newer = !!(rel && semver(rel.v, APP_VERSION) > 0);
    if (!manual) {
      syncUpdateUI();
      if (newer) {
        if (updState.state === 'ready' && updState.version === rel.v) return;
        if (rel.apkUrl && hasNativeUpdater() && settings.autoDownloadUpd !== false) {
          const wifiOk = settings.updWifiOnly === false || !AndroidBridge.isOnWifi || AndroidBridge.isOnWifi();
          if (wifiOk) { settings.notifiedUpdVer = rel.v; persistSettings(); startInAppDownload(true); return; }
        }
        notifyNewReleaseOnce(rel);
        if (!lockVisible()) toast(`Update ${rel.v} is available`, { label: 'Update', fn: () => { go('settings'); setTimeout(() => { const b = $('upd-box'); if (b) b.scrollIntoView({ block: 'center', behavior: 'smooth' }); }, 160); } });
      }
      return;
    }
    if (!rel) {
      badge.textContent = 'Unavailable'; badge.className = 'chip bad';
      diag.textContent = updFailText(log) + `  [${log.join(' · ')}]`; diag.classList.remove('hidden');
      $('upd-box').classList.add('hidden'); toast("Couldn't check for updates");
    } else {
      syncUpdateUI();
      if (updState.state === 'ready' && updState.version === rel.v) toast(`Version ${rel.v} is already downloaded & ready`);
      else toast(newer ? `Version ${rel.v} is available` : "You're on the latest version");
    }
  } finally {
    _updChecking = false;
    if (manual && btn) { btn.disabled = false; btn.textContent = 'Check for updates'; }
  }
}
function smartCheckUpdates() {
  if (navigator.onLine === false) return;
  if (Date.now() - (+settings.lastUpd || 0) < 180000) return; // 3-min real-time throttle
  checkUpdates(false);
}

/* ================= backup / restore & silent auto-backup ================= */
let bkMode = 'export', _abT = 0;
const hasNativeAutoBk = () => !!(window.AndroidBridge && typeof AndroidBridge.saveAutoBackup === 'function');
const backupJSON = () => JSON.stringify({ app: 'SweldoPulse', version: APP_VERSION, exportedAt: new Date().toISOString(), settings, shifts, gigs, expenses, debts }, null, 1);
function scheduleAutoBackup() {
  if (!hasNativeAutoBk() || settings.autoBackup === false) return;
  if (Date.now() - (+settings.lastAutoBk || 0) < 12 * 3600000) return;
  clearTimeout(_abT);
  _abT = setTimeout(() => runAutoBackup(false), 2500);
}
function runAutoBackup(manual) {
  if (!hasNativeAutoBk()) { if (manual) toast('Auto-backup works in the Android app'); return false; }
  try {
    const ok = AndroidBridge.saveAutoBackup(backupJSON());
    if (ok) {
      settings.lastAutoBk = Date.now();
      try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); localStorage.setItem(BK_KEY, Date.now()); } catch (e) {}
      syncBackupStatus();
      if (manual) toast('Saved to Documents/SweldoPulse');
    } else if (manual) toast('Could not write auto-backup');
    return ok;
  } catch (e) { if (manual) toast('Auto-backup failed'); return false; }
}
function toggleAutoBackup() {
  settings.autoBackup = $('autobk-on') ? $('autobk-on').checked : true;
  persistSettings(); syncBackupStatus();
  if (settings.autoBackup && hasNativeAutoBk()) runAutoBackup(true);
  else toast(settings.autoBackup ? 'Auto-backup enabled' : 'Auto-backup paused');
}
async function restoreAutoBackup() {
  if (!window.AndroidBridge || typeof AndroidBridge.readAutoBackup !== 'function') return toast('No auto-backup available here');
  const txt = AndroidBridge.readAutoBackup();
  if (!txt || txt.length < 10) return toast('No auto-backup file found yet');
  $('bk-text').value = txt;
  await restoreFromText();
}
function csvText() {
  const q = v => { v = String(v); if (/^[=+\-@\t\r]/.test(v)) v = "'" + v; return `"${v.replace(/"/g, '""')}"`; };
  const rows = ['type,date,status,start,end,label,rate_php,break_min,day_multiplier,regular_h,night_h,overtime_h,gross_php,cutoff'];
  [...shifts].sort((a, b) => a.date.localeCompare(b.date) || (a.startTime || '').localeCompare(b.startTime || '')).forEach(s => {
    const st = shiftStatusOf(s), g = st === 'cancelled' ? 0 : s.gross;
    rows.push(['shift', s.date, st, s.startTime, s.endTime, q(s.note || ''), (+s.hourlyRate || settings.hourlyRate).toFixed(2), s.breakMin || 0, s.multiplier, st === 'cancelled' ? 0 : s.reg, st === 'cancelled' ? 0 : s.nd, st === 'cancelled' ? 0 : s.ot, g.toFixed(2), q(periodOf(s.date).label)].join(','));
  });
  [...gigs].sort((a, b) => a.date.localeCompare(b.date)).forEach(g => {
    rows.push(['side_gig', g.date, g.status || 'paid', '', '', q(g.title ? `${g.stream}: ${g.title}` : g.stream), '', 0, 1, 0, 0, 0, g.amount.toFixed(2), q(periodOf(g.date).label)].join(','));
  });
  return rows.join('\n');
}
const b64Enc = bytes => { let s = ''; for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]); return btoa(s); };
const b64Dec = str => { const bin = atob(str), out = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i); return out; };
async function deriveBackupKey(passphrase, saltBytes, iter) {
  const enc = new TextEncoder();
  const km = await crypto.subtle.importKey('raw', enc.encode(passphrase), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey({ name: 'PBKDF2', salt: saltBytes, iterations: iter, hash: 'SHA-256' }, km, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}
async function encryptBackupText(plainText, passphrase) {
  if (!window.crypto || !crypto.subtle) throw new Error('Encryption requires a secure context');
  const salt = new Uint8Array(16), iv = new Uint8Array(12);
  crypto.getRandomValues(salt); crypto.getRandomValues(iv);
  const iter = 150000;
  const key = await deriveBackupKey(passphrase, salt, iter);
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(plainText)));
  return JSON.stringify({ app: 'SweldoPulse', encrypted: true, v: 1, kdf: 'PBKDF2-SHA256', iter, salt: b64Enc(salt), iv: b64Enc(iv), data: b64Enc(ct) }, null, 1);
}
async function decryptBackupEnvelope(env, passphrase) {
  if (!window.crypto || !crypto.subtle) throw new Error('Decryption unavailable');
  const salt = b64Dec(env.salt), iv = b64Dec(env.iv), ct = b64Dec(env.data);
  const iter = Math.min(500000, Math.max(10000, parseInt(env.iter, 10) || 150000));
  const key = await deriveBackupKey(passphrase, salt, iter);
  const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ct);
  return new TextDecoder().decode(pt);
}
let _pendingEncEnv = null;
function toggleBkEncrypt() {
  const on = $('bk-enc-on') && $('bk-enc-on').checked;
  if ($('bk-enc-fields')) $('bk-enc-fields').classList.toggle('hidden', !on);
  const ta = $('bk-text');
  if (bkMode === 'export') {
    ta.classList.toggle('hidden', !!on);
    if (!on) ta.value = backupJSON();
  }
}
async function prepareExportPayload() {
  const csv = bkMode === 'csv';
  if (csv) return { text: csvText(), name: `SweldoPulse-shifts-${today()}.csv`, mime: 'text/csv', encrypted: false };
  const encOn = $('bk-enc-on') && $('bk-enc-on').checked;
  if (!encOn) return { text: backupJSON(), name: `SweldoPulse-backup-${today()}.json`, mime: 'application/json', encrypted: false };
  const p1 = ($('bk-pass').value || ''), p2v = ($('bk-pass2').value || '');
  if (p1.length < 4) { toast('Passphrase must be at least 4 characters'); return null; }
  if (p1 !== p2v) { toast('Passphrases do not match'); return null; }
  toast('Encrypting backup…');
  try {
    const encText = await encryptBackupText(backupJSON(), p1);
    $('bk-text').value = encText;
    return { text: encText, name: `SweldoPulse-backup-${today()}.spbackup`, mime: 'application/json', encrypted: true };
  } catch (e) { toast('Encryption failed on this device'); return null; }
}
function openBackup(mode) {
  bkMode = mode; _pendingEncEnv = null;
  const ta = $('bk-text'), ex = mode !== 'restore', csv = mode === 'csv', jsonEx = mode === 'export';
  $('bk-title').textContent = csv ? 'Export as CSV' : (ex ? 'Back up your data' : 'Restore from backup');
  $('bk-sub').textContent = csv ? `${shifts.length} shift${shifts.length === 1 ? '' : 's'}${gigs.length ? ` + ${gigs.length} gigs` : ''} · opens in Excel / Sheets` : (ex ? `${shifts.length} shift${shifts.length === 1 ? '' : 's'} + settings` : 'Replaces everything on this device');
  if ($('bk-enc-wrap')) $('bk-enc-wrap').classList.toggle('hidden', !jsonEx);
  if ($('bk-enc-on')) $('bk-enc-on').checked = false;
  if ($('bk-enc-fields')) $('bk-enc-fields').classList.add('hidden');
  if ($('bk-pass')) $('bk-pass').value = '';
  if ($('bk-pass2')) $('bk-pass2').value = '';
  if ($('bk-dec-box')) $('bk-dec-box').classList.add('hidden');
  if ($('bk-dec-pass')) $('bk-dec-pass').value = '';
  ta.classList.remove('hidden');
  ta.value = csv ? csvText() : (ex ? backupJSON() : ''); ta.readOnly = ex; ta.placeholder = ex ? '' : 'Paste your .json or .spbackup text here…';
  $('bk-export').classList.toggle('hidden', !ex); $('bk-restore').classList.toggle('hidden', ex);
  $('bk-note').textContent = csv ? 'Copy it into a spreadsheet, or tap Save / share to send the .csv file.' : ex ? 'Turn on Encrypt to save a passphrase-protected .spbackup file before sharing to Drive or Messenger.' : 'Choose a .json or .spbackup file, or paste the backup text above.';
  openSheet('backup-sheet');
}
const markBackup = () => { if (bkMode === 'csv') return render(); try { localStorage.setItem(BK_KEY, Date.now()); } catch (e) {} render(); syncBackupStatus(); };
async function copyBackup() {
  const pkg = await prepareExportPayload(); if (!pkg) return;
  if (await copyText(pkg.text)) { markBackup(); toast(pkg.encrypted ? 'Encrypted backup copied ✓' : 'Backup copied — paste it somewhere safe'); }
  else toast("Couldn't copy — select the text and copy manually");
}
async function saveBackupFile() {
  const pkg = await prepareExportPayload(); if (!pkg) return;
  const { name, text, mime, encrypted } = pkg;
  try { const f = new File([text], name, { type: mime }); if (navigator.canShare && navigator.canShare({ files: [f] })) { await navigator.share({ files: [f], title: name }); markBackup(); return; } } catch (e) { if (e.name === 'AbortError') return; }
  if (window.AndroidBridge) {
    if (typeof AndroidBridge.shareFile === 'function' && AndroidBridge.shareFile(name, text, mime)) { markBackup(); toast(encrypted ? 'Sharing encrypted .spbackup…' : 'Opening share sheet…'); return; }
    if (await copyText(text)) { markBackup(); toast('Saved to clipboard — paste it into Notes or Drive'); } return;
  }
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type: mime })); a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000); markBackup(); toast(encrypted ? 'Encrypted .spbackup saved' : 'Backup file saved');
}
function chooseBackupFile() {
  if (window.AndroidBridge && typeof AndroidBridge.pickBackupFile === 'function') {
    AndroidBridge.pickBackupFile();
    return;
  }
  const inp = $('bk-file'); if (inp) inp.click();
}
window.onBackupFilePicked = function (text) {
  if (!text) return toast('Selected file is empty');
  $('bk-text').value = text;
  restoreFromText();
};
window.onBackupFileError = function (msg) { toast(msg || 'Could not read selected file'); };
function sanitizeRestoredSettings(raw) {
  const s = (raw && typeof raw === 'object') ? raw : {};
  const out = { ...settings };
  const num = (v, min, max, fb) => { const n = Number(v); return isFinite(n) ? Math.min(max, Math.max(min, n)) : fb; };
  if (s.hourlyRate !== undefined) out.hourlyRate = r2(num(s.hourlyRate, 0, 100000, out.hourlyRate));
  if (PH_WAGE_PRESETS[String(s.calabarzonArea || '')] || s.calabarzonArea === 'custom') out.calabarzonArea = String(s.calabarzonArea);
  if (['semi', 'semi25', 'weekly', 'monthly'].includes(s.schedule)) out.schedule = s.schedule;
  if (typeof s.preHolidayRule === 'boolean') out.preHolidayRule = s.preHolidayRule;
  if (s.ndRate !== undefined) out.ndRate = r2(num(s.ndRate, 0, 0.5, 0.10));
  if (s.otThreshold !== undefined) out.otThreshold = Math.round(num(s.otThreshold, 0, 16, 8));
  if (['auto', 'on', 'off'].includes(s.liteMode)) out.liteMode = s.liteMode;
  if (['surface', 'obsidian', 'tinted'].includes(s.cardStyle)) out.cardStyle = s.cardStyle;
  if (WORK_PROFILES[s.workProfile] || s.workProfile === 'custom') out.workProfile = s.workProfile;
  if (['first', 'split', 'last'].includes(s.deductMode)) out.deductMode = s.deductMode;
  if (s.statMinGross !== undefined) out.statMinGross = r2(num(s.statMinGross, 0, 100000, 2000));
  if (typeof s.mwe === 'boolean') out.mwe = s.mwe;
  if (typeof s.autoDeduct === 'boolean') out.autoDeduct = s.autoDeduct;
  if (typeof s.hide === 'boolean') out.hide = s.hide;
  if (s.goal !== undefined) out.goal = r2(num(s.goal, 0, 10000000, 0));
  if (s.payLag !== undefined) out.payLag = Math.round(num(s.payLag, 0, 31, 0));
  if (['system', 'light', 'dark', 'amoled'].includes(s.themeMode)) out.themeMode = s.themeMode;
  if (ACCENTS[s.accentTheme]) out.accentTheme = s.accentTheme;
  const bn = num(s.budgetNeeds, 0, 100, out.budgetNeeds), bw = num(s.budgetWants, 0, 100, out.budgetWants), bs = num(s.budgetSavings, 0, 100, out.budgetSavings);
  if (Math.abs(bn + bw + bs - 100) < 0.05) { out.budgetNeeds = bn; out.budgetWants = bw; out.budgetSavings = bs; }
  if (typeof s.notifEnabled === 'boolean') out.notifEnabled = s.notifEnabled;
  if (/^\d{2}:\d{2}$/.test(s.notifTime || '')) out.notifTime = s.notifTime;
  if (typeof s.dueNotifEnabled === 'boolean') out.dueNotifEnabled = s.dueNotifEnabled;
  if (/^\d{2}:\d{2}$/.test(s.dueNotifTime || '')) out.dueNotifTime = s.dueNotifTime;
  if (typeof s.planNudgeEnabled === 'boolean') out.planNudgeEnabled = s.planNudgeEnabled;
  if (typeof s.maskWidgetWhenLocked === 'boolean') out.maskWidgetWhenLocked = s.maskWidgetWhenLocked;
  if (typeof s.allowScreenshots === 'boolean') out.allowScreenshots = s.allowScreenshots;
  if (s.incomeScope === 'payroll' || s.incomeScope === 'all') out.incomeScope = s.incomeScope;
  if (s.last && /^\d{2}:\d{2}$/.test(s.last.start || '') && /^\d{2}:\d{2}$/.test(s.last.end || '')) {
    out.last = { start: s.last.start, end: s.last.end, brk: Math.round(num(s.last.brk, 0, 180, 0)) };
  }
  if (typeof s.midnightHolidaySplit === 'boolean') out.midnightHolidaySplit = s.midnightHolidaySplit;
  out.cutoffData = {};
  if (s.cutoffData && typeof s.cutoffData === 'object' && !Array.isArray(s.cutoffData)) {
    const BAD_KEYS = new Set(['__proto__', 'constructor', 'prototype']);
    Object.keys(s.cutoffData).forEach(k => {
      if (BAD_KEYS.has(k) || !/^\d{4}-\d{2}(?:-\d{1,2})?$/.test(k)) return;
      const rec = s.cutoffData[k];
      if (!rec || typeof rec !== 'object' || Array.isArray(rec)) return;
      const clean = {};
      if (rec.allowance !== undefined) clean.allowance = r2(num(rec.allowance, 0, 1e7, 0));
      if (rec.otherDed !== undefined) clean.otherDed = r2(num(rec.otherDed, 0, 1e7, 0));
      if (rec.actualNet !== undefined && rec.actualNet !== null && rec.actualNet !== '') clean.actualNet = r2(num(rec.actualNet, 0, 1e7, 0));
      if (rec.manual && typeof rec.manual === 'object') {
        clean.manual = { sss: r2(num(rec.manual.sss, 0, 1e6, 0)), ph: r2(num(rec.manual.ph, 0, 1e6, 0)), pi: r2(num(rec.manual.pi, 0, 1e6, 0)), tax: r2(num(rec.manual.tax, 0, 1e6, 0)) };
      }
      if (rec.snapshot && typeof rec.snapshot === 'object' && rec.snapshot.t && rec.snapshot.d && isFinite(rec.snapshot.net)) {
        clean.snapshot = {
          lockedAt: Math.round(num(rec.snapshot.lockedAt, 0, 1e15, Date.now())),
          auto: !!rec.snapshot.auto,
          t: { gross: r2(num(rec.snapshot.t.gross, 0, 1e7, 0)), basic: r2(num(rec.snapshot.t.basic, 0, 1e7, 0)), nd: r2(num(rec.snapshot.t.nd, 0, 1e7, 0)), otp: r2(num(rec.snapshot.t.otp, 0, 1e7, 0)), reg: r2(num(rec.snapshot.t.reg, 0, 1000, 0)), ndH: r2(num(rec.snapshot.t.ndH, 0, 1000, 0)), otH: r2(num(rec.snapshot.t.otH, 0, 1000, 0)), hrs: r2(num(rec.snapshot.t.hrs, 0, 1000, 0)), n: Math.round(num(rec.snapshot.t.n, 0, 500, 0)) },
          allow: r2(num(rec.snapshot.allow, 0, 1e7, 0)),
          grossAll: r2(num(rec.snapshot.grossAll, 0, 1e7, 0)),
          d: { sss: r2(num(rec.snapshot.d.sss, 0, 1e6, 0)), ph: r2(num(rec.snapshot.d.ph, 0, 1e6, 0)), pi: r2(num(rec.snapshot.d.pi, 0, 1e6, 0)), tax: r2(num(rec.snapshot.d.tax, 0, 1e6, 0)), oth: r2(num(rec.snapshot.d.oth, 0, 1e6, 0)), total: r2(num(rec.snapshot.d.total, 0, 1e7, 0)), capped: !!rec.snapshot.d.capped },
          net: r2(num(rec.snapshot.net, 0, 1e7, 0))
        };
      }
      out.cutoffData[k] = clean;
    });
  }
  out.rosterTemplates = Array.isArray(s.rosterTemplates) ? s.rosterTemplates.filter(t => t && t.name && Array.isArray(t.days) && /^\d{2}:\d{2}$/.test(t.start || '') && /^\d{2}:\d{2}$/.test(t.end || '')).slice(0, 10).map(t => ({
    id: nextId(), name: String(t.name).trim().slice(0, 40), days: [...new Set(t.days.map(x => parseInt(x, 10)).filter(x => x >= 0 && x <= 6))].sort(),
    start: t.start, end: t.end, brk: Math.round(num(t.brk, 0, 180, 0)), note: String(t.note || '').trim().slice(0, 40)
  })) : [];
  out.jobs = Array.isArray(s.jobs) ? s.jobs.filter(j => j && j.id && j.name).slice(0, 8).map(j => ({
    id: String(j.id).slice(0, 32), name: String(j.name).trim().slice(0, 40),
    hourlyRate: r2(num(j.hourlyRate, 0, 100000, out.hourlyRate)),
    calabarzonArea: (PH_WAGE_PRESETS[String(j.calabarzonArea || '')] || j.calabarzonArea === 'custom') ? String(j.calabarzonArea) : 'custom',
    schedule: ['semi', 'semi25', 'weekly', 'monthly'].includes(j.schedule) ? j.schedule : out.schedule,
    workProfile: (WORK_PROFILES[j.workProfile] || j.workProfile === 'custom') ? j.workProfile : 'custom',
    preHolidayRule: typeof j.preHolidayRule === 'boolean' ? j.preHolidayRule : out.preHolidayRule,
    midnightHolidaySplit: typeof j.midnightHolidaySplit === 'boolean' ? j.midnightHolidaySplit : out.midnightHolidaySplit,
    ndRate: r2(num(j.ndRate, 0, 0.5, out.ndRate)),
    otThreshold: Math.round(num(j.otThreshold, 0, 16, out.otThreshold)),
    autoDeduct: typeof j.autoDeduct === 'boolean' ? j.autoDeduct : out.autoDeduct,
    deductMode: ['first', 'split', 'last'].includes(j.deductMode) ? j.deductMode : out.deductMode,
    statMinGross: r2(num(j.statMinGross, 0, 100000, out.statMinGross)),
    mwe: typeof j.mwe === 'boolean' ? j.mwe : out.mwe
  })) : [];
  out.activeJobId = out.jobs.some(j => j.id === s.activeJobId) ? s.activeJobId : (out.jobs[0] ? out.jobs[0].id : '');
  out.customPresets = Array.isArray(s.customPresets) ? s.customPresets.filter(p => p && /^\d{2}:\d{2}$/.test(p.start || '') && /^\d{2}:\d{2}$/.test(p.end || '')).slice(0, 6) : [];
  out.vaults = Array.isArray(s.vaults) ? s.vaults.filter(v => v && v.name).map(v => ({ id: nextId(), name: String(v.name).trim(), target: r2(num(v.target, 0, 1e8, 0)), saved: r2(num(v.saved, 0, 1e8, 0)) })) : [];
  out.bills = Array.isArray(s.bills) ? s.bills.filter(b => b && b.name).map(b => ({ id: nextId(), name: String(b.name).trim(), amount: r2(num(b.amount, 0, 1e7, 0)), cycle: ['both', '1', '2'].includes(b.cycle) ? b.cycle : 'both', cat: b.cat === 'wants' ? 'wants' : 'needs' })) : [];
  // Intentionally keep current out.repo so an untrusted backup cannot hijack update sources
  return out;
}
function restoreFromFile(inp) { const f = inp.files[0]; inp.value = ''; if (!f) return; const r = new FileReader(); r.onload = () => { $('bk-text').value = r.result; restoreFromText(); }; r.readAsText(f); }
async function applyRestoredPayload(d) {
  const list = normalizeShifts(d && d.shifts);
  if (!d || d.app !== 'SweldoPulse' || !Array.isArray(d.shifts) || (d.shifts.length && !list.length)) return toast('Not a SweldoPulse backup');
  if (!await askConfirm({ title: 'Replace all data?', body: `This replaces everything on this device with the backup (<b>${list.length}</b> shifts). This cannot be undone.`, ok: 'Restore', danger: true })) return;
  settings = sanitizeRestoredSettings(d.settings);
  shifts = list; gigs = normalizeGigs(d.gigs || []); expenses = normalizeExpenses(d.expenses || []); debts = normalizeDebts(d.debts || []); _pm.clear(); selKey = ''; ui.calDay = ''; _pendingEncEnv = null;
  persistSettings(); persistShifts(); persistGigs(); persistExpenses(); persistDebts(); syncNativeReminder(); closeSheet('backup-sheet'); syncSettingsUI(); renderNow(); toast(`Restored ${list.length} shifts${gigs.length ? ' + ' + gigs.length + ' gigs' : ''}`);
}
async function restoreFromText() {
  let d; try { d = JSON.parse($('bk-text').value.trim()); } catch (e) { return toast('That is not valid backup text'); }
  if (d && d.app === 'SweldoPulse' && d.encrypted === true && d.data && d.salt && d.iv) {
    _pendingEncEnv = d;
    if ($('bk-dec-box')) $('bk-dec-box').classList.remove('hidden');
    if ($('bk-dec-pass')) { $('bk-dec-pass').value = ''; setTimeout(() => $('bk-dec-pass').focus(), 120); }
    toast('Enter passphrase to decrypt backup');
    return;
  }
  await applyRestoredPayload(d);
}
async function decryptAndRestore() {
  if (!_pendingEncEnv) return toast('No encrypted backup loaded');
  const pass = $('bk-dec-pass') ? $('bk-dec-pass').value : '';
  if (!pass) return toast('Enter the backup passphrase');
  try {
    const plain = await decryptBackupEnvelope(_pendingEncEnv, pass);
    const d = JSON.parse(plain);
    if ($('bk-dec-box')) $('bk-dec-box').classList.add('hidden');
    await applyRestoredPayload(d);
  } catch (e) {
    toast('Wrong passphrase or corrupted backup');
  }
}
function syncBackupStatus() {
  const lb = +localStorage.getItem(BK_KEY) || 0;
  $('backup-status').textContent = lb ? 'Last backup: ' + new Date(lb).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Never backed up';
  if ($('autobk-on')) $('autobk-on').checked = settings.autoBackup !== false;
  if ($('autobk-actions')) $('autobk-actions').classList.toggle('hidden', !hasNativeAutoBk());
  if ($('autobk-sub')) {
    const ab = +settings.lastAutoBk || 0;
    $('autobk-sub').textContent = !hasNativeAutoBk() ? 'Android app feature' : (ab ? 'Last saved: ' + new Date(ab).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : 'Saves daily to Documents/SweldoPulse');
  }
}

/* ================= payslip copy / image ================= */
function payslipText() {
  const P = periodFromKey(selKey), D = periodData(selKey);
  const lines = [`SweldoPulse payslip — ${P.label}`, `${D.t.n} shift${D.t.n === 1 ? '' : 's'} · ${fh(D.t.hrs)}`];
  if (D.allow > 0) lines.push(`Allowances: +${peso(D.allow)}`);
  lines.push(`Gross: ${peso(D.grossAll)}`, `SSS: -${peso(D.d.sss)}`, `PhilHealth: -${peso(D.d.ph)}`, `Pag-IBIG: -${peso(D.d.pi)}`, `Tax: -${peso(D.d.tax)}`, `Other: -${peso(D.d.oth)}`, `Total deductions: -${peso(D.d.total)}`, `Net take-home: ${peso(D.net)}`);
  if (D.actual !== null) { const diff = r2(D.actual - D.net); lines.push(`Actual received: ${peso(D.actual)} (${Math.abs(diff) < 0.01 ? 'Matched' : (diff < 0 ? '-' + peso(Math.abs(diff)) + ' short' : '+' + peso(diff) + ' over')})`); }
  return lines.join('\n');
}
async function copyPayslip() { toast((await copyText(payslipText())) ? 'Payslip copied' : "Couldn't copy"); }
function exportPalette() {
  const dark = isDark() || settings.cardStyle === 'obsidian';
  const P = ACCENTS[settings.accentTheme] || ACCENTS.indigo;
  const accent = dark ? (P.cd || P.ad || P.a) : (P.cl || P.a);
  return dark
    ? { dark: true, bg: '#090B10', card: '#12151E', subCard: '#181C28', line: '#232938', t1: '#F8FAFC', t2: '#CBD5E1', t3: '#7C8AA2', ok: '#10B981', bad: '#F43F5E', accent }
    : { dark: false, bg: '#EEF0F5', card: '#FFFFFF', subCard: '#F6F7FA', line: '#DCE2EC', t1: '#0B0F19', t2: '#334155', t3: '#64748B', ok: '#059669', bad: '#DC2626', accent };
}
function drawBrandMark(x, px, py, sc) {
  const gold = x.createLinearGradient(0, 0, 64, 64); gold.addColorStop(0, '#FFE08A'); gold.addColorStop(.5, '#F5A524'); gold.addColorStop(1, '#F0643C');
  x.save(); x.translate(px, py); x.scale(sc, sc);
  x.fillStyle = '#0B0F1E'; x.beginPath(); if (x.roundRect) x.roundRect(0, 0, 64, 64, 16); else x.rect(0, 0, 64, 64); x.fill();
  x.lineCap = 'round'; x.lineJoin = 'round'; x.strokeStyle = gold; x.lineWidth = 4.4; x.beginPath(); x.arc(32, 32, 19, 0, 7); x.stroke();
  const pl = () => { x.beginPath(); x.moveTo(7, 34); x.lineTo(22, 34); x.lineTo(27, 22); x.lineTo(33, 46); x.lineTo(38, 34); x.lineTo(57, 34); };
  x.strokeStyle = '#0B0F1E'; x.lineWidth = 10; pl(); x.stroke(); x.strokeStyle = '#fff'; x.lineWidth = 4; pl(); x.stroke();
  x.fillStyle = '#F5A524'; x.beginPath(); x.arc(57, 34, 2.8, 0, 7); x.fill(); x.restore();
}
function drawRoundBox(x, bx, by, bw, bh, r, fill, stroke) {
  x.beginPath(); if (x.roundRect) x.roundRect(bx, by, bw, bh, r); else x.rect(bx, by, bw, bh);
  if (fill) { x.fillStyle = fill; x.fill(); }
  if (stroke) { x.strokeStyle = stroke; x.lineWidth = 2; x.stroke(); }
}
async function viewPayslip() {
  try { await document.fonts.load('700 40px Inter'); await document.fonts.load('500 40px Inter'); } catch (e) {}
  const P = periodFromKey(selKey), D = periodData(selKey), t = D.t, d = D.d, W = 1080, K = exportPalette();
  const rows = [['Basic regular pay', t.basic], ['Night differential', t.nd], ['Overtime & holiday', t.otp]];
  if (D.allow > 0) rows.push(['Allowances & add-ons', D.allow]);
  rows.push(['Gross earnings', D.grossAll, 1], ['SSS', -d.sss], ['PhilHealth', -d.ph], ['Pag-IBIG', -d.pi], ['Withholding tax', -d.tax], ['Other / cash advance', -d.oth], ['Total deductions', -d.total, 1]);
  if (D.actual !== null) rows.push(['Actual pay received', D.actual, 1]);
  const H = 680 + rows.length * 70 + 130, c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d');
  x.fillStyle = K.bg; x.fillRect(0, 0, W, H);
  // Institutional Statement Sheet
  drawRoundBox(x, 44, 44, W - 88, H - 88, 32, K.card, K.line);
  // Subtle top accent hairline bar
  x.fillStyle = K.accent; x.fillRect(84, 44, W - 168, 6);
  // Header
  drawBrandMark(x, 88, 92, 1.45);
  x.textAlign = 'left';
  x.fillStyle = K.t1; x.font = '700 38px Inter, sans-serif'; x.fillText('SweldoPulse', 202, 134);
  x.fillStyle = K.t3; x.font = '600 22px Inter, sans-serif'; x.fillText('PAYSLIP STATEMENT · ' + P.badge.toUpperCase(), 202, 168);
  x.textAlign = 'right';
  x.fillStyle = K.t2; x.font = '600 24px Inter, sans-serif'; x.fillText(P.label, W - 88, 134);
  x.fillStyle = K.t3; x.font = '500 22px Inter, sans-serif'; x.fillText(`${t.n} shift${t.n === 1 ? '' : 's'} · ${fh(t.hrs)} · ${peso(settings.hourlyRate)}/hr`, W - 88, 168);
  // Hero Net Take-Home Band
  drawRoundBox(x, 88, 224, W - 176, 210, 22, K.subCard, K.line);
  x.textAlign = 'left';
  x.fillStyle = K.t3; x.font = '700 21px Inter, sans-serif'; x.fillText('NET TAKE-HOME PAY', 124, 272);
  x.fillStyle = K.t1; x.font = '700 76px Inter, sans-serif'; x.fillText(peso(D.net), 124, 360);
  if (D.gigPaid > 0) {
    x.fillStyle = K.ok; x.font = '600 22px Inter, sans-serif';
    x.fillText(`+ ${peso(D.gigPaid)} paid side gigs (Total pool: ${peso(D.netAll)})`, 124, 406);
  } else {
    x.fillStyle = K.t3; x.font = '500 22px Inter, sans-serif';
    x.fillText(`${fh(t.reg)} reg · ${fh(t.ndH)} night · ${fh(t.otH)} OT`, 124, 406);
  }
  // 3-Column Hairline Metrics Strip
  const mY = 464, colW = (W - 176) / 3;
  drawRoundBox(x, 88, mY, W - 176, 108, 18, K.card, K.line);
  const strip = [['GROSS PAY', peso(D.grossAll), K.t1], ['DEDUCTIONS', '−' + peso(d.total), K.bad], ['HOURS WORKED', fh(t.hrs), K.t1]];
  strip.forEach((it, idx) => {
    const cx = 88 + idx * colW;
    if (idx > 0) { x.strokeStyle = K.line; x.lineWidth = 2; x.beginPath(); x.moveTo(cx, mY + 20); x.lineTo(cx, mY + 88); x.stroke(); }
    x.textAlign = 'left';
    x.fillStyle = K.t3; x.font = '700 18px Inter, sans-serif'; x.fillText(it[0], cx + 26, mY + 42);
    x.fillStyle = it[2]; x.font = '700 30px Inter, sans-serif'; x.fillText(it[1], cx + 26, mY + 84);
  });
  // Statement Ledger Table
  let y = 636;
  x.textAlign = 'left'; x.fillStyle = K.t3; x.font = '700 20px Inter, sans-serif'; x.fillText('ITEMIZED BREAKDOWN', 88, y - 22);
  x.textAlign = 'right'; x.fillText('AMOUNT (PHP)', W - 88, y - 22);
  rows.forEach(r => {
    x.strokeStyle = K.line; x.lineWidth = r[2] ? 2.2 : 1.5;
    x.beginPath(); x.moveTo(88, y - 4); x.lineTo(W - 88, y - 4); x.stroke();
    y += 44;
    if (r[2]) { x.fillStyle = K.subCard; x.fillRect(88, y - 42, W - 176, 58); }
    x.textAlign = 'left'; x.font = (r[2] ? '700 ' : '500 ') + '28px Inter, sans-serif';
    x.fillStyle = r[2] ? K.t1 : K.t2; x.fillText(r[0], 104, y);
    x.textAlign = 'right';
    x.fillStyle = r[1] < 0 ? K.bad : (r[2] ? K.t1 : K.t2);
    x.fillText((r[1] < 0 ? '−' : '') + peso(Math.abs(r[1])), W - 104, y);
    y += 26;
  });
  // Footer
  x.textAlign = 'left'; x.fillStyle = K.t3; x.font = '500 20px Inter, sans-serif';
  x.fillText(`Generated by SweldoPulse v${APP_VERSION} · ${new Date().toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })} · Estimate only`, 88, H - 82);
  window.__payslipCanvas = c; window.__payslipName = `SweldoPulse-payslip-${today()}.png`; $('payslip-img').src = c.toDataURL('image/png'); $('payslip-modal').classList.add('on');
}
async function viewInsightsCard() {
  try { await document.fonts.load('700 40px Inter'); await document.fonts.load('500 40px Inter'); } catch (e) {}
  const D = _insCache || computeYearData(ui.insYear), W = 1080, H = 1340, K = exportPalette();
  const allMode = settings.incomeScope === 'all' && D.totGigs > 0;
  const yearNet = allMode ? r2(D.totNet + D.totGigs) : D.totNet;
  const eff = D.totHrs > 0 ? r2(D.totGross / D.totHrs) : 0;
  const statTot = r2(D.st.sss + D.st.ph + D.st.pi + D.st.tax);
  const c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d');
  x.fillStyle = K.bg; x.fillRect(0, 0, W, H);
  drawRoundBox(x, 44, 44, W - 88, H - 88, 32, K.card, K.line);
  x.fillStyle = K.accent; x.fillRect(84, 44, W - 168, 6);
  drawBrandMark(x, 88, 92, 1.45);
  x.textAlign = 'left';
  x.fillStyle = K.t1; x.font = '700 38px Inter, sans-serif'; x.fillText('SweldoPulse', 202, 134);
  x.fillStyle = K.t3; x.font = '600 22px Inter, sans-serif'; x.fillText(`${D.yr} ANNUAL EARNINGS SUMMARY`, 202, 168);
  x.textAlign = 'right';
  x.fillStyle = K.t2; x.font = '600 24px Inter, sans-serif'; x.fillText(`${D.cutoffCount} Active Cutoff${D.cutoffCount === 1 ? '' : 's'}`, W - 88, 134);
  x.fillStyle = K.t3; x.font = '500 22px Inter, sans-serif'; x.fillText(allMode ? 'Payroll + Side Gigs' : 'Main Payroll', W - 88, 168);
  // Hero Annual Net Box
  drawRoundBox(x, 88, 224, W - 176, 200, 22, K.subCard, K.line);
  x.textAlign = 'left';
  x.fillStyle = K.t3; x.font = '700 21px Inter, sans-serif'; x.fillText(allMode ? 'TOTAL NET INCOME (YTD)' : 'TOTAL NET PAYROLL (YTD)', 124, 272);
  x.fillStyle = K.t1; x.font = '700 80px Inter, sans-serif'; x.fillText(peso(yearNet), 124, 362);
  if (D.totGigs > 0) {
    x.fillStyle = K.ok; x.font = '600 22px Inter, sans-serif'; x.fillText(`Includes ${peso(D.totGigs)} from side gigs`, 124, 404);
  }
  // 2x2 Hairline KPI Matrix
  const mX = 88, mY = 454, mW = W - 176, mH = 248;
  drawRoundBox(x, mX, mY, mW, mH, 20, K.card, K.line);
  x.strokeStyle = K.line; x.lineWidth = 2;
  x.beginPath(); x.moveTo(mX + mW / 2, mY); x.lineTo(mX + mW / 2, mY + mH); x.stroke();
  x.beginPath(); x.moveTo(mX, mY + mH / 2); x.lineTo(mX + mW, mY + mH / 2); x.stroke();
  const kpis = [
    ['EFFECTIVE RATE', eff > 0 ? `${peso(eff)}/hr` : '—', K.t1],
    ['HOURS WORKED', `${fh(D.totHrs)} (${D.totShifts} sh)`, K.t1],
    ['13TH-MONTH YTD', peso(D.basicYr / 12), K.ok],
    ['STATUTORY TOTAL', '−' + peso(statTot), K.bad]
  ];
  kpis.forEach((k, i) => {
    const cx = mX + (i % 2) * (mW / 2) + 28, cy = mY + Math.floor(i / 2) * (mH / 2);
    x.textAlign = 'left';
    x.fillStyle = K.t3; x.font = '700 19px Inter, sans-serif'; x.fillText(k[0], cx, cy + 44);
    x.fillStyle = k[2]; x.font = '700 36px Inter, sans-serif'; x.fillText(k[1], cx, cy + 94);
  });
  // Trading-Style Monthly Bar Chart with Hairline Grid
  x.textAlign = 'left'; x.fillStyle = K.t3; x.font = '700 21px Inter, sans-serif'; x.fillText('MONTHLY NET PERFORMANCE', 88, 766);
  const cX = 88, cY = 796, cW = W - 176, cH = 340;
  drawRoundBox(x, cX, cY, cW, cH, 20, K.subCard, K.line);
  const vals = D.months.map(m => allMode ? r2(m.net + m.gigs) : m.net), maxV = Math.max(1, ...vals);
  for (let g = 1; g <= 3; g++) {
    const gy = cY + 46 + g * 58;
    x.strokeStyle = K.line; x.lineWidth = 1.5; x.beginPath(); x.moveTo(cX + 26, gy); x.lineTo(cX + cW - 26, gy); x.stroke();
  }
  const baseY = cY + 278, slotW = (cW - 56) / 12;
  vals.forEach((v, i) => {
    const bx = cX + 28 + i * slotW + (slotW - 44) / 2, bh = v > 0 ? Math.max(12, Math.round((v / maxV) * 212)) : 6;
    drawRoundBox(x, bx, baseY - bh, 44, bh, 8, v > 0 ? K.accent : K.line, null);
    x.fillStyle = v > 0 ? K.t1 : K.t3; x.font = '700 20px Inter, sans-serif'; x.textAlign = 'center';
    x.fillText(MON[i], bx + 22, baseY + 34);
  });
  x.textAlign = 'left'; x.fillStyle = K.t3; x.font = '500 20px Inter, sans-serif';
  x.fillText(`Generated by SweldoPulse v${APP_VERSION} · ${new Date().toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })}`, 88, H - 82);
  window.__payslipCanvas = c; window.__payslipName = `SweldoPulse-insights-${D.yr}.png`;
  $('payslip-img').src = c.toDataURL('image/png'); $('payslip-modal').classList.add('on');
}
function closePayslip() { $('payslip-modal').classList.remove('on'); }
async function savePayslipImage() {
  const c = window.__payslipCanvas; if (!c) return; const name = window.__payslipName || `SweldoPulse-payslip-${today()}.png`;
  if (window.AndroidBridge) { toast(AndroidBridge.saveImage(c.toDataURL('image/png'), name) ? 'Saved to Pictures/SweldoPulse' : 'Could not save — allow storage permission and retry'); return; }
  const blob = await new Promise(r => c.toBlob(r, 'image/png'));
  try { const f = new File([blob], name, { type: 'image/png' }); if (navigator.canShare && navigator.canShare({ files: [f] })) { await navigator.share({ files: [f], title: name }); return; } } catch (e) { if (e.name === 'AbortError') return; }
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); a.remove(); toast('Payslip image saved');
}

/* ================= app lock (PBKDF2-SHA256, monotonic lockout, pending deep-link queue) ================= */
const lockCfg = () => { try { return JSON.parse(localStorage.getItem(LOCK_KEY) || 'null'); } catch (e) { return null; } };
let pinBuf = '', pinMode = '', pinTmp = '', pinLen = 4, hiddenAt = 0, fpPurpose = '', lockTimer = 0, pinBusy = false, pendingUnlockQueue = [];
function monoNowMs() {
  try { if (window.AndroidBridge && typeof AndroidBridge.getElapsedMs === 'function') return Number(AndroidBridge.getElapsedMs()) || 0; } catch (e) {}
  return 0;
}
function setLockoutMs(durMs) {
  const m = monoNowMs();
  try {
    localStorage.setItem('sp_lock_until', String(Date.now() + durMs));
    if (m > 0) localStorage.setItem('sp_lock_mono', JSON.stringify({ base: m, until: m + durMs, dur: durMs }));
  } catch (e) {}
}
function clearLockoutState() {
  localStorage.removeItem('sp_pin_fails');
  localStorage.removeItem('sp_lock_until');
  localStorage.removeItem('sp_lock_mono');
}
function getLockRemainingMs() {
  const m = monoNowMs();
  if (m > 0) {
    try {
      const rec = JSON.parse(localStorage.getItem('sp_lock_mono') || 'null');
      if (rec && rec.until && m >= rec.base) return Math.max(0, rec.until - m);
    } catch (e) {}
  }
  const until = +localStorage.getItem('sp_lock_until') || 0;
  return Math.max(0, until - Date.now());
}
function randomSalt() {
  try {
    if (window.crypto && crypto.getRandomValues) {
      const a = new Uint8Array(16); crypto.getRandomValues(a);
      return [...a].map(b => b.toString(16).padStart(2, '0')).join('');
    }
  } catch (e) {}
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}
async function hashPinLegacy(p, salt) {
  const s = salt + ':' + p;
  if (window.crypto && crypto.subtle) { const h = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)); return [...new Uint8Array(h)].map(b => b.toString(16).padStart(2, '0')).join(''); }
  let x = 5381; for (const ch of s) x = ((x << 5) + x + ch.charCodeAt(0)) >>> 0; return 'f' + x;
}
async function hashPinV2(p, salt) {
  if (window.crypto && crypto.subtle && typeof crypto.subtle.importKey === 'function') {
    const enc = new TextEncoder();
    const km = await crypto.subtle.importKey('raw', enc.encode(String(p)), 'PBKDF2', false, ['deriveBits']);
    const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: enc.encode('sp_v2:' + salt), iterations: 100000, hash: 'SHA-256' }, km, 256);
    return [...new Uint8Array(bits)].map(b => b.toString(16).padStart(2, '0')).join('');
  }
  return hashPinLegacy(p, salt);
}
async function verifyPinAgainst(p, cfg) {
  if (!cfg || !cfg.hash || !cfg.salt) return false;
  if (cfg.v === 2) return (await hashPinV2(p, cfg.salt)) === cfg.hash;
  const ok = (await hashPinLegacy(p, cfg.salt)) === cfg.hash;
  if (ok) {
    // Transparently upgrade legacy single-pass SHA-256 PIN to PBKDF2-SHA256
    try {
      const salt = randomSalt();
      const upgraded = { ...cfg, v: 2, salt, hash: await hashPinV2(p, salt) };
      localStorage.setItem(LOCK_KEY, JSON.stringify(upgraded));
    } catch (e) {}
  }
  return ok;
}
const hasFp = () => { const c = lockCfg(); try { return !!(window.AndroidBridge && c && c.fp && AndroidBridge.fpAvailable()); } catch (e) { return false; } };
const lockVisible = () => root.classList.contains('locked') || root.classList.contains('pin-open');
function runOrQueueUnlocked(fn) {
  if (lockVisible()) { pendingUnlockQueue.push(fn); return; }
  fn();
}
function activePinLen() {
  if (pinMode === 'set1' || pinMode === 'set2') return pinLen === 6 ? 6 : 4;
  const c = lockCfg();
  return (c && c.len === 6) ? 6 : 4;
}
function setPinLen(n) {
  pinLen = n === 6 ? 6 : 4; pinBuf = '';
  $$('#pin-len-seg button').forEach(b => b.classList.toggle('on', +b.dataset.pl === pinLen));
  setText($('lock-sub'), `${pinLen} digits to protect your pay data`);
  drawDots();
}
function drawDots() {
  const n = activePinLen();
  let h = '';
  for (let i = 0; i < n; i++) h += `<span class="pin-dot${i < pinBuf.length ? ' f' : ''}"></span>`;
  setHTML($('pin-dots'), h);
}
function startLockCountdown() {
  clearInterval(lockTimer);
  const tick = () => {
    const rem = Math.ceil(getLockRemainingMs() / 1000);
    if (rem > 0 && pinMode === 'unlock' && lockVisible()) {
      setText($('lock-sub'), `Too many tries — wait ${rem}s`);
      setText($('lock-pill-txt'), `Locked (${rem}s)`);
    } else {
      clearInterval(lockTimer); lockTimer = 0;
      if (pinMode === 'unlock' && lockVisible()) { setText($('lock-sub'), 'Enter your PIN to unlock'); setText($('lock-pill-txt'), 'Secured'); }
    }
  };
  tick();
  lockTimer = setInterval(tick, 1000);
}
function lockUI(title, sub, open) {
  setText($('lock-title'), title); setText($('lock-sub'), sub || ''); pinBuf = '';
  const pillMap = { unlock: 'Secured', set1: 'Step 1 of 2', set2: 'Step 2 of 2', 'verify-change': 'Verify PIN', 'verify-remove': 'Confirm removal', 'verify-screenshots': 'Verify screen lock' };
  setText($('lock-pill-txt'), pillMap[pinMode] || 'Secured');
  if ($('pin-len-seg')) {
    $('pin-len-seg').classList.toggle('hidden', pinMode !== 'set1');
    $$('#pin-len-seg button').forEach(b => b.classList.toggle('on', +b.dataset.pl === pinLen));
  }
  drawDots();
  $('lock-forgot').classList.toggle('hidden', pinMode !== 'unlock'); $('lock-cancel').classList.toggle('hidden', pinMode === 'unlock');
  const fp = pinMode === 'unlock' && hasFp();
  $('pin-fp').style.visibility = fp ? 'visible' : 'hidden';
  if ($('lock-fp-pill')) $('lock-fp-pill').classList.toggle('hidden', !fp);
  if (open) { if (pinMode === 'unlock') root.classList.add('locked'); else root.classList.add('pin-open'); }
  const rem = getLockRemainingMs();
  if (pinMode === 'unlock' && rem > 0) startLockCountdown();
  if (fp && open && rem <= 0) setTimeout(tryFingerprint, 280);
}
function lockNow(sub) { pinMode = 'unlock'; lockUI('Welcome back', sub || 'Enter your PIN to unlock', true); }
function unlockDone() {
  clearInterval(lockTimer); lockTimer = 0; pinBusy = false;
  root.classList.remove('locked', 'pin-open', 'veil');
  if (window.AndroidBridge) try { AndroidBridge.fpCancel(); } catch (e) {}
  fpPurpose = '';
  const q = pendingUnlockQueue.splice(0, pendingUnlockQueue.length);
  q.forEach((fn, idx) => setTimeout(fn, 160 + idx * 120));
}
const fails = () => +localStorage.getItem('sp_pin_fails') || 0;
async function pinKey(k) {
  if (pinBusy) return;
  if (pinMode === 'unlock' && getLockRemainingMs() > 0) { startLockCountdown(); return; }
  const targetLen = activePinLen();
  if (k === '⌫') pinBuf = pinBuf.slice(0, -1); else if (pinBuf.length < targetLen) pinBuf += k;
  drawDots(); if (pinBuf.length < targetLen) return;
  const cfg = lockCfg(), p = pinBuf;
  if (pinMode === 'set1') { pinTmp = p; pinMode = 'set2'; return setTimeout(() => lockUI('Confirm PIN', `Re-enter your ${pinLen}-digit PIN`), 140); }
  if (pinMode === 'set2') {
    if (p !== pinTmp) { pinMode = 'set1'; return failPin('PINs did not match — try again', 'Create PIN'); }
    pinBusy = true;
    try {
      const salt = randomSalt(), old = cfg || {};
      localStorage.setItem(LOCK_KEY, JSON.stringify({ v: 2, salt, hash: await hashPinV2(p, salt), len: pinLen, auto: old.auto ?? 30, fp: old.fp }));
      if (!old.hash) { settings.allowScreenshots = false; persistSettings(); }
      unlockDone(); renderSecurity(); toast(`${pinLen}-digit PIN lock enabled`);
    } finally { pinBusy = false; }
    return;
  }
  if (!cfg) { unlockDone(); return; }
  pinBusy = true;
  let ok = false;
  try { ok = await verifyPinAgainst(p, cfg); } finally { pinBusy = false; }
  if (!ok) {
    const n = fails() + 1; localStorage.setItem('sp_pin_fails', n);
    if (n >= 5) { setLockoutMs(30000 * Math.min(8, n - 4)); failPin('Too many tries — locked briefly'); setTimeout(startLockCountdown, 380); return; }
    return failPin(`Wrong PIN (${5 - n} attempt${5 - n === 1 ? '' : 's'} left)`);
  }
  clearLockoutState();
  if (pinMode === 'unlock') unlockDone();
  else if (pinMode === 'verify-change') { pinLen = (cfg && cfg.len === 6) ? 6 : 4; pinMode = 'set1'; lockUI('Create new PIN', `${pinLen} digits to protect your pay data`); }
  else if (pinMode === 'verify-remove') { localStorage.removeItem(LOCK_KEY); settings.allowScreenshots = false; persistSettings(); unlockDone(); renderSecurity(); toast('PIN lock removed'); }
  else if (pinMode === 'verify-screenshots') { unlockDone(); finishPendingScreenLockAuth(true); }
}
function failPin(msg, retitle) { const d = $('pin-dots'); d.classList.remove('shake'); requestAnimationFrame(() => d.classList.add('shake')); if (navigator.vibrate) navigator.vibrate(60); setTimeout(() => lockUI(retitle || $('lock-title').textContent, msg), 340); }
function lockSetupFlow() {
  if (!(window.crypto && crypto.subtle)) toast('Tip: Use HTTPS or the Android app for hardware-grade PBKDF2 PIN hashing');
  const c = lockCfg(); if (c) { pinMode = 'verify-change'; lockUI('Enter current PIN', 'Verify before changing', true); } else { pinLen = 4; pinMode = 'set1'; lockUI('Create PIN', '4 digits to protect your pay data', true); }
}
function lockRemoveFlow() { pinMode = 'verify-remove'; lockUI('Enter PIN to remove', 'Verify your current PIN', true); }
function lockCancel() { clearInterval(lockTimer); lockTimer = 0; _pendingSlAuth = null; if (window.AndroidBridge) try { AndroidBridge.fpCancel(); } catch (e) {} root.classList.remove('pin-open'); }
document.addEventListener('keydown', e => {
  if (!lockVisible()) return;
  if (/^[0-9]$/.test(e.key)) { e.preventDefault(); pinKey(e.key); }
  else if (e.key === 'Backspace') { e.preventDefault(); pinKey('⌫'); }
  else if (e.key === 'Escape' && pinMode !== 'unlock') { e.preventDefault(); lockCancel(); }
});
function lockSetAuto(v) { const c = lockCfg(); if (c) { c.auto = +v; localStorage.setItem(LOCK_KEY, JSON.stringify(c)); } }
async function lockForgot() {
  if (!await askConfirm({ title: 'Reset PIN?', body: 'Resetting the PIN <b>erases all shifts and settings</b> on this device — your PIN is what guards your data. You can restore from a backup afterwards.', ok: 'Erase & reset' })) return;
  [SHIFTS_KEY, SETTINGS_KEY, GIGS_KEY, EXP_KEY, DEBTS_KEY, LOCK_KEY, 'sp_lock_until', 'sp_lock_mono', 'sp_pin_fails', TOUR_KEY].forEach(k => localStorage.removeItem(k)); location.reload();
}
let _pendingSlAuth = null;
function tryFingerprint() { if (!window.AndroidBridge || !lockVisible()) return; fpPurpose = 'unlock'; setText($('lock-sub'), 'Touch the fingerprint sensor'); AndroidBridge.fpAuth(); }
window.onFingerprint = function (ok) {
  if (fpPurpose === 'screenshots') {
    if (ok === null) { setText($('sl-fp-msg'), 'Not recognized — try again'); return; }
    fpPurpose = '';
    if (ok) { closeSheet('screenlock-sheet'); finishPendingScreenLockAuth(true); }
    else { setText($('sl-fp-msg'), 'Use device screen lock or app PIN below'); }
    return;
  }
  if (ok === null) { setText($('lock-sub'), 'Not recognized — try again'); return; }
  if (!ok) { if (lockVisible()) setText($('lock-sub'), 'Use your PIN'); fpPurpose = ''; return; }
  if (fpPurpose === 'enable') { const c = lockCfg(); c.fp = true; localStorage.setItem(LOCK_KEY, JSON.stringify(c)); renderSecurity(); toast('Fingerprint unlock enabled'); }
  else if (fpPurpose === 'unlock') { clearLockoutState(); unlockDone(); }
  fpPurpose = '';
};
window.onDeviceAuth = function (ok) {
  if (!_pendingSlAuth) return;
  if (ok) { closeSheet('screenlock-sheet'); finishPendingScreenLockAuth(true); }
  else { toast('Screen lock verification cancelled'); }
};
function finishPendingScreenLockAuth(ok) {
  const act = _pendingSlAuth; _pendingSlAuth = null;
  if (!ok || !act) return;
  if (act.kind === 'screenshots') {
    settings.allowScreenshots = !!act.nextVal;
    persistSettings();
    renderSecurity();
    toast(settings.allowScreenshots ? 'Screenshots allowed' : 'Screenshots blocked');
  }
}
function cancelScreenLockAuth() {
  _pendingSlAuth = null;
  if (fpPurpose === 'screenshots') { fpPurpose = ''; if (window.AndroidBridge) try { AndroidBridge.fpCancel(); } catch (e) {} }
  closeSheet('screenlock-sheet');
}
function triggerDeviceScreenLock() {
  if (fpPurpose === 'screenshots') { fpPurpose = ''; if (window.AndroidBridge) try { AndroidBridge.fpCancel(); } catch (e) {} }
  if (window.AndroidBridge && typeof AndroidBridge.requestDeviceAuth === 'function') {
    const started = AndroidBridge.requestDeviceAuth('Verify screen lock', 'Confirm your screen lock to change screenshot protection');
    if (started) return;
  }
  triggerAppPinForAuth();
}
function triggerAppPinForAuth() {
  if (fpPurpose === 'screenshots') { fpPurpose = ''; if (window.AndroidBridge) try { AndroidBridge.fpCancel(); } catch (e) {} }
  closeSheet('screenlock-sheet');
  pinMode = 'verify-screenshots';
  lockUI('Verify screen lock', 'Enter your SweldoPulse PIN to continue', true);
}
function onScreenshotToggleClick(ev) {
  if (ev && ev.preventDefault) ev.preventDefault();
  if (!lockCfg()) return false;
  const nextVal = !settings.allowScreenshots;
  _pendingSlAuth = { kind: 'screenshots', nextVal };
  let fpOk = false, devOk = false;
  try { fpOk = !!(window.AndroidBridge && AndroidBridge.fpAvailable()); } catch (e) {}
  try { devOk = !!(window.AndroidBridge && typeof AndroidBridge.deviceAuthAvailable === 'function' && AndroidBridge.deviceAuthAvailable()); } catch (e) {}
  if (!fpOk && !devOk) {
    triggerAppPinForAuth();
    return false;
  }
  setText($('sl-title'), nextVal ? 'Allow screenshots?' : 'Block screenshots?');
  setText($('sl-desc'), 'Verify with your screen lock to apply this change');
  $('sl-fp-box').classList.toggle('hidden', !fpOk);
  $('sl-dev-btn').classList.toggle('hidden', !devOk);
  if (fpOk) {
    setText($('sl-fp-msg'), 'Touch the fingerprint sensor');
    fpPurpose = 'screenshots';
    try { AndroidBridge.fpAuth(); } catch (e) {}
  }
  openSheet('screenlock-sheet');
  return false;
}
function toggleFingerprint() { const c = lockCfg(); if (!c) return; if (c.fp) { c.fp = false; localStorage.setItem(LOCK_KEY, JSON.stringify(c)); renderSecurity(); toast('Fingerprint unlock off'); return; } fpPurpose = 'enable'; toast('Touch the fingerprint sensor to confirm'); AndroidBridge.fpAuth(); }
function renderSecurity() {
  const c = lockCfg();
  $('lock-status').textContent = c ? 'On — locks when you leave the app' : 'Off — anyone with your phone can open the app';
  $('lock-main-btn').textContent = c ? 'Change' : 'Set PIN'; $('lock-remove-btn').classList.toggle('hidden', !c); $('lock-auto-row').classList.toggle('hidden', !c);
  if ($('lock-widget-row')) $('lock-widget-row').classList.toggle('hidden', !c);
  if ($('lock-widget-mask')) $('lock-widget-mask').checked = settings.maskWidgetWhenLocked !== false;
  if ($('lock-ss-row')) $('lock-ss-row').classList.toggle('hidden', !c);
  if ($('lock-ss-toggle')) $('lock-ss-toggle').checked = !!settings.allowScreenshots;
  if ($('lock-ss-sub')) setText($('lock-ss-sub'), settings.allowScreenshots ? 'Allowed · screen lock required to change' : 'Blocked while PIN lock is on · screen lock required');
  if (c) $('lock-auto').value = String(c.auto ?? 30);
  let fpOk = false; try { fpOk = !!(window.AndroidBridge && AndroidBridge.fpAvailable()); } catch (e) {}
  $('lock-fp-row').classList.toggle('hidden', !(c && fpOk)); if (c) { $('lock-fp-status').textContent = c.fp ? 'On — scan to unlock' : 'Off'; $('lock-fp-btn').textContent = c.fp ? 'Turn off' : 'Enable'; }
  if (window.AndroidBridge) {
    try { AndroidBridge.setSecure(!!c && !settings.allowScreenshots); } catch (e) {}
    try { if (typeof AndroidBridge.setWidgetPinLocked === 'function') AndroidBridge.setWidgetPinLocked(!!(c && settings.maskWidgetWhenLocked !== false)); } catch (e) {}
  }
  syncBackupStatus();
}
function toggleWidgetLockMask() {
  settings.maskWidgetWhenLocked = $('lock-widget-mask') ? $('lock-widget-mask').checked : true;
  persistSettings();
  renderSecurity();
  syncWidget();
  toast(settings.maskWidgetWhenLocked ? 'Home widgets masked while PIN is on' : 'Home widgets unmasked');
}
document.addEventListener('visibilitychange', () => {
  const c = lockCfg(); if (!c) return;
  if (document.hidden) { hiddenAt = Date.now(); root.classList.add('veil'); }
  else { if (hiddenAt && Date.now() - hiddenAt >= (c.auto ?? 30) * 1000 && !lockVisible()) lockNow('Welcome back'); root.classList.remove('veil'); }
});

/* ================= splash + tour ================= */
let splashDone = false, tourIdx = 0, tourBusy = false;
function dismissSplash() { const el = $('sp-splash'); if (!el || splashDone) return; splashDone = true; try { sessionStorage.setItem('sp_splash_seen', '1'); } catch (e) {} el.classList.add('out'); setTimeout(() => { el.remove(); afterSplash(); }, 380); }
function afterSplash() { let first = false; try { first = !localStorage.getItem(TOUR_KEY) && !shifts.length; } catch (e) {} if (first && !lockVisible()) startTour(true); }
function initBrand() {
  const sp = $('sp-splash'); let seen = false; try { seen = sessionStorage.getItem('sp_splash_seen') === '1'; } catch (e) {}
  if (root.classList.contains('locked') || seen) { sp.remove(); splashDone = true; setTimeout(afterSplash, 300); return; }
  setTimeout(dismissSplash, matchMedia('(prefers-reduced-motion: reduce)').matches ? 500 : 1300);
}
const RELEASE_NOTES = {
  version: '2.8.0',
  sub: 'Live Shift Timer, Midnight Holiday Split, PH 2027 Wages, Multi-Job, Cashflow Timeline & PDF Statements',
  items: [
    ['Shift Timer', 'ok', 'Clock in right from Home with persistent break tracking, live peso earnings ticker, and 1-tap Clock Out to pre-fill your shift log.'],
    ['PH 2027 & Math', 'ok', 'Added NCR Jan 20, 2027 Tranche 2 wage presets (₱780/₱743), optional Midnight Holiday Split for graveyard shifts, exact 11–25/26–10 statutory aggregation, and 1-tap rule recalculation.'],
    ['Tools & Jobs', '', 'Added Multi-Job Workplace Profiles, Saved Weekly Roster Templates in Bulk Week, Pending Side-Gig payout dates, and a 30-day Payday Cashflow Timeline in Budget.'],
    ['PDF & Widgets', '', 'Added native Print / Save as PDF bank statements on Payslip & Insights, Tinted card finish support on all 3 Android widgets, tablet landscape support, and keyboard accessibility.']
  ]
};

const isDesktopLayout = () => window.innerWidth >= 1024;
const TOUR = [
  { view: 'home', t: 'Welcome to SweldoPulse 2.8.0', b: 'Track live shifts, graveyard holiday splits, multiple workplaces, side gigs, cashflow, and PDF payslips on phone or PC. Here is a quick tour.' },
  { view: 'settings', sel: '#set-payroll-card', t: '1 · Work profile & PH wage rules', b: 'Pick your work situation (Working Student, Full-Time, BPO, Weekly, or Freelance), choose your 2026 DOLE regional wage or custom rate, and tune Pre-Holiday 1.3×, Night Diff, and OT rules.' },
  { view: 'home', sel: () => isDesktopLayout() ? '#sb-add-btn' : '.fab', t: '2 · Log shifts, side gigs & overlap guard', b: 'Tap + to log hourly shifts or timed side gigs. Overlapping hours are caught automatically so duplicate duties never inflate your pay.' },
  { view: 'home', sel: '#hero', t: '3 · Sibling Payroll & Side Gigs accounts', b: 'Switch between Payroll and Side Gigs via the top account tabs or swipe (side-by-side on PC/tablet). Drag or hover over either sparkline to inspect daily running earnings.' },
  { view: 'shifts', sel: '#cal-toggle', t: '4 · Calendar & Smart Importer', b: 'Toggle the monthly calendar to inspect shifts by day, or tap the menu (⋯) to bulk-log a week or paste crew schedules with automatic holiday & pre-holiday detection.' },
  { view: 'budget', sel: '#bud-tabs', t: '5 · Budget, Dues & Vaults', b: 'Track Needs/Wants spending, recurring bills, PayLater/Utang (with partial payments), and Savings Vaults — powered by your combined Payroll + Side Gigs earnings.' },
  { view: 'deductions', sel: '#recon-card', t: '6 · Payslip & Actual Pay Check', b: 'Compare your employer payout against SweldoPulse estimates. Entering Actual Pay automatically locks the cutoff snapshot so future rate edits never alter past slips.' },
  { view: 'settings', sel: '#lock-main-btn', t: '7 · Security, Backups & Real-Time Updates', b: 'Enable PIN/Fingerprint lock with a screen-lock-gated Screenshots toggle, export encrypted .spbackup files, and stay automatically notified of new updates.' },
  { final: true, view: 'home', t: "You're ready to go", b: 'Replay this tour or check release notes anytime from Settings or the sidebar.' }
];
const sleep = ms => new Promise(r => setTimeout(r, ms));
function startTour() { tourIdx = 0; $('tour').classList.add('on'); showTour(0); }
function tourStep(d) { if (tourBusy) return; const n = tourIdx + d; if (n >= TOUR.length) return endTour(); if (n >= 0) showTour(n); }
function endTour() { try { localStorage.setItem(TOUR_KEY, APP_VERSION); } catch (e) {} $('tour').classList.remove('on'); $('tour-card').style.opacity = 0; go('home'); }
async function showTour(i) {
  tourBusy = true; tourIdx = i; const s = TOUR[i], card = $('tour-card'), spot = $('tour-spot'); card.style.opacity = 0;
  if (s.view) { go(s.view); await sleep(isLiteActive() ? 120 : 280); }
  const q = typeof s.sel === 'function' ? s.sel() : s.sel;
  const el = q ? document.querySelector(q) : null; let r = null;
  spot.style.opacity = 0; await sleep(70);
  if (el) { el.scrollIntoView({ block: 'center', behavior: 'auto' }); await sleep(60); r = el.getBoundingClientRect(); if (r.width > 0 && r.height > 0) { const pad = 6; Object.assign(spot.style, { left: Math.max(4, r.left - pad) + 'px', top: Math.max(4, r.top - pad) + 'px', width: Math.min(innerWidth - 8, r.width + pad * 2) + 'px', height: r.height + pad * 2 + 'px' }); } else { r = null; } }
  if (!r) Object.assign(spot.style, { left: innerWidth / 2 + 'px', top: innerHeight / 2 + 'px', width: '0px', height: '0px' });
  $('tour-title').textContent = s.t; $('tour-body').textContent = s.b;
  $('tour-dots').innerHTML = TOUR.map((_, k) => `<span class="tour-dot${k === i ? ' on' : ''}"></span>`).join('');
  const last = i === TOUR.length - 1; $('tour-next').textContent = i === 0 ? 'Start tour' : (last ? 'Done' : 'Next'); $('tour-back').style.display = i === 0 ? 'none' : ''; $('tour-skip').style.display = last ? 'none' : '';
  const h = card.offsetHeight, w = card.offsetWidth; let top;
  if (r) { top = r.bottom + 18; if (top + h > innerHeight - 16) top = r.top - 18 - h; top = Math.max(16, Math.min(top, innerHeight - h - 16)); } else top = (innerHeight - h) / 2;
  const left = r ? Math.max(16, Math.min(innerWidth - w - 16, r.left + r.width / 2 - w / 2)) : Math.max(16, (innerWidth - w) / 2);
  card.style.left = left + 'px'; card.style.top = top + 'px'; card.style.opacity = 1; spot.style.opacity = 1; tourBusy = false;
}

/* ================= Live Shift Timer (Clock-In / Break / Clock-Out) ================= */
let _timerInt = 0;
function fmtHMS(sec) {
  const s = Math.max(0, Math.floor(sec));
  return `${p2(Math.floor(s / 3600))}:${p2(Math.floor((s % 3600) / 60))}:${p2(s % 60)}`;
}
function timerActiveMs(tm, now = Date.now()) {
  if (!tm || !tm.startMs) return 0;
  const liveBrk = tm.breakStartMs ? Math.max(0, now - tm.breakStartMs) : 0;
  return Math.max(0, now - tm.startMs - (+tm.breakMs || 0) - liveBrk);
}
function timerStart() {
  if (settings.activeTimer) return;
  settings.activeTimer = { startMs: Date.now(), breakStartMs: 0, breakMs: 0, rate: settings.hourlyRate };
  persistSettings(); renderTimer(); startTimerTicker();
  toast('Clocked in — live shift timer started');
}
function timerToggleBreak() {
  const tm = settings.activeTimer; if (!tm) return;
  const now = Date.now();
  if (tm.breakStartMs) {
    tm.breakMs = (+tm.breakMs || 0) + Math.max(0, now - tm.breakStartMs);
    tm.breakStartMs = 0;
    toast('Break ended — back on duty');
  } else {
    tm.breakStartMs = now;
    toast('Break started — timer paused');
  }
  persistSettings(); renderTimer();
}
async function timerDiscard() {
  if (!settings.activeTimer) return;
  if (!await askConfirm({ title: 'Discard live timer?', body: 'This stops the running shift timer without logging a shift.', ok: 'Discard' })) return;
  settings.activeTimer = null; persistSettings(); stopTimerTicker(); renderTimer();
  toast('Shift timer cancelled');
}
function timerClockOut() {
  const tm = settings.activeTimer; if (!tm || !tm.startMs) return;
  const now = Date.now();
  const sDate = new Date(tm.startMs), eDate = new Date(now);
  const ds = dstr(sDate);
  const startHHMM = `${p2(sDate.getHours())}:${p2(sDate.getMinutes())}`;
  let endHHMM = `${p2(eDate.getHours())}:${p2(eDate.getMinutes())}`;
  if (endHHMM === startHHMM) {
    const plus1 = new Date(now + 60000);
    endHHMM = `${p2(plus1.getHours())}:${p2(plus1.getMinutes())}`;
  }
  const totalBrkMin = Math.round(((+tm.breakMs || 0) + (tm.breakStartMs ? Math.max(0, now - tm.breakStartMs) : 0)) / 60000);
  const snappedBrk = totalBrkMin >= 45 ? 60 : (totalBrkMin >= 15 ? 30 : 0);
  settings.activeTimer = null; persistSettings(); stopTimerTicker(); renderTimer();
  openShift();
  $('m-date').value = ds;
  ensureTimeOpt($('m-start'), startHHMM);
  ensureTimeOpt($('m-end'), endHHMM);
  if (tm.rate > 0) $('m-rate').value = tm.rate;
  onDateChange(false);
  setShiftStatus('worked');
  setBreak(snappedBrk);
  toast('Clocked out — review details & tap Save shift');
}
function renderTimer() {
  const bar = $('timer-bar'), idle = $('timer-idle'), act = $('timer-active');
  if (!bar || !idle || !act) return;
  const tm = settings.activeTimer;
  bar.classList.toggle('live', !!tm);
  idle.classList.toggle('hidden', !!tm);
  act.classList.toggle('hidden', !tm);
  if (!tm || !tm.startMs) { stopTimerTicker(); return; }
  const now = Date.now(), onBrk = !!tm.breakStartMs;
  const activeMs = timerActiveMs(tm, now);
  const sDate = new Date(tm.startMs), eDate = new Date(now);
  const sStr = `${p2(sDate.getHours())}:${p2(sDate.getMinutes())}`;
  const eStr = `${p2(eDate.getHours())}:${p2(eDate.getMinutes())}`;
  const brkMin = Math.round(((+tm.breakMs || 0) + (onBrk ? Math.max(0, now - tm.breakStartMs) : 0)) / 60000);
  const hol = holidayFor(dstr(sDate)), mult = hol ? hol.mult : 1;
  const nm = settings.midnightHolidaySplit !== false ? nextDayMultFor(dstr(sDate)) : null;
  let est = 0;
  if (activeMs >= 60000 && sStr !== eStr) {
    const res = calcPay({ start: sStr, end: eStr, mult, rate: tm.rate || settings.hourlyRate, brk: brkMin, prior: 0, nextMult: nm });
    est = res ? res.gross : 0;
  } else {
    est = r2((activeMs / 3600000) * (tm.rate || settings.hourlyRate) * mult);
  }
  const dot = $('timer-dot'); if (dot) dot.className = 'timer-dot' + (onBrk ? ' brk' : '');
  setText($('timer-status-lbl'), onBrk ? `On break (${brkMin}m)` : 'On duty');
  setText($('timer-clock'), fmtHMS(activeMs / 1000));
  setText($('timer-earn'), settings.hide ? MASK : peso(est));
  setText($('timer-meta'), `Started ${t12(sStr)}${brkMin > 0 ? ` · ${brkMin}m brk` : ''}`);
  setText($('timer-brk-btn'), onBrk ? 'Resume' : 'Break');
}
function startTimerTicker() {
  if (_timerInt || !settings.activeTimer || document.hidden) return;
  _timerInt = setInterval(() => { if (curView === 'home' && settings.activeTimer) renderTimer(); }, 1000);
}
function stopTimerTicker() { if (_timerInt) { clearInterval(_timerInt); _timerInt = 0; } }

/* ================= Saved Weekly Roster Templates ================= */
function renderBulkTemplates() {
  const box = $('bk-templates'); if (!box) return;
  const list = Array.isArray(settings.rosterTemplates) ? settings.rosterTemplates : [];
  if (!list.length) {
    setHTML(box, '<span class="note" style="font-size:11.5px">Select duty days &amp; tap “+ Save week” to reuse a roster in 1 tap.</span>');
    return;
  }
  setHTML(box, list.map((t, i) =>
    `<button type="button" class="fchip on pin-chip" onclick="applyRosterTemplate(${i})"><span>${esc(t.name)}</span><span class="pin-x" role="button" aria-label="Delete template" onclick="event.stopPropagation();deleteRosterTemplate(${i})">×</span></button>`
  ).join(''));
}
function saveRosterTemplate() {
  const days = [...bulkSel].sort();
  const st = $('bk-start').value, en = $('bk-end').value;
  if (!days.length) return toast('Tap at least one duty day first');
  if (st === en) return toast('Pick valid start and end times');
  const note = $('blk-note').value.trim();
  const idxs = [...new Set(days.map(ds => (pd(ds).getDay() + 6) % 7))].sort();
  const dowLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const dayTag = idxs.map(i => dowLabels[i]).join('/');
  const name = note ? `${note} (${dayTag})` : `${dayTag} · ${shortT(st)}–${shortT(en)}`;
  if (!Array.isArray(settings.rosterTemplates)) settings.rosterTemplates = [];
  settings.rosterTemplates.unshift({ id: nextId(), name: name.slice(0, 40), days: idxs, start: st, end: en, brk: bulkBrk || 0, note });
  if (settings.rosterTemplates.length > 8) settings.rosterTemplates.pop();
  persistSettings(); renderBulkTemplates();
  toast(`Saved template: ${name}`);
}
function applyRosterTemplate(idx) {
  const t = (settings.rosterTemplates || [])[idx]; if (!t || !bulkMon) return;
  bulkSel.clear();
  t.days.forEach(dIdx => bulkSel.add(dstr(addDays(bulkMon, dIdx))));
  ensureTimeOpt($('bk-start'), t.start);
  ensureTimeOpt($('bk-end'), t.end);
  $('blk-note').value = t.note || '';
  setBulkBreak(t.brk || 0);
  renderBulkWeek();
  toast(`Applied template: ${t.name}`);
}
function deleteRosterTemplate(idx) {
  if (!Array.isArray(settings.rosterTemplates)) return;
  settings.rosterTemplates.splice(idx, 1);
  persistSettings(); renderBulkTemplates(); toast('Template removed');
}

/* ================= Multi-Job / Employer Profiles ================= */
function captureJobFields() {
  return {
    hourlyRate: settings.hourlyRate, calabarzonArea: settings.calabarzonArea, schedule: settings.schedule,
    workProfile: settings.workProfile || 'custom', preHolidayRule: settings.preHolidayRule !== false,
    midnightHolidaySplit: settings.midnightHolidaySplit !== false, ndRate: +(settings.ndRate ?? 0.10),
    otThreshold: +(settings.otThreshold ?? 8), autoDeduct: !!settings.autoDeduct,
    deductMode: settings.deductMode || 'first', statMinGross: +(settings.statMinGross ?? 2000), mwe: !!settings.mwe
  };
}
function ensureJobs() {
  if (!Array.isArray(settings.jobs) || !settings.jobs.length) {
    const id = 'job_main';
    settings.jobs = [{ id, name: 'Main job', ...captureJobFields() }];
    settings.activeJobId = id;
  } else if (!settings.jobs.some(j => j.id === settings.activeJobId)) {
    settings.activeJobId = settings.jobs[0].id;
  }
}
function getActiveJob() {
  ensureJobs();
  return settings.jobs.find(j => j.id === settings.activeJobId) || settings.jobs[0];
}
function syncActiveJobFromSettings() {
  if (!Array.isArray(settings.jobs) || !settings.jobs.length) return;
  const j = settings.jobs.find(x => x.id === settings.activeJobId);
  if (j) Object.assign(j, captureJobFields());
}
function syncJobUI() {
  ensureJobs();
  const sel = $('set-job'); if (!sel) return;
  setHTML(sel, settings.jobs.map(j => `<option value="${esc(j.id)}">${esc(j.name)} — ${peso(j.hourlyRate)}/hr</option>`).join(''));
  sel.value = settings.activeJobId;
  if ($('set-job-edit')) $('set-job-edit').classList.remove('hidden');
}
function switchJob(id) {
  ensureJobs();
  const target = settings.jobs.find(j => j.id === id); if (!target) return;
  syncActiveJobFromSettings();
  settings.activeJobId = target.id;
  Object.assign(settings, {
    hourlyRate: target.hourlyRate, calabarzonArea: target.calabarzonArea, schedule: target.schedule,
    workProfile: target.workProfile, preHolidayRule: target.preHolidayRule,
    midnightHolidaySplit: target.midnightHolidaySplit, ndRate: target.ndRate,
    otThreshold: target.otThreshold, autoDeduct: target.autoDeduct,
    deductMode: target.deductMode, statMinGross: target.statMinGross, mwe: target.mwe
  });
  _pm.clear(); selKey = curPeriod().key;
  persistSettings(); syncSettingsUI(); render();
  toast(`Switched workplace: ${target.name} (${peso(target.hourlyRate)}/hr)`);
}
let editingJobId = null;
function openJobSheet(id = null) {
  ensureJobs();
  editingJobId = id;
  const j = id ? settings.jobs.find(x => x.id === id) : null;
  setText($('job-sheet-t'), j ? 'Edit workplace profile' : 'New workplace profile');
  setText($('jb-save'), j ? 'Update workplace' : 'Create workplace');
  $('jb-del').classList.toggle('hidden', !j || settings.jobs.length <= 1);
  $('jb-name').value = j ? j.name : '';
  $('jb-rate').value = j ? j.hourlyRate : settings.hourlyRate;
  openSheet('job-sheet');
  setTimeout(() => $('jb-name').focus(), 160);
}
function saveJobProfile() {
  const name = $('jb-name').value.trim(); if (!name) return toast('Enter a workplace name');
  const rate = r2(Math.max(0, parseFloat($('jb-rate').value) || settings.hourlyRate));
  ensureJobs();
  if (editingJobId) {
    const j = settings.jobs.find(x => x.id === editingJobId);
    if (j) {
      j.name = name; j.hourlyRate = rate;
      if (j.id === settings.activeJobId) settings.hourlyRate = rate;
    }
  } else {
    const id = 'job_' + Date.now();
    const match = Object.keys(PH_WAGE_PRESETS).find(k => Math.abs(PH_WAGE_PRESETS[k].rate - rate) < 0.005);
    const job = { id, name, ...captureJobFields(), hourlyRate: rate, calabarzonArea: match || 'custom' };
    settings.jobs.push(job);
    settings.activeJobId = id;
    settings.hourlyRate = rate;
    settings.calabarzonArea = job.calabarzonArea;
  }
  editingJobId = null; persistSettings(); closeSheet('job-sheet'); syncSettingsUI(); render();
  toast(`Workplace saved: ${name}`);
}
async function deleteJobFromSheet() {
  const id = editingJobId; if (!id || settings.jobs.length <= 1) return;
  const j = settings.jobs.find(x => x.id === id); if (!j) return;
  closeSheet('job-sheet'); editingJobId = null;
  if (!await askConfirm({ title: 'Delete workplace profile?', body: `Remove <b>${esc(j.name)}</b>? Previously logged shifts stay untouched.`, ok: 'Delete' })) return;
  settings.jobs = settings.jobs.filter(x => x.id !== id);
  if (settings.activeJobId === id) switchJob(settings.jobs[0].id);
  else { persistSettings(); syncJobUI(); }
  toast('Workplace removed');
}

/* ================= Payday Cashflow Timeline (Budget) ================= */
function renderCashflow(startCash) {
  const listEl = $('cf-list'), badge = $('cf-badge'), sub = $('cf-sub');
  if (!listEl) return;
  const td = today(), tdNum = dayNum(td), horizon = tdNum + 30;
  const events = [];
  // 1. Pending side-gig payouts (not yet counted in startCash)
  gigs.forEach(g => {
    if (g.status !== 'pending') return;
    const ds = g.dueDate || g.date;
    const dn = dayNum(ds);
    if (dn <= horizon) events.push({ date: ds, dn, label: `${g.stream}${g.title ? ' · ' + g.title : ''}`, kind: 'Pending gig payout', amt: +g.amount });
  });
  // 2. Unpaid recurring bills in current cutoff
  const ck = curPeriod().key, paidBillIds = new Set(expensesIn(ck).filter(e => e.billId).map(e => e.billId));
  const curEndStr = curPeriod().endStr, curEndDn = dayNum(curEndStr);
  (settings.bills || []).forEach(b => {
    if (billDueIn(b, ck) && !paidBillIds.has(b.id)) {
      events.push({ date: curEndStr, dn: curEndDn, label: b.name, kind: 'Recurring bill', amt: -r2(+b.amount || 0) });
    }
  });
  // 3. Active PayLater & Utang dues in next 30d (including overdue)
  debts.forEach(d => {
    if (d.settled || !d.dueDate) return;
    const dn = dayNum(d.dueDate);
    if (dn <= horizon) {
      const a = d.kind === 'paylater' ? d.amount : debtRemaining(d);
      events.push({ date: d.dueDate, dn, label: d.name, kind: d.kind === 'owed' ? 'Receivable' : (d.kind === 'paylater' ? 'PayLater due' : 'Utang due'), amt: d.kind === 'owed' ? +a : -a });
    }
  });
  // 4. Next cutoff projected payroll (only if shifts are already logged in the next cutoff)
  const nextP = periodOf(dstr(addDays(curPeriod().end, 1)));
  const nextD = periodData(nextP.key);
  if (nextD.net > 0) {
    const payDate = dstr(addDays(nextP.end, Math.max(0, +settings.payLag || 0)));
    const dn = dayNum(payDate);
    if (dn <= horizon) events.push({ date: payDate, dn, label: `Next payday (${nextP.badge})`, kind: 'Projected payroll', amt: +nextD.net });
  }
  events.sort((a, b) => a.dn - b.dn || b.amt - a.amt);
  if (!events.length) {
    setText(badge, 'All clear'); badge.className = 'chip ok num';
    setText(sub, `Current pool: ${money(startCash)} · no upcoming bills or dues in 30d`);
    setHTML(listEl, '<p class="note" style="padding:10px 0 2px">Add recurring bills, PayLater dues, or pending side-gig payout dates to project your cash balance ahead of payday.</p>');
    return;
  }
  let bal = r2(startCash), minBal = bal;
  const rowsHtml = events.slice(0, 10).map(ev => {
    bal = r2(bal + ev.amt);
    if (bal < minBal) minBal = bal;
    const dObj = pd(ev.date), over = ev.dn < tdNum;
    const dTxt = over ? 'Overdue' : `${MON[dObj.getMonth()]} ${dObj.getDate()}`;
    const amtTxt = settings.hide ? MASK : `${ev.amt >= 0 ? '+' : '−'}${peso(Math.abs(ev.amt))}`;
    return `<div class="cf-row"><span class="cf-date num" style="${over ? 'color:var(--bad)' : ''}">${dTxt}</span>` +
      `<div class="grow" style="min-width:0"><p style="font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(ev.label)}</p><p class="card-s" style="margin-top:0">${esc(ev.kind)}</p></div>` +
      `<div style="text-align:right"><b class="num ${ev.amt >= 0 ? 'pos-ok' : 'neg'}">${amtTxt}</b><p class="cf-bal num${bal < 0 ? ' short' : ''}">Bal ${money(bal)}</p></div></div>`;
  }).join('');
  setHTML(listEl, rowsHtml);
  setText(sub, `${events.length} upcoming item${events.length === 1 ? '' : 's'} · projected end ${money(bal)}`);
  if (minBal < 0) {
    setText(badge, settings.hide ? 'Shortfall' : `Short ${peso(Math.abs(minBal))}`); badge.className = 'chip bad num';
  } else {
    setText(badge, 'Covered ✓'); badge.className = 'chip ok num';
  }
}

/* ================= Print-Ready PDF Bank Statement Export ================= */
function printStatement(kind) {
  const box = $('print-sheet'); if (!box) return;
  const job = getActiveJob(), genDate = new Date().toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' });
  let docTitle = 'SweldoPulse-Statement';
  if (kind === 'statutory') {
    const D = _insCache || computeYearData(ui.insYear);
    docTitle = `SweldoPulse-Statutory-${D.yr}`;
    const rows = D.months.filter(x => (x.sss + x.ph + x.pi + x.tax + x.gross) > 0);
    const body = rows.length
      ? rows.map(x => `<tr><td>${MONF[x.m]}</td><td>${peso(x.gross)}</td><td>${peso(x.sss)}</td><td>${peso(x.ph)}</td><td>${peso(x.pi)}</td><td>${peso(x.tax)}</td></tr>`).join('')
      : `<tr><td colspan="6" style="text-align:center;color:#64748B">No payroll records logged in ${D.yr}.</td></tr>`;
    box.innerHTML =
      `<div class="pr-hdr"><div><h1>SweldoPulse</h1><p class="pr-sub">Annual Statutory Remittance Ledger · ${D.yr}</p></div>` +
      `<div class="pr-meta"><b>${esc(job ? job.name : 'Main Payroll')}</b><br>Generated ${genDate}</div></div>` +
      `<div class="pr-net"><div><div class="pr-sub">YEAR-TO-DATE NET PAYROLL</div><strong>${peso(D.totNet)}</strong></div>` +
      `<div class="pr-meta"><b>13th-Month YTD:</b> ${peso(D.basicYr / 12)}<br><b>Hours:</b> ${fh(D.totHrs)} (${D.totShifts} shifts)</div></div>` +
      `<div class="pr-sec">Monthly Government Contributions</div>` +
      `<table class="pr-tbl"><thead><tr><th>Month</th><th>Gross</th><th>SSS</th><th>PhilHealth</th><th>Pag-IBIG</th><th>Tax</th></tr></thead><tbody>` +
      body +
      `<tr class="pr-tot"><td>Total (${D.yr})</td><td>${peso(D.totGross)}</td><td>${peso(D.st.sss)}</td><td>${peso(D.st.ph)}</td><td>${peso(D.st.pi)}</td><td>${peso(D.st.tax)}</td></tr></tbody></table>` +
      `<div class="pr-foot"><span>SweldoPulse v${APP_VERSION} · Personal earnings &amp; remittance record</span><span>Estimate only — verify with employer payslip</span></div>`;
  } else {
    const P = periodFromKey(selKey), D = periodData(selKey), t = D.t, d = D.d;
    docTitle = `SweldoPulse-Payslip-${P.key}`;
    const shRows = D.list.filter(isShiftActive).sort((a, b) => a.date.localeCompare(b.date)).map(s =>
      `<tr><td>${fmtDay(s.date)}</td><td>${esc(shiftLabel(s))}</td><td>${s.startTime && s.endTime ? `${t12(s.startTime)}–${t12(s.endTime)}` : '—'}</td><td>${fh(s.reg + s.ot)}</td><td>${peso(s.gross)}</td></tr>`
    ).join('');
    box.innerHTML =
      `<div class="pr-hdr"><div><h1>SweldoPulse</h1><p class="pr-sub">Payslip Statement · ${esc(P.badge)}</p></div>` +
      `<div class="pr-meta"><b>${esc(P.label)}</b><br>${esc(job ? job.name : 'Main Payroll')} · ${peso(settings.hourlyRate)}/hr</div></div>` +
      `<div class="pr-net"><div><div class="pr-sub">NET TAKE-HOME PAY</div><strong>${peso(D.net)}</strong></div>` +
      `<div class="pr-meta">${t.n} shift${t.n === 1 ? '' : 's'} · ${fh(t.hrs)}${D.gigPaid > 0 ? `<br>+ ${peso(D.gigPaid)} paid side gigs` : ''}</div></div>` +
      `<div class="pr-grid"><div><span>Gross Earnings</span><b>${peso(D.grossAll)}</b></div><div><span>Total Deductions</span><b>−${peso(d.total)}</b></div><div><span>Hours (Reg / ND / OT)</span><b>${fh(t.reg)} / ${fh(t.ndH)} / ${fh(t.otH)}</b></div></div>` +
      `<div class="pr-sec">Earnings &amp; Deductions</div>` +
      `<table class="pr-tbl"><thead><tr><th>Line Item</th><th>Amount (PHP)</th></tr></thead><tbody>` +
      `<tr><td>Basic regular pay</td><td>${peso(t.basic)}</td></tr>` +
      `<tr><td>Night differential</td><td>+${peso(t.nd)}</td></tr>` +
      `<tr><td>Overtime &amp; holiday premium</td><td>+${peso(t.otp)}</td></tr>` +
      (D.allow > 0 ? `<tr><td>Allowances &amp; add-ons</td><td>+${peso(D.allow)}</td></tr>` : '') +
      `<tr class="pr-tot"><td>Gross earnings</td><td>${peso(D.grossAll)}</td></tr>` +
      `<tr><td>SSS</td><td>−${peso(d.sss)}</td></tr>` +
      `<tr><td>PhilHealth</td><td>−${peso(d.ph)}</td></tr>` +
      `<tr><td>Pag-IBIG</td><td>−${peso(d.pi)}</td></tr>` +
      `<tr><td>Withholding tax</td><td>−${peso(d.tax)}</td></tr>` +
      `<tr><td>Other / cash advance</td><td>−${peso(d.oth)}</td></tr>` +
      `<tr class="pr-tot"><td>Total deductions</td><td>−${peso(d.total)}</td></tr>` +
      (D.actual !== null ? `<tr class="pr-tot"><td>Actual pay received</td><td>${peso(D.actual)}</td></tr>` : '') +
      `</tbody></table>` +
      (shRows ? `<div class="pr-sec">Itemized Shifts</div><table class="pr-tbl"><thead><tr><th>Date</th><th>Station / Label</th><th>Time</th><th>Hours</th><th>Gross</th></tr></thead><tbody>${shRows}</tbody></table>` : '') +
      `<div class="pr-foot"><span>Generated by SweldoPulse v${APP_VERSION} on ${genDate}</span><span>Estimate only — not an official employer payslip</span></div>`;
  }
  if (window.AndroidBridge && typeof AndroidBridge.printPage === 'function') {
    AndroidBridge.printPage(docTitle);
  } else {
    const prevTitle = document.title;
    document.title = docTitle;
    window.print();
    setTimeout(() => { document.title = prevTitle; }, 400);
  }
}

/* ================= boot ================= */
(function () { try { const prev = localStorage.getItem('sp_data_version'); if (prev !== APP_VERSION) { const sh = localStorage.getItem(SHIFTS_KEY), se = localStorage.getItem(SETTINGS_KEY);
  if (sh) { localStorage.setItem('sp_snapshot_' + (prev || 'legacy'), JSON.stringify({ at: Date.now(), shifts: sh, settings: se })); Object.keys(localStorage).filter(k => k.startsWith('sp_snapshot_')).sort((a, b) => JSON.parse(localStorage[b]).at - JSON.parse(localStorage[a]).at).slice(2).forEach(k => localStorage.removeItem(k)); }
  localStorage.setItem('sp_data_version', APP_VERSION); } } catch (e) {} })();

function showWhatsNew(markSeen = true) {
  setText($('wn-ver'), RELEASE_NOTES.version);
  if ($('wn-sub')) setText($('wn-sub'), RELEASE_NOTES.sub);
  if ($('wn-list')) {
    setHTML($('wn-list'), RELEASE_NOTES.items.map(([tag, cls, text]) =>
      `<div class="row" style="align-items:flex-start"><span class="chip${cls ? ' ' + cls : ''}" style="flex:none">${esc(tag)}</span><span class="sub">${esc(text)}</span></div>`
    ).join(''));
  }
  if (markSeen) { try { localStorage.setItem('sp_seen_version', APP_VERSION); } catch (e) {} }
  openSheet('whatsnew-sheet');
}

window.handleAndroidBack = function () {
  if (root.classList.contains('locked')) return false;
  if (root.classList.contains('pin-open')) { lockCancel(); return true; }
  if ($('screenlock-sheet').classList.contains('open')) { cancelScreenLockAuth(); return true; }
  if ($('conflict-sheet').classList.contains('open')) { closeConflictSheet(); return true; }
  if ($('confirm').classList.contains('open')) { confirmAnswer(false); return true; }
  if ($('payslip-modal').classList.contains('on')) { closePayslip(); return true; }
  if ($('tour').classList.contains('on')) { endTour(); return true; }
  const openSheets = $$('.scrim.open');
  if (openSheets.length) {
    const top = openSheets[openSheets.length - 1];
    if (top.id === 'shift-sheet') closeShift(); else closeSheet(top.id);
    return true;
  }
  if (curView !== 'home') { go('home'); return true; }
  return false;
};

// Keyboard accessibility: Escape closes top modal/sheet; Enter/Space activates focused [role="button"] rows
document.addEventListener('keydown', e => {
  if (lockVisible()) return;
  if (e.key === 'Escape') {
    const handled = window.handleAndroidBack && window.handleAndroidBack();
    if (handled) e.preventDefault();
  } else if ((e.key === 'Enter' || e.key === ' ') && e.target && e.target.getAttribute && e.target.getAttribute('role') === 'button' && e.target.tagName !== 'BUTTON' && e.target.tagName !== 'A') {
    e.preventDefault();
    e.target.click();
  }
});
let _resT = 0;
window.addEventListener('resize', () => {
  clearTimeout(_resT);
  _resT = setTimeout(() => { Object.keys(_sparkSigs).forEach(k => delete _sparkSigs[k]); if (curView === 'home') renderHome(); }, 160);
});

function boot() {
  populateTimes(); loadState(); buildFilters(); initSparkScrub(); applyTheme(true);
  syncSettingsUI(); syncNativeReminder(); syncNativeUpdateStatus(); syncBgUpdateAlarm(); go('home'); renderNow(); initBrand();
  if (lockCfg() && !root.classList.contains('locked') && !root.classList.contains('pin-open')) lockNow();
  else if (root.classList.contains('locked')) { pinMode = 'unlock'; lockUI('Enter PIN', 'SweldoPulse is locked'); }

  // Guaranteed post-update What's New: queues cleanly behind PIN unlock so upgraders ALWAYS see it!
  try {
    const seen = localStorage.getItem('sp_seen_version');
    if (seen !== APP_VERSION) {
      if (seen) {
        runOrQueueUnlocked(() => setTimeout(() => showWhatsNew(true), 420));
      } else {
        localStorage.setItem('sp_seen_version', APP_VERSION);
      }
    }
  } catch (e) {}

  // Near real-time update checks: 2s after launch (even behind PIN), on foreground resume, on reconnect, and every 15m while active
  setTimeout(() => { if (navigator.onLine !== false) checkUpdates(false); }, 2000);
  window.addEventListener('online', () => { setTimeout(smartCheckUpdates, 1200); });
  setTimeout(() => { if (shifts.length && hasNativeAutoBk() && settings.autoBackup !== false && Date.now() - (+settings.lastAutoBk || 0) > 864e5) runAutoBackup(false); }, 6500);

  function handleDeepTab(tab) {
    runOrQueueUnlocked(() => {
      if (tab === 'log-shift') openShift();
      else if (tab === 'budget-dues') { go('budget'); setBudTab('dues'); }
      else if (tab === 'log-expense') { go('budget'); setBudTab('expenses'); setTimeout(openExpSheet, 180); }
      else if (tab === 'bulk-week') { go('home'); setTimeout(openBulkSheet, 180); }
      else if (tab === 'install-update') promptInstallUpdate();
      else if (tab === 'settings-update') { go('settings'); setTimeout(() => { checkUpdates(true); const b = $('upd-box'); if (b) b.scrollIntoView({ block: 'center', behavior: 'smooth' }); }, 220); }
      else if (VIEWS[tab]) go(tab);
    });
  }
  window.onShortcutTab = handleDeepTab;
  const hMap = { '#log-shift': 'log-shift', '#deductions': 'deductions', '#payslip': 'deductions', '#insights': 'insights', '#budget-dues': 'budget-dues', '#log-expense': 'log-expense', '#bulk-week': 'bulk-week', '#shifts': 'shifts', '#install-update': 'install-update', '#settings-update': 'settings-update' };
  if (hMap[location.hash]) setTimeout(() => handleDeepTab(hMap[location.hash]), 260);

  // Foreground-only timers (pause when hidden to save battery & RAM on low-end devices)
  let lastCur = curPeriod().key, lastDay = today();
  const tickDay = () => { if (today() === lastDay) return; lastDay = today(); const nk = curPeriod().key; if (nk !== lastCur) { if (selKey === lastCur) selKey = nk; lastCur = nk; } if (curView === 'home') setText($('hdr-sub'), greet()); render(); };
  let fgTimers = [];
  const startFgTimers = () => {
    if (fgTimers.length) return;
    fgTimers = [
      setInterval(checkReminder, 30000),
      setInterval(tickDay, 30000),
      setInterval(smartCheckUpdates, 900000)
    ];
    if (settings.activeTimer) startTimerTicker();
  };
  const stopFgTimers = () => { fgTimers.forEach(clearInterval); fgTimers = []; stopTimerTicker(); };
  startFgTimers();
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { stopFgTimers(); }
    else { tickDay(); startFgTimers(); smartCheckUpdates(); }
  });
}
if ('serviceWorker' in navigator && !window.AndroidBridge) window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
document.addEventListener('click', e => { if (navigator.vibrate && e.target.closest('button,.shift,.fab')) navigator.vibrate(6); }, true);
boot();
