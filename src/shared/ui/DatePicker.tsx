import { useId, useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

const MONTHS = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];
const WEEK = ["LU", "MA", "MI", "JU", "VI", "SA", "DO"];

export function isoLocal(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function parseIso(value?: string) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day, 12);
  return Number.isNaN(date.getTime()) ? null : date;
}

function display(value?: string) {
  const date = parseIso(value);
  return date
    ? new Intl.DateTimeFormat("es-CO", { day: "2-digit", month: "long", year: "numeric" }).format(date)
    : "Seleccionar fecha";
}

export type DatePickerProps = {
  id?: string;
  value?: string;
  onChange: (value: string) => void;
  label?: string;
  hideLabel?: boolean;
  error?: string;
  min?: string;
  max?: string;
  disabled?: boolean;
  required?: boolean;
  describedBy?: string;
};

/** Selector común de fecha para módulos actuales y futuros de ABRIL360. */
export function DatePicker({
  id,
  value,
  onChange,
  label = "Fecha",
  hideLabel = false,
  error,
  min,
  max,
  disabled = false,
  required = false,
  describedBy,
}: DatePickerProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const initial = parseIso(value) ?? parseIso(min) ?? new Date();
  const [open, setOpen] = useState(false);
  const [view, setView] = useState(new Date(initial.getFullYear(), initial.getMonth(), 1));

  const days = useMemo(() => {
    const first = new Date(view.getFullYear(), view.getMonth(), 1);
    const startOffset = (first.getDay() + 6) % 7;
    const start = new Date(view.getFullYear(), view.getMonth(), 1 - startOffset, 12);
    return Array.from({ length: 42 }, (_, index) => {
      const day = new Date(start);
      day.setDate(start.getDate() + index);
      return day;
    });
  }, [view]);

  const minYear = parseIso(min)?.getFullYear() ?? new Date().getFullYear() - 10;
  const maxYear = parseIso(max)?.getFullYear() ?? new Date().getFullYear() + 20;
  const years = Array.from({ length: Math.max(1, maxYear - minYear + 1) }, (_, index) => minYear + index);

  function unavailable(iso: string) {
    return Boolean((min && iso < min) || (max && iso > max));
  }

  function moveMonth(offset: number) {
    const next = new Date(view.getFullYear(), view.getMonth() + offset, 1);
    if (next.getFullYear() < minYear || next.getFullYear() > maxYear) return;
    setView(next);
  }

  return (
    <div className="space-y-1.5">
      {!hideLabel ? (
        <Label htmlFor={inputId} className="text-rel-dark">
          {label}
          {required ? <span className="ml-1 text-rel-primary" aria-hidden="true">*</span> : null}
        </Label>
      ) : null}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            id={inputId}
            type="button"
            disabled={disabled}
            aria-required={required || undefined}
            aria-invalid={Boolean(error)}
            aria-describedby={describedBy ?? (error ? `${inputId}-error` : undefined)}
            className={cn(
              "flex h-10 w-full items-center justify-between rounded-rel-control border bg-rel-surface px-3 text-left text-sm outline-none transition",
              "focus-visible:ring-2 focus-visible:ring-rel-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
              error ? "border-rel-danger" : "border-rel-border hover:border-rel-primary/40"
            )}
          >
            <span className={value ? "text-rel-dark" : "text-rel-muted"}>{display(value)}</span>
            <CalendarDays className="h-4 w-4 text-rel-primary" aria-hidden="true" />
          </button>
        </PopoverTrigger>
        <PopoverContent align="start" className="rel-scope w-[min(22rem,calc(100vw-2rem))] rounded-rel-panel border-rel-border bg-rel-surface p-4 font-rel-body shadow-floating">
          <div className="mb-4 grid grid-cols-[auto_1fr_auto] items-center gap-2">
            <Button type="button" variant="relGhost" size="icon" onClick={() => moveMonth(-1)} aria-label="Mes anterior">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="grid grid-cols-[1fr_6rem] gap-2">
              <Select value={String(view.getMonth())} onValueChange={(month) => setView(new Date(view.getFullYear(), Number(month), 1))}>
                <SelectTrigger aria-label="Mes" className="capitalize"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {MONTHS.map((month, index) => <SelectItem key={month} value={String(index)} className="capitalize">{month}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={String(view.getFullYear())} onValueChange={(year) => setView(new Date(Number(year), view.getMonth(), 1))}>
                <SelectTrigger aria-label="Año"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {years.map((year) => <SelectItem key={year} value={String(year)}>{year}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Button type="button" variant="relGhost" size="icon" onClick={() => moveMonth(1)} aria-label="Mes siguiente">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-bold text-rel-muted">
            {WEEK.map((day) => <span key={day} className="py-1">{day}</span>)}
          </div>
          <div
            className="mt-1 grid grid-cols-7 gap-1"
            role="grid"
            aria-label={`${MONTHS[view.getMonth()]} de ${view.getFullYear()}`}
          >
            {days.map((day) => {
              const iso = isoLocal(day);
              const active = value === iso;
              const today = isoLocal(new Date()) === iso;
              const outside = day.getMonth() !== view.getMonth();
              const blocked = unavailable(iso);
              return (
                <button
                  type="button"
                  role="gridcell"
                  key={iso}
                  disabled={blocked}
                  aria-label={new Intl.DateTimeFormat("es-CO", { dateStyle: "long" }).format(day)}
                  aria-current={today ? "date" : undefined}
                  aria-selected={active}
                  onClick={() => { onChange(iso); setOpen(false); }}
                  className={cn(
                    "h-9 rounded-rel-control text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rel-primary",
                    active && "bg-rel-primary text-rel-primary-foreground",
                    !active && today && "bg-rel-info-subtle text-rel-info",
                    !active && !today && !outside && "text-rel-dark hover:bg-rel-surface-subtle",
                    outside && !active && "text-rel-muted/60 hover:bg-rel-surface-subtle",
                    blocked && "cursor-not-allowed text-rel-muted/30 line-through hover:bg-transparent"
                  )}
                >
                  {day.getDate()}
                </button>
              );
            })}
          </div>
          <div className="mt-4 flex justify-between border-t border-rel-border pt-3">
            <Button type="button" variant="relGhost" size="sm" onClick={() => { onChange(""); setOpen(false); }}>Borrar</Button>
            <Button
              type="button"
              variant="relGhost"
              size="sm"
              disabled={unavailable(isoLocal(new Date()))}
              onClick={() => {
                const today = new Date();
                onChange(isoLocal(today));
                setView(new Date(today.getFullYear(), today.getMonth(), 1));
                setOpen(false);
              }}
            >
              Hoy
            </Button>
          </div>
        </PopoverContent>
      </Popover>
      {error ? <p id={`${inputId}-error`} className="text-xs font-semibold text-rel-danger">{error}</p> : null}
    </div>
  );
}

export default DatePicker;
