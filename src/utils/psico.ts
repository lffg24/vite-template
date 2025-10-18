import {
  BloqueEvaluacion,
  ConteosNivel,
  FilaTablaDominios,
  GrupoDimension,
  GrupoDominio,
  NivelClave,
} from "@/types/psico";

const NIVEL_KEYS: NivelClave[] = [
  "sin_riesgo",
  "bajo",
  "medio",
  "alto",
  "muy_alto",
];

const emptyConteos = (): ConteosNivel => ({
  sin_riesgo: 0,
  bajo: 0,
  medio: 0,
  alto: 0,
  muy_alto: 0,
});

export function agruparPorEvaluacion(
  filas: FilaTablaDominios[]
): BloqueEvaluacion[] {
  const byEval = new Map<number, FilaTablaDominios[]>();
  for (const f of filas) {
    if (!byEval.has(f.evaluacion_id)) byEval.set(f.evaluacion_id, []);
    byEval.get(f.evaluacion_id)!.push(f);
  }

  const bloques: BloqueEvaluacion[] = [];
  for (const [evaluacion_id, rows] of byEval.entries()) {
    // dominio -> dimensiones
    const domMap = new Map<string, GrupoDominio>();
    for (const r of rows) {
      if (!domMap.has(r.dominio)) {
        domMap.set(r.dominio, {
          codigo: r.dominio,
          nombre: r.nombre_dominio,
          promedioT: 0,
          totales: emptyConteos(),
          dimensiones: [],
        });
      }
      const dim: GrupoDimension = {
        codigo: r.dimension,
        nombre: r.nombre_dimension,
        puntajeT: Number(r.puntaje_t?.toFixed?.(2) ?? r.puntaje_t),
        conteos: r.conteos ?? emptyConteos(),
      };
      const d = domMap.get(r.dominio)!;
      d.dimensiones.push(dim);
      // acumular totales
      for (const k of NIVEL_KEYS) d.totales[k] += dim.conteos[k] ?? 0;
    }
    // calcular promedioT de cada dominio (promedio simple de puntajes de dimensiones)
    for (const d of domMap.values()) {
      const sum = d.dimensiones.reduce((acc, x) => acc + x.puntajeT, 0);
      d.promedioT = d.dimensiones.length
        ? Number((sum / d.dimensiones.length).toFixed(2))
        : 0;
      d.dimensiones.sort((a, b) => a.nombre.localeCompare(b.nombre));
    }

    const dominios = [...domMap.values()].sort((a, b) =>
      a.nombre.localeCompare(b.nombre)
    );
    bloques.push({
      evaluacion_id,
      nombre_evaluacion: rows[0]?.nombre_evaluacion,
      dominios,
    });
  }

  // orden estable por id de evaluación
  return bloques.sort((a, b) => a.evaluacion_id - b.evaluacion_id);
}

/** Consolida N evaluaciones en una sola estructura con promedios simples por dominio */
export function consolidarBloques(
  bloques: BloqueEvaluacion[]
): BloqueEvaluacion {
  // dominio -> acumuladores
  const map = new Map<string, GrupoDominio>();

  for (const b of bloques) {
    for (const dom of b.dominios) {
      if (!map.has(dom.codigo)) {
        map.set(dom.codigo, {
          codigo: dom.codigo,
          nombre: dom.nombre,
          promedioT: 0,
          totales: emptyConteos(),
          dimensiones: [],
        });
      }
      const acc = map.get(dom.codigo)!;

      // fusionar dimensiones por nombre
      for (const dim of dom.dimensiones) {
        const idx = acc.dimensiones.findIndex((d) => d.codigo === dim.codigo);
        if (idx === -1) {
          acc.dimensiones.push({
            codigo: dim.codigo,
            nombre: dim.nombre,
            puntajeT: dim.puntajeT,
            conteos: { ...dim.conteos },
          });
        } else {
          const target = acc.dimensiones[idx];
          // promedio simple de puntajeT entre evaluaciones
          target.puntajeT = Number(
            ((target.puntajeT + dim.puntajeT) / 2).toFixed(2)
          );
          // sumar conteos
          for (const k of NIVEL_KEYS) target.conteos[k] += dim.conteos[k] ?? 0;
        }
      }

      // acumular totales por dominio
      for (const k of NIVEL_KEYS) acc.totales[k] += dom.totales[k] ?? 0;
      // promedioT del dominio (promedio simple entre evaluaciones)
      acc.promedioT = Number(((acc.promedioT + dom.promedioT) / 2).toFixed(2));
    }
  }

  const dominios = [...map.values()]
    .map((d) => ({
      ...d,
      dimensiones: d.dimensiones.sort((a, b) =>
        a.nombre.localeCompare(b.nombre)
      ),
    }))
    .sort((a, b) => a.nombre.localeCompare(b.nombre));

  return {
    evaluacion_id: 0,
    nombre_evaluacion: `Consolidado de ${bloques.length} evaluaciones`,
    dominios,
  };
}
