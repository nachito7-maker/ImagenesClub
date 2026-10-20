# IMÁGENES CLUB — Museo del Rock Valenciano

## Puesta en marcha

```bash
npm install          # Node 20+; instala ffmpeg-static para codificar la música
npm run dev          # http://127.0.0.1:5291
npm test             # 84 tests
npm run build        # web en dist/
npm run android      # APK debug en artifacts/imagenes-club-debug.apk
npm run music        # regenera los 100 temas (masters WAV -> Ogg/Opus) y los verifica
```

Los 100 temas se sirven en **Ogg/Opus** (28 kbps mono, 24 kHz): 37 MB en lugar de los 358 MB de los masters WAV, con el APK en 44 MB. Ver [catalogo-musical.md](docs/catalogo-musical.md).

`artifacts/` **no está versionado**: contiene masters WAV, APKs, capturas y logs de verificación, todos regenerables con los comandos de arriba. Los enlaces a `artifacts/…` de este README apuntan a esos archivos locales.

## Último checkpoint: remodelación visual

[Informe actual y límites](docs/remodel-validation.md) · APK remodelado: `artifacts/imagenes-club-debug.apk` · Escena Blender: `artifacts/imagenes-club-remodel.blend`.
84 tests pasan; builds web/Android correctos. **El objetivo visual premium y la validación Android completa aún no están cerrados.** Las secciones siguientes corresponden al pase anterior y sus métricas no acreditan este APK.

## Entrega actual de polish — 7 octubre 2026

- [APK Android debug actualizado](artifacts/imagenes-club-debug.apk)
- [Capturas de producción (10)](artifacts/production-captures/)
- [Validación Android](artifacts/android-validation.json)
- [Validación de carga web](artifacts/stress-validation.json)
- [Escena hero Blender](artifacts/imagenes-club-hero.blend)
- [Escena de polish Blender](artifacts/imagenes-club-polish.blend)

La iteración mantiene la arquitectura, la IA, el flujo de bebida antes de actividad, save/load y los tests existentes. El visual se ha reforzado en barra, museo, escenario, mobiliario, memorabilia y objetos musicales. La escalera conserva el cambio de planta atómico para la simulación, pero ahora usa poses visuales interpoladas y thresholds coherentes con la conversión Blender → glTF/runtime.

## Verificación medida

- **84 tests Vitest**: pasan (incluye catálogo, estribillos, capacidad de la lista y juego).
- **TypeScript**: `npm run typecheck` pasa.
- **Build web**: `npm run build` pasa; queda el aviso esperado de chunk Three.js >500 kB.
- **Checks Chromium**: browser-check, polish-check y stress-check pasan sin errores JS.
- **Carga web**: 17 clientes, 17 servidos, 0 perdidos, 0 violaciones de actividad antes de bebida; mediana 16,7 ms, p95 18,3 ms, 151 draw calls.
- **APK**: `npm run android` pasa; artefacto generado en `artifacts/imagenes-club-debug.apk`.
- **Emulador Android actual (`emulator-5554`)**: APK instalado y arrancado; comprobados landscape, touch CDP, cambio de planta, compra, recepción y almacenamiento. La validación completa falló primero por una carrera en la selección del pedido y después por timeout con campaña en resumen. Preparación, limpieza, rendimiento y recuperación completa del APK actual **no están revalidados**. [android-validation.json](artifacts/android-validation.json) es evidencia histórica de otro APK en `emulator-5580`, no un pase de esta versión.

## Assets y herramientas

- **Blender MCP**: escena hero inspeccionada y exportada; guitarra eléctrica con pickguard y controles frontales corregidos, amplificadores y cafetera integrados. Se actualizó también `tools/hero-assets.py` para reproducir los detalles.
- **Meshy**: generación exitosa de un micrófono de escenario/memorabilia con `meshy-6-lite`, 2.000 polígonos objetivo, GLB descargado a [meshy-microphone.glb](public/assets/models/meshy-microphone.glb), **5 créditos consumidos**. Balance conocido antes de la tarea: 4549; no se hicieron variaciones.
- La escena runtime carga el micrófono como pieza destacada del museo sin reemplazar los assets existentes.

## Evidencia visual

Hay diez archivos de captura, pero solo ocho se regeneraron en esta sesión. Caja y escaleras son evidencia anterior. Se revisó el encuadre general en el navegador; **no se completó la revisión individual ni la comparación antes/después de las diez escenas**.

## Limitaciones restantes

- No hay validación en teléfono físico.
- Los personajes siguen siendo low-poly procedurales y el audio es sintético local.
- El flujo Android completo de concierto/museo con 17 clientes no está cubierto por el script Android; sí hay cobertura web/stress.
- Las escaleras pasan las pruebas de thresholds y persistencia, pero usan representaciones separadas: **no se ha demostrado continuidad física completa sin saltos**.
- El chunk Three.js supera 500 kB; no bloquea el build, pero queda como oportunidad de code splitting.
- El APK es debug, no release firmado para distribución.
