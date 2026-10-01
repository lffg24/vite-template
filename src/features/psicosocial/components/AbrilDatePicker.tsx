import { useId, useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

type Props = {
  value?: string;
  onChange: (value: string) => void;
  label?: string;
  error?: string;
  id?: string;
  min?: string;
  max?: string;
  required?: boolean;
  disabled?: boolean;
  describedBy?: string;
};

const months = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
const week = ["LU", "MA", "MI", "JU", "VI", "SA", "DO"];

function toISO(date: Date) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function fromISO(value?: string) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day, 12);
  return Number.isNaN(date.getTime()) ? null : date;
}

function display(value?: string) {
  if (!value) return "Seleccionar fecha";
  const [yyyy, mm, dd] = value.split("-");
  return yyyy && mm && dd ? `${dd}/${mm}/${yyyy}` : value;
}

export default function AbrilDatePicker({
  value,
  onChange,
  label = "Fecha",
  error,
  id,
  min = "1900-01-01",
  max,
  required = false,
  disabled = false,
  describedBy,
}: Props) {
  const selected = fromISO(value);
  const maxDate = fromISO(max);
  const minDate = fromISO(min) ?? new Date(1900, 0, 1, 12);
  const initial = selected ?? maxDate ?? new Date();
  const [open, setOpen] = useState(false);
  const [view, setView] = useState(new Date(initial.getFullYear(), initial.getMonth(), 1));
  const generatedId = useId();
  const triggerId = id ?? `abril-date-picker-${generatedId.replace(/:/g, "")}`;

  const years = useMemo(() => {
    const first = minDate.getFullYear();
    const last = (maxDate ?? new Date(first + 130, 11, 31)).getFullYear();
    return Array.from({ length: Math.max(last - first + 1, 1) }, (_, index) => last - index);
  }, [maxDate, minDate]);

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

  const selectDate = (date: Date) => {
    onChange(toISO(date));
    setOpen(false);
  };

  const isOutsideRange = (date: Date) => date < minDate || Boolean(maxDate && date > maxDate);

  return (
    <div className="space-y-2">
      <Label htmlFor={triggerId} className="font-bold">
        {label}{required ? <span className="ml-1 text-primary" aria-hidden="true">*</span> : null}
      </Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            id={triggerId}
            type="button"
            disabled={disabled}
            aria-label={label}
            aria-invalid={Boolean(error)}
            aria-describedby={describedBy}
            className={cn(
              "flex min-h-12 w-full items-center justify-between gap-3 rounded-xl border border-input bg-surface px-4 py-3 text-left text-sm shadow-sm outline-none transition focus-visible:border-input-focus focus-visible:ring-4 focus-visible:ring-input-focus/20 disabled:cursor-not-allowed disabled:bg-muted/60 disabled:text-muted-foreground",
              error && "border-destructive",
            )}
          >
            <span className={value ? "font-semibold text-foreground" : "text-muted-foreground"}>{display(value)}</span>
            <CalendarDays className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
          </button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          sideOffset={8}
          collisionPadding={16}
          onOpenAutoFocus={(event) => event.preventDefault()}
          className="w-[min(24rem,calc(100vw-2rem))] rounded-3xl border-border bg-surface p-4 shadow-floating sm:p-5"
        >
          <div className="grid grid-cols-[2.5rem_minmax(0,1fr)_2.5rem] items-center gap-2">
            <Button type="button" variant="outline" size="icon" aria-label="Mes anterior" onClick={() => setView(new Date(view.getFullYear(), view.getMonth() - 1, 1))}>
              <ChevronLeft aria-hidden="true" />
            </Button>
            <div className="grid grid-cols-[minmax(0,1fr)_5.5rem] gap-2">
              <Select value={String(view.getMonth())} onValueChange={(month) => setView(new Date(view.getFullYear(), Number(month), 1))}>
                <SelectTrigger aria-label="Mes" className="h-10 rounded-xl capitalize"><SelectValue /></SelectTrigger>
                <SelectContent className="max-h-72">
                  {months.map((month, index) => <SelectItem key={month} value={String(index)} className="capitalize">{month}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={String(view.getFullYear())} onValueChange={(year) => setView(new Date(Number(year), view.getMonth(), 1))}>
                <SelectTrigger aria-label="Año" className="h-10 rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent className="max-h-72">
                  {years.map((year) => <SelectItem key={year} value={String(year)}>{year}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Button type="button" variant="outline" size="icon" aria-label="Mes siguiente" onClick={() => setView(new Date(view.getFullYear(), view.getMonth() + 1, 1))}>
              <ChevronRight aria-hidden="true" />
            </Button>
          </div>

          <div className="mt-4 grid grid-cols-7 gap-1 text-center text-[0.7rem] font-black text-muted-foreground" aria-hidden="true">
            {week.map((day) => <span key={day} className="py-1">{day}</span>)}
          </div>
          <div className="mt-1 grid grid-cols-7 gap-1" role="grid" aria-label={`${months[view.getMonth()]} de ${view.getFullYear()}`}>
            {days.map((day) => {
              const iso = toISO(day);
              const sameMonth = day.getMonth() === view.getMonth();
              const active = value === iso;
              const today = toISO(new Date()) === iso;
              const unavailable = isOutsideRange(day);
              return (
                <button
                  type="button"
                  role="gridcell"
                  key={iso}
                  disabled={unavailable}
                  aria-label={new Intl.DateTimeFormat("es-CO", { dateStyle: "long" }).format(day)}
                  aria-selected={active}
                  onClick={() => selectDate(day)}
                  className={cn(
                    "grid h-10 place-items-center rounded-xl text-sm font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    active && "bg-primary text-primary-foreground shadow-sm",
                    !active && today && "bg-accent text-accent-foreground",
                    !active && !today && sameMonth && "text-foreground hover:bg-muted",
                    !active && !sameMonth && "text-muted-foreground/45 hover:bg-muted/50",
                    unavailable && "cursor-not-allowed opacity-25 hover:bg-transparent",
                  )}
                >
                  {day.getDate()}
                </button>
              );
            })}
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
            <Button type="button" variant="ghost" size="sm" onClick={() => { onChange(""); setOpen(false); }}>Borrar</Button>
            {maxDate ? <p className="text-xs font-semibold text-muted-foreground">Hasta {display(max)}</p> : (
              <Button type="button" variant="ghost" size="sm" onClick={() => selectDate(new Date())}>Hoy</Button>
            )}
          </div>
        </PopoverContent>
      </Popover>
      {error ? <p id={describedBy} className="text-sm font-semibold text-destructive">{error}</p> : null}
    </div>
  );
}
