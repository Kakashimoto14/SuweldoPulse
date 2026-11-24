package com.kakashimoto14.sweldopulse;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.widget.RemoteViews;

public class QuickActionsWidgetProvider extends AppWidgetProvider {

    @Override
    public void onUpdate(Context ctx, AppWidgetManager mgr, int[] ids) {
        if (ids == null) return;
        for (int i = 0; i < ids.length; i++) {
            updateOne(ctx, mgr, ids[i]);
        }
    }

    @Override
    public void onAppWidgetOptionsChanged(Context ctx, AppWidgetManager mgr, int appWidgetId, Bundle newOptions) {
        super.onAppWidgetOptionsChanged(ctx, mgr, appWidgetId, newOptions);
        updateOne(ctx, mgr, appWidgetId);
    }

    public static void refreshAll(Context ctx) {
        try {
            AppWidgetManager mgr = AppWidgetManager.getInstance(ctx);
            if (mgr == null) return;
            ComponentName cn = new ComponentName(ctx, QuickActionsWidgetProvider.class);
            int[] ids = mgr.getAppWidgetIds(cn);
            if (ids == null || ids.length == 0) return;
            for (int i = 0; i < ids.length; i++) {
                updateOne(ctx, mgr, ids[i]);
            }
        } catch (Throwable t) { }
    }

    static void updateOne(Context ctx, AppWidgetManager mgr, int appWidgetId) {
        try {
            SharedPreferences sp = ctx.getSharedPreferences(SweldoWidgetProvider.PREFS, Context.MODE_PRIVATE);
            String theme = sp.getString("theme", "dark");
            String cardStyle = sp.getString("cardStyle", "surface");
            int accentColor = SweldoWidgetProvider.safeColor(sp.getString("accent", "#4F46E5"), 0xFF4F46E5);
            int accentFg = SweldoWidgetProvider.contrastFg(accentColor, sp.getString("accentFg", null));

            boolean isObsidian = "obsidian".equals(cardStyle);
            boolean isLight = !isObsidian && "light".equals(theme);
            boolean isAmoled = !isObsidian && "amoled".equals(theme);
            int bgRes = isObsidian ? R.drawable.widget_bg_obsidian : (isLight ? R.drawable.widget_bg_light : (isAmoled ? R.drawable.widget_bg_amoled : R.drawable.widget_bg_dark));
            int stripRes = isObsidian ? R.drawable.widget_strip_obsidian : (isLight ? R.drawable.widget_strip_light : (isAmoled ? R.drawable.widget_strip_amoled : R.drawable.widget_strip_dark));
            int t1 = isLight ? 0xFF0B0F19 : 0xFFF5F7FA;
            if (isObsidian && "light".equals(theme) && accentColor == 0xFF111827) {
                accentColor = 0xFFF8FAFC;
                accentFg = 0xFF0B0D12;
            }

            RemoteViews rv = new RemoteViews(ctx.getPackageName(), R.layout.widget_quick_actions);
            rv.setInt(R.id.qa_root, "setBackgroundResource", bgRes);
            rv.setImageViewBitmap(R.id.qa_shift_bg, SweldoWidgetProvider.makeWideButton(accentColor));
            rv.setTextColor(R.id.qa_shift_txt, accentFg);
            rv.setInt(R.id.qa_bulk, "setBackgroundResource", stripRes);
            rv.setInt(R.id.qa_spend, "setBackgroundResource", stripRes);
            rv.setInt(R.id.qa_dues, "setBackgroundResource", stripRes);
            rv.setTextColor(R.id.qa_bulk, t1);
            rv.setTextColor(R.id.qa_spend, t1);
            rv.setTextColor(R.id.qa_dues, t1);

            int flags = PendingIntent.FLAG_UPDATE_CURRENT | 0x04000000;

            Intent i1 = new Intent(ctx, MainActivity.class);
            i1.setAction("com.kakashimoto14.sweldopulse.QA_SHIFT");
            i1.putExtra("open_log_shift", true);
            i1.addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            rv.setOnClickPendingIntent(R.id.qa_shift, PendingIntent.getActivity(ctx, 30, i1, flags));

            Intent i2 = new Intent(ctx, MainActivity.class);
            i2.setAction("com.kakashimoto14.sweldopulse.QA_BULK");
            i2.putExtra("open_tab", "bulk-week");
            i2.addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            rv.setOnClickPendingIntent(R.id.qa_bulk, PendingIntent.getActivity(ctx, 31, i2, flags));

            Intent i3 = new Intent(ctx, MainActivity.class);
            i3.setAction("com.kakashimoto14.sweldopulse.QA_SPEND");
            i3.putExtra("open_tab", "log-expense");
            i3.addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            rv.setOnClickPendingIntent(R.id.qa_spend, PendingIntent.getActivity(ctx, 32, i3, flags));

            Intent i4 = new Intent(ctx, MainActivity.class);
            i4.setAction("com.kakashimoto14.sweldopulse.QA_DUES");
            i4.putExtra("open_tab", "budget-dues");
            i4.addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            rv.setOnClickPendingIntent(R.id.qa_dues, PendingIntent.getActivity(ctx, 33, i4, flags));

            mgr.updateAppWidget(appWidgetId, rv);
        } catch (Throwable t) { }
    }
}
