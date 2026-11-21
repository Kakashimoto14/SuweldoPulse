# SweldoPulse v2.1.0 — build, install, update

## Building & Publishing via GitHub Actions (Recommended)
Repo: `https://github.com/Kakashimoto14/SuweldoPulse`

1. Extract this folder over your local `SuweldoPulse` repo (your private `signing/sweldopulse.jks` stays untouched and excluded by `.gitignore`).
2. Commit, push, and tag `v2.1.0`:
   ```cmd
   git add -A
   git commit -m "v2.1.0: resizable themed widget, upgraded PIN lock, recurring bills, smart roster importer, auto-backup & insights card"
   git push origin main
   git tag v2.1.0
   git push origin v2.1.0
   ```
3. GitHub Actions (`Build APK`) compiles `SweldoPulse-v2.1.0.apk`, signs it using your `KEYSTORE_B64` and `KEYSTORE_PASS` secrets, uploads the artifact, and attaches it to the `v2.1.0` GitHub Release automatically.
4. On your phone (running v1.17.0+), SweldoPulse will detect, download, verify, and install v2.1.0 directly inside the app.

## What's New in v2.1.0
- **Resizable & Theme-Synced Home Widget:** Drag widget edges from compact 2x1 pill up to 4x3 expanded stats card; Light/Dark/AMOLED mode and all 11 accent colors sync instantly when changed in the app.
- **Upgraded Glass PIN Lock Screen:** Theme-aware backdrop & glow, 4-digit or 6-digit PIN choice, step badges, live lockout countdown timer, biometric quick-pill, and keyboard support.
- **Recurring Bills & Payday Checklist:** Save repeating cutoff bills (1st, 2nd, or Every cutoff) inside Budget -> Expenses and mark them paid in 1 tap.
- **Smart Messenger Roster Importer with Live Preview:** Parses shorthand schedules (`3-9`, `6p-12mn`, `M/W/F`, multi-line date headers) with checkable preview rows before importing.
- **Silent Auto-Backup (`Documents/SweldoPulse`):** Daily zero-permission rolling backup on Android 10–15 plus 1-tap Restore Auto-Backup in Settings.
- **Smart Pay Goal Planner, Per-Shift Rate Override & Shareable Insights Card:** Actionable goal progress with shifts-remaining estimate, per-shift rate override, and PNG summary export on Yearly Insights.
