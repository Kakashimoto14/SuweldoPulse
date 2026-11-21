# SweldoPulse v1.16.0 — build, install, update

## Building & Publishing via GitHub Actions (Recommended)
Repo: `https://github.com/Kakashimoto14/SuweldoPulse`

1. Extract this folder over your local `SuweldoPulse` repo (your private `signing/sweldopulse.jks` stays untouched and excluded by `.gitignore`).
2. Commit, push, and tag `v1.16.0`:
   ```cmd
   git add -A
   git commit -m "v1.16.0: reconciliation, per-cutoff adjustments, smart presets, calendar, trend, native back & reminders"
   git push origin main
   git tag v1.16.0
   git push origin v1.16.0
   ```
3. GitHub Actions (`Build APK`) compiles `SweldoPulse-v1.16.0.apk`, signs it using your `KEYSTORE_B64` and `KEYSTORE_PASS` secrets, uploads the artifact, and attaches it to the `v1.16.0` GitHub Release automatically.

## Rebuilding Locally (Linux/WSL/Ubuntu)
`sudo apt install default-jdk-headless aapt apksigner zipalign dalvik-exchange libandroid-23-java` then `./scripts/build_apk.sh`.

## Notes
- Fully offline: Inter font and all styles are bundled inside the APK. Only "Check for updates" needs internet.
- Background daily reminders use Android's `AlarmManager` (Doze-safe, survives app close and reboot).
- Hardware back button closes open sheets/modals and returns to Home before minimizing.
- To install over an existing APK without losing data, sign with the exact same `.jks` keystore.
