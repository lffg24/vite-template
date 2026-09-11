// src/pages/capacitaciones/CapacitacionesEnlacesPage.tsx · A-12
//
// Rol: quien reparte el acceso.
// Trabajo a resolver: «necesito un enlace para este grupo» y «este enlace se
// filtró, córtalo».
//
// Decisión que gobierna toda la pantalla: **los enlaces se rotan, no se
// recuperan.** El listado no muestra ningún enlace copiable porque el servidor
// no lo tiene: guarda su hash. Así que la acción es «Generar enlace», nunca
// «Copiar el vigente», y eso está dicho en la pantalla en vez de dejar al
// usuario buscando un botón de copiar que no existe.

import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Link2, Plus } from "lucide-react";

import { PageHeader } from "@/shared/ui/PageHeader";
import { TablaDatos } from "@/shared/ui/TablaDatos";
import { BotonVolver } from "@/shared/ui/BotonVolver";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  generarEnlace,
  listarAsignaciones,
  listarEnlaces,
  revocarEnlace,
} from "@/services/capacitacionesService";
import type {
  AsignacionResumen,
  EnlaceCreado,
  EnlaceResumen,
  ErrorApi,
} from "@/types/capacitaciones";
import {
  VIGENCIA_ENLACE_DIAS_DEFAULT,
  VIGENCIA_ENLACE_DIAS_MAX,
} from "@/types/capacitaciones";
import { useConsulta } from "@/features/capacitaciones/useConsulta";
import {
  CargandoTabla,
  ErrorConsulta,
  SinDatos,
} from "@/features/capacitaciones/components/EstadoPantalla";
import { EstadoEnlaceBadge } from "@/features/capacitaciones/components/Insignias";
import { EnlaceGeneradoDialog } from "@/features/capacitaciones/components/EnlaceGeneradoDialog";
import { formatearCupo, formatearFechaHora } from "@/features/capacitaciones/formato";

export default function CapacitacionesEnlacesPage() {
  const { asignacionId = "" } = useParams<{ asignacionId: string }>();
  const { toast } = useToast();

  const enlaces = useConsulta<EnlaceResumen[]>(
    () => listarEnlaces(asignacionId),
    [asignacionId]
  );
  // El listado de asignaciones es corto y ya está permitido por la misma
  // guarda. Se reutiliza para el encabezado en vez de añadir un endpoint de
  // detalle que solo serviría para pintar un título.
  const asignaciones = useConsulta<AsignacionResumen[]>(() => listarAsignaciones(), []);
  const asignacion = useMemo(
    () => (asignaciones.datos ?? []).find((a) => a.id === asignacionId) ?? null,
    [asignaciones.datos, asignacionId]
  );

  const [generando, setGenerando] = useState(false);
  const [vigenciaDias, setVigenciaDias] = useState(String(VIGENCIA_ENLACE_DIAS_DEFAULT));
  const [cupo, setCupo] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [recienCreado, setRecienCreado] = useState<EnlaceCreado | null>(null);
  const [aRevocar, setARevocar] = useState<EnlaceResumen | null>(null);
  const [revocando, setRevocando] = useState(false);
  const [errorVigencia, setErrorVigencia] = useState<string | null>(null);

  const utilizables = (enlaces.datos ?? []).filter((e) => e.utilizable).length;

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    const dias = Number(vigenciaDias);
    if (!Number.isFinite(dias) || dias < 1 || dias > VIGENCIA_ENLACE_DIAS_MAX) {
      setErrorVigencia(
        `Entre 1 y ${VIGENCIA_ENLACE_DIAS_MAX} días. Un enlace sin caducidad práctica sigue abierto mucho después de que la capacitación terminó.`
      );
      return;
    }
    setErrorVigencia(null);

    const cupoNum = cupo.trim() === "" ? null : Number(cupo);
    setEnviando(true);
    try {
      const creado = await generarEnlace(asignacionId, {
        vigencia_dias: Math.trunc(dias),
        cupo_max:
          cupoNum !== null && Number.isFinite(cupoNum) && cupoNum > 0
            ? Math.trunc(cupoNum)
            : null,
      });
      setGenerando(false);
      // El token NO pasa por el toast ni por ningún registro: solo por este
      // estado, que alimenta la ventana que lo muestra una vez.
      setRecienCreado(creado);
      setCupo("");
      setVigenciaDias(String(VIGENCIA_ENLACE_DIAS_DEFAULT));
      await enlaces.refrescar();
    } catch (e) {
      const err = e as ErrorApi;
      toast({
        variant: "destructive",
        title: "No pudimos generar el enlace",
        description: err.message,
      });
    } finally {
      setEnviando(false);
    }
  }

  async function confirmarRevocacion() {
    if (!aRevocar) return;
    setRevocando(true);
    try {
      await revocarEnlace(aRevocar.id);
      toast({
        title: "Enlace revocado",
        description: "Deja de servir de inmediato. Quien lo tenga abierto no podrá continuar.",
      });
      setARevocar(null);
      await enlaces.refrescar();
    } catch (e) {
      const err = e as ErrorApi;
      toast({
        variant: "destructive",
        title: "No pudimos revocar el enlace",
        description: err.message,
      });
    } finally {
      setRevocando(false);
    }
  }

  return (
    <div className="space-y-6">
      <BotonVolver a="/capacitaciones/asignaciones">Volver a asignaciones</BotonVolver>

      <PageHeader
        titulo="Enlaces de grupo"
        icono={Link2}
        descripcion={
          asignacion
            ? `${asignacion.curso_titulo} · versión ${asignacion.numero_version}`
            : "De esta asignación."
        }
        accion={
          asignacion?.estado === "CERRADA" ? null : (
            <Button variant="rel" onClick={() => setGenerando(true)}>
              <Plus aria-hidden="true" />
              Generar enlace
            </Button>
          )
        }
      />

      {asignacion?.estado === "CERRADA" ? (
        <p
          role="status"
          className="rounded-rel-card border border-rel-neutral/30 bg-rel-neutral-subtle p-4 font-rel-body text-sm text-rel-dark"
        >
          Esta asignación está cerrada: no admite inscripciones nuevas, así que
          no tiene sentido generar más enlaces. Los que ya se repartieron siguen
          listados y se pueden revocar.
        </p>
      ) : null}

      {enlaces.fase === "cargando" ? <CargandoTabla filas={3} /> : null}

      {enlaces.fase === "error" && enlaces.error ? (
        <ErrorConsulta error={enlaces.error} reintentar={enlaces.refrescar} />
      ) : null}

      {enlaces.fase === "listo" && (enlaces.datos ?? []).length === 0 ? (
        <SinDatos
          ilustracion="enlace"
          titulo="Nadie puede entrar todavía"
          descripcion="La asignación existe, pero sin un enlace no hay por dónde acceder. El enlace se muestra una sola vez al generarlo."
          accion={
            asignacion?.estado === "CERRADA" ? undefined : (
              <Button variant="rel" onClick={() => setGenerando(true)}>
                <Plus aria-hidden="true" />
                Generar el primero
              </Button>
            )
          }
        />
      ) : null}

      {enlaces.fase === "listo" && (enlaces.datos ?? []).length > 0 ? (
        <>
          <p className="font-rel-body text-sm text-rel-muted">
            {utilizables === 0
              ? "Ninguno de estos enlaces sirve ya. Genera uno nuevo para volver a abrir el acceso."
              : `${utilizables} de ${(enlaces.datos ?? []).length} sirven ahora mismo.`}{" "}
            Los enlaces no se pueden volver a ver: el sistema guarda solo su huella.
          </p>

          <div className="hidden md:block">
            <TablaDatos<EnlaceResumen>
              filas={enlaces.datos ?? []}
              claveFila={(e) => e.id}
              etiquetaElemento="enlaces"
              etiquetaTabla="Enlaces de grupo de la asignación"
              columnas={[
                {
                  clave: "estado",
                  titulo: "Estado",
                  // Ordena por el estado crudo y no por lo que pinta la
                  // insignia: «Caduca en 2 días» es texto calculado, y ordenar
                  // por él mezclaría caducidades con revocaciones.
                  valor: (e) => e.estado,
                  celda: (e) => <EstadoEnlaceBadge enlace={e} />,
                },
                {
                  clave: "creado",
                  titulo: "Generado",
                  valor: (e) => e.creado_en,
                  celda: (e) => (
                    <span className="text-rel-dark">{formatearFechaHora(e.creado_en)}</span>
                  ),
                },
                {
                  clave: "expira",
                  titulo: "Vence",
                  valor: (e) => e.expira_en,
                  celda: (e) => (
                    <span className="text-rel-dark">{formatearFechaHora(e.expira_en)}</span>
                  ),
                },
                {
                  clave: "usos",
                  titulo: "Usos",
                  alineacion: "derecha",
                  valor: (e) => e.usos,
                  celda: (e) => (
                    <span className="tabular-nums text-rel-dark">
                      {formatearCupo(e.usos, e.cupo_max)}
                    </span>
                  ),
                },
                {
                  clave: "acciones",
                  titulo: "Acciones",
                  alineacion: "derecha",
                  soloAcciones: true,
                  celda: (e) =>
                    e.estado === "ACTIVO" ? (
                      <Button
                        variant="relGhost"
                        size="sm"
                        className="text-rel-danger hover:bg-rel-danger-subtle"
                        onClick={() => setARevocar(e)}
                      >
                        Revocar
                        <span className="sr-only">
                          {" "}
                          el enlace generado el {formatearFechaHora(e.creado_en)}
                        </span>
                      </Button>
                    ) : (
                      <span className="text-sm text-rel-muted">
                        Revocado el {formatearFechaHora(e.revocado_en)}
                      </span>
                    ),
                },
              ]}
            />
          </div>

          <ul className="space-y-3 md:hidden">
            {(enlaces.datos ?? []).map((e) => (
              <li key={e.id} className="rounded-rel-card border border-rel-border bg-rel-surface p-4">
                <EstadoEnlaceBadge enlace={e} />
                <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 font-rel-body text-sm">
                  <dt className="text-rel-muted">Generado</dt>
                  <dd className="text-right text-rel-dark">{formatearFechaHora(e.creado_en)}</dd>
                  <dt className="text-rel-muted">Vence</dt>
                  <dd className="text-right text-rel-dark">{formatearFechaHora(e.expira_en)}</dd>
                  <dt className="text-rel-muted">Usos</dt>
                  <dd className="text-right tabular-nums text-rel-dark">
                    {formatearCupo(e.usos, e.cupo_max)}
                  </dd>
                </dl>
                {e.estado === "ACTIVO" ? (
                  <Button
                    variant="relGhost"
                    size="sm"
                    className="mt-3 w-full text-rel-danger hover:bg-rel-danger-subtle"
                    onClick={() => setARevocar(e)}
                  >
                    Revocar enlace
                  </Button>
                ) : null}
              </li>
            ))}
          </ul>
        </>
      ) : null}

      {/* --- generación --- */}
      <Sheet open={generando} onOpenChange={(v) => !v && setGenerando(false)}>
        <SheetContent className="rel-scope w-full overflow-y-auto bg-rel-surface font-rel-body sm:max-w-md">
          <SheetHeader>
            <SheetTitle className="font-rel-heading text-rel-dark">Generar enlace</SheetTitle>
            <SheetDescription className="text-rel-muted">
              Se mostrará una sola vez. Generar uno nuevo no invalida los
              anteriores: para eso está revocar.
            </SheetDescription>
          </SheetHeader>

          <form onSubmit={enviar} className="mt-6 space-y-5" noValidate>
            <div className="space-y-2">
              <Label htmlFor="e-vigencia" className="text-rel-dark">
                Vigencia en días
              </Label>
              <Input
                id="e-vigencia"
                inputMode="numeric"
                value={vigenciaDias}
                onChange={(ev) => setVigenciaDias(ev.target.value)}
                aria-invalid={errorVigencia ? true : undefined}
                aria-describedby={errorVigencia ? "e-vigencia-error" : "e-vigencia-ayuda"}
                autoFocus
              />
              {errorVigencia ? (
                <p id="e-vigencia-error" role="alert" className="text-sm text-rel-danger">
                  {errorVigencia}
                </p>
              ) : (
                <p id="e-vigencia-ayuda" className="text-sm text-rel-muted">
                  Máximo {VIGENCIA_ENLACE_DIAS_MAX}. Cuanto más corto, menos
                  tiempo queda abierto si se filtra.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="e-cupo" className="text-rel-dark">
                Cupo máximo
              </Label>
              <Input
                id="e-cupo"
                inputMode="numeric"
                value={cupo}
                onChange={(ev) => setCupo(ev.target.value)}
                placeholder="Vacío = sin límite"
                aria-describedby="e-cupo-ayuda"
              />
              <p id="e-cupo-ayuda" className="text-sm text-rel-muted">
                Cuenta inscripciones, no visitas: reenviar el enlace por WhatsApp
                no gasta cupo.
              </p>
            </div>

            <SheetFooter className="gap-2 sm:gap-2">
              <Button
                type="button"
                variant="relGhost"
                onClick={() => setGenerando(false)}
                disabled={enviando}
              >
                Cancelar
              </Button>
              <Button type="submit" variant="rel" disabled={enviando}>
                {enviando ? "Generando…" : "Generar enlace"}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>

      <EnlaceGeneradoDialog enlace={recienCreado} alCerrar={() => setRecienCreado(null)} />

      {/* --- revocación --- */}
      <AlertDialog open={aRevocar !== null} onOpenChange={(v) => !v && setARevocar(null)}>
        <AlertDialogContent className="rel-scope font-rel-body">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-rel-heading text-rel-dark">
              ¿Revocar este enlace?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-rel-muted">
              Deja de servir de inmediato, también para quien lo tenga abierto a
              medias. No se puede deshacer ni reactivar: habría que generar uno
              nuevo y repartirlo otra vez.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={revocando}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-rel-danger text-rel-danger-foreground hover:bg-rel-danger/90"
              onClick={(e) => {
                e.preventDefault();
                void confirmarRevocacion();
              }}
              disabled={revocando}
            >
              {revocando ? "Revocando…" : "Revocar enlace"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
