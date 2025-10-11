// src/components/preguntas/CompetenciaSelect.tsx
import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import { ChevronsUpDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  listarCompetenciasEmpresa,
  type Competencia,
} from "@/services/competenciaService";

type Props = {
  evaluacionId: number;
  value: number | null;
  onChange: (id: number | null) => void;
  disabled?: boolean;
};

export default function CompetenciaSelect({
  evaluacionId,
  value,
  onChange,
  disabled,
}: Props) {
  const [open, setOpen] = React.useState(false);
  const [items, setItems] = React.useState<Competencia[]>([]);
  const selected = items.find((c) => c.id === value) ?? null;

  React.useEffect(() => {
    let m = true;
    listarCompetenciasEmpresa()
      .then((list) => m && setItems(list))
      .catch(console.error);
    return () => {
      m = false;
    };
  }, [evaluacionId]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={disabled}
        >
          {selected ? selected.nombre : "Selecciona una competencia (opcional)"}
          <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command>
          <CommandInput placeholder="Buscar competencia..." />
          <CommandEmpty>Sin resultados</CommandEmpty>
          <CommandGroup heading="Competencias">
            <CommandItem
              onSelect={() => {
                onChange(null);
                setOpen(false);
              }}
            >
              <Check
                className={cn(
                  "mr-2 h-4 w-4",
                  !value ? "opacity-100" : "opacity-0"
                )}
              />
              (Sin competencia)
            </CommandItem>
            {items.map((c) => (
              <CommandItem
                key={c.id}
                onSelect={() => {
                  onChange(c.id);
                  setOpen(false);
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value === c.id ? "opacity-100" : "opacity-0"
                  )}
                />
                {c.nombre}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
