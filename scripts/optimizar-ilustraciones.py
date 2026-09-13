"""Convierte las ilustraciones de origen a WebP del tamaño en que se pintan.

## Por qué esto existe

Las ilustraciones llegan como PNG de ~1,1 MB cada una, a 1448 px de ancho. En
pantalla se pintan a 200–320 px. Subir el original al repositorio significa:

- **11 MB en el paquete** que descarga cada visitante, para pintar 300 px.
- **11 MB en el historial de git, para siempre.** Un binario no se borra: aunque
  mañana se reemplace, la versión vieja sigue en cada clon del repositorio.

Convertidas a WebP al ancho real quedan en decenas de KB. El original se queda
donde está —fuera del repositorio— como archivo maestro.

## Uso

    python scripts/optimizar-ilustraciones.py <carpeta-origen>

Escribe en `src/assets/ilustraciones/` con nombres estables en kebab-case, que
son los que importa el código. Es idempotente: volver a ejecutarlo reescribe.

## Por qué WebP y no AVIF

AVIF comprime algo más y lo soportan los navegadores actuales, pero el ahorro
sobre WebP en estas ilustraciones planas es marginal y WebP tiene soporte
universal desde hace años — incluido el Safari de los teléfonos con los que se
va a abrir el recorrido público, que es justo el público que no se puede dejar
fuera por una decisión de compresión.
"""
from __future__ import annotations

import sys
from pathlib import Path

from PIL import Image

#: Ancho al que se guarda. El doble del mayor tamaño en que se pinta (320 px),
#: para que se vea nítida en pantallas de densidad doble y ni un píxel más.
ANCHO_MAX = 640

#: 82 es donde estas ilustraciones dejan de ganar calidad visible por peso.
CALIDAD = 82

DESTINO = Path(__file__).resolve().parent.parent / "src" / "assets" / "ilustraciones"


def convertir(origen: Path, nombre: str) -> tuple[int, int]:
    """Devuelve (bytes antes, bytes después)."""
    antes = origen.stat().st_size
    imagen = Image.open(origen).convert("RGBA")

    if imagen.width > ANCHO_MAX:
        alto = round(imagen.height * ANCHO_MAX / imagen.width)
        imagen = imagen.resize((ANCHO_MAX, alto), Image.LANCZOS)

    salida = DESTINO / f"{nombre}.webp"
    salida.parent.mkdir(parents=True, exist_ok=True)
    # `method=6` es el modo más lento y el que mejor comprime. Esto se ejecuta a
    # mano y muy de vez en cuando: el tiempo de CPU aquí no le cuesta nada a
    # nadie y el peso resultante se lo ahorra a todo el que abra la aplicación.
    imagen.save(salida, "WEBP", quality=CALIDAD, method=6)
    return antes, salida.stat().st_size


def main(argv: list[str]) -> int:
    if len(argv) != 2:
        print(__doc__)
        return 2

    carpeta = Path(argv[1])
    if not carpeta.is_dir():
        print(f"No existe la carpeta: {carpeta}", file=sys.stderr)
        return 1

    fuentes = sorted(carpeta.glob("*.png"))
    if not fuentes:
        print(f"Ninguna imagen PNG en {carpeta}", file=sys.stderr)
        return 1

    total_antes = total_despues = 0
    for i, origen in enumerate(fuentes, start=1):
        nombre = f"ilustracion-{i:02d}"
        antes, despues = convertir(origen, nombre)
        total_antes += antes
        total_despues += despues
        print(f"{nombre}.webp  {antes // 1024} KB -> {despues // 1024} KB")

    print(
        f"\nTotal: {total_antes // 1024} KB -> {total_despues // 1024} KB "
        f"({100 - total_despues * 100 // total_antes} % menos)"
    )
    print(f"Escrito en {DESTINO}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
