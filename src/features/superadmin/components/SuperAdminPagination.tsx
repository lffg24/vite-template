// src/features/superadmin/components/SuperAdminPagination.tsx
type Props = { page: number; pageSize: number; total: number; onPageChange: (page: number) => void; onPageSizeChange?: (size: number) => void };
export default function SuperAdminPagination({ page, pageSize, total, onPageChange, onPageSizeChange }: Props) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);
  return (
    <div className="flex flex-col gap-3 border-t border-rel-border px-5 py-4 text-sm text-rel-muted md:flex-row md:items-center md:justify-between">
      <span>Mostrando <b>{from}</b> a <b>{to}</b> de <b>{total}</b> registros</span>
      <div className="flex items-center gap-2">
        {onPageSizeChange && <select aria-label="Registros por página" className="h-10 rounded-rel-control border border-rel-border bg-rel-surface px-3 font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rel-primary" value={pageSize} onChange={(e) => onPageSizeChange(Number(e.target.value))}><option value={10}>10</option><option value={20}>20</option><option value={50}>50</option><option value={100}>100</option></select>}
        <button className="rounded-rel-control border border-rel-border px-3 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rel-primary disabled:opacity-40" disabled={page <= 1} onClick={() => onPageChange(1)}>Primera</button>
        <button className="rounded-rel-control border border-rel-border px-3 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rel-primary disabled:opacity-40" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>Anterior</button>
        <span aria-current="page" className="rounded-rel-control bg-rel-primary px-4 py-2 font-bold text-rel-primary-foreground">{page}</span>
        <button className="rounded-rel-control border border-rel-border px-3 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rel-primary disabled:opacity-40" disabled={page >= pages} onClick={() => onPageChange(page + 1)}>Siguiente</button>
        <button className="rounded-rel-control border border-rel-border px-3 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rel-primary disabled:opacity-40" disabled={page >= pages} onClick={() => onPageChange(pages)}>Última</button>
      </div>
    </div>
  );
}
