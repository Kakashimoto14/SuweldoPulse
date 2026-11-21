package com.kakashimoto14.sweldopulse;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.widget.RemoteViews;

public class SweldoWidgetProvider extends AppWidgetProvider {
    static final String PREFS = "sweldopulse_widget_prefs";

    @Override
    public void onUpdate(Context ctx, AppWidgetManager mgr, int[] ids) {
        if (ids == null) return;
        for (int i = 0; i < ids.length; i++) {
            updateOne(ctx, mgr, ids[i]);
        }
    }

    public static void saveAndRefresh(Context ctx, String netText, String badgeText, String metaText, String periodText) {
        try {
            SharedPreferences sp = ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
            sp.edit()
                .putString("net", netText == null ? "₱0.00" : netText)
                .putString("badge", badgeText == null ? "Current cutoff" : badgeText)
                .putString("meta", metaText == null ? "0h · 0 shifts" : metaText)
                .putString("period", periodText == null ? "SweldoPulse" : periodText)
                .apply();
            refreshAll(ctx);
        } catch (Throwable t) { }
    }

    public static void refreshAll(Context ctx) {
        try {
            AppWidgetManager mgr = AppWidgetManager.getInstance(ctx);
            if (mgr == null) return;
            ComponentName cn = new ComponentName(ctx, SweldoWidgetProvider.class);
            int[] ids = mgr.getAppWidgetIds(cn);
            if (ids == null || ids.length == 0) return;
            for (int i = 0; i < ids.length; i++) {
                updateOne(ctx, mgr, ids[i]);
            }
        } catch (Throwable t) { }
    }

    static void updateOne(Context ctx, AppWidgetManager mgr, int appWidgetId) {
        try {
            SharedPreferences sp = ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
            String net = sp.getString("net", "₱0.00");
            String badge = sp.getString("badge", "Current cutoff");
            String meta = sp.getString("meta", "Tap to open SweldoPulse");
            String period = sp.getString("period", "SweldoPulse");

            RemoteViews rv = new RemoteViews(ctx.getPackageName(), R.layout.widget_sweldo);
            rv.setTextViewText(R.id.widget_net, net);
            rv.setTextViewText(R.id.widget_badge, badge);
            rv.setTextViewText(R.id.widget_meta, meta);
            rv.setTextViewText(R.id.widget_period, period);

            int flags = PendingIntent.FLAG_UPDATE_CURRENT | 0x04000000;

            Intent openIntent = new Intent(ctx, MainActivity.class);
            openIntent.setAction("com.kakashimoto14.sweldopulse.OPEN_HOME");
            openIntent.addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            PendingIntent openPi = PendingIntent.getActivity(ctx, 10, openIntent, flags);
            rv.setOnClickPendingIntent(R.id.widget_root, openPi);

            Intent addIntent = new Intent(ctx, MainActivity.class);
            addIntent.setAction("com.kakashimoto14.sweldopulse.LOG_SHIFT");
            addIntent.putExtra("open_log_shift", true);
            addIntent.addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            PendingIntent addPi = PendingIntent.getActivity(ctx, 11, addIntent, flags);
            rv.setOnClickPendingIntent(R.id.widget_add_btn, addPi);

            mgr.updateAppWidget(appWidgetId, rv);
        } catch (Throwable t) { }
    }
}
