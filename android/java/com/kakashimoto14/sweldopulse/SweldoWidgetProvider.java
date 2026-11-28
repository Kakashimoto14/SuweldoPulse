package com.kakashimoto14.sweldopulse;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.RectF;
import android.os.Bundle;
import android.view.View;
import android.widget.RemoteViews;
import org.json.JSONObject;

public class SweldoWidgetProvider extends AppWidgetProvider {
    static final String PREFS = "sweldopulse_widget_prefs";

    @Override
    public void onUpdate(Context ctx, AppWidgetManager mgr, int[] ids) {
        if (ids == null) return;
        for (int i = 0; i < ids.length; i++) {
            updateOne(ctx, mgr, ids[i], mgr.getAppWidgetOptions(ids[i]));
        }
    }

    @Override
    public void onAppWidgetOptionsChanged(Context ctx, AppWidgetManager mgr, int appWidgetId, Bundle newOptions) {
        super.onAppWidgetOptionsChanged(ctx, mgr, appWidgetId, newOptions);
        updateOne(ctx, mgr, appWidgetId, newOptions);
    }

    public static void setPinLocked(Context ctx, boolean locked) {
        try {
            SharedPreferences sp = ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
            sp.edit().putBoolean("pinLocked", locked).apply();
            refreshAll(ctx);
            BudgetDueWidgetProvider.refreshAll(ctx);
        } catch (Throwable t) { }
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

    public static void saveJsonAndRefresh(Context ctx, String jsonStr) {
        try {
            if (jsonStr == null || jsonStr.length() == 0) return;
            JSONObject o = new JSONObject(jsonStr);
            SharedPreferences sp = ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
            SharedPreferences.Editor ed = sp.edit();
            if (o.has("net")) ed.putString("net", o.optString("net", "₱0.00"));
            if (o.has("badge")) ed.putString("badge", o.optString("badge", "Current cutoff"));
            if (o.has("meta")) ed.putString("meta", o.optString("meta", "0h · 0 shifts"));
            if (o.has("period")) ed.putString("period", o.optString("period", "SweldoPulse"));
            if (o.has("gross")) ed.putString("gross", o.optString("gross", "₱0.00"));
            if (o.has("ded")) ed.putString("ded", o.optString("ded", "₱0.00"));
            if (o.has("extra")) ed.putString("extra", o.optString("extra", ""));
            if (o.has("remBudget")) ed.putString("remBudget", o.optString("remBudget", "₱0.00"));
            if (o.has("dueTitle")) ed.putString("dueTitle", o.optString("dueTitle", "Next due"));
            if (o.has("dueLine")) ed.putString("dueLine", o.optString("dueLine", "No upcoming dues"));
            if (o.has("dueUrgent")) ed.putBoolean("dueUrgent", o.optBoolean("dueUrgent", false));
            if (o.has("appHide")) ed.putBoolean("appHide", o.optBoolean("appHide", false));
            if (o.has("pinLocked")) ed.putBoolean("pinLocked", o.optBoolean("pinLocked", false));
            if (o.has("theme")) ed.putString("theme", o.optString("theme", "dark"));
            if (o.has("cardStyle")) ed.putString("cardStyle", o.optString("cardStyle", "surface"));
            if (o.has("tintBg")) ed.putString("tintBg", o.optString("tintBg", "#171A40"));
            if (o.has("accent")) ed.putString("accent", o.optString("accent", "#4F46E5"));
            if (o.has("accentFg")) ed.putString("accentFg", o.optString("accentFg", "#FFFFFF"));
            if (o.has("accentText")) ed.putString("accentText", o.optString("accentText", "#A5B4FC"));
            ed.apply();
            refreshAll(ctx);
            BudgetDueWidgetProvider.refreshAll(ctx);
            QuickActionsWidgetProvider.refreshAll(ctx);
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
                updateOne(ctx, mgr, ids[i], mgr.getAppWidgetOptions(ids[i]));
            }
        } catch (Throwable t) { }
    }

    static int safeColor(String hex, int fallback) {
        try {
            if (hex != null && hex.startsWith("#")) return Color.parseColor(hex);
        } catch (Throwable ignored) { }
        return fallback;
    }

    static int contrastFg(int bgColor, String hintHex) {
        if (hintHex != null && hintHex.startsWith("#")) {
            return safeColor(hintHex, 0xFFFFFFFF);
        }
        double lum = (0.299 * Color.red(bgColor) + 0.587 * Color.green(bgColor) + 0.114 * Color.blue(bgColor)) / 255.0;
        return lum > 0.65 ? 0xFF0B0D12 : 0xFFFFFFFF;
    }

    static Bitmap makeRoundedButton(int color) {
        int size = 96;
        Bitmap bmp = Bitmap.createBitmap(size, size, Bitmap.Config.ARGB_8888);
        Canvas c = new Canvas(bmp);
        Paint p = new Paint(Paint.ANTI_ALIAS_FLAG);
        p.setColor(color);
        c.drawRoundRect(new RectF(0f, 0f, size, size), 26f, 26f, p);
        return bmp;
    }

    static Bitmap makeWideButton(int color) {
        int w = 180;
        int h = 96;
        Bitmap bmp = Bitmap.createBitmap(w, h, Bitmap.Config.ARGB_8888);
        Canvas c = new Canvas(bmp);
        Paint p = new Paint(Paint.ANTI_ALIAS_FLAG);
        p.setColor(color);
        c.drawRoundRect(new RectF(0f, 0f, w, h), 24f, 24f, p);
        return bmp;
    }

    static void updateOne(Context ctx, AppWidgetManager mgr, int appWidgetId, Bundle opts) {
        try {
            SharedPreferences sp = ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
            boolean pinLocked = sp.getBoolean("pinLocked", false);
            boolean masked = pinLocked || sp.getBoolean("widgetMask", false) || sp.getBoolean("appHide", false);
            String mask = "₱••••••";
            String net = masked ? mask : sp.getString("net", "₱0.00");
            String badge = sp.getString("badge", "Current cutoff");
            String meta = pinLocked ? "PIN lock on · tap to open" : sp.getString("meta", "Tap to open SweldoPulse");
            String period = sp.getString("period", "SweldoPulse");
            String gross = masked ? mask : sp.getString("gross", "₱0.00");
            String ded = masked ? mask : sp.getString("ded", "₱0.00");
            String extra = pinLocked ? "Locked · unlock app to view amounts" : (masked ? "Amounts hidden on widget" : sp.getString("extra", "Tap card to open payslip"));
            String theme = sp.getString("theme", "dark");
            String cardStyle = sp.getString("cardStyle", "surface");
            int accentColor = safeColor(sp.getString("accent", "#4F46E5"), 0xFF4F46E5);
            int accentFg = contrastFg(accentColor, sp.getString("accentFg", null));
            int accentTextColor = safeColor(sp.getString("accentText", "#A5B4FC"), 0xFFA5B4FC);

            boolean isTinted = "tinted".equals(cardStyle);
            boolean isObsidian = !isTinted && "obsidian".equals(cardStyle);
            boolean isLight = !isTinted && !isObsidian && "light".equals(theme);
            boolean isAmoled = !isTinted && !isObsidian && "amoled".equals(theme);
            int tintBgColor = safeColor(sp.getString("tintBg", "#171A40"), 0xFF171A40);

            int minW = opts != null ? opts.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_WIDTH, 220) : 220;
            int minH = opts != null ? opts.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_HEIGHT, 110) : 110;

            int layoutId;
            boolean isSmall = false;
            boolean isLarge = false;
            if (minH < 88 || minW < 170) {
                layoutId = R.layout.widget_sweldo_small;
                isSmall = true;
            } else if (minH >= 152 && minW >= 195) {
                layoutId = R.layout.widget_sweldo_large;
                isLarge = true;
            } else {
                layoutId = R.layout.widget_sweldo;
            }

            int bgRes = isObsidian ? R.drawable.widget_bg_obsidian : (isLight ? R.drawable.widget_bg_light : (isAmoled ? R.drawable.widget_bg_amoled : R.drawable.widget_bg_dark));
            int stripRes = isTinted ? R.drawable.widget_strip_tinted : (isObsidian ? R.drawable.widget_strip_obsidian : (isLight ? R.drawable.widget_strip_light : (isAmoled ? R.drawable.widget_strip_amoled : R.drawable.widget_strip_dark)));
            int t1 = isLight ? 0xFF0B0F19 : 0xFFFFFFFF;
            int t2 = isTinted ? 0xCCFFFFFF : (isLight ? 0xFF64748B : 0xFF8895AA);
            int divColor = isTinted ? 0x33FFFFFF : (isLight ? 0xFFE2E6EE : (isObsidian ? 0xFF252B3B : 0xFF232938));
            int dedColor = isTinted ? 0xFFFDA4AF : (isLight ? 0xFFDC2626 : 0xFFF43F5E);
            if (isTinted) {
                accentTextColor = 0xE6FFFFFF;
                accentColor = 0xFFFFFFFF;
                accentFg = tintBgColor;
            } else if (isObsidian && "light".equals(theme)) {
                double lum = (0.299 * Color.red(accentTextColor) + 0.587 * Color.green(accentTextColor) + 0.114 * Color.blue(accentTextColor)) / 255.0;
                if (lum < 0.45) accentTextColor = 0xFFCBD5E1;
                if (accentColor == 0xFF111827) { accentColor = 0xFFF8FAFC; accentFg = 0xFF0B0D12; }
            }

            RemoteViews rv = new RemoteViews(ctx.getPackageName(), layoutId);
            if (isTinted) {
                rv.setViewVisibility(R.id.widget_tint_bg, View.VISIBLE);
                rv.setInt(R.id.widget_tint_bg, "setColorFilter", tintBgColor);
                rv.setInt(R.id.widget_root, "setBackgroundColor", 0x00000000);
            } else {
                rv.setViewVisibility(R.id.widget_tint_bg, View.GONE);
                rv.setInt(R.id.widget_root, "setBackgroundResource", bgRes);
            }
            rv.setImageViewBitmap(R.id.widget_add_bg, makeRoundedButton(accentColor));
            rv.setTextColor(R.id.widget_add_txt, accentFg);

            rv.setTextViewText(R.id.widget_net, net);
            rv.setTextColor(R.id.widget_net, t1);
            rv.setTextViewText(R.id.widget_meta, isSmall ? badge : meta);
            rv.setTextColor(R.id.widget_meta, accentTextColor);

            int flags = PendingIntent.FLAG_UPDATE_CURRENT | 0x04000000;

            if (!isSmall) {
                rv.setTextViewText(R.id.widget_period, period);
                rv.setTextColor(R.id.widget_period, t1);
                rv.setTextViewText(R.id.widget_badge, badge);
                rv.setTextColor(R.id.widget_badge, t2);
                rv.setInt(R.id.widget_eye_btn, "setBackgroundResource", stripRes);
                rv.setTextViewText(R.id.widget_eye_btn, pinLocked ? "LOCK" : (masked ? "SHOW" : "HIDE"));
                rv.setTextColor(R.id.widget_eye_btn, masked ? accentTextColor : t2);

                Intent eyeIntent = new Intent(ctx, WidgetPrivacyReceiver.class);
                eyeIntent.setAction(WidgetPrivacyReceiver.ACTION_TOGGLE_PRIVACY);
                PendingIntent eyePi = PendingIntent.getBroadcast(ctx, 12, eyeIntent, flags);
                rv.setOnClickPendingIntent(R.id.widget_eye_btn, eyePi);
            }

            if (isLarge) {
                rv.setInt(R.id.widget_strip, "setBackgroundResource", stripRes);
                rv.setInt(R.id.widget_strip_div, "setBackgroundColor", divColor);
                rv.setTextViewText(R.id.widget_gross, gross);
                rv.setTextColor(R.id.widget_gross, t1);
                rv.setTextColor(R.id.widget_gross_lbl, t2);
                rv.setTextViewText(R.id.widget_ded, ded);
                rv.setTextColor(R.id.widget_ded, dedColor);
                rv.setTextColor(R.id.widget_ded_lbl, t2);
                rv.setTextViewText(R.id.widget_extra, (extra != null && extra.length() > 0) ? extra : "Tap card to view payslip");
                rv.setTextColor(R.id.widget_extra, t2);
            }

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
