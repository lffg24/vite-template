// src/pages/superadmin/SuperAdminHabilitacionPage.tsx
//
// Abrir Capacitaciones o CX a una empresa desde el control de plataforma.
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
import { BookOpen, CheckCircle2, Circle, Loader2, MessageSquareHeart, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  obtenerProteccionPublicaCx,
  suspenderContrato,
  type EstadoDeHabilitacion,
} from "@/services/habilitacionService";
import { useConsulta } from "@/features/capacitaciones/useConsulta";
import type { ErrorApi } from "@/types/capacitaciones";

const MODULOS = [
  {
    codigo: "CAPACITACIONES",
    nombre: "Capacitaciones",
    descripcion: "Cursos, asignaciones y participación por enlace.",
    icono: BookOpen,
    accesoPublico: "capacitaciones.participacion",
  },
  {
    codigo: "CX",
    nombre: "Satisfacción del cliente",
    descripcion: "Encuestas de calificación mediante enlaces y QR.",
    icono: MessageSquareHeart,
    accesoPublico: "cx.calificaciones.publico",
  },
] as const;
type Modulo = (typeof MODULOS)[number]["codigo"];

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
  cumplida?: boolean;
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
          <span className="sr-only">{cumplida === undefined ? "se verifica por usuario" : cumplida ? "cumplida" : "pendiente"}</span>
        </p>
        <p className="break-words text-sm text-rel-muted">{children}</p>
      </div>
    </li>
  );
}

export default function SuperAdminHabilitacionPage() {
  const { toast } = useToast();
  const [modulo, setModulo] = useState<Modulo>("CAPACITACIONES");
  const [empresa, setEmpresa] = useState<SuperEmpresa | null>(null);
  const [busqueda, setBusqueda] = useState("");
  const [pagina, setPagina] = useState(1);
  const [tamanoPagina, setTamanoPagina] = useState(10);
  const [guardando, setGuardando] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);
  const [contratoPorSuspender, setContratoPorSuspender] = useState<string | null>(null);
  const configuracion = MODULOS.find((item) => item.codigo === modulo)!;

  const empresas = useConsulta(
    () => superadminService.empresas({
      q: busqueda || undefined,
      page: pagina,
      page_size: tamanoPagina,
    }),
    [busqueda, pagina, tamanoPagina]
  );

  const plataforma = useConsulta(
    () => obtenerHabilitacionPlataforma(modulo),
    [modulo, revision]
  );

  const estado = useConsulta<EstadoDeHabilitacion | null>(
    async () => (empresa ? await obtenerHabilitacion(empresa.id, modulo) : null),
    [empresa?.id, modulo, revision]
  );
  const proteccionPublica = useConsulta<boolean | null>(
    async () => modulo === "CX" ? await obtenerProteccionPublicaCx() : null,
    [modulo, revision]
  );

  async function conContexto(que: string, accion: () => Promise<void>): Promise<boolean> {
    setGuardando(que);
    try {
      await accion();
      setRevision((r) => r + 1);
      return true;
    } catch (e) {
      const err = e as ErrorApi;
      toast({
        variant: "destructive",
        title: "No se pudo guardar",
        description: err.message,
      });
      return false;
    } finally {
      setGuardando(null);
    }
  }

  // useConsulta conserva el resultado anterior durante un cambio. No mostrar
  // una bandera de Capacitaciones bajo la etiqueta de CX ni al revés.
  const datos = estado.fase === "listo" && estado.datos?.modulo === modulo
    ? estado.datos : null;
  const globales = plataforma.fase === "listo" && plataforma.datos?.modulo === modulo
    ? plataforma.datos.banderas : [];
  const banderas = datos?.banderas ?? [];
  const participacion = banderas.find((b) => b.clave === configuracion.accesoPublico);
  const contratoActivo = datos?.contratos.find((c) => c.estado === "ACTIVO");

  return (
    <div className="rel-scope font-rel-body text-rel-dark">
      <SuperAdminPageHeader
        title="Habilitar módulos"
        subtitle="Qué empresa puede usar qué módulo, y qué le falta para poder usarlo."
        icon={ShieldCheck}
      />

      <section className="mt-6 rounded-rel-card border border-rel-border bg-rel-surface p-5" aria-labelledby="titulo-modulos">
        <h2 id="titulo-modulos" className="font-rel-heading text-lg font-bold">Módulo que quieres habilitar</h2>
        <p className="mt-1 text-sm text-rel-muted">El contrato y las funcionalidades se gestionan por módulo y por empresa.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {MODULOS.map((item) => {
            const Icono = item.icono;
            const elegido = item.codigo === modulo;
            return (
              <button
                key={item.codigo}
                type="button"
                aria-pressed={elegido}
                disabled={guardando !== null}
                onClick={() => setModulo(item.codigo)}
                className={`flex min-h-[5rem] min-w-0 items-start gap-3 rounded-rel-control border p-4 text-left transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rel-primary disabled:opacity-60 ${
                  elegido ? "border-rel-primary bg-rel-accent-subtle" : "border-rel-border bg-rel-surface hover:bg-rel-surface-subtle"
                }`}
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-rel-control bg-rel-surface text-rel-primary">
                  <Icono className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className="min-w-0">
                  <span className="block font-semibold text-rel-dark">{item.nombre}</span>
                  <span className="mt-1 block text-sm text-rel-muted">{item.descripcion}</span>
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {modulo === "CAPACITACIONES" ? (
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
          {plataforma.fase === "error" ? (
            <div role="alert" className="mt-4 text-sm text-destructive">
              No pudimos consultar el estado global. <Button variant="link" onClick={() => void plataforma.refrescar()}>Reintentar</Button>
            </div>
          ) : null}
          <ul className="mt-4 space-y-3">
            {globales.map((bandera) => (
              <li key={bandera.clave} className="flex min-w-0 items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-semibold">{bandera.nombre}</p>
                  <p className="text-sm text-rel-muted">{bandera.para_que}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2 text-sm">
                  <Switch
                    className="data-[state=unchecked]:bg-rel-border-strong"
                    checked={Boolean(bandera.habilitado_global)}
                    disabled={guardando !== null}
                    aria-label={`${bandera.nombre} global`}
                    onCheckedChange={(checked) => conContexto(
                      `global:${bandera.clave}`,
                      () => cambiarBanderaGlobal({
                        modulo,
                        clave: bandera.clave,
                        habilitado: checked,
                      }),
                    )}
                  />
                  <span className="text-rel-muted">{bandera.habilitado_global ? "Encendido" : "Apagado"}</span>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <div className="mt-6 grid items-start gap-6 lg:grid-cols-[320px_1fr]">
        <aside className="overflow-hidden rounded-rel-card border border-rel-border bg-rel-surface">
          <div className="space-y-3 p-4">
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
          {empresas.fase === "error" ? (
            <div role="alert" className="text-sm text-destructive">
              No pudimos consultar las empresas. <Button variant="link" onClick={() => void empresas.refrescar()}>Reintentar</Button>
            </div>
          ) : null}
          </div>
          <ul className="max-h-[27rem] space-y-1 overflow-y-auto border-t border-rel-border p-2">
            {empresas.fase === "cargando" ? (
              <li role="status" className="p-3 text-sm text-rel-muted">Consultando empresas…</li>
            ) : null}
            {empresas.fase === "listo" && empresas.datos?.items.length === 0 ? (
              <li className="p-3 text-sm text-rel-muted">No encontramos empresas con esa búsqueda.</li>
            ) : null}
            {(empresas.fase === "listo" ? empresas.datos?.items ?? [] : []).map((e) => (
              <li key={e.id}>
                <button
                  type="button"
                  onClick={() => setEmpresa(e)}
                  aria-current={empresa?.id === e.id ? "true" : undefined}
                  className={`w-full rounded-rel-control px-3 py-2 text-left text-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rel-primary ${
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
                Aquí verás qué le falta para usar {configuracion.nombre}.
              </p>
            </div>
          ) : null}

          {empresa && estado.fase === "cargando" ? (
            <p role="status" className="text-sm text-rel-muted">
              Consultando la habilitación de {empresa.nombre}…
            </p>
          ) : null}
          {empresa && estado.fase === "error" ? (
            <div role="alert" className="rounded-rel-card border border-destructive/30 bg-rel-surface p-5 text-sm text-destructive">
              No pudimos consultar la habilitación de {empresa.nombre}. <Button variant="link" onClick={() => void estado.refrescar()}>Reintentar</Button>
            </div>
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
                      ? modulo === "CX"
                        ? "El interruptor está encendido. Para recibir calificaciones también se exige un contrato vigente y protección del gateway."
                        : "El interruptor está encendido. El acceso por enlace también exige un contrato vigente."
                      : modulo === "CX"
                        ? "Los enlaces y QR de calificación permanecen cerrados para esta empresa."
                        : "Sin esto el enlace se genera, pero al abrirlo responde que no está habilitado para esta empresa."}
                  </Condicion>
                  {modulo === "CX" ? (
                    <Condicion
                      cumplida={proteccionPublica.fase === "listo" && proteccionPublica.datos !== null
                        ? proteccionPublica.datos : undefined}
                      titulo="Protección pública configurada"
                    >
                      {proteccionPublica.fase === "error" ? (
                        <>No pudimos verificar esta condición. <Button variant="link" onClick={() => void proteccionPublica.refrescar()}>Reintentar</Button></>
                      ) : proteccionPublica.fase === "cargando" ? "Verificando la protección de CX…"
                        : proteccionPublica.datos
                          ? "El servidor confirma los límites de captura y la verificación operativa del gateway."
                          : "Faltan credenciales, límites de captura o la verificación operativa del gateway. Los enlaces permanecen cerrados."}
                    </Condicion>
                  ) : null}
                  <Condicion titulo="Permiso de quien opera">
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
                    Esta empresa nunca ha tenido {configuracion.nombre}.
                  </p>
                ) : (
                  <ul className="mt-3 space-y-2 text-sm">
                    {datos.contratos.map((c) => (
                      <li key={c.id} className="flex flex-wrap items-center gap-2 border-b border-rel-border py-2 last:border-0">
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
                        {c.id === contratoActivo?.id ? (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="ml-auto"
                            disabled={guardando !== null}
                            onClick={() => setContratoPorSuspender(c.id)}
                          >
                            Suspender contrato
                          </Button>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                )}
                {!contratoActivo ? (
                  <Button
                    className="mt-4 min-h-[2.75rem] w-full sm:w-auto"
                    variant="rel"
                    disabled={guardando !== null}
                    onClick={() =>
                      conContexto("contrato", () =>
                        crearContrato(empresa.id, {
                          modulo,
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
                  {modulo === "CX"
                    ? "La captura pública se enciende empresa por empresa. El contrato y la protección del gateway siguen siendo necesarios."
                    : "Asignaciones y acceso público se encienden empresa por empresa. El catálogo global se administra en el control superior."}
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
                          className="data-[state=unchecked]:bg-rel-border-strong"
                          checked={Boolean(b.efectiva)}
                          disabled={guardando !== null}
                          aria-label={`${b.nombre} para ${empresa.nombre}`}
                          onCheckedChange={(checked) =>
                            conContexto(b.clave, () =>
                              cambiarBandera(empresa.id, {
                                modulo,
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
      <AlertDialog open={contratoPorSuspender !== null} onOpenChange={(abierto) => !abierto && setContratoPorSuspender(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Suspender contrato de {configuracion.nombre}</AlertDialogTitle>
            <AlertDialogDescription>
              {empresa?.nombre} perderá acceso a este módulo mientras el contrato esté suspendido. Sus datos históricos se conservan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={guardando !== null}>Cancelar</AlertDialogCancel>
            <Button
              type="button"
              variant="destructive"
              disabled={guardando !== null}
              onClick={() => {
                if (!empresa || !contratoPorSuspender) return;
                void conContexto("suspender", () => suspenderContrato(empresa.id, contratoPorSuspender, modulo))
                  .then((ok) => { if (ok) setContratoPorSuspender(null); });
              }}
            >
              {guardando === "suspender" ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
              Suspender contrato
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
