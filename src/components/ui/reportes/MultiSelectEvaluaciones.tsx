import { useEffect, useMemo, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { X, ChevronsUpDown, Loader2 } from "lucide-react";
import { EvalItem, listEvaluaciones } from "@/services/reportes";

type Props = {
  value: number[];
  onChange: (ids: number[]) => void;
  placeholder?: string;
};

export default function MultiSelectEvaluaciones({
  value,
  onChange,
  placeholder,
}: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<EvalItem[]>([]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const list = await listEvaluaciones();
        setItems(list);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const byId = useMemo(() => new Map(items.map((i) => [i.id, i])), [items]);
  const selected = value
    .map((id) => byId.get(id))
    .filter(Boolean) as EvalItem[];

  const toggle = (id: number) => {
    if (value.includes(id)) onChange(value.filter((v) => v !== id));
    else onChange([...value, id]);
  };

  const clear = (id?: number) => {
    if (id === undefined) onChange([]);
    else onChange(value.filter((v) => v !== id));
  };

  const triggerRef = useRef<HTMLButtonElement>(null);
  return (
    <div className="w-full">
      <div className="flex flex-wrap gap-2 mb-2">
        {selected.map((s) => (
          <Badge
            key={s.id}
            variant="secondary"
            className="flex items-center gap-1"
          >
            {s.nombre ?? `#${s.id}`}
            <button
              className="ml-1 hover:opacity-80"
              onClick={() => clear(s.id)}
              title="Quitar"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
        {selected.length > 0 && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => clear()}
            className="h-7 px-2"
          >
            Limpiar
          </Button>
        )}
      </div>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            ref={triggerRef} // 👈
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            {selected.length > 0
              ? `${selected.length} evaluación(es) seleccionadas`
              : placeholder ?? "Selecciona evaluaciones..."}
            {loading ? (
              <Loader2 className="ml-2 h-4 w-4 animate-spin" />
            ) : (
              <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          sideOffset={4}
          // 👇 ancho calcado del trigger + alto máximo con scroll
          style={{ width: triggerRef.current?.offsetWidth ?? 480 }}
          className="p-0 max-h-[360px] overflow-y-auto"
        >
          <Command>
            <CommandInput placeholder="Buscar evaluación..." />
            <CommandList>
              <CommandEmpty>Sin resultados</CommandEmpty>
              <CommandGroup>
                {items.map((it) => {
                  const checked = value.includes(it.id);
                  return (
                    <CommandItem key={it.id} onSelect={() => toggle(it.id)}>
                      <Checkbox className="mr-2" checked={checked} />
                      <span className="truncate">
                        {it.nombre ?? `#${it.id}`}
                      </span>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
