# SweldoPulse v2.0.0 — build, install, update

## Building & Publishing via GitHub Actions (Recommended)
Repo: `https://github.com/Kakashimoto14/SuweldoPulse`

1. Extract this folder over your local `SuweldoPulse` repo (your private `signing/sweldopulse.jks` stays untouched and excluded by `.gitignore`).
2. Commit, push, and tag `v2.0.0`:
   ```cmd
   git add -A
   git commit -m "v2.0.0: home widget, actionable budget & vaults, side gigs, bulk roster, yearly insights & ledger"
   git push origin main
   git tag v2.0.0
   git push origin v2.0.0
   ```
3. GitHub Actions (`Build APK`) compiles `SweldoPulse-v2.0.0.apk`, signs it using your `KEYSTORE_B64` and `KEYSTORE_PASS` secrets, uploads the artifact, and attaches it to the `v2.0.0` GitHub Release automatically.
4. On your phone (running v1.17.0+), SweldoPulse will detect, download, verify, and install v2.0.0 right inside the app.

## What's New in v2.0.0
- **Native Home Screen Widget & App Icon Shortcuts:** Live Pay Glance widget (`SweldoWidgetProvider`) with 1-tap `+` quick shift logging and long-press icon shortcuts (Log shift, Payslip, Insights).
- **Actionable Budget:** 3-tab Budget hub (`Overview` / `Expenses` / `Vaults`) with cutoff expense tracking against Needs/Wants limits and persistent Savings Vaults.
- **Multi-Stream Income:** Log flat-rate side gigs (Catering, Freelance, Sound System, Affiliate) separately from main hourly payroll without altering statutory deductions, with a 1-tap `Payroll | All income` toggle.
- **Weekly Roster Bulk-Logger & Shift Status:** Select multiple days in a week to log shifts in 1 tap, and track `Worked`, `Scheduled`, and `Cancelled` shifts cleanly.
- **Yearly Insights & Statutory Contributions Ledger:** 12-month bar chart, effective hourly rate boost, top stations, and month-by-month SSS / PhilHealth / Pag-IBIG / Tax contribution ledger.
