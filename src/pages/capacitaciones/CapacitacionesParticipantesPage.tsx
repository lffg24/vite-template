// src/pages/capacitaciones/CapacitacionesParticipantesPage.tsx · A-09
//
// La nómina de la empresa. Es a quién se puede invitar, y por tanto lo que hace
// posible que una constancia acredite algo más que «alguien dijo llamarse así».
//
// ## Las dos decisiones que dan forma a la pantalla
//
// **El documento no se puede editar.** El documento *es* la identidad: cambiarlo
// no es corregir a una persona, es señalar a otra. El campo aparece en el alta y
// desaparece en la edición, en vez de mostrarse deshabilitado sin explicación.
//
// **El CSV no escribe sin vista previa.** Es la diferencia entre una herramienta
// y un riesgo: una carga a medias sobre cuatrocientas personas no se deshace a
// mano.

import { useMemo, useRef, useState } from "react";
import { Pencil, Search, Upload, UserPlus, Users2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PageHeader } from "@/shared/ui/PageHeader";
import { CeldaPrincipal, TablaDatos } from "@/shared/ui/TablaDatos";
import { TablaBody, TablaHead, TablaPanel } from "@/shared/ui/Panel";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";
import {
  analizarImportacion,
  confirmarImportacion,
  crearParticipante,
  editarParticipante,
  listarParticipantes,
} from "@/services/capacitacionesService";
import type {
  ErrorApi,
  ParticipanteResumen,
  VistaPreviaImportacion,
} from "@/types/capacitaciones";
import { useConsulta } from "@/features/capacitaciones/useConsulta";
import {
  CargandoTabla,
  ErrorConsulta,
  SinDatos,
} from "@/features/capacitaciones/components/EstadoPantalla";

const TIPOS = ["CC", "CE", "TI", "PA", "PPT"] as const;

/** De dónde salió la identidad. Cambia lo que su constancia puede acreditar. */
function OrigenBadge({ origen }: { origen: ParticipanteResumen["origen"] }) {
  if (origen === "PUBLICO") {
    return (
      <Badge
        variant="outline"
        title="Esta persona se identificó sola por el enlace del grupo. Su constancia no acredita verificación de identidad."
      >
        Autodeclarada
      </Badge>
    );
  }
  return <Badge variant="secondary">{origen === "ADMIN" ? "Alta manual" : "Importada"}</Badge>;
}

export default function CapacitacionesParticipantesPage() {
  const { toast } = useToast();
  const consulta = useConsulta<ParticipanteResumen[]>(() => listarParticipantes(), []);

  const [filtro, setFiltro] = useState("");
  const [creando, setCreando] = useState(false);
  const [editando, setEditando] = useState<ParticipanteResumen | null>(null);
  const [importando, setImportando] = useState(false);

  const personas = consulta.datos ?? [];
  const visibles = useMemo(() => {
    const q = filtro.trim().toLowerCase();
    if (!q) return personas;
    return personas.filter((p) =>
      `${p.nombres} ${p.apellidos} ${p.numero_documento} ${p.cargo ?? ""}`
        .toLowerCase()
        .includes(q)
    );
  }, [personas, filtro]);

  return (
    <div className="space-y-6">
      <PageHeader
        titulo="Participantes"
        icono={Users2}
        descripcion={`${personas.length} en la nómina. Es a quién puedes invitar a una capacitación: la invitación personal es lo que hace que la constancia quede a nombre de quien de verdad la hizo.`}
        accion={
          <>
            <Button variant="relOutline" onClick={() => setImportando(true)}>
              <Upload className="mr-1.5 h-4 w-4" aria-hidden="true" />
              Importar CSV
            </Button>
            <Button variant="rel" onClick={() => setCreando(true)}>
              <UserPlus className="mr-1.5 h-4 w-4" aria-hidden="true" />
              Agregar persona
            </Button>
          </>
        }
      />

      <div className="relative max-w-sm">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-rel-muted"
          aria-hidden="true"
        />
        <Label htmlFor="filtro" className="sr-only">
          Buscar por nombre, documento o cargo
        </Label>
        <Input
          id="filtro"
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
          placeholder="Buscar por nombre, documento o cargo"
          className="border-rel-border pl-9"
        />
      </div>

      {consulta.fase === "cargando" ? <CargandoTabla /> : null}
      {consulta.fase === "error" && consulta.error ? (
        <ErrorConsulta error={consulta.error} reintentar={consulta.refrescar} />
      ) : null}

      {consulta.fase === "listo" && personas.length === 0 ? (
        <SinDatos
          ilustracion="participantes"
          titulo="Todavía no hay nadie en la nómina"
          descripcion="Agrega personas una a una o importa un CSV. Sin ellas no puedes generar invitaciones."
        />
      ) : null}

      {consulta.fase === "listo" && personas.length > 0 && visibles.length === 0 ? (
        <div
          role="status"
          className="rounded-rel-card border border-rel-border bg-rel-surface p-8 text-center"
        >
          <p className="font-semibold text-rel-dark">
            Nadie coincide con «{filtro.trim()}»
          </p>
          <p className="mt-1 text-sm text-rel-muted">
            Hay {personas.length} personas en total.
          </p>
          <div className="mt-4">
            <Button variant="relOutline" size="sm" onClick={() => setFiltro("")}>
              Quitar el filtro
            </Button>
          </div>
        </div>
      ) : null}

      {consulta.fase === "listo" && visibles.length > 0 ? (
        <>
          <div className="hidden md:block">
            <TablaDatos<ParticipanteResumen>
              filas={visibles}
              claveFila={(p) => p.id}
              etiquetaElemento="personas"
              etiquetaTabla="Nómina de participantes"
              ordenInicial={{ clave: "persona" }}
              columnas={[
                {
                  clave: "persona",
                  titulo: "Persona",
                  // Ordena por apellidos: una nómina se busca por apellido, y
                  // ordenarla por nombre de pila la deja donde nadie la busca.
                  valor: (p) => `${p.apellidos} ${p.nombres}`,
                  celda: (p) => (
                    <CeldaPrincipal
                      alAbrir={() => setEditando(p)}
                      titulo={`${p.nombres} ${p.apellidos}`}
                      apoyo={p.cargo ?? "Sin cargo"}
                    />
                  ),
                },
                {
                  clave: "documento",
                  titulo: "Documento",
                  valor: (p) => p.numero_documento,
                  celda: (p) => (
                    <span className="tabular-nums text-rel-muted">
                      {p.tipo_documento} {p.numero_documento}
                    </span>
                  ),
                },
                {
                  clave: "origen",
                  titulo: "Identidad",
                  valor: (p) => p.origen,
                  celda: (p) => <OrigenBadge origen={p.origen} />,
                },
                {
                  clave: "inscripciones",
                  titulo: "Cursos",
                  alineacion: "derecha",
                  valor: (p) => p.inscripciones,
                  celda: (p) => (
                    <span className="tabular-nums text-rel-dark">{p.inscripciones}</span>
                  ),
                },
                {
                  clave: "acciones",
                  titulo: "Acciones",
                  alineacion: "derecha",
                  soloAcciones: true,
                  celda: (p) => (
                    <Button variant="relOutline" size="sm" onClick={() => setEditando(p)}>
                      <Pencil className="mr-1.5 h-4 w-4" aria-hidden="true" />
                      Corregir
                      <span className="sr-only">
                        {" "}
                        los datos de {p.nombres} {p.apellidos}
                      </span>
                    </Button>
                  ),
                },
              ]}
            />
          </div>

          <ul className="space-y-3 md:hidden">
            {visibles.map((p) => (
              <li
                key={p.id}
                className="rounded-rel-card border border-rel-border bg-rel-surface p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <button
                      type="button"
                      onClick={() => setEditando(p)}
                      className="truncate text-left font-semibold text-rel-dark underline-offset-2 hover:text-rel-primary hover:underline"
                    >
                      {p.nombres} {p.apellidos}
                    </button>
                    <p className="text-sm tabular-nums text-rel-muted">
                      {p.tipo_documento} {p.numero_documento}
                    </p>
                  </div>
                  <OrigenBadge origen={p.origen} />
                </div>
                <div className="mt-3 flex items-center justify-between gap-3 border-t border-rel-border pt-3">
                  <span className="text-sm text-rel-muted">{p.cargo ?? "Sin cargo"}</span>
                  <Button variant="relOutline" size="sm" onClick={() => setEditando(p)}>
                    <Pencil className="mr-1.5 h-4 w-4" aria-hidden="true" />
                    Corregir
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </>
      ) : null}

      <PanelAlta
        abierto={creando}
        alCerrar={() => setCreando(false)}
        alCrear={async (datos) => {
          await crearParticipante(datos);
          toast({ title: "Persona agregada" });
          setCreando(false);
          await consulta.refrescar();
        }}
      />

      <PanelEdicion
        persona={editando}
        alCerrar={() => setEditando(null)}
        alGuardar={async (id, cambios) => {
          await editarParticipante(id, cambios);
          toast({
            title: "Datos corregidos",
            description: "Queda registrado quién los cambió y qué decían antes.",
          });
          setEditando(null);
          await consulta.refrescar();
        }}
      />

      <PanelImportacion
        abierto={importando}
        alCerrar={() => setImportando(false)}
        alTerminar={async () => {
          setImportando(false);
          await consulta.refrescar();
        }}
      />
    </div>
  );
}

// --- alta ----------------------------------------------------------------------------

function PanelAlta({
  abierto,
  alCerrar,
  alCrear,
}: {
  abierto: boolean;
  alCerrar: () => void;
  alCrear: (datos: {
    tipo_documento: string;
    numero_documento: string;
    nombres: string;
    apellidos: string;
    cargo?: string;
  }) => Promise<void>;
}) {
  const [tipo, setTipo] = useState<string>("CC");
  const [numero, setNumero] = useState("");
  const [nombres, setNombres] = useState("");
  const [apellidos, setApellidos] = useState("");
  const [cargo, setCargo] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const completo = numero.trim() && nombres.trim() && apellidos.trim();

  async function enviar() {
    setEnviando(true);
    setError(null);
    try {
      await alCrear({
        tipo_documento: tipo,
        numero_documento: numero.trim(),
        nombres: nombres.trim(),
        apellidos: apellidos.trim(),
        cargo: cargo.trim() || undefined,
      });
      setNumero("");
      setNombres("");
      setApellidos("");
      setCargo("");
    } catch (e) {
      setError((e as ErrorApi).message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Sheet open={abierto} onOpenChange={(o) => !o && alCerrar()}>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Agregar una persona</SheetTitle>
          <SheetDescription>
            Al darla de alta, tu empresa está afirmando que esta es su identidad.
            Es lo que hace que su constancia acredite algo más que un nombre
            escrito por quien abrió un enlace.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          <div className="flex gap-3">
            <div className="w-28">
              <Label htmlFor="tipo">Tipo</Label>
              <select
                id="tipo"
                value={tipo}
                onChange={(e) => setTipo(e.target.value)}
                className="mt-1 h-10 w-full rounded-rel-control border border-rel-border bg-rel-surface px-2 text-sm"
              >
                {TIPOS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <Label htmlFor="numero">Número de documento</Label>
              <Input
                id="numero"
                value={numero}
                onChange={(e) => setNumero(e.target.value)}
                className="mt-1 border-rel-border"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="nombres">Nombres</Label>
            <Input
              id="nombres"
              value={nombres}
              onChange={(e) => setNombres(e.target.value)}
              className="mt-1 border-rel-border"
            />
          </div>
          <div>
            <Label htmlFor="apellidos">Apellidos</Label>
            <Input
              id="apellidos"
              value={apellidos}
              onChange={(e) => setApellidos(e.target.value)}
              className="mt-1 border-rel-border"
            />
          </div>
          <div>
            <Label htmlFor="cargo">Cargo</Label>
            <Input
              id="cargo"
              value={cargo}
              onChange={(e) => setCargo(e.target.value)}
              placeholder="Opcional"
              className="mt-1 border-rel-border"
            />
          </div>
          {error ? (
            <p role="alert" className="text-sm text-rel-danger">
              {error}
            </p>
          ) : null}
        </div>

        <SheetFooter className="mt-6">
          <Button variant="rel" disabled={enviando || !completo} onClick={() => void enviar()}>
            {enviando ? "Agregando…" : "Agregar"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

// --- edición -------------------------------------------------------------------------

function PanelEdicion({
  persona,
  alCerrar,
  alGuardar,
}: {
  persona: ParticipanteResumen | null;
  alCerrar: () => void;
  alGuardar: (
    id: string,
    cambios: { nombres?: string; apellidos?: string; cargo?: string | null }
  ) => Promise<void>;
}) {
  const [nombres, setNombres] = useState("");
  const [apellidos, setApellidos] = useState("");
  const [cargo, setCargo] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cargada, setCargada] = useState<string | null>(null);

  // Rellenar al abrir, sin un efecto: el estado deriva de qué persona se está
  // editando, y `cargada` recuerda cuál se cargó ya.
  if (persona && cargada !== persona.id) {
    setCargada(persona.id);
    setNombres(persona.nombres);
    setApellidos(persona.apellidos);
    setCargo(persona.cargo ?? "");
    setError(null);
  }

  async function enviar() {
    if (!persona) return;
    setEnviando(true);
    setError(null);
    try {
      await alGuardar(persona.id, {
        nombres: nombres.trim(),
        apellidos: apellidos.trim(),
        cargo: cargo.trim() || null,
      });
    } catch (e) {
      setError((e as ErrorApi).message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Sheet open={persona !== null} onOpenChange={(o) => !o && alCerrar()}>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Corregir los datos</SheetTitle>
          <SheetDescription>
            Queda registrado quién hizo el cambio y qué decían los datos antes.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {/* El documento se MUESTRA y no se edita, y la pantalla dice por qué.
              Un campo deshabilitado sin explicación deja a alguien buscando cómo
              habilitarlo. */}
          <div className="rounded-rel-card bg-rel-surface-subtle p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-rel-muted">
              Documento
            </p>
            <p className="mt-0.5 font-semibold tabular-nums text-rel-dark">
              {persona?.tipo_documento} {persona?.numero_documento}
            </p>
            <p className="mt-2 text-xs leading-relaxed text-rel-muted">
              No se puede cambiar. El documento <strong>es</strong> la identidad:
              cambiarlo no sería corregir a esta persona, sino señalar a otra. Si
              el documento está mal, agrega a la persona correcta.
            </p>
          </div>

          <div>
            <Label htmlFor="ed-nombres">Nombres</Label>
            <Input
              id="ed-nombres"
              value={nombres}
              onChange={(e) => setNombres(e.target.value)}
              className="mt-1 border-rel-border"
            />
          </div>
          <div>
            <Label htmlFor="ed-apellidos">Apellidos</Label>
            <Input
              id="ed-apellidos"
              value={apellidos}
              onChange={(e) => setApellidos(e.target.value)}
              className="mt-1 border-rel-border"
            />
          </div>
          <div>
            <Label htmlFor="ed-cargo">Cargo</Label>
            <Input
              id="ed-cargo"
              value={cargo}
              onChange={(e) => setCargo(e.target.value)}
              className="mt-1 border-rel-border"
            />
          </div>

          {persona && persona.inscripciones > 0 ? (
            <p className="rounded-rel-card bg-rel-info-subtle p-3 text-sm leading-relaxed">
              Esta persona ya participó en {persona.inscripciones}{" "}
              {persona.inscripciones === 1 ? "capacitación" : "capacitaciones"}.
              Las constancias ya emitidas <strong>no cambian</strong>: dicen lo
              que decían el día en que se emitieron.
            </p>
          ) : null}

          {error ? (
            <p role="alert" className="text-sm text-rel-danger">
              {error}
            </p>
          ) : null}
        </div>

        <SheetFooter className="mt-6">
          <Button
            variant="rel"
            disabled={enviando || !nombres.trim() || !apellidos.trim()}
            onClick={() => void enviar()}
          >
            {enviando ? "Guardando…" : "Guardar los cambios"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

// --- importación CSV ------------------------------------------------------------------

function PanelImportacion({
  abierto,
  alCerrar,
  alTerminar,
}: {
  abierto: boolean;
  alCerrar: () => void;
  alTerminar: () => Promise<void>;
}) {
  const { toast } = useToast();
  const entrada = useRef<HTMLInputElement>(null);
  const [archivo, setArchivo] = useState<File | null>(null);
  const [previa, setPrevia] = useState<VistaPreviaImportacion | null>(null);
  const [trabajando, setTrabajando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function limpiar() {
    setArchivo(null);
    setPrevia(null);
    setError(null);
    if (entrada.current) entrada.current.value = "";
  }

  async function analizar(f: File) {
    setArchivo(f);
    setPrevia(null);
    setError(null);
    setTrabajando(true);
    try {
      setPrevia(await analizarImportacion(f));
    } catch (e) {
      setError((e as ErrorApi).message);
    } finally {
      setTrabajando(false);
    }
  }

  async function confirmar() {
    if (!archivo) return;
    setTrabajando(true);
    setError(null);
    try {
      const r = await confirmarImportacion(archivo);
      toast({
        title: "Archivo importado",
        description: `${r.creados} creadas, ${r.actualizados} actualizadas.`,
      });
      limpiar();
      await alTerminar();
    } catch (e) {
      setError((e as ErrorApi).message);
    } finally {
      setTrabajando(false);
    }
  }

  const aplicables = previa ? previa.resumen.crea + previa.resumen.actualiza : 0;

  return (
    <Sheet
      open={abierto}
      onOpenChange={(o) => {
        if (!o) {
          limpiar();
          alCerrar();
        }
      }}
    >
      <SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle>Importar participantes</SheetTitle>
          <SheetDescription>
            Primero verás exactamente qué va a pasar. Nada se guarda hasta que lo
            confirmes.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          <div>
            <Label htmlFor="archivo">Archivo CSV</Label>
            <Input
              id="archivo"
              ref={entrada}
              type="file"
              accept=".csv,text/csv"
              className="mt-1 border-rel-border"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void analizar(f);
              }}
            />
            <p className="mt-2 text-xs leading-relaxed text-rel-muted">
              Columnas obligatorias: <code>tipo_documento</code>,{" "}
              <code>numero_documento</code>, <code>nombres</code>,{" "}
              <code>apellidos</code>. Opcionales: <code>cargo</code>,{" "}
              <code>correo</code>, <code>telefono</code>. Sirve el CSV que exporta
              Excel, con comas o con punto y coma.
            </p>
          </div>

          {error ? (
            <p
              role="alert"
              className="rounded-rel-card border border-rel-danger/30 bg-rel-danger-subtle p-3 text-sm leading-relaxed"
            >
              {error}
            </p>
          ) : null}

          {previa ? (
            <>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Recuento etiqueta="Se crearán" valor={previa.resumen.crea} />
                <Recuento etiqueta="Se actualizarán" valor={previa.resumen.actualiza} />
                <Recuento etiqueta="Con errores" valor={previa.resumen.rechazadas} />
                <Recuento etiqueta="Repetidas" valor={previa.resumen.duplicadas} />
              </div>

              {previa.resumen.duplicadas > 0 ? (
                <p className="rounded-rel-card bg-rel-warning-subtle p-3 text-sm leading-relaxed">
                  Hay documentos repetidos <strong>dentro del archivo</strong>.
                  Esas filas no se aplican: elegir una de las dos en silencio
                  sería decidir por ti cuál de los dos nombres vale.
                </p>
              ) : null}

              <TablaPanel>
                <table className="min-w-full text-left text-sm">
                  <TablaHead>
                    <tr>
                      <th scope="col" className="w-16 px-4 py-3">Fila</th>
                      <th scope="col" className="px-4 py-3">Persona</th>
                      <th scope="col" className="px-4 py-3">Qué pasará</th>
                    </tr>
                  </TablaHead>
                  <TablaBody>
                    {previa.filas.map((f) => (
                      <tr key={f.fila}>
                        <td className="px-4 py-3 tabular-nums text-rel-muted">{f.fila}</td>
                        <td className="px-4 py-3 text-rel-dark">
                          {f.datos.nombres} {f.datos.apellidos}
                          <span className="ml-2 text-xs text-rel-muted">
                            {f.datos.tipo_documento} {f.datos.numero_documento}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <ResultadoFila fila={f} />
                        </td>
                      </tr>
                    ))}
                  </TablaBody>
                </table>
              </TablaPanel>
            </>
          ) : null}
        </div>

        <SheetFooter className="mt-6">
          <Button
            variant="rel"
            disabled={trabajando || !previa || aplicables === 0}
            onClick={() => void confirmar()}
          >
            {trabajando
              ? "Trabajando…"
              : `Importar ${aplicables} ${aplicables === 1 ? "fila" : "filas"}`}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

function Recuento({ etiqueta, valor }: { etiqueta: string; valor: number }) {
  return (
    <div className="rounded-rel-card border border-rel-border bg-rel-surface p-3">
      <p className="text-xs text-rel-muted">{etiqueta}</p>
      <p className="mt-0.5 text-xl font-bold tabular-nums text-rel-dark">{valor}</p>
    </div>
  );
}

function ResultadoFila({ fila }: { fila: VistaPreviaImportacion["filas"][number] }) {
  if (fila.resultado === "CREA") return <Badge variant="secondary">Se creará</Badge>;
  if (fila.resultado === "ACTUALIZA") {
    return (
      <span className="inline-flex flex-col items-start gap-1">
        <Badge variant="secondary">Se actualizará</Badge>
        {/* QUÉ cambia. Sin esto, «actualiza 120 filas» no distingue tocar un
            teléfono de reescribir 120 nombres. */}
        <span className="text-xs text-rel-muted">
          {fila.cambios.length > 0 ? `Cambia: ${fila.cambios.join(", ")}` : "Sin cambios"}
        </span>
      </span>
    );
  }
  return (
    <span className="inline-flex flex-col items-start gap-1">
      <Badge variant="destructive">
        {fila.resultado === "DUPLICADA" ? "Repetida" : "Con errores"}
      </Badge>
      {fila.errores.map((e) => (
        <span key={e} className="text-xs leading-snug text-rel-muted">
          {e}
        </span>
      ))}
    </span>
  );
}
