# Mezcla de estribillos de Vicente

El selector no pide un número fijo: **la duración de la noche decide cuántos temas caben**. Antes de abrir se cargan y decodifican los audios elegidos. Si falta alguno o su corte no es válido, se muestra el error y el pub no abre.

El catálogo ya trae los **100 audios y los 100 cortes** de los temas originales del club (CC0), en Ogg/Opus (36,6 MB en total), así que hoy funciona sin configuración. Esta página explica cómo sustituir los audios si algún día quieres poner tus propios archivos.

## Cuántos temas caben

La noche se reparte en partes iguales, una por tema, y cada parte tiene que dar cabida al estribillo completo más el fundido de entrada del siguiente:

```
cabida = noche / (corte más largo + fundido)   →  redondeado hacia abajo
```

Con el catálogo entregado el corte más largo son **15,5 s** y el fundido **3 s**, así que cada tema necesita **18,5 s**:

| Duración de la noche | Temas que caben | Tiempo por tema |
| --- | --- | --- |
| 120 s | 6 | 20 s |
| 180 s | 9 | 20 s |
| **300 s (estándar)** | **16** | **18,75 s** |
| 420 s | 22 | 19,1 s |
| 600 s | 32 | 18,75 s |
| 900 s | 48 | 18,75 s |

Antes de este cálculo la lista estaba fijada en 10 temas, así que una noche de cinco minutos desaprovechaba casi seis estribillos. Se puede elegir **de 1 a la cabida**: con menos temas cada uno suena más rato. La fórmula vive en `playlistCapacity()` ([src/core/music.ts](../src/core/music.ts)) y la usan tanto el juego como el selector.

## Archivos necesarios

Coloca los audios que tengas autorización para usar en `public/assets/music/` y edita `choruses.json` en esa carpeta. Cada clave es el ID del catálogo, y sus tiempos son segundos dentro del audio real. Cualquier formato que el navegador decodifique sirve (Ogg/Opus, MP3, M4A, WAV): el juego no impone contenedor, solo que el archivo exista y el corte quepa dentro.

```json
{
  "track-001": {
    "file": "/assets/music/track-001.ogg",
    "start": 39.02,
    "duration": 15.37
  }
}
```

Los valores anteriores son los reales de `track-001` en el catálogo entregado: el estribillo empieza a los 39,02 s y dura 15,37 s. Si cambias el audio, vuelve a marcar su estribillo. Los cortes actuales van de 7,4 a 15,5 segundos y hay 94 distintos entre los 100 temas, así que la mezcla no suena siempre al mismo punto.

## Comportamiento

- Un intervalo igual por tema: en la noche estándar de 300 s con 16 temas, cada estribillo entra cada 18,75 s.
- Fundido de potencia constante de hasta tres segundos entre estribillos.
- El fragmento del estribillo se repite si su intervalo es más largo que el corte.
- El último continúa durante la última ronda hasta el resumen; el cierre temprano detiene la mezcla al finalizar la noche.
- Pausa, cambio de velocidad, segundo plano y reanudación siguen el reloj del juego, no temporizadores independientes.
- Velocidad ×2 también acelera el audio (no hay algoritmo de preservación del tono ni sincronización automática de BPM).
- Hasta dos voces simultáneas. Se decodifican los archivos seleccionados en memoria (16 en la noche estándar): se recomienda usar clips cortos, no cien canciones completas.

## Límites

- La mezcla no analiza el audio: usa los cortes declarados en el manifiesto.
- Hasta dos voces simultáneas; no hay beatmatching ni detección de BPM. A velocidad ×2 también cambia el tono.
- Las pruebas automatizadas usan además una señal de audio sintética como fixture de transporte.
