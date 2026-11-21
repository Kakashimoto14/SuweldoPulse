# SweldoPulse v2.2.0 — build, install, update

## Building & Publishing via GitHub Actions (Recommended)
Repo: `https://github.com/Kakashimoto14/SuweldoPulse`

1. Extract this folder over your local `SuweldoPulse` repo (your private `signing/sweldopulse.jks` stays untouched and excluded by `.gitignore`).
2. Commit, push, and tag `v2.2.0`:
   ```cmd
   git add -A
   git commit -m "v2.2.0: PayLater/Hulugan & Utang tracker, 3 home widgets + privacy eye, planned-shift check-in & upgraded notifications"
   git push origin main
   git tag v2.2.0
   git push origin v2.2.0
   ```
3. GitHub Actions (`Build APK`) compiles `SweldoPulse-v2.2.0.apk`, signs it using your `KEYSTORE_B64` and `KEYSTORE_PASS` secrets, uploads the artifact, and attaches it to the `v2.2.0` GitHub Release automatically.

## What's New in v2.2.0
- **Utang, PayLater & Hulugan Tracker (Budget -> Dues):** Track SPayLater, SLoan, GLoan, GGives, Atome, Billease, Maya Credit installments (with term progress bars & due countdowns) plus Personal IOUs (I Owe / Owed to Me). 1-tap Pay/Settle advances terms and logs directly to your cutoff expenses.
- **3 Theme-Synced Home Screen Widgets:**
  1. **SweldoPulse Pay Glance:** Now includes a 1-tap `HIDE`/`SHOW` privacy toggle right on your home screen.
  2. **SweldoPulse Budget & Dues:** Shows remaining cutoff cash + next upcoming PayLater/Hulugan/Bill due date + `+ Spend` button.
  3. **SweldoPulse Quick Actions (4x1):** 1-tap dock for `+ Shift`, `Bulk`, `Spend`, and `Dues`.
- **Upgraded Multi-Channel Notifications:** Separate Android notification channels (`Shift reminders`, `PayLater & due alerts`, `Upcoming shift nudges`), rich expandable alerts with action buttons, customizable morning Due-Date digest, 1-hour Pre-Shift nudge, and a **Send test notification** button in Settings.
- **Smart Planned-Shift Check-In:** Compact Home banner after a planned shift ends to confirm **Worked**, **Edit**, or **Off** in 1 tap.
