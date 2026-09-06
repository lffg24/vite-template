// src/pages/capacitaciones/CapacitacionesConstanciasPage.tsx · A-13
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
import { Copy, Search, ShieldOff } from "lucide-react";

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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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

  const vigentes = constancias.filter((c) => c.estado === "VIGENTE").length;

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
      <header className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Constancias</h1>
        <p className="text-sm text-muted-foreground">
          {vigentes} vigente{vigentes === 1 ? "" : "s"} de {constancias.length}.
          Cada una lleva su folio y un código con el que cualquiera puede
          comprobarla sin necesidad de una cuenta.
        </p>
      </header>

      <div className="relative max-w-sm">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
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
          className="pl-9"
        />
      </div>

      {consulta.fase === "cargando" ? <CargandoTabla /> : null}
      {consulta.fase === "error" && consulta.error ? (
        <ErrorConsulta error={consulta.error} reintentar={consulta.refrescar} />
      ) : null}

      {consulta.fase === "listo" && constancias.length === 0 ? (
        <SinDatos
          titulo="Todavía no hay constancias"
          descripcion="Se emiten solas cuando alguien termina una capacitación asignada."
        />
      ) : null}

      {consulta.fase === "listo" && constancias.length > 0 ? (
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-20">Folio</TableHead>
                <TableHead>Persona</TableHead>
                <TableHead>Capacitación</TableHead>
                <TableHead>Código</TableHead>
                <TableHead>Emitida</TableHead>
                <TableHead>Vigencia</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibles.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-semibold tabular-nums">{c.folio}</TableCell>
                  <TableCell className="font-medium">{nombre(c)}</TableCell>
                  <TableCell className="text-muted-foreground">{c.curso ?? "—"}</TableCell>
                  <TableCell>
                    <button
                      type="button"
                      onClick={() => void copiarCodigo(c.codigo_verificacion)}
                      className="inline-flex items-center gap-1.5 font-mono text-xs tracking-wider hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      aria-label={`Copiar el código ${c.codigo_verificacion}`}
                    >
                      {c.codigo_verificacion}
                      <Copy className="h-3 w-3" aria-hidden="true" />
                    </button>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatearFecha(c.emitida_en)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {c.vence_el ? `Hasta ${formatearFecha(c.vence_el)}` : "No vence"}
                  </TableCell>
                  <TableCell>
                    {c.estado === "ANULADA" ? (
                      // El motivo va en el `title`: la columna no tiene sitio
                      // para el texto completo, y la pregunta que se hace ante
                      // una fila anulada es siempre «por qué».
                      <Badge variant="destructive" title={c.anulacion_motivo ?? undefined}>
                        Anulada
                      </Badge>
                    ) : (
                      <Badge variant="secondary">Vigente</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {c.estado === "VIGENTE" ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setAAnular(c);
                          setMotivo("");
                        }}
                      >
                        <ShieldOff className="mr-1.5 h-4 w-4" aria-hidden="true" />
                        Anular
                      </Button>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        {formatearFechaHora(c.anulada_en)}
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
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
            />
            {/* Obligatorio, y dicho antes de intentarlo. Una anulación sin
                explicación deja el expediente con una pregunta abierta que
                nadie podrá responder después. */}
            <p className="text-xs text-muted-foreground">
              Queda registrado junto a la constancia. Es lo que responderá a la
              pregunta «¿por qué se anuló?» dentro de dos años.
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
