import { useCallback, useEffect, useState } from "react";
import { CalendarClock, Check, Copy, FileSpreadsheet, Link2, Loader2, RefreshCw } from "lucide-react";

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
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  getWebDirectStatus,
  regenerateWebDirectAccess,
  type WebDirectStatusResponse,
} from "@/features/psicosocial/api/psicoAccessService";
import type { AplicacionDetalleEmpleado } from "@/features/psicosocial/api/psicoAdminService";
import { WebDirectBulkUploadModal } from "./WebDirectBulkUploadModal";

type WebDirectSetupCardProps = {
  applicationId: number;
  employees: AplicacionDetalleEmpleado[];
  disabled?: boolean;
};

function formatGenerationDate(value: string | null): string {
  if (!value) return "Fecha no disponible";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Fecha no disponible";
  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(parsed);
}

export function WebDirectSetupCard({ applicationId, disabled = false }: WebDirectSetupCardProps) {
  const [status, setStatus] = useState<WebDirectStatusResponse | null>(null);
  const [statusLoading, setStatusLoading] = useState(true);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [publicUrl, setPublicUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [regenerateOpen, setRegenerateOpen] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  const loadStatus = useCallback(async () => {
    setStatusLoading(true);
    setStatusError(null);
    try {
      setStatus(await getWebDirectStatus(applicationId));
    } catch (reason) {
      setStatusError(reason instanceof Error ? reason.message : "No fue posible consultar el enlace virtual.");
    } finally {
      setStatusLoading(false);
    }
  }, [applicationId]);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  const regenerate = async () => {
    setRegenerating(true);
    setStatusError(null);
    try {
      const result = await regenerateWebDirectAccess(applicationId);
      setPublicUrl(result.public_url);
      setCopied(false);
      setStatus({
        ok: true,
        configurado: true,
        activo: true,
        enlace_generado_en: new Date().toISOString(),
        datos_certificados_en: status?.datos_certificados_en ?? null,
        participantes_habilitados: result.participantes_habilitados,
      });
      setRegenerateOpen(false);
    } catch (reason) {
      setStatusError(reason instanceof Error ? reason.message : "No fue posible regenerar el enlace virtual.");
    } finally {
      setRegenerating(false);
    }
  };

  return (
    <Card className="rounded-3xl border-border bg-surface p-5 shadow-card sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-accent text-primary">
            <Link2 className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.14em] text-primary">Piloto habilitado</p>
            <h2 className="mt-1 font-heading text-xl font-black text-foreground">Presentación web directa</h2>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">
              Carga los datos de acceso y la Forma A/B de cada colaborador en una sola plantilla. Al certificar la información se genera el enlace para esta aplicación.
            </p>
          </div>
        </div>
        <Button type="button" disabled={disabled || regenerating} onClick={() => setBulkOpen(true)}>
          <FileSpreadsheet aria-hidden="true" /> {status?.activo ? "Actualizar carga virtual" : "Carga masiva virtual"}
        </Button>
      </div>

      {publicUrl ? (
        <div role="status" className="mt-5 rounded-2xl border border-success/25 bg-success/5 p-4">
          <p className="font-heading text-base font-black text-foreground">Enlace listo para compartir</p>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Habilitado para {status?.participantes_habilitados ?? 0} colaborador(es). Cada persona se identifica con su tipo y número de documento, y fecha de nacimiento.
          </p>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <input readOnly value={publicUrl} aria-label="Enlace público generado" className="h-11 min-w-0 flex-1 rounded-xl border border-border bg-surface px-3 text-sm" />
            <Button
              type="button"
              variant="outline"
              onClick={async () => {
                await navigator.clipboard.writeText(publicUrl);
                setCopied(true);
              }}
            >
              {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}{copied ? "Copiado" : "Copiar enlace"}
            </Button>
          </div>
        </div>
      ) : statusLoading ? (
        <div role="status" className="mt-5 flex items-center gap-3 rounded-2xl border border-border bg-surface-subtle p-4 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Consultando el estado del enlace virtual…
        </div>
      ) : status?.activo ? (
        <div role="status" className="mt-5 rounded-2xl border border-info/25 bg-info/5 p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 gap-3">
              <CalendarClock className="mt-0.5 h-5 w-5 shrink-0 text-info" aria-hidden="true" />
              <div>
                <p className="font-heading text-base font-black text-foreground">Enlace virtual activo</p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  {status.participantes_habilitados} colaborador(es) habilitados · Generado el {formatGenerationDate(status.enlace_generado_en)}
                </p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  Por seguridad, el enlace anterior no se almacena en texto. Puedes regenerarlo si necesitas copiarlo nuevamente.
                </p>
              </div>
            </div>
            <Button type="button" variant="outline" disabled={disabled || regenerating} onClick={() => setRegenerateOpen(true)}>
              {regenerating ? <Loader2 className="animate-spin" aria-hidden="true" /> : <RefreshCw aria-hidden="true" />}
              Regenerar enlace
            </Button>
          </div>
        </div>
      ) : (
        <p className="mt-5 rounded-2xl border border-border bg-surface-subtle p-4 text-sm leading-6 text-muted-foreground">
          Descarga la plantilla, completa los seis datos obligatorios y cárgala para validar, certificar y habilitar a los colaboradores.
        </p>
      )}

      {statusError ? (
        <div role="alert" className="mt-4 flex flex-col gap-3 rounded-2xl border border-destructive/25 bg-destructive/5 p-4 text-sm text-destructive sm:flex-row sm:items-center sm:justify-between">
          <span className="font-semibold">{statusError}</span>
          <Button type="button" variant="outline" size="sm" onClick={() => void loadStatus()}>Reintentar</Button>
        </div>
      ) : null}

      <WebDirectBulkUploadModal
        applicationId={applicationId}
        open={bulkOpen}
        onOpenChange={setBulkOpen}
        onConfigured={(result) => {
          setPublicUrl(result.public_url);
          setCopied(false);
          setStatus({
            ok: true,
            configurado: true,
            activo: true,
            enlace_generado_en: new Date().toISOString(),
            datos_certificados_en: new Date().toISOString(),
            participantes_habilitados: result.participantes_habilitados,
          });
        }}
      />

      <AlertDialog open={regenerateOpen} onOpenChange={setRegenerateOpen}>
        <AlertDialogContent className="rounded-3xl border-border bg-surface">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-heading text-xl font-black text-foreground">¿Regenerar el enlace virtual?</AlertDialogTitle>
            <AlertDialogDescription className="leading-6">
              El enlace anterior dejará de funcionar y se cerrarán las sesiones de acceso que estén abiertas. Las asignaciones, formularios y datos certificados de los colaboradores se conservarán.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={regenerating}>Cancelar</AlertDialogCancel>
            <AlertDialogAction disabled={regenerating} onClick={(event) => { event.preventDefault(); void regenerate(); }}>
              {regenerating ? <Loader2 className="animate-spin" aria-hidden="true" /> : <RefreshCw aria-hidden="true" />}
              {regenerating ? "Regenerando…" : "Regenerar enlace"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
