# Validación de polish visual — 7 octubre 2026

## Cambios verificados

- Barra con botellas, estanterías, cristalería, cafetera, grifo, hielo, frigorífico y luces cálidas.
- Museo integrado en pared con perfiles, plintos, placas, discos, retratos ilustrados, guitarras y memorabilia.
- Escenario con logo, cortinas, amplificadores, monitores, mesa DJ, platos, mixer y luces; el modo concierto conserva servicio y baile.
- Hero Blender actualizado con guitarra eléctrica, controles/pickguard orientados a la cara visible, amplificadores y cafetera.
- Micrófono de memorabilia generado por Meshy y cargado como GLB adicional del museo.
- Escaleras: thresholds actualizados a las coordenadas reales del runtime; interpolación temporal de altura/recorrido en ambas direcciones, con save/load de progreso y cambio de planta atómico.

## Verificación

- 65 tests Vitest pasan.
- TypeScript y build web pasan.
- `browser-check`, `polish-check` y `stress-check` pasan sin errores JS.
- Stress web: 17 clientes, 17 servidos, 0 perdidos, 0 violaciones de bebida antes de actividad; mediana 16,7 ms y p95 18,3 ms.
- APK reconstruido correctamente.
- APK actual instalado en `emulator-5554`: landscape, touch CDP, compra, recepción, almacenamiento y cambio de planta comprobados. La prueba completa falló por una carrera del script y, en el reintento, timeout en campaña resumen. No se revalidaron preparación, limpieza, rendimiento ni recuperación completa de esta versión. El informe `android-validation.json` corresponde a una versión anterior en `emulator-5580`.
- No se afirma prueba en teléfono físico.

## Capturas

Ocho capturas regeneradas en esta sesión. Los archivos de caja y escaleras son anteriores. Se revisó únicamente el encuadre general en navegador; la revisión individual de diez escenas y la comparación antes/después siguen pendientes.

## Meshy

Tarea `01a116eb-db19-7263-82a1-7cfc01064b22`, micrófono de escenario, `meshy-6-lite`, GLB, 5 créditos consumidos. No se repitió generación ni se gastaron créditos en variantes.

## Límites

Personajes low-poly procedurales, audio sintético, APK debug, sin teléfono físico. El concierto/museo a carga máxima está cubierto por Chromium, no por el script Android. La continuidad completa de escaleras no está demostrada: las dos plantas siguen usando recorridos visuales separados. Pasar los tests de extremos no acredita una conexión física sin saltos. La iteración está incompleta respecto al criterio comercial y a la regresión Android solicitada.
