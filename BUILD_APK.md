# SweldoPulse v1.17.0 — build, install, update

## Building & Publishing via GitHub Actions (Recommended)
Repo: `https://github.com/Kakashimoto14/SuweldoPulse`

1. Extract this folder over your local `SuweldoPulse` repo (your private `signing/sweldopulse.jks` stays untouched and excluded by `.gitignore`).
2. Commit, push, and tag `v1.17.0`:
   ```cmd
   git add -A
   git commit -m "v1.17.0: in-app auto-updater, 4-layer APK verification, native share, MediaStore, status bar sync"
   git push origin main
   git tag v1.17.0
   git push origin v1.17.0
   ```
3. GitHub Actions (`Build APK`) compiles `SweldoPulse-v1.17.0.apk`, signs it using your `KEYSTORE_B64` and `KEYSTORE_PASS` secrets, uploads the artifact, and attaches it to the `v1.17.0` GitHub Release automatically.

## What's New in Native Android (v1.17.0)
- **In-App Auto-Updater:** Downloads GitHub APK releases inside the app with manual redirect following, exact byte-size verification, ZIP header check, and `PackageManager.getPackageArchiveInfo()` pre-validation before launching the Android installer and closing cleanly.
- **AppFileProvider:** Zero-dependency `ContentProvider` serving verified update APKs and real `.json`/`.csv` share files.
- **Android 13+ Notifications:** Declares and requests `POST_NOTIFICATIONS` at runtime so shift reminders and update-ready alerts display reliably on HyperOS / Android 14+.
- **Modern Payslip Saving:** Saves PNG payslips directly to `Pictures/SweldoPulse` via `MediaStore` with no storage permissions needed on Android 10–15.
- **Status Bar Theme Sync:** Matches Android system status & navigation bar colors and icon contrast to Light, Dark, and Black modes.
