// src/pages/capacitaciones/CapacitacionesCursosPage.tsx · A-02
//
// Rol: quien redacta el catálogo (REL editorial o admin de la empresa).
// Trabajo a resolver: «¿qué cursos tengo y cuál me falta terminar?»
//
// Decisión de jerarquía: el listado abre por **qué está sin publicar**, no por
// orden alfabético. Un borrador a medias es lo único aquí que tiene una
// siguiente acción; un curso publicado ya no pide nada. Por eso los borradores
// van primero y la columna de estado es la segunda, no la última.
//
// La acción primaria es una sola: «Nuevo curso» (§16).

import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BookOpen, Plus, Search } from "lucide-react";

import { PageHeader } from "@/shared/ui/PageHeader";
import { CeldaPrincipal, TablaDatos } from "@/shared/ui/TablaDatos";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { listarCursos } from "@/services/capacitacionesService";
import type { CursoResumen, EstadoCurso } from "@/types/capacitaciones";
import { useConsulta } from "@/features/capacitaciones/useConsulta";
import {
  CargandoTabla,
  ErrorConsulta,
  SinDatos,
  SinResultados,
} from "@/features/capacitaciones/components/EstadoPantalla";
import {
  CategoriaBadge,
  EstadoCursoBadge,
} from "@/features/capacitaciones/components/Insignias";
import { CursoNuevoSheet } from "@/features/capacitaciones/components/CursoNuevoSheet";
import {
  formatearIntensidad,
  formatearVigenciaMeses,
} from "@/features/capacitaciones/formato";

type FiltroEstado = "TODOS" | EstadoCurso;

/** Borradores primero: son los únicos que tienen una siguiente acción. */
const PESO_ESTADO: Record<EstadoCurso, number> = {
  BORRADOR: 0,
  PUBLICADO: 1,
  ARCHIVADO: 2,
};

export default function CapacitacionesCursosPage() {
  const navegar = useNavigate();
  const consulta = useConsulta<CursoResumen[]>(() => listarCursos(), []);
  const [busqueda, setBusqueda] = useState("");
  const [estado, setEstado] = useState<FiltroEstado>("TODOS");
  const [creando, setCreando] = useState(false);

  const hayFiltros = busqueda.trim() !== "" || estado !== "TODOS";

  const visibles = useMemo(() => {
    const cursos = consulta.datos ?? [];
    const q = busqueda.trim().toLowerCase();
    return cursos
      .filter((c) => (estado === "TODOS" ? true : c.estado === estado))
      .filter((c) => (q === "" ? true : c.titulo.toLowerCase().includes(q)))
      .slice()
      .sort(
        (a, b) =>
          PESO_ESTADO[a.estado] - PESO_ESTADO[b.estado] ||
          a.titulo.localeCompare(b.titulo, "es")
      );
  }, [consulta.datos, busqueda, estado]);

  const total = consulta.datos?.length ?? 0;
  const borradores = (consulta.datos ?? []).filter((c) => c.estado === "BORRADOR").length;

  function limpiarFiltros() {
    setBusqueda("");
    setEstado("TODOS");
  }

  return (
    <div className="space-y-6">
      <PageHeader
        titulo="Catálogo de cursos"
        icono={BookOpen}
        descripcion={
          consulta.fase === "listo"
            ? borradores > 0
              ? `${total} ${total === 1 ? "curso" : "cursos"} · ${borradores} sin publicar`
              : `${total} ${total === 1 ? "curso" : "cursos"} · todos publicados`
            : "Cursos, versiones y estado de publicación."
        }
        accion={
          <Button variant="rel" onClick={() => setCreando(true)}>
            <Plus aria-hidden="true" />
            Nuevo curso
          </Button>
        }
      />

      {consulta.fase === "cargando" ? <CargandoTabla /> : null}

      {consulta.fase === "error" && consulta.error ? (
        <ErrorConsulta error={consulta.error} reintentar={consulta.refrescar} />
      ) : null}

      {consulta.fase === "listo" && total === 0 ? (
        <SinDatos
          ilustracion="capacitacion"
          titulo="Todavía no hay cursos"
          descripcion="Un curso empieza como borrador: se le agregan lecciones y los datos normativos, y solo entonces se puede publicar una versión."
          accion={
            <Button variant="rel" onClick={() => setCreando(true)}>
              <Plus aria-hidden="true" />
              Crear el primero
            </Button>
          }
        />
      ) : null}

      {consulta.fase === "listo" && total > 0 ? (
        <>
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-[220px] flex-1 space-y-1.5">
              <Label htmlFor="buscar-curso" className="text-rel-dark">
                Buscar por título
              </Label>
              <div className="relative">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-rel-muted"
                  aria-hidden="true"
                />
                <Input
                  id="buscar-curso"
                  type="search"
                  className="pl-9"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  placeholder="Inducción, alturas…"
                />
              </div>
            </div>
            <div className="w-full space-y-1.5 sm:w-56">
              <Label htmlFor="filtrar-estado" className="text-rel-dark">
                Estado
              </Label>
              <Select value={estado} onValueChange={(v) => setEstado(v as FiltroEstado)}>
                <SelectTrigger id="filtrar-estado">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODOS">Todos</SelectItem>
                  <SelectItem value="BORRADOR">Borrador</SelectItem>
                  <SelectItem value="PUBLICADO">Publicado</SelectItem>
                  <SelectItem value="ARCHIVADO">Archivado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {visibles.length === 0 ? (
            <SinResultados limpiar={limpiarFiltros} />
          ) : (
            <>
              {/* Escritorio: tabla. Movil: tarjetas. §20 pide reemplazar la
                  tabla, no comprimirla hasta que sea ilegible. */}
              <div className="hidden md:block">
                <TablaDatos<CursoResumen>
                  filas={visibles}
                  claveFila={(c) => c.id}
                  etiquetaElemento="cursos"
                  etiquetaTabla="Catálogo de cursos"
                  columnas={[
                    {
                      clave: "titulo",
                      titulo: "Curso",
                      valor: (c) => c.titulo,
                      celda: (c) => (
                        <CeldaPrincipal
                          a={`/capacitaciones/cursos/${c.id}`}
                          titulo={c.titulo}
                          apoyo={
                            c.estado === "PUBLICADO"
                              ? `Versión ${c.version_actual} publicada`
                              : "Borrador sin publicar"
                          }
                        />
                      ),
                    },
                    {
                      clave: "estado",
                      titulo: "Estado",
                      valor: (c) => c.estado,
                      celda: (c) => <EstadoCursoBadge estado={c.estado} />,
                    },
                    {
                      clave: "categoria",
                      titulo: "Categoría",
                      valor: (c) => c.categoria,
                      celda: (c) => (
                        <CategoriaBadge
                          categoria={c.categoria}
                          restringida={c.categoria_restringida}
                        />
                      ),
                    },
                    {
                      clave: "lecciones",
                      titulo: "Lecciones",
                      alineacion: "derecha",
                      valor: (c) => c.lecciones,
                      celda: (c) => (
                        <span className="tabular-nums text-rel-dark">{c.lecciones}</span>
                      ),
                    },
                    {
                      clave: "intensidad",
                      titulo: "Intensidad",
                      alineacion: "derecha",
                      valor: (c) => c.intensidad_horaria_min,
                      celda: (c) => (
                        <span className="tabular-nums text-rel-dark">
                          {formatearIntensidad(c.intensidad_horaria_min)}
                        </span>
                      ),
                    },
                    {
                      clave: "vigencia",
                      titulo: "Vigencia",
                      valor: (c) => c.vigencia_meses,
                      celda: (c) => (
                        <span className="text-rel-dark">
                          {formatearVigenciaMeses(c.vigencia_meses)}
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
                          onClick={() => navegar(`/capacitaciones/cursos/${c.id}`)}
                        >
                          {c.estado === "BORRADOR" ? "Continuar" : "Abrir"}
                          <span className="sr-only"> el curso {c.titulo}</span>
                        </Button>
                      ),
                    },
                  ]}
                />
              </div>

              <ul className="space-y-3 md:hidden">
                {visibles.map((c) => (
                  <li
                    key={c.id}
                    className="rounded-rel-card border border-rel-border bg-rel-surface p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <h2 className="font-rel-heading text-base font-bold">
                        <Link
                          to={`/capacitaciones/cursos/${c.id}`}
                          className="text-rel-dark underline-offset-2 hover:text-rel-primary hover:underline"
                        >
                          {c.titulo}
                        </Link>
                      </h2>
                      <EstadoCursoBadge estado={c.estado} />
                    </div>
                    <div className="mt-2">
                      <CategoriaBadge
                        categoria={c.categoria}
                        restringida={c.categoria_restringida}
                      />
                    </div>
                    <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 font-rel-body text-sm">
                      <dt className="text-rel-muted">Lecciones</dt>
                      <dd className="text-right tabular-nums text-rel-dark">{c.lecciones}</dd>
                      <dt className="text-rel-muted">Intensidad</dt>
                      <dd className="text-right tabular-nums text-rel-dark">
                        {formatearIntensidad(c.intensidad_horaria_min)}
                      </dd>
                      <dt className="text-rel-muted">Vigencia</dt>
                      <dd className="text-right text-rel-dark">
                        {formatearVigenciaMeses(c.vigencia_meses)}
                      </dd>
                    </dl>
                    <Button
                      variant="relOutline"
                      size="sm"
                      className="mt-4 w-full"
                      onClick={() => navegar(`/capacitaciones/cursos/${c.id}`)}
                    >
                      {c.estado === "BORRADOR" ? "Continuar" : "Abrir"}
                      <span className="sr-only"> el curso {c.titulo}</span>
                    </Button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </>
      ) : null}

      <CursoNuevoSheet
        abierto={creando}
        alCerrar={() => setCreando(false)}
        alCrear={(cursoId) => {
          setCreando(false);
          // Se va directo al detalle: el borrador recién creado no tiene nada
          // que mirar en el listado, y lo que sigue es redactarlo.
          navegar(`/capacitaciones/cursos/${cursoId}`);
        }}
      />
    </div>
  );
}
