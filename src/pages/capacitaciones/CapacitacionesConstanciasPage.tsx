// src/pages/capacitaciones/CapacitacionesConstanciasPage.tsx · B-05
//
// **Se llamaba A-13, que era un nombre inventado.** En el inventario de
// pantallas las constancias son `B-05`, una superficie de EMPRESA, no de
// plataforma. El número importa porque dice de quién es la pantalla: quien
// administra su empresa ve sus constancias; la plataforma no tiene un listado
// global de constancias de todo el mundo, ni debe tenerlo.
//
// Rol: quien responde ante una auditoría.
// Trabajo a resolver: «demuéstrame que esta persona hizo esta capacitación» y
// «esta constancia salió mal, quítala».
//
// ## Dos decisiones gobiernan la pantalla
//
// **Aquí sí van los nombres completos.** El verificador público los enmascara;
// este listado no. Quien administra su empresa ya tiene esos datos, y
// ocultárselos le impediría cotejar la constancia con su nómina — que es
// justamente para lo que abre esta pantalla.
//
// **Anular no borra.** Por eso la fila anulada sigue en la lista, con su folio y
// su motivo a la vista. Un expediente del que desaparecen renglones es peor que
// uno que registra sus propias correcciones.
//
// ## Lo que esta pantalla NO tiene
//
// **No hay botón de descargar el PDF.** Falta aprobar la librería que lo genera.
// Poner el botón para que no hiciera nada, o para que descargara un documento a
// medias, sería peor que decir dónde está el límite: la constancia ya existe,
// tiene folio y se puede verificar tecleando el código.

import { useMemo, useState } from "react";
import { Copy, FileBadge, Search, ShieldOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PageHeader } from "@/shared/ui/PageHeader";
import { TablaDatos } from "@/shared/ui/TablaDatos";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { anularConstancia, listarConstancias } from "@/services/capacitacionesService";
import type { ConstanciaResumen, ErrorApi } from "@/types/capacitaciones";
import { useConsulta } from "@/features/capacitaciones/useConsulta";
import {
  CargandoTabla,
  ErrorConsulta,
  SinDatos,
} from "@/features/capacitaciones/components/EstadoPantalla";
import { formatearFecha, formatearFechaHora } from "@/features/capacitaciones/formato";

/** El motivo de la anulación es obligatorio, y el servidor exige cinco caracteres. */
const MOTIVO_MINIMO = 5;

function nombre(c: ConstanciaResumen): string {
  return [c.nombres, c.apellidos].filter(Boolean).join(" ") || "—";
}

function vigencia(c: ConstanciaResumen): string {
  return c.vence_el ? `Hasta ${formatearFecha(c.vence_el)}` : "No vence";
}

/**
 * Cuánto queda, en las palabras con las que se decide algo.
 *
 * «Vence en 45 días» es accionable; «2026-11-12» hay que restarlo mentalmente y
 * nadie lo hace al pasar una lista de sesenta filas.
 */
function cuentaAtras(c: ConstanciaResumen): string | null {
  if (c.dias_para_vencer === null || c.estado === "ANULADA") return null;
  if (c.dias_para_vencer < 0) {
    const dias = Math.abs(c.dias_para_vencer);
    return dias === 1 ? "Venció ayer" : `Venció hace ${dias} días`;
  }
  if (c.dias_para_vencer === 0) return "Vence hoy";
  if (c.dias_para_vencer === 1) return "Vence mañana";
  return `Vence en ${c.dias_para_vencer} días`;
}

/**
 * La insignia de estado, con el motivo **accesible de verdad**.
 *
 * Antes el motivo vivía solo en un `title`, que no llega a quien navega con
 * teclado ni se anuncia de forma fiable con un lector de pantalla — y «¿por
 * qué?» es la única pregunta que se hace ante una fila anulada. Ahora va en un
 * texto adyacente asociado por `aria-describedby`, visible en el listado móvil y
 * en la tabla.
 */
function EstadoConstancia({ c, idMotivo }: { c: ConstanciaResumen; idMotivo: string }) {
  if (c.estado !== "ANULADA") {
    // `situacion` la calcula el servidor sumándole el vencimiento a `estado`.
    // El vencimiento NO se escribe nunca: es consecuencia de la fecha, y una
    // tarea que «pasara a VENCIDA» fallaría un día y dejaría constancias
    // afirmando una vigencia que ya no tienen.
    if (c.situacion === "VENCIDA") {
      return (
        <span className="inline-flex flex-col items-start gap-1">
          <Badge variant="destructive">Vencida</Badge>
          <span className="text-xs leading-snug text-rel-muted">Pide reinducción</span>
        </span>
      );
    }
    if (c.por_vencer) {
      return (
        <span className="inline-flex flex-col items-start gap-1">
          <Badge variant="outline" className="border-rel-warning text-rel-warning">
            Por vencer
          </Badge>
          <span className="text-xs leading-snug text-rel-muted">{cuentaAtras(c)}</span>
        </span>
      );
    }
    return <Badge variant="secondary">Vigente</Badge>;
  }
  return (
    <span className="inline-flex flex-col items-start gap-1">
      <Badge variant="destructive" aria-describedby={c.anulacion_motivo ? idMotivo : undefined}>
        Anulada
      </Badge>
      {c.anulacion_motivo ? (
        <span id={idMotivo} className="text-xs leading-snug text-rel-muted">
          {c.anulacion_motivo}
        </span>
      ) : null}
    </span>
  );
}

export default function CapacitacionesConstanciasPage() {
  const { toast } = useToast();
  const consulta = useConsulta<ConstanciaResumen[]>(() => listarConstancias(), []);

  const [filtro, setFiltro] = useState("");
  const [aAnular, setAAnular] = useState<ConstanciaResumen | null>(null);
  const [motivo, setMotivo] = useState("");
  const [anulando, setAnulando] = useState(false);

  const constancias = consulta.datos ?? [];

  // Filtro en cliente: el listado es de una empresa y cabe entero. Un endpoint
  // de búsqueda sería una segunda forma de leer lo mismo, con su propia guarda
  // que mantener.
  const visibles = useMemo(() => {
    const q = filtro.trim().toLowerCase();
    if (!q) return constancias;
    return constancias.filter((c) =>
      [nombre(c), c.curso ?? "", c.codigo_verificacion, String(c.folio)]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [constancias, filtro]);

  // «Vigentes» cuenta las que de verdad lo están hoy, no las que no se
  // anularon: incluir las vencidas ahí era afirmar una cobertura que no existe,
  // que es justo el número que alguien lleva a una auditoría.
  const vigentes = constancias.filter((c) => c.situacion === "VIGENTE").length;
  const porVencer = constancias.filter((c) => c.por_vencer).length;
  const vencidas = constancias.filter((c) => c.situacion === "VENCIDA").length;

  async function copiarCodigo(codigo: string) {
    try {
      await navigator.clipboard.writeText(codigo);
      toast({ title: "Código copiado" });
    } catch {
      // Sin portapapeles el código sigue a la vista y se copia a mano. No se
      // muestra un error por perder un atajo.
    }
  }

  async function confirmarAnulacion() {
    if (!aAnular) return;
    setAnulando(true);
    try {
      await anularConstancia(aAnular.id, motivo.trim());
      toast({
        title: `Constancia N.º ${aAnular.folio} anulada`,
        description:
          "Sigue verificándose, y ahora dice que fue anulada. Quien tenga el documento impreso puede enterarse.",
      });
      setAAnular(null);
      setMotivo("");
      await consulta.refrescar();
    } catch (e) {
      const err = e as ErrorApi;
      toast({
        variant: "destructive",
        title: "No pudimos anular la constancia",
        description: err.message,
      });
    } finally {
      setAnulando(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        titulo="Constancias"
        icono={FileBadge}
        descripcion={
          <>
            {vigentes} vigente{vigentes === 1 ? "" : "s"} de {constancias.length}
            {porVencer > 0 ? `, ${porVencer} por vencer` : ""}
            {vencidas > 0 ? `, ${vencidas} vencida${vencidas === 1 ? "" : "s"}` : ""}.
            Cada una lleva su folio y un código con el que cualquiera puede
            comprobarla sin necesidad de una cuenta.
          </>
        }
      />

      <div className="relative max-w-sm">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-rel-muted"
          aria-hidden="true"
        />
        <Label htmlFor="filtro" className="sr-only">
          Buscar por persona, curso, folio o código
        </Label>
        <Input
          id="filtro"
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
          placeholder="Buscar por persona, curso, folio o código"
          className="border-rel-border pl-9"
        />
      </div>

      {consulta.fase === "cargando" ? <CargandoTabla /> : null}
      {consulta.fase === "error" && consulta.error ? (
        <ErrorConsulta error={consulta.error} reintentar={consulta.refrescar} />
      ) : null}

      {consulta.fase === "listo" && constancias.length === 0 ? (
        <SinDatos
          escena="certificado-mujer"
          titulo="Todavía no hay constancias"
          descripcion="Se emiten solas cuando alguien termina una capacitación asignada."
        />
      ) : null}

      {/* «Sin resultados» NO es «sin datos», y confundirlos es lo que hace que
          alguien crea que perdió su información. Aquí sí hay constancias: lo que
          no encaja es la búsqueda, así que la salida es borrar el filtro. */}
      {consulta.fase === "listo" && constancias.length > 0 && visibles.length === 0 ? (
        <div
          role="status"
          className="rounded-rel-card border border-rel-border bg-rel-surface p-8 text-center"
        >
          <p className="font-semibold text-rel-dark">
            Ninguna constancia coincide con «{filtro.trim()}»
          </p>
          <p className="mt-1 text-sm text-rel-muted">
            Hay {constancias.length} en total. Prueba con el folio, el código o
            parte del nombre.
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
          {/* Tabla en escritorio. En móvil una tabla de ocho columnas obliga a
              desplazar en horizontal para leer una sola fila, así que abajo hay
              tarjetas con los mismos datos. */}
          <div className="hidden md:block">
            <TablaDatos<ConstanciaResumen>
              filas={visibles}
              claveFila={(c) => c.id}
              etiquetaElemento="constancias"
              etiquetaTabla="Constancias emitidas"
              columnas={[
                {
                  clave: "folio",
                  titulo: "Folio",
                  valor: (c) => c.folio,
                  celda: (c) => (
                    <span className="font-semibold tabular-nums text-rel-dark">{c.folio}</span>
                  ),
                },
                {
                  clave: "persona",
                  titulo: "Persona",
                  valor: (c) => nombre(c),
                  celda: (c) => (
                    <span className="font-medium text-rel-dark">{nombre(c)}</span>
                  ),
                },
                {
                  clave: "curso",
                  titulo: "Capacitación",
                  valor: (c) => c.curso,
                  celda: (c) => <span className="text-rel-muted">{c.curso ?? "—"}</span>,
                },
                {
                  clave: "codigo",
                  titulo: "Código",
                  celda: (c) => <BotonCodigo c={c} alCopiar={copiarCodigo} />,
                },
                {
                  clave: "emitida",
                  titulo: "Emitida",
                  valor: (c) => c.emitida_en,
                  celda: (c) => (
                    <span className="text-rel-muted">{formatearFecha(c.emitida_en)}</span>
                  ),
                },
                {
                  clave: "vigencia",
                  titulo: "Vigencia",
                  celda: (c) => <span className="text-rel-muted">{vigencia(c)}</span>,
                },
                {
                  clave: "estado",
                  titulo: "Estado",
                  valor: (c) => c.estado,
                  celda: (c) => <EstadoConstancia c={c} idMotivo={`motivo-t-${c.id}`} />,
                },
                {
                  clave: "acciones",
                  titulo: "Acciones",
                  alineacion: "derecha",
                  soloAcciones: true,
                  celda: (c) =>
                    c.estado === "VIGENTE" ? (
                      <Button
                        variant="relOutline"
                        size="sm"
                        onClick={() => {
                          setAAnular(c);
                          setMotivo("");
                        }}
                      >
                        <ShieldOff className="mr-1.5 h-4 w-4" aria-hidden="true" />
                        Anular
                        <span className="sr-only"> la constancia {c.folio}</span>
                      </Button>
                    ) : (
                      <span className="text-xs text-rel-muted">
                        {formatearFechaHora(c.anulada_en)}
                      </span>
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
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-rel-dark">{nombre(c)}</p>
                    <p className="truncate text-sm text-rel-muted">{c.curso ?? "—"}</p>
                  </div>
                  <EstadoConstancia c={c} idMotivo={`motivo-m-${c.id}`} />
                </div>

                <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  <div>
                    <dt className="text-xs text-rel-muted">Folio</dt>
                    <dd className="font-semibold tabular-nums text-rel-dark">
                      N.º {c.folio}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-rel-muted">Emitida</dt>
                    <dd className="text-rel-dark">{formatearFecha(c.emitida_en)}</dd>
                  </div>
                  <div className="col-span-2">
                    <dt className="text-xs text-rel-muted">Vigencia</dt>
                    <dd className="text-rel-dark">{vigencia(c)}</dd>
                  </div>
                </dl>

                <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-rel-border pt-3">
                  <BotonCodigo c={c} alCopiar={copiarCodigo} />
                  {c.estado === "VIGENTE" ? (
                    <Button
                      variant="relOutline"
                      size="sm"
                      onClick={() => {
                        setAAnular(c);
                        setMotivo("");
                      }}
                    >
                      <ShieldOff className="mr-1.5 h-4 w-4" aria-hidden="true" />
                      Anular
                      <span className="sr-only"> la constancia {c.folio}</span>
                    </Button>
                  ) : (
                    <span className="text-xs text-rel-muted">
                      Anulada el {formatearFechaHora(c.anulada_en)}
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </>
      ) : null}

      <AlertDialog open={aAnular !== null} onOpenChange={(o) => !o && setAAnular(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Anular la constancia N.º {aAnular?.folio}
            </AlertDialogTitle>
            <AlertDialogDescription>
              No se borra. Seguirá verificándose con su código y dirá que fue
              anulada, para que quien tenga el documento impreso pueda enterarse
              de que ya no vale. El folio no se reutiliza, y esta acción no se
              puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-2">
            <Label htmlFor="motivo">Motivo de la anulación</Label>
            <Input
              id="motivo"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Se emitió con el curso equivocado"
              aria-describedby="ayuda-motivo"
              className="border-rel-border"
            />
            {/* Obligatorio, y dicho antes de intentarlo. Una anulación sin
                explicación deja el expediente con una pregunta abierta que
                nadie podrá responder después. */}
            <p id="ayuda-motivo" className="text-xs text-rel-muted">
              Queda registrado junto a la constancia y se muestra en este
              listado. Es lo que responderá a la pregunta «¿por qué se anuló?»
              dentro de dos años.
            </p>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={anulando}>Cancelar</AlertDialogCancel>
            {/* Botón normal y no `AlertDialogAction`: aquel cierra el diálogo al
                pulsarlo, y aquí hay que poder quedarse abierto si el servidor
                rechaza el motivo. */}
            <Button
              variant="destructive"
              disabled={anulando || motivo.trim().length < MOTIVO_MINIMO}
              onClick={() => void confirmarAnulacion()}
            >
              {anulando ? "Anulando…" : "Anular la constancia"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/** El código, copiable. Mismo control en la tabla y en la tarjeta. */
function BotonCodigo({
  c,
  alCopiar,
}: {
  c: ConstanciaResumen;
  alCopiar: (codigo: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => alCopiar(c.codigo_verificacion)}
      className="inline-flex min-h-11 items-center gap-1.5 font-mono text-xs tracking-wider text-rel-dark hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rel-primary md:min-h-0"
      aria-label={`Copiar el código ${c.codigo_verificacion}`}
    >
      {c.codigo_verificacion}
      <Copy className="h-3 w-3" aria-hidden="true" />
    </button>
  );
}
