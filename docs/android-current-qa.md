# Cierre QA Android actual — 7 octubre 2026

**NO FINALIZADO.** Solo emulator-5554. No se usa emulator-5580 como evidencia.

## Identidad

APK: [imagenes-club-debug.apk](../artifacts/imagenes-club-debug.apk)
SHA256: `ecf985d8b54a4676d4fd2e9c55d7ad259876cc4e9815957b9d1929f1a13e8997`.
No se modificó producción ni se reconstruyó el APK en esta fase: se modificó únicamente el arnés de QA. No se gastaron créditos Meshy.

## WEB / comprobaciones locales

| Prueba | Resultado | Evidencia |
|---|---|---|
| Vitest | PASS, 65/65 rerun | npm test, 18:24 del 7 octubre |
| TypeScript | PASS, rerun | npm run typecheck |
| Sintaxis del arnés | PASS | node --check tools/android-check.mjs |
| Build web / Android | No repetidos: producción sin cambios | Builds previos de este mismo APK; no equivalen a nueva regresión Android |
| Browser / stress | No repetidos en esta fase | No se extrapolan sus métricas a Android |

## ANDROID EMULADOR — emulator-5554

| Prueba | Resultado | Evidencia |
|---|---|---|
| Arranque | PASS | [JSON actual](../artifacts/android-current-qa.json), origen appassets HTTPS |
| Landscape | PASS, 923×411 CSS, DPR 2,625 | JSON actual |
| Fullscreen | PASS, statusBars/navigationBars visible=false y foco de esta app | [dumpsys window](../artifacts/android-current-window.txt) |
| Touch | PASS | Eventos Input.dispatchTouchEvent, cambio de planta y vuelta |
| Compra/recepción/transporte/almacenamiento | PASS en intentos actuales anteriores al último | [Caja actual](../artifacts/production-captures/08-box.png); stock comprobado sin incremento hasta colocación; compra 6 € |
| Mejora barra | PASS en un intento actual anterior | Acción touch y presencia de upgrade; no recovery comprobado |
| Preparación cinco categorías | NO VALIDADO | El arnés no alcanzó la ejecución completa |
| Servicio/consumo/pago/propinas/limpieza | NO VALIDADO en esta fase | No se reutiliza informe histórico |
| Escaleras subir/bajar sin salto/clipping | NO VALIDADO visualmente | Captura 09 sigue antigua; representaciones separadas pendientes |
| Museo/concierto y coexistencia sistemas | NO VALIDADO | No completada la revisión Android |
| Bebida antes de actividad | NO VALIDADO Android | Aún sin auditoría Android completa de esta fase |
| Segunda ronda | NO VALIDADO | No alcanzada |
| Save/load y force close/recovery | NO VALIDADO | No alcanzada comparación exacta |
| Carga 4/10/17 y mediana/p95/draw calls | NO VALIDADO | No alcanzadas ventanas equivalentes de 180 frames |
| Diez capturas coherentes | INCOMPLETO | Caja regenerada; escaleras vieja; capturas de Android parciales |

El último intento falló con `page.screenshot: Target page, context or browser has been closed`. Intentos anteriores sufrieron desconexiones CDP y fallos del arnés. Se guardó un informe con passed=false y error, no un pase completo. Los intentos están terminados, no se deja un job de QA ejecutándose.

[Log último](../artifacts/android-current-run.log). [Gfxinfo acumulado](../artifacts/android-current-gfxinfo.txt). [Logcat diagnóstico](../artifacts/android-current-logcat.txt).
El gfxinfo acumulado mostró 99,96 % de frames janky, percentil 50 de 650 ms y 95 de 1150 ms. **No es una ventana 4/10/17 controlada**, no equivale al frame-time WebGL y no se atribuye causalidad al juego. Logcat contiene errores de audio emulado y AppOps; no se afirma ausencia de errores Android.

## ANDROID FÍSICO

**NO VALIDADO**. Solo se detectó emulator-5554.

## Pendientes obligatorios

Estabilizar la conexión/ejecución de QA en este emulador, completar todos los pasos del arnés y añadir evidencia dedicada de escaleras/concierto. Revisar explícitamente persistencia de planta: el save de producción guarda la planta de personajes, no la selección de cámara. No cambiar ese contrato sin probarlo. La matriz, las escaleras visuales y las diez capturas NO están cerradas.
