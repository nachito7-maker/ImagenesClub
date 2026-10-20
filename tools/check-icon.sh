#!/usr/bin/env bash
set -euo pipefail
APK="${1:-artifacts/imagenes-club-debug.apk}"
OUTDIR="${2:-artifacts/apk-icon}"
mkdir -p "$OUTDIR"
unzip -o -q "$APK" -d "$OUTDIR/extracted"
echo '=== mipmap resources present in APK ==='
find "$OUTDIR/extracted" -path '*/mipmap-*/ic_launcher*' -print | sort | sed -n '1,200p'
echo '=== ic_launcher size (mdpi sample) ==='
file "$OUTDIR/extracted/res/mipmap-mdpi-v4/ic_launcher.png" || true
echo '=== adaptive icon xml ==='
find "$OUTDIR/extracted" -path '*anydpi*' -type f -print -exec cat {} \; 2>/dev/null || true
