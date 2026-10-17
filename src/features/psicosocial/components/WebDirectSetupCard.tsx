import { useCallback, useEffect, useState } from "react";
import {
  CalendarClock,
  Check,
  ChevronDown,
  Copy,
  Download,
  ExternalLink,
  FileSpreadsheet,
  Info,
  Link2,
  Loader2,
  QrCode,
  RefreshCw,
  ShieldCheck,
  Users,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  getWebDirectStatus,
  regenerateWebDirectAccess,
  type WebDirectStatusResponse,
} from "@/features/psicosocial/api/psicoAccessService";
import type { AplicacionDetalleEmpleado } from "@/features/psicosocial/api/psicoAdminService";
import { Illustration } from "@/shared/ui/illustration/Illustration";

import { WebDirectBulkUploadModal } from "./WebDirectBulkUploadModal";

type WebDirectSetupCardProps = {
  applicationId: number;
  employees: AplicacionDetalleEmpleado[];
  disabled?: boolean;
  onParticipantsChanged?: () => void | Promise<void>;
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

export function WebDirectSetupCard({
  applicationId,
  disabled = false,
  onParticipantsChanged,
}: WebDirectSetupCardProps) {
  const [status, setStatus] = useState<WebDirectStatusResponse | null>(null);
  const [statusLoading, setStatusLoading] = useState(true);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [publicUrl, setPublicUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [accessOpen, setAccessOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [regenerateOpen, setRegenerateOpen] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  const loadStatus = useCallback(async () => {
    setStatusLoading(true);
    setStatusError(null);
    try {
      const result = await getWebDirectStatus(applicationId);
      setStatus(result);
      setPublicUrl(result.public_url ?? null);
    } catch (reason) {
      setStatusError(reason instanceof Error ? reason.message : "No fue posible consultar el enlace virtual.");
    } finally {
      setStatusLoading(false);
    }
  }, [applicationId]);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  const openBulkUpload = () => {
    setMenuOpen(false);
    setBulkOpen(true);
  };

  const openAccessDetails = () => {
    setMenuOpen(false);
    setCopied(false);
    setAccessOpen(true);
    void loadStatus();
  };

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
        public_url: result.public_url,
      });
      setRegenerateOpen(false);
    } catch (reason) {
      setStatusError(reason instanceof Error ? reason.message : "No fue posible regenerar el enlace virtual.");
    } finally {
      setRegenerating(false);
    }
  };

  const copyLink = async () => {
    if (!publicUrl) return;
    await navigator.clipboard.writeText(publicUrl);
    setCopied(true);
  };

  const downloadQr = () => {
    const qr = document.getElementById(`web-direct-qr-${applicationId}`);
    if (!qr) return;
    const blob = new Blob([new XMLSerializer().serializeToString(qr)], { type: "image/svg+xml;charset=utf-8" });
    const objectUrl = URL.createObjectURL(blob);
    const download = document.createElement("a");
    download.href = objectUrl;
    download.download = `acceso-aplicacion-${applicationId}-qr.svg`;
    download.click();
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 0);
  };

  const active = Boolean(status?.activo);

  return (
    <>
      <Popover open={menuOpen} onOpenChange={setMenuOpen}>
        <PopoverTrigger asChild>
          <Button type="button" className="h-auto rounded-2xl px-5 py-3" aria-label="Opciones de aplicación web">
            <Link2 aria-hidden="true" />
            Aplicación web
            <ChevronDown className="ml-1" aria-hidden="true" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" sideOffset={8} className="w-[min(19rem,calc(100vw-2rem))] rounded-2xl border-border bg-surface p-2 shadow-floating">
          <div className="flex items-center justify-between gap-3 px-3 py-2">
            <div>
              <p className="font-heading text-sm font-black text-foreground">Presentación web directa</p>
              <p className="mt-0.5 text-xs text-muted-foreground">Carga, consulta y comparte el acceso.</p>
            </div>
            <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2 py-1 text-[11px] font-bold ${active ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}`}>
              <span className={`h-2 w-2 rounded-full ${active ? "bg-success" : "bg-muted-foreground/50"}`} aria-hidden="true" />
              {statusLoading ? "Consultando" : active ? "Activo" : "Sin configurar"}
            </span>
          </div>
          <div className="my-1 h-px bg-border" />
          <button
            type="button"
            disabled={disabled}
            onClick={openBulkUpload}
            className="flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left transition hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          >
            <FileSpreadsheet className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
            <span>
              <strong className="block text-sm text-foreground">{active ? "Actualizar carga web" : "Cargar para aplicación web"}</strong>
              <span className="mt-0.5 block text-xs leading-5 text-muted-foreground">Importa colaboradores y asigna su Forma A/B.</span>
            </span>
          </button>
          <button
            type="button"
            disabled={!active || statusLoading}
            onClick={openAccessDetails}
            className="flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left transition hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          >
            <QrCode className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
            <span>
              <strong className="block text-sm text-foreground">Ver enlace y código QR</strong>
              <span className="mt-0.5 block text-xs leading-5 text-muted-foreground">Copia, descarga o regenera el acceso público.</span>
            </span>
          </button>
          {statusError ? <p role="alert" className="mx-2 my-2 rounded-xl bg-destructive/5 px-3 py-2 text-xs font-semibold text-destructive">{statusError}</p> : null}
        </PopoverContent>
      </Popover>

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
            public_url: result.public_url,
          });
          setAccessOpen(true);
          void onParticipantsChanged?.();
        }}
      />

      <Dialog open={accessOpen} onOpenChange={setAccessOpen}>
        <DialogContent className="flex max-h-[calc(100dvh-1rem)] w-[calc(100%-1rem)] max-w-4xl flex-col overflow-hidden rounded-3xl border-border bg-surface p-0 sm:max-h-[calc(100dvh-2rem)]">
          <DialogHeader className="border-b border-border bg-surface-subtle px-5 py-4 pr-12 sm:px-6">
            <div className="flex items-start gap-3 text-left">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-accent text-primary"><Link2 className="h-5 w-5" aria-hidden="true" /></span>
              <div>
                <DialogTitle className="font-heading text-xl font-black text-foreground sm:text-2xl">Presentación web directa</DialogTitle>
                <DialogDescription className="mt-1 leading-6">Consulta, copia o comparte el acceso de los colaboradores habilitados.</DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-5 py-4 sm:px-6 sm:py-4 md:overflow-y-visible">
            {statusLoading ? (
              <div role="status" className="flex min-h-48 items-center justify-center gap-3 rounded-2xl border border-border bg-surface-subtle text-sm text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> Consultando el acceso…</div>
            ) : statusError ? (
              <div role="alert" className="rounded-2xl border border-destructive/25 bg-destructive/5 p-5">
                <p className="font-heading font-black text-destructive">No fue posible consultar el acceso</p>
                <p className="mt-1 text-sm text-muted-foreground">{statusError}</p>
                <Button type="button" variant="outline" size="sm" className="mt-4" onClick={() => void loadStatus()}>Reintentar</Button>
              </div>
            ) : publicUrl ? (
              <>
                <section className="rounded-2xl border border-success/25 bg-success/5 p-4" aria-labelledby="web-direct-link-title">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex gap-3">
                      <span className="mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full bg-success" aria-hidden="true" />
                      <div><h3 id="web-direct-link-title" className="font-heading font-black text-foreground">Enlace activo</h3><p className="mt-1 text-sm text-muted-foreground">Disponible para que los colaboradores completen la aplicación.</p></div>
                    </div>
                    <Button type="button" variant="outline" size="sm" disabled={disabled || regenerating} onClick={() => setRegenerateOpen(true)}><RefreshCw aria-hidden="true" /> Regenerar enlace</Button>
                  </div>
                  <label className="mt-4 block text-xs font-black text-foreground" htmlFor="web-direct-public-url">Enlace público</label>
                  <div className="mt-2 flex min-w-0 flex-col gap-2 sm:flex-row">
                    <input id="web-direct-public-url" readOnly value={publicUrl} className="h-11 min-w-0 flex-1 rounded-xl border border-border bg-surface px-3 text-sm text-foreground" />
                    <Button type="button" variant="outline" className="shrink-0" onClick={() => void copyLink()}>{copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}{copied ? "Copiado" : "Copiar enlace"}</Button>
                    <Button asChild type="button" variant="outline" className="shrink-0"><a href={publicUrl} target="_blank" rel="noreferrer"><ExternalLink aria-hidden="true" /> Abrir</a></Button>
                  </div>
                </section>

                <div className="grid gap-3 md:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
                  <section className="rounded-2xl border border-border bg-surface p-4" aria-labelledby="web-direct-qr-title">
                    <h3 id="web-direct-qr-title" className="font-heading font-black text-foreground">Código QR para acceso</h3>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">También pueden ingresar escaneando este código.</p>
                    <div className="mt-3 flex flex-col items-center gap-3 sm:flex-row md:flex-col">
                      <div role="img" aria-label="Código QR del enlace público" className="rounded-2xl border border-border bg-white p-2 shadow-sm"><QRCodeSVG id={`web-direct-qr-${applicationId}`} value={publicUrl} size={132} level="M" marginSize={1} bgColor="#FFFFFF" fgColor="#0C162C" /></div>
                      <Button type="button" variant="outline" size="sm" onClick={downloadQr}><Download aria-hidden="true" /> Descargar QR</Button>
                    </div>
                  </section>

                  <section className="rounded-2xl border border-border bg-surface p-4" aria-labelledby="web-direct-info-title">
                    <h3 id="web-direct-info-title" className="font-heading font-black text-foreground">Información del enlace</h3>
                    <dl className="mt-3 space-y-2.5 text-sm">
                      <div className="flex items-start justify-between gap-4"><dt className="flex items-center gap-2 text-muted-foreground"><Users className="h-4 w-4" aria-hidden="true" /> Colaboradores habilitados</dt><dd className="font-bold text-foreground">{status?.participantes_habilitados ?? 0}</dd></div>
                      <div className="flex items-start justify-between gap-4"><dt className="flex items-center gap-2 text-muted-foreground"><CalendarClock className="h-4 w-4" aria-hidden="true" /> Fecha de generación</dt><dd className="text-right font-bold text-foreground">{formatGenerationDate(status?.enlace_generado_en ?? null)}</dd></div>
                      <div className="flex items-start justify-between gap-4"><dt className="flex items-center gap-2 text-muted-foreground"><Link2 className="h-4 w-4" aria-hidden="true" /> Tipo de acceso</dt><dd className="text-right font-bold text-foreground">Público, sin inicio de sesión</dd></div>
                      <div className="flex items-start justify-between gap-4"><dt className="flex items-center gap-2 text-muted-foreground"><ShieldCheck className="h-4 w-4" aria-hidden="true" /> Validación</dt><dd className="text-right font-bold text-foreground">Documento y fecha de nacimiento</dd></div>
                      <div className="flex items-start justify-between gap-4"><dt className="flex items-center gap-2 text-muted-foreground"><Check className="h-4 w-4" aria-hidden="true" /> Estado</dt><dd className="flex items-center gap-2 font-bold text-success"><span className="h-2 w-2 rounded-full bg-success" aria-hidden="true" /> Activo</dd></div>
                    </dl>
                  </section>
                </div>

                <div className="flex gap-3 rounded-2xl border border-info/25 bg-info/5 p-3 text-sm leading-5 text-foreground-soft">
                  <Info className="mt-0.5 h-5 w-5 shrink-0 text-info" aria-hidden="true" />
                  <p><strong className="block text-foreground">Importante</strong>Si regeneras el enlace, el anterior dejará de funcionar. Comparte el nuevo acceso con quienes aún no hayan completado la aplicación.</p>
                </div>
              </>
            ) : (
              <section className="grid gap-5 rounded-2xl border border-info/25 bg-info/5 p-5 sm:grid-cols-[1fr_auto] sm:items-center">
                <div>
                  <h3 className="font-heading text-lg font-black text-foreground">El acceso está activo</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">Este enlace fue creado antes de habilitar su consulta segura. Regénéralo una sola vez para poder verlo, copiarlo y descargar su QR desde aquí.</p>
                  <Button type="button" className="mt-4" disabled={disabled || regenerating} onClick={() => setRegenerateOpen(true)}><RefreshCw aria-hidden="true" /> Habilitar consulta del enlace</Button>
                </div>
                <Illustration name="psicoWebCompartirQr" size="sm" className="mx-auto w-32" />
              </section>
            )}
          </div>

          <DialogFooter className="border-t border-border bg-surface px-5 py-3 sm:px-6"><Button type="button" variant="outline" onClick={() => setAccessOpen(false)}>Cerrar</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={regenerateOpen} onOpenChange={setRegenerateOpen}>
        <AlertDialogContent className="rounded-3xl border-border bg-surface">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-heading text-xl font-black text-foreground">¿Regenerar el enlace virtual?</AlertDialogTitle>
            <AlertDialogDescription className="leading-6">El enlace anterior dejará de funcionar y se cerrarán las sesiones abiertas. Las asignaciones, formularios y datos certificados se conservarán.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={regenerating}>Cancelar</AlertDialogCancel>
            <AlertDialogAction disabled={regenerating} onClick={(event) => { event.preventDefault(); void regenerate(); }}>{regenerating ? <Loader2 className="animate-spin" aria-hidden="true" /> : <RefreshCw aria-hidden="true" />}{regenerating ? "Regenerando…" : "Regenerar enlace"}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
