# Pase premium — estado verificable, 7 octubre 2026

**Iteración parcialmente completada. No aceptada como acabado premium final.**

## Entregables actuales
- [APK actual](../artifacts/imagenes-club-debug.apk), 9,2 MiB, SHA256 `4fb04b107b6a1745dce9cd46a29d2744551de34453d74b0005a7b05d7793e35b`.
- [Escena Blender](../artifacts/imagenes-club-premium.blend), incluye local y biblioteca modular.
- [Galería comparativa](../tools/premium-gallery.html).
- [Entrada](../artifacts/production-captures/01-entry.png), [barra/DJ](../artifacts/production-captures/02-bar.png), [museo](../artifacts/production-captures/03-museum.png), [centro](../artifacts/production-captures/04-central.png), [escenario](../artifacts/production-captures/05-normal-stage.png), [concierto](../artifacts/production-captures/06-concert.png), [superior](../artifacts/production-captures/07-upper.png), [noche](../artifacts/production-captures/10-busy-night.png).
- [Escalera planta baja](../artifacts/premium-captures/stairs-0-0.png), [escalera planta superior](../artifacts/premium-captures/stairs-0-1.png).
- [Perfil Android](../artifacts/android-profile.json), [intento de métricas finales](../artifacts/android-controlled-final.json).

## Cambios exactos
1. Tablones físicos de roble sobre la cimentación existente; juntas, distribución alternada, seis tonos cercanos y roughness variable. Textura de madera independiente, nunca la referencia. Tinte aclarado únicamente para el suelo; barra y mobiliario mantienen sus materiales. Los bloques de zonas ya no dominan el pavimento.
2. Nueve módulos de Blender (torso, rostro, manga, mano, pantalón, zapato, pelo, vestido corto y largo), GLB compartido integrado en rigs existentes. Personajes futuros y principales usan las mismas geometrías, preservando sus materiales, edades y animaciones. Los detalles/accesorios siguen combinándose en Three.js; no se generaron decenas de personajes únicos ni assets Meshy nuevos.
3. Una escalera física compartida de doce peldaños y descanso. Ambas vistas se derivan de un mismo recorrido world-space, conservando coordenadas lógicas y save. Hueco en forjado superior, exclusión navegable del hueco y retirada de componentes vegetales que lo invadían. Elevación por peldaño antes del avance, no rampa atravesando sólidos. Dos nuevos tests comprueban seis viajes por sentido y continuidad de posición incluyendo llegada.
4. Burbujas transparentes con iconos de 19 px, menos repetición y contador pequeño, posición más baja; hit area táctil de 44 px conservada. Siguen mientras el pedido está pendiente: **duración no reducida** para no ocultar pedidos sin resolver.
5. Seis vitrinas longitudinales adicionales: guitarras de geometría real, cuerdas, clavijas, vinilos, tickets, placas cronológicas, marcos y luz cálida. Fotos/carteles y cristales del museo existente se mantienen. No se atribuyen objetos a artistas reales sin documentación.
6. Instancing por geometría/material compatible con color por instancia. Conserva color y geometría de cada pieza: comparación web equivalente antes/después de esta edición: 249→163 draw calls con 497044 triángulos en ambos. No demuestra por sí sola mejora de FPS Android.
7. Puerta doble, único DJ junto a barra, propietaria, composición profunda, iluminación cálida y gameplay conservados. Sin reescritura del motor de simulación; cambios de navegación limitados a geometría/escalera y obstáculo del hueco.

## Verificación final del código
- TypeScript PASS y **68/68 tests PASS** (66 anteriores intactos + 2 nuevos).
- Browser check PASS: touch, minijuego, compra/recepción/almacenaje, limpieza, cambio de planta y persistencia.
- Polish check PASS: stock atómico y recorrido superior.
- Stress PASS: 17 clientes servidos, 0 perdidos, 0 errores y 0 violaciones bebida→actividad. Última ejecución web ~16,7 ms p50, ~17 ms p95; los valores exactos están en [stress-validation.json](../artifacts/stress-validation.json).
- [Prueba escalera web](../artifacts/premium-stairs-validation.json): seis trayectos, llegadas correctas, módulos Blender presentes. Esta fixture ejecuta moveAlong en pasos; no sustituye una prueba Android continua con touch ni una certificación de colisiones mesh→mesh.
- Web build PASS y Android Gradle PASS en la última cadena de verificación; warning de chunk >500 KB conservado, no silenciado.
- Instalación APK actual en emulator-5554: `install -r` Success y arranque de actividad. **Esto no equivale a todos los checks funcionales finales.**

## Android: resultados y validez
La primera medición no tuvo muestras: app en background y timeout de discovery. Otro intento obtuvo:

| Clientes | FPS | p50 ms | p95 ms |
|---|---:|---:|---:|
| 4 | 1,90 | 566,6 | 1400 |
| 10 | 1,11 | 850 | 1733,3 |
| 17 | 1,10 | 600 | 3400 |

Esos datos corresponden al **APK anterior**, y son **NO VÁLIDOS como comparación controlada**: una prueba Unity externa reapareció en el host. Se conservan solo para diagnóstico, no para declarar regresión/mejora.

Perfil diagnóstico anterior: renderer identifica `ANGLE / Vulkan / SwiftShader` (GPU software). Lógica p50 ~0,1 ms, UI ~0–0,3 ms, batch ~1 ms, mientras render normal consume centenares de ms. Al omitir render *solo temporalmente en la prueba*, ~52 FPS con p50 16,7 ms; render restaurado vuelve a ~1–1,5 FPS. Esto localiza el coste en renderizado/emulación, no justifica eliminar calidad ni cambiar lógica. El test restaura todos los métodos.

Intentos del APK actual: ADB daemon perdió conexión/reinició; otra app (`io.idolz.valenciaextramurs`) tomó repetidamente el foreground durante las ventanas, provocando CDP timeout/suspensión de frames. No se pararon procesos ajenos ni se modificó configuración del emulador. El harness de métricas invalida cambios de foco, pérdida de CDP y cantidad de clientes, y registra interferencias de tests/builds externos.

El harness corto del hash intermedio `b7f337...` pasó boot, landscape, touch 0→1→0, compra, recepción, stock/caja y reconexión. **No se reutiliza como pase del hash actual `4fb04b...`.** Último intento del hash actual: `CHECKPOINT_BOOT` BLOCKED_BY_HARNESS y restantes NOT_VALIDATED porque **emulator-5554 desapareció de ADB** durante la conexión. Evidencia exacta en [android-harness-short.json](../artifacts/android-harness-short.json). El informe [remodel-final-android.json](../artifacts/remodel-final-android.json) corresponde al hash intermedio y está bloqueado; no acredita el APK actual.

## Criterios pendientes explícitos
- **Aceptación visual premium NO cumplida todavía**: la referencia es mucho más rica en vestuario, rostros, tapizado, narrativa y microdetalle; los módulos nuevos mejoran formas pero todavía leen sencillos a distancia.
- Revisión individual de todos los personajes principales y variaciones completas de clientes; rig todavía usa detalles procedurales. No afirmar reemplazo artístico completo.
- Museo ampliado, pero aún requiere acabado más fino de exhibiciones y composición para acercarse a la referencia; geometría nueva parcialmente oculta por vitrinas previas.
- Desgaste localizado/reflejos del suelo no cuentan con máscara artística final dedicada; hay grano/variación, no un acabado completo de desgaste pintado.
- Escalera world-space y llegada comprobadas matemáticamente; falta prueba Android real de varias subidas/bajadas, colisiones de todos los sólidos y transición continua de cámara entre plantas. Las vistas siguen siendo aisladas por diseño existente.
- Carril DJ visible en capturas, pero sin traza específica de todos los tipos de actor.
- Métricas 4/10/17 **del APK final y sin interferencias** pendientes. Sin presupuesto Android aprobado, sin teléfono físico. No declarar speedup por datos inválidos.
- Door/service/museum/concert/save-force-close del APK final deben acreditarse en el informe del hash actual; checks bloqueados nunca se consideran PASS.
- Duración de burbujas de pedido permanece ligada al estado, no abreviada.

No se borraron tests ni funciones. Preview local continúa disponible; sin despliegue, commit ni push.
