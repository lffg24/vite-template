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

import { DialogoConfirmacion } from "@/shared/ui/DialogoConfirmacion";
import { useState } from "react";
import { Link } from "react-router-dom";
import { BookOpen, CheckCircle2, Circle, Loader2, MessageSquareHeart, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EsqueletoTexto, ZonaCargando } from "@/shared/ui/Esqueleto";
import { Aviso } from "@/shared/ui/Aviso";
import { SinResultados } from "@/shared/ui/EstadoVacio";
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
  obtenerProteccionPublicaCx,
  suspenderContrato,
  type EstadoDeHabilitacion,
} from "@/services/habilitacionService";
import { useConsulta } from "@/features/capacitaciones/useConsulta";
import type { ErrorApi } from "@/types/capacitaciones";
import { Caja } from "@/shared/ui/Caja";
import { SeccionPlegable } from "@/shared/ui/SeccionPlegable";

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
        <p className="wrap-break-word text-sm text-rel-muted">{children}</p>
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
  const [fechaInicio, setFechaInicio] = useState(hoyISO);
  const [fechaFin, setFechaFin] = useState("");
  const [referencia, setReferencia] = useState("");
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
  const asignacion = banderas.find((b) => b.clave === "capacitaciones.asignacion");
  const contratoActivo = datos?.contratos.find((c) => c.estado === "ACTIVO");
  const fechaInvalida = Boolean(fechaFin && fechaFin < fechaInicio);

  return (
    <div className="rel-scope font-rel-body text-rel-dark">
      <SuperAdminPageHeader
        title="Habilitar módulos"
        subtitle="Qué empresa puede usar qué módulo, y qué le falta para poder usarlo."
        icon={ShieldCheck}
      />

      <Caja como="section" aire="normal" className="mt-6" aria-labelledby="titulo-modulos">
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
                className={`flex min-h-20 min-w-0 items-start gap-3 rounded-rel-control border p-4 text-left transition-colors focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rel-primary disabled:opacity-60 ${
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
      </Caja>

      {modulo === "CAPACITACIONES" ? (
        <SeccionPlegable
          titulo="Configuración global del catálogo"
          descripcion="Control de plataforma compartido por las empresas; no habilita acceso ni permisos de una empresa."
          abiertaPorDefecto={false}
          claveMemoria="superadmin-catalogo-global"
          className="mt-6"
        >
          <div className="flex min-w-0 items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-rel-control bg-rel-accent-subtle text-rel-primary">
              <BookOpen className="h-5 w-5" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="font-rel-heading font-bold">Catálogo global de Capacitaciones</h2>
              <p className="mt-1 text-sm text-rel-muted">
                Pertenece a la plataforma y lo comparten todas las empresas. Este control no habilita el acceso de una empresa ni los permisos de una persona.
              </p>
            </div>
          </div>
          {plataforma.fase === "cargando" ? (
            <ZonaCargando cargando etiqueta="Consultando el estado global" esqueleto={<EsqueletoTexto lineas={2} className="mt-4" />}>
              <span />
            </ZonaCargando>
          ) : null}
          {plataforma.fase === "error" ? (
            <Aviso
              titulo="No pudimos consultar el estado global"
              className="mt-4"
              acciones={<Button type="button" variant="relOutline" size="sm" onClick={() => void plataforma.refrescar()}>Reintentar</Button>}
            />
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
        </SeccionPlegable>
      ) : null}

      <div className="mt-6 grid items-start gap-6 lg:grid-cols-[320px_1fr]">
        <Caja como="aside" aire="ninguno" className="overflow-hidden">
          <div className="space-y-3 p-4">
          <h2 className="font-rel-heading text-lg font-bold">1. Selecciona una empresa</h2>
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
            <Aviso
              titulo="No pudimos consultar las empresas"
              acciones={<Button type="button" variant="relOutline" size="sm" onClick={() => void empresas.refrescar()}>Reintentar</Button>}
            />
          ) : null}
          </div>
          <ul className="max-h-108 space-y-1 overflow-y-auto border-t border-rel-border p-2">
            {empresas.fase === "cargando" ? (
              <li>
                <ZonaCargando cargando etiqueta="Consultando empresas" esqueleto={<EsqueletoTexto lineas={4} className="p-3" />}>
                  <span />
                </ZonaCargando>
              </li>
            ) : null}
            {empresas.fase === "listo" && empresas.datos?.items.length === 0 ? (
              <li>
                <SinResultados
                  elemento="empresa"
                  escena="ninguna"
                  limpiar={() => {
                    setBusqueda("");
                    setPagina(1);
                  }}
                />
              </li>
            ) : null}
            {(empresas.fase === "listo" ? empresas.datos?.items ?? [] : []).map((e) => (
              <li key={e.id}>
                <button
                  type="button"
                  onClick={() => {
                    setEmpresa(e);
                    setFechaInicio(hoyISO());
                    setFechaFin("");
                    setReferencia("");
                  }}
                  aria-current={empresa?.id === e.id ? "true" : undefined}
                  className={`w-full rounded-rel-control px-3 py-2 text-left text-sm transition-colors focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rel-primary ${
                    empresa?.id === e.id
                      ? "bg-rel-accent-subtle font-semibold text-rel-primary"
                      : "hover:bg-rel-surface-subtle"
                  }`}
                >
                  <span className="block wrap-break-word">{e.nombre}</span>
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
        </Caja>

        <section className="min-w-0 space-y-5">
          {!empresa ? (
            <Caja aire="amplio" className="text-center">
              <ShieldCheck className="mx-auto mb-3 h-8 w-8 text-rel-muted" aria-hidden="true" />
              <h2 className="font-rel-heading font-bold">Elige una empresa</h2>
              <p className="mt-1 text-sm text-rel-muted">
                Aquí verás qué le falta para usar {configuracion.nombre}.
              </p>
            </Caja>
          ) : null}

          {empresa && estado.fase === "cargando" ? (
            <ZonaCargando
              cargando
              etiqueta={`Consultando la habilitación de ${empresa.nombre}`}
              esqueleto={<EsqueletoTexto lineas={3} />}
            >
              <span />
            </ZonaCargando>
          ) : null}
          {empresa && estado.fase === "error" ? (
            <Aviso
              titulo={`No pudimos consultar la habilitación de ${empresa.nombre}`}
              acciones={<Button type="button" variant="relOutline" size="sm" onClick={() => void estado.refrescar()}>Reintentar</Button>}
            />
          ) : null}

          {empresa && datos ? (
            <>
              <Caja aire="normal">
                <h2 className="font-rel-heading text-lg font-bold">
                  2. Estado de acceso
                </h2>
                <p className="mt-1 text-sm text-rel-muted">Para operar se combinan la vigencia, las funciones activadas y los permisos de cada persona.</p>
                <ul className="mt-4 space-y-3">
                  <Condicion cumplida={datos.contratado} titulo="Contrato vigente">
                    {datos.contratado
                      ? "Tiene acceso técnico durante la vigencia registrada; esto no acredita pagos ni facturación."
                      : "Falta registrar una vigencia técnica para este módulo; las funciones por sí solas no habilitan el acceso."}
                  </Condicion>
                  {modulo === "CAPACITACIONES" ? (
                    <Condicion cumplida={Boolean(asignacion?.efectiva)} titulo="Asignaciones encendidas">
                      {asignacion?.efectiva
                        ? "Se pueden asignar cursos a esta empresa."
                        : "Activa Asignaciones abajo para repartir cursos y consultar avances."}
                    </Condicion>
                  ) : null}
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
                  <Condicion titulo="Permisos de las personas">
                    No se administra aquí porque no depende de la empresa, sino de
                    quién pregunta. Se concede en{" "}
                    <Link viewTransition
                      to="/superadmin/roles-permisos"
                      className="font-semibold text-rel-primary underline-offset-2 hover:underline"
                    >
                      Roles y permisos
                    </Link>
                    .
                  </Condicion>
                </ul>
              </Caja>

              {/* --- contrato --- */}
              <Caja aire="normal">
                <h3 className="font-rel-heading text-lg font-bold">3. Vigencia técnica del módulo</h3>
                <p className="mt-1 text-sm text-rel-muted">
                  Registra las fechas y la referencia del acuerdo externo. La vigencia determina el acceso técnico; esta pantalla no registra compras, pagos ni facturas.
                </p>
                <Aviso tono="info" titulo="La vigencia no confirma pagos" className="mt-4">
                  La facturación y los pagos se gestionan fuera de ABRIL360.
                </Aviso>
                {datos.contratos.length === 0 ? (
                  <p className="mt-1 text-sm text-rel-muted">
                    No hay una vigencia registrada de {configuracion.nombre} para esta empresa.
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
                        {c.notas ? <span className="w-full break-words text-sm text-rel-muted">Referencia: {c.notas}</span> : null}
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
                  <form
                    className="mt-4 space-y-3 border-t border-rel-border pt-4"
                    onSubmit={(event) => {
                      event.preventDefault();
                      if (fechaInvalida || !fechaInicio) return;
                      void conContexto("contrato", () => crearContrato(empresa.id, {
                        modulo,
                        vigencia_desde: fechaInicio,
                        vigencia_hasta: fechaFin || null,
                        notas: referencia.trim() || null,
                      }));
                    }}
                  >
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label htmlFor="contrato-desde">Vigente desde</Label>
                        <Input id="contrato-desde" type="date" required value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} disabled={guardando !== null} />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="contrato-hasta">Vigente hasta (opcional)</Label>
                        <Input id="contrato-hasta" type="date" min={fechaInicio} value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} aria-invalid={fechaInvalida} aria-describedby={fechaInvalida ? "contrato-fecha-error" : undefined} disabled={guardando !== null} />
                      </div>
                    </div>
                    {fechaInvalida ? (
                      <div id="contrato-fecha-error">
                        <Aviso tono="peligro" titulo="Revisa las fechas" className="py-3">
                          La fecha de fin debe ser igual o posterior a la de inicio.
                        </Aviso>
                      </div>
                    ) : null}
                    <div className="space-y-1.5">
                      <Label htmlFor="contrato-referencia">Referencia del acuerdo (opcional)</Label>
                      <Input id="contrato-referencia" maxLength={300} value={referencia} onChange={(e) => setReferencia(e.target.value)} placeholder="Ej. número de contrato o nota interna" disabled={guardando !== null} />
                    </div>
                    <Button type="submit" variant="rel" size="lg" className="w-full sm:w-auto" disabled={guardando !== null || fechaInvalida || !fechaInicio}>
                      {guardando === "contrato" ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
                      Registrar vigencia de {configuracion.nombre}
                    </Button>
                  </form>
                ) : !datos.contratado ? (
                  <Aviso tono="atencion" titulo="La vigencia actual no habilita el acceso" className="mt-4">
                    Existe un contrato activo fuera de vigencia. Gestiona su estado antes de registrar otra vigencia.
                  </Aviso>
                ) : null}
              </Caja>

              {/* --- funcionalidades --- */}
              <Caja aire="normal">
                <h3 className="font-rel-heading text-lg font-bold">4. Funciones para esta empresa</h3>
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
                        <p className="wrap-break-word text-sm text-rel-muted">{b.para_que}</p>
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
                        <span className="text-rel-muted">{b.efectiva ? "Activada" : "Desactivada"}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </Caja>
            </>
          ) : null}
        </section>
      </div>
      <DialogoConfirmacion
        abierto={contratoPorSuspender !== null}
        alCerrar={() => setContratoPorSuspender(null)}
        tono="peligro"
        titulo={`Suspender contrato de ${configuracion.nombre}`}
        descripcion={`${empresa?.nombre} perderá acceso a este módulo mientras el contrato esté suspendido. Sus datos históricos se conservan.`}
        etiquetaConfirmar="Suspender contrato"
        etiquetaOcupado="Suspendiendo…"
        ocupado={guardando !== null}
        alConfirmar={() => {
          if (!empresa || !contratoPorSuspender) return;
          void conContexto("suspender", () => suspenderContrato(empresa.id, contratoPorSuspender, modulo))
            .then((ok) => { if (ok) setContratoPorSuspender(null); });
        }}
      />
    </div>
  );
}
