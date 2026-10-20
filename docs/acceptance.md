# Criterios y alcance — Imágenes Club

## Referencias y entregables
- Referencias oficiales conservadas en `public/assets/references/plano.png` y `logo.png` sin rediseño.
- Juego nuevo Three.js/TypeScript, dos escenas jugables del local y bodega. No se ha importado arquitectura o código de otros juegos.
- APK instalable: `artifacts/imagenes-club-debug.apk`, identificador `es.imagenesclub.game`.
- Android: API 26+, landscape, WebView con WebGL acelerado, modo inmersivo, carga local HTTPS appassets y guardado local.
- Fuente Blender aislada: `artifacts/imagenes-club.blend`; scripts reproducibles y GLB optimizados por material.
- Capturas reales y informes JSON en `artifacts/`.

## Aceptación funcional verificable
1. Individual, pareja y grupo: reserva por capacidad, entrada conjunta, pedido, preparación, transporte, servicio, consumo, pago, propina, salida y suciedad.
2. Ninguna actividad principal antes de que **todos** los integrantes hayan recibido bebida. Auditoría comprobada durante noche completa.
3. Barra y mesas simultáneas, segunda ronda con nueva reserva de stock.
4. Baile, museo, concierto y visita superior tras bebida. La planta superior tiene mesas y servicio real; llegada por la derecha y baños.
5. Compra de día: carrito, coste, entrega, recepción, comprobación, apertura y almacenamiento en destino válido. Stock no disponible hasta organizar.
6. Limpieza con swipe, consumiendo suministros; liberación al finalizar.
7. Ocho bebidas con iconos distintos y preparación secuencial. Personal transporta bebidas: tocar no materializa servicio inmediato.
8. Dinero, stock, gastos, reputación, satisfacción, propinas, mejoras con efecto, cuatro eventos y campaña persistente.
9. Guardado de campaña y servicio activo; recuperación tras cierre forzado del proceso Android.
10. Personajes articulados animados, clientes modulares adultos de 31–71 años, DJ y propietarios diferenciados. Propietaria anclada al último taburete frontal.
11. Tap, swipe de cámara, pinch zoom y acciones contextuales. Sin requerir teclado, hover ni doble clic.
12. Audio local sintetizado: música, percusión, efectos de barra, pago y limpieza; silencio opcional.

## Estado y límites que impiden declarar el encargo íntegramente terminado
- La validación Android disponible es **emulador**, no un teléfono físico ni una matriz de dispositivos gama baja/media. Sus FPS no certifican rendimiento físico.
- La dirección artística es low-poly estilizada detallada, pero no alcanza la densidad, calidad de caras, variedad de mobiliario y acabado de la ilustración adjunta. Se conserva distribución conceptual, no reproducción literal.
- Las animaciones son procedurales articuladas, no clips profesionales capturados o rigs producidos en Blender. Varios gestos comparten poses base; no hay diálogo facial/lip sync.
- La subida usa navegación hacia escaleras, enlace entre escenas y navegación superior; falta animación continua de ascenso de peldaños.
- La bodega tiene avatar caminante; abrir/mover/organizar cajas usa acciones contextuales con stock real. Falta transporte manual animado de cada caja hasta su estante.
- DJ animado y banda en concierto; no existe una IA musical autónoma compleja, repertorio grabado o conversaciones naturales. Música y SFX son originales sintéticos.
- Fotos decorativas derivadas de la referencia artística son **ilustraciones**, no se presentan como fotografías históricas auténticas. No existe catálogo documental real del rock valenciano.
- Progresión de cinco mejoras funcionales; no incluye todavía todos los ejemplos opcionales de ampliación, bebidas desbloqueables ni una campaña narrada extensa.
- Meshy se inspeccionó, no se generaron modelos: Blender y personajes modulares locales proporcionaron coherencia y presupuesto sin necesidad de generación externa de pago.
- APK debug firmado automáticamente: instalable para pruebas, **no** publicación en Play Store ni build release firmado con identidad del titular.
- No hay aceptación automática del estándar subjetivo «no parecer prototipo»: sigue pendiente un pase artístico y de contenido amplio.

No marcar todos los requisitos como cumplidos mientras estos límites permanezcan.
