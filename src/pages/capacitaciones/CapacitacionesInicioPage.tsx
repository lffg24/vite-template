// src/pages/capacitaciones/CapacitacionesInicioPage.tsx
//
// La portada del módulo.
//
// ## Por qué existe
//
// `/capacitaciones` no tenía inicio: la ruta índice redirigía a la primera
// pantalla que el permiso permitiera, así que se entraba al módulo y se
// aterrizaba en una lista de cursos sin saber qué estaba pasando.
//
// ## Qué se pinta y qué no
//
// Solo lo que lleva a una acción de hoy. Un panel que enseña doce cifras no se
// lee: se mira por encima y se ignora, y entonces deja de avisar cuando de
// verdad hay algo. Por eso las asignaciones atrasadas que ya terminó todo el
// mundo **no aparecen** —el servidor las filtra— y por eso los vencimientos solo
// ocupan sitio cuando los hay.
//
// El umbral de aviso lo decide el servidor y viaja en la respuesta. Repetir «60
// días» aquí sería tener dos fuentes para el mismo número, y la de la pantalla
// se quedaría vieja sin que nadie lo notara.

import { Link } from "react-router-dom";
import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  CalendarClock,
  LayoutDashboard,
} from "lucide-react";

import { PageHeader } from "@/shared/ui/PageHeader";
import { Panel } from "@/shared/ui/Panel";
import { Ayuda } from "@/shared/ui/Ayuda";
import { Button } from "@/components/ui/button";
import { obtenerTablero } from "@/services/capacitacionesService";
import { useConsulta } from "@/features/capacitaciones/useConsulta";
import {
  CargandoPanel,
  ErrorConsulta,
} from "@/features/capacitaciones/components/EstadoPantalla";
import { formatearFecha } from "@/features/capacitaciones/formato";

function Cifra({
  etiqueta,
  valor,
  ayuda,
  a,
}: {
  etiqueta: string;
  valor: number;
  ayuda?: string;
  a?: string;
}) {
  const cuerpo = (
    <>
      <p className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-rel-muted">
        {etiqueta}
        {ayuda ? <Ayuda etiqueta={`Qué cuenta ${etiqueta}`}>{ayuda}</Ayuda> : null}
      </p>
      <p className="mt-1 font-rel-heading text-3xl font-black tabular-nums text-rel-dark">
        {valor}
      </p>
    </>
  );
  const clases =
    "block min-w-0 rounded-rel-card border border-rel-border bg-rel-surface p-5";
  // Solo es enlace lo que lleva a algún sitio. Un recuadro que parece pulsable y
  // no hace nada enseña a no pulsar los que sí.
  return a ? (
    <Link
      to={a}
      className={`${clases} transition-colors hover:border-rel-primary hover:bg-rel-surface-subtle`}
    >
      {cuerpo}
    </Link>
  ) : (
    <div className={clases}>{cuerpo}</div>
  );
}

export default function CapacitacionesInicioPage() {
  const consulta = useConsulta(() => obtenerTablero(), []);

  return (
    <div className="space-y-6">
      <PageHeader
        titulo="Capacitaciones"
        icono={LayoutDashboard}
        descripcion="Qué hay en marcha y qué pide atención hoy."
      />

      {consulta.fase === "cargando" ? (
        <CargandoPanel etiqueta="Cargando el resumen del módulo…" />
      ) : null}
      {consulta.fase === "error" && consulta.error ? (
        <ErrorConsulta error={consulta.error} reintentar={consulta.refrescar} />
      ) : null}

      {consulta.fase === "listo" && consulta.datos ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Cifra
              etiqueta="Asignaciones activas"
              valor={consulta.datos.asignaciones_activas}
              a="/capacitaciones/asignaciones"
              ayuda="Cursos que se están dictando ahora en esta empresa."
            />
            <Cifra
              etiqueta="Sin empezar"
              valor={consulta.datos.sin_empezar}
              ayuda="Gente con invitación que todavía sirve y que nunca entró. Es sobre quien se puede actuar hoy con un recordatorio."
            />
            <Cifra
              etiqueta="En curso"
              valor={consulta.datos.personas_en_curso}
              ayuda="Entraron y les faltan lecciones obligatorias."
            />
            <Cifra
              etiqueta="Completados"
              valor={consulta.datos.personas_completadas}
              ayuda="Terminaron lo obligatorio de la versión que estaban cursando."
            />
          </div>

          {/* --- vencimientos --- */}
          <Panel className="space-y-4">
            <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
              <h2 className="flex items-center gap-2 font-rel-heading text-lg font-bold text-rel-dark">
                <CalendarClock className="h-5 w-5 text-rel-primary" aria-hidden="true" />
                Constancias
              </h2>
              <Button variant="relGhost" size="sm" asChild>
                <Link to="/capacitaciones/constancias">
                  Ver todas
                  <ArrowRight aria-hidden="true" />
                </Link>
              </Button>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-rel-control border border-rel-border p-4">
                <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-rel-muted">
                  <BadgeCheck className="h-4 w-4" aria-hidden="true" />
                  Vigentes
                </p>
                <p className="mt-1 font-rel-heading text-2xl font-black tabular-nums text-rel-dark">
                  {consulta.datos.constancias_vigentes}
                </p>
              </div>
              <div
                className={`rounded-rel-control border p-4 ${
                  consulta.datos.constancias_por_vencer > 0
                    ? "border-rel-warning bg-rel-warning-subtle"
                    : "border-rel-border"
                }`}
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-rel-muted">
                  Por vencer
                </p>
                <p className="mt-1 font-rel-heading text-2xl font-black tabular-nums text-rel-dark">
                  {consulta.datos.constancias_por_vencer}
                </p>
                <p className="mt-1 text-xs text-rel-muted">
                  En los próximos {consulta.datos.dias_aviso_vencimiento} días
                </p>
              </div>
              <div
                className={`rounded-rel-control border p-4 ${
                  consulta.datos.constancias_vencidas > 0
                    ? "border-rel-danger bg-rel-danger-subtle"
                    : "border-rel-border"
                }`}
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-rel-muted">
                  Vencidas
                </p>
                <p className="mt-1 font-rel-heading text-2xl font-black tabular-nums text-rel-dark">
                  {consulta.datos.constancias_vencidas}
                </p>
                <p className="mt-1 text-xs text-rel-muted">Piden reinducción</p>
              </div>
            </div>
          </Panel>

          {/* --- atrasadas --- */}
          {consulta.datos.atrasadas.length > 0 ? (
            <Panel className="space-y-3">
              <h2 className="flex items-center gap-2 font-rel-heading text-lg font-bold text-rel-dark">
                <AlertTriangle
                  className="h-5 w-5 text-rel-warning"
                  aria-hidden="true"
                />
                Pasó la fecha objetivo y queda gente
              </h2>
              <ul className="divide-y divide-rel-border">
                {consulta.datos.atrasadas.map((a) => (
                  <li
                    key={a.id}
                    className="flex min-w-0 flex-wrap items-center justify-between gap-3 py-3"
                  >
                    <div className="min-w-0">
                      <p className="break-words font-semibold text-rel-dark">
                        {a.curso_titulo}
                      </p>
                      <p className="break-words text-sm text-rel-muted">
                        Objetivo {formatearFecha(a.fecha_objetivo)} ·{" "}
                        {a.en_curso} en curso · {a.sin_empezar} sin empezar
                      </p>
                    </div>
                    <Button variant="relOutline" size="sm" asChild>
                      <Link to={`/capacitaciones/asignaciones/${a.id}/avance`}>
                        Ver quién falta
                      </Link>
                    </Button>
                  </li>
                ))}
              </ul>
            </Panel>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
