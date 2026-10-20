# Menú de inicio — entrega y validación

## Entregables
- [APK actualizado](../artifacts/imagenes-club-menu-final.apk) — 9,2 MiB, SHA256 `53495808aea2ceb5c622c989a42c3b91aaa140601ec006976e9ebc1877c10804`.
- [Captura real Android Img](../artifacts/menu-captures/menu-img-final.png).
- [Captura landscape móvil](../artifacts/menu-captures/menu-854x393.png), [tablet](../artifacts/menu-captures/menu-1280x800.png), [móvil compacto](../artifacts/menu-captures/menu-740x360.png).
- [Galería antes/después](../tools/menu-gallery.html), usando [captura original](../artifacts/menu-before.png).

## Cambios
- Nueva composición asimétrica: identidad/rótulo a la izquierda, local 3D real protagonista a la derecha. Sin tarjeta central ni ilustración sustitutiva.
- Logo oficial intacto: [original](../public/assets/references/logo.png) conservado y [derivado UI transparente](../public/assets/references/logo-ui.png) recortado sin redibujar ni remuestrear. La recomposición del derivado sobre negro coincide exactamente, píxel a píxel, con el recorte original RGB. 92433 píxeles totalmente transparentes; bordes conservados mediante alfa de luminancia.
- Rótulo de madera con iluminación cálida y herrajes gráficos; logo blanco sin caja negra.
- Título «La noche empieza contigo.» y frase exacta **Un local, un tributo, una historia**.
- Botón **ENTRAR AL CLUB**, área táctil de al menos 52 px en las resoluciones verificadas, respuesta de iluminación/escala al presionar, sin hover ni doble toque.
- Continuar campaña discreto cuando ya corresponde al estado existente; no se añadieron funciones de reset ni nuevas reglas.
- Cámara exclusiva del menú, restaurada al entrar. Desenfoque leve de 0,45 px, no blur global de 6 px. Museo, escenario, pista, barra/DJ y entrada reconocibles.
- Diez figurantes visuales modulares, animación del único DJ y luces sutiles. Figurantes independientes de Game: no generan pedidos, pagos, cambios de economía ni guardado. Se ocultan al entrar. Movimiento reducido respetado en estas animaciones de menú.
- Sin cambios a src/core/game.ts, navegación, recetas ni simulación durante el rediseño de menú. Sin Meshy ni nuevos créditos.
- Harness Android selecciona **por nombre Img**, no por serial fijo. F1, PRO y GTA no se usaron para instalar/probar el juego ni se detuvieron.

## Validación del código final
| Check | Resultado |
|---|---|
| Tests | **PASS 68/68**, 66 anteriores conservados; [log](../artifacts/menu-tests-final.log) |
| TypeScript | PASS |
| Menú web 960×540, 854×393, 1280×800, 740×360 | PASS touch, textos, campaña congelada y save/load; [informe](../artifacts/menu-validation.json) |
| Regresión de juego web | PASS compra, recepción, almacenaje, minijuego, servicio, cambio de planta, limpieza, persistencia y gesto; [informe](../artifacts/browser-validation.json) |
| Web y Android build | PASS; [log](../artifacts/menu-final-build.log), [exit real 0](../artifacts/menu-final-checks.exit) |
| Logo técnico | PASS reconstrucción exacta sobre negro, original intacto |

La suite paralela sufrió timeouts de 5 s bajo carga externa (otros emuladores y builds Unity). La ejecución final con un worker, sin aumentar timeouts ni cambiar assertions, pasó 68/68. No se suprimieron tests.

## APK final en Img
Instalación `install -r` Success. Primer intento del **hash final** acreditó:
- boot/carga y SHA256 instalado idéntico;
- landscape 914×411 CSS px;
- frase exacta y logo UI transparente;
- único DJ y diez figurantes;
- menú sin modificación de campaña durante la ventana;
- toque real de ENTRAR AL CLUB con salida del modo menú.

Evidencia: [primer intento](../artifacts/menu-img-first-attempt.json), [menú Android](../artifacts/menu-captures/menu-img-final.png), [entrada Android](../artifacts/menu-captures/entry-img-final.png).

**Save/load tras force-stop Android: NO VALIDADO.** Tras reiniciar la app, Img dejó de responder en ADB/QEMU. El siguiente arranque acabó con ANR de System UI y WebView sin socket. Se conservan [último intento](../artifacts/menu-img-validation.json), [eventos](../artifacts/menu-img-events.jsonl) y [crash previo del sistema](../artifacts/img-system-crash.txt). No es un PASS ni una conclusión de fallo de la lógica del juego. Save/load sí pasa en las cuatro pruebas web.

## Cierre del pase premium anterior
El trabajo/artifacts anteriores están preservados en [premium-validation.md](premium-validation.md) y [escena Blender](../artifacts/imagenes-club-premium.blend). Se reintentó su validación en Img. **No puede considerarse terminada íntegramente**:
- [Métricas finales 4/10/17](../artifacts/img-final-metrics.json): sin muestras válidas por ANR de sistema y WebView no disponible. No se reutilizan valores de otro AVD ni APK.
- Regresión Android completa puerta/servicio/museo/concierto/escalera física y force-stop sigue pendiente; la evidencia web no la sustituye.
- El acabado premium completo de personajes/museo y restantes límites artísticos siguen explícitos en el informe anterior.

Se probaron backends auto, SwiftShader y host sin Vulkan únicamente en Img, sin bajar resolución, personajes ni calidad del juego. No se modificó la configuración persistente del AVD ni se borraron datos. El arranque que produjo la captura Android usa host sin Vulkan; después se reprodujo un bloqueo QEMU. No se afirma rendimiento fluido Android.

El **rediseño visual del menú está entregado**; la **aceptación técnica Android completa y el cierre premium anterior permanecen parciales por los bloqueos indicados**.
