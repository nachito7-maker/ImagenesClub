# Remodelación visual — checkpoint 7 octubre 2026

**NO cumple todavía íntegramente el objetivo pixel-art 3D premium de la referencia.** Es un pase funcional guardado, no aceptación comercial final.

## Entregables
- [APK actualizado](../artifacts/imagenes-club-debug.apk), SHA256 `7c9b0f8eb372ccc6deb330a3ff743fd6a7ab3339ad70bf8e05f926417e057d41`.
- [Fuente Blender](../artifacts/imagenes-club-remodel.blend), pipeline [remodel-assets.py](../tools/remodel-assets.py).
- [Referencia](../artifacts/remodel-reference.png) preservada, no usada como fondo/textura de sala.
- Antes: capturas conservadas en artifacts/remodel-before (mezclan evidencia anterior web/Android; no comparación de condiciones equivalentes).
- Después: [entrada](../artifacts/production-captures/01-entry.png), [barra](../artifacts/production-captures/02-bar.png), [museo](../artifacts/production-captures/03-museum.png), [centro](../artifacts/production-captures/04-central.png), [escenario](../artifacts/production-captures/05-normal-stage.png), [concierto](../artifacts/production-captures/06-concert.png), [arriba](../artifacts/production-captures/07-upper.png), [caja](../artifacts/production-captures/08-box.png), [escaleras](../artifacts/production-captures/09-stairs.png), [noche](../artifacts/production-captures/10-busy-night.png). Todas regeneradas contra esta versión web; caja/escaleras producidas por polish-check y copiadas al conjunto.

## Cambios
- Profundidad visual ×1,35 por transformación de escena, manteniendo coordenadas de simulación/save. Proyección de UI y raycast compensados. Instancing transformado a espacio local para no escalar actores dos veces.
- Luz ambiental cálida, key/fill y exposición incrementadas; museo/bar más legibles.
- Blender MCP utilizado: copia aislada de escena existente, museo extendido con vinilos/glazing, mesas decorativas derechas, barra/vasos colgantes, pedales/micrófonos, peldaños con perfiles/luz, cojines/sconces superiores.
- DJ existente movido junto a barra; un único DJ en el registro del renderer. Ruta/simulación no reescrita.
- Dos GLB físicos de puerta con origen de bisagra, tres materiales cada hoja; rotación gradual reversible, sin sustituir ni desaparecer geometría durante abrir/cerrar.
- Personajes con curvas más densas, mandíbula/mejillas, pelo por mechones, manos/pulgares, costuras, bolsillos, botones y accesorios. Edades/identidades/rig existentes conservados.
- Ninguna generación Meshy nueva, cero créditos. Micrófono previo se conserva.

## Checks
| Prueba | Resultado | Evidencia |
|---|---|---|
| Tests | PASS 66/66, 65 originales conservados | nuevo test de puerta + suite completa |
| TypeScript | PASS | typecheck y build |
| Web build | PASS | npm run android ejecutó build web |
| Android build | PASS | APK 7,9 MiB aproximados |
| Browser/polish/stress | PASS | informes artifacts/browser-validation.json, polish-validation.json, stress-validation.json |
| 17 clientes web | PASS:17 servidos,0 perdidos,0 violaciones bebida→actividad | stress audit |
| Rendimiento web 1280×720 | 16,7 ms mediana / 18,4 ms p95,188 calls,621892 triángulos | stress-validation.json |
| Instalación emulator-5554 | PASS install -r y arranque nuevo proceso | APK actual |
| Boot/landscape/touch/compra/recepción/caja/storage/reconnect Android | PASS | android-harness-short.json con hash actual |
| Puerta Android final | PASS apertura/cierre de dos hojas mediante touch, geometría persistente | remodel-final-android.json, remodel-final-doors-open.png, remodel-final-doors-closed.png |
| DJ único / propietaria Android final | PASS registro=1, DJ x6,08, propietaria en x5,58/z4,45 y edades correctas | remodel-final-android.json |
| Hash instalado / landscape / fullscreen | PASS hash idéntico al APK final, 923×411 y barras ocultas | remodel-final-android.json, remodel-final-window.txt |
| Preparación / servicio | PASS minijuego de Gin·tonic y recepción de bebida por grupo | remodel-final-android.json; no acredita las cinco categorías |
| Museo / concierto funcional | PASS cliente con bebida detenido en look, banda=3 músicos y 4 beams, sin violaciones de actividad antes de bebida en audit capturado | remodel-final-android.json y capturas finales |
| Escaleras | PASS llegada lógica superior; NOT_VALIDATED continuidad física subida/bajada | remodel-final-android.json |
| Save / force close / recovery | PASS igualdad exacta de todos los campos de game.save, nuevo PID 22652 frente a 21859 | remodel-final-save-before.json / remodel-final-save-after.json |
| Planta de cámara persistente | NOT_VALIDATED: viewFloor no se guarda; planta de personajes sí incluida en igualdad | contrato de game.save |
| Rendimiento Android, ventana actual | Medido: 120 frames/38,14 s, 0 clientes, summary, DPR render1,5; mediana300ms, p95 733,3ms,87 frames>33,4ms,141 calls | remodel-final-frame-window.json; no PASS de presupuesto Android ni comparación 4/10/17 |
| Android físico | NO VALIDADO | solo emulador |

## Límites críticos
- Referencia mucho más rica: personajes siguen estilizados procedurales, no rediseño pixel-art premium acabado. Se revisó el plano general, no se aprobó individualmente toda la galería ni close-ups de los cuatro personajes.
- El suelo sigue mostrando bloques oscuros y el acabado/microdetalle no iguala la referencia. No se completó la corrección de esta crítica visual.
- Profundidad renderizada, no ampliación de rutas/tiempos simulados. Dos nuevas mesas derechas son decorativas, no nuevos recursos de gameplay. El pasillo DJ no fue validado por trazas específicas y la manipulación de vértices de estación requiere revisión close-up.
- Escaleras continúan con dos representaciones separadas: no acreditan continuidad física sin salto entre plantas. La escena Blender guarda medidas lógicas; profundidad ×1,35 ocurre en renderer.
- Última ventana Android del hash final: 0 clientes en resumen, 120 frames, mediana300ms/p95 733,3ms,141 calls; **no cumple una experiencia Android fluida en este emulador**. La medición es actual y no acumulada, pero no diagnostica la causa ni sustituye pruebas físicas/4-10-17. Carga web ~622k triángulos; faltan optimización y mediciones equivalentes.
- Chunk Three.js >500 KB; APK debug; sin teléfono físico; audio sintético intacto.
- Se revisaron capturas Android finales de puerta abierta, museo y concierto en una galería real. La puerta abierta es visible, pero la composición y los personajes aún parecen prototipo; burbujas grandes ocultan el museo. La revisión NO acepta el objetivo premium. La captura de museo es encuadre general, no prueba de todos los hero a escala correcta. Galería: tools/remodel-gallery.html.

No se eliminaron tests, gameplay ni se creó demo paralela. La remodelación y QA completos permanecen pendientes.
