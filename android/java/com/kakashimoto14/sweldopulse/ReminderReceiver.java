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
    static final int REQ_CODE = 1001;
    static final int NOTIF_ID = 1001;

    @Override
    public void onReceive(Context ctx, Intent intent) {
        String action = intent != null ? intent.getAction() : null;
        SharedPreferences sp = ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        boolean on = sp.getBoolean(KEY_ON, false);
        int h = sp.getInt(KEY_H, 22);
        int m = sp.getInt(KEY_M, 0);

        if (Intent.ACTION_BOOT_COMPLETED.equals(action)) {
            if (on) scheduleAlarm(ctx, h, m);
            return;
        }

        if (!on) return;
        showNotification(ctx, "SweldoPulse — log your shift", "Finished your shift? Tap to record your hours.");
        scheduleAlarm(ctx, h, m);
    }

    public static void schedule(Context ctx, boolean enabled, int hour, int min) {
        SharedPreferences sp = ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        sp.edit().putBoolean(KEY_ON, enabled).putInt(KEY_H, hour).putInt(KEY_M, min).apply();
        if (enabled) {
            scheduleAlarm(ctx, hour, min);
        } else {
            cancelAlarm(ctx);
        }
    }

    static PendingIntent alarmIntent(Context ctx) {
        Intent i = new Intent(ctx, ReminderReceiver.class);
        int flags = PendingIntent.FLAG_UPDATE_CURRENT | 0x04000000;
        return PendingIntent.getBroadcast(ctx, REQ_CODE, i, flags);
    }

    static void cancelAlarm(Context ctx) {
        try {
            AlarmManager am = (AlarmManager) ctx.getSystemService(Context.ALARM_SERVICE);
            if (am != null) am.cancel(alarmIntent(ctx));
        } catch (Throwable t) { }
    }

    static void scheduleAlarm(Context ctx, int hour, int min) {
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
            PendingIntent pi = alarmIntent(ctx);
            am.cancel(pi);
            if (Build.VERSION.SDK_INT >= 23) {
                am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, cal.getTimeInMillis(), pi);
            } else {
                am.set(AlarmManager.RTC_WAKEUP, cal.getTimeInMillis(), pi);
            }
        } catch (Throwable t) { }
    }

    static void showNotification(Context ctx, String title, String body) {
        try {
            if (Build.VERSION.SDK_INT >= 33 && ctx.checkSelfPermission("android.permission.POST_NOTIFICATIONS") != PackageManager.PERMISSION_GRANTED) return;
            NotificationManager nm = (NotificationManager) ctx.getSystemService(Context.NOTIFICATION_SERVICE);
            if (nm == null) return;
            Notification.Builder nb = new Notification.Builder(ctx);
            if (Build.VERSION.SDK_INT >= 26) {
                Class<?> cc = Class.forName("android.app.NotificationChannel");
                Object ch = cc.getConstructor(String.class, CharSequence.class, int.class).newInstance("shifts", "Shift reminders", 3);
                nm.getClass().getMethod("createNotificationChannel", cc).invoke(nm, ch);
                nb.getClass().getMethod("setChannelId", String.class).invoke(nb, "shifts");
            }
            Intent launch = new Intent(ctx, MainActivity.class);
            launch.putExtra("open_log_shift", true);
            launch.addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            int flags = PendingIntent.FLAG_UPDATE_CURRENT | 0x04000000;
            PendingIntent pi = PendingIntent.getActivity(ctx, 2, launch, flags);
            nb.setSmallIcon(R.mipmap.ic_launcher)
              .setContentTitle(title)
              .setContentText(body)
              .setContentIntent(pi)
              .setAutoCancel(true);
            nm.notify(NOTIF_ID, nb.build());
        } catch (Throwable t) { }
    }
}
