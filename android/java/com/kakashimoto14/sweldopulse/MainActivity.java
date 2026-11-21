package com.kakashimoto14.sweldopulse;

import android.Manifest;
import android.app.Activity;
import android.app.Notification;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.ClipData;
import android.content.ContentResolver;
import android.content.ContentValues;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Color;
import android.graphics.drawable.Icon;
import android.hardware.fingerprint.FingerprintManager;
import android.net.ConnectivityManager;
import android.net.NetworkInfo;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.CancellationSignal;
import android.provider.MediaStore;
import android.util.Base64;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;
import android.webkit.JavascriptInterface;
import android.webkit.ValueCallback;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import java.io.BufferedInputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.ArrayList;
import java.util.List;
import org.json.JSONObject;

public class MainActivity extends Activity {
    static final String HOST = "appassets.sweldopulse.local";
    static final String UPD_PREFS = "sweldopulse_upd_prefs";
    static final String POST_NOTIF_PERM = "android.permission.POST_NOTIFICATIONS";
    static final int REQ_STORAGE = 7;
    static final int REQ_NOTIF = 8;
    static final int NOTIF_UPDATE_ID = 2002;

    WebView web;
    CancellationSignal fpCancel;
    int notifId = 1;

    volatile boolean updBusy = false;
    volatile boolean updCancelled = false;
    volatile String updState = "idle";
    volatile String updVersion = "";
    volatile int updProgress = 0;
    volatile long updDownloaded = 0;
    volatile long updTotal = 0;
    volatile String updError = "";
    volatile boolean pendingInstallAfterPerm = false;

    @Override
    protected void onCreate(Bundle b) {
        super.onCreate(b);
        cleanupStaleUpdate();
        setupAppShortcuts();
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
        String hash = "";
        if (getIntent() != null) {
            String tab = getIntent().getStringExtra("open_tab");
            if (getIntent().getBooleanExtra("open_update_install", false)) hash = "#install-update";
            else if (getIntent().getBooleanExtra("open_log_shift", false)) hash = "#log-shift";
            else if (tab != null && tab.length() > 0) hash = "#" + tab;
        }
        web.loadUrl("https://" + HOST + "/index.html" + hash);
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        if (intent == null) return;
        String tab = intent.getStringExtra("open_tab");
        if (intent.getBooleanExtra("open_update_install", false)) {
            js("window.onUpdateNotifTap&&onUpdateNotifTap()");
        } else if (intent.getBooleanExtra("open_log_shift", false)) {
            js("window.onReminderTap&&onReminderTap()");
        } else if (tab != null && tab.length() > 0) {
            js("window.onShortcutTab&&onShortcutTab(" + jsStr(tab) + ")");
        }
    }

    @Override
    protected void onResume() {
        super.onResume();
        if (pendingInstallAfterPerm) {
            pendingInstallAfterPerm = false;
            boolean ok = canInstallPackages();
            js("window.onInstallPermResult&&onInstallPermResult(" + ok + ")");
        }
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == REQ_NOTIF) {
            boolean granted = grantResults != null && grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED;
            js("window.onNotifPermission&&onNotifPermission(" + granted + ")");
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

    static String jsStr(String s) {
        return JSONObject.quote(s == null ? "" : s);
    }

    int getInstalledVersionCode() {
        try {
            PackageInfo pi = getPackageManager().getPackageInfo(getPackageName(), 0);
            return pi != null ? pi.versionCode : 0;
        } catch (Throwable t) {
            return 0;
        }
    }

    boolean canInstallPackages() {
        if (Build.VERSION.SDK_INT < 26) return true;
        try {
            PackageManager pm = getPackageManager();
            Object res = pm.getClass().getMethod("canRequestPackageInstalls").invoke(pm);
            return res instanceof Boolean && ((Boolean) res).booleanValue();
        } catch (Throwable t) {
            return true;
        }
    }

    File updateDir() {
        File d = new File(getCacheDir(), "updates");
        if (!d.exists()) d.mkdirs();
        return d;
    }

    File updateApkFile() {
        return new File(updateDir(), "update.apk");
    }

    String verifyApkFile(File f) {
        if (f == null || !f.isFile() || f.length() < 65536L) {
            return "Downloaded APK is incomplete or too small.";
        }
        // Layer 1: ZIP/APK magic bytes (PK 0x03 0x04)
        FileInputStream fis = null;
        try {
            fis = new FileInputStream(f);
            byte[] hdr = new byte[4];
            if (fis.read(hdr) != 4 || hdr[0] != 0x50 || hdr[1] != 0x4B || hdr[2] != 0x03 || hdr[3] != 0x04) {
                return "Downloaded file is not a valid APK archive.";
            }
        } catch (Throwable t) {
            return "Could not read downloaded APK.";
        } finally {
            if (fis != null) try { fis.close(); } catch (Throwable ignored) {}
        }
        // Layer 2: Android PackageManager parser pre-check
        try {
            PackageInfo info = getPackageManager().getPackageArchiveInfo(f.getAbsolutePath(), 0);
            if (info == null) {
                return "APK failed Android package verification (corrupted download).";
            }
            if (!getPackageName().equals(info.packageName)) {
                return "APK package ID does not match SweldoPulse.";
            }
            int installed = getInstalledVersionCode();
            if (installed > 0 && info.versionCode <= installed) {
                return "Downloaded APK (code " + info.versionCode + ") is not newer than installed app.";
            }
        } catch (Throwable t) {
            return "Android could not parse the downloaded APK.";
        }
        return null;
    }

    void setupAppShortcuts() {
        if (Build.VERSION.SDK_INT < 25) return;
        try {
            Class<?> smClass = Class.forName("android.content.pm.ShortcutManager");
            Object sm = getSystemService(smClass);
            if (sm == null) return;
            Class<?> builderClass = Class.forName("android.content.pm.ShortcutInfo$Builder");
            List<Object> list = new ArrayList<Object>();
            Icon icon = Icon.createWithResource(this, R.mipmap.ic_launcher);

            Intent i1 = new Intent(this, MainActivity.class);
            i1.setAction("com.kakashimoto14.sweldopulse.SHORTCUT_LOG");
            i1.putExtra("open_log_shift", true);
            Object b1 = builderClass.getConstructor(Context.class, String.class).newInstance(this, "log_shift");
            builderClass.getMethod("setShortLabel", CharSequence.class).invoke(b1, "Log shift");
            builderClass.getMethod("setLongLabel", CharSequence.class).invoke(b1, "Log a new shift");
            builderClass.getMethod("setIcon", Icon.class).invoke(b1, icon);
            builderClass.getMethod("setIntent", Intent.class).invoke(b1, i1);
            list.add(builderClass.getMethod("build").invoke(b1));

            Intent i2 = new Intent(this, MainActivity.class);
            i2.setAction("com.kakashimoto14.sweldopulse.SHORTCUT_PAYSLIP");
            i2.putExtra("open_tab", "deductions");
            Object b2 = builderClass.getConstructor(Context.class, String.class).newInstance(this, "payslip");
            builderClass.getMethod("setShortLabel", CharSequence.class).invoke(b2, "Payslip");
            builderClass.getMethod("setLongLabel", CharSequence.class).invoke(b2, "Open cutoff payslip");
            builderClass.getMethod("setIcon", Icon.class).invoke(b2, icon);
            builderClass.getMethod("setIntent", Intent.class).invoke(b2, i2);
            list.add(builderClass.getMethod("build").invoke(b2));

            Intent i3 = new Intent(this, MainActivity.class);
            i3.setAction("com.kakashimoto14.sweldopulse.SHORTCUT_INSIGHTS");
            i3.putExtra("open_tab", "insights");
            Object b3 = builderClass.getConstructor(Context.class, String.class).newInstance(this, "insights");
            builderClass.getMethod("setShortLabel", CharSequence.class).invoke(b3, "Insights");
            builderClass.getMethod("setLongLabel", CharSequence.class).invoke(b3, "Yearly insights & ledger");
            builderClass.getMethod("setIcon", Icon.class).invoke(b3, icon);
            builderClass.getMethod("setIntent", Intent.class).invoke(b3, i3);
            list.add(builderClass.getMethod("build").invoke(b3));

            smClass.getMethod("setDynamicShortcuts", List.class).invoke(sm, list);
        } catch (Throwable t) { }
    }

    void cleanupStaleUpdate() {
        try {
            File tmp = new File(updateDir(), "update.apk.tmp");
            if (tmp.exists()) tmp.delete();
            File apk = updateApkFile();
            SharedPreferences sp = getSharedPreferences(UPD_PREFS, Context.MODE_PRIVATE);
            if (apk.exists()) {
                String err = verifyApkFile(apk);
                if (err != null) {
                    apk.delete();
                    sp.edit().clear().apply();
                    updState = "idle";
                    updVersion = "";
                } else {
                    updState = "ready";
                    updVersion = sp.getString("version", "");
                    updDownloaded = apk.length();
                    updTotal = apk.length();
                    updProgress = 100;
                }
            } else {
                sp.edit().clear().apply();
            }
        } catch (Throwable t) { }
    }

    void postUpdateNotification(String version) {
        try {
            if (Build.VERSION.SDK_INT >= 33 && checkSelfPermission(POST_NOTIF_PERM) != PackageManager.PERMISSION_GRANTED) {
                return;
            }
            NotificationManager nm = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
            if (nm == null) return;
            Notification.Builder nb = new Notification.Builder(MainActivity.this);
            if (Build.VERSION.SDK_INT >= 26) {
                Class<?> cc = Class.forName("android.app.NotificationChannel");
                Object ch = cc.getConstructor(String.class, CharSequence.class, int.class).newInstance("updates", "App updates", 3);
                nm.getClass().getMethod("createNotificationChannel", cc).invoke(nm, ch);
                nb.getClass().getMethod("setChannelId", String.class).invoke(nb, "updates");
            }
            Intent launch = new Intent(MainActivity.this, MainActivity.class);
            launch.putExtra("open_update_install", true);
            launch.addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            int flags = PendingIntent.FLAG_UPDATE_CURRENT | 0x04000000;
            PendingIntent pi = PendingIntent.getActivity(MainActivity.this, 3, launch, flags);
            String vLabel = (version != null && version.length() > 0) ? (version.startsWith("v") ? version : "v" + version) : "Update";
            nb.setSmallIcon(R.mipmap.ic_launcher)
              .setContentTitle("SweldoPulse " + vLabel + " ready")
              .setContentText("Verified and downloaded \u2014 tap to install now.")
              .setContentIntent(pi)
              .setAutoCancel(true);
            nm.notify(NOTIF_UPDATE_ID, nb.build());
        } catch (Throwable t) { }
    }

    void failUpdate(File tmp, String reason) {
        try { if (tmp != null && tmp.exists()) tmp.delete(); } catch (Throwable ignored) {}
        updState = updCancelled ? "idle" : "error";
        updError = updCancelled ? "" : reason;
        updBusy = false;
        if (updCancelled) {
            js("window.onUpdateCancelled&&onUpdateCancelled()");
        } else {
            js("window.onUpdateError&&onUpdateError(" + jsStr(reason) + ")");
        }
    }

    void runDownloadThread(final String urlStr, final String version, final long expectedSize, final boolean autoNotify) {
        new Thread(new Runnable() {
            @Override
            public void run() {
                File dir = updateDir();
                File tmp = new File(dir, "update.apk.tmp");
                File finalApk = updateApkFile();
                HttpURLConnection conn = null;
                InputStream in = null;
                FileOutputStream out = null;
                try {
                    if (tmp.exists()) tmp.delete();
                    String curUrl = urlStr;
                    int hops = 0;
                    while (hops < 8) {
                        if (updCancelled) { failUpdate(tmp, "Cancelled"); return; }
                        URL u = new URL(curUrl);
                        if (!"https".equalsIgnoreCase(u.getProtocol())) {
                            failUpdate(tmp, "Blocked non-HTTPS update URL.");
                            return;
                        }
                        conn = (HttpURLConnection) u.openConnection();
                        conn.setInstanceFollowRedirects(false);
                        conn.setConnectTimeout(15000);
                        conn.setReadTimeout(30000);
                        conn.setRequestProperty("User-Agent", "SweldoPulse-Android");
                        conn.setRequestProperty("Accept", "application/octet-stream, application/vnd.android.package-archive, */*");
                        int code = conn.getResponseCode();
                        if (code == 301 || code == 302 || code == 303 || code == 307 || code == 308) {
                            String loc = conn.getHeaderField("Location");
                            conn.disconnect();
                            conn = null;
                            if (loc == null || loc.length() == 0) {
                                failUpdate(tmp, "Broken redirect from GitHub.");
                                return;
                            }
                            curUrl = new URL(u, loc).toString();
                            hops++;
                            continue;
                        }
                        if (code != 200) {
                            failUpdate(tmp, "Download failed (HTTP " + code + ").");
                            return;
                        }
                        break;
                    }
                    if (conn == null) {
                        failUpdate(tmp, "Too many redirects while downloading update.");
                        return;
                    }
                    String ct = conn.getContentType();
                    if (ct != null && ct.toLowerCase().contains("text/html")) {
                        failUpdate(tmp, "Update link returned a web page instead of an APK file.");
                        return;
                    }
                    long contentLen = conn.getContentLength();
                    long total = expectedSize > 0 ? expectedSize : (contentLen > 0 ? contentLen : 0);
                    updTotal = total;
                    in = new BufferedInputStream(conn.getInputStream(), 16384);
                    out = new FileOutputStream(tmp);
                    byte[] buf = new byte[16384];
                    long written = 0;
                    int n;
                    int lastPct = -1;
                    long lastEmit = 0;
                    while ((n = in.read(buf)) != -1) {
                        if (updCancelled) { failUpdate(tmp, "Cancelled"); return; }
                        out.write(buf, 0, n);
                        written += n;
                        updDownloaded = written;
                        int pct = total > 0 ? (int) Math.min(99, (written * 100L) / total) : 0;
                        long now = System.currentTimeMillis();
                        if (pct != lastPct && (now - lastEmit >= 140 || pct - lastPct >= 3)) {
                            lastPct = pct;
                            lastEmit = now;
                            updProgress = pct;
                            js("window.onUpdateProgress&&onUpdateProgress(" + pct + "," + written + "," + total + ")");
                        }
                    }
                    out.flush();
                    out.close(); out = null;
                    in.close(); in = null;
                    conn.disconnect(); conn = null;

                    if (updCancelled) { failUpdate(tmp, "Cancelled"); return; }

                    // Exact size verification against GitHub asset size and HTTP Content-Length
                    if (expectedSize > 0 && written != expectedSize) {
                        failUpdate(tmp, "Download was cut short (" + written + " / " + expectedSize + " bytes). Tap to retry.");
                        return;
                    }
                    if (contentLen > 0 && written != contentLen) {
                        failUpdate(tmp, "Incomplete download (" + written + " / " + contentLen + " bytes). Tap to retry.");
                        return;
                    }

                    // ZIP header + Android PackageManager parser pre-check
                    String verifyErr = verifyApkFile(tmp);
                    if (verifyErr != null) {
                        failUpdate(tmp, verifyErr);
                        return;
                    }

                    // Atomic promotion to update.apk
                    if (finalApk.exists()) finalApk.delete();
                    if (!tmp.renameTo(finalApk)) {
                        failUpdate(tmp, "Could not finalize downloaded APK in cache.");
                        return;
                    }

                    SharedPreferences sp = getSharedPreferences(UPD_PREFS, Context.MODE_PRIVATE);
                    sp.edit().putString("version", version).putLong("size", written).apply();

                    updProgress = 100;
                    updDownloaded = written;
                    updTotal = written;
                    updVersion = version;
                    updState = "ready";
                    updError = "";
                    updBusy = false;

                    js("window.onUpdateReady&&onUpdateReady(" + jsStr(version) + "," + written + ")");
                    if (autoNotify) {
                        postUpdateNotification(version);
                    }
                } catch (Throwable t) {
                    String msg = t.getMessage();
                    failUpdate(tmp, "Download interrupted" + (msg != null && msg.length() > 0 ? ": " + msg : "."));
                } finally {
                    if (out != null) try { out.close(); } catch (Throwable ignored) {}
                    if (in != null) try { in.close(); } catch (Throwable ignored) {}
                    if (conn != null) try { conn.disconnect(); } catch (Throwable ignored) {}
                }
            }
        }).start();
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
        public void updateWidget(String netText, String badgeText, String metaText, String periodText) {
            SweldoWidgetProvider.saveAndRefresh(MainActivity.this, netText, badgeText, metaText, periodText);
        }

        @JavascriptInterface
        public int getVersionCode() {
            return getInstalledVersionCode();
        }

        @JavascriptInterface
        public boolean isOnWifi() {
            try {
                ConnectivityManager cm = (ConnectivityManager) getSystemService(Context.CONNECTIVITY_SERVICE);
                if (cm == null) return true;
                NetworkInfo ni = cm.getActiveNetworkInfo();
                if (ni == null || !ni.isConnected()) return false;
                if (ni.getType() == ConnectivityManager.TYPE_WIFI) return true;
                return !cm.isActiveNetworkMetered();
            } catch (Throwable t) {
                return true;
            }
        }

        @JavascriptInterface
        public boolean hasNotifPermission() {
            if (Build.VERSION.SDK_INT < 33) return true;
            try {
                return checkSelfPermission(POST_NOTIF_PERM) == PackageManager.PERMISSION_GRANTED;
            } catch (Throwable t) {
                return true;
            }
        }

        @JavascriptInterface
        public void requestNotifPermission() {
            runOnUiThread(new Runnable() {
                public void run() {
                    if (Build.VERSION.SDK_INT < 33) {
                        js("window.onNotifPermission&&onNotifPermission(true)");
                        return;
                    }
                    try {
                        if (checkSelfPermission(POST_NOTIF_PERM) == PackageManager.PERMISSION_GRANTED) {
                            js("window.onNotifPermission&&onNotifPermission(true)");
                        } else {
                            requestPermissions(new String[]{POST_NOTIF_PERM}, REQ_NOTIF);
                        }
                    } catch (Throwable t) {
                        js("window.onNotifPermission&&onNotifPermission(false)");
                    }
                }
            });
        }

        @JavascriptInterface
        public void setSystemBars(final String bgHex, final boolean darkTheme) {
            runOnUiThread(new Runnable() {
                public void run() {
                    try {
                        int color = Color.parseColor(bgHex);
                        Window w = getWindow();
                        w.addFlags(WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS);
                        w.setStatusBarColor(color);
                        w.setNavigationBarColor(color);
                        if (web != null) web.setBackgroundColor(color);
                        View decor = w.getDecorView();
                        int flags = decor.getSystemUiVisibility();
                        if (darkTheme) {
                            flags &= ~View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR;
                            if (Build.VERSION.SDK_INT >= 26) flags &= ~0x00000010;
                        } else {
                            flags |= View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR;
                            if (Build.VERSION.SDK_INT >= 26) flags |= 0x00000010;
                        }
                        decor.setSystemUiVisibility(flags);
                    } catch (Throwable t) { }
                }
            });
        }

        @JavascriptInterface
        public String getUpdateStatus() {
            try {
                if ("ready".equals(updState) && verifyApkFile(updateApkFile()) != null) {
                    cleanupStaleUpdate();
        setupAppShortcuts();
                }
                JSONObject o = new JSONObject();
                o.put("state", updState);
                o.put("version", updVersion);
                o.put("progress", updProgress);
                o.put("downloaded", updDownloaded);
                o.put("total", updTotal);
                o.put("error", updError);
                o.put("canInstall", canInstallPackages());
                return o.toString();
            } catch (Throwable t) {
                return "{\"state\":\"idle\"}";
            }
        }

        @JavascriptInterface
        public boolean downloadUpdate(String url, String version, long expectedSize, boolean autoNotify) {
            if (url == null || !url.startsWith("https://")) return false;
            if (updBusy) return true;
            // Already downloaded & verified this exact version?
            if ("ready".equals(updState) && version != null && version.equals(updVersion) && verifyApkFile(updateApkFile()) == null) {
                js("window.onUpdateReady&&onUpdateReady(" + jsStr(version) + "," + updateApkFile().length() + ")");
                return true;
            }
            updBusy = true;
            updCancelled = false;
            updState = "downloading";
            updVersion = version == null ? "" : version;
            updProgress = 0;
            updDownloaded = 0;
            updTotal = expectedSize > 0 ? expectedSize : 0;
            updError = "";
            runDownloadThread(url, updVersion, expectedSize, autoNotify);
            return true;
        }

        @JavascriptInterface
        public void cancelUpdate() {
            updCancelled = true;
        }

        @JavascriptInterface
        public void clearDownloadedUpdate() {
            updCancelled = true;
            try {
                File apk = updateApkFile();
                if (apk.exists()) apk.delete();
                File tmp = new File(updateDir(), "update.apk.tmp");
                if (tmp.exists()) tmp.delete();
                getSharedPreferences(UPD_PREFS, Context.MODE_PRIVATE).edit().clear().apply();
            } catch (Throwable t) { }
            updState = "idle";
            updVersion = "";
            updProgress = 0;
            updDownloaded = 0;
            updTotal = 0;
            updError = "";
        }

        @JavascriptInterface
        public String installDownloadedUpdate() {
            File apk = updateApkFile();
            String err = verifyApkFile(apk);
            if (err != null) {
                clearDownloadedUpdate();
                return "error:" + err;
            }
            if (!canInstallPackages()) {
                pendingInstallAfterPerm = true;
                runOnUiThread(new Runnable() {
                    public void run() {
                        try {
                            Intent i = new Intent("android.settings.MANAGE_UNKNOWN_APP_SOURCES", Uri.parse("package:" + getPackageName()));
                            i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                            startActivity(i);
                        } catch (Throwable t) {
                            pendingInstallAfterPerm = false;
                        }
                    }
                });
                return "need_permission";
            }
            runOnUiThread(new Runnable() {
                public void run() {
                    try {
                        NotificationManager nm = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
                        if (nm != null) nm.cancel(NOTIF_UPDATE_ID);
                        Uri apkUri = AppFileProvider.uriFor(MainActivity.this, "updates", "update.apk");
                        Intent intent = new Intent(Intent.ACTION_VIEW);
                        intent.setDataAndType(apkUri, "application/vnd.android.package-archive");
                        intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_ACTIVITY_NEW_TASK);
                        startActivity(intent);
                        if (web != null) {
                            web.postDelayed(new Runnable() {
                                public void run() { finish(); }
                            }, 350);
                        } else {
                            finish();
                        }
                    } catch (Throwable t) {
                        js("window.onUpdateError&&onUpdateError(" + jsStr("Could not launch Android installer.") + ")");
                    }
                }
            });
            return "started";
        }

        @JavascriptInterface
        public boolean shareFile(String fileName, String content, String mimeType) {
            try {
                String safe = (fileName == null ? "SweldoPulse-export.txt" : fileName).replaceAll("[^a-zA-Z0-9._-]", "_");
                if (safe.length() == 0 || safe.startsWith(".")) safe = "SweldoPulse-export.txt";
                File dir = new File(getCacheDir(), "shares");
                if (!dir.exists()) dir.mkdirs();
                File f = new File(dir, safe);
                FileOutputStream fos = new FileOutputStream(f);
                fos.write((content == null ? "" : content).getBytes("UTF-8"));
                fos.flush();
                fos.close();
                final Uri uri = AppFileProvider.uriFor(MainActivity.this, "shares", safe);
                final String type = (mimeType != null && mimeType.length() > 0) ? mimeType : "text/plain";
                final String title = safe;
                runOnUiThread(new Runnable() {
                    public void run() {
                        try {
                            Intent send = new Intent(Intent.ACTION_SEND);
                            send.setType(type);
                            send.putExtra(Intent.EXTRA_STREAM, uri);
                            send.putExtra(Intent.EXTRA_SUBJECT, title);
                            send.setClipData(ClipData.newRawUri(title, uri));
                            send.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
                            Intent chooser = Intent.createChooser(send, "Share " + title);
                            chooser.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
                            startActivity(chooser);
                        } catch (Throwable t) { }
                    }
                });
                return true;
            } catch (Throwable t) {
                return false;
            }
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
                byte[] raw = Base64.decode(dataUrl.substring(dataUrl.indexOf(',') + 1), Base64.DEFAULT);
                String safeName = (name != null && name.length() > 0) ? name : "SweldoPulse-payslip.png";
                if (!safeName.toLowerCase().endsWith(".png")) safeName += ".png";
                if (Build.VERSION.SDK_INT >= 29) {
                    ContentResolver cr = getContentResolver();
                    ContentValues cv = new ContentValues();
                    cv.put(MediaStore.MediaColumns.DISPLAY_NAME, safeName);
                    cv.put(MediaStore.MediaColumns.MIME_TYPE, "image/png");
                    cv.put("relative_path", "Pictures/SweldoPulse");
                    cv.put("is_pending", 1);
                    Uri uri = cr.insert(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, cv);
                    if (uri == null) return false;
                    OutputStream os = null;
                    try {
                        os = cr.openOutputStream(uri);
                        if (os == null) return false;
                        os.write(raw);
                        os.flush();
                    } finally {
                        if (os != null) try { os.close(); } catch (Throwable ignored) {}
                    }
                    ContentValues done = new ContentValues();
                    done.put("is_pending", 0);
                    cr.update(uri, done, null, null);
                    return true;
                }
                if (checkSelfPermission(Manifest.permission.WRITE_EXTERNAL_STORAGE) != PackageManager.PERMISSION_GRANTED) {
                    requestPermissions(new String[]{Manifest.permission.WRITE_EXTERNAL_STORAGE}, REQ_STORAGE);
                    return false;
                }
                Bitmap bmp = BitmapFactory.decodeByteArray(raw, 0, raw.length);
                String url = MediaStore.Images.Media.insertImage(getContentResolver(), bmp, safeName, "SweldoPulse payslip");
                return url != null;
            } catch (Throwable t) { return false; }
        }

        @JavascriptInterface
        public void notify(String title, String body) {
            try {
                if (Build.VERSION.SDK_INT >= 33 && checkSelfPermission(POST_NOTIF_PERM) != PackageManager.PERMISSION_GRANTED) {
                    return;
                }
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
