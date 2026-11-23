# SweldoPulse v2.7.1 — Banking & Trading UI Redesign

## Building & Publishing via GitHub Actions (Recommended)
Repo: `https://github.com/Kakashimoto14/SuweldoPulse`

1. Extract `SweldoPulse_v2_7_1_Source_and_Build_Kit.zip` over your local `SuweldoPulse` repo (your private `signing/sweldopulse.jks` stays untouched).
2. Commit, push, and tag `v2.7.1`:
   ```cmd
   git add -A
   git commit -m "v2.7.1: banking & trading UI redesign, unified Payroll/Side Gigs cards, Surface/Obsidian/Tinted finishes & Monochrome theme"
   git push origin main
   git tag v2.7.1
   git push origin v2.7.1
   ```
3. GitHub Actions (`Build APK`) automatically compiles, signs, and attaches `SweldoPulse-v2.7.1.apk` to your `v2.7.1` GitHub Release.

## What's New in v2.7.1
- **Unified Banking/Trading Sibling Account Cards:** Main Payroll and Side Gigs now share a cohesive institutional design (no hardcoded green card, no loud AI gradients or glowing drop-shadows), complete with trading delta badges (`▲ +%` vs previous cutoff), dual sparklines (`#spark` & `#gig-spark`), hairline 3-column metrics tables, and a mobile Account Switcher showing live balances.
- **Selectable Card Finishes (`Settings → Appearance`):** Choose between **Surface** (MariBank / Trading neutral card), **Obsidian** (GoTyme / Maya matte black metallic card), or **Tinted** (restrained deep matte accent card).
- **Monochrome Black & White Theme:** High-contrast black/white fintech palette with crisp WCAG-safe button foregrounds, cleaner neutral dark charcoal (`#0B0D12`), bank-statement ledger rows, and a flush modern bottom navigation bar.
- **Built on v2.7.0 Core:** Split assets (`index.html` + `app.css` + `app.js`), O(1) pay engine, auto Lite Motion Mode for low-end devices (OPPO CPH2269), responsive desktop sidebar, PH DOLE 2026 wage profiles, real-time update checks with native background notifications, guaranteed post-update What's New, and updated 7-step tour.
