# SweldoPulse v2.5.0 — Phase 2 Everyday Workflow, Encrypted Backups & Cutoff Snapshots

## Building & Publishing via GitHub Actions (Recommended)
Repo: `https://github.com/Kakashimoto14/SuweldoPulse`

1. Extract this folder over your local `SuweldoPulse` repo (your private `signing/sweldopulse.jks` stays untouched and excluded by `.gitignore`).
2. Commit, push, and tag `v2.5.0`:
   ```cmd
   git add -A
   git commit -m "v2.5.0: Phase 2 budget switcher, partial utang payments, AES-GCM encrypted backups, smart importer v2 & payslip cutoff lock"
   git push origin main
   git tag v2.5.0
   git push origin v2.5.0
   ```
3. GitHub Actions (`Build APK`) compiles `SweldoPulse-v2.5.0.apk`, signs it using your `KEYSTORE_B64` and `KEYSTORE_PASS` secrets, uploads the artifact, and attaches it to the `v2.5.0` GitHub Release automatically.

## What's New in v2.5.0 (Phase 2)
- **Budget Cutoff Switcher:** Browse and manage expenses, recurring bills, and envelopes across any cutoff right inside Budget without leaving the screen.
- **Partial Utang Payments (`I Owe` & `Owed to Me`):** Record partial payments with quick percentage chips (`25%`, `50%`, `Full`), live remaining-balance progress bars, automatic cutoff expense logging, and full Undo support.
- **AES-256-GCM Encrypted Backups (`.spbackup`):** Optional passphrase-protected backup export & restore using Web Crypto PBKDF2-SHA256 (`150,000` iterations) + AES-256-GCM authenticated encryption, with full native Android SAF file picker compatibility.
- **Smarter Importer v2:** Automatically detects unpaid breaks in pasted text (`1h break`, `30m brk`, `less 1h`), flags guessed dates with a `Date guessed` warning badge, and lets you cycle break duration (`0m` / `30m` / `1h`) per row right in the preview with live gross recalculation.
- **Payslip Cutoff Lock / Snapshot:** Automatically freezes a cutoff's earnings, deductions, and net pay once you reconcile **Actual pay received** (plus manual Lock/Unlock button) so future rate or deduction-rule changes never disturb past payslips.
