package com.kakashimoto14.sweldopulse;

import android.app.AlarmManager;
import android.app.Notification;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.os.Build;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.Locale;
import org.json.JSONArray;
import org.json.JSONObject;

public class ReminderReceiver extends BroadcastReceiver {
    static final String PREFS = "sweldopulse_prefs";
    static final String KEY_ON = "rem_enabled";
    static final String KEY_H = "rem_hour";
    static final String KEY_M = "rem_min";

    static final String KEY_DUE_ON = "due_enabled";
    static final String KEY_DUE_H = "due_hour";
    static final String KEY_DUE_M = "due_min";
    static final String KEY_DUE_ITEMS = "due_items_json";
    static final String KEY_DUE_TITLE = "due_title";
    static final String KEY_DUE_BODY = "due_body";

    static final String KEY_PLAN_ON = "plan_enabled";
    static final String KEY_PLAN_ITEMS = "plan_items_json";
    static final String KEY_PLAN_AT = "plan_at";
    static final String KEY_PLAN_TITLE = "plan_title";
    static final String KEY_PLAN_BODY = "plan_body";

    static final String KEY_UPD_ON = "upd_bg_enabled";
    static final String KEY_UPD_REPO = "upd_bg_repo";
    static final String KEY_UPD_CUR = "upd_bg_cur_ver";
    static final String KEY_UPD_NOTIFIED = "upd_bg_notified_ver";

    static final int REQ_SHIFT = 1001;
    static final int REQ_DUE = 1002;
    static final int REQ_PLAN = 1003;
    static final int REQ_UPD = 1004;

    static final int NOTIF_SHIFT = 1001;
    static final int NOTIF_DUE = 1002;
    static final int NOTIF_PLAN = 1003;
    static final int NOTIF_TEST = 1004;
    static final int NOTIF_UPD_AVAIL = 2003;

    static final String ACTION_SHIFT = "com.kakashimoto14.sweldopulse.ALARM_SHIFT";
    static final String ACTION_DUE = "com.kakashimoto14.sweldopulse.ALARM_DUE";
    static final String ACTION_PLAN = "com.kakashimoto14.sweldopulse.ALARM_PLAN";
    static final String ACTION_UPD = "com.kakashimoto14.sweldopulse.ALARM_UPDATE_CHECK";

    static class DueEntry {
        String name;
        String amountText;
        long diffDays;
        String badge;
    }

    @Override
    public void onReceive(Context ctx, Intent intent) {
        String action = intent != null ? intent.getAction() : null;
        SharedPreferences sp = ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE);

        if (Intent.ACTION_BOOT_COMPLETED.equals(action)) {
            if (sp.getBoolean(KEY_ON, false)) {
                scheduleDaily(ctx, ACTION_SHIFT, REQ_SHIFT, sp.getInt(KEY_H, 22), sp.getInt(KEY_M, 0));
            }
            if (sp.getBoolean(KEY_DUE_ON, true) && hasDueItems(sp)) {
                scheduleDaily(ctx, ACTION_DUE, REQ_DUE, sp.getInt(KEY_DUE_H, 9), sp.getInt(KEY_DUE_M, 0));
            }
            if (sp.getBoolean(KEY_PLAN_ON, true)) {
                armNextPlannedShift(ctx, sp);
            }
            if (sp.getBoolean(KEY_UPD_ON, true)) {
                scheduleUpdateAlarm(ctx);
            }
            return;
        }

        if (ACTION_DUE.equals(action)) {
            if (!sp.getBoolean(KEY_DUE_ON, true)) return;
            evaluateAndNotifyDues(ctx, sp);
            if (hasDueItems(sp)) {
                scheduleDaily(ctx, ACTION_DUE, REQ_DUE, sp.getInt(KEY_DUE_H, 9), sp.getInt(KEY_DUE_M, 0));
            }
            return;
        }

        if (ACTION_UPD.equals(action)) {
            if (!sp.getBoolean(KEY_UPD_ON, true)) return;
            scheduleUpdateAlarm(ctx);
            final PendingResult pr = goAsync();
            final Context appCtx = ctx.getApplicationContext();
            new Thread(new Runnable() {
                @Override
                public void run() {
                    try {
                        runBackgroundUpdateCheck(appCtx);
                    } catch (Throwable ignored) {
                    } finally {
                        try { pr.finish(); } catch (Throwable ignored) {}
                    }
                }
            }).start();
            return;
        }

        if (ACTION_PLAN.equals(action)) {
            if (sp.getBoolean(KEY_PLAN_ON, true)) {
                String title = sp.getString(KEY_PLAN_TITLE, "Upcoming shift soon");
                String body = sp.getString(KEY_PLAN_BODY, "Your planned shift starts in 1 hour.");
                showRichNotification(ctx, "planned", "Upcoming shift nudges", 4, NOTIF_PLAN, title, body, "shifts", "Open shifts");
            }
            sp.edit().putLong(KEY_PLAN_AT, 0L).apply();
            if (sp.getBoolean(KEY_PLAN_ON, true)) {
                armNextPlannedShift(ctx, sp);
            }
            return;
        }

        // Default: daily shift reminder
        if (!sp.getBoolean(KEY_ON, false)) return;
        showRichNotification(ctx, "shifts", "Shift reminders", 3, NOTIF_SHIFT,
            "SweldoPulse — log your shift",
            "Finished your duty? Tap to log your hours and update your net pay.",
            "log-shift", "Log shift");
        scheduleDaily(ctx, ACTION_SHIFT, REQ_SHIFT, sp.getInt(KEY_H, 22), sp.getInt(KEY_M, 0));
    }

    static boolean hasDueItems(SharedPreferences sp) {
        String raw = sp.getString(KEY_DUE_ITEMS, "");
        if (raw != null && raw.length() > 2) return true;
        String fallback = sp.getString(KEY_DUE_TITLE, "");
        return fallback != null && fallback.length() > 0;
    }

    static long todayEpochDay() {
        Calendar now = Calendar.getInstance();
        Calendar c = Calendar.getInstance();
        c.clear();
        c.set(now.get(Calendar.YEAR), now.get(Calendar.MONTH), now.get(Calendar.DAY_OF_MONTH), 12, 0, 0);
        return c.getTimeInMillis() / 86400000L;
    }

    static long parseIsoEpochDay(String iso) {
        if (iso == null || iso.length() < 10) return Long.MIN_VALUE;
        try {
            int y = Integer.parseInt(iso.substring(0, 4));
            int m = Integer.parseInt(iso.substring(5, 7));
            int d = Integer.parseInt(iso.substring(8, 10));
            Calendar c = Calendar.getInstance();
            c.clear();
            c.set(y, m - 1, d, 12, 0, 0);
            return c.getTimeInMillis() / 86400000L;
        } catch (Throwable t) {
            return Long.MIN_VALUE;
        }
    }

    static String formatPeso(double amt) {
        return String.format(Locale.US, "₱%,.2f", Math.max(0.0, amt));
    }

    static String dueBadgeFor(long diff) {
        if (diff < 0) return "Overdue " + Math.abs(diff) + "d";
        if (diff == 0) return "Due today";
        if (diff == 1) return "Due tomorrow";
        return "Due in " + diff + "d";
    }

    static void evaluateAndNotifyDues(Context ctx, SharedPreferences sp) {
        String raw = sp.getString(KEY_DUE_ITEMS, "");
        if (raw != null && raw.length() > 2) {
            try {
                JSONArray arr = new JSONArray(raw);
                long td = todayEpochDay();
                List<DueEntry> urgent = new ArrayList<DueEntry>();
                for (int i = 0; i < arr.length(); i++) {
                    JSONObject o = arr.optJSONObject(i);
                    if (o == null) continue;
                    String dueDate = o.optString("dueDate", "");
                    long dueDay = parseIsoEpochDay(dueDate);
                    if (dueDay == Long.MIN_VALUE) continue;
                    long diff = dueDay - td;
                    if (diff <= 3L) {
                        DueEntry e = new DueEntry();
                        e.name = o.optString("name", "Due item");
                        e.amountText = formatPeso(o.optDouble("amount", 0.0));
                        e.diffDays = diff;
                        e.badge = dueBadgeFor(diff);
                        urgent.add(e);
                    }
                }
                if (urgent.isEmpty()) return;
                Collections.sort(urgent, new Comparator<DueEntry>() {
                    @Override
                    public int compare(DueEntry a, DueEntry b) {
                        return a.diffDays < b.diffDays ? -1 : (a.diffDays > b.diffDays ? 1 : 0);
                    }
                });
                DueEntry first = urgent.get(0);
                String title = urgent.size() == 1
                    ? (first.name + " — " + first.badge)
                    : (urgent.size() + " dues need attention");
                StringBuilder sb = new StringBuilder();
                int lim = Math.min(3, urgent.size());
                for (int i = 0; i < lim; i++) {
                    if (i > 0) sb.append(" | ");
                    DueEntry x = urgent.get(i);
                    sb.append(x.name).append(" (").append(x.amountText).append(" · ").append(x.badge).append(")");
                }
                if (urgent.size() > 3) sb.append(" +").append(urgent.size() - 3).append(" more");
                showRichNotification(ctx, "dues", "PayLater & due alerts", 4, NOTIF_DUE, title, sb.toString(), "budget-dues", "View dues");
                return;
            } catch (Throwable ignored) { }
        }
        // Fallback for legacy static values
        String title = sp.getString(KEY_DUE_TITLE, "");
        String body = sp.getString(KEY_DUE_BODY, "");
        if (title != null && title.length() > 0 && body != null && body.length() > 0) {
            showRichNotification(ctx, "dues", "PayLater & due alerts", 4, NOTIF_DUE, title, body, "budget-dues", "View dues");
        }
    }

    static void armNextPlannedShift(Context ctx, SharedPreferences sp) {
        String raw = sp.getString(KEY_PLAN_ITEMS, "");
        long now = System.currentTimeMillis();
        long bestAt = 0L;
        String bestTitle = "";
        String bestBody = "";
        if (raw != null && raw.length() > 2) {
            try {
                JSONArray arr = new JSONArray(raw);
                for (int i = 0; i < arr.length(); i++) {
                    JSONObject o = arr.optJSONObject(i);
                    if (o == null) continue;
                    long at = o.optLong("triggerAtMs", 0L);
                    if (at > now + 5000L && (bestAt == 0L || at < bestAt)) {
                        bestAt = at;
                        bestTitle = o.optString("title", "Upcoming shift soon");
                        bestBody = o.optString("body", "Your planned shift starts in 1 hour.");
                    }
                }
            } catch (Throwable ignored) { }
        }
        if (bestAt > now + 5000L) {
            sp.edit()
                .putLong(KEY_PLAN_AT, bestAt)
                .putString(KEY_PLAN_TITLE, bestTitle)
                .putString(KEY_PLAN_BODY, bestBody)
                .apply();
            scheduleExactOnce(ctx, ACTION_PLAN, REQ_PLAN, bestAt);
        } else {
            long legacyAt = sp.getLong(KEY_PLAN_AT, 0L);
            if (legacyAt > now + 5000L) {
                scheduleExactOnce(ctx, ACTION_PLAN, REQ_PLAN, legacyAt);
            } else {
                sp.edit().putLong(KEY_PLAN_AT, 0L).apply();
                cancelAlarm(ctx, ACTION_PLAN, REQ_PLAN);
            }
        }
    }

    public static void schedule(Context ctx, boolean enabled, int hour, int min) {
        SharedPreferences sp = ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        sp.edit().putBoolean(KEY_ON, enabled).putInt(KEY_H, hour).putInt(KEY_M, min).apply();
        if (enabled) scheduleDaily(ctx, ACTION_SHIFT, REQ_SHIFT, hour, min);
        else cancelAlarm(ctx, ACTION_SHIFT, REQ_SHIFT);
    }

    public static void scheduleDueItems(Context ctx, boolean enabled, int hour, int min, String itemsJson) {
        SharedPreferences sp = ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        String safeJson = (itemsJson == null || itemsJson.length() == 0) ? "[]" : itemsJson;
        sp.edit()
            .putBoolean(KEY_DUE_ON, enabled)
            .putInt(KEY_DUE_H, hour)
            .putInt(KEY_DUE_M, min)
            .putString(KEY_DUE_ITEMS, safeJson)
            .putString(KEY_DUE_TITLE, "")
            .putString(KEY_DUE_BODY, "")
            .apply();
        boolean any = false;
        try { any = new JSONArray(safeJson).length() > 0; } catch (Throwable ignored) { }
        if (enabled && any) {
            scheduleDaily(ctx, ACTION_DUE, REQ_DUE, hour, min);
        } else {
            cancelAlarm(ctx, ACTION_DUE, REQ_DUE);
        }
    }

    public static void scheduleDueAlerts(Context ctx, boolean enabled, int hour, int min, String title, String body) {
        SharedPreferences sp = ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        sp.edit()
            .putBoolean(KEY_DUE_ON, enabled)
            .putInt(KEY_DUE_H, hour)
            .putInt(KEY_DUE_M, min)
            .putString(KEY_DUE_ITEMS, "")
            .putString(KEY_DUE_TITLE, title == null ? "" : title)
            .putString(KEY_DUE_BODY, body == null ? "" : body)
            .apply();
        if (enabled && title != null && title.length() > 0) {
            scheduleDaily(ctx, ACTION_DUE, REQ_DUE, hour, min);
        } else {
            cancelAlarm(ctx, ACTION_DUE, REQ_DUE);
        }
    }

    public static void schedulePlannedList(Context ctx, boolean enabled, String shiftsJson) {
        SharedPreferences sp = ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        String safeJson = (shiftsJson == null || shiftsJson.length() == 0) ? "[]" : shiftsJson;
        sp.edit()
            .putBoolean(KEY_PLAN_ON, enabled)
            .putString(KEY_PLAN_ITEMS, safeJson)
            .putLong(KEY_PLAN_AT, 0L)
            .apply();
        if (enabled) {
            armNextPlannedShift(ctx, sp);
        } else {
            cancelAlarm(ctx, ACTION_PLAN, REQ_PLAN);
        }
    }

    public static void schedulePlannedShift(Context ctx, long triggerAtMs, String title, String body) {
        SharedPreferences sp = ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        if (triggerAtMs <= System.currentTimeMillis() + 5000L) {
            sp.edit().putLong(KEY_PLAN_AT, 0L).putString(KEY_PLAN_ITEMS, "[]").apply();
            cancelAlarm(ctx, ACTION_PLAN, REQ_PLAN);
            return;
        }
        sp.edit()
            .putBoolean(KEY_PLAN_ON, true)
            .putString(KEY_PLAN_ITEMS, "[]")
            .putLong(KEY_PLAN_AT, triggerAtMs)
            .putString(KEY_PLAN_TITLE, title == null ? "Upcoming shift soon" : title)
            .putString(KEY_PLAN_BODY, body == null ? "Your planned shift starts in 1 hour." : body)
            .apply();
        scheduleExactOnce(ctx, ACTION_PLAN, REQ_PLAN, triggerAtMs);
    }

    static int compareSemver(String a, String b) {
        if (a == null) a = "0.0.0";
        if (b == null) b = "0.0.0";
        String ca = a.trim().replaceFirst("^[vV]", "");
        String cb = b.trim().replaceFirst("^[vV]", "");
        String[] xa = ca.split("\\.");
        String[] xb = cb.split("\\.");
        for (int i = 0; i < 3; i++) {
            int na = 0, nb = 0;
            try { if (i < xa.length) na = Integer.parseInt(xa[i].replaceAll("[^0-9].*$", "")); } catch (Throwable ignored) {}
            try { if (i < xb.length) nb = Integer.parseInt(xb[i].replaceAll("[^0-9].*$", "")); } catch (Throwable ignored) {}
            if (na != nb) return na > nb ? 1 : -1;
        }
        return 0;
    }

    static void runBackgroundUpdateCheck(Context ctx) {
        SharedPreferences sp = ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        String repo = sp.getString(KEY_UPD_REPO, "Kakashimoto14/SuweldoPulse");
        String curVer = sp.getString(KEY_UPD_CUR, "2.8.0");
        String lastNotified = sp.getString(KEY_UPD_NOTIFIED, "");
        if (repo == null || !repo.matches("^[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+$")) return;
        HttpURLConnection conn = null;
        BufferedReader br = null;
        try {
            URL u = new URL("https://raw.githubusercontent.com/" + repo + "/HEAD/version.json");
            conn = (HttpURLConnection) u.openConnection();
            conn.setConnectTimeout(8000);
            conn.setReadTimeout(8000);
            conn.setRequestProperty("User-Agent", "SweldoPulse-Android");
            conn.setUseCaches(false);
            if (conn.getResponseCode() != 200) return;
            br = new BufferedReader(new InputStreamReader(conn.getInputStream(), "UTF-8"));
            StringBuilder sb = new StringBuilder();
            String line;
            while ((line = br.readLine()) != null && sb.length() < 16384) {
                sb.append(line);
            }
            JSONObject obj = new JSONObject(sb.toString());
            String remoteVer = obj.optString("version", "").trim();
            if (remoteVer.length() == 0) return;
            if (compareSemver(remoteVer, curVer) <= 0) return;
            if (lastNotified != null && compareSemver(remoteVer, lastNotified) <= 0) return;
            String notes = obj.optString("notes", "A new SweldoPulse release is ready to download.");
            if (notes.length() > 140) notes = notes.substring(0, 137) + "...";
            notifyNewRelease(ctx, remoteVer, notes);
        } catch (Throwable ignored) {
        } finally {
            if (br != null) try { br.close(); } catch (Throwable ignored) {}
            if (conn != null) try { conn.disconnect(); } catch (Throwable ignored) {}
        }
    }

    public static void notifyNewRelease(Context ctx, String version, String body) {
        if (version == null || version.length() == 0) return;
        SharedPreferences sp = ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        String vLabel = version.startsWith("v") || version.startsWith("V") ? version : ("v" + version);
        sp.edit().putString(KEY_UPD_NOTIFIED, version).apply();
        showRichNotification(ctx, "updates", "App updates", 3, NOTIF_UPD_AVAIL,
            "SweldoPulse " + vLabel + " is available",
            (body != null && body.length() > 0) ? body : "Tap to open Settings and install the latest update.",
            "settings-update", "Update now");
    }

    public static void markUpdateNotified(Context ctx, String version) {
        if (version == null || version.length() == 0) return;
        ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit().putString(KEY_UPD_NOTIFIED, version).apply();
    }

    public static void configureUpdateCheck(Context ctx, String repo, String curVer, boolean enabled) {
        SharedPreferences sp = ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        SharedPreferences.Editor ed = sp.edit()
            .putBoolean(KEY_UPD_ON, enabled)
            .putString(KEY_UPD_REPO, (repo != null && repo.length() > 0) ? repo : "Kakashimoto14/SuweldoPulse")
            .putString(KEY_UPD_CUR, (curVer != null && curVer.length() > 0) ? curVer : "2.8.0");
        ed.apply();
        if (enabled) scheduleUpdateAlarm(ctx);
        else cancelAlarm(ctx, ACTION_UPD, REQ_UPD);
    }

    static void scheduleUpdateAlarm(Context ctx) {
        long nextAt = System.currentTimeMillis() + 4L * 3600L * 1000L;
        scheduleExactOnce(ctx, ACTION_UPD, REQ_UPD, nextAt);
    }

    public static void sendTest(Context ctx) {
        showRichNotification(ctx, "dues", "PayLater & due alerts", 4, NOTIF_TEST,
            "SweldoPulse notifications active",
            "Shift reminders, live PayLater due alerts, and auto-chained planned-shift nudges are ready.",
            "budget-dues", "Open app");
    }

    static PendingIntent alarmIntent(Context ctx, String action, int reqCode) {
        Intent i = new Intent(ctx, ReminderReceiver.class);
        i.setAction(action);
        int flags = PendingIntent.FLAG_UPDATE_CURRENT | 0x04000000;
        return PendingIntent.getBroadcast(ctx, reqCode, i, flags);
    }

    static void cancelAlarm(Context ctx, String action, int reqCode) {
        try {
            AlarmManager am = (AlarmManager) ctx.getSystemService(Context.ALARM_SERVICE);
            if (am != null) am.cancel(alarmIntent(ctx, action, reqCode));
        } catch (Throwable t) { }
    }

    static void scheduleDaily(Context ctx, String action, int reqCode, int hour, int min) {
        try {
            AlarmManager am = (AlarmManager) ctx.getSystemService(Context.ALARM_SERVICE);
            if (am == null) return;
            Calendar cal = Calendar.getInstance();
            cal.set(Calendar.HOUR_OF_DAY, Math.max(0, Math.min(23, hour)));
            cal.set(Calendar.MINUTE, Math.max(0, Math.min(59, min)));
            cal.set(Calendar.SECOND, 0);
            cal.set(Calendar.MILLISECOND, 0);
            if (cal.getTimeInMillis() <= System.currentTimeMillis() + 5000L) {
                cal.add(Calendar.DAY_OF_YEAR, 1);
            }
            PendingIntent pi = alarmIntent(ctx, action, reqCode);
            am.cancel(pi);
            if (Build.VERSION.SDK_INT >= 23) {
                am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, cal.getTimeInMillis(), pi);
            } else {
                am.set(AlarmManager.RTC_WAKEUP, cal.getTimeInMillis(), pi);
            }
        } catch (Throwable t) { }
    }

    static void scheduleExactOnce(Context ctx, String action, int reqCode, long triggerAtMs) {
        try {
            AlarmManager am = (AlarmManager) ctx.getSystemService(Context.ALARM_SERVICE);
            if (am == null) return;
            PendingIntent pi = alarmIntent(ctx, action, reqCode);
            am.cancel(pi);
            if (Build.VERSION.SDK_INT >= 23) {
                am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerAtMs, pi);
            } else {
                am.set(AlarmManager.RTC_WAKEUP, triggerAtMs, pi);
            }
        } catch (Throwable t) { }
    }

    static void showRichNotification(Context ctx, String chId, String chName, int importance, int notifId, String title, String body, String targetTab, String actionLabel) {
        try {
            if (Build.VERSION.SDK_INT >= 33 && ctx.checkSelfPermission("android.permission.POST_NOTIFICATIONS") != PackageManager.PERMISSION_GRANTED) return;
            NotificationManager nm = (NotificationManager) ctx.getSystemService(Context.NOTIFICATION_SERVICE);
            if (nm == null) return;
            Notification.Builder nb = new Notification.Builder(ctx);
            if (Build.VERSION.SDK_INT >= 26) {
                Class<?> cc = Class.forName("android.app.NotificationChannel");
                Object ch = cc.getConstructor(String.class, CharSequence.class, int.class).newInstance(chId, chName, importance);
                nm.getClass().getMethod("createNotificationChannel", cc).invoke(nm, ch);
                nb.getClass().getMethod("setChannelId", String.class).invoke(nb, chId);
            }
            Intent launch = new Intent(ctx, MainActivity.class);
            if ("log-shift".equals(targetTab)) {
                launch.putExtra("open_log_shift", true);
            } else if (targetTab != null && targetTab.length() > 0) {
                launch.putExtra("open_tab", targetTab);
            }
            launch.addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            int flags = PendingIntent.FLAG_UPDATE_CURRENT | 0x04000000;
            PendingIntent pi = PendingIntent.getActivity(ctx, notifId + 50, launch, flags);

            nb.setSmallIcon(R.drawable.ic_stat_pulse)
              .setColor(0xFF4F46E5)
              .setContentTitle(title)
              .setContentText(body)
              .setStyle(new Notification.BigTextStyle().bigText(body))
              .setContentIntent(pi)
              .setAutoCancel(true);

            if (actionLabel != null && actionLabel.length() > 0) {
                nb.addAction(0, actionLabel, pi);
            }
            nm.notify(notifId, nb.build());
        } catch (Throwable t) { }
    }
}
