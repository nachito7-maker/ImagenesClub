# Estabilización del arnés Android — 7 octubre 2026

## Diagnóstico demostrado

En los eventos capturados, ADB deja de responder, arranca de nuevo su daemon y devuelve `device offline`. El WebSocket CDP se desconecta con código 1006. Tras redescubrir, siguen idénticos PID 13828, socket webview_devtools_remote_13828, target E7A1A8056FD60001B113885271772BA2 y Activity. Esto acredita pérdida del transporte ADB/CDP (categoría H), no cierre/recreación de la WebView en esos incidentes. No se conoce todavía qué proceso o condición termina el daemon ADB; no se cambiaron configuraciones globales ni se reinició ADB a ciegas.

Otro defecto del fixture: quitar localStorage y recargar activa pagehide, que guarda de nuevo la campaña vieja. Se corrige guardando primero una instancia nueva de la clase Game en la campaña de pruebas, sin alterar producción.

## Cambios SOLO QA

- android-session.mjs: descubrimiento de socket por PID y target por origen appassets, reconexión de hasta 6 intentos, eventos JSONL de desconexión/diagnóstico/cleanup, lecturas reintentables, touch con postcondiciones, sin replay ciego de compra y timeout para comandos táctiles/cleanup.
- android-harness-short.mjs: checkpoints persistentes con timestamp, estado, acción, resultado, evidencia y reconexión.
- android-check.mjs: integración inicial del helper, captura nativa ADB en lugar de screenshot Playwright, fixture reparado y clasificación HarnessBlocked. **La integración completa todavía no cubre recuperación de todas las operaciones directas sobre page/touch y todos los checkpoints pedidos; no se declara resiliencia completa de la matriz.**

## Prueba corta actual

[Informe](../artifacts/android-harness-short.json): passed=true. BOOT, LANDSCAPE, TOUCH, PURCHASE, RECEIVE, RECONNECT y STORAGE PASS. Desconexión intencional conserva exactamente el save, PID y target; se continúa hacia almacenamiento sin repetir compra. El último pase también recuperó pérdidas reales ADB/CDP antes del almacenamiento y finalizó.

[Eventos](../artifacts/android-session-events.jsonl), [log](../artifacts/android-harness-short.log), [caja actual](../artifacts/android-short-box.png).

## APK y matriz

Solo emulator-5554. APK sin modificaciones: SHA256 ecf985d8b54a4676d4fd2e9c55d7ad259876cc4e9815957b9d1929f1a13e8997. Sin nuevo build ni nueva instalación: mismo APK actual. No Meshy ni créditos.

| Prueba | Resultado | Evidencia |
|---|---|---|
| Prueba corta + reconexión + storage | PASS | android-harness-short.json |
| Sintaxis 3 herramientas QA | PASS | node --check de cada archivo, después de la última reparación |
| Matriz larga | NOT_VALIDATED | intento terminó bloqueado por ADB; otro intento se detuvo al atascarse antes de reparar timeout táctil |
| Preparaciones/servicio/limpieza | NOT_VALIDATED | No ejecución completa con helper final |
| Escaleras visuales/museo/concierto | NOT_VALIDATED | Sin nueva evidencia dedicada |
| Segunda ronda/save/force-close/recovery | NOT_VALIDATED | No ejecución completa |
| Rendimiento 4 clientes | NOT_VALIDATED | Sin ventana controlada |
| Rendimiento 10 clientes | NOT_VALIDATED | Sin ventana controlada |
| Rendimiento 17 clientes | NOT_VALIDATED | Sin ventana controlada |
| Diez capturas actuales | NOT_VALIDATED | Solo caja renovada en prueba corta; conjunto aún incompleto |
| Android físico | NOT_VALIDATED | No hay dispositivo físico |

Tests y TypeScript previos: 65/65 y PASS, no repetidos al cambiar solo scripts QA. No se usa evidencia histórica de emulator-5580. No quedan runners activos. **QA NO FINALIZADO**. Pendiente terminar integración de checkpoints/reanudación larga y ejecutar/revisar la matriz completa.
