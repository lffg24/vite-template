# -*- coding: utf-8 -*-
"""Mide el avance de la homologacion visual, frente por frente.

Por que un script y no una cifra en un informe: la cifra se dio mal dos veces,
y las dos por mover sin querer lo que entraba en la cuenta. Un numero que
depende de quien lo mide no sirve para decidir nada.

El PERIMETRO es el mismo que usa `src/shared/ui/nucleo.test.ts`:
no cuentan las piezas base —dibujar un boton ES su trabajo— y no cuenta
Psicosocial, que no se migra. Por eso un frente al 100% significa «cerrado en
lo que se migra», no «no queda ni una linea en el repositorio».

Uso:  python scripts/medir-homologacion.py
"""
from __future__ import annotations

import io
import os
import re
import sys

RAIZ = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "src")

BASE = ("shared/ui/", "components/ui/", "components/common/")
PSICO_SUELTOS = {
    "pages/ReportesPsico.tsx",
    "pages/ReportesOficialesPsicoPage.tsx",
    "pages/ResponderEvaluacion.tsx",
    "layout/PsicologoLayout.tsx",
}


def rutas() -> list[str]:
    salida = []
    for carpeta, _, ficheros in os.walk(RAIZ):
        for fichero in ficheros:
            if re.search(r"\.tsx?$", fichero) and not re.search(r"\.test\.tsx?$", fichero):
                absoluta = os.path.join(carpeta, fichero)
                salida.append(absoluta.replace("\\", "/")[len(RAIZ.replace("\\", "/")) + 1 :])
    return sorted(salida)


def es_base(r: str) -> bool:
    return r.startswith(BASE)


def es_psicosocial(r: str) -> bool:
    return "/psicosocial/" in r or r.startswith("features/psicosocial/") or r in PSICO_SUELTOS


COMENTARIO_BLOQUE = re.compile(r"/\*.*?\*/", re.S)
COMENTARIO_LINEA = re.compile(r"^\s*//.*$", re.M)


def leer(r: str) -> str:
    """El fuente SIN comentarios.

    Hace falta y no es cosmetica: la primera version de esta medida conto como
    deuda un comentario que explicaba la deuda. Dos de las nueve pantallas que
    dijo que anunciaban su vacio en texto no lo anunciaban en ningun sitio —una
    tenia la frase dentro de un comentario y la otra era la respuesta a una
    pregunta de evaluacion, no un vacio—. Es el mismo error que ya cazo una
    prueba cuando un comentario nombraba la clase que el guardia prohibe.
    """
    bruto = io.open(os.path.join(RAIZ, r), encoding="utf-8").read()
    return COMENTARIO_LINEA.sub("", COMENTARIO_BLOQUE.sub("", bruto))


TODOS = rutas()
PERIMETRO = [r for r in TODOS if not es_base(r) and not es_psicosocial(r)]


def cuenta(patron: str, rutas_: list[str]) -> int:
    rx = re.compile(patron)
    return sum(len(rx.findall(leer(r))) for r in rutas_)


def archivos_con(patron: str, rutas_: list[str]) -> list[str]:
    rx = re.compile(patron)
    return [r for r in rutas_ if rx.search(leer(r))]


# (frente, hechos, a_mano, nota)
FRENTES: list[tuple[str, int, int, str]] = []


def frente(nombre: str, hechos: int, a_mano: int, nota: str = "") -> None:
    FRENTES.append((nombre, hechos, a_mano, nota))


# --- Piezas con un guardia de lista vacia en el perimetro ------------------
for nombre, patron_a_mano, nota in [
    ("Tablas", r'from "@/components/ui/table"', "lista vacia en el guardia"),
    ("Modales", r"fixed inset-0", "lista vacia en el guardia"),
    ("Pestanas", r'role="tab"(?![a-z])', "la que queda es de Psicosocial"),
    ("Casillas", r'type="checkbox"', "la que queda es de Psicosocial"),
    ("Gris crudo", r"\b(?:bg|text|border)-(?:gray|slate|zinc|neutral|stone)-\d{2,3}\b", "lo que queda es de Psicosocial"),
    ("Violeta", r"\b(?:bg|text|border|ring|from|to|via)-(?:violet|purple|fuchsia|indigo)-\d{2,3}\b", "solo quedan menciones en comentarios"),
]:
    culpables = archivos_con(patron_a_mano, PERIMETRO)
    frente(nombre, len(PERIMETRO) - len(culpables), len(culpables), nota)

# --- Botones ---------------------------------------------------------------
a_mano = cuenta(r"<button", PERIMETRO)
con_pieza = cuenta(r"<Button\b", PERIMETRO)
frente("Botones", con_pieza, a_mano, "los 15 no son acciones")

# --- Escalas que se cerraron con la caja -----------------------------------
# Un nombre por radio: `rounded-lg|xl|2xl` valen lo mismo que
# `rounded-rel-control|card|panel`, y 86 sitios usaban la segunda forma.
culpables = archivos_con(r"\brounded-(?:lg|xl|2xl|md)\b", PERIMETRO)
frente("Radio por rol", len(PERIMETRO) - len(culpables), len(culpables), "un nombre por valor, y tres valores")

# El relieve sale del sistema: las sombras de Tailwind son negras y las de la
# casa van tintadas de azul, asi que una caja con `shadow-sm` proyectaba una
# sombra gris en un producto cuya sombra es azul.
RELIEVE_OK = ("shadow-rel-card", "shadow-rel-floating", "shadow-rel-soft", "shadow-none")
SOMBRA = re.compile(r"(?<!-)shadow(?:-[^\s\"'`{}]+)?")
_buenas, _malas = 0, 0
# `lib/utils.ts` es donde los nombres se DECLARAN, no donde se usan: ahi
# `shadow` es la clave del grupo que `cn` ensena a tailwind-merge. Contarla
# como clase convierte la configuracion en deuda.
for _r in [r for r in PERIMETRO if r != "lib/utils.ts"]:
    for _m in SOMBRA.findall(leer(_r)):
        if _m in RELIEVE_OK:
            _buenas += 1
        else:
            _malas += 1
frente("Relieve", _buenas, _malas, "solo rel-card, rel-floating o nada")

# --- Tarjetas --------------------------------------------------------------
caja = r'className="[^"]*\brounded-(?:rel-card|rel-panel|xl|2xl|lg)\b[^"]*\bborder\b[^"]*\bbg-(?:rel-)?surface\b[^"]*"'
a_mano = cuenta(caja, PERIMETRO)
con_pieza = cuenta(r"<(?:Card|Panel|TablaPanel|Caja)\b", PERIMETRO)
frente("Tarjetas", con_pieza, a_mano, "las 2 que quedan son excepciones")

# --- Desplegables ----------------------------------------------------------
# El elemento nativo NO era la deuda: en movil abre el selector del sistema y
# se opera mejor. La deuda era que el tratamiento se cumplia copiando clases,
# en cinco variantes. `Desplegable` es el mismo `select` nativo con el aspecto
# de la casa, asi que cuenta como pieza igual que el de Radix.
a_mano = cuenta(r"<select\b", PERIMETRO)
con_pieza = cuenta(r"<(?:Select|SelectTrigger|Desplegable)\b", PERIMETRO)
frente("Desplegables", con_pieza, a_mano, "ni uno escrito a mano")

# --- El aspecto del control -------------------------------------------------
# Campo de texto, area de texto y desplegable: una sola cadena de clases. Antes
# `Textarea` se homologo copiando las de `Input` caracter por caracter, y el
# desplegable se quedo fuera: cinco apariencias para dieciocho controles.
PIEZAS_CONTROL = ["components/ui/input.tsx", "components/ui/select.tsx",
                  "components/ui/textarea.tsx", "shared/ui/Desplegable.tsx"]
piden = [r for r in PIEZAS_CONTROL if "CLASE_CONTROL" in leer(r)]
frente("Aspecto del control", len(piden), len(PIEZAS_CONTROL) - len(piden), "una definicion para los cuatro")

# --- Vacios: cuantas pantallas con lista usan la pieza ---------------------
LISTA = r"<TablaDatos\b|<ul\b|\.map\("
VACIO_TEXTO = r"No hay |Aun no|Aún no|Todavía no|Sin resultados|Sin datos|Sin registros"
PIEZA = r"<EstadoVacio\b|<SinDatos\b|<IllustratedEmptyState\b|<SinResultados\b|vacio="
candidatas = [r for r in PERIMETRO if re.search(LISTA, leer(r)) and re.search(VACIO_TEXTO, leer(r))]
con_pieza = [r for r in candidatas if re.search(PIEZA, leer(r))]
frente("Vacios", len(con_pieza), len(candidatas) - len(con_pieza), "los 4 que quedan tienen motivo")

# --- Ilustraciones: cuantas del registro se usan ---------------------------
# La cuenta es la union de dos lecturas, porque una sola se equivoca en un
# sentido o en el otro:
#
#   A. La clave escrita en un atributo (`escena="agenda"`). Precisa, pero ciega
#      a la escena elegida con una variable --que es como se pintan los tres
#      desenlaces de una evaluacion-- y al valor por defecto de una pieza.
#   B. La clave como cadena suelta, SOLO en los ficheros que importan el
#      sistema de ilustracion. Ahi "retryAvailable" no es otra cosa.
#
# Fuera de esos ficheros B no se aplica: hay claves que son palabras
# corrientes --"error", "pdf", "firma"-- y contarlas en cualquier sitio
# inflaria la cifra con usos que no existen.
registro = leer("shared/ui/illustration/illustration.registry.ts")
claves = set(re.findall(r'^\s{2}\"?([a-zA-Z][a-zA-Z0-9_-]*)\"?:\s*\{', registro, re.M))
usadas = set()
for r in TODOS:
    if "illustration.registry" in r:
        continue
    c = leer(r)
    pide_el_sistema = "shared/ui/illustration" in c
    for k in claves:
        if re.search(r'(?:name|nombre|escena|escenaVacio|illustration)\s*=\s*\{?"%s"' % re.escape(k), c):
            usadas.add(k)
        elif pide_el_sistema and re.search(r'(?<![\w-])"%s"(?![\w-])' % re.escape(k), c):
            usadas.add(k)
frente("Ilustraciones usadas", len(usadas), len(claves) - len(usadas), "del registro, en todo el producto")


ANCHO = max(len(n) for n, *_ in FRENTES)
print()
print("  PERIMETRO: %d archivos .tsx/.ts (sin piezas base, sin Psicosocial)" % len(PERIMETRO))
print()
print("  %-*s   %%     cumplen   a mano   nota" % (ANCHO, "frente"))
print("  " + "-" * (ANCHO + 46))
for nombre, hechos, a_mano_, nota in FRENTES:
    total = hechos + a_mano_
    pct = 100.0 if total == 0 else 100.0 * hechos / total
    barra = "#" * int(round(pct / 10)) + "." * (10 - int(round(pct / 10)))
    print("  %-*s  %3.0f%% %s  %6d   %6d   %s" % (ANCHO, nombre, pct, barra, hechos, a_mano_, nota))
print()

if "--json" in sys.argv:
    import json

    print(json.dumps([{"frente": n, "pieza": h, "aMano": a, "nota": x} for n, h, a, x in FRENTES], ensure_ascii=False, indent=2))
