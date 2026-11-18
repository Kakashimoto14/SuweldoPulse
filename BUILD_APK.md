# SweldoPulse v1.11.0 — build, install, update

## Your files
- `SweldoPulse-v1.11.0.apk` — ready to install (already signed).
- `signing/sweldopulse.jks` — YOUR signing key (password `sweldopulse`). Every future update must be signed with this same file or Android refuses to install it over the old one. Back it up. **Never put it in a public GitHub repo** (`.gitignore` already excludes it).

## Keep your shifts when updating (IMPORTANT)
Your current phone app is the PWABuilder/TWA build (`app.vercel.suweldopulse.twa`). Its data lives in Chrome's storage for your Vercel site, not inside the APK. A different APK cannot read it, so do this in order:
1. Upload this folder's web files (everything except `android/`, `scripts/`, `signing/`, `*.apk`) to your GitHub repo so Vercel redeploys. Your installed TWA app updates itself to v1.11 and **keeps all shifts** (same storage keys; a snapshot is also saved automatically).
2. Open the app > Rates > Backup & Restore > **Export Backup**. Save the file somewhere safe.
3. Install `SweldoPulse-v1.11.0.apk`. It installs as a separate app (new package name), so nothing is overwritten.
4. Open it > Rates > **Restore** > pick the backup file. Done. Then you can remove the old TWA app.
From then on, new APK versions signed with the same key update in place and keep their data.

## Rebuild the APK yourself
Linux/WSL/Ubuntu: `sudo apt install default-jdk-headless aapt apksigner zipalign dalvik-exchange libandroid-23-java` then `./scripts/build_apk.sh`.
Or GitHub: add secrets `KEYSTORE_B64` (`base64 -w0 signing/sweldopulse.jks`) and `KEYSTORE_PASS`, then Actions > Build APK > Run workflow. Tag builds (`v1.11.1`) attach the APK to a GitHub Release, which is what the in-app "Check for Updates" reads.

## Notes
- Fully offline: Tailwind CSS and the Inter font are bundled. Only "Check for Updates" needs internet.
- Fingerprint uses the phone's fingerprint sensor (not face unlock). PIN always works as a fallback.
- When the PIN lock is on, Android hides the app in the recent-apps list and blocks screenshots (payslips save via "Save as Image").
