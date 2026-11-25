// src/shared/ui/Seleccion.tsx
//
// La lista desplegable CON BÚSQUEDA. Elegir una opción entre muchas (empresas,
// entidades, cargos, personas) sin recorrer una lista de cien a ojo.
//
// ## Cuándo esta y cuándo `Desplegable`
//
//   - `Desplegable`: pocas opciones (hasta ~7), sin buscar. Es el `<select>`
//     nativo con el aspecto de la casa; en el teléfono abre el selector del
//     sistema, que es lo más cómodo para el pulgar.
//   - `Seleccion`: muchas opciones, o cuando buscar es lo natural. Escribes y
//     la lista se acota. `buscable` se enciende solo pasadas 7 opciones.
//
// ## Cómo se usa con teclado
//
// Tab llega al botón; Enter o flecha abajo abre; se escribe para buscar; las
// flechas recorren; Enter elige; Escape cierra y devuelve el foco al botón. Todo
// eso lo da `cmdk` + el popover; aquí solo se ajusta la forma.
//
// ## Qué hace al elegir
//
// Llama `alCambiar(valor)` y cierra. No guarda estado propio del valor: es una
// pieza controlada, igual que el resto de los controles de formulario del kit.

import { Check, ChevronDown } from "lucide-react";
import { useState } from "react";

import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { ALTO_CONTROL, CLASE_CONTROL } from "./controles";

export interface OpcionSeleccion<T extends string> {
  valor: T;
  etiqueta: string;
  /** Una línea de apoyo bajo la etiqueta («NIT 900.123.456»). También se busca. */
  descripcion?: string;
}

const UMBRAL_BUSQUEDA = 7;

export function Seleccion<T extends string>({
  opciones,
  valor,
  alCambiar,
  id,
  placeholder = "Elige una opción",
  buscable,
  textoBusqueda = "Buscar…",
  textoVacio = "Nada coincide con tu búsqueda",
  deshabilitada,
  className,
  ...aria
}: {
  opciones: OpcionSeleccion<T>[];
  valor: T | "";
  alCambiar: (valor: T) => void;
  id?: string;
  placeholder?: string;
  /** Por defecto, se enciende cuando hay más de 7 opciones. */
  buscable?: boolean;
  textoBusqueda?: string;
  textoVacio?: string;
  deshabilitada?: boolean;
  className?: string;
  "aria-label"?: string;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
}) {
  const [abierta, setAbierta] = useState(false);
  const conBusqueda = buscable ?? opciones.length > UMBRAL_BUSQUEDA;
  const elegida = opciones.find((o) => o.valor === valor);

  return (
    <Popover open={abierta} onOpenChange={setAbierta}>
      <PopoverTrigger asChild>
        <button
          id={id}
          type="button"
          role="combobox"
          disabled={deshabilitada}
          {...aria}
          className={cn(
            CLASE_CONTROL,
            ALTO_CONTROL.normal,
            "flex cursor-pointer items-center justify-between gap-2 text-left",
            !elegida && "text-muted-foreground",
            className
          )}
        >
          <span className="min-w-0 flex-1 truncate">{elegida?.etiqueta ?? placeholder}</span>
          <ChevronDown
            aria-hidden="true"
            className={cn(
              "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-enter ease-rel-out motion-reduce:transition-none",
              abierta && "rotate-180"
            )}
          />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={6}
        className="w-(--radix-popover-trigger-width) min-w-56 rounded-rel-card border-rel-border bg-rel-surface p-0 shadow-rel-floating"
      >
        <Command>
          {conBusqueda ? <CommandInput placeholder={textoBusqueda} /> : null}
          <CommandList className="max-h-64 p-1.5">
            <CommandEmpty className="px-3 py-6 text-center text-sm text-rel-muted">{textoVacio}</CommandEmpty>
            {opciones.map((o) => {
              const marcada = o.valor === valor;
              return (
                <CommandItem
                  key={o.valor}
                  // cmdk busca sobre `value`: etiqueta + descripción, para que
                  // «900123» encuentre una empresa por su NIT.
                  value={`${o.etiqueta} ${o.descripcion ?? ""}`}
                  onSelect={() => {
                    alCambiar(o.valor);
                    setAbierta(false);
                  }}
                  className={cn(
                    "min-h-11 cursor-pointer gap-3 rounded-rel-control px-3 py-2 text-sm",
                    "data-[selected=true]:bg-rel-accent-subtle data-[selected=true]:text-rel-dark",
                    marcada && "font-semibold"
                  )}
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate">{o.etiqueta}</span>
                    {o.descripcion ? (
                      <span className="block truncate text-xs font-normal text-rel-muted">{o.descripcion}</span>
                    ) : null}
                  </span>
                  {marcada ? <Check className="h-4 w-4 shrink-0 text-rel-primary" aria-hidden="true" /> : null}
                </CommandItem>
              );
            })}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
