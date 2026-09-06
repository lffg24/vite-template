// src/pages/capacitaciones/CapacitacionesEstadoPage.tsx · A-08
//
// Rol: administrador de la empresa o soporte de REL.
// Trabajo a resolver: «el módulo no me deja hacer X — ¿de quién es el problema?»
//
// Decisión de jerarquía: **tres condiciones, tres filas**. Un semáforo único
// «activo / inactivo» obligaría a diagnosticar por eliminación, que es
// exactamente lo que esta pantalla existe para evitar. Las tres se comprueban
// por separado en el backend (`hseq/core/habilitacion.py`) y se muestran por
// separado aquí, porque se arreglan por caminos distintos: una es comercial,
// otra es un interruptor de REL, y la tercera es el rol del usuario.

import { AlertTriangle, CheckCircle2, CircleSlash, HelpCircle, XCircle } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { obtenerEstadoModulo } from "@/services/capacitacionesService";
import type { ModuloEstado } from "@/types/capacitaciones";
import { useConsulta } from "@/features/capacitaciones/useConsulta";
import {
  CargandoPanel,
  ErrorConsulta,
} from "@/features/capacitaciones/components/EstadoPantalla";
import {
  PERMISOS_CAPACITACIONES,
  formatearFecha,
} from "@/features/capacitaciones/formato";
import { useCapacitaciones } from "@/features/capacitaciones/ContextoCapacitaciones";

type Veredicto = "si" | "no" | "indefinido";

function Condicion({
  titulo,
  veredicto,
  detalle,
  comoSeArregla,
}: {
  titulo: string;
  veredicto: Veredicto;
  detalle: string;
  comoSeArregla: string;
}) {
  const config = {
    si: {
      Icono: CheckCircle2,
      color: "text-rel-success",
      badge: <Badge variant="relSuccess">Cumple</Badge>,
    },
    no: {
      Icono: XCircle,
      color: "text-rel-danger",
      badge: <Badge variant="relDanger">No cumple</Badge>,
    },
    // Una bandera sin declarar bloquea igual que apagada, pero no es lo mismo:
    // apagada es una decisión, ausente es configuración que falta.
    indefinido: {
      Icono: HelpCircle,
      color: "text-rel-warning",
      badge: <Badge variant="relWarning">Sin declarar</Badge>,
    },
  }[veredicto];

  const { Icono } = config;

  return (
    <li className="flex flex-col gap-3 border-b border-rel-border py-4 last:border-b-0 sm:flex-row sm:items-start sm:gap-4">
      <Icono className={`mt-0.5 h-5 w-5 shrink-0 ${config.color}`} aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-rel-heading text-base font-bold text-rel-dark">{titulo}</h3>
          {config.badge}
        </div>
        <p className="mt-1 font-rel-body text-sm text-rel-muted">{detalle}</p>
        {veredicto !== "si" ? (
          <p className="mt-2 font-rel-body text-sm text-rel-dark/80">
            <span className="font-semibold">Cómo se resuelve: </span>
            {comoSeArregla}
          </p>
        ) : null}
      </div>
    </li>
  );
}

function veredictoBandera(valor: boolean | null): Veredicto {
  if (valor === null) return "indefinido";
  return valor ? "si" : "no";
}

function Resumen({ estado }: { estado: ModuloEstado }) {
  if (estado.operable) {
    return (
      <div className="flex items-start gap-3 rounded-rel-panel border border-rel-success/30 bg-rel-success-subtle p-5">
        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-rel-success" aria-hidden="true" />
        <div>
          <h2 className="font-rel-heading text-lg font-bold text-rel-dark">
            El módulo está operativo
          </h2>
          <p className="mt-1 font-rel-body text-sm text-rel-dark/80">
            Las tres condiciones se cumplen: contrato vigente, habilitación técnica
            encendida y tu rol incluye los permisos.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      role="alert"
      className="flex items-start gap-3 rounded-rel-panel border border-rel-warning/30 bg-rel-warning-subtle p-5"
    >
      <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-rel-warning" aria-hidden="true" />
      <div>
        <h2 className="font-rel-heading text-lg font-bold text-rel-dark">
          El módulo no está operativo
        </h2>
        <p className="mt-1 font-rel-body text-sm text-rel-dark/80">
          Al menos una condición no se cumple. Abajo está cuál, y por dónde se
          resuelve. Las operaciones seguirán devolviendo «no disponible» hasta
          entonces.
        </p>
      </div>
    </div>
  );
}

export default function CapacitacionesEstadoPage() {
  const { capacidades } = useCapacitaciones();
  const consulta = useConsulta<ModuloEstado>(() => obtenerEstadoModulo(), []);

  // Del contexto efectivo, no del JWT. Aquí se muestran las capacidades ya
  // resueltas —permiso + contrato + bandera— porque esta pantalla existe para
  // explicar por qué algo no se puede, y el permiso suelto no lo explica.
  const permisoEditar = Boolean(capacidades?.puede_editar_catalogo);
  const permisoPublicar = Boolean(capacidades?.puede_publicar);
  const permisoAsignar = Boolean(capacidades?.puede_asignar);
  const algunPermiso = Boolean(capacidades?.tiene_acceso);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-rel-heading text-2xl font-bold tracking-tight text-rel-dark sm:text-3xl">
          Estado del módulo
        </h1>
        <p className="mt-1 max-w-prose font-rel-body text-sm text-rel-muted">
          Capacitaciones exige tres condiciones independientes. Se comprueban por
          separado para que un bloqueo se pueda atribuir en vez de adivinarse.
        </p>
      </header>

      {consulta.fase === "cargando" ? <CargandoPanel etiqueta="Consultando el estado…" /> : null}

      {consulta.fase === "error" && consulta.error ? (
        // Aquí NO se traduce un 403 a la pantalla de permisos: esta ES la
        // pantalla que explica los permisos, y redirigir a sí misma dejaría al
        // usuario en un bucle.
        //
        // El endpoint SÍ exige capacidad —expone estado comercial— así que un
        // 403 aquí es legítimo y significa «no tienes nada en este módulo». Se
        // muestra tal cual, y la tarjeta de permisos de abajo, que se pinta con
        // el contexto y no con esta consulta, dice cuáles faltan.
        <div
          role="alert"
          className="rounded-rel-panel border border-rel-danger/30 bg-rel-danger-subtle p-6"
        >
          <h2 className="font-rel-heading text-base font-bold text-rel-dark">
            No pudimos consultar el estado
          </h2>
          <p className="mt-1 font-rel-body text-sm text-rel-dark/80">
            {consulta.error.message}
          </p>
          <Button variant="relOutline" size="sm" className="mt-4" onClick={consulta.refrescar}>
            Reintentar
          </Button>
        </div>
      ) : null}

      {consulta.fase === "listo" && consulta.datos ? (
        <>
          <Resumen estado={consulta.datos} />

          <Card className="rounded-rel-panel border-rel-border bg-rel-surface">
            <CardHeader>
              <CardTitle className="font-rel-heading text-lg text-rel-dark">
                Las tres condiciones
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="divide-y-0">
                <Condicion
                  titulo="1 · Contrato del módulo"
                  veredicto={consulta.datos.contratado ? "si" : "no"}
                  detalle={
                    consulta.datos.contratado
                      ? `Vigente${
                          consulta.datos.vigencia_hasta
                            ? ` hasta el ${formatearFecha(consulta.datos.vigencia_hasta)}`
                            : " sin fecha de fin"
                        }.`
                      : "Esta empresa no tiene Capacitaciones contratado, o su vigencia terminó."
                  }
                  comoSeArregla="Es una gestión comercial con REL Consilium. No se resuelve desde la aplicación."
                />
                {/* El catálogo lo gobierna la bandera GLOBAL, no la de esta
                    empresa: es contenido editorial que consumen todas. Pintar
                    aquí el valor con override diría «no cumple» mientras el
                    catálogo funciona perfectamente — justo el diagnóstico
                    equivocado que esta pantalla existe para evitar. */}
                <Condicion
                  titulo="2 · Habilitación del catálogo"
                  veredicto={veredictoBandera(consulta.datos.bandera_catalogo_global)}
                  detalle={
                    consulta.datos.bandera_catalogo_global === null
                      ? "La bandera «capacitaciones.catalogo» no está declarada. Sin declarar bloquea igual que apagada."
                      : consulta.datos.bandera_catalogo_global
                        ? "Redactar y publicar cursos está habilitado. Es una bandera global: el catálogo no es de ninguna empresa."
                        : "REL apagó la edición del catálogo para toda la plataforma."
                  }
                  comoSeArregla="La enciende REL desde la configuración técnica. Si dice «sin declarar», falta crear la bandera, no encenderla."
                />
                {/* Solo cuando difieren. Que existan dos valores no le importa
                    a nadie hasta que uno contradice al otro, y entonces esta es
                    la única pantalla donde se puede ver. */}
                {consulta.datos.bandera_catalogo !== null &&
                consulta.datos.bandera_catalogo !== consulta.datos.bandera_catalogo_global ? (
                  <li className="border-b border-rel-border py-4 last:border-b-0">
                    <p className="font-rel-body text-sm text-rel-muted">
                      <span className="font-semibold text-rel-dark">Nota: </span>
                      esta empresa tiene un ajuste propio de la bandera del
                      catálogo (
                      {consulta.datos.bandera_catalogo ? "encendida" : "apagada"}
                      ), pero <strong>no aplica</strong>: el catálogo es global y
                      lo decide el valor de toda la plataforma. El ajuste por
                      empresa solo gobierna las asignaciones.
                    </p>
                  </li>
                ) : null}
                <Condicion
                  titulo="3 · Habilitación de asignaciones"
                  veredicto={veredictoBandera(consulta.datos.bandera_asignacion)}
                  detalle={
                    consulta.datos.bandera_asignacion === null
                      ? "La bandera «capacitaciones.asignacion» no está declarada."
                      : consulta.datos.bandera_asignacion
                        ? "Asignar cursos y repartir enlaces está habilitado."
                        : "REL apagó las asignaciones para esta empresa."
                  }
                  comoSeArregla="Se enciende aparte del catálogo: se puede querer congelar la edición sin dejar de asignar cursos ya publicados."
                />
              </ul>
            </CardContent>
          </Card>

          <Card className="rounded-rel-panel border-rel-border bg-rel-surface">
            <CardHeader>
              <CardTitle className="font-rel-heading text-lg text-rel-dark">
                Tus permisos
              </CardTitle>
            </CardHeader>
            <CardContent>
              {algunPermiso ? null : (
                <p
                  role="alert"
                  className="mb-4 rounded-rel-card bg-rel-warning-subtle p-3 font-rel-body text-sm text-rel-dark"
                >
                  Tu rol no incluye ningún permiso de Capacitaciones. Aunque el
                  contrato y las banderas estén bien, no podrás operar el módulo.
                </p>
              )}
              <ul className="space-y-2 font-rel-body text-sm">
                {[
                  {
                    ok: permisoEditar,
                    etiqueta: "Redactar cursos y lecciones",
                    clave: PERMISOS_CAPACITACIONES.editar,
                  },
                  {
                    ok: permisoPublicar,
                    etiqueta: "Publicar versiones",
                    clave: PERMISOS_CAPACITACIONES.publicar,
                  },
                  {
                    ok: permisoAsignar,
                    etiqueta: "Asignar cursos y generar enlaces",
                    clave: PERMISOS_CAPACITACIONES.asignar,
                  },
                ].map(({ ok, etiqueta, clave }) => (
                  <li key={clave} className="flex items-center gap-2.5">
                    {ok ? (
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-rel-success" aria-hidden="true" />
                    ) : (
                      <CircleSlash className="h-4 w-4 shrink-0 text-rel-neutral" aria-hidden="true" />
                    )}
                    <span className={ok ? "text-rel-dark" : "text-rel-muted"}>{etiqueta}</span>
                    <span className="sr-only">{ok ? "concedido" : "no concedido"}</span>
                    <code className="ml-auto hidden text-xs text-rel-muted sm:inline">{clave}</code>
                  </li>
                ))}
              </ul>
              <p className="mt-4 font-rel-body text-sm text-rel-muted">
                Publicar y asignar son permisos distintos porque son actos
                distintos: publicar es editorial sobre el catálogo, asignar es
                operativo sobre una empresa concreta.
              </p>
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  );
}
