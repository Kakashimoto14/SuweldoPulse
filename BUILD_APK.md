# SweldoPulse v2.7.0 — Production Polish, Low-End Optimization, Desktop Responsive, PH Work Profiles & Real-Time Updates

## Building & Publishing via GitHub Actions (Recommended)
Repo: `https://github.com/Kakashimoto14/SuweldoPulse`

1. Extract this folder over your local `SuweldoPulse` repo (your private `signing/sweldopulse.jks` stays untouched and excluded by `.gitignore`).
2. Commit, push, and tag `v2.7.0`:
   ```cmd
   git add -A
   git commit -m "v2.7.0: modular split, low-end optimization, desktop responsive layout, PH DOLE work profiles, smart real-time updates & updated tour"
   git push origin main
   git tag v2.7.0
   git push origin v2.7.0
   ```
3. GitHub Actions (`Build APK`) bundles `index.html`, `app.css`, and `app.js` into Android assets, compiles `SweldoPulse-v2.7.0.apk`, signs it with your keystore secrets, and publishes it to the `v2.7.0` GitHub Release automatically.

## What's New in v2.7.0
- **Clean Split Architecture:** Separated HTML, unified deduplicated CSS (`app.css`), and modular JavaScript (`app.js`) for fast caching, cleaner maintenance, and zero legacy style overrides.
- **Smooth & Stable on Low-End Android Devices (e.g. OPPO CPH2269):**
  - Replaced minute-by-minute `calcPay()` loops with exact O(1) interval math.
  - Replaced `color-mix()` gradients with precomputed CSS variables compatible with older Android System WebViews.
  - Removed forced layout reflows, idle `will-change` layers, and background timers; added automatic + manual **Lite Motion Mode** and `onTrimMemory()` WebView cache cleanup.
- **True Responsive Layout (Mobile, Tablet & Laptop/PC):**
  - Persistent left sidebar and 2-column desktop workspace (`>= 1024px`) with side-by-side Payroll + Side Gigs cards, centered floating dialogs, and keyboard shortcuts (`Esc`).
- **PH DOLE 2026 Standards & Work Situation Profiles:**
  - Updated 2026 DOLE regional minimum wage presets (NCR, CALABARZON, Central Luzon, Western/Central Visayas, Davao, or Custom with daily rate readout).
  - One-tap **Work Situation Profiles** (Part-Time Crew / Working Student, Full-Time Hourly / Retail, BPO / Night Shift, Daily-Paid / Weekly, Freelance / Side Gigs).
  - Configurable **Pre-Holiday (`1.30x`)** rule (ON by default, toggleable to Standard DOLE), **Night Diff %** (`0% / 10% / 15% / 20%`), **OT threshold** (`8h / 9h / None`), and **`11-25 / 26-10`** semi-monthly cutoff cycle.
- **Smart Real-Time Update Checker & Background Notifications:**
  - Checks on boot (even behind PIN lock), every app resume (3-min throttle), network reconnect, every 15 mins while active, and every 4 hours natively in the background via Android AlarmManager (`ReminderReceiver`).
  - Uses GitHub `ETag` (`If-None-Match`) + `version.json` fast-check so frequent checks stay within rate limits and immediately post a native notification when a new release drops.
- **Guaranteed Post-Update "What's New" & Updated 7-Step Tour:**
  - Queues **What's New** cleanly behind PIN unlock so it is never skipped after installing an update, and updates the spotlight tour for all current features across mobile and desktop.
