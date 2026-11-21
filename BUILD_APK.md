# SweldoPulse v2.3.0 — build, install, update

## Building & Publishing via GitHub Actions (Recommended)
Repo: `https://github.com/Kakashimoto14/SuweldoPulse`

1. Extract this folder over your local `SuweldoPulse` repo (your private `signing/sweldopulse.jks` stays untouched and excluded by `.gitignore`).
2. Commit, push, and tag `v2.3.0`:
   ```cmd
   git add -A
   git commit -m "v2.3.0: exact PH crew deductions, total deductions line, import/edit bug fixes, smart importer template, planned-shift confirm/remove & UI polish"
   git push origin main
   git tag v2.3.0
   git push origin v2.3.0
   ```
3. GitHub Actions (`Build APK`) compiles `SweldoPulse-v2.3.0.apk`, signs it using your `KEYSTORE_B64` and `KEYSTORE_PASS` secrets, uploads the artifact, and attaches it to the `v2.3.0` GitHub Release automatically.

## What's New & Fixed in v2.3.0
- **Exact PH Crew Deduction Engine:** Pag-IBIG now calculates from **Basic Pay** (2% basic, matching real payslips to the centavo), SSS & PhilHealth support **1st cutoff only** (default), **Split across cutoffs**, or **2nd cutoff only**, plus a configurable **Minimum Cutoff Threshold** (`₱2,000` default) that skips/defers SSS & PhilHealth on low-earning cutoffs.
- **Payslip Total Deductions Line:** Added a clear **Total deductions** subtotal row right above Net Take-Home on the Payslip screen, Copy text, and Save Image PNG.
- **Fixed Import/Edit Shift Bug & Time Bugs:** Replaced random IDs with monotonic guaranteed-unique IDs + boot-time duplicate-ID auto-repair; fixed non-30-minute times blanking out when editing; fixed `7-12`/`8-12`/`9-12` resolving to midnight instead of noon.
- **Smarter Shift Importer + Standard Template:** Built-in standard template placeholder, Copy Template & Paste buttons, smart `OFF`/`RD` skipping, next-week auto-anchoring for weekday rosters, and editable station tags in preview.
- **Confirmation-Based Planned Shifts:** Accurate overnight end-time tracking, queue badge (`1 of N`), and **Worked / Edit / Not worked (Remove)** actions that cleanly remove unworked planned shifts (with Undo).
- **Cleaner UI & Organization:** 2x2 Budget Snapshot strip, organized Settings section headers, clearer Payslip basis badges, and fixed home widget HIDE/SHOW toggle when app-level hide was active.
