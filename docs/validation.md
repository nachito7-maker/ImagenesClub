# Validación ejecutada

> Historial de la primera versión. El pase posterior y las mediciones vigentes están en [polish-validation.md](polish-validation.md); este documento conserva el baseline, no representa el APK actual.

## Resultado funcional
- TypeScript estricto: correcto.
- Vitest: **56 tests correctos** (35 simulación + 21 identidad/animación).
- UI Chromium touch: compra → recepción → apertura → almacenamiento; selección de concierto; entrada; pedido; preparación por pasos; transporte; servicio; consumo; cierre; swipe de limpieza; día siguiente; recarga y guardado. Sin errores JS.
- Noche completa con 17 clientes simultáneos: mesas + barra, grupos, baile, vitrina y visita superior. 17 atendidos, cero actividades antes de recibir bebida. Ingresos 116 €, propinas 10,82 €, gastos 62 €, balance +64,82 € en la última medición (aleatoriedad/timing del navegador puede variar rondas).
- Build Android debug: correcto. APK instalado y arrancado en emulador `emulator-5556`, offline mediante recursos APK.
- Android ADB taps: entrada, cambio de planta, bodega, cantidades, compra, recepción, apertura, organización, apertura de puertas, pedido y minijuego de bebida.
- Android ADB swipes: cámara y limpieza.
- Guardado conservado tras `am force-stop` y reapertura del APK. Campaña y fase nocturna recuperadas.
- No se publicaron cambios ni se hicieron commits.

## Mediciones
### Chromium macOS, 1280 × 720, 17 clientes simultáneos
- 60 FPS; frame mediano **16,7 ms**, p95 **17,4 ms** (180 frames).
- **121 draw calls**, 124.324 triángulos, heap JS ~35,4 MB.
- Instancing de actores: escena vacía pasó de **145 a 54 draw calls** en medición antes/después del batch (antes de decoración final). No se afirma mejora de FPS: ambos casos estaban limitados a 60 FPS.
- Escena decorada final añade neón, sombras y luces; no comparar su coste como si fuese la misma escena del benchmark de batching.

### Android emulado
- Viewport CSS 914 × 411, DPR 2,625, render limitado a 1,5.
- La última medición tras completar servicio/limpieza: 59 FPS, frame mediano 16,7 ms, p95 16,8 ms; **sin clientes activos en esa ventana**. No es una prueba Android de carga máxima.
- PSS proceso de app ~115.597 KB. No incluye necesariamente toda la memoria GPU/proceso renderer.
- Captura previa con seis clientes: 60 FPS, 112 draw calls, 89.814 triángulos; p95 33,4 ms en la ventana instrumentada.
- No se probó un dispositivo físico; no se certifican 60 FPS en móviles reales.

## Evidencia
- `artifacts/browser-validation.json`
- `artifacts/stress-validation.json` (incluye auditoría completa)
- `artifacts/android-validation.json`
- `artifacts/android-memory.txt` y `android-window.txt`
- Capturas `web-day.png`, `web-busy.png`, `web-concert.png`, `web-upper.png`, `web-cellar.png`, `web-summary.png`.
- Capturas nativas `android-day.png`, `android-night.png`, `android-upper.png`, `android-cellar.png`.
- Render Blender `blender-ground.png`; fuente `imagenes-club.blend`.

## Problemas corregidos durante pruebas
- Nodos de materiales Blender localizados por tipo, no nombre dependiente del idioma.
- Exportación limitada a escena activa; ningún asset previo incorporado.
- Conexiones de superficie de materiales y colores lineales corregidos.
- Menor overhead de personajes mediante instancing de piezas articuladas.
- Click/tap perdido por recreación periódica del DOM: cachés de contenido mantienen botones estables.
- Grupos no pueden iniciar actividad superior antes del servicio; reservan plaza arriba y liberan mesa inferior.
- Segunda ronda vuelve al puesto de servicio; se factura solo lo efectivamente servido.
- No atravesar obstáculos con fallback directo cuando falla avoidance.
- Botones contextuales, logo legible, texturas y cámara horizontal reajustados con capturas reales.

## No es aceptación final completa
El APK es jugable y testeado, pero quedan mejoras artísticas y funcionales documentadas en `acceptance.md`: calidad/densidad visual objetivo, ascenso continuo, cajas manipuladas con animación, audio ambiente más completo, contenido documental, campaña más rica y pruebas físicas. El único aviso del build web es el tamaño del bundle de Three.js; no se ha ocultado.
