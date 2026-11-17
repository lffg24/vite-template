// src/pages/superadmin/SuperAdminDashboardPage.tsx
//
// Estaba escrita en UNA línea de 2.000 caracteres, y eso tenía consecuencias
// visibles: dentro de ella convivían tres radios distintos (`rounded-2xl`,
// `rounded-2xl`, el de los `SuperAdminCard`), el error en rojo crudo, el aviso
// en ámbar crudo, `bg-white` en vez de la superficie de la casa y un botón
// dibujado a mano. Es la primera pantalla que ve un superadministrador.

import { useEffect, useState } from "react";
import { Building2, ClipboardList, CreditCard, UsersRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Aviso } from "@/shared/ui/Aviso";
import { IndicadorKpi } from "@/shared/ui/IndicadorKpi";
import { Panel } from "@/shared/ui/Panel";
import { superadminService, type SuperAdminDashboard } from "@/features/superadmin/api/superadminService";
import SuperAdminPageHeader from "./SuperAdminPageHeader";

export default function SuperAdminDashboardPage() {
  const [data, setData] = useState<SuperAdminDashboard | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    superadminService.dashboard().then(setData).catch((e) => setError(e.message));
  }, []);

  const k = data?.kpis || {};

  return (
    <div>
      <SuperAdminPageHeader
        title="Dashboard Super Usuario"
        subtitle="Resumen general de la plataforma ABRIL360."
        action={
          /* Sigue sin manejador, igual que antes: la exportación no existe
             todavía. Queda `disabled` con el motivo a la vista en vez de
             aceptar el clic y no hacer nada, que es lo que hacía. */
          <Button type="button" variant="outline" disabled title="La exportación todavía no está disponible.">
            Exportar reporte
          </Button>
        }
      />

      {error && (
        <Aviso className="mb-5" titulo="No fue posible cargar el resumen">
          {error}
        </Aviso>
      )}

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {/* Era `SuperAdminCard`, una copia de `IndicadorKpi` con tres
            desviaciones: otro radio de esquina, `bg-white` escrito a mano —que
            deja de ser el fondo en cuanto la superficie cambie— y el pie en
            verde esmeralda. El verde era el peor de los tres: «Total
            plataforma» no es una buena noticia, es contexto, y pintarlo del
            color del acierto gasta una señal que debe quedar para cuando algo
            de verdad va bien. */}
        <IndicadorKpi
          etiqueta="Empresas registradas"
          valor={k.empresas ?? "—"}
          contexto="Total plataforma"
          icono={Building2}
        />
        <IndicadorKpi
          etiqueta="Usuarios registrados"
          valor={k.usuarios ?? "—"}
          contexto="Incluye psicólogos y admins"
          icono={UsersRound}
        />
        <IndicadorKpi
          etiqueta="Aplicaciones totales"
          valor={k.aplicaciones ?? "—"}
          contexto="Baterías psicosociales"
          icono={ClipboardList}
        />
        <IndicadorKpi
          etiqueta="Créditos disponibles"
          valor={k.saldo_total ?? "—"}
          contexto={`Asignados: ${k.asignados_total ?? 0}`}
          icono={CreditCard}
        />
      </section>

      <section className="mt-6 grid gap-5 xl:grid-cols-2">
        <Panel titulo="Consumo de créditos" icono={CreditCard}>
          <div className="grid place-items-center rounded-xl bg-surface-subtle p-10 text-center">
            <p className="text-5xl font-bold tabular-nums text-primary">
              {Number(k.consumidos_total ?? 0).toLocaleString("es-CO")}
            </p>
            <p className="mt-2 font-semibold text-muted-foreground">Créditos consumidos</p>
          </div>
        </Panel>

        <Panel titulo="Alertas y notificaciones">
          <div className="grid gap-3">
            <Aviso tono="atencion">Revisar cuentas con saldo bajo</Aviso>
            <Aviso tono="info">Auditoría activa para acciones SuperAdmin</Aviso>
          </div>
        </Panel>
      </section>
    </div>
  );
}
