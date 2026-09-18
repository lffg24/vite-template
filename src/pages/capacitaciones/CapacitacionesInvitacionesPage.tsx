// src/pages/capacitaciones/CapacitacionesInvitacionesPage.tsx
//
// Emitir y repartir invitaciones personales de una asignación.
//
// ## La decisión que gobierna la pantalla
//
// **Los tokens se ven una sola vez.** El servidor guarda solo su SHA-256, así
// que esta pantalla es la única oportunidad de repartirlos. Igual que con los
// enlaces de grupo, se rotan: no hay «volver a ver», hay «generar otra».
//
// De ahí la hoja imprimible: en una capacitación presencial son cuarenta
// personas en una sala, sin correo ni SMS. Se imprime, se recorta y se reparte,
// que es lo que ya se hace con las planillas de asistencia en papel.
//
// El QR sería mejor y espera a que se apruebe la librería. La ruta
// `/c/i/{token}` ya existe para cuando llegue.

import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Printer, Send, ShieldOff } from "lucide-react";

import { PageHeader } from "@/shared/ui/PageHeader";
import { Panel } from "@/shared/ui/Panel";
import { Escena } from "@/shared/ui/Escena";
import { TablaDatos } from "@/shared/ui/TablaDatos";
import { BotonVolver } from "@/shared/ui/BotonVolver";
import {
  AvisoAccesoPublico,
  useAccesoPublicoAbierto,
} from "@/features/capacitaciones/components/AvisoAccesoPublico";

import { Button } from "@/components/ui/button";
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
import {
  generarInvitaciones,
  listarAsignaciones,
  listarInvitaciones,
  listarParticipantes,
  revocarInvitacion,
} from "@/services/capacitacionesService";
import type {
  AsignacionResumen,
  ErrorApi,
  InvitacionResumen,
  InvitacionesGeneradas,
  ParticipanteResumen,
} from "@/types/capacitaciones";
import { useConsulta } from "@/features/capacitaciones/useConsulta";
import {
  CargandoTabla,
  ErrorConsulta,
  SinDatos,
} from "@/features/capacitaciones/components/EstadoPantalla";
import { formatearFecha } from "@/features/capacitaciones/formato";
import { HojaDeInvitaciones } from "@/features/capacitaciones/components/HojaDeInvitaciones";

function EstadoInvitacion({ inv }: { inv: InvitacionResumen }) {
  if (inv.estado === "CONSUMIDA") return <Badge variant="secondary">Usada</Badge>;
  if (inv.estado === "REVOCADA") {
    return (
      <span className="inline-flex flex-col items-start gap-1">
        <Badge variant="destructive">Revocada</Badge>
        {inv.revocacion_motivo ? (
          <span className="text-xs leading-snug text-rel-muted">
            {inv.revocacion_motivo}
          </span>
        ) : null}
      </span>
    );
  }
  // Caducada NO es revocada: una se acabó sola, la otra la retiró alguien, y
  // mostrarlas igual haría pensar que hubo una decisión donde solo pasó el
  // tiempo.
  if (!inv.utilizable) return <Badge variant="outline">Caducada</Badge>;
  return <Badge variant="secondary">Pendiente</Badge>;
}

export default function CapacitacionesInvitacionesPage() {
  const navegar = useNavigate();
  const { asignacionId = "" } = useParams<{ asignacionId: string }>();
  const { toast } = useToast();

  const invitaciones = useConsulta<InvitacionResumen[]>(
    () => listarInvitaciones(asignacionId),
    [asignacionId]
  );
  const personas = useConsulta<ParticipanteResumen[]>(() => listarParticipantes(), []);

  // El MODO de la asignación decide si esta pantalla tiene sentido siquiera.
  //
  // Se consulta el listado de asignaciones —que ya trae `modo_identidad`— en vez
  // de añadir un endpoint: es una lista corta de la misma empresa, y evita que
  // la pantalla ofrezca generar invitaciones para que el servidor las rechace
  // con un 422. Ofrecer una acción imposible y explicarla DESPUÉS del error es
  // justo lo que hay que dejar de hacer.
  const asignaciones = useConsulta<AsignacionResumen[]>(() => listarAsignaciones(), []);
  const esAutodeclarada =
    (asignaciones.datos ?? []).find((a) => a.id === asignacionId)?.modo_identidad ===
    "AUTODECLARADA";

  const [seleccion, setSeleccion] = useState<Set<string>>(new Set());
  const [generando, setGenerando] = useState(false);
  const [recienEmitidas, setRecienEmitidas] = useState<InvitacionesGeneradas | null>(null);
  const [aRevocar, setARevocar] = useState<InvitacionResumen | null>(null);
  // El token se muestra una sola vez: emitir con el acceso cerrado obliga a
  // volver a emitir despues, y a recoger lo que ya se repartió.
  const accesoAbierto = useAccesoPublicoAbierto();
  const [motivo, setMotivo] = useState("");
  const [revocando, setRevocando] = useState(false);

  const lista = invitaciones.datos ?? [];

  // Quién todavía no tiene una invitación viva. Es a quien tiene sentido
  // ofrecer, y calcularlo aquí evita que alguien seleccione a media nómina para
  // que el servidor omita a casi todos.
  const conInvitacionViva = useMemo(
    () =>
      new Set(
        lista
          .filter((i) => i.estado === "PENDIENTE" || i.estado === "CONSUMIDA")
          .map((i) => i.participante_id)
      ),
    [lista]
  );
  const disponibles = useMemo(
    () => (personas.datos ?? []).filter((p) => !conInvitacionViva.has(p.id)),
    [personas.datos, conInvitacionViva]
  );

  async function generar() {
    setGenerando(true);
    try {
      const r = await generarInvitaciones(asignacionId, [...seleccion]);
      setRecienEmitidas(r);
      setSeleccion(new Set());
      await invitaciones.refrescar();
    } catch (e) {
      toast({
        variant: "destructive",
        title: "No pudimos generar las invitaciones",
        description: (e as ErrorApi).message,
      });
    } finally {
      setGenerando(false);
    }
  }

  async function confirmarRevocacion() {
    if (!aRevocar) return;
    setRevocando(true);
    try {
      await revocarInvitacion(aRevocar.id, motivo.trim());
      toast({
        title: "Invitación revocada",
        description: "Deja de servir de inmediato. Se puede emitir otra a esa persona.",
      });
      setARevocar(null);
      setMotivo("");
      await invitaciones.refrescar();
    } catch (e) {
      toast({
        variant: "destructive",
        title: "No pudimos revocar la invitación",
        description: (e as ErrorApi).message,
      });
    } finally {
      setRevocando(false);
    }
  }

  if (recienEmitidas) {
    return (
      <HojaDeInvitaciones
        generadas={recienEmitidas}
        alCerrar={() => setRecienEmitidas(null)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <BotonVolver a="/capacitaciones/asignaciones">Volver a asignaciones</BotonVolver>

      <PageHeader
        titulo="Invitaciones personales"
        icono={Send}
        descripcion="Cada persona entra con la suya, y sirve una sola vez. Es lo que hace que la constancia quede a nombre de quien de verdad hizo el curso."
      />

      <AvisoAccesoPublico que="invitaciones" />

      {esAutodeclarada ? (
        <Panel>
          <div className="flex flex-col items-center gap-5 text-center sm:flex-row sm:items-start sm:text-left">
            <Escena nombre="link-fallido" tamano="md" className="shrink-0" />
            <div className="min-w-0">
              <h2 className="font-rel-heading text-lg font-bold text-rel-dark">
                Esta asignación no usa invitaciones
              </h2>
              <p className="mt-2 font-rel-body text-sm leading-relaxed text-rel-muted">
                Se configuró para que cualquiera entre por el enlace del grupo
                escribiendo sus datos. Emitir invitaciones personales aquí no
                haría nada: el servidor las rechaza, porque la identidad de quien
                responde no sale de una nómina.
              </p>
              <p className="mt-2 font-rel-body text-sm leading-relaxed text-rel-muted">
                Si necesitas que la constancia acredite identidad, hay que crear
                la asignación con invitación personal — el modo no se cambia
                después.
              </p>
              <Button
                variant="rel"
                className="mt-5"
                onClick={() =>
                  navegar(`/capacitaciones/asignaciones/${asignacionId}/enlaces`)
                }
              >
                Ir a los enlaces de grupo
              </Button>
            </div>
          </div>
        </Panel>
      ) : (
        // Generar. Solo se ofrece a quien no tiene una invitación viva.
        <section className="rounded-rel-card border border-rel-border bg-rel-surface p-4">
        <h2 className="font-semibold text-rel-dark">Generar invitaciones</h2>
        {personas.fase === "listo" && disponibles.length === 0 ? (
          <p className="mt-2 text-sm text-rel-muted">
            {(personas.datos ?? []).length === 0
              ? "Todavía no hay nadie en la nómina. Agrégalos en Participantes."
              : "Todas las personas de la nómina ya tienen su invitación."}
          </p>
        ) : (
          <>
            <p className="mt-1 text-sm text-rel-muted">
              {disponibles.length}{" "}
              {disponibles.length === 1 ? "persona" : "personas"} sin invitación.
            </p>
            <ul className="mt-3 max-h-64 space-y-1 overflow-y-auto">
              {disponibles.map((p) => (
                <li key={p.id}>
                  <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-rel-control px-2 hover:bg-rel-surface-subtle">
                    <input
                      type="checkbox"
                      checked={seleccion.has(p.id)}
                      onChange={(e) =>
                        setSeleccion((s) => {
                          const n = new Set(s);
                          if (e.target.checked) n.add(p.id);
                          else n.delete(p.id);
                          return n;
                        })
                      }
                      className="h-4 w-4 accent-[hsl(var(--rel-primary))]"
                    />
                    <span className="text-sm text-rel-dark">
                      {p.nombres} {p.apellidos}
                    </span>
                    <span className="ml-auto text-xs tabular-nums text-rel-muted">
                      {p.tipo_documento} {p.numero_documento}
                    </span>
                  </label>
                </li>
              ))}
            </ul>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Button
                variant="relOutline"
                size="sm"
                onClick={() => setSeleccion(new Set(disponibles.map((p) => p.id)))}
              >
                Seleccionar todas
              </Button>
              <Button
                variant="rel"
                size="sm"
                disabled={generando || seleccion.size === 0 || !accesoAbierto}
                onClick={() => void generar()}
              >
                <Send className="mr-1.5 h-4 w-4" aria-hidden="true" />
                {generando
                  ? "Generando…"
                  : `Generar ${seleccion.size} ${seleccion.size === 1 ? "invitación" : "invitaciones"}`}
              </Button>
            </div>
          </>
        )}
      </section>
      )}

      {invitaciones.fase === "cargando" ? <CargandoTabla /> : null}
      {invitaciones.fase === "error" && invitaciones.error ? (
        <ErrorConsulta error={invitaciones.error} reintentar={invitaciones.refrescar} />
      ) : null}

      {invitaciones.fase === "listo" && lista.length === 0 ? (
        <SinDatos
          escena="notificacion"
          titulo="Todavía no has generado invitaciones"
          descripcion="Selecciona arriba a quién invitar. Sin invitación nadie puede entrar a esta capacitación."
        />
      ) : null}

      {invitaciones.fase === "listo" && lista.length > 0 ? (
        <TablaDatos<InvitacionResumen>
          filas={lista}
          claveFila={(i) => i.id}
          etiquetaElemento="invitaciones"
          etiquetaTabla="Invitaciones de la asignación"
          columnas={[
            {
              clave: "persona",
              titulo: "Persona",
              valor: (i) => `${i.apellidos} ${i.nombres}`,
              celda: (i) => (
                <span className="font-medium text-rel-dark">
                  {i.nombres} {i.apellidos}
                </span>
              ),
            },
            {
              clave: "documento",
              titulo: "Documento",
              valor: (i) => i.numero_documento,
              celda: (i) => (
                <span className="tabular-nums text-rel-muted">
                  {i.tipo_documento} {i.numero_documento}
                </span>
              ),
            },
            {
              clave: "estado",
              titulo: "Estado",
              valor: (i) => i.estado,
              celda: (i) => <EstadoInvitacion inv={i} />,
            },
            {
              clave: "expira",
              titulo: "Vence",
              valor: (i) => i.expira_en,
              celda: (i) => (
                <span className="text-rel-muted">{formatearFecha(i.expira_en)}</span>
              ),
            },
            {
              clave: "acciones",
              titulo: "Acciones",
              alineacion: "derecha",
              soloAcciones: true,
              celda: (i) =>
                i.estado === "PENDIENTE" ? (
                  <Button
                    variant="relOutline"
                    size="sm"
                    onClick={() => {
                      setARevocar(i);
                      setMotivo("");
                    }}
                  >
                    <ShieldOff className="mr-1.5 h-4 w-4" aria-hidden="true" />
                    Revocar
                    <span className="sr-only">
                      {" "}
                      la invitación de {i.nombres} {i.apellidos}
                    </span>
                  </Button>
                ) : i.estado === "CONSUMIDA" ? (
                  <span className="text-xs text-rel-muted">
                    Usada el {formatearFecha(i.consumida_en)}
                  </span>
                ) : null,
            },
          ]}
        />
      ) : null}

      <AlertDialog open={aRevocar !== null} onOpenChange={(o) => !o && setARevocar(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Revocar la invitación de {aRevocar?.nombres} {aRevocar?.apellidos}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Dejará de servir de inmediato. Podrás generarle otra a esta misma
              persona. Las invitaciones <strong>ya usadas</strong> no se revocan:
              esa persona ya hizo el curso, y para retirar el documento hay que
              anular su constancia.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-2">
            <Label htmlFor="motivo-rev">Motivo</Label>
            <Input
              id="motivo-rev"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Se envió a la persona equivocada"
              className="border-rel-border"
            />
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={revocando}>Cancelar</AlertDialogCancel>
            <Button
              variant="destructive"
              disabled={revocando || motivo.trim().length < 5}
              onClick={() => void confirmarRevocacion()}
            >
              {revocando ? "Revocando…" : "Revocar"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
