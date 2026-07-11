import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

export type CatalogosSocio = {
  estado_civil: string[];
  nivel_estudios: string[];
  tipo_vivienda: string[];
  tipo_cargo: string[];
  tipo_contrato: string[];
  tipo_salario: string[];
};

export const FALLBACK_SOCIO_CATALOGOS: CatalogosSocio = {
  estado_civil: ["Soltero(a)", "Casado(a)", "Unión libre", "Separado(a)", "Divorciado(a)", "Viudo(a)", "Sacerdote / Monja"],
  nivel_estudios: [
    "Ninguno", "Primaria incompleta", "Primaria completa", "Bachillerato incompleto", "Bachillerato completo",
    "Técnico / tecnológico incompleto", "Técnico / tecnológico completo", "Profesional incompleto", "Profesional completo",
    "Carrera militar / policía", "Post-grado incompleto", "Post-grado completo",
  ],
  tipo_vivienda: ["Propia", "En arriendo", "Familiar"],
  tipo_cargo: [
    "Jefatura - tiene personal a cargo",
    "Profesional, analista, técnico, tecnólogo",
    "Auxiliar, asistente administrativo, asistente técnico",
    "Operario, operador, ayudante, servicios generales",
  ],
  tipo_contrato: ["Temporal de menos de 1 año", "Temporal de 1 año o más", "Término indefinido", "Cooperado (cooperativa)", "Prestación de servicios", "No sé"],
  tipo_salario: ["Fijo (diario, semanal, quincenal o mensual)", "Una parte fija y otra variable", "Todo variable (a destajo, por producción, por comisión)"],
};

export const SOCIO_SEXO_OPTIONS = ["Masculino", "Femenino"];
export const SOCIO_ESTRATO_OPTIONS = ["1", "2", "3", "4", "5", "6", "Finca", "No sé"];
export const SOCIO_CURRENT_YEAR = new Date().getFullYear();

function optionKey(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");
}

export function normalizeSocioOptions(fallback: string[], remote?: Array<{ nombre?: string }>) {
  const seen = new Set<string>();
  const values = [...fallback, ...(remote || []).map((item) => String(item.nombre || "").trim())].filter(Boolean);
  return values.filter((value) => {
    const key = optionKey(value);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function fieldBase(disabled = false) {
  return `w-full rounded-2xl border border-slate-200 px-4 py-3 font-normal outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-100 ${disabled ? "cursor-not-allowed bg-slate-100 text-slate-500" : "bg-white"}`;
}

export function SocioTextField({ label, value, onChange, disabled = false }: { label: string; value: string; onChange: (v: string) => void; disabled?: boolean }) {
  return <label className="space-y-1 text-sm font-bold text-slate-700">{label}<input disabled={disabled} value={value} onChange={(e) => onChange(e.target.value)} className={fieldBase(disabled)} /></label>;
}

export function SocioNumberField({ label, value, min, max, onChange, disabled = false }: { label: string; value: number | string; min?: number; max?: number; onChange: (v: number | null) => void; disabled?: boolean }) {
  return <label className="space-y-1 text-sm font-bold text-slate-700">{label}<input disabled={disabled} type="number" min={min} max={max} value={value} onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))} className={fieldBase(disabled)} /></label>;
}

export function SocioReadOnlyField({ label, value }: { label: string; value: string }) {
  return <label className="space-y-1 text-sm font-bold text-slate-700">{label}<input value={value} readOnly className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-normal text-slate-500 outline-none" /></label>;
}

export function SocioSelectField({ label, value, options, onChange, disabled = false }: { label: string; value: string; options: string[]; onChange: (v: string) => void; disabled?: boolean }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const display = value || "Selecciona una opción";

  useEffect(() => {
    if (!open) return;
    const closeOnOutside = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("mousedown", closeOnOutside);
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      window.removeEventListener("mousedown", closeOnOutside);
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative space-y-1 text-sm font-bold text-slate-700">
      <span>{label}</span>
      <button
        type="button"
        disabled={disabled}
        onClick={() => { if (!disabled) setOpen((v) => !v); }}
        className={`${fieldBase(disabled)} flex min-h-[50px] items-center justify-between gap-3 text-left ${value ? "text-slate-900" : "text-slate-400"}`}
      >
        <span className="truncate">{display}</span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-slate-400 transition ${open ? "rotate-180" : ""}`} />
      </button>
      {open && !disabled && (
        <div className="absolute z-[80] mt-2 max-h-72 w-full overflow-auto rounded-2xl border border-slate-200 bg-white p-1.5 shadow-2xl shadow-slate-200/70">
          <button
            type="button"
            onClick={() => { onChange(""); setOpen(false); }}
            className={`block w-full rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition ${!value ? "bg-violet-600 text-white" : "text-slate-500 hover:bg-slate-50"}`}
          >
            Selecciona una opción
          </button>
          {options.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => { onChange(opt); setOpen(false); }}
              className={`block w-full rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition ${value === opt ? "bg-violet-600 text-white" : "text-slate-700 hover:bg-violet-50 hover:text-violet-800"}`}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function SocioMunicipioField({ label, query, selectedValue, setQuery, options, onSelect, disabled = false }: { label: string; query: string; selectedValue?: string; setQuery: (v: string) => void; options: Array<{ municipio: string; departamento?: string | null }>; onSelect: (item: { municipio: string; departamento?: string | null }) => void; disabled?: boolean }) {
  const [open, setOpen] = useState(false);
  const [touched, setTouched] = useState(false);
  const normalizedQuery = query.trim().toLowerCase();
  const normalizedSelected = String(selectedValue || "").trim().toLowerCase();
  const showPanel = !disabled && open && query.trim().length >= 2 && normalizedQuery !== normalizedSelected;
  return (
    <label className="relative space-y-1 text-sm font-bold text-slate-700">
      {label}
      <input
        disabled={disabled}
        value={query}
        onFocus={() => { if (!disabled) setOpen(true); }}
        onBlur={() => window.setTimeout(() => setOpen(false), 120)}
        onChange={(e) => { if (disabled) return; setTouched(true); setOpen(true); setQuery(e.target.value); }}
        onKeyDown={(e) => { if (e.key === "Escape") setOpen(false); }}
        placeholder="Escribe mínimo 2 letras..."
        className={fieldBase(disabled)}
        autoComplete="off"
      />
      {showPanel && (
        <div className="absolute z-[80] mt-2 max-h-64 w-full overflow-auto rounded-2xl border border-slate-200 bg-white p-1.5 shadow-2xl shadow-slate-200/70">
          {options.length > 0 ? (
            options.map((item) => (
              <button
                key={`${item.municipio}-${item.departamento}`}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => { onSelect(item); setOpen(false); setTouched(false); }}
                className="block w-full rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-slate-700 transition hover:bg-violet-50 hover:text-violet-800"
              >
                {item.municipio} <span className="font-normal text-slate-500">{item.departamento ? `- ${item.departamento}` : ""}</span>
              </button>
            ))
          ) : touched ? (
            <div className="rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-500">
              Sin coincidencias. Verifica que el catálogo de municipios esté cargado o intenta con tilde/sin tilde.
            </div>
          ) : null}
        </div>
      )}
    </label>
  );
}
