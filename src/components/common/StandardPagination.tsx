import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
          <div className="mr-2 flex items-center gap-2 text-xs font-bold text-muted-foreground">
            <span>Filas</span>
            <Select value={String(safePageSize)} onValueChange={(value) => onPageSizeChange(Number(value))}>
              <SelectTrigger aria-label="Filas por página" className="h-9 w-20 font-bold">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {pageSizeOptions.map((option) => <SelectItem key={option} value={String(option)}>{option}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        )}
        {/* `Button` de la casa, no un cuarto dialecto de boton escrito a mano.
            Estos cinco controles eran `<button>` crudos con `rounded-xl`,
            `font-bold` y `transition` sin curva: aparecian en todas las tablas
            del producto y respondian al puntero distinto de cualquier otro
            boton. El estado desactivado tambien era propio (`opacity-40`
            frente al 50 % del sistema). */}
        <Button variant="outline" size="sm" onClick={() => go(1)} disabled={currentPage <= 1}>
          Primera
        </Button>
        <Button variant="outline" size="sm" onClick={() => go(currentPage - 1)} disabled={currentPage <= 1}>
          <ChevronLeft aria-hidden="true" />
          Anterior
        </Button>
        {/* La pagina actual es un dato, no un control: no se puede pulsar y por
            eso no es un boton. `aria-current` es lo que lo anuncia. */}
        <span
          aria-current="page"
          className="inline-flex h-9 min-w-9 items-center justify-center rounded-lg bg-primary px-3 font-heading text-sm font-bold tabular-nums text-primary-foreground shadow-card"
        >
          {currentPage}
        </span>
        <Button variant="outline" size="sm" onClick={() => go(currentPage + 1)} disabled={currentPage >= totalPages}>
          Siguiente
          <ChevronRight aria-hidden="true" />
        </Button>
        <Button variant="outline" size="sm" onClick={() => go(totalPages)} disabled={currentPage >= totalPages}>
          Última
        </Button>
      </div>
    </div>
  );
}
