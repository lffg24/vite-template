import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

type StandardPaginationProps = {
  page: number;
  pageSize: number;
  total: number;
  pageSizeOptions?: number[];
  itemLabel?: string;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  className?: string;
};

export function StandardPagination({
  page,
  pageSize,
  total,
  pageSizeOptions = [10, 25, 50, 100],
  itemLabel = "registros",
  onPageChange,
  onPageSizeChange,
  className,
}: StandardPaginationProps) {
  const safeTotal = Math.max(0, Number(total || 0));
  const safePageSize = Math.max(1, Number(pageSize || 10));
  const totalPages = Math.max(1, Math.ceil(safeTotal / safePageSize));
  const currentPage = Math.min(Math.max(1, Number(page || 1)), totalPages);
  const from = safeTotal === 0 ? 0 : (currentPage - 1) * safePageSize + 1;
  const to = Math.min(safeTotal, currentPage * safePageSize);
  const go = (next: number) => onPageChange(Math.min(Math.max(1, next), totalPages));

  return (
    <div className={cn("flex flex-col gap-3 border-t border-border/70 bg-surface px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between", className)}>
      <div className="text-muted-foreground">
        Mostrando <strong>{from}</strong> a <strong>{to}</strong> de <strong>{safeTotal}</strong> {itemLabel}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {onPageSizeChange && (
          <label className="mr-2 flex items-center gap-2 text-xs font-bold text-muted-foreground">
            Filas
            <select
              value={safePageSize}
              onChange={(event) => onPageSizeChange(Number(event.target.value))}
              className="h-9 rounded-xl border border-input bg-surface px-3 text-sm font-bold text-foreground outline-none transition focus:border-input-focus focus:ring-2 focus:ring-input-focus/20"
            >
              {pageSizeOptions.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </label>
        )}
        <button type="button" onClick={() => go(1)} disabled={currentPage <= 1} className="rounded-xl border border-border px-3 py-2 font-bold text-foreground-soft transition hover:bg-surface-subtle disabled:cursor-not-allowed disabled:opacity-40">Primera</button>
        <button type="button" onClick={() => go(currentPage - 1)} disabled={currentPage <= 1} className="inline-flex items-center gap-1 rounded-xl border border-border px-3 py-2 font-bold text-foreground-soft transition hover:bg-surface-subtle disabled:cursor-not-allowed disabled:opacity-40"><ChevronLeft className="h-4 w-4" />Anterior</button>
        <span className="rounded-xl bg-primary px-4 py-2 font-black text-primary-foreground shadow-card">{currentPage}</span>
        <button type="button" onClick={() => go(currentPage + 1)} disabled={currentPage >= totalPages} className="inline-flex items-center gap-1 rounded-xl border border-border px-3 py-2 font-bold text-foreground-soft transition hover:bg-surface-subtle disabled:cursor-not-allowed disabled:opacity-40">Siguiente<ChevronRight className="h-4 w-4" /></button>
        <button type="button" onClick={() => go(totalPages)} disabled={currentPage >= totalPages} className="rounded-xl border border-border px-3 py-2 font-bold text-foreground-soft transition hover:bg-surface-subtle disabled:cursor-not-allowed disabled:opacity-40">Última</button>
      </div>
    </div>
  );
}
