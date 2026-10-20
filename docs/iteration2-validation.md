# Iteración 2 — resultados reales

## Cambios
- Entrada de escaleras alcanza el umbral exacto antes de iniciar ascenso: evita salto desde el último nodo aproximado de A*. Dos tests adicionales, anteriores intactos.
- Mesas con variación de servilletas, botellas, vasos y pequeñas cajas; fregadero, escurridor, grifo y paño de barra; memorabilia adicional en vitrina. Geometría agrupada por materiales existentes, sin nuevas llamadas de dibujo.
- Variación de proporciones faciales y gestos de conversación/pago.
- Sombras de contacto estáticas solo se actualizan al cambiar planta; vasos sucios solo cuando cambia la suciedad. Personal no se re-adjunta a la escena cada frame.
- Corregida la firma de waitForFunction en validación Android: los timeouts iban como argumento de página, no como opciones. Se mantiene la aserción de mesa realmente sucia; se acelera simulación, no se fabrica suciedad.

## Verificación de versión final
- 61 tests pasan (59 conservados); TypeScript y builds web/Android correctos.
- Regresión Chromium y pruebas específicas cajas/escaleras pasan.
- Noche completa de 17 clientes: 17 servidos, sin actividades antes de recibir bebida; barra, mesas, baile, museo y upstairs.
- Web 1280×720: 144 calls, 132.424 triángulos, mediana 16,7 ms / p95 18,2 ms, heap ~35,7 MB. No mejora de timing medible respecto al baseline.
- Android emulator-5580: compra, recepción, caja colocada antes de stock, preparación, servicio, limpieza touch, cambio de planta, swipe y force-stop/recuperación pasan. Cero errores JS.
- Ventana Android con 4 clientes: 129 calls, 90.154 triángulos, mediana/p95 16,7 ms, PSS 141.859 KB. No se atribuye la diferencia frente a 50 ms a optimización: carga y estado del host diferentes.
- APK assets idénticos a dist. 7.493.434 bytes, SHA256 a1658a9dfa0d088fb055607b3ed318569e90b552d28fd41de3c00e69b0e54e27.
- Validado en emulador; rendimiento físico pendiente. Touch inyectado en WebView vía CDP, no teléfono real.

## Evidencia
[Baseline](../artifacts/iteration2-before.png), [concierto](../artifacts/web-concert.png), [local ocupado](../artifacts/web-busy.png), [escaleras](../artifacts/polish-stairs.png), [caja](../artifacts/polish-box-carry.png), [Android noche](../artifacts/iteration2-android-night.png).

## Criterio de finalización: NO cumplido
Esta es una mejora incremental, no el cierre del objetivo comercial. La continuidad completa entre representaciones de escaleras sigue pendiente; no se ha producido nueva fachada, catálogo documental auténtico, audio local grabado ni nuevos assets profesionales de personajes. No se completó la matriz Android de concierto/museo/carga máxima/stock bajo ni las diez capturas específicas solicitadas. No se utilizó Blender/Meshy en esta iteración. No presentar estos requisitos como realizados.
