import { useMemo, useState } from "react";
import { AlertTriangle, Download, FileSpreadsheet, Loader2, ShieldCheck, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  importWebDirectBulkParticipants,
  previewWebDirectBulkImport,
  type WebDirectBulkImportResponse,
  type WebDirectBulkPreviewResponse,
  type WebDirectBulkPreviewRow,
} from "@/features/psicosocial/api/psicoAccessService";

type WebDirectBulkUploadModalProps = {
  applicationId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfigured: (result: WebDirectBulkImportResponse) => void;
};

export function WebDirectBulkUploadModal({
  applicationId,
  open,
  onOpenChange,
  onConfigured,
}: WebDirectBulkUploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<WebDirectBulkPreviewResponse | null>(null);
  const [rows, setRows] = useState<WebDirectBulkPreviewRow[]>([]);
  const [certified, setCertified] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canImport = useMemo(
    () => Boolean(preview?.ok && rows.length > 0 && certified && !loading),
    [certified, loading, preview?.ok, rows],
  );

  const reset = () => {
    setFile(null);
    setPreview(null);
    setRows([]);
    setCertified(false);
    setLoading(false);
    setError(null);
  };

  const close = () => {
    if (loading) return;
    reset();
    onOpenChange(false);
  };

  const validateFile = async (selected: File) => {
    setFile(selected);
    setPreview(null);
    setRows([]);
    setCertified(false);
    setError(null);
    if (!/\.(xlsx|csv)$/i.test(selected.name)) {
      setError("Usa la plantilla en formato .xlsx o .csv.");
      return;
    }
    if (selected.size > 5 * 1024 * 1024) {
      setError("El archivo supera el tamaño máximo de 5 MB.");
      return;
    }
    setLoading(true);
    try {
      const result = await previewWebDirectBulkImport(applicationId, selected);
      setPreview(result);
      setRows(result.preview);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "No fue posible validar el archivo.");
    } finally {
      setLoading(false);
    }
  };

  const importRows = async () => {
    if (!canImport) return;
    setLoading(true);
    setError(null);
    try {
      const result = await importWebDirectBulkParticipants(
        applicationId,
        rows,
        certified,
      );
      onConfigured(result);
      reset();
      onOpenChange(false);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "No fue posible importar los colaboradores.");
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? onOpenChange(true) : close())}>
      <DialogContent className="flex max-h-[92vh] w-[calc(100%-1.5rem)] max-w-5xl flex-col overflow-hidden rounded-3xl border-border bg-surface p-0">
        <DialogHeader className="border-b border-border bg-surface-subtle px-5 py-5 pr-12 sm:px-7">
          <DialogTitle className="font-heading text-xl font-black text-foreground sm:text-2xl">
            Carga masiva para aplicación virtual
          </DialogTitle>
          <DialogDescription className="leading-6">
            Esta plantilla es exclusiva para el acceso del colaborador. Todos los datos son obligatorios.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-5 sm:px-7">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_17rem]">
            <label className="flex min-h-40 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-accent bg-accent/30 p-5 text-center transition hover:border-primary">
              {loading ? <Loader2 className="h-10 w-10 animate-spin text-primary" aria-hidden="true" /> : <Upload className="h-10 w-10 text-primary" aria-hidden="true" />}
              <strong className="mt-3 max-w-full break-all text-sm text-foreground">{file?.name ?? "Selecciona el archivo diligenciado"}</strong>
              <span className="mt-1 text-xs text-muted-foreground">.xlsx o .csv · máximo 5 MB</span>
              <input
                type="file"
                accept=".xlsx,.csv"
                className="sr-only"
                disabled={loading}
                onChange={(event) => {
                  const selected = event.target.files?.[0];
                  if (selected) void validateFile(selected);
                  event.currentTarget.value = "";
                }}
              />
            </label>
            <div className="rounded-2xl border border-border bg-surface-subtle p-5">
              <FileSpreadsheet className="h-8 w-8 text-success" aria-hidden="true" />
              <p className="mt-3 font-heading font-black text-foreground">Plantilla exclusiva</p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">Nombres, apellidos, tipo y número de documento, fecha de nacimiento y Formulario A/B.</p>
              <Button asChild variant="outline" className="mt-4 w-full">
                <a href="/templates/plantilla_carga_virtual_psicosocial.xlsx" download>
                  <Download aria-hidden="true" /> Descargar plantilla
                </a>
              </Button>
            </div>
          </div>

          {error ? <p role="alert" className="rounded-2xl border border-destructive/25 bg-destructive/5 p-4 text-sm font-semibold text-destructive">{error}</p> : null}

          {preview?.errors.length ? (
            <section className="rounded-2xl border border-warning/30 bg-warning/10 p-4">
              <h3 className="flex items-center gap-2 font-heading font-black text-foreground"><AlertTriangle className="h-5 w-5 text-warning" aria-hidden="true" /> Corrige el archivo</h3>
              <ul className="mt-3 max-h-44 space-y-2 overflow-y-auto text-sm text-foreground-soft">
                {preview.errors.slice(0, 30).map((item, index) => <li key={`${item.row}-${item.field}-${index}`}>Fila {item.row ?? "archivo"}: {item.message}</li>)}
              </ul>
            </section>
          ) : null}

          {preview?.ok && rows.length ? (
            <section className="space-y-4">
              <div>
                <div>
                  <h3 className="font-heading text-lg font-black text-foreground">{rows.length} colaboradores validados</h3>
                  <p className="text-sm text-muted-foreground">Los datos de acceso y el formulario fueron validados desde la plantilla.</p>
                </div>
              </div>

              <div className="max-h-80 space-y-3 overflow-y-auto" aria-label="Colaboradores virtuales validados">
                {rows.map((row) => (
                  <article key={`${row.tipo_documento}-${row.numero_documento}`} className="grid gap-3 rounded-2xl border border-border bg-surface-subtle p-4 sm:grid-cols-[minmax(14rem,1fr)_auto] sm:items-center">
                    <div className="min-w-0">
                      <strong className="block break-words text-sm text-foreground">{row.nombres} {row.apellidos}</strong>
                      <span className="mt-1 block text-xs text-muted-foreground">{row.tipo_documento} {row.numero_documento} · {row.fecha_nacimiento}</span>
                    </div>
                    <div className="flex items-center gap-3 sm:justify-end">
                      <span className="text-xs text-muted-foreground">Fila {row.row} validada</span>
                      <span className="rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-bold text-primary">Forma {row.forma_asignada}</span>
                    </div>
                  </article>
                ))}
              </div>

              <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-info/25 bg-info/5 p-4">
                <Checkbox checked={certified} onCheckedChange={(value) => setCertified(value === true)} aria-label="Certifico que los datos de acceso son correctos" />
                <span className="text-sm leading-6 text-foreground">
                  <strong className="block">Certifico que los datos son correctos.</strong>
                  Confirmo que nombres, apellidos, documento, fecha de nacimiento y formulario corresponden a cada colaborador y autorizo su uso para habilitar el acceso.
                </span>
              </label>
            </section>
          ) : null}
        </div>

        <DialogFooter className="gap-2 border-t border-border bg-surface px-5 py-4 sm:px-7">
          <Button type="button" variant="outline" onClick={close} disabled={loading}>Cancelar</Button>
          <Button type="button" onClick={() => void importRows()} disabled={!canImport}>
            {loading ? <Loader2 className="animate-spin" aria-hidden="true" /> : <ShieldCheck aria-hidden="true" />}
            {loading ? "Importando…" : "Certificar y generar enlace"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
