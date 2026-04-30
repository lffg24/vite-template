export function InfoField({ label, value }: { label: string; value: unknown }) {
  const text = value === null || value === undefined || value === '' ? 'Sin dato' : String(value);
  return (
    <div className="flex items-start justify-between gap-4 border-b border-slate-100 py-2.5 last:border-b-0">
      <span className="text-sm text-slate-500">{label}</span>
      <span className="max-w-[58%] text-right text-sm font-medium text-slate-800 break-words">{text}</span>
    </div>
  );
}
