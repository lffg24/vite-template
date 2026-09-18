// src/pages/participacion/VerificarPage.tsx · D-10
//
// El verificador público. Lo usa alguien ajeno: un inspector con el papel
// delante, un contratista comprobando a su proveedor.
//
// ## Por qué no pide cuenta
//
// Pedirle registrarse para comprobar un documento que ya tiene en la mano
// convertiría la verificación en un trámite, y entonces nadie la usa. Una
// constancia que nadie verifica no prueba nada.
//
// ## Por qué la pantalla no recorta el nombre
//
// Llega ya enmascarado del servidor. Recortarlo aquí significaría que el nombre
// y el documento completos viajaron por la red, donde cualquiera con las
// herramientas del navegador los lee — y entonces el enmascarado sería
// decorativo.
//
// ## Las tres situaciones
//
// `VIGENTE`, `VENCIDA` y `ANULADA` se muestran distinto **y las tres se
// muestran**. Que una constancia anulada desapareciera sería lo peor posible:
// quien tiene el PDF impreso vería «no encontrado» y pensaría que tecleó mal.

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { AlertTriangle, BadgeCheck, Clock, Search } from "lucide-react";

import { verificarConstancia } from "@/services/participacionService";
import type { ErrorPublico, Verificacion } from "@/types/participacion";
import {
  BotonPrincipal,
  Panel,
  ParticipanteLayout,
} from "@/features/participacion/ParticipanteLayout";

/** Cómo se presenta cada situación. Icono, color y una frase que la explica. */
const SITUACIONES = {
  VIGENTE: {
    Icono: BadgeCheck,
    color: "text-rel-success",
    fondo: "bg-rel-success-subtle",
    titulo: "Constancia válida",
    detalle: "El documento es auténtico y está vigente.",
  },
  VENCIDA: {
    Icono: Clock,
    color: "text-rel-warning",
    fondo: "bg-rel-warning-subtle",
    titulo: "Constancia vencida",
    // Dice explícitamente que es auténtica: vencer no es lo mismo que ser falsa,
    // y quien la presenta merece que la diferencia quede clara.
    detalle: "El documento es auténtico, pero su vigencia ya terminó.",
  },
  ANULADA: {
    Icono: AlertTriangle,
    color: "text-rel-danger",
    fondo: "bg-rel-danger-subtle",
    titulo: "Constancia anulada",
    detalle: "La empresa emisora retiró este documento. Ya no tiene validez.",
  },
} as const;

function fecha(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-CO", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function VerificarPage() {
  // El código puede venir en la ruta (`/c/verificar/ABCD-1234`, que es lo que
  // imprimirá el QR cuando exista) o teclearse aquí.
  const { codigo: codigoDeRuta } = useParams<{ codigo?: string }>();
  const [codigo, setCodigo] = useState(codigoDeRuta ?? "");
  const [resultado, setResultado] = useState<Verificacion | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [buscando, setBuscando] = useState(false);

  const buscar = useCallback(async (valor: string) => {
    const limpio = valor.trim();
    if (!limpio) return;
    setBuscando(true);
    setError(null);
    setResultado(null);
    try {
      setResultado(await verificarConstancia(limpio));
    } catch (e) {
      const err = e as ErrorPublico;
      setError(
        err.motivo === "demasiadas_peticiones"
          ? "Demasiados intentos desde esta red. Espera un minuto."
          : // Un código inexistente y uno mal tecleado dicen lo mismo, porque
            // el servidor no los distingue: separarlos convertiría esta
            // pantalla en un detector de códigos válidos.
            "No encontramos ninguna constancia con ese código. Revisa que lo hayas copiado completo."
      );
    } finally {
      setBuscando(false);
    }
  }, []);

  // Si llegó por la ruta con código —lo que abrirá el QR cuando exista—, se
  // busca al montar.
  //
  // Dos cosas, y hacen falta las dos:
  //
  // 1. **En un efecto**, no durante el render. Lanzar la petición y llamar a
  //    `setState` mientras React renderiza es un efecto secundario en el sitio
  //    equivocado.
  // 2. **Con guarda por código.** Mover al efecto no basta: Strict Mode monta,
  //    desmonta y vuelve a montar, así que el efecto corre dos veces igual. La
  //    `ref` sobrevive a ese ciclo y deja pasar una sola petición por código.
  //
  // Importa porque el endpoint tiene límite por IP: duplicar la petición gasta
  // el doble de cuota de cada visitante, y quien verifica suele ser el que menos
  // margen tiene para que le digan «espera un minuto».
  const yaBuscado = useRef<string | null>(null);
  useEffect(() => {
    if (!codigoDeRuta || yaBuscado.current === codigoDeRuta) return;
    yaBuscado.current = codigoDeRuta;
    void buscar(codigoDeRuta);
  }, [codigoDeRuta, buscar]);

  return (
    <ParticipanteLayout>
      <h1 className="font-rel-heading text-2xl font-bold">Verificar una constancia</h1>
      <p className="mt-2 text-base leading-relaxed text-rel-muted">
        Escribe el código que aparece en el documento. No necesitas una cuenta.
      </p>

      <form
        className="mt-6"
        onSubmit={(e) => {
          e.preventDefault();
          void buscar(codigo);
        }}
      >
        <label
          htmlFor="codigo"
          className="text-xs font-semibold uppercase tracking-wide text-rel-muted"
        >
          Código de verificación
        </label>
        {/* `autoCapitalize` y `spellCheck` apagados: el teclado del móvil, si no,
            corrige el código a una palabra. `inputMode` no es `numeric` porque
            el alfabeto lleva letras. */}
        <input
          id="codigo"
          value={codigo}
          onChange={(e) => setCodigo(e.target.value)}
          placeholder="ABCD-1234"
          autoCapitalize="characters"
          autoCorrect="off"
          spellCheck={false}
          className="mt-1 min-h-[3rem] w-full rounded-rel-control border border-rel-border bg-rel-surface px-4 font-mono text-lg uppercase tracking-[0.15em] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rel-primary"
        />
        <p className="mt-2 text-xs text-rel-muted">
          Da igual si lo escribes en minúsculas o sin el guion.
        </p>

        <div className="mt-4">
          <BotonPrincipal type="submit" disabled={buscando || !codigo.trim()}>
            {buscando ? (
              "Buscando…"
            ) : (
              <span className="inline-flex items-center gap-2">
                <Search className="h-5 w-5" aria-hidden="true" />
                Verificar
              </span>
            )}
          </BotonPrincipal>
        </div>
      </form>

      {error ? (
        <p
          role="alert"
          className="mt-6 rounded-rel-card border border-rel-border bg-rel-surface-subtle p-4 text-sm leading-relaxed"
        >
          {error}
        </p>
      ) : null}

      {resultado ? <Resultado v={resultado} /> : null}
    </ParticipanteLayout>
  );
}

function Resultado({ v }: { v: Verificacion }) {
  const s = SITUACIONES[v.situacion];
  const { Icono } = s;

  return (
    // `aria-live` para que un lector de pantalla anuncie el veredicto: sin esto,
    // enviar el formulario no produce ningún cambio audible.
    <div className="mt-6" aria-live="polite">
      <div className={`flex items-start gap-3 rounded-rel-card ${s.fondo} p-4`}>
        <Icono className={`mt-0.5 h-6 w-6 shrink-0 ${s.color}`} aria-hidden="true" />
        <div>
          <p className="font-rel-heading text-base font-bold">{s.titulo}</p>
          <p className="mt-1 text-sm leading-relaxed">{s.detalle}</p>
        </div>
      </div>

      <Panel className="mt-4">
        <dl className="space-y-3 text-sm">
          <Fila etiqueta="Participante" valor={v.participante} />
          <Fila etiqueta="Documento" valor={v.documento} />
          <Fila etiqueta="Empresa" valor={v.empresa ?? "—"} />
          <Fila etiqueta="Capacitación" valor={v.curso ?? "—"} />
          {v.intensidad_horaria_min ? (
            <Fila
              etiqueta="Intensidad"
              valor={`${v.intensidad_horaria_min} minutos`}
            />
          ) : null}
          <Fila etiqueta="Folio" valor={`N.º ${v.folio}`} />
          <Fila etiqueta="Emitida" valor={fecha(v.emitida_en)} />
          <Fila
            etiqueta="Vigencia"
            valor={v.vence_el ? `Hasta ${fecha(v.vence_el)}` : "No vence"}
          />
          {v.anulada_en ? (
            <Fila etiqueta="Anulada" valor={fecha(v.anulada_en)} ultima />
          ) : null}
        </dl>
      </Panel>

      {/* El aviso legal viene congelado en la constancia, no de una plantilla de
          esta pantalla: es parte de lo que el documento dice. */}
      {v.aviso ? (
        <p className="mt-4 text-xs leading-relaxed text-rel-muted">{v.aviso}</p>
      ) : null}

      <p className="mt-2 text-xs leading-relaxed text-rel-muted">
        El nombre y el documento se muestran parcialmente para proteger los datos
        personales de quien tomó la capacitación.
      </p>
    </div>
  );
}

function Fila({
  etiqueta,
  valor,
  ultima = false,
}: {
  etiqueta: string;
  valor: string;
  ultima?: boolean;
}) {
  return (
    <div
      className={`flex justify-between gap-4 ${
        ultima ? "" : "border-b border-rel-border pb-2"
      }`}
    >
      <dt className="shrink-0 text-rel-muted">{etiqueta}</dt>
      <dd className="text-right font-semibold">{valor}</dd>
    </div>
  );
}
