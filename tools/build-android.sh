#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
BUILD_TYPE="${1:-debug}"
case "$BUILD_TYPE" in
  debug)   TASK=assembleDebug;   OUT=app-debug.apk;   DEST=artifacts/imagenes-club-debug.apk ;;
  release) TASK=assembleRelease; OUT=app-release.apk; DEST=artifacts/imagenes-club-release.apk ;;
  *) echo "Tipo de build no soportado: $BUILD_TYPE (usa debug|release)"; exit 2 ;;
esac
npm run build
mkdir -p android/app/src/main/assets artifacts
# Replace, never merge: a stale copy would keep the old 358 MB of WAVs inside the APK.
rm -rf android/app/src/main/assets
mkdir -p android/app/src/main/assets
cp -R dist/. android/app/src/main/assets/
export ANDROID_HOME="${ANDROID_HOME:-$HOME/Library/Android/sdk}"
if [[ -z "${JAVA_HOME:-}" ]] && [[ -x /usr/libexec/java_home ]]; then export JAVA_HOME="$(/usr/libexec/java_home -v 21)"; fi
if [[ -x android/gradlew ]]; then
  (cd android && ./gradlew --no-daemon "$TASK")
elif command -v gradle >/dev/null; then
  (cd android && gradle --no-daemon "$TASK")
else
  GRADLE=$(find "$HOME/.gradle/wrapper/dists/gradle-8.11.1-bin" -path '*/bin/gradle' -type f | head -1)
  [[ -n "$GRADLE" ]] || { echo 'Gradle 8.11.1 no disponible'; exit 1; }
  (cd android && "$GRADLE" --no-daemon "$TASK")
fi
cp "android/app/build/outputs/apk/$BUILD_TYPE/$OUT" "$DEST"
ls -lh "$DEST"
