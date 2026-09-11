// src/pages/capacitaciones/CapacitacionesAsignacionesPage.tsx · A-11
//
// Rol: quien opera la capacitación en la empresa.
// Trabajo a resolver: «qué se está dictando y a quién le falta el enlace».
//
// Decisión de jerarquía: la columna que decide es **enlaces activos**, no la
// fecha. Una asignación activa sin ningún enlace vigente es trabajo detenido:
// alguien la creó y nadie puede entrar. Por eso esas filas se marcan y se
// ordenan primero, y la acción de cada fila lleva a sus enlaces.

import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, Link2, Send, Plus, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PageHeader } from "@/shared/ui/PageHeader";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { cerrarAsignacion, listarAsignaciones } from "@/services/capacitacionesService";
import type { AsignacionResumen, ErrorApi } from "@/types/capacitaciones";
import { useConsulta } from "@/features/capacitaciones/useConsulta";
import {
  CargandoTabla,
  ErrorConsulta,
  SinDatos,
} from "@/features/capacitaciones/components/EstadoPantalla";
import { EstadoAsignacionBadge, ModoIdentidadBadge } from "@/features/capacitaciones/components/Insignias";
import { AsignacionNuevaSheet } from "@/features/capacitaciones/components/AsignacionNuevaSheet";
import { formatearFecha, formatearVigenciaMeses } from "@/features/capacitaciones/formato";

/** Activa y sin enlaces = trabajo detenido. Esas van primero. */
function detenida(a: AsignacionResumen) {
  return a.estado === "ACTIVA" && a.enlaces_activos === 0;
}

export default function CapacitacionesAsignacionesPage() {
  const navegar = useNavigate();
  const { toast } = useToast();
  const consulta = useConsulta<AsignacionResumen[]>(() => listarAsignaciones(), []);
  const [asignando, setAsignando] = useState(false);
  const [aCerrar, setACerrar] = useState<AsignacionResumen | null>(null);
  const [cerrando, setCerrando] = useState(false);

  const filas = useMemo(() => {
    const datos = consulta.datos ?? [];
    return datos
      .slice()
      .sort(
        (a, b) =>
          Number(detenida(b)) - Number(detenida(a)) ||
          Number(b.estado === "ACTIVA") - Number(a.estado === "ACTIVA") ||
          b.creado_en.localeCompare(a.creado_en)
      );
  }, [consulta.datos]);

  const detenidas = filas.filter(detenida).length;

  async function confirmarCierre() {
    if (!aCerrar) return;
    setCerrando(true);
    try {
      await cerrarAsignacion(aCerrar.id);
      toast({
        title: "Asignación cerrada",
        description: "Deja de admitir inscripciones nuevas. Los enlaces repartidos siguen vivos hasta que se revoquen.",
      });
      setACerrar(null);
      await consulta.refrescar();
    } catch (e) {
      const err = e as ErrorApi;
      toast({
        variant: "destructive",
        title: "No pudimos cerrar la asignación",
        description: err.message,
      });
    } finally {
      setCerrando(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        titulo="Asignaciones"
        icono={Users}
        descripcion="Qué versión se está dictando en esta empresa y por dónde se entra."
        accion={
          <Button variant="rel" onClick={() => setAsignando(true)}>
            <Plus aria-hidden="true" />
            Asignar curso
          </Button>
        }
      />

      {detenidas > 0 ? (
        <div
          role="status"
          className="flex items-start gap-3 rounded-rel-card border border-rel-warning/30 bg-rel-warning-subtle p-4"
        >
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-rel-warning" aria-hidden="true" />
          <p className="font-rel-body text-sm text-rel-dark">
            {detenidas === 1
              ? "Hay 1 asignación activa sin ningún enlace vigente: nadie puede entrar a ella."
              : `Hay ${detenidas} asignaciones activas sin ningún enlace vigente: nadie puede entrar a ellas.`}
          </p>
        </div>
      ) : null}

      {consulta.fase === "cargando" ? <CargandoTabla /> : null}

      {consulta.fase === "error" && consulta.error ? (
        <ErrorConsulta error={consulta.error} reintentar={consulta.refrescar} />
      ) : null}

      {consulta.fase === "listo" && filas.length === 0 ? (
        <SinDatos
          ilustracion="capacitacion"
          titulo="Todavía no se ha asignado ningún curso"
          descripcion="Asignar una versión publicada es lo que permite generar enlaces y que la gente entre a hacerla."
          accion={
            <Button variant="rel" onClick={() => setAsignando(true)}>
              <Plus aria-hidden="true" />
              Asignar el primero
            </Button>
          }
        />
      ) : null}

      {consulta.fase === "listo" && filas.length > 0 ? (
        <>
          <div className="hidden overflow-x-auto rounded-rel-panel border border-rel-border bg-rel-surface md:block">
            <Table>
              <TableHeader>
                <TableRow className="border-rel-border hover:bg-transparent">
                  <TableHead className="text-rel-dark">Curso</TableHead>
                  <TableHead className="text-rel-dark">Estado</TableHead>
                  <TableHead className="text-rel-dark">Cómo se entra</TableHead>
                  <TableHead className="text-right text-rel-dark">Enlaces activos</TableHead>
                  <TableHead className="text-rel-dark">Fecha objetivo</TableHead>
                  <TableHead className="text-rel-dark">Vigencia</TableHead>
                  <TableHead className="text-right text-rel-dark">
                    <span className="sr-only">Acciones</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filas.map((a) => (
                  <TableRow key={a.id} className="border-rel-border">
                    <TableCell className="font-medium text-rel-dark">
                      {a.curso_titulo}
                      <span className="ml-2 text-xs text-rel-muted">v{a.numero_version}</span>
                    </TableCell>
                    <TableCell>
                      <EstadoAsignacionBadge estado={a.estado} />
                    </TableCell>
                    <TableCell>
                      <ModoIdentidadBadge modo={a.modo_identidad} />
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      <span className={detenida(a) ? "font-semibold text-rel-warning" : "text-rel-dark"}>
                        {a.enlaces_activos}
                      </span>
                      {detenida(a) ? (
                        <span className="ml-1.5 text-xs text-rel-warning">sin acceso</span>
                      ) : null}
                    </TableCell>
                    <TableCell className="text-rel-dark">
                      {formatearFecha(a.fecha_objetivo)}
                    </TableCell>
                    <TableCell className="text-rel-dark">
                      {formatearVigenciaMeses(a.vigencia_meses)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {/* Las invitaciones van ANTES que los enlaces: en modo
                            individual son la via por la que se entra, y el
                            enlace de grupo solo sirve para mirar. */}
                        <Button
                          variant="relOutline"
                          size="sm"
                          onClick={() =>
                            navegar(`/capacitaciones/asignaciones/${a.id}/invitaciones`)
                          }
                        >
                          <Send aria-hidden="true" />
                          Invitaciones
                          <span className="sr-only"> de {a.curso_titulo}</span>
                        </Button>
                        <Button
                          variant="relOutline"
                          size="sm"
                          onClick={() => navegar(`/capacitaciones/asignaciones/${a.id}/enlaces`)}
                        >
                          <Link2 aria-hidden="true" />
                          Enlaces
                          <span className="sr-only"> de {a.curso_titulo}</span>
                        </Button>
                        {a.estado === "ACTIVA" ? (
                          <Button variant="relGhost" size="sm" onClick={() => setACerrar(a)}>
                            Cerrar
                            <span className="sr-only"> la asignación de {a.curso_titulo}</span>
                          </Button>
                        ) : null}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <ul className="space-y-3 md:hidden">
            {filas.map((a) => (
              <li key={a.id} className="rounded-rel-card border border-rel-border bg-rel-surface p-4">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="font-rel-heading text-base font-bold text-rel-dark">
                    {a.curso_titulo}{" "}
                    <span className="text-sm font-normal text-rel-muted">v{a.numero_version}</span>
                  </h2>
                  <EstadoAsignacionBadge estado={a.estado} />
                </div>
                <div className="mt-2">
                  <ModoIdentidadBadge modo={a.modo_identidad} />
                </div>
                <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 font-rel-body text-sm">
                  <dt className="text-rel-muted">Enlaces activos</dt>
                  <dd
                    className={`text-right tabular-nums ${
                      detenida(a) ? "font-semibold text-rel-warning" : "text-rel-dark"
                    }`}
                  >
                    {a.enlaces_activos}
                    {detenida(a) ? " · sin acceso" : ""}
                  </dd>
                  <dt className="text-rel-muted">Fecha objetivo</dt>
                  <dd className="text-right text-rel-dark">{formatearFecha(a.fecha_objetivo)}</dd>
                  <dt className="text-rel-muted">Vigencia</dt>
                  <dd className="text-right text-rel-dark">
                    {formatearVigenciaMeses(a.vigencia_meses)}
                  </dd>
                </dl>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <Button
                    variant="relOutline"
                    size="sm"
                    className="w-full"
                    onClick={() => navegar(`/capacitaciones/asignaciones/${a.id}/invitaciones`)}
                  >
                    <Send aria-hidden="true" />
                    Invitaciones
                  </Button>
                  <Button
                    variant="relOutline"
                    size="sm"
                    className="w-full"
                    onClick={() => navegar(`/capacitaciones/asignaciones/${a.id}/enlaces`)}
                  >
                    <Link2 aria-hidden="true" />
                    Enlaces
                  </Button>
                  {a.estado === "ACTIVA" ? (
                    <Button
                      variant="relGhost"
                      size="sm"
                      className="col-span-2 w-full"
                      onClick={() => setACerrar(a)}
                    >
                      Cerrar
                    </Button>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        </>
      ) : null}

      <AsignacionNuevaSheet
        abierto={asignando}
        alCerrar={() => setAsignando(false)}
        alCrear={async () => {
          setAsignando(false);
          await consulta.refrescar();
        }}
      />

      <AlertDialog open={aCerrar !== null} onOpenChange={(v) => !v && setACerrar(null)}>
        <AlertDialogContent className="rel-scope font-rel-body">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-rel-heading text-rel-dark">
              ¿Cerrar la asignación de «{aCerrar?.curso_titulo}»?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-rel-muted">
              Deja de admitir inscripciones nuevas. Quien ya empezó puede
              terminar, y los enlaces repartidos siguen vivos hasta que se
              revoquen uno a uno: cerrar no es lo mismo que revocar.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cerrando}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-rel-danger text-rel-danger-foreground hover:bg-rel-danger/90"
              onClick={(e) => {
                e.preventDefault();
                void confirmarCierre();
              }}
              disabled={cerrando}
            >
              {cerrando ? "Cerrando…" : "Cerrar asignación"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
