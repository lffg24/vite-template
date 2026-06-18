// src/pages/superadmin/SuperAdminCreditosPage.tsx
import { type FormEvent, type ReactNode, useEffect, useMemo, useState } from "react";
import { Check, Loader2, Plus, Search, UserRound, WalletCards, X } from "lucide-react";

import { ToastCard, type ToastPayload } from "@/components/feedback/ToastCard";
import { StandardPagination } from "@/components/common/StandardPagination";
import {
  superadminService,
  type CreditAccount,
  type CreditMovement,
  type SuperPsicologo,
} from "@/features/superadmin/api/superadminService";
import SuperAdminPageHeader from "./SuperAdminPageHeader";

const defaultCreditReason = "Compra de créditos";

export default function SuperAdminCreditosPage() {
  const [items, setItems] = useState<CreditAccount[]>([]);
  const [movements, setMovements] = useState<CreditMovement[]>([]);
  const [psicologos, setPsicologos] = useState<SuperPsicologo[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [q, setQ] = useState("");
  const [psicologoQ, setPsicologoQ] = useState("");
  const [selected, setSelected] = useState<SuperPsicologo | null>(null);
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState(defaultCreditReason);
  const [assignOpen, setAssignOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastPayload | null>(null);

  const notify = (payload: Omit<ToastPayload, "id">) => {
    const id = Date.now();
    setToast({ id, ...payload });
    window.setTimeout(() => setToast((current) => (current?.id === id ? null : current)), 4200);
  };

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [accountsRes, movementsRes, psicologosRes] = await Promise.all([
        superadminService.creditAccounts({ q, page, page_size: pageSize }),
        superadminService.creditMovements({ page: 1, page_size: 8 }),
        superadminService.psicologos({ page: 1, page_size: 100 }),
      ]);
      setItems(accountsRes.items || []);
      setTotal(accountsRes.total || 0);
      setMovements(movementsRes.items || []);
      setPsicologos(psicologosRes.items || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No fue posible cargar créditos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(load, 250);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, page, pageSize]);

  useEffect(() => {
    setPage(1);
  }, [q, pageSize]);

  const filteredPsicologos = useMemo(() => {
    const term = psicologoQ.trim().toLowerCase();
    if (!term) return psicologos;
    return psicologos.filter((psicologo) =>
      `${psicologo.nombre || ""} ${psicologo.email || ""}`.toLowerCase().includes(term),
    );
  }, [psicologos, psicologoQ]);

  const totals = useMemo(() => {
    return items.reduce(
      (acc, item) => ({
        asignados: acc.asignados + Number(item.creditos_asignados || 0),
        disponibles: acc.disponibles + Number(item.saldo_actual || 0),
      }),
      { asignados: 0, disponibles: 0 },
    );
  }, [items]);

  const openAssign = (target?: SuperPsicologo) => {
    setSelected(target || null);
    setAmount("");
    setReason(defaultCreditReason);
    setPsicologoQ("");
    setAssignOpen(true);
  };

  const closeAssign = () => {
    if (saving) return;
    setAssignOpen(false);
    setSelected(null);
    setAmount("");
    setReason(defaultCreditReason);
  };

  const submitAssign = async (event: FormEvent) => {
    event.preventDefault();
    if (!selected) {
      notify({ type: "warning", title: "Selecciona un psicólogo", message: "Elige la cuenta que recibirá los créditos." });
      return;
    }
    const cantidad = Number(amount);
    if (!Number.isInteger(cantidad) || cantidad <= 0) {
      notify({ type: "warning", title: "Cantidad inválida", message: "Ingresa una cantidad entera mayor a cero." });
      return;
    }

    setSaving(true);
    try {
      const idempotencyKey =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `assign-${selected.id}-${Date.now()}`;
      const result = await superadminService.assignCredits({
        psicologo_usuario_id: selected.id,
        empresa_id: null,
        cantidad,
        descripcion: reason.trim() || defaultCreditReason,
        idempotency_key: idempotencyKey,
      });
      const saldoNuevo = Number(result?.saldo_nuevo ?? Number(selected.creditos_disponibles || 0) + cantidad);
      notify({
        type: "success",
        title: "Créditos asignados",
        message: `${selected.nombre} quedó con ${saldoNuevo.toLocaleString("es-CO")} créditos disponibles.`,
      });
      setAssignOpen(false);
      setSelected(null);
      setAmount("");
      await load();
    } catch (err) {
      notify({ type: "error", title: "No fue posible asignar créditos", message: err instanceof Error ? err.message : "Intenta nuevamente." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {toast && <ToastCard toast={toast} onClose={() => setToast(null)} />}
      <SuperAdminPageHeader
        title="Créditos"
        subtitle="Ledger formal: asignación, consumo y auditoría por psicólogo/empresa."
        action={
          <button
            type="button"
            onClick={() => openAssign()}
            className="inline-flex items-center gap-2 rounded-2xl bg-violet-600 px-5 py-3 font-black text-white shadow-sm transition hover:bg-violet-700"
          >
            <Plus className="h-5 w-5" />
            Asignar créditos
          </button>
        }
      />

      {error && <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">{error}</div>}

      <section className="grid gap-4 md:grid-cols-3">
        <Metric label="Cuentas visibles" value={total.toLocaleString("es-CO")} />
        <Metric label="Créditos asignados" value={totals.asignados.toLocaleString("es-CO")} />
        <Metric label="Saldo disponible" value={totals.disponibles.toLocaleString("es-CO")} tone="text-violet-700" />
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 p-5">
          <div className="relative min-w-[260px] flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={q}
              onChange={(event) => setQ(event.target.value)}
              className="h-12 w-full rounded-2xl border border-slate-200 pl-11 pr-4 text-sm outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
              placeholder="Buscar por psicólogo, correo o empresa..."
            />
          </div>
          <button type="button" onClick={load} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50">
            Actualizar
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-4">Cuenta</th>
                <th className="px-4 py-4">Empresa</th>
                <th className="px-4 py-4 text-center">Asignados</th>
                <th className="px-4 py-4 text-center">Saldo</th>
                <th className="px-4 py-4">Estado</th>
                <th className="px-4 py-4">Actualizado</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-slate-500">
                    Cargando créditos...
                  </td>
                </tr>
              )}
              {!loading && items.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-slate-500">
                    No hay cuentas de créditos para los filtros actuales.
                  </td>
                </tr>
              )}
              {!loading &&
                items.map((account) => (
                  <tr key={account.id} className="border-t border-slate-100">
                    <td className="px-5 py-4">
                      <div className="font-black text-slate-950">{account.psicologo_nombre || `Usuario ${account.psicologo_usuario_id}`}</div>
                      <div className="text-xs text-slate-500">{account.psicologo_email || "Sin correo"}</div>
                    </td>
                    <td className="px-4 py-4">{account.empresa_nombre || "Cuenta global"}</td>
                    <td className="px-4 py-4 text-center font-semibold text-slate-900">{Number(account.creditos_asignados || 0).toLocaleString("es-CO")}</td>
                    <td className="px-4 py-4 text-center font-black text-violet-700">{Number(account.saldo_actual || 0).toLocaleString("es-CO")}</td>
                    <td className="px-4 py-4">
                      <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">{account.estado}</span>
                    </td>
                    <td className="px-4 py-4 text-xs text-slate-500">{account.actualizado_en ? new Date(account.actualizado_en).toLocaleString("es-CO") : "-"}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        <StandardPagination
          page={page}
          pageSize={pageSize}
          total={total}
          itemLabel="cuentas"
          onPageChange={setPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setPage(1);
          }}
        />
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-black text-slate-950">Últimos movimientos</h2>
            <p className="text-sm text-slate-500">Asignaciones y consumos recientes del ledger.</p>
          </div>
          <WalletCards className="h-6 w-6 text-violet-700" />
        </div>
        <div className="divide-y divide-slate-100">
          {movements.length === 0 && <p className="py-4 text-sm text-slate-500">No hay movimientos recientes para mostrar.</p>}
          {movements.map((movement) => (
            <div key={movement.id} className="grid gap-2 py-3 text-sm md:grid-cols-[140px_1fr_120px_120px]">
              <span className="font-black text-slate-900">{movement.tipo}</span>
              <span className="text-slate-600">{movement.descripcion || "Movimiento de créditos"}</span>
              <span className="font-semibold text-slate-900">{Number(movement.cantidad || 0).toLocaleString("es-CO")}</span>
              <span className="text-xs text-slate-500">{movement.creado_en ? new Date(movement.creado_en).toLocaleDateString("es-CO") : "-"}</span>
            </div>
          ))}
        </div>
      </section>

      {assignOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/45 backdrop-blur-sm">
          <aside className="h-full w-full max-w-2xl overflow-y-auto bg-white p-6 shadow-2xl">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-violet-700">SuperAdmin</p>
                <h2 className="text-2xl font-black text-slate-950">Asignar créditos</h2>
                <p className="mt-1 text-sm text-slate-500">La asignación se registra en el ledger global del psicólogo.</p>
              </div>
              <button type="button" onClick={closeAssign} className="rounded-2xl border p-2 hover:bg-slate-50" aria-label="Cerrar">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={submitAssign} className="space-y-5">
              <Field label="Psicólogo">
                <div className="overflow-hidden rounded-2xl border border-slate-200">
                  <div className="border-b border-slate-100 bg-slate-50 p-3">
                    <input
                      value={psicologoQ}
                      onChange={(event) => setPsicologoQ(event.target.value)}
                      className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
                      placeholder="Buscar por nombre o correo..."
                    />
                  </div>
                  <div className="max-h-72 divide-y divide-slate-100 overflow-auto">
                    {filteredPsicologos.length === 0 && <p className="p-4 text-sm text-slate-500">No hay psicólogos disponibles.</p>}
                    {filteredPsicologos.map((psicologo) => {
                      const checked = selected?.id === psicologo.id;
                      return (
                        <button
                          key={psicologo.id}
                          type="button"
                          onClick={() => setSelected(psicologo)}
                          className={`flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition ${checked ? "bg-violet-50 text-violet-800" : "hover:bg-slate-50"}`}
                        >
                          <span className="flex min-w-0 items-center gap-3">
                            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-violet-100 text-violet-700">
                              <UserRound className="h-5 w-5" />
                            </span>
                            <span className="min-w-0">
                              <strong className="block truncate">{psicologo.nombre}</strong>
                              <span className="block truncate text-xs text-slate-500">{psicologo.email || "Sin correo"}</span>
                            </span>
                          </span>
                          <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border ${checked ? "border-violet-600 bg-violet-600 text-white" : "border-slate-300"}`}>
                            {checked && <Check className="h-3.5 w-3.5" />}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </Field>

              {selected && (
                <div className="rounded-2xl border border-violet-100 bg-violet-50 p-4">
                  <p className="text-xs font-black uppercase text-violet-700">Cuenta seleccionada</p>
                  <p className="mt-1 font-black text-slate-950">{selected.nombre}</p>
                  <p className="text-sm text-slate-500">Disponibles actuales: {Number(selected.creditos_disponibles || 0).toLocaleString("es-CO")}</p>
                </div>
              )}

              <Field label="Cantidad de créditos">
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
                  placeholder="Ej. 100"
                />
              </Field>

              <Field label="Motivo">
                <textarea
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  className="min-h-28 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
                  placeholder="Ej. Compra inicial de paquete de créditos."
                />
              </Field>

              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                Esta acción suma créditos reales al saldo global del psicólogo y queda auditada.
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
                <button type="button" onClick={closeAssign} className="rounded-2xl border px-5 py-3 font-bold">
                  Cancelar
                </button>
                <button disabled={saving} className="inline-flex items-center gap-2 rounded-2xl bg-violet-700 px-6 py-3 font-bold text-white disabled:opacity-60">
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  Asignar créditos
                </button>
              </div>
            </form>
          </aside>
        </div>
      )}
    </div>
  );
}

function Metric({ label, value, tone = "text-slate-950" }: { label: string; value: string; tone?: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-black uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`mt-2 text-3xl font-black ${tone}`}>{value}</p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block space-y-2 text-sm font-bold text-slate-700">
      <span>{label}</span>
      {children}
    </label>
  );
}
