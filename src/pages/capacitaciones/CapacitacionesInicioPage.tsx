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
//
// ## Con qué se dibuja
//
// Las cifras son `IndicadorKpi` (el tono dice si hay algo que mirar: atención o
// peligro solo cuando el número es mayor que cero). Cuando no hay atrasadas se
// dice «Todo al día» con su ilustración: sin eso, «no hay alertas» y «no cargó»
// se ven igual.

import { Link } from "react-router-dom";
import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  GraduationCap,
  LayoutDashboard,
  PlayCircle,
  UserRoundX,
  type LucideIcon,
} from "lucide-react";

import { PageHeader } from "@/shared/ui/PageHeader";
import { Panel } from "@/shared/ui/Panel";
import { Ayuda } from "@/shared/ui/Ayuda";
import { Caja } from "@/shared/ui/Caja";
import { IndicadorKpi } from "@/shared/ui/IndicadorKpi";
import { Illustration } from "@/shared/ui/illustration";
import type { TonoAzulejo } from "@/shared/ui/AzulejoIcono";
import { Button } from "@/components/ui/button";
import { obtenerTablero } from "@/services/capacitacionesService";
import { useConsulta } from "@/features/capacitaciones/useConsulta";
import {
  CargandoPanel,
  ErrorConsulta,
} from "@/features/capacitaciones/components/EstadoPantalla";
import { formatearFecha } from "@/features/capacitaciones/formato";

/**
 * Una cifra del módulo: el indicador de la casa. Solo es enlace lo que lleva a
 * algún sitio; un recuadro que parece pulsable y no hace nada enseña a no
 * pulsar los que sí.
 */
function Cifra({
  etiqueta,
  valor,
  ayuda,
  a,
  icono,
  tono,
}: {
  etiqueta: string;
  valor: number;
  ayuda?: string;
  a?: string;
  icono: LucideIcon;
  tono: TonoAzulejo;
}) {
  const indicador = (
    <IndicadorKpi
      etiqueta={etiqueta}
      valor={valor}
      icono={icono}
      tono={tono}
      className={
        a
          ? "transition-colors duration-enter ease-rel-out group-hover:border-rel-primary motion-reduce:transition-none"
          : undefined
      }
    />
  );
  return (
    <div className="relative min-w-0">
      {a ? (
        <Link
          to={a}
          className="group block rounded-rel-panel focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rel-primary"
        >
          {indicador}
        </Link>
      ) : (
        indicador
      )}
      {ayuda ? (
        <span className="absolute right-3 top-3">
          <Ayuda etiqueta={`Qué cuenta ${etiqueta}`}>{ayuda}</Ayuda>
        </span>
      ) : null}
    </div>
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
        <CargandoPanel etiqueta="Cargando el resumen del módulo…" forma="detalle" />
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
              icono={ClipboardList}
              tono="marca"
              ayuda="Cursos que se están dictando ahora en esta empresa."
            />
            <Cifra
              etiqueta="Sin empezar"
              valor={consulta.datos.sin_empezar}
              icono={UserRoundX}
              tono={consulta.datos.sin_empezar > 0 ? "atencion" : "neutro"}
              ayuda="Gente con invitación que todavía sirve y que nunca entró. Es sobre quien se puede actuar hoy con un recordatorio."
            />
            <Cifra
              etiqueta="En curso"
              valor={consulta.datos.personas_en_curso}
              icono={PlayCircle}
              tono="info"
              ayuda="Entraron y les faltan lecciones obligatorias."
            />
            <Cifra
              etiqueta="Completados"
              valor={consulta.datos.personas_completadas}
              icono={GraduationCap}
              tono="exito"
              ayuda="Terminaron lo obligatorio de la versión que estaban cursando."
            />
          </div>

          {/* --- constancias --- */}
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
              <IndicadorKpi
                etiqueta="Vigentes"
                valor={consulta.datos.constancias_vigentes}
                icono={BadgeCheck}
                tono="exito"
              />
              <IndicadorKpi
                etiqueta="Por vencer"
                valor={consulta.datos.constancias_por_vencer}
                icono={CalendarClock}
                tono={consulta.datos.constancias_por_vencer > 0 ? "atencion" : "neutro"}
                contexto={`En los próximos ${consulta.datos.dias_aviso_vencimiento} días`}
              />
              <IndicadorKpi
                etiqueta="Vencidas"
                valor={consulta.datos.constancias_vencidas}
                icono={AlertTriangle}
                tono={consulta.datos.constancias_vencidas > 0 ? "peligro" : "neutro"}
                contexto="Piden reinducción"
              />
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
                      <p className="wrap-break-word font-semibold text-rel-dark">
                        {a.curso_titulo}
                      </p>
                      <p className="wrap-break-word text-sm text-rel-muted">
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
          ) : (
            <Caja papel="caja" className="flex items-center gap-4">
              <Illustration name="satisfactorio" size="sm" className="shrink-0" />
              <div className="min-w-0">
                <p className="flex items-center gap-2 font-rel-heading font-bold text-rel-dark">
                  <CheckCircle2 className="h-5 w-5 text-rel-success" aria-hidden="true" />
                  Todo al día
                </p>
                <p className="text-sm text-rel-muted">
                  Ninguna asignación pasó su fecha objetivo con gente pendiente.
                </p>
              </div>
            </Caja>
          )}
        </>
      ) : null}
    </div>
  );
}
