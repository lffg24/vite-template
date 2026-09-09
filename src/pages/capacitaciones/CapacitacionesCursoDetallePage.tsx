// src/pages/capacitaciones/CapacitacionesCursoDetallePage.tsx · A-03 + A-04 + A-05
//
// Tres pantallas del mapa en una página, y es deliberado: redactar el curso,
// armar sus lecciones y comprobar si ya se puede publicar son un mismo trabajo
// hecho de una sentada. Separarlas en tres rutas obligaría a ir y volver para
// saber si lo que se acaba de escribir resolvió lo que faltaba.
//
// Lo que sí se mantiene separado es la jerarquía: publicación arriba a la
// derecha, porque es la pregunta que trae al usuario aquí («¿ya puedo?»), y los
// formularios debajo, que es donde se responde.

import { useCallback } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import { obtenerCurso } from "@/services/capacitacionesService";
import type { CursoDetalle } from "@/types/capacitaciones";
import { useConsulta } from "@/features/capacitaciones/useConsulta";
import {
  CargandoPanel,
  ErrorConsulta,
} from "@/features/capacitaciones/components/EstadoPantalla";
import {
  CategoriaBadge,
  EstadoCursoBadge,
} from "@/features/capacitaciones/components/Insignias";
import { CursoDatosForm } from "@/features/capacitaciones/components/CursoDatosForm";
import { LeccionesEditor } from "@/features/capacitaciones/components/LeccionesEditor";
import { PanelPublicacion } from "@/features/capacitaciones/components/PanelPublicacion";
import { useCapacitaciones } from "@/features/capacitaciones/ContextoCapacitaciones";

export default function CapacitacionesCursoDetallePage() {
  const { cursoId = "" } = useParams<{ cursoId: string }>();
  const navegar = useNavigate();
  const { capacidades } = useCapacitaciones();

  const consulta = useConsulta<CursoDetalle>(() => obtenerCurso(cursoId), [cursoId]);
  const recargar = useCallback(() => consulta.refrescar(), [consulta]);

  // Del contexto, no del JWT: `hasPermission` lee la lista plana del login,
  // que no conoce las asignaciones con alcance ni resuelve contrato y bandera.
  const puedePublicar = Boolean(capacidades?.puede_publicar);

  return (
    <div className="space-y-6">
      <Button variant="relGhost" size="sm" asChild className="-ml-3">
        <Link to="/capacitaciones/cursos">
          <ArrowLeft aria-hidden="true" />
          Volver al catálogo
        </Link>
      </Button>

      {consulta.fase === "cargando" ? <CargandoPanel etiqueta="Abriendo el curso…" /> : null}

      {consulta.fase === "error" && consulta.error ? (
        consulta.error.status === 404 ? (
          // 404 y no 403 aunque el curso exista en otra empresa: distinguirlos
          // confirmaria que el identificador existe en otro inquilino.
          <div
            role="alert"
            className="rounded-rel-panel border border-rel-border bg-rel-surface p-6"
          >
            <h1 className="font-rel-heading text-lg font-bold text-rel-dark">
              Este curso no existe
            </h1>
            <p className="mt-1 font-rel-body text-sm text-rel-muted">
              O fue eliminado, o el enlace apunta a un curso de otra empresa.
            </p>
            <Button variant="relOutline" size="sm" className="mt-4" asChild>
              <Link to="/capacitaciones/cursos">Ir al catálogo</Link>
            </Button>
          </div>
        ) : (
          <ErrorConsulta error={consulta.error} reintentar={consulta.refrescar} />
        )
      ) : null}

      {consulta.fase === "listo" && consulta.datos ? (
        <>
          {/* No usa `PageHeader` porque el estado y la categoría van ENCIMA del
              título: en esta pantalla lo primero que hay que saber es si lo que
              se está editando ya está publicado. La carcasa sí es la misma. */}
          <header className="flex flex-wrap items-start justify-between gap-4 rounded-rel-panel border border-rel-border bg-rel-surface p-6 shadow-sm">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <EstadoCursoBadge estado={consulta.datos.curso.estado} />
                <CategoriaBadge
                  categoria={consulta.datos.curso.categoria}
                  restringida={consulta.datos.curso.categoria_restringida}
                />
              </div>
              <h1 className="mt-2 font-rel-heading text-3xl font-black tracking-tight text-rel-dark">
                {consulta.datos.curso.titulo}
              </h1>
              <p className="mt-1 font-rel-body text-sm text-rel-muted">
                {consulta.datos.curso.estado === "PUBLICADO"
                  ? `Versión vigente v${consulta.datos.curso.version_actual}. Lo que edites aquí no la cambia: forma la siguiente.`
                  : "Borrador. Nada de lo que escribas aquí es visible para nadie hasta publicar."}
              </p>
            </div>

            {consulta.datos.curso.estado === "PUBLICADO" ? (
              <Button variant="relOutline" onClick={() => navegar("/capacitaciones/asignaciones")}>
                <Send aria-hidden="true" />
                Asignar este curso
              </Button>
            ) : null}
          </header>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
            <div className="space-y-6">
              <CursoDatosForm curso={consulta.datos.curso} alGuardar={recargar} />
              <LeccionesEditor
                cursoId={cursoId}
                lecciones={consulta.datos.lecciones}
                editable={consulta.datos.curso.estado !== "ARCHIVADO"}
                alCambiar={recargar}
              />
            </div>

            {/* En pantallas anchas el checklist queda fijo a la vista mientras
                se edita: es la lista que el formulario va tachando. */}
            <div className="lg:sticky lg:top-6 lg:self-start">
              <PanelPublicacion
                curso={consulta.datos.curso}
                faltantes={consulta.datos.faltantes}
                puedePublicar={puedePublicar}
                alPublicar={recargar}
              />
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
