# SweldoPulse v2.7.2 — Interactive Sparklines, Fintech Statement Exports, Widget Contrast Fix & Budget/Insights Overhaul

## Building & Publishing via GitHub Actions (Recommended)
Repo: `https://github.com/Kakashimoto14/SuweldoPulse`

1. Extract `SweldoPulse_v2_7_2_Source_and_Build_Kit.zip` over your local `SuweldoPulse` repo (your private `signing/sweldopulse.jks` stays untouched).
2. Commit, push, and tag `v2.7.2`:
   ```cmd
   git add -A
   git commit -m "v2.7.2: interactive sparklines, widget contrast & Obsidian sync, statement PNG exports, Budget/Insights fintech overhaul & Lite splash fix"
   git push origin main
   git tag v2.7.2
   git push origin v2.7.2
   ```
3. GitHub Actions (`Build APK`) automatically compiles, signs, and attaches `SweldoPulse-v2.7.2.apk` to your `v2.7.2` GitHub Release.

## What's New in v2.7.2
- **Startup Logo Animation Preserved in Lite Mode:** Exempted `#sp-splash` and its SVG stroke-draw keyframes from `html.lite` so the animated launch emblem always plays cleanly, even on low-RAM devices running Auto Lite Motion Mode.
- **Interactive Trading-Style Sparklines:** Touch-drag or hover across both **Payroll** (`#spark`) and **Side gigs** (`#gig-spark`) charts to scrub day-by-day cumulative totals and daily deltas with a crisp crosshair and privacy-mask-aware floating readout.
- **Monochrome Widget Contrast Fix & Fintech Widget Sync:** Fixed white-on-white button text in Dark/AMOLED Monochrome mode via dynamic `accentFg` contrast colors across all 3 Android widgets, and added `Obsidian` card finish support plus hairline dividers matching the in-app cards.
- **Bank-Statement Payslip & Annual Summary PNG Exports:** Rebuilt `viewPayslip()` and `viewInsightsCard()` to generate clean institutional statements that automatically adapt to Light/Surface and Dark/Obsidian themes.
- **Budget & Insights Hairline Overhaul:** Unified KPI and Budget Snapshot tiles into 1px hairline matrix grids, added hairline bank-statement rows to Cutoff Envelopes and Dues, and refined the Monthly Performance bar chart and Statutory Remittance table.
