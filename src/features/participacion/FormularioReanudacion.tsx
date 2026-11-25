import { useState } from "react";
import { ArrowRight, IdCard } from "lucide-react";

import type { TipoDocumento } from "@/types/participacion";
import { ETIQUETA_DOCUMENTO, TIPOS_DOCUMENTO } from "@/types/participacion";
import { BotonPrincipal, BotonSecundario } from "./ParticipanteLayout";
import { Desplegable } from "@/shared/ui/Desplegable";
import { Input } from "@/components/ui/input";

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
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-rel-panel bg-rel-accent-subtle text-rel-primary">
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
          <Desplegable
            id="tipo-reanudacion"
            value={tipo}
            onChange={(e) => setTipo(e.target.value as TipoDocumento)}
          >
            {TIPOS_DOCUMENTO.map((opcion) => (
              <option key={opcion} value={opcion}>
                {opcion} · {ETIQUETA_DOCUMENTO[opcion]}
              </option>
            ))}
          </Desplegable>
        </div>
        <div>
          <label htmlFor="numero-reanudacion" className="mb-1.5 block text-sm font-semibold">
            Número de documento
          </label>
          <Input
            id="numero-reanudacion"
            value={numero}
            onChange={(e) => setNumero(e.target.value)}
            inputMode="numeric"
            autoComplete="off"
            enterKeyHint="go"
            maxLength={30}
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
        <BotonSecundario type="button" onClick={onCancelar} className="sm:w-auto">
          Volver
        </BotonSecundario>
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
