package com.kakashimoto14.sweldopulse;

import android.content.ContentProvider;
import android.content.ContentValues;
import android.content.Context;
import android.database.Cursor;
import android.database.MatrixCursor;
import android.net.Uri;
import android.os.ParcelFileDescriptor;
import android.provider.OpenableColumns;
import java.io.File;
import java.io.FileNotFoundException;
import java.util.List;

public class AppFileProvider extends ContentProvider {
    public static final String AUTHORITY = "com.kakashimoto14.sweldopulse.files";

    public static Uri uriFor(Context ctx, String bucket, String fileName) {
        return new Uri.Builder()
            .scheme("content")
            .authority(AUTHORITY)
            .appendPath(bucket)
            .appendPath(fileName)
            .build();
    }

    private File resolveFile(Uri uri) throws FileNotFoundException {
        Context ctx = getContext();
        if (ctx == null || uri == null) throw new FileNotFoundException("No context");
        List<String> segs = uri.getPathSegments();
        if (segs == null || segs.size() != 2) throw new FileNotFoundException("Invalid URI");
        String bucket = segs.get(0);
        String name = segs.get(1);
        if (!"updates".equals(bucket) && !"shares".equals(bucket)) {
            throw new FileNotFoundException("Forbidden bucket");
        }
        if (name == null || name.length() == 0 || name.contains("/") || name.contains("\\") || name.contains("..")) {
            throw new FileNotFoundException("Invalid filename");
        }
        try {
            File baseDir = new File(ctx.getCacheDir(), bucket).getCanonicalFile();
            File target = new File(baseDir, name).getCanonicalFile();
            String basePath = baseDir.getPath();
            if (!basePath.endsWith(File.separator)) basePath = basePath + File.separator;
            if (!target.getPath().startsWith(basePath) || !target.isFile()) {
                throw new FileNotFoundException("File not found");
            }
            return target;
        } catch (FileNotFoundException e) {
            throw e;
        } catch (Exception e) {
            throw new FileNotFoundException("Failed to resolve file");
        }
    }

    @Override
    public boolean onCreate() {
        return true;
    }

    @Override
    public String getType(Uri uri) {
        String p = uri != null ? uri.getLastPathSegment() : null;
        if (p == null) return "application/octet-stream";
        String lower = p.toLowerCase();
        if (lower.endsWith(".apk")) return "application/vnd.android.package-archive";
        if (lower.endsWith(".json")) return "application/json";
        if (lower.endsWith(".csv")) return "text/csv";
        if (lower.endsWith(".png")) return "image/png";
        if (lower.endsWith(".txt")) return "text/plain";
        return "application/octet-stream";
    }

    @Override
    public ParcelFileDescriptor openFile(Uri uri, String mode) throws FileNotFoundException {
        if (mode != null && !"r".equals(mode)) {
            throw new SecurityException("Read-only provider");
        }
        File file = resolveFile(uri);
        return ParcelFileDescriptor.open(file, ParcelFileDescriptor.MODE_READ_ONLY);
    }

    @Override
    public Cursor query(Uri uri, String[] projection, String selection, String[] selectionArgs, String sortOrder) {
        File file;
        try {
            file = resolveFile(uri);
        } catch (FileNotFoundException e) {
            return new MatrixCursor(new String[]{OpenableColumns.DISPLAY_NAME, OpenableColumns.SIZE});
        }
        String[] cols = (projection != null && projection.length > 0)
            ? projection
            : new String[]{OpenableColumns.DISPLAY_NAME, OpenableColumns.SIZE};
        MatrixCursor cursor = new MatrixCursor(cols, 1);
        Object[] row = new Object[cols.length];
        for (int i = 0; i < cols.length; i++) {
            if (OpenableColumns.DISPLAY_NAME.equals(cols[i])) {
                row[i] = file.getName();
            } else if (OpenableColumns.SIZE.equals(cols[i])) {
                row[i] = file.length();
            } else {
                row[i] = null;
            }
        }
        cursor.addRow(row);
        return cursor;
    }

    @Override
    public Uri insert(Uri uri, ContentValues values) {
        throw new UnsupportedOperationException("Read-only");
    }

    @Override
    public int delete(Uri uri, String selection, String[] selectionArgs) {
        throw new UnsupportedOperationException("Read-only");
    }

    @Override
    public int update(Uri uri, ContentValues values, String selection, String[] selectionArgs) {
        throw new UnsupportedOperationException("Read-only");
    }
}
