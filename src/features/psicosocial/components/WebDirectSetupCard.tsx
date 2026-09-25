import { useState } from "react";
import { Check, Copy, FileSpreadsheet, Link2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { AplicacionDetalleEmpleado } from "@/features/psicosocial/api/psicoAdminService";
import { WebDirectBulkUploadModal } from "./WebDirectBulkUploadModal";

type WebDirectSetupCardProps = {
  applicationId: number;
  employees: AplicacionDetalleEmpleado[];
  disabled?: boolean;
};

export function WebDirectSetupCard({ applicationId, disabled = false }: WebDirectSetupCardProps) {
  const [publicUrl, setPublicUrl] = useState<string | null>(null);
  const [configuredParticipantCount, setConfiguredParticipantCount] = useState(0);
  const [copied, setCopied] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);

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
        <Button type="button" disabled={disabled} onClick={() => setBulkOpen(true)}>
          <FileSpreadsheet aria-hidden="true" /> Carga masiva virtual
        </Button>
      </div>

      {publicUrl ? (
        <div role="status" className="mt-5 rounded-2xl border border-success/25 bg-success/5 p-4">
          <p className="font-heading text-base font-black text-foreground">Enlace listo para compartir</p>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Habilitado para {configuredParticipantCount} colaborador(es). Cada persona se identifica con su tipo y número de documento, y fecha de nacimiento.
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
      ) : (
        <p className="mt-5 rounded-2xl border border-border bg-surface-subtle p-4 text-sm leading-6 text-muted-foreground">
          Descarga la plantilla, completa los seis datos obligatorios y cárgala para validar, certificar y habilitar a los colaboradores.
        </p>
      )}

      <WebDirectBulkUploadModal
        applicationId={applicationId}
        open={bulkOpen}
        onOpenChange={setBulkOpen}
        onConfigured={(result) => {
          setPublicUrl(result.public_url);
          setConfiguredParticipantCount(result.participantes_habilitados);
          setCopied(false);
        }}
      />
    </Card>
  );
}
