# SweldoPulse v2.6.0 — Pre-Holiday 1.30x, Importer Holiday Fix, Overlap Guard, Swipeable Side-Gigs Card & Screenshot Security Toggle

## Building & Publishing via GitHub Actions (Recommended)
Repo: `https://github.com/Kakashimoto14/SuweldoPulse`

1. Extract this folder over your local `SuweldoPulse` repo (your private `signing/sweldopulse.jks` stays untouched and excluded by `.gitignore`).
2. Commit, push, and tag `v2.6.0`:
   ```cmd
   git add -A
   git commit -m "v2.6.0: pre-holiday 1.30x auto-detect, importer holiday fix, overlap conflict sheet, swipeable side-gigs card & screen-lock screenshot toggle"
   git push origin main
   git tag v2.6.0
   git push origin v2.6.0
   ```
3. GitHub Actions (`Build APK`) compiles `SweldoPulse-v2.6.0.apk`, signs it using your `KEYSTORE_B64` and `KEYSTORE_PASS` secrets, uploads the artifact, and attaches it to the `v2.6.0` GitHub Release automatically.

## What's New & Fixed in v2.6.0
- **Holiday & Day-Before-Holiday (`1.30x`) Auto-Detection:**
  - Automatically detects the day before any Regular Holiday (`2.0x`) as `1.30x` (Pre-Holiday duty required to prevent average pay) as well as all Special Non-Working Holidays (`1.30x`).
  - Preserves `2.0x` on consecutive Regular Holidays (e.g., Maundy Thursday before Good Friday).
  - Added a 1-tap **"Fix holiday rates"** banner on Shifts & Payslip if existing logged shifts on holidays or pre-holidays are still set to `1.0x`.
- **Fixed Schedule Importer Holiday Detection:**
  - Flushes pending preview debounce and re-verifies `holidayFor()` live during `importText()` and `saveBulkShifts()`.
  - Expanded date parsing to support compact & ordinal formats (`Nov.30`, `Nov 30th`, `Nov-30`, `30-Nov`, `(11/30)`, `11/30,`, `11-30`).
- **Strict Overlap / Duplicate Guard + Duty & Side Gig Conflict Sheet:**
  - Strictly blocks duplicate or overlapping shift hours across Log Shift, Bulk Week, and Smart Shift Importer (including cross-midnight and intra-batch overlaps).
  - Side Gigs now support optional Start / End times: non-overlapping duty + gig on the same day save smoothly; overlapping hours open the Conflict Action Sheet to edit, replace, or delete conflicting entries.
- **Swipeable Net Pay Carousel (Payroll <-> Side Gigs) + Total Earnings Budgeting:**
  - Swipe left on the Home net-pay card (or tap the `Payroll` / `Side gigs` pills) to switch between Main Payroll Net Pay and a dedicated emerald Side Gigs Earnings card.
  - Home Budget card and Budget view calculate and display **Total Earnings (Payroll Net + Paid Side Gigs)**.
- **Allow Screenshots Toggle (PIN Lock Only, Screen Lock Gated):**
  - Appears in **Settings -> Security** whenever PIN lock is enabled.
  - Requires **Screen Lock verification** (Fingerprint, Android Device Screen Lock via `KeyguardManager`, or App PIN fallback) before allowing or blocking screenshots (`FLAG_SECURE`).
