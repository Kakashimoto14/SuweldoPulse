#!/usr/bin/env bash
# Builds SweldoPulse.apk with plain Android tools (no Gradle, no Android Studio).
# Needs (Ubuntu/Debian): sudo apt install default-jdk-headless aapt apksigner zipalign dalvik-exchange libandroid-23-java
set -euo pipefail
cd "$(dirname "$0")/.."
AJ=/usr/lib/android-sdk/platforms/android-23/android.jar
VER=$(python3 -c "import json;print(json.load(open('version.json'))['version'])")
CODE=$(python3 -c "a,b,c=map(int,'$VER'.split('.'));print(a*10000+b*100+c)")
KS=${KEYSTORE:-signing/sweldopulse.jks}; KPASS=${KEYSTORE_PASS:-sweldopulse}; ALIAS=${KEY_ALIAS:-sweldo}
B=build; rm -rf $B; mkdir -p $B/assets/fonts $B/gen $B/classes
cp index.html manifest.json version.json icon.svg icon-192.png icon-512.png tailwind.css $B/assets/
cp fonts/*.woff2 $B/assets/fonts/
aapt package -f -M android/AndroidManifest.xml -S android/res -A $B/assets -I $AJ -J $B/gen -F $B/unsigned.ap_ \
  --version-code "$CODE" --version-name "$VER" --min-sdk-version 23 --target-sdk-version 29
javac -nowarn -source 8 -target 8 -bootclasspath $AJ -d $B/classes $(find $B/gen android/java -name '*.java')
dalvik-exchange --dex --output=$B/classes.dex $B/classes
( cd $B && aapt add unsigned.ap_ classes.dex >/dev/null )
zipalign -f -p 4 $B/unsigned.ap_ $B/aligned.apk
[ -f "$KS" ] || keytool -genkeypair -keystore "$KS" -alias $ALIAS -keyalg RSA -keysize 2048 -validity 36500 -storepass "$KPASS" -keypass "$KPASS" -dname "CN=SweldoPulse"
apksigner sign --ks "$KS" --ks-pass pass:"$KPASS" --key-pass pass:"$KPASS" --ks-key-alias $ALIAS --out SweldoPulse-v$VER.apk $B/aligned.apk
apksigner verify SweldoPulse-v$VER.apk && echo "Built SweldoPulse-v$VER.apk"
