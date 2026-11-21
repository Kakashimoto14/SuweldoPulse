# SweldoPulse v2.4.0 — Phase 1 Hardening, Native Fixes & Logic Accuracy

## Building & Publishing via GitHub Actions (Recommended)
Repo: `https://github.com/Kakashimoto14/SuweldoPulse`

1. Extract this folder over your local `SuweldoPulse` repo (your private `signing/sweldopulse.jks` stays untouched and excluded by `.gitignore`).
2. Commit, push, and tag `v2.4.0`:
   ```cmd
   git add -A
   git commit -m "v2.4.0: Phase 1 security hardening, native file picker, autonomous live notifications, payroll/dues/importer fixes"
   git push origin main
   git tag v2.4.0
   git push origin v2.4.0
   ```
3. GitHub Actions (`Build APK`) compiles `SweldoPulse-v2.4.0.apk`, signs it using your `KEYSTORE_B64` and `KEYSTORE_PASS` secrets, uploads the artifact, and attaches it to the `v2.4.0` GitHub Release automatically.

## What's Fixed & Hardened in v2.4.0 (Phase 1)
- **Security Hardening:**
  - Closed `#log-shift` PIN lock bypass and added a lock-aware pending-action queue (deep links execute smoothly right after unlock).
  - Hardened widget privacy: non-exported `WidgetPrivacyReceiver`, automatic home-widget masking while PIN lock is on (toggleable in Settings -> Security).
  - Upgraded PIN hashing to PBKDF2-SHA256 (100,000 iterations) with automatic seamless upgrade for existing PINs, plus monotonic lockout clock (`SystemClock.elapsedRealtime()`) immune to device clock tampering.
  - Restricted external URLs to `http`/`https`, whitelisted GitHub update download hosts across every redirect hop, verified downloaded APK signing certificate against the installed app, sanitized restored backup settings, and set `android:allowBackup="false"`.
- **Android Native Fixes:**
  - Implemented `WebChromeClient.onShowFileChooser()` + native SAF `pickBackupFile()` so **Backup -> Restore -> Choose file** works inside the APK even after a clean reinstall.
  - Added dedicated monochrome white-on-transparent `ic_stat_pulse` status-bar notification icons across all 5 screen densities.
  - Added automatic cleanup of stale `cache/shares/` export files on startup.
- **Autonomous Background Notifications:**
  - `ReminderReceiver` now computes live due-date countdowns (`Due today`, `Overdue Xd`) directly from stored active dues JSON every morning and auto-chains upcoming 1-hour planned-shift nudges without needing to reopen the app.
- **Payroll, Shift, Dues & Importer Logic Fixes:**
  - Stopped 2nd-cutoff shifts from retroactively mutating 1st-cutoff SSS/PhilHealth brackets.
  - Fixed 2nd-cutoff catch-up when 1st cutoff had ₱0 earnings.
  - Preserved `settled` status when editing settled `I Owe` / `Owed to Me` items (with an explicit Settled toggle).
  - Fixed custom-minute dropdown blanking in Bulk Week (`ensureTimeOpt`).
  - Fixed December -> January year rollover in the Smart Shift Importer.
  - Fixed weekly cross-year boundary loss in Insights (`computeYearData`).
  - Expanded 2027–2028 PH movable holidays and removed dead code.
