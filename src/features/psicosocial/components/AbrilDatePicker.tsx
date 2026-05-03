import { useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";

type Props = {
  value?: string;
  onChange: (value: string) => void;
  label?: string;
  error?: string;
};

const months = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
const week = ["LU", "MA", "MI", "JU", "VI", "SA", "DO"];

function toISO(date: Date) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function display(value?: string) {
  if (!value) return "Seleccionar fecha";
  const [yyyy, mm, dd] = value.split("-");
  return yyyy && mm && dd ? `${dd}/${mm}/${yyyy}` : value;
}

export default function AbrilDatePicker({ value, onChange, label = "Fecha", error }: Props) {
  const initial = value ? new Date(`${value}T12:00:00`) : new Date();
  const [open, setOpen] = useState(false);
  const [view, setView] = useState(new Date(initial.getFullYear(), initial.getMonth(), 1));

  const days = useMemo(() => {
    const first = new Date(view.getFullYear(), view.getMonth(), 1);
    const startOffset = (first.getDay() + 6) % 7;
    const start = new Date(view.getFullYear(), view.getMonth(), 1 - startOffset);
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  }, [view]);

  return (
    <div className="relative space-y-1 text-sm font-bold text-slate-700">
      <span>{label}</span>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`mt-1 flex w-full items-center justify-between rounded-2xl border bg-white px-4 py-3 text-left font-normal outline-none transition hover:border-violet-300 ${error ? "border-red-300" : "border-slate-200"}`}
      >
        <span className={value ? "text-slate-800" : "text-slate-400"}>{display(value)}</span>
        <CalendarDays className="h-5 w-5 text-violet-700" />
      </button>
      {error && <span className="block text-xs font-semibold text-red-600">{error}</span>}
      {open && (
        <div className="absolute z-[70] mt-2 w-full rounded-3xl border border-slate-200 bg-white p-4 shadow-2xl">
          <div className="mb-4 flex items-center justify-between">
            <button type="button" onClick={() => setView(new Date(view.getFullYear(), view.getMonth() - 1, 1))} className="rounded-xl border p-2 hover:bg-slate-50"><ChevronLeft className="h-4 w-4" /></button>
            <div className="text-center font-black capitalize text-slate-950">{months[view.getMonth()]} de {view.getFullYear()}</div>
            <button type="button" onClick={() => setView(new Date(view.getFullYear(), view.getMonth() + 1, 1))} className="rounded-xl border p-2 hover:bg-slate-50"><ChevronRight className="h-4 w-4" /></button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-black text-slate-400">
            {week.map((d) => <div key={d} className="py-1">{d}</div>)}
          </div>
          <div className="mt-1 grid grid-cols-7 gap-1">
            {days.map((d) => {
              const iso = toISO(d);
              const sameMonth = d.getMonth() === view.getMonth();
              const active = value === iso;
              const today = toISO(new Date()) === iso;
              return (
                <button
                  type="button"
                  key={iso}
                  onClick={() => { onChange(iso); setOpen(false); }}
                  className={`h-10 rounded-xl text-sm font-bold transition ${active ? "bg-violet-700 text-white shadow-sm" : today ? "bg-violet-50 text-violet-700" : sameMonth ? "text-slate-700 hover:bg-slate-100" : "text-slate-300 hover:bg-slate-50"}`}
                >
                  {d.getDate()}
                </button>
              );
            })}
          </div>
          <div className="mt-4 flex justify-between border-t pt-3 text-xs font-bold">
            <button type="button" onClick={() => onChange("")} className="rounded-xl px-3 py-2 text-slate-500 hover:bg-slate-50">Borrar</button>
            <button type="button" onClick={() => { const today = new Date(); onChange(toISO(today)); setView(new Date(today.getFullYear(), today.getMonth(), 1)); setOpen(false); }} className="rounded-xl px-3 py-2 text-violet-700 hover:bg-violet-50">Hoy</button>
          </div>
        </div>
      )}
    </div>
  );
}
