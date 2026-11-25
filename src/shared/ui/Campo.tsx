// src/shared/ui/Campo.tsx
//
// Etiqueta, campo, ayuda y error. Una vez.
//
// ## Por qué hacía falta
//
// Había OCHO componentes locales haciendo esto, llamados `Field` o `Campo`,
// cada uno en su pantalla y cada uno distinto. Cuatro están fuera de
// Psicosocial, y las cuatro difieren en algo que importa:
//
//   - Una envuelve al hijo en el `<label>` en vez de usar `htmlFor`. Con un
//     `input` suelto funciona, pero cuando dentro hay una lista de opciones
//     —la de psicólogos en Créditos— convierte TODA la lista en el área de
//     clic de la etiqueta.
//   - Dos no marcan lo obligatorio; una lo marca con un asterisco dentro del
//     propio texto de la etiqueta, así que el lector de pantalla lee
//     «Nombre completo asterisco».
//   - Y las cuatro pintan el error como un párrafo rojo suelto: **texto que no
//     está asociado al campo**. Quien usa lector de pantalla oye «Correo de
//     acceso, editable» y nada más; el motivo del rechazo está en la pantalla
//     pero no llega.
//
// ## Lo que decide este componente
//
//   - **`htmlFor` siempre**, nunca envoltura. Por eso `id` es obligatorio: sin
//     él no hay forma de enlazar la etiqueta, y un `id` opcional es un `id`
//     que nadie pasa.
//   - **El error se enlaza al campo.** `Campo` clona a su hijo para ponerle
//     `aria-invalid` y `aria-describedby` apuntando a la ayuda y al error. Eso
//     es lo que convierte el texto rojo en un mensaje que el campo anuncia.
//     Si el hijo ya declara uno de esos atributos, gana el hijo.
//   - **Lo obligatorio se dice fuera del nombre.** El asterisco va en un
//     `<span aria-hidden>` y la obligatoriedad real viaja en `required` del
//     propio campo, que es lo que el lector anuncia.
//
// ## Límite conocido
//
// La clonación necesita UN hijo que sea un elemento. Con un fragmento o una
// lista, `Campo` pinta igual la etiqueta, la ayuda y el error, pero no puede
// enlazarlos: ahí el `id` y el `aria-describedby` los pone la pantalla.

import { Children, cloneElement, isValidElement, type ReactElement, type ReactNode } from "react";

import { cn } from "@/lib/utils";

export function Campo({
  id,
  etiqueta,
  obligatorio,
  ayuda,
  error,
  children,
  className,
}: {
  /** Enlaza la etiqueta con el campo. Obligatorio a propósito. */
  id: string;
  etiqueta: ReactNode;
  obligatorio?: boolean;
  /** Qué se espera en el campo, antes de equivocarse. */
  ayuda?: ReactNode;
  /** Qué pasó. Mientras tenga valor, el campo queda marcado como inválido. */
  error?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  const idAyuda = ayuda ? `${id}-ayuda` : undefined;
  const idError = error ? `${id}-error` : undefined;
  const descripcion = [idAyuda, idError].filter(Boolean).join(" ") || undefined;

  const unico = Children.count(children) === 1 ? Children.only(children) : null;
  const campo =
    unico && isValidElement(unico)
      ? cloneElement(unico as ReactElement<Record<string, unknown>>, {
          id: (unico.props as { id?: string }).id ?? id,
          "aria-invalid": (unico.props as { "aria-invalid"?: unknown })["aria-invalid"] ?? (error ? true : undefined),
          "aria-describedby":
            (unico.props as { "aria-describedby"?: string })["aria-describedby"] ?? descripcion,
        })
      : children;

  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor={id} className="block font-heading text-sm font-semibold text-foreground">
        {etiqueta}
        {obligatorio ? (
          // `aria-hidden` porque el asterisco no es parte del nombre del
          // campo: lo obligatorio lo anuncia `required`, no un símbolo.
          <span aria-hidden="true" className="ml-0.5 text-danger">
            *
          </span>
        ) : null}
      </label>
      {campo}
      {ayuda ? (
        <p id={idAyuda} className="text-xs leading-5 text-muted-foreground">
          {ayuda}
        </p>
      ) : null}
      {error ? (
        <p id={idError} className="text-xs font-semibold text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
