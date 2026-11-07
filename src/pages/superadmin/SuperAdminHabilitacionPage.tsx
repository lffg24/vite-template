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
import { Switch } from "@/components/ui/switch";
import { StandardPagination } from "@/components/common/StandardPagination";
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
  const [pagina, setPagina] = useState(1);
  const [tamanoPagina, setTamanoPagina] = useState(10);
  const [guardando, setGuardando] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);

  const empresas = useConsulta(
    () => superadminService.empresas({
      q: busqueda || undefined,
      page: pagina,
      page_size: tamanoPagina,
    }),
    [busqueda, pagina, tamanoPagina]
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
  const asignacion = banderas.find((b) => b.clave === "capacitaciones.asignacion");

  return (
    <div className="rel-scope font-rel-body text-rel-dark">
      <SuperAdminPageHeader
        title="Habilitar módulos"
        subtitle="Acceso operativo por empresa y funcionalidades de plataforma."
        icon={ShieldCheck}
      />

      <section className="rounded-rel-card border border-rel-border bg-rel-surface p-5" aria-labelledby="alcance-habilitacion">
        <h2 id="alcance-habilitacion" className="font-rel-heading text-lg font-bold">Qué administra esta pantalla</h2>
        <p className="mt-1 text-sm text-rel-muted">
          Por ahora puedes configurar <strong className="text-rel-dark">Capacitaciones</strong>. El modelo de acceso admite otros módulos, pero cada uno debe incorporar sus propios controles antes de aparecer aquí. Psicosocial conserva su administración actual.
        </p>
        <p className="mt-3 rounded-rel-control bg-rel-accent-subtle px-4 py-3 text-sm text-rel-dark">
          <strong>Importante:</strong> «Contrato activo» significa que existe un registro técnico de vigencia para permitir el acceso. Esta pantalla no registra pagos, facturas ni confirma que el módulo esté pagado.
        </p>
      </section>

      <details className="mt-5 rounded-rel-card border border-rel-border bg-rel-surface p-5">
        <summary className="cursor-pointer font-rel-heading font-bold text-rel-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rel-primary">Configuración global del catálogo</summary>
        <div className="flex min-w-0 items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-rel-control bg-rel-accent-subtle text-rel-primary">
            <BookOpen className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="font-rel-heading font-bold">Catálogo compartido de Capacitaciones</h2>
            <p className="mt-1 text-sm text-rel-muted">
              Control de plataforma: permite redactar y publicar cursos para todas las empresas. No habilita por sí solo el acceso de una empresa ni el permiso de una persona.
            </p>
          </div>
        </div>
        {plataforma.fase === "cargando" ? (
          <p role="status" className="mt-4 text-sm text-rel-muted">Consultando el estado global…</p>
        ) : null}
        {plataforma.fase === "error" ? (
          <p role="alert" className="mt-4 text-sm text-rel-error">No se pudo consultar el catálogo global.</p>
        ) : null}
        <ul className="mt-4 space-y-3">
          {(plataforma.datos?.banderas ?? []).map((bandera) => (
            <li key={bandera.clave} className="flex min-w-0 items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="font-semibold">{bandera.nombre}</p>
                <p className="text-sm text-rel-muted">{bandera.para_que}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2 text-sm">
                <Switch
                  checked={Boolean(bandera.habilitado_global)}
                  disabled={guardando !== null}
                  aria-label={`${bandera.nombre} global`}
                  onCheckedChange={(checked) => conContexto(
                    `global:${bandera.clave}`,
                    () => cambiarBanderaGlobal({
                      modulo: MODULO,
                      clave: bandera.clave,
                      habilitado: checked,
                    }),
                  )}
                />
                <span className="text-rel-muted">
                  {bandera.habilitado_global ? "Encendido" : "Apagado"}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </details>

      <div className="mt-5 grid items-start gap-5 lg:grid-cols-[minmax(240px,300px)_minmax(0,1fr)]">
        <aside className="overflow-hidden rounded-rel-card border border-rel-border bg-rel-surface">
          <div className="space-y-3 p-4">
          <h2 className="font-rel-heading text-lg font-bold">1. Selecciona la empresa</h2>
          <Label htmlFor="buscar-empresa" className="text-rel-dark">
            Buscar empresa
          </Label>
          <Input
            id="buscar-empresa"
            type="search"
            value={busqueda}
            onChange={(e) => {
              setBusqueda(e.target.value);
              setPagina(1);
            }}
            placeholder="Buscar por nombre o NIT"
          />
          </div>
          {empresas.fase === "cargando" ? <p role="status" className="px-4 pb-3 text-sm text-rel-muted">Buscando empresas…</p> : null}
          {empresas.fase === "error" ? <p role="alert" className="px-4 pb-3 text-sm text-rel-error">No se pudo cargar la lista de empresas.</p> : null}
          {empresas.fase === "listo" && empresas.datos?.items.length === 0 ? <p className="px-4 pb-3 text-sm text-rel-muted">No encontramos empresas con esta búsqueda.</p> : null}
          <ul className="max-h-[27rem] space-y-1 overflow-y-auto border-t border-rel-border p-2">
            {(empresas.datos?.items ?? []).map((e) => (
              <li key={e.id}>
                <button
                  type="button"
                  onClick={() => setEmpresa(e)}
                  aria-current={empresa?.id === e.id ? "true" : undefined}
                  className={`w-full rounded-rel-control px-3 py-2.5 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rel-primary ${
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
          <StandardPagination
            page={pagina}
            pageSize={tamanoPagina}
            total={empresas.datos?.total ?? 0}
            pageSizeOptions={[10, 20, 50]}
            itemLabel="empresas"
            onPageChange={setPagina}
            onPageSizeChange={(nuevoTamano) => {
              setTamanoPagina(nuevoTamano);
              setPagina(1);
            }}
            className="px-3"
          />
        </aside>

        <section className="min-w-0 space-y-5">
          {!empresa ? (
            <div className="rounded-rel-card border border-rel-border bg-rel-surface p-6 text-center">
              <ShieldCheck className="mx-auto mb-3 h-7 w-7 text-rel-muted" aria-hidden="true" />
              <h2 className="font-rel-heading font-bold">Elige una empresa</h2>
              <p className="mt-1 text-sm text-rel-muted">
                Verás su acceso a Capacitaciones y los controles disponibles.
              </p>
            </div>
          ) : null}

          {empresa && estado.fase === "cargando" ? (
            <p role="status" className="text-sm text-rel-muted">
              Consultando la habilitación de {empresa.nombre}…
            </p>
          ) : null}
          {empresa && estado.fase === "error" ? <p role="alert" className="rounded-rel-card border border-rel-border bg-rel-surface p-5 text-sm text-rel-error">No se pudo consultar la habilitación de {empresa.nombre}.</p> : null}

          {empresa && datos ? (
            <>
              <div className="rounded-rel-card border border-rel-border bg-rel-surface p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-rel-primary">Capacitaciones · {empresa.nombre}</p>
                <h2 className="mt-1 font-rel-heading text-xl font-bold">
                  2. Estado de acceso
                </h2>
                <p className="mt-1 text-sm text-rel-muted">Para operar se combinan la vigencia, las funciones activadas y los permisos de cada usuario.</p>
                <ul className="mt-5 grid gap-4 md:grid-cols-2">
                  <Condicion cumplida={datos.contratado} titulo="Contrato vigente">
                    {datos.contratado
                      ? "Acceso técnico vigente para esta empresa. No indica pago o facturación."
                      : "Falta registrar la vigencia técnica del módulo para esta empresa."}
                  </Condicion>
                  <Condicion cumplida={Boolean(asignacion?.efectiva)} titulo="Asignaciones encendidas">
                    {asignacion?.efectiva ? "Se pueden asignar cursos a esta empresa." : "Activa Asignaciones abajo para repartir cursos y consultar avances."}
                  </Condicion>
                  <Condicion
                    cumplida={Boolean(participacion?.efectiva)}
                    titulo="Acceso público encendido"
                  >
                    {participacion?.efectiva
                      ? "Su gente puede entrar por el enlace sin tener cuenta."
                      : "El enlace público no estará disponible hasta activar Acceso público abajo."}
                  </Condicion>
                </ul>
                <div className="mt-5 border-t border-rel-border pt-4 text-sm">
                  <p className="font-semibold">Permisos de las personas</p>
                  <p className="mt-1 text-rel-muted">Se configuran por rol y usuario. Esta pantalla no puede comprobarlos para todas las personas de la empresa. Revísalos en{" "}
                    <Link
                      to="/superadmin/roles-permisos"
                      className="font-semibold text-rel-primary underline-offset-2 hover:underline"
                    >
                      Roles y permisos
                    </Link>
                    .</p>
                </div>
              </div>

              {/* --- contrato --- */}
              <div className="rounded-rel-card border border-rel-border bg-rel-surface p-5">
                <h3 className="font-rel-heading text-lg font-bold">3. Vigencia técnica del módulo</h3>
                <p className="mt-1 text-sm text-rel-muted">Este registro controla fechas de acceso; no registra ni acredita compras, pagos o facturas.</p>
                {datos.contratos.length === 0 ? (
                  <p className="mt-1 text-sm text-rel-muted">
                    No hay una vigencia de Capacitaciones registrada para esta empresa.
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
                    Registrar acceso desde hoy, sin fecha de fin
                  </Button>
                ) : null}
              </div>

              {/* --- funcionalidades --- */}
              <div className="rounded-rel-card border border-rel-border bg-rel-surface p-5">
                <h3 className="font-rel-heading text-lg font-bold">4. Funciones para esta empresa</h3>
                <p className="mt-1 text-sm text-rel-muted">
                  Cada interruptor afecta únicamente a {empresa.nombre}. El catálogo compartido se configura arriba.
                </p>
                <ul className="mt-4 space-y-4">
                  {banderas.map((b) => (
                    <li key={b.clave} className="flex min-w-0 items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="font-semibold text-rel-dark">{b.nombre}</p>
                        <p className="break-words text-sm text-rel-muted">{b.para_que}</p>
                      </div>
                       <div className="flex shrink-0 items-center gap-2 text-sm">
                         <Switch
                           checked={Boolean(b.efectiva)}
                           disabled={guardando !== null}
                           aria-label={`${b.nombre} para ${empresa.nombre}`}
                           onCheckedChange={(checked) =>
                             conContexto(b.clave, () =>
                               cambiarBandera(empresa.id, {
                                 modulo: MODULO,
                                 clave: b.clave,
                                 habilitado: checked,
                               })
                             )
                           }
                        />
                        <span className="text-rel-muted">
                          {b.efectiva ? "Encendida" : "Apagada"}
                        </span>
                       </div>
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
