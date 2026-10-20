# Catálogo del club · 100 temas originales

Banda sonora propia de *Imágenes Club*: **100 temas instrumentales originales**, creados para este proyecto y sin derechos de terceros. Sustituyen al catálogo anterior de canciones comerciales, que no podía usarse en una aplicación distribuible.

## Licencia

Los 100 temas y sus grabaciones se publican con **CC0 1.0 Universal** (dominio público). Se han sintetizado nota a nota desde código con [tools/generate-catalog.mjs](../tools/generate-catalog.mjs), sin samples, sin letras y sin melodías de terceros. Cualquier parecido con una obra existente es fortuito: las progresiones armónicas y los ritmos son genéricos del género.

## Cien temas distintos, no cien versiones del mismo

Cada tema tiene su propia ficha de producción (**100 arreglos, uno por tema**, ninguno repetido). Lo que cambia de un tema a otro:

- **24 formas de canción**: clásica, corta, larga con solo, doble estribillo, himno con break, balada, progresiva, con pre-estribillo, estribillo primero, con coda, con tag final, con intro larga, en compás impar…
- **15 patrones de batería**: rock, medio tiempo, lento, punk, shuffle, bailable, four-on-the-floor, ska, Motown, boogie, bossa, garaje, galope y breakbeat, con redobles y fills distintos.
- **12 formas de acompañar los acordes**: guitarra apagada, acorde abierto, skank, stabs, arpegio de corcheas y de semicorcheas, órgano sostenido, órgano empujado, piano sincopado, blips de sintetizador, notas tenidas y piano a contratiempo.
- **12 líneas de bajo**: raíces, corcheas, conducción, caminante, octavas, pulso de sintetizador, funk, semicorcheas, negras caminantes, con puntillo, riff y a contratiempo.
- **10 voces de melodía**: guitarra pulsada, gancho, himno, stabs, onda cuadrada, saw lead, campana, flauta, lengüeta y guitarra apagada.
- **8 tipos de intro**: riff solo, arpegio, redoble de batería, pad, bajo solo, órgano, stabs o entrada a media banda.
- **40 progresiones** de cuatro acordes (20 menores y 20 mayores), de las que cada tema usa una, y **6 escalas**, incluidas frigia y mixolidia.
- **Tempos de 93 a 140 BPM**, con swing en algunos temas y batería acústica o de máquina.
- **De 22 a 26 capas sonando en cada tema**, sacadas de una veintena de voces sintetizadas: guitarra pulsada y apagada, guitarra de jazz, bajo, bajo de sintetizador, órgano, piano, piano eléctrico, cuerdas, metales, trompeta con sordina, armónica, flauta, lengüeta, campana, xilófono, pad, arpegio y coros.

La forma y el estilo de cada tema se reparten con un algoritmo determinista que evita repeticiones: ninguna pareja forma + estilo aparece dos veces y dos temas seguidos nunca comparten forma.

## Qué hay por tema

Cada tema es una canción completa con partes distintas, no un bucle:

- **Intro, estrofas, estribillo, puente o break, solo y outro** según su forma. El estribillo siempre es la parte más fuerte: medido sobre el audio final, suena de media un **73 % más** que la estrofa y nunca menos de un **37 %**.
- **Melodía propia**: un compás rítmico y un contorno (arco, ascendente, descendente, onda, sierra, valle, escalón) elegidos por la semilla del ID.
- **Dinámica real**: intro suave, estrofas que crecen, break que se vacía, solo que vuelve a subir y outro que se apaga.

| Elemento | Valor |
| --- | --- |
| Formato que se envía | **Ogg/Opus** mono, 24 kHz, VBR ~28 kbps |
| Formato de los masters | WAV mono, 22 050 Hz, 16 bits en `artifacts/masters/` |
| Duración | 53–134 s por tema (47 duraciones distintas) |
| Tamaño del audio | **36,6 MB** en `public/assets/music/` (los masters WAV ocupan 358 MB) |
| Tamaño del APK | **44 MB** (antes 365 MB) |
| Volumen | RMS 0,112 en todos los temas, sin clipping ni offset de continua |
| Cortes | `public/assets/music/choruses.json` (94 cortes distintos de 100) |

## Regenerar y comprobar

```bash
npm run music   # las cuatro etapas de abajo, en orden
```

Equivale a:

```bash
node tools/generate-catalog.mjs   # masters WAV en artifacts/masters, choruses.json y catalog-recipes.json
node tools/encode-music.mjs       # 100 .ogg Opus en public/assets/music (lo que se envía)
node tools/analyse-catalog.mjs    # mide la variedad real sobre los masters
node tools/encode-check.mjs       # decodifica los Opus y los compara con los masters
```

`encode-check.mjs` comprueba que la codificación no cambia la música: volumen idéntico (≤ 0,02 dB), banda de 8–11 kHz intacta (≤ 0,03 dB), duración sin deriva y una relación señal/ruido mínima de 12 dB en los 100 temas. El informe queda en `artifacts/encode-check.json`.

Para bajar todavía más el tamaño: `MUSIC_BITRATE=20k node tools/encode-music.mjs` (audio ~26 MB) o comprimir los modelos 3D, que son los otros 14 MB del paquete.

`analyse-catalog.mjs` lee el audio generado y comprueba:

- los 100 perfiles de volumen son únicos y los 100 timbres (cruces por cero + reparto de bandas) también;
- cada estribillo es al menos un 10 % más fuerte que sus estrofas, comparando por secciones;
- hay 94 cortes distintos de estribillo, 47 duraciones distintas y ninguna ventana silenciosa;
- los 100 arreglos son únicos, con las 24 formas repartidas y 25 o más tempos distintos.

El informe queda en `artifacts/catalog-variety.json` y falla con código de salida 1 si algo se repite.

El generador es determinista: cada tema usa una semilla derivada de su ID y el reparto de formas no usa azar, así que volver a ejecutarlo produce exactamente los mismos archivos y los mismos cortes.

## Cómo suena

Tres regiones con instrumentación y tempo propios, como un pub con memoria:

- **Valencia** (21 temas): rock de guitarras con órgano, coros de "woah", armónica y tempos altos.
- **España** (60 temas): pop-rock, power pop y rock urbano con arpegios, palmas, trompeta con sordina y guitarra de jazz.
- **Internacional** (19 temas): synth-pop, new wave, disco y indie con pads, saw leads, campanas y flauta.

Los estribillos suben de intensidad: melodía una octava arriba, coros en las armonías, bajo detrás y un color distinto por tema (metales, arpegios, campanas, cuerdas, palmas o xilófono). Así el remix se reconoce como cambio de canción.

## Uso en el juego

El selector del DJ ofrece los 100 temas con filtro por región. Cada noche se eligen tantos temas como caben en su duración (16 en la noche estándar de 300 s: cada estribillo necesita 15,5 s de corte más 3 s de fundido) y Vicente mezcla sus estribillos con fundidos durante el horario del pub. Los IDs `track-001`...`track-100` se mantienen estables y son los mismos que usa `choruses.json`.

Ver [docs/chorus-remix.md](chorus-remix.md) para el formato de los cortes y [docs/listado-canciones.md](listado-canciones.md) para el listado completo.
