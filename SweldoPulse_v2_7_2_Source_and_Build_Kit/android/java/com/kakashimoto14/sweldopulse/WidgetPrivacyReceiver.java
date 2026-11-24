package com.kakashimoto14.sweldopulse;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;

public class WidgetPrivacyReceiver extends BroadcastReceiver {
    public static final String ACTION_TOGGLE_PRIVACY = "com.kakashimoto14.sweldopulse.TOGGLE_WIDGET_PRIVACY";

    @Override
    public void onReceive(Context ctx, Intent intent) {
        if (intent == null || !ACTION_TOGGLE_PRIVACY.equals(intent.getAction())) return;
        try {
            SharedPreferences sp = ctx.getSharedPreferences(SweldoWidgetProvider.PREFS, Context.MODE_PRIVATE);
            if (sp.getBoolean("pinLocked", false)) {
                Intent open = new Intent(ctx, MainActivity.class);
                open.setAction("com.kakashimoto14.sweldopulse.OPEN_HOME");
                open.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);
                ctx.startActivity(open);
                return;
            }
            boolean currentlyMasked = sp.getBoolean("widgetMask", false) || sp.getBoolean("appHide", false);
            boolean nextMasked = !currentlyMasked;
            SharedPreferences.Editor ed = sp.edit().putBoolean("widgetMask", nextMasked);
            if (!nextMasked) ed.putBoolean("appHide", false);
            ed.apply();
            SweldoWidgetProvider.refreshAll(ctx);
            BudgetDueWidgetProvider.refreshAll(ctx);
        } catch (Throwable t) { }
    }
}
