// src/pages/evaluaciones/EvaluacionesPage.tsx
//
// El banco. Rol: quien redacta cuestionarios de la plataforma.
//
// No es «las evaluaciones de un curso»: un cuestionario vive por su cuenta y lo
// pueden usar varios cursos —y mañana una 360 o una de clima—. Por eso la
// columna que más informa es **cursos vinculados**: dice si tocar este
// cuestionario afecta a uno o a cinco.
//
// El listado abre por lo último editado y no por orden alfabético: lo que se
// está redactando es lo que tiene una siguiente acción.

import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ClipboardCheck, Plus, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/shared/ui/PageHeader";
import { CeldaPrincipal, TablaDatos } from "@/shared/ui/TablaDatos";
import { useConsulta } from "@/features/capacitaciones/useConsulta";
import {
  CargandoTabla,
  ErrorConsulta,
  SinDatos,
  SinResultados,
} from "@/features/capacitaciones/components/EstadoPantalla";
import { listarCuestionarios } from "@/services/evaluacionesService";
import { ETIQUETA_AMBITO, type CuestionarioResumen } from "@/types/evaluaciones";
import { CuestionarioNuevoSheet } from "@/features/evaluaciones/CuestionarioNuevoSheet";

export function EstadoCuestionarioBadge({ estado }: { estado: string }) {
  if (estado === "PUBLICADO") return <Badge variant="relSuccess">Publicada</Badge>;
  if (estado === "ARCHIVADO") return <Badge variant="relNeutral">Archivada</Badge>;
  return <Badge variant="relWarning">Borrador</Badge>;
}

export default function EvaluacionesPage() {
  const navegar = useNavigate();
  const consulta = useConsulta<CuestionarioResumen[]>(() => listarCuestionarios(), []);
  const [busqueda, setBusqueda] = useState("");
  const [creando, setCreando] = useState(false);

  const todas = useMemo(() => consulta.datos ?? [], [consulta.datos]);
  const visibles = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    if (!texto) return todas;
    return todas.filter(
      (c) =>
        c.titulo.toLowerCase().includes(texto) ||
        c.codigo.toLowerCase().includes(texto) ||
        (c.descripcion ?? "").toLowerCase().includes(texto)
    );
  }, [todas, busqueda]);

  const publicadas = todas.filter((c) => c.estado === "PUBLICADO").length;

  return (
    <div className="space-y-6">
      <PageHeader
        titulo="Evaluaciones"
        icono={ClipboardCheck}
        descripcion={
          consulta.fase === "listo"
            ? `${todas.length} en el banco · ${publicadas} publicadas`
            : "Banco de cuestionarios reutilizables por los cursos."
        }
        accion={
          <Button variant="rel" onClick={() => setCreando(true)}>
            <Plus aria-hidden="true" />
            Nueva evaluación
          </Button>
        }
      />

      {consulta.fase === "cargando" ? <CargandoTabla /> : null}

      {consulta.fase === "error" && consulta.error ? (
        <ErrorConsulta error={consulta.error} reintentar={consulta.refrescar} />
      ) : null}

      {consulta.fase === "listo" && todas.length === 0 ? (
        <SinDatos
          ilustracion="documento"
          titulo="El banco está vacío"
          descripcion="Una evaluación se redacta una vez y la usan los cursos que la necesiten. Empieza por la que más se repita."
          accion={
            <Button variant="rel" onClick={() => setCreando(true)}>
              <Plus aria-hidden="true" />
              Crear la primera
            </Button>
          }
        />
      ) : null}

      {consulta.fase === "listo" && todas.length > 0 ? (
        <>
          <div className="max-w-md space-y-1.5">
            <Label htmlFor="buscar-evaluacion" className="text-rel-dark">
              Buscar
            </Label>
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-rel-muted"
                aria-hidden="true"
              />
              <Input
                id="buscar-evaluacion"
                type="search"
                className="pl-9"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Título, código o descripción…"
              />
            </div>
          </div>

          {visibles.length === 0 ? (
            <SinResultados limpiar={() => setBusqueda("")} />
          ) : (
            <TablaDatos<CuestionarioResumen>
              filas={visibles}
              claveFila={(c) => c.id}
              etiquetaElemento="evaluaciones"
              etiquetaTabla="Banco de evaluaciones"
              columnas={[
                {
                  clave: "titulo",
                  titulo: "Evaluación",
                  valor: (c) => c.titulo,
                  celda: (c) => (
                    <CeldaPrincipal
                      a={`/evaluaciones/${c.id}`}
                      titulo={c.titulo}
                      apoyo={`${c.codigo}${c.descripcion ? ` · ${c.descripcion}` : ""}`}
                    />
                  ),
                },
                {
                  clave: "ambito",
                  titulo: "Ámbito",
                  valor: (c) => c.ambito,
                  celda: (c) => (
                    <Badge variant="relBrand">{ETIQUETA_AMBITO[c.ambito]}</Badge>
                  ),
                },
                {
                  clave: "nota",
                  titulo: "Nota mínima",
                  alineacion: "derecha",
                  valor: (c) => c.nota_minima,
                  celda: (c) => (
                    <span className="tabular-nums text-rel-dark">{c.nota_minima} %</span>
                  ),
                },
                {
                  clave: "intentos",
                  titulo: "Intentos",
                  alineacion: "derecha",
                  valor: (c) => c.intentos_max,
                  celda: (c) => (
                    <span className="tabular-nums text-rel-dark">{c.intentos_max}</span>
                  ),
                },
                {
                  clave: "cursos",
                  titulo: "Cursos vinculados",
                  alineacion: "derecha",
                  valor: (c) => c.cursos_vinculados,
                  celda: (c) => (
                    <span className="tabular-nums text-rel-dark">
                      {c.cursos_vinculados}
                    </span>
                  ),
                },
                {
                  clave: "estado",
                  titulo: "Estado",
                  valor: (c) => c.estado,
                  celda: (c) => (
                    <span className="inline-flex items-center gap-2">
                      <EstadoCuestionarioBadge estado={c.estado} />
                      {c.version_actual > 0 ? (
                        <span className="text-xs text-rel-muted">
                          v{c.version_actual}
                        </span>
                      ) : null}
                    </span>
                  ),
                },
                {
                  clave: "acciones",
                  titulo: "Acciones",
                  alineacion: "derecha",
                  soloAcciones: true,
                  celda: (c) => (
                    <Button
                      variant="relOutline"
                      size="sm"
                      onClick={() => navegar(`/evaluaciones/${c.id}`)}
                    >
                      {c.estado === "BORRADOR" ? "Continuar" : "Abrir"}
                      <span className="sr-only"> la evaluación {c.titulo}</span>
                    </Button>
                  ),
                },
              ]}
            />
          )}
        </>
      ) : null}

      <CuestionarioNuevoSheet
        abierto={creando}
        alCerrar={() => setCreando(false)}
        alCrear={(id) => {
          setCreando(false);
          // Directo al detalle: un borrador recién creado no tiene nada que
          // mirar en el listado, y lo que sigue es escribirle las preguntas.
          navegar(`/evaluaciones/${id}`);
        }}
      />
    </div>
  );
}
