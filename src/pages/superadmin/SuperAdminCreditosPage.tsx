// src/pages/superadmin/SuperAdminCreditosPage.tsx
import { type FormEvent, type ReactNode, useEffect, useMemo, useState } from "react";
import { Check, Coins, Loader2, MinusCircle, Plus, Search, UserRound, WalletCards } from "lucide-react";

import { ToastCard, type ToastPayload } from "@/components/feedback/ToastCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Aviso } from "@/shared/ui/Aviso";
import { Campo } from "@/shared/ui/Campo";
import { IndicadorKpi } from "@/shared/ui/IndicadorKpi";
import { Panel } from "@/shared/ui/Panel";
import { PanelLateral } from "@/shared/ui/PanelLateral";
import { Pill } from "@/shared/ui/Pill";
import { CeldaPrincipal, TablaDatos, type ColumnaTabla } from "@/shared/ui/TablaDatos";
import {
  superadminService,
  type CreditAccount,
  type CreditMovement,
  type SuperPsicologo,
} from "@/features/superadmin/api/superadminService";
import SuperAdminPageHeader from "./SuperAdminPageHeader";

const defaultCreditReason = "Compra de créditos";
const defaultDeductReason = "Ajuste administrativo de saldo";

export function creditLoadErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "No fue posible cargar créditos.";
}

export function validateCreditDeductionAmount(rawAmount: string, saldoActual: number) {
  const cantidad = Number(rawAmount);
  if (!Number.isInteger(cantidad) || cantidad <= 0) return "Ingresa una cantidad entera mayor a cero.";
  if (cantidad > saldoActual) return "No puedes descontar más créditos que el saldo disponible.";
  return null;
}

const SIN_DATO = "\u2014";

/** Un entero en formato colombiano, siempre igual en toda la pantalla. */
function entero(valor?: number | null): string {
  return Number(valor || 0).toLocaleString("es-CO");
}

function cuando(valor?: string | null): string {
  if (!valor) return SIN_DATO;
  const d = new Date(valor);
  return Number.isNaN(d.getTime())
    ? SIN_DATO
    : d.toLocaleString("es-CO", { dateStyle: "medium", timeStyle: "short" });
}

/**
 * Las columnas de cuentas de credito.
 *
 * Tres cosas que cambiaron al migrar y conviene no revertir:
 *
 *   - El estado es `Pill`, no una etiqueta verde fija. Antes TODO estado se
 *     pintaba en verde esmeralda, incluido uno suspendido.
 *   - Los numeros van a la derecha y con `tabular-nums` —lo pone la tabla al
 *     declarar `alineacion`—, no centrados: una columna de cifras centrada no
 *     se puede comparar de un vistazo porque las unidades no se alinean.
 *   - Descontar es un `Button` de la casa. Era un boton ambar escrito a mano
 *     que no existia en ninguna otra pantalla.
 */
function columnasCuenta(
  descontar: (cuenta: CreditAccount) => void,
): ColumnaTabla<CreditAccount>[] {
  return [
    {
      clave: "cuenta",
      titulo: "Cuenta",
      celda: (c) => (
        <CeldaPrincipal
          titulo={c.psicologo_nombre || `Usuario ${c.psicologo_usuario_id}`}
          apoyo={c.psicologo_email || "Sin correo"}
        />
      ),
      valor: (c) => c.psicologo_nombre || "",
    },
    {
      clave: "empresa",
      titulo: "Empresa",
      celda: (c) => c.empresa_nombre || "Cuenta global",
      valor: (c) => c.empresa_nombre || "",
    },
    {
      clave: "asignados",
      titulo: "Asignados",
      alineacion: "derecha",
      celda: (c) => entero(c.creditos_asignados),
      valor: (c) => Number(c.creditos_asignados || 0),
    },
    {
      clave: "saldo",
      titulo: "Saldo",
      alineacion: "derecha",
      celda: (c) => (
        <span className="font-bold text-primary">{entero(c.saldo_actual)}</span>
      ),
      valor: (c) => Number(c.saldo_actual || 0),
    },
    {
      clave: "estado",
      titulo: "Estado",
      celda: (c) => (
        <Pill tono={c.estado === "activa" ? "exito" : "neutro"}>{c.estado}</Pill>
      ),
      valor: (c) => c.estado,
    },
    {
      clave: "actualizado",
      titulo: "Actualizado",
      movil: "oculta",
      celda: (c) => (
        <span className="text-xs text-muted-foreground">{cuando(c.actualizado_en)}</span>
      ),
      valor: (c) => c.actualizado_en || "",
    },
    {
      clave: "accion",
      titulo: "Accion",
      soloAcciones: true,
      alineacion: "derecha",
      celda: (c) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => descontar(c)}
          disabled={Number(c.saldo_actual || 0) <= 0}
        >
          <MinusCircle className="mr-2 h-4 w-4" aria-hidden="true" />
          Descontar
        </Button>
      ),
    },
  ];
}

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
  const [deductTarget, setDeductTarget] = useState<CreditAccount | null>(null);
  const [deductAmount, setDeductAmount] = useState("");
  const [deductReason, setDeductReason] = useState(defaultDeductReason);
  const [deductOpen, setDeductOpen] = useState(false);
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
      const accountsRes = await superadminService.creditAccounts({ q, page, page_size: pageSize });
      const [movementsRes, psicologosRes] = await Promise.allSettled([
        superadminService.creditMovements({ page: 1, page_size: 8 }),
        superadminService.psicologos({ page: 1, page_size: 100 }),
      ]);
      setItems(accountsRes.items || []);
      setTotal(accountsRes.total || 0);
      setMovements(movementsRes.status === "fulfilled" ? movementsRes.value.items || [] : []);
      if (psicologosRes.status === "rejected") throw psicologosRes.reason;
      setPsicologos(psicologosRes.value.items || []);
    } catch (err) {
      setError(creditLoadErrorMessage(err));
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

  const openDeduct = (target: CreditAccount) => {
    setDeductTarget(target);
    setDeductAmount("");
    setDeductReason(defaultDeductReason);
    setDeductOpen(true);
  };

  const closeDeduct = () => {
    if (saving) return;
    setDeductOpen(false);
    setDeductTarget(null);
    setDeductAmount("");
    setDeductReason(defaultDeductReason);
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

  const submitDeduct = async (event: FormEvent) => {
    event.preventDefault();
    if (!deductTarget) return;
    const saldoActual = Number(deductTarget.saldo_actual || 0);
    const validationMessage = validateCreditDeductionAmount(deductAmount, saldoActual);
    if (validationMessage) {
      notify({ type: "warning", title: "Cantidad inválida", message: validationMessage });
      return;
    }
    const motivo = deductReason.trim();
    if (motivo.length < 5) {
      notify({ type: "warning", title: "Motivo requerido", message: "Describe brevemente la razón del descuento para auditoría." });
      return;
    }

    const cantidad = Number(deductAmount);
    setSaving(true);
    try {
      const idempotencyKey =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `deduct-${deductTarget.id}-${Date.now()}`;
      const result = await superadminService.deductCredits({
        psicologo_usuario_id: deductTarget.psicologo_usuario_id,
        empresa_id: null,
        cantidad,
        descripcion: motivo,
        idempotency_key: idempotencyKey,
      });
      const saldoNuevo = Number(result?.saldo_nuevo ?? saldoActual - cantidad);
      notify({
        type: "success",
        title: "Créditos descontados",
        message: `${deductTarget.psicologo_nombre || "La cuenta"} quedó con ${saldoNuevo.toLocaleString("es-CO")} créditos disponibles.`,
      });
      setDeductOpen(false);
      setDeductTarget(null);
      setDeductAmount("");
      setDeductReason(defaultDeductReason);
      await load();
    } catch (err) {
      notify({ type: "error", title: "No fue posible descontar créditos", message: err instanceof Error ? err.message : "Intenta nuevamente." });
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
          <Button onClick={() => openAssign()}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            Asignar créditos
          </Button>
        }
      />

      {error ? <Aviso>{error}</Aviso> : null}

      <section className="grid gap-4 md:grid-cols-3">
        <IndicadorKpi etiqueta="Cuentas visibles" valor={entero(total)} icono={UserRound} tono="neutro" />
        <IndicadorKpi etiqueta="Créditos asignados" valor={entero(totals.asignados)} icono={WalletCards} tono="marca" />
        <IndicadorKpi etiqueta="Saldo disponible" valor={entero(totals.disponibles)} icono={Coins} tono="exito" />
      </section>

      <TablaDatos
        filas={items}
        columnas={columnasCuenta(openDeduct)}
        claveFila={(c) => String(c.id)}
        etiquetaTabla="Cuentas de creditos"
        etiquetaElemento="cuentas"
        cargando={loading}
        vacio="No hay cuentas de creditos para los filtros actuales."
        cabecera={
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-[260px] flex-1">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <label className="sr-only" htmlFor="buscar-cuenta">
                Buscar cuenta de creditos
              </label>
              <Input
                id="buscar-cuenta"
                value={q}
                onChange={(event) => setQ(event.target.value)}
                className="pl-9"
                placeholder="Buscar por psicologo, correo o empresa..."
              />
            </div>
            <Button variant="outline" onClick={load}>
              Actualizar
            </Button>
          </div>
        }
        control={{
          pagina: page,
          tamano: pageSize,
          total,
          onPagina: setPage,
          onTamano: (size) => {
            setPageSize(size);
            setPage(1);
          },
        }}
      />

      <Panel
        titulo="Últimos movimientos"
        descripcion="Asignaciones y consumos recientes del ledger."
        icono={WalletCards}
      >
        {movements.length === 0 ? (
          <p className="py-4 text-sm text-muted-foreground">
            No hay movimientos recientes para mostrar.
          </p>
        ) : (
          <ul className="divide-y divide-border/70">
            {movements.map((movement) => (
              <li
                key={movement.id}
                className="grid gap-2 py-3 text-sm md:grid-cols-[140px_1fr_120px_120px]"
              >
                <span className="font-bold text-foreground">{movement.tipo}</span>
                <span className="text-foreground-soft">
                  {movement.descripcion || "Movimiento de créditos"}
                </span>
                <span className="font-semibold tabular-nums text-foreground md:text-right">
                  {entero(movement.cantidad)}
                </span>
                <span className="text-xs text-muted-foreground md:text-right">
                  {movement.creado_en
                    ? new Date(movement.creado_en).toLocaleDateString("es-CO")
                    : SIN_DATO}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <PanelLateral
        abierto={assignOpen}
        alCerrar={closeAssign}
        alEnviar={submitAssign}
        antetitulo="SuperAdmin"
        titulo="Asignar créditos"
        descripcion="La asignación se registra en el ledger global del psicólogo."
        ancho="lg"
        acciones={
          <>
            <Button type="button" variant="outline" onClick={closeAssign}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
              Asignar créditos
            </Button>
          </>
        }
      >
        <div className="space-y-5">
          <Campo etiqueta="Psicólogo" id={ID_PSICOLOGO}>
            <div className="overflow-hidden rounded-rel-card border border-border">
              <div className="border-b border-border/70 bg-surface-subtle p-3">
                <Input
                  id={ID_PSICOLOGO}
                  value={psicologoQ}
                  onChange={(event) => setPsicologoQ(event.target.value)}
                  placeholder="Buscar por nombre o correo..."
                />
              </div>
              <div className="max-h-72 divide-y divide-border/70 overflow-auto">
                {filteredPsicologos.length === 0 && (
                  <p className="p-4 text-sm text-muted-foreground">
                    No hay psicólogos disponibles.
                  </p>
                )}
                {filteredPsicologos.map((psicologo) => {
                  const elegido = selected?.id === psicologo.id;
                  return (
                    <button
                      key={psicologo.id}
                      type="button"
                      // Es una opción de una lista, no un botón suelto: lo que
                      // importa al lector de pantalla es cuál está elegida.
                      aria-pressed={elegido}
                      onClick={() => setSelected(psicologo)}
                      className={cn(
                        "flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors duration-rel-micro focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
                        elegido ? "bg-accent text-accent-foreground" : "hover:bg-surface-subtle"
                      )}
                    >
                      <span className="flex min-w-0 items-center gap-3">
                        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-rel-card bg-accent text-accent-foreground">
                          <UserRound className="h-5 w-5" aria-hidden="true" />
                        </span>
                        <span className="min-w-0">
                          <strong className="block truncate">{psicologo.nombre}</strong>
                          <span className="block truncate text-xs text-muted-foreground">
                            {psicologo.email || "Sin correo"}
                          </span>
                        </span>
                      </span>
                      <span
                        className={cn(
                          "grid h-5 w-5 shrink-0 place-items-center rounded-full border",
                          elegido
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border"
                        )}
                      >
                        {elegido && <Check className="h-3.5 w-3.5" aria-hidden="true" />}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </Campo>

          {selected && (
            <div className="rounded-rel-card border border-primary/20 bg-accent p-4">
              <p className="font-heading text-xs font-bold uppercase tracking-wide text-primary">
                Cuenta seleccionada
              </p>
              <p className="mt-1 font-bold text-foreground">{selected.nombre}</p>
              <p className="text-sm text-muted-foreground">
                Disponibles actuales: {entero(selected.creditos_disponibles)}
              </p>
            </div>
          )}

          <Campo etiqueta="Cantidad de créditos" id={ID_CANTIDAD}>
            <Input
              id={ID_CANTIDAD}
              type="number"
              min="1"
              step="1"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              placeholder="Ej. 100"
            />
          </Campo>

          <Campo etiqueta="Motivo" id={ID_MOTIVO}>
            <Textarea
              id={ID_MOTIVO}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              className="min-h-28"
              placeholder="Ej. Compra inicial de paquete de créditos."
            />
          </Campo>

          <Aviso tono="atencion">
            Esta acción suma créditos reales al saldo global del psicólogo y queda auditada.
          </Aviso>
        </div>
      </PanelLateral>

      <PanelLateral
        abierto={deductOpen && Boolean(deductTarget)}
        alCerrar={closeDeduct}
        alEnviar={submitDeduct}
        antetitulo="Ajuste de saldo"
        titulo="Descontar créditos"
        descripcion="El movimiento quedará registrado y auditado en el ledger."
        acciones={
          <>
            <Button type="button" variant="outline" onClick={closeDeduct}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
              Descontar créditos
            </Button>
          </>
        }
      >
        {deductTarget ? (
          <div className="space-y-5">
            <div className="rounded-rel-card border border-warning/30 bg-warning-subtle p-4">
              <p className="font-heading text-xs font-bold uppercase text-warning-ink">
                Cuenta seleccionada
              </p>
              <p className="mt-1 font-bold text-foreground">
                {deductTarget.psicologo_nombre || `Usuario ${deductTarget.psicologo_usuario_id}`}
              </p>
              <p className="text-sm text-foreground-soft">
                {deductTarget.psicologo_email || "Sin correo"}
              </p>
              <p className="mt-2 text-sm font-bold text-warning-ink">
                Saldo disponible: {entero(deductTarget.saldo_actual)}
              </p>
            </div>

            <Campo etiqueta="Cantidad a descontar" id={ID_DESCUENTO}>
              <Input
                id={ID_DESCUENTO}
                type="number"
                min="1"
                max={Number(deductTarget.saldo_actual || 0)}
                step="1"
                value={deductAmount}
                onChange={(event) => setDeductAmount(event.target.value)}
                placeholder="Ej. 10"
              />
            </Campo>

            <Campo etiqueta="Motivo obligatorio" id={ID_MOTIVO_DESCUENTO}>
              <Textarea
                id={ID_MOTIVO_DESCUENTO}
                value={deductReason}
                onChange={(event) => setDeductReason(event.target.value)}
                className="min-h-28"
                placeholder="Ej. Corrección administrativa por compra anulada."
              />
            </Campo>

            <Aviso>
              Esta acción no elimina movimientos anteriores ni borra historial. Solo reduce el
              saldo disponible de la cuenta seleccionada.
            </Aviso>
          </div>
        ) : null}
      </PanelLateral>
    </div>
  );
}

const ID_PSICOLOGO = "creditos-psicologo";
const ID_CANTIDAD = "creditos-cantidad";
const ID_MOTIVO = "creditos-motivo";
const ID_DESCUENTO = "creditos-descuento";
const ID_MOTIVO_DESCUENTO = "creditos-motivo-descuento";
