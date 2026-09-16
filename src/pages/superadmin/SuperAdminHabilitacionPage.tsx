// src/pages/superadmin/SuperAdminHabilitacionPage.tsx
//
// Abrir un módulo a una empresa.
//
// ## El hueco que cierra
//
// Que una empresa «tenga» Capacitaciones son tres condiciones independientes, y
// hasta hoy solo una —el permiso— se administraba desde el producto. El contrato
// y las banderas eran SQL a mano, así que nadie podía habilitar a un cliente sin
// entrar a la base. El síntoma era este: se creaba el curso, se asignaba, se
// generaba el enlace, se repartía… y al abrirlo respondía «no está habilitado
// para esta empresa». Todo el trabajo se descubría inútil al final.
//
// ## Por qué se ven las tres y no solo las dos que se tocan
//
// El permiso no se administra aquí —depende de QUIÉN pregunta, no de la empresa—
// pero se nombra igual. Enseñar dos condiciones de tres deja a quien habilita
// creyendo que terminó, y el 403 que llega después parece una avería.

import { useState } from "react";
import { Link } from "react-router-dom";
import { BookOpen, CheckCircle2, Circle, Loader2, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import SuperAdminPageHeader from "./SuperAdminPageHeader";
import { useToast } from "@/hooks/use-toast";
import { superadminService, type SuperEmpresa } from "@/features/superadmin/api/superadminService";
import {
  cambiarBandera,
  cambiarBanderaGlobal,
  crearContrato,
  obtenerHabilitacion,
  obtenerHabilitacionPlataforma,
  type EstadoDeHabilitacion,
} from "@/services/habilitacionService";
import { useConsulta } from "@/features/capacitaciones/useConsulta";
import type { ErrorApi } from "@/types/capacitaciones";

const MODULO = "CAPACITACIONES";

/** Hoy LOCAL en formato ISO, que es lo que espera un `<input type="date">`. */
function hoyISO(): string {
  const hoy = new Date();
  const mes = String(hoy.getMonth() + 1).padStart(2, "0");
  const dia = String(hoy.getDate()).padStart(2, "0");
  return `${hoy.getFullYear()}-${mes}-${dia}`;
}

function Condicion({
  cumplida,
  titulo,
  children,
}: {
  cumplida: boolean;
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <li className="flex min-w-0 gap-3">
      {cumplida ? (
        <CheckCircle2
          className="mt-0.5 h-5 w-5 shrink-0 text-rel-success"
          aria-hidden="true"
        />
      ) : (
        <Circle className="mt-0.5 h-5 w-5 shrink-0 text-rel-muted" aria-hidden="true" />
      )}
      <div className="min-w-0">
        <p className="font-semibold text-rel-dark">
          {titulo}{" "}
          <span className="sr-only">{cumplida ? "cumplida" : "pendiente"}</span>
        </p>
        <p className="break-words text-sm text-rel-muted">{children}</p>
      </div>
    </li>
  );
}

export default function SuperAdminHabilitacionPage() {
  const { toast } = useToast();
  const [empresa, setEmpresa] = useState<SuperEmpresa | null>(null);
  const [busqueda, setBusqueda] = useState("");
  const [guardando, setGuardando] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);

  const empresas = useConsulta(
    () => superadminService.empresas({ q: busqueda || undefined, page: 1, page_size: 20 }),
    [busqueda]
  );

  const plataforma = useConsulta(
    () => obtenerHabilitacionPlataforma(MODULO),
    [revision]
  );

  const estado = useConsulta<EstadoDeHabilitacion | null>(
    async () => (empresa ? await obtenerHabilitacion(empresa.id, MODULO) : null),
    [empresa?.id, revision]
  );

  async function conContexto(que: string, accion: () => Promise<void>) {
    setGuardando(que);
    try {
      await accion();
      setRevision((r) => r + 1);
    } catch (e) {
      const err = e as ErrorApi;
      toast({
        variant: "destructive",
        title: "No se pudo guardar",
        description: err.message,
      });
    } finally {
      setGuardando(null);
    }
  }

  const datos = estado.datos;
  const banderas = datos?.banderas ?? [];
  const participacion = banderas.find((b) => b.clave === "capacitaciones.participacion");

  return (
    <div className="rel-scope font-rel-body text-rel-dark">
      <SuperAdminPageHeader
        title="Habilitar módulos"
        subtitle="Qué empresa puede usar qué módulo, y qué le falta para poder usarlo."
      />

      <section className="mt-6 rounded-rel-card border border-rel-border bg-rel-surface p-5">
        <div className="flex min-w-0 items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-rel-control bg-rel-accent-subtle text-rel-primary">
            <BookOpen className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="font-rel-heading font-bold">Catálogo global de Capacitación</h2>
            <p className="mt-1 text-sm text-rel-muted">
              Pertenece a la plataforma y lo comparten todas las empresas. Este control no depende del contrato de una empresa.
            </p>
          </div>
        </div>
        {plataforma.fase === "cargando" ? (
          <p role="status" className="mt-4 text-sm text-rel-muted">Consultando el estado global…</p>
        ) : null}
        <ul className="mt-4 space-y-3">
          {(plataforma.datos?.banderas ?? []).map((bandera) => (
            <li key={bandera.clave} className="flex min-w-0 items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="font-semibold">{bandera.nombre}</p>
                <p className="text-sm text-rel-muted">{bandera.para_que}</p>
              </div>
              <label className="flex shrink-0 cursor-pointer items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  className="h-5 w-5 accent-rel-primary"
                  checked={Boolean(bandera.habilitado_global)}
                  disabled={guardando !== null}
                  aria-label={`${bandera.nombre} global`}
                  onChange={(event) => conContexto(
                    `global:${bandera.clave}`,
                    () => cambiarBanderaGlobal({
                      modulo: MODULO,
                      clave: bandera.clave,
                      habilitado: event.target.checked,
                    }),
                  )}
                />
                <span className="text-rel-muted">
                  {bandera.habilitado_global ? "Encendido" : "Apagado"}
                </span>
              </label>
            </li>
          ))}
        </ul>
      </section>

      <div className="mt-6 grid items-start gap-6 lg:grid-cols-[320px_1fr]">
        <aside className="space-y-3">
          <Label htmlFor="buscar-empresa" className="text-rel-dark">
            Empresa
          </Label>
          <Input
            id="buscar-empresa"
            type="search"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por nombre o NIT"
          />
          <ul className="space-y-1">
            {(empresas.datos?.items ?? []).map((e) => (
              <li key={e.id}>
                <button
                  type="button"
                  onClick={() => setEmpresa(e)}
                  aria-current={empresa?.id === e.id ? "true" : undefined}
                  className={`w-full rounded-rel-control px-3 py-2 text-left text-sm transition-colors ${
                    empresa?.id === e.id
                      ? "bg-rel-accent-subtle font-semibold text-rel-primary"
                      : "hover:bg-rel-surface-subtle"
                  }`}
                >
                  <span className="block break-words">{e.nombre}</span>
                  {e.nit ? (
                    <span className="block text-xs text-rel-muted">NIT {e.nit}</span>
                  ) : null}
                </button>
              </li>
            ))}
          </ul>
        </aside>

        <section className="min-w-0 space-y-5">
          {!empresa ? (
            <div className="rounded-rel-card border border-rel-border bg-rel-surface p-6 text-center">
              <ShieldCheck className="mx-auto mb-3 h-7 w-7 text-rel-muted" aria-hidden="true" />
              <h2 className="font-rel-heading font-bold">Elige una empresa</h2>
              <p className="mt-1 text-sm text-rel-muted">
                Aquí se ve qué le falta para usar Capacitaciones, y se le abre.
              </p>
            </div>
          ) : null}

          {empresa && estado.fase === "cargando" ? (
            <p role="status" className="text-sm text-rel-muted">
              Consultando la habilitación de {empresa.nombre}…
            </p>
          ) : null}

          {empresa && datos ? (
            <>
              <div className="rounded-rel-card border border-rel-border bg-rel-surface p-5">
                <h2 className="font-rel-heading text-lg font-bold">
                  Qué le falta a {empresa.nombre}
                </h2>
                <ul className="mt-4 space-y-3">
                  <Condicion cumplida={datos.contratado} titulo="Contrato vigente">
                    {datos.contratado
                      ? "Tiene un contrato activo y dentro de fechas."
                      : "Sin contrato no se abre nada, aunque las funcionalidades estén encendidas."}
                  </Condicion>
                  <Condicion
                    cumplida={Boolean(participacion?.efectiva)}
                    titulo="Acceso público encendido"
                  >
                    {participacion?.efectiva
                      ? "Su gente puede entrar por el enlace sin tener cuenta."
                      : "Sin esto el enlace se genera, pero al abrirlo responde que no está habilitado para esta empresa."}
                  </Condicion>
                  <Condicion cumplida={false} titulo="Permiso de quien opera">
                    No se administra aquí porque no depende de la empresa, sino de
                    quién pregunta. Se concede en{" "}
                    <Link
                      to="/superadmin/roles-permisos"
                      className="font-semibold text-rel-primary underline-offset-2 hover:underline"
                    >
                      Roles y permisos
                    </Link>
                    .
                  </Condicion>
                </ul>
              </div>

              {/* --- contrato --- */}
              <div className="rounded-rel-card border border-rel-border bg-rel-surface p-5">
                <h3 className="font-rel-heading font-bold">Contrato</h3>
                {datos.contratos.length === 0 ? (
                  <p className="mt-1 text-sm text-rel-muted">
                    Esta empresa nunca ha tenido Capacitaciones.
                  </p>
                ) : (
                  <ul className="mt-3 space-y-2 text-sm">
                    {datos.contratos.map((c) => (
                      <li key={c.id} className="flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                            c.vigente
                              ? "bg-rel-success-subtle text-rel-success"
                              : "bg-rel-surface-subtle text-rel-muted"
                          }`}
                        >
                          {c.estado}
                        </span>
                        <span className="text-rel-muted">
                          Desde {c.vigencia_desde}
                          {c.vigencia_hasta ? ` hasta ${c.vigencia_hasta}` : " · sin fecha de fin"}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
                {!datos.contratado ? (
                  <Button
                    className="mt-4"
                    variant="rel"
                    disabled={guardando !== null}
                    onClick={() =>
                      conContexto("contrato", () =>
                        crearContrato(empresa.id, {
                          modulo: MODULO,
                          vigencia_desde: hoyISO(),
                          vigencia_hasta: null,
                        })
                      )
                    }
                  >
                    {guardando === "contrato" ? (
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    ) : null}
                    Activar desde hoy, sin fecha de fin
                  </Button>
                ) : null}
              </div>

              {/* --- funcionalidades --- */}
              <div className="rounded-rel-card border border-rel-border bg-rel-surface p-5">
                <h3 className="font-rel-heading font-bold">Funcionalidades</h3>
                <p className="mt-1 text-sm text-rel-muted">
                  Asignaciones y acceso público se encienden empresa por empresa.
                  El catálogo global se administra en el control superior.
                </p>
                <ul className="mt-4 space-y-4">
                  {banderas.map((b) => (
                    <li key={b.clave} className="flex min-w-0 items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="font-semibold text-rel-dark">{b.nombre}</p>
                        <p className="break-words text-sm text-rel-muted">{b.para_que}</p>
                      </div>
                      {/* Casilla nativa y no un interruptor pintado: trae el
                          foco, el anuncio y el manejo por teclado sin que nadie
                          tenga que acordarse de ponerlos. */}
                      <label className="flex shrink-0 cursor-pointer items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          className="h-5 w-5 accent-rel-primary"
                          checked={Boolean(b.efectiva)}
                          disabled={guardando !== null}
                          aria-label={`${b.nombre} para ${empresa.nombre}`}
                          onChange={(e) =>
                            conContexto(b.clave, () =>
                              cambiarBandera(empresa.id, {
                                modulo: MODULO,
                                clave: b.clave,
                                habilitado: e.target.checked,
                              })
                            )
                          }
                        />
                        <span className="text-rel-muted">
                          {b.efectiva ? "Encendida" : "Apagada"}
                        </span>
                      </label>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          ) : null}
        </section>
      </div>
    </div>
  );
}
