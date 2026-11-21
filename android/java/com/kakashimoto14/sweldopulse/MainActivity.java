package com.kakashimoto14.sweldopulse;

import android.Manifest;
import android.app.Activity;
import android.app.Notification;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.hardware.fingerprint.FingerprintManager;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.CancellationSignal;
import android.provider.MediaStore;
import android.util.Base64;
import android.view.WindowManager;
import android.webkit.JavascriptInterface;
import android.webkit.ValueCallback;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import java.io.InputStream;

public class MainActivity extends Activity {
    static final String HOST = "appassets.sweldopulse.local";
    WebView web;
    CancellationSignal fpCancel;
    int notifId = 1;

    @Override
    protected void onCreate(Bundle b) {
        super.onCreate(b);
        web = new WebView(this);
        web.setBackgroundColor(0xFF07090F);
        setContentView(web);
        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setAllowFileAccess(false);
        s.setAllowContentAccess(false);
        s.setMediaPlaybackRequiresUserGesture(true);
        s.setCacheMode(WebSettings.LOAD_DEFAULT);
        web.addJavascriptInterface(new Bridge(), "AndroidBridge");
        web.setWebViewClient(new WebViewClient() {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView v, WebResourceRequest r) {
                Uri u = r.getUrl();
                if (!HOST.equals(u.getHost())) return null;
                String p = u.getPath();
                if (p == null || p.equals("/") || p.length() == 0) p = "/index.html";
                try {
                    InputStream in = getAssets().open(p.substring(1));
                    return new WebResourceResponse(mime(p), "UTF-8", in);
                } catch (Exception e) {
                    return new WebResourceResponse("text/plain", "UTF-8", 404, "Not Found", null, null);
                }
            }
            @Override
            public boolean shouldOverrideUrlLoading(WebView v, String url) {
                return external(Uri.parse(url));
            }
        });
        boolean openLog = getIntent() != null && getIntent().getBooleanExtra("open_log_shift", false);
        web.loadUrl("https://" + HOST + "/index.html" + (openLog ? "#log-shift" : ""));
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        if (intent != null && intent.getBooleanExtra("open_log_shift", false)) {
            js("window.onReminderTap&&onReminderTap()");
        }
    }

    boolean external(Uri u) {
        if (HOST.equals(u.getHost())) return false;
        try { startActivity(new Intent(Intent.ACTION_VIEW, u)); } catch (Exception e) { }
        return true;
    }

    static String mime(String p) {
        if (p.endsWith(".html")) return "text/html";
        if (p.endsWith(".css")) return "text/css";
        if (p.endsWith(".js")) return "application/javascript";
        if (p.endsWith(".json")) return "application/json";
        if (p.endsWith(".svg")) return "image/svg+xml";
        if (p.endsWith(".png")) return "image/png";
        if (p.endsWith(".woff2")) return "font/woff2";
        return "application/octet-stream";
    }

    void js(final String code) {
        runOnUiThread(new Runnable() { public void run() { if (web != null) web.evaluateJavascript(code, null); } });
    }

    @Override
    public void onBackPressed() {
        if (web == null) { moveTaskToBack(true); return; }
        web.evaluateJavascript(
            "(function(){try{return window.handleAndroidBack?window.handleAndroidBack():false;}catch(e){return false;}})()",
            new ValueCallback<String>() {
                @Override
                public void onReceiveValue(String val) {
                    if (!"true".equals(val)) {
                        moveTaskToBack(true);
                    }
                }
            }
        );
    }

    @Override
    protected void onDestroy() {
        if (fpCancel != null) fpCancel.cancel();
        super.onDestroy();
    }

    class Bridge {
        FingerprintManager fm() {
            try { return (FingerprintManager) getSystemService(Context.FINGERPRINT_SERVICE); } catch (Throwable t) { return null; }
        }

        @JavascriptInterface
        public boolean fpAvailable() {
            try {
                FingerprintManager f = fm();
                return f != null && f.isHardwareDetected() && f.hasEnrolledFingerprints();
            } catch (Throwable t) { return false; }
        }

        @JavascriptInterface
        public void fpAuth() {
            runOnUiThread(new Runnable() {
                public void run() {
                    try {
                        FingerprintManager f = fm();
                        if (f == null) { js("window.onFingerprint&&onFingerprint(false,'unavailable')"); return; }
                        if (fpCancel != null) fpCancel.cancel();
                        fpCancel = new CancellationSignal();
                        f.authenticate(null, fpCancel, 0, new FingerprintManager.AuthenticationCallback() {
                            @Override public void onAuthenticationSucceeded(FingerprintManager.AuthenticationResult r) { js("window.onFingerprint&&onFingerprint(true,'')"); }
                            @Override public void onAuthenticationFailed() { js("window.onFingerprint&&onFingerprint(null,'')"); }
                            @Override public void onAuthenticationError(int code, CharSequence msg) { if (code != 5) js("window.onFingerprint&&onFingerprint(false,'')"); }
                        }, null);
                    } catch (Throwable t) { js("window.onFingerprint&&onFingerprint(false,'')"); }
                }
            });
        }

        @JavascriptInterface
        public void fpCancel() {
            runOnUiThread(new Runnable() { public void run() { if (fpCancel != null) { fpCancel.cancel(); fpCancel = null; } } });
        }

        @JavascriptInterface
        public void setSecure(final boolean on) {
            runOnUiThread(new Runnable() {
                public void run() {
                    if (on) getWindow().addFlags(WindowManager.LayoutParams.FLAG_SECURE);
                    else getWindow().clearFlags(WindowManager.LayoutParams.FLAG_SECURE);
                }
            });
        }

        @JavascriptInterface
        public void scheduleReminder(final boolean enabled, final int hour, final int min) {
            ReminderReceiver.schedule(MainActivity.this, enabled, hour, min);
        }

        @JavascriptInterface
        public boolean saveImage(String dataUrl, String name) {
            try {
                if (Build.VERSION.SDK_INT < 29 && checkSelfPermission(Manifest.permission.WRITE_EXTERNAL_STORAGE) != PackageManager.PERMISSION_GRANTED) {
                    requestPermissions(new String[]{Manifest.permission.WRITE_EXTERNAL_STORAGE}, 7);
                    return false;
                }
                byte[] raw = Base64.decode(dataUrl.substring(dataUrl.indexOf(',') + 1), Base64.DEFAULT);
                Bitmap bmp = BitmapFactory.decodeByteArray(raw, 0, raw.length);
                String url = MediaStore.Images.Media.insertImage(getContentResolver(), bmp, name, "SweldoPulse payslip");
                return url != null;
            } catch (Throwable t) { return false; }
        }

        @JavascriptInterface
        public void notify(String title, String body) {
            try {
                NotificationManager nm = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
                Notification.Builder nb = new Notification.Builder(MainActivity.this);
                if (Build.VERSION.SDK_INT >= 26) {
                    Class<?> cc = Class.forName("android.app.NotificationChannel");
                    Object ch = cc.getConstructor(String.class, CharSequence.class, int.class).newInstance("shifts", "Shift reminders", 3);
                    nm.getClass().getMethod("createNotificationChannel", cc).invoke(nm, ch);
                    nb.getClass().getMethod("setChannelId", String.class).invoke(nb, "shifts");
                }
                Intent launch = new Intent(MainActivity.this, MainActivity.class);
                launch.putExtra("open_log_shift", true);
                launch.addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);
                int flags = PendingIntent.FLAG_UPDATE_CURRENT | 0x04000000;
                PendingIntent pi = PendingIntent.getActivity(MainActivity.this, 0, launch, flags);
                nb.setSmallIcon(R.mipmap.ic_launcher).setContentTitle(title).setContentText(body).setContentIntent(pi).setAutoCancel(true);
                nm.notify(notifId++, nb.build());
            } catch (Throwable t) { }
        }
    }
}
