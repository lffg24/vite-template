// src/features/participacion/FormularioIdentidad.tsx · D-02
//
// Una sola pantalla. Partirla en dos duplica el abandono en móvil sin ganar
// nada: son siete campos, cuatro de ellos opcionales.
//
// Los `<input>` son nativos y no los primitivos de ShadCN a propósito. Aquí
// importan `inputMode`, `autoComplete` y `enterKeyHint`, que son lo que hace que
// el teclado del teléfono aparezca con números cuando toca y con «Siguiente» en
// vez de «Ir». Envolverlos costaría eso sin aportar nada: no hay dos formularios
// públicos que compartir.

import { useRef, useState } from "react";

import { BotonPrincipal } from "./ParticipanteLayout";
import type {
  AceptacionEnviada,
  Identificacion,
  TextoPresentado,
  TipoDocumento,
} from "@/types/participacion";
import { ETIQUETA_DOCUMENTO, TIPOS_DOCUMENTO } from "@/types/participacion";

interface Errores {
  numero_documento?: string;
  nombres?: string;
  apellidos?: string;
  aceptaciones?: string;
}

const claseCampo =
  "min-h-[3rem] w-full rounded-rel-control border border-rel-border bg-rel-surface px-3 " +
  "text-base text-rel-dark placeholder:text-rel-muted " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rel-primary";

export function FormularioIdentidad({
  textos,
  enviando,
  onEnviar,
}: {
  textos: TextoPresentado[];
  enviando: boolean;
  onEnviar: (datos: Identificacion) => void;
}) {
  const [tipo, setTipo] = useState<TipoDocumento>("CC");
  const [numero, setNumero] = useState("");
  const [nombres, setNombres] = useState("");
  const [apellidos, setApellidos] = useState("");
  const [cargo, setCargo] = useState("");
  const [correo, setCorreo] = useState("");
  const [telefono, setTelefono] = useState("");
  const [marcados, setMarcados] = useState<Record<string, boolean>>({});
  const [abierto, setAbierto] = useState<string | null>(null);
  const [errores, setErrores] = useState<Errores>({});
  //: Para llevar el foco al grupo cuando lo único que falta es marcar.
  const primeraCasilla = useRef<HTMLInputElement>(null);

  function validar(): Errores {
    const e: Errores = {};
    if (!numero.trim()) e.numero_documento = "Escribe tu número de documento.";
    if (!nombres.trim()) e.nombres = "Escribe tus nombres.";
    if (!apellidos.trim()) e.apellidos = "Escribe tus apellidos.";
    if (textos.some((t) => !marcados[t.clave])) {
      e.aceptaciones = "Marca las dos autorizaciones para continuar.";
    }
    return e;
  }

  function enviar(ev: React.FormEvent) {
    ev.preventDefault();
    const e = validar();
    setErrores(e);
    if (Object.keys(e).length > 0) {
      // El foco va al primer problema. Sin esto, en un teléfono el error queda
      // fuera de pantalla y parece que el botón no hizo nada.
      //
      // Se busca por el ID del campo, **no** por `[aria-invalid='true']`. Aquel
      // no funcionaba nunca: `setErrores` es asíncrono, así que en el momento de
      // ejecutar esta línea React todavía no ha repintado y ningún elemento
      // lleva aún ese atributo. El `querySelector` devolvía `null` en silencio y
      // el foco se quedaba donde estaba.
      //
      // Las casillas van por `ref` y aparte: es el caso más frecuente —los datos
      // están bien y solo falta marcar— y tampoco movía el foco, porque las
      // casillas no llevan `aria-invalid`. Quien usa lector de pantalla oía el
      // aviso y no tenía forma de llegar a lo que había que arreglar.
      const primerCampo = e.numero_documento
        ? "num-doc"
        : e.nombres
          ? "nombres"
          : e.apellidos
            ? "apellidos"
            : null;
      if (primerCampo) {
        document.getElementById(primerCampo)?.focus();
      } else if (e.aceptaciones) {
        primeraCasilla.current?.focus();
      }
      return;
    }

    const aceptaciones: AceptacionEnviada[] = textos.map((t) => ({
      clave: t.clave,
      // La versión EXACTA que se mostró. Si cambió mientras leía, el servidor
      // rechaza las dos y la pantalla vuelve a presentarla.
      texto_id_presentado: t.texto_id,
    }));

    onEnviar({
      tipo_documento: tipo,
      numero_documento: numero.trim(),
      nombres: nombres.trim(),
      apellidos: apellidos.trim(),
      cargo: cargo.trim() || null,
      correo: correo.trim() || null,
      telefono: telefono.trim() || null,
      aceptaciones,
    });
  }

  return (
    <form onSubmit={enviar} className="flex flex-1 flex-col gap-5" noValidate>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-rel-muted">
          Paso 1 de 3
        </p>
        <h1 className="mt-1 font-rel-heading text-2xl font-bold">Tus datos</h1>
      </div>

      <div className="flex gap-3">
        <div className="w-28">
          <label htmlFor="tipo-doc" className="mb-1 block text-sm font-semibold">
            Tipo
          </label>
          <select
            id="tipo-doc"
            value={tipo}
            onChange={(e) => setTipo(e.target.value as TipoDocumento)}
            className={claseCampo}
          >
            {TIPOS_DOCUMENTO.map((t) => (
              <option key={t} value={t} title={ETIQUETA_DOCUMENTO[t]}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <div className="flex-1">
          <label htmlFor="num-doc" className="mb-1 block text-sm font-semibold">
            Número <span className="text-rel-danger">*</span>
          </label>
          <input
            id="num-doc"
            value={numero}
            onChange={(e) => setNumero(e.target.value)}
            // Teclado numérico sin `type=number`: aquel añade flechas, admite
            // notación científica y en algunos navegadores recorta ceros a la
            // izquierda, que en un documento son parte del número.
            inputMode="numeric"
            autoComplete="off"
            enterKeyHint="next"
            maxLength={30}
            className={claseCampo}
            aria-invalid={errores.numero_documento ? true : undefined}
            aria-describedby={errores.numero_documento ? "err-num" : undefined}
          />
          {errores.numero_documento ? (
            <p id="err-num" role="alert" className="mt-1 text-sm text-rel-danger">
              {errores.numero_documento}
            </p>
          ) : null}
        </div>
      </div>

      <Campo
        id="nombres"
        etiqueta="Nombres"
        obligatorio
        valor={nombres}
        alCambiar={setNombres}
        autoComplete="given-name"
        error={errores.nombres}
      />
      <Campo
        id="apellidos"
        etiqueta="Apellidos"
        obligatorio
        valor={apellidos}
        alCambiar={setApellidos}
        autoComplete="family-name"
        error={errores.apellidos}
      />
      <Campo
        id="cargo"
        etiqueta="Cargo"
        ayuda="Opcional"
        valor={cargo}
        alCambiar={setCargo}
        autoComplete="organization-title"
      />
      <Campo
        id="correo"
        etiqueta="Correo"
        // No dice «para enviarte la constancia»: no hay envío por correo.
        // Pedir un dato personal invocando un uso que no existe es pedirlo bajo
        // un motivo falso, y además es lo que la autorización de datos declara.
        ayuda="Opcional. Solo para que tu empresa pueda contactarte."
        valor={correo}
        alCambiar={setCorreo}
        tipo="email"
        autoComplete="email"
      />
      <Campo
        id="telefono"
        etiqueta="Teléfono"
        ayuda="Opcional"
        valor={telefono}
        alCambiar={setTelefono}
        tipo="tel"
        autoComplete="tel"
      />

      {/* El error del grupo se asocia al `fieldset`, no a una casilla suelta:
          falta marcar LAS DOS, así que el problema es del conjunto. Al recibir
          el foco una casilla, el lector de pantalla anuncia la leyenda del
          fieldset y su descripción, y ahí es donde suena el motivo. */}
      <fieldset
        className="rounded-rel-card border border-rel-border bg-rel-surface p-4"
        aria-describedby={errores.aceptaciones ? "err-aceptaciones" : undefined}
      >
        <legend className="px-1 text-sm font-semibold">Autorizaciones</legend>
        <div className="space-y-4">
          {textos.map((t, i) => (
            <div key={t.clave}>
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  ref={i === 0 ? primeraCasilla : undefined}
                  type="checkbox"
                  checked={Boolean(marcados[t.clave])}
                  onChange={(e) =>
                    setMarcados((m) => ({ ...m, [t.clave]: e.target.checked }))
                  }
                  // 20 px: una casilla de 13 px por defecto es imposible de dar
                  // con el pulgar.
                  className="mt-0.5 h-5 w-5 shrink-0 accent-[hsl(var(--rel-primary))]"
                  // Solo cuando el texto está DESPLEGADO. `hidden` saca el
                  // elemento del árbol de accesibilidad, así que apuntar ahí
                  // estando colapsado deja un `aria-describedby` que no resuelve
                  // a nada: el lector de pantalla no anuncia descripción alguna
                  // y además la referencia es inválida. Colapsado, la
                  // descripción es la etiqueta; para leer el texto está el botón.
                  aria-describedby={abierto === t.clave ? `texto-${t.clave}` : undefined}
                />
                <span className="text-sm leading-relaxed">
                  {t.finalidad ?? "Autorizo el tratamiento de mis datos."}
                </span>
              </label>
              <button
                type="button"
                onClick={() => setAbierto(abierto === t.clave ? null : t.clave)}
                className="mt-1 pl-8 text-sm font-semibold text-rel-primary underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rel-primary"
                aria-expanded={abierto === t.clave}
                aria-controls={`texto-${t.clave}`}
                // El texto visible dice «Leer el texto completo» en los dos
                // botones. Quien navega por botones con un lector de pantalla
                // oiría lo mismo dos veces y no sabría cuál abre cuál.
                aria-label={`${
                  abierto === t.clave ? "Ocultar" : "Leer"
                } el texto completo de: ${
                  t.finalidad ?? "Autorizo el tratamiento de mis datos."
                }`}
              >
                {abierto === t.clave ? "Ocultar el texto" : "Leer el texto completo"}
              </button>
              {/* Se oculta con `hidden` y no se desmonta, para que abrirlo no
                  cueste un renderizado del texto completo. Colapsado NO está en
                  el árbol de accesibilidad —por eso el `aria-describedby` de
                  arriba es condicional—, y quien use lector de pantalla llega a
                  él por el botón, que dice a qué autorización pertenece. */}
              <div
                id={`texto-${t.clave}`}
                hidden={abierto !== t.clave}
                className="mt-2 max-h-64 overflow-y-auto rounded-rel-control bg-rel-surface-subtle p-3 text-sm leading-relaxed text-rel-muted"
              >
                <p className="whitespace-pre-line">{t.contenido}</p>
                <p className="mt-2 text-xs">Versión {t.version}</p>
              </div>
            </div>
          ))}
        </div>
        {errores.aceptaciones ? (
          <p id="err-aceptaciones" role="alert" className="mt-3 text-sm text-rel-danger">
            {errores.aceptaciones}
          </p>
        ) : null}
      </fieldset>

      <div className="mt-auto pt-2">
        <BotonPrincipal type="submit" disabled={enviando}>
          {enviando ? "Ingresando…" : "Ingresar"}
        </BotonPrincipal>
      </div>
    </form>
  );
}

function Campo({
  id,
  etiqueta,
  valor,
  alCambiar,
  obligatorio,
  ayuda,
  error,
  tipo = "text",
  autoComplete,
}: {
  id: string;
  etiqueta: string;
  valor: string;
  alCambiar: (v: string) => void;
  obligatorio?: boolean;
  ayuda?: string;
  error?: string;
  tipo?: string;
  autoComplete?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-semibold">
        {etiqueta}
        {obligatorio ? <span className="text-rel-danger"> *</span> : null}
      </label>
      <input
        id={id}
        type={tipo}
        value={valor}
        onChange={(e) => alCambiar(e.target.value)}
        autoComplete={autoComplete}
        enterKeyHint="next"
        className={claseCampo}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `err-${id}` : ayuda ? `ayuda-${id}` : undefined}
      />
      {error ? (
        <p id={`err-${id}`} role="alert" className="mt-1 text-sm text-rel-danger">
          {error}
        </p>
      ) : ayuda ? (
        <p id={`ayuda-${id}`} className="mt-1 text-sm text-rel-muted">
          {ayuda}
        </p>
      ) : null}
    </div>
  );
}
