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
import java.util.Calendar;

public class ReminderReceiver extends BroadcastReceiver {
    static final String PREFS = "sweldopulse_prefs";
    static final String KEY_ON = "rem_enabled";
    static final String KEY_H = "rem_hour";
    static final String KEY_M = "rem_min";

    static final String KEY_DUE_ON = "due_enabled";
    static final String KEY_DUE_H = "due_hour";
    static final String KEY_DUE_M = "due_min";
    static final String KEY_DUE_TITLE = "due_title";
    static final String KEY_DUE_BODY = "due_body";

    static final String KEY_PLAN_AT = "plan_at";
    static final String KEY_PLAN_TITLE = "plan_title";
    static final String KEY_PLAN_BODY = "plan_body";

    static final int REQ_SHIFT = 1001;
    static final int REQ_DUE = 1002;
    static final int REQ_PLAN = 1003;

    static final int NOTIF_SHIFT = 1001;
    static final int NOTIF_DUE = 1002;
    static final int NOTIF_PLAN = 1003;
    static final int NOTIF_TEST = 1004;

    static final String ACTION_SHIFT = "com.kakashimoto14.sweldopulse.ALARM_SHIFT";
    static final String ACTION_DUE = "com.kakashimoto14.sweldopulse.ALARM_DUE";
    static final String ACTION_PLAN = "com.kakashimoto14.sweldopulse.ALARM_PLAN";

    @Override
    public void onReceive(Context ctx, Intent intent) {
        String action = intent != null ? intent.getAction() : null;
        SharedPreferences sp = ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE);

        if (Intent.ACTION_BOOT_COMPLETED.equals(action)) {
            if (sp.getBoolean(KEY_ON, false)) {
                scheduleDaily(ctx, ACTION_SHIFT, REQ_SHIFT, sp.getInt(KEY_H, 22), sp.getInt(KEY_M, 0));
            }
            if (sp.getBoolean(KEY_DUE_ON, true)) {
                scheduleDaily(ctx, ACTION_DUE, REQ_DUE, sp.getInt(KEY_DUE_H, 9), sp.getInt(KEY_DUE_M, 0));
            }
            long planAt = sp.getLong(KEY_PLAN_AT, 0L);
            if (planAt > System.currentTimeMillis() + 5000L) {
                scheduleExactOnce(ctx, ACTION_PLAN, REQ_PLAN, planAt);
            }
            return;
        }

        if (ACTION_DUE.equals(action)) {
            if (!sp.getBoolean(KEY_DUE_ON, true)) return;
            String title = sp.getString(KEY_DUE_TITLE, "");
            String body = sp.getString(KEY_DUE_BODY, "");
            if (title != null && title.length() > 0 && body != null && body.length() > 0) {
                showRichNotification(ctx, "dues", "PayLater & due alerts", 4, NOTIF_DUE, title, body, "budget-dues", "View dues");
            }
            scheduleDaily(ctx, ACTION_DUE, REQ_DUE, sp.getInt(KEY_DUE_H, 9), sp.getInt(KEY_DUE_M, 0));
            return;
        }

        if (ACTION_PLAN.equals(action)) {
            String title = sp.getString(KEY_PLAN_TITLE, "Upcoming shift soon");
            String body = sp.getString(KEY_PLAN_BODY, "Your planned shift starts in 1 hour.");
            sp.edit().putLong(KEY_PLAN_AT, 0L).apply();
            showRichNotification(ctx, "planned", "Upcoming shift nudges", 4, NOTIF_PLAN, title, body, "shifts", "Open shifts");
            return;
        }

        // Default: daily shift reminder
        if (!sp.getBoolean(KEY_ON, false)) return;
        showRichNotification(ctx, "shifts", "Shift reminders", 3, NOTIF_SHIFT,
            "SweldoPulse \u2014 log your shift",
            "Finished your duty? Tap to log your hours and update your net pay.",
            "log-shift", "Log shift");
        scheduleDaily(ctx, ACTION_SHIFT, REQ_SHIFT, sp.getInt(KEY_H, 22), sp.getInt(KEY_M, 0));
    }

    public static void schedule(Context ctx, boolean enabled, int hour, int min) {
        SharedPreferences sp = ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        sp.edit().putBoolean(KEY_ON, enabled).putInt(KEY_H, hour).putInt(KEY_M, min).apply();
        if (enabled) scheduleDaily(ctx, ACTION_SHIFT, REQ_SHIFT, hour, min);
        else cancelAlarm(ctx, ACTION_SHIFT, REQ_SHIFT);
    }

    public static void scheduleDueAlerts(Context ctx, boolean enabled, int hour, int min, String title, String body) {
        SharedPreferences sp = ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        sp.edit()
            .putBoolean(KEY_DUE_ON, enabled)
            .putInt(KEY_DUE_H, hour)
            .putInt(KEY_DUE_M, min)
            .putString(KEY_DUE_TITLE, title == null ? "" : title)
            .putString(KEY_DUE_BODY, body == null ? "" : body)
            .apply();
        if (enabled && title != null && title.length() > 0) {
            scheduleDaily(ctx, ACTION_DUE, REQ_DUE, hour, min);
        } else {
            cancelAlarm(ctx, ACTION_DUE, REQ_DUE);
        }
    }

    public static void schedulePlannedShift(Context ctx, long triggerAtMs, String title, String body) {
        SharedPreferences sp = ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        if (triggerAtMs <= System.currentTimeMillis() + 5000L) {
            sp.edit().putLong(KEY_PLAN_AT, 0L).apply();
            cancelAlarm(ctx, ACTION_PLAN, REQ_PLAN);
            return;
        }
        sp.edit()
            .putLong(KEY_PLAN_AT, triggerAtMs)
            .putString(KEY_PLAN_TITLE, title == null ? "Upcoming shift soon" : title)
            .putString(KEY_PLAN_BODY, body == null ? "Your planned shift starts in 1 hour." : body)
            .apply();
        scheduleExactOnce(ctx, ACTION_PLAN, REQ_PLAN, triggerAtMs);
    }

    public static void sendTest(Context ctx) {
        showRichNotification(ctx, "dues", "PayLater & due alerts", 4, NOTIF_TEST,
            "SweldoPulse notifications active",
            "Shift reminders, PayLater due alerts, and planned-shift nudges are ready.",
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

            nb.setSmallIcon(R.mipmap.ic_launcher)
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
