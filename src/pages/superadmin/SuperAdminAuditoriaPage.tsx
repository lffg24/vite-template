// src/pages/superadmin/SuperAdminAuditoriaPage.tsx
//
// El registro de auditoría de la plataforma.
//
// Estaba escrito en UNA línea de 1.400 caracteres: la tabla a mano con
// `bg-slate-50` y `text-slate-500` —color crudo, invisible en modo oscuro—,
// los eventos tipados como `any`, sin estado de carga y sin estado vacío, de
// modo que mientras cargaba y cuando no había nada se veía exactamente lo
// mismo: una tabla con encabezado y ni una fila.
import { useEffect, useState } from "react";

import {
  superadminService,
  type EventoAuditoria,
} from "@/features/superadmin/api/superadminService";
import { Aviso } from "@/shared/ui/Aviso";
import { CeldaPrincipal, TablaDatos, type ColumnaTabla } from "@/shared/ui/TablaDatos";
import SuperAdminPageHeader from "./SuperAdminPageHeader";

const SIN_DATO = "—";

/**
 * La fecha se formatea con el locale del país y no con el del navegador: un
 * registro de auditoría se lee para contrastarlo con otra cosa, y `1/3`
 * significa marzo o enero según quién mire.
 */
function fecha(valor?: string | null): string {
  if (!valor) return SIN_DATO;
  const d = new Date(valor);
  return Number.isNaN(d.getTime())
    ? SIN_DATO
    : d.toLocaleString("es-CO", { dateStyle: "medium", timeStyle: "short" });
}

const COLUMNAS: ColumnaTabla<EventoAuditoria>[] = [
  {
    clave: "evento",
    titulo: "Evento",
    // Sin `a` ni `alAbrir`: un evento de auditoría no tiene página propia. Es
    // texto, pero el MISMO texto que el nombre de fila de cualquier otra tabla.
    celda: (a) => <CeldaPrincipal titulo={a.evento} />,
  },
  { clave: "usuario", titulo: "Usuario", celda: (a) => a.usuario_id || SIN_DATO },
  { clave: "empresa", titulo: "Empresa", celda: (a) => a.empresa_id || SIN_DATO },
  {
    clave: "ip",
    titulo: "IP",
    celda: (a) => <span className="tabular-nums">{a.ip || SIN_DATO}</span>,
  },
  { clave: "fecha", titulo: "Fecha", celda: (a) => fecha(a.creado_en) },
];

export default function SuperAdminAuditoriaPage() {
  const [items, setItems] = useState<EventoAuditoria[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let vigente = true;
    setCargando(true);
    setError(null);
    superadminService
      .auditoria({ page, page_size: pageSize })
      .then((r) => {
        if (!vigente) return;
        setItems(r.items);
        setTotal(r.total);
      })
      .catch((e: unknown) => {
        if (!vigente) return;
        setError(e instanceof Error ? e.message : "No pudimos cargar la auditoría.");
      })
      .finally(() => {
        if (vigente) setCargando(false);
      });
    // `vigente` descarta el resultado de una petición que ya no interesa: sin
    // esto, cambiar de página dos veces seguidas puede dejar pintada la
    // primera respuesta si llega después de la última.
    return () => {
      vigente = false;
    };
  }, [page, pageSize]);

  return (
    <div>
      <SuperAdminPageHeader
        title="Auditoría"
        subtitle="Eventos sensibles ejecutados en la plataforma."
      />

      {error ? (
        <Aviso titulo="No pudimos cargar la auditoría" className="mb-5">
          {error}
        </Aviso>
      ) : null}

      <TablaDatos
        filas={items}
        columnas={COLUMNAS}
        claveFila={(a) => String(a.id)}
        etiquetaTabla="Eventos de auditoría"
        etiquetaElemento="eventos"
        opcionesTamano={[10, 20, 50, 100]}
        cargando={cargando}
        vacio="No hay eventos registrados en este periodo."
        control={{
          pagina: page,
          tamano: pageSize,
          total,
          onPagina: setPage,
          onTamano: (n) => {
            setPageSize(n);
            setPage(1);
          },
        }}
      />
    </div>
  );
}
