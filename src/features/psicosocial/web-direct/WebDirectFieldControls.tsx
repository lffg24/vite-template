import { useEffect, useId, useRef, useState } from "react";
import { AlertCircle, Check, ChevronDown, Loader2, MapPin, Search } from "lucide-react";

import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

import type { WebDirectDemographicOption, WebDirectMunicipality } from "./types";

type SelectFieldProps = {
  id: string;
  label: string;
  value: string;
  options: WebDirectDemographicOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  error?: string;
};

export function WebDirectSelectField({ id, label, value, options, onChange, placeholder, required, error }: SelectFieldProps) {
  const errorId = `${id}-error`;
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="font-bold">
        {label}{required ? <span className="ml-1 text-primary" aria-hidden="true">*</span> : null}
      </Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id={id} aria-label={label} aria-invalid={Boolean(error)} aria-describedby={error ? errorId : undefined} className={cn("h-12 min-w-0 max-w-full overflow-hidden rounded-xl [&>span]:min-w-0 [&>span]:truncate", error && "border-destructive")}>
          <SelectValue placeholder={placeholder ?? "Selecciona una opción"} />
        </SelectTrigger>
        <SelectContent className="max-h-[min(22rem,var(--radix-select-content-available-height))] max-w-[calc(100vw-2rem)]">
          {options.map((option) => <SelectItem key={option.value} value={option.value} className="whitespace-normal break-words leading-5">{option.label}</SelectItem>)}
        </SelectContent>
      </Select>
      {error ? <FieldError id={errorId}>{error}</FieldError> : null}
    </div>
  );
}

type MunicipalityFieldProps = {
  id: string;
  label: string;
  value: string;
  required?: boolean;
  error?: string;
  onSearch: (query: string) => Promise<WebDirectMunicipality[]>;
  onSelect: (item: WebDirectMunicipality) => void;
};

export function WebDirectMunicipalityField({ id, label, value, required, error, onSearch, onSelect }: MunicipalityFieldProps) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [query, setQuery] = useState(value);
  const [options, setOptions] = useState<WebDirectMunicipality[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => setQuery(value), [value]);
  useEffect(() => {
    if (!open || query.trim().length < 2 || query.trim().toLocaleLowerCase("es") === value.trim().toLocaleLowerCase("es")) {
      setOptions([]);
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);
    const timer = window.setTimeout(() => {
      onSearch(query.trim())
        .then((items) => { if (active) setOptions(items); })
        .catch(() => { if (active) setOptions([]); })
        .finally(() => { if (active) setLoading(false); });
    }, 250);
    return () => { active = false; window.clearTimeout(timer); };
  }, [onSearch, open, query, value]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
        setQuery(value);
      }
    };
    window.addEventListener("pointerdown", onPointerDown);
    return () => window.removeEventListener("pointerdown", onPointerDown);
  }, [open, value]);

  const errorId = `${id}-error`;
  return (
    <div ref={rootRef} className="relative space-y-2">
      <Label htmlFor={id} className="font-bold">
        {label}{required ? <span className="ml-1 text-primary" aria-hidden="true">*</span> : null}
      </Label>
      <div className="relative">
        <MapPin className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <input
          id={id}
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          autoComplete="off"
          value={query}
          onFocus={() => setOpen(true)}
          onChange={(event) => { setQuery(event.target.value); setOpen(true); }}
          onKeyDown={(event) => { if (event.key === "Escape") { setOpen(false); setQuery(value); } }}
          placeholder="Busca municipio o departamento"
          className={cn(
            "h-12 w-full rounded-xl border border-input bg-surface py-2 pl-10 pr-10 text-sm text-foreground shadow-sm outline-none transition placeholder:text-muted-foreground focus:border-input-focus focus:ring-4 focus:ring-input-focus/20",
            error && "border-destructive",
          )}
        />
        {loading ? <Loader2 className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-primary" aria-hidden="true" /> : (
          <Search className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        )}
      </div>
      {open && query.trim().length >= 2 && query.trim().toLocaleLowerCase("es") !== value.trim().toLocaleLowerCase("es") ? (
        <div id={listId} role="listbox" className="absolute z-50 mt-1 max-h-64 w-full overflow-y-auto rounded-2xl border border-border bg-popover p-1.5 shadow-floating">
          {options.length ? options.map((item) => (
            <button
              key={item.id}
              type="button"
              role="option"
              aria-selected={item.municipio === value}
              onClick={() => { onSelect(item); setQuery(item.municipio); setOpen(false); }}
              className="flex w-full items-center justify-between gap-3 rounded-xl px-3 py-3 text-left text-sm transition hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span><strong className="block text-foreground">{item.municipio}</strong><span className="text-xs text-muted-foreground">{item.departamento}</span></span>
              {item.municipio === value ? <Check className="h-4 w-4 text-primary" aria-hidden="true" /> : null}
            </button>
          )) : !loading ? <p className="px-3 py-4 text-sm text-muted-foreground">No encontramos coincidencias. Prueba con otro nombre.</p> : null}
        </div>
      ) : null}
      {error ? <FieldError id={errorId}>{error}</FieldError> : null}
    </div>
  );
}

export function FieldError({ id, children }: { id?: string; children: string }) {
  return (
    <p id={id} className="flex items-start gap-2 text-sm font-semibold leading-5 text-destructive">
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" /> {children}
    </p>
  );
}

export function WebDirectInlineAlert({ title, children }: { title: string; children: string }) {
  return (
    <div role="alert" className="flex gap-3 rounded-2xl border border-destructive/25 bg-destructive/5 p-4 text-sm text-foreground shadow-sm">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-destructive/10 text-destructive"><AlertCircle className="h-5 w-5" aria-hidden="true" /></span>
      <div><p className="font-heading font-black">{title}</p><p className="mt-1 leading-6 text-muted-foreground">{children}</p></div>
    </div>
  );
}
