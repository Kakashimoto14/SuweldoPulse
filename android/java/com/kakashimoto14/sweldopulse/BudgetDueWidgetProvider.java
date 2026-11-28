package com.kakashimoto14.sweldopulse;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Color;
import android.os.Bundle;
import android.view.View;
import android.widget.RemoteViews;

public class BudgetDueWidgetProvider extends AppWidgetProvider {

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
            ComponentName cn = new ComponentName(ctx, BudgetDueWidgetProvider.class);
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
            boolean pinLocked = sp.getBoolean("pinLocked", false);
            boolean masked = pinLocked || sp.getBoolean("widgetMask", false) || sp.getBoolean("appHide", false);
            String mask = "₱••••••";
            String rem = masked ? mask : sp.getString("remBudget", "₱0.00");
            String dueTitle = pinLocked ? "PIN protected" : sp.getString("dueTitle", "Next due");
            String dueLine = pinLocked ? "Unlock app to view dues" : (masked ? "Tap to view upcoming dues" : sp.getString("dueLine", "No upcoming PayLater or bills"));
            boolean urgent = !pinLocked && sp.getBoolean("dueUrgent", false);
            String theme = sp.getString("theme", "dark");
            String cardStyle = sp.getString("cardStyle", "surface");
            int accentColor = SweldoWidgetProvider.safeColor(sp.getString("accent", "#4F46E5"), 0xFF4F46E5);
            int accentFg = SweldoWidgetProvider.contrastFg(accentColor, sp.getString("accentFg", null));
            int accentTextColor = SweldoWidgetProvider.safeColor(sp.getString("accentText", "#A5B4FC"), 0xFFA5B4FC);

            boolean isTinted = "tinted".equals(cardStyle);
            boolean isObsidian = !isTinted && "obsidian".equals(cardStyle);
            boolean isLight = !isTinted && !isObsidian && "light".equals(theme);
            boolean isAmoled = !isTinted && !isObsidian && "amoled".equals(theme);
            int tintBgColor = SweldoWidgetProvider.safeColor(sp.getString("tintBg", "#171A40"), 0xFF171A40);
            int bgRes = isObsidian ? R.drawable.widget_bg_obsidian : (isLight ? R.drawable.widget_bg_light : (isAmoled ? R.drawable.widget_bg_amoled : R.drawable.widget_bg_dark));
            int stripRes = isTinted ? R.drawable.widget_strip_tinted : (isObsidian ? R.drawable.widget_strip_obsidian : (isLight ? R.drawable.widget_strip_light : (isAmoled ? R.drawable.widget_strip_amoled : R.drawable.widget_strip_dark)));
            int t1 = isLight ? 0xFF0B0F19 : 0xFFFFFFFF;
            int t2 = isTinted ? 0xCCFFFFFF : (isLight ? 0xFF64748B : 0xFF8895AA);
            int warnColor = isTinted ? 0xFFFDA4AF : (isLight ? 0xFFDC2626 : 0xFFF43F5E);
            if (isTinted) {
                accentTextColor = 0xE6FFFFFF;
                accentColor = 0xFFFFFFFF;
                accentFg = tintBgColor;
            } else if (isObsidian && "light".equals(theme)) {
                double lum = (0.299 * Color.red(accentTextColor) + 0.587 * Color.green(accentTextColor) + 0.114 * Color.blue(accentTextColor)) / 255.0;
                if (lum < 0.45) accentTextColor = 0xFFCBD5E1;
                if (accentColor == 0xFF111827) { accentColor = 0xFFF8FAFC; accentFg = 0xFF0B0D12; }
            }

            RemoteViews rv = new RemoteViews(ctx.getPackageName(), R.layout.widget_budget_due);
            if (isTinted) {
                rv.setViewVisibility(R.id.bd_tint_bg, View.VISIBLE);
                rv.setInt(R.id.bd_tint_bg, "setColorFilter", tintBgColor);
                rv.setInt(R.id.bd_root, "setBackgroundColor", 0x00000000);
            } else {
                rv.setViewVisibility(R.id.bd_tint_bg, View.GONE);
                rv.setInt(R.id.bd_root, "setBackgroundResource", bgRes);
            }
            rv.setInt(R.id.bd_due_box, "setBackgroundResource", stripRes);
            rv.setImageViewBitmap(R.id.bd_spend_bg, SweldoWidgetProvider.makeWideButton(accentColor));
            rv.setTextColor(R.id.bd_spend_txt, accentFg);

            rv.setTextColor(R.id.bd_lbl, t2);
            rv.setTextViewText(R.id.bd_rem, rem);
            rv.setTextColor(R.id.bd_rem, t1);
            rv.setTextViewText(R.id.bd_due_title, dueTitle);
            rv.setTextColor(R.id.bd_due_title, urgent ? warnColor : accentTextColor);
            rv.setTextViewText(R.id.bd_due_line, dueLine);
            rv.setTextColor(R.id.bd_due_line, t1);

            int flags = PendingIntent.FLAG_UPDATE_CURRENT | 0x04000000;

            Intent openDues = new Intent(ctx, MainActivity.class);
            openDues.setAction("com.kakashimoto14.sweldopulse.OPEN_DUES");
            openDues.putExtra("open_tab", "budget-dues");
            openDues.addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            rv.setOnClickPendingIntent(R.id.bd_root, PendingIntent.getActivity(ctx, 20, openDues, flags));

            Intent addExp = new Intent(ctx, MainActivity.class);
            addExp.setAction("com.kakashimoto14.sweldopulse.LOG_EXPENSE");
            addExp.putExtra("open_tab", "log-expense");
            addExp.addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            rv.setOnClickPendingIntent(R.id.bd_spend_btn, PendingIntent.getActivity(ctx, 21, addExp, flags));

            mgr.updateAppWidget(appWidgetId, rv);
        } catch (Throwable t) { }
    }
}
