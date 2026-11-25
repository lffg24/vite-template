"""Convierte las ilustraciones de origen a WebP del tamaño en que se pintan.

## Por qué existe

Las ilustraciones llegan como PNG de 1–1,8 MB cada una, a más de 1400 px de
ancho. En pantalla se pintan a 130–320 px. Subir los originales al repositorio
significa:

- **Decenas de MB en el paquete** que descarga cada visitante, para pintar 300 px.
- **Decenas de MB en el historial de git, para siempre.** Un binario no se borra:
  aunque mañana se reemplace, la versión vieja sigue en cada clon.

Convertidas a WebP al ancho real quedan en decenas de KB. El original se queda
fuera del repositorio como archivo maestro.

## El nombre sale del ARCHIVO, no del orden

La primera versión numeraba por orden alfabético: `ilustracion-01`, `-02`… Eso
tiene un defecto que no se ve hasta que muerde: al cambiar una imagen de la
carpeta, o al añadir otra que ordene antes, **cada escena pasa a apuntar a un
dibujo distinto** sin que nadie toque una línea de código. Una pantalla que decía
«publicar» acabaría enseñando un candado.

Ahora el nombre se deriva del nombre del archivo de origen, que es semántico:
`certificado-mujer.png` → `certificado-mujer.webp`. Cambiar el contenido de un
archivo cambia el dibujo; cambiar su nombre es un cambio consciente que rompe el
`import` y falla al compilar, que es donde debe fallar.

## Uso

    python scripts/optimizar-ilustraciones.py <carpeta-origen>

Es idempotente: volver a ejecutarlo reescribe lo que haya.

## Por qué WebP y no AVIF

AVIF comprime algo más, pero el ahorro sobre WebP en estas ilustraciones planas
es marginal y WebP tiene soporte universal desde hace años — incluido el Safari
de los teléfonos con los que se abre el recorrido público, que es justo el
público que no se puede dejar fuera por una decisión de compresión.
"""
from __future__ import annotations

import re
import sys
import unicodedata
from pathlib import Path

from PIL import Image

#: Ancho al que se guarda. El doble del mayor tamaño en que se pinta (320 px),
#: para que se vea nítida en pantallas de densidad doble y ni un píxel más.
ANCHO_MAX = 640

#: 82 es donde estas ilustraciones dejan de ganar calidad visible por peso.
CALIDAD = 82

DESTINO = Path(__file__).resolve().parent.parent / "src" / "assets" / "ilustraciones"


def slug(nombre: str) -> str:
    """`certificado-capacitación-hombre` → `certificado-capacitacion-hombre`.

    Sin acentos ni eñes: el nombre acaba en un `import` y en una URL, y un
    archivo con tilde viaja distinto según el sistema de archivos, el
    empaquetador y el servidor. Es el tipo de fallo que solo aparece en
    producción.
    """
    sin_tildes = "".join(
        c
        for c in unicodedata.normalize("NFKD", nombre)
        if not unicodedata.combining(c)
    )
    limpio = re.sub(r"[^a-zA-Z0-9]+", "-", sin_tildes).strip("-").lower()
    return re.sub(r"-{2,}", "-", limpio)


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

    vistos: dict[str, Path] = {}
    total_antes = total_despues = 0

    for origen in fuentes:
        nombre = slug(origen.stem)

        # Dos archivos que solo se distinguen por una tilde producen el MISMO
        # slug. Sobrescribir en silencio dejaría una de las dos imágenes fuera
        # sin que nadie se enterara, así que se aborta y se dice cuáles son.
        if nombre in vistos:
            print(
                f"ABORTA: «{origen.name}» y «{vistos[nombre].name}» producen el mismo "
                f"nombre «{nombre}». Renombra una de las dos en la carpeta de origen.",
                file=sys.stderr,
            )
            return 1
        vistos[nombre] = origen

        antes, despues = convertir(origen, nombre)
        total_antes += antes
        total_despues += despues
        print(f"{nombre}.webp  {antes // 1024} KB -> {despues // 1024} KB")

    print(
        f"\nTotal: {total_antes // 1024} KB -> {total_despues // 1024} KB "
        f"({100 - total_despues * 100 // total_antes} % menos)"
    )
    print(f"Escrito en {DESTINO}")
    print(
        "\nRecuerda: cada archivo nuevo necesita su `import` en "
        "`src/shared/ui/Escena.tsx`. Si falta, falla el build — que es donde debe."
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
