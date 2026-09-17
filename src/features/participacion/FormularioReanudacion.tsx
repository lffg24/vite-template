import { useState } from "react";
import { ArrowRight, IdCard } from "lucide-react";

import type { TipoDocumento } from "@/types/participacion";
import { ETIQUETA_DOCUMENTO, TIPOS_DOCUMENTO } from "@/types/participacion";
import { BotonPrincipal } from "./ParticipanteLayout";

export function FormularioReanudacion({
  enviando,
  error,
  onEnviar,
  onCancelar,
}: {
  enviando: boolean;
  error: string | null;
  onEnviar: (tipo: TipoDocumento, numero: string) => void;
  onCancelar: () => void;
}) {
  const [tipo, setTipo] = useState<TipoDocumento>("CC");
  const [numero, setNumero] = useState("");
  const [errorLocal, setErrorLocal] = useState<string | null>(null);

  function enviar(evento: React.FormEvent) {
    evento.preventDefault();
    if (!numero.trim()) {
      setErrorLocal("Escribe tu número de documento.");
      return;
    }
    setErrorLocal(null);
    onEnviar(tipo, numero.trim());
  }

  const mensaje = errorLocal ?? error;

  return (
    <form onSubmit={enviar} className="space-y-5" noValidate>
      <div className="flex items-start gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-rel-accent-subtle text-rel-primary">
          <IdCard className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <h2 className="font-rel-heading text-xl font-bold">Continúa tu capacitación</h2>
          <p className="mt-1 text-sm leading-relaxed text-rel-muted">
            Usa el mismo enlace y tu documento. Tu avance se conserva.
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-[10rem_1fr]">
        <div>
          <label htmlFor="tipo-reanudacion" className="mb-1.5 block text-sm font-semibold">
            Tipo de documento
          </label>
          <select
            id="tipo-reanudacion"
            value={tipo}
            onChange={(e) => setTipo(e.target.value as TipoDocumento)}
            className="min-h-12 w-full rounded-rel-control border border-rel-border bg-rel-surface px-3 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rel-primary"
          >
            {TIPOS_DOCUMENTO.map((opcion) => (
              <option key={opcion} value={opcion}>
                {opcion} · {ETIQUETA_DOCUMENTO[opcion]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="numero-reanudacion" className="mb-1.5 block text-sm font-semibold">
            Número de documento
          </label>
          <input
            id="numero-reanudacion"
            value={numero}
            onChange={(e) => setNumero(e.target.value)}
            inputMode="numeric"
            autoComplete="off"
            enterKeyHint="go"
            maxLength={30}
            className="min-h-12 w-full rounded-rel-control border border-rel-border bg-rel-surface px-3 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rel-primary"
            aria-invalid={mensaje ? true : undefined}
            aria-describedby={mensaje ? "error-reanudacion" : undefined}
          />
        </div>
      </div>

      {mensaje ? (
        <p
          id="error-reanudacion"
          role="alert"
          className="rounded-rel-card border border-rel-danger/30 bg-rel-danger-subtle p-3 text-sm"
        >
          {mensaje}
        </p>
      ) : null}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onCancelar}
          className="min-h-12 rounded-rel-control px-5 text-sm font-semibold text-rel-muted hover:bg-rel-surface-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rel-primary"
        >
          Volver
        </button>
        <BotonPrincipal type="submit" disabled={enviando} className="sm:w-auto">
          <span className="inline-flex items-center justify-center gap-2">
            {enviando ? "Buscando…" : "Continuar"}
            {!enviando ? <ArrowRight className="h-4 w-4" aria-hidden="true" /> : null}
          </span>
        </BotonPrincipal>
      </div>
    </form>
  );
}
