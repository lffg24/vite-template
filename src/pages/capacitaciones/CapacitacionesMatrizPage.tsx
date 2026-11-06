// src/pages/capacitaciones/CapacitacionesMatrizPage.tsx · R1
//
// La matriz de capacitación: una fila por persona, una columna por curso, y en
// cada cruce el estado que su constancia sostiene HOY.
//
// ## Lo que decide el servidor y lo que no
//
// El estado de cada celda, el umbral de «por vencer» y los totales vienen del
// servidor. Aquí no se recalcula ninguna fecha: si la pantalla decidiera qué es
// «vencida», el CSV y la pantalla podrían discrepar, y el CSV es lo que termina
// en manos de un auditor.
//
// ## Densa a propósito
//
// Es una superficie de operación (intensidad baja de ilustración): la
// ilustración solo aparece cuando no hay nada que mostrar. Con datos, el diseño
// sale del color semántico, de la tipografía y del orden.
//
// ## La primera columna no se mueve
//
// Con doce cursos la tabla se desplaza en horizontal, y una celda roja sin el
// nombre de al lado no dice de quién es. Por eso «Colaborador» es `sticky`.

import { useEffect, useState } from "react";
import { Download, Grid3x3, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StandardPagination } from "@/components/common/StandardPagination";
import { useToast } from "@/hooks/use-toast";
import { useConsulta } from "@/features/capacitaciones/useConsulta";
import {
  CargandoTabla,
  ErrorConsulta,
} from "@/features/capacitaciones/components/EstadoPantalla";
import { formatearFecha } from "@/features/capacitaciones/formato";
import { obtenerMatriz } from "@/services/capacitacionesService";
import type {
  CeldaMatriz,
  CursoMatriz,
  ErrorApi,
  EstadoCelda,
  FilaMatriz,
  MatrizCapacitacion,
} from "@/types/capacitaciones";
import { descargarCSV } from "@/shared/csv";
import { FiltroChips, type OpcionFiltro } from "@/shared/ui/FiltroChips";
import { IllustratedEmptyState } from "@/shared/ui/illustration";
import { PageHeader } from "@/shared/ui/PageHeader";
import { TablaBody, TablaHead, TablaPanel } from "@/shared/ui/Panel";
import { Pill, type TonoPill } from "@/shared/ui/Pill";

/** Cómo se dice y cómo se ve cada estado. Una sola tabla para pantalla y CSV. */
export const ESTADO_CELDA: Record<EstadoCelda, { etiqueta: string; tono: TonoPill }> = {
  VIGENTE: { etiqueta: "Vigente", tono: "exito" },
  POR_VENCER: { etiqueta: "Por vencer", tono: "atencion" },
  VENCIDA: { etiqueta: "Vencida", tono: "peligro" },
  EN_CURSO: { etiqueta: "En curso", tono: "info" },
  PENDIENTE: { etiqueta: "Pendiente", tono: "neutro" },
  ANULADA: { etiqueta: "Anulada", tono: "peligro" },
};

const ORDEN_ESTADOS: EstadoCelda[] = [
  "VIGENTE",
  "POR_VENCER",
  "VENCIDA",
  "EN_CURSO",
  "PENDIENTE",
  "ANULADA",
];

/** La fecha que explica el estado, dicha como la leería una persona. */
export function detalleCelda(celda: CeldaMatriz): string | null {
  if (!celda.vence_el) {
    return celda.estado === "VIGENTE" ? "No vence" : null;
  }
  const fecha = formatearFecha(celda.vence_el);
  return celda.estado === "VENCIDA" ? `Venció el ${fecha}` : `Vence el ${fecha}`;
}

function nombreDe(f: FilaMatriz): string {
  return [f.nombres, f.apellidos].filter(Boolean).join(" ") || "Sin nombre";
}

/** Tope de la exportación. Se avisa si se alcanza: un archivo recortado sin aviso engaña. */
const MAXIMO_EXPORTACION = 2000;
const PAGINA_EXPORTACION = 50;

export default function CapacitacionesMatrizPage() {
  const { toast } = useToast();
  const [busqueda, setBusqueda] = useState("");
  const [consultado, setConsultado] = useState("");
  const [estado, setEstado] = useState<EstadoCelda | "TODOS">("TODOS");
  const [pagina, setPagina] = useState(1);
  const [porPagina, setPorPagina] = useState(10);
  const [exportando, setExportando] = useState(false);

  // 300 ms: lo que tarda alguien en terminar un apellido. Sin esto una cédula
  // de diez dígitos son diez consultas contra la nómina.
  useEffect(() => {
    const t = setTimeout(() => {
      setConsultado(busqueda.trim());
      setPagina(1);
    }, 300);
    return () => clearTimeout(t);
  }, [busqueda]);

  const filtroEstado = estado === "TODOS" ? undefined : estado;
  const consulta = useConsulta<MatrizCapacitacion>(
    () =>
      obtenerMatriz({
        buscar: consultado || undefined,
        estado: filtroEstado,
        pagina,
        porPagina,
      }),
    [consultado, filtroEstado, pagina, porPagina]
  );

  async function exportar() {
    setExportando(true);
    const filas: FilaMatriz[] = [];
    let cursos: CursoMatriz[] = [];
    let total = 0;
    try {
      // Todas las páginas con los MISMOS filtros que la pantalla: exportar lo
      // que se ve y no lo que se filtró sería entregar otro listado.
      for (let p = 1; filas.length < MAXIMO_EXPORTACION; p++) {
        const r = await obtenerMatriz({
          buscar: consultado || undefined,
          estado: filtroEstado,
          pagina: p,
          porPagina: PAGINA_EXPORTACION,
        });
        cursos = r.cursos;
        total = r.total;
        filas.push(...r.filas);
        if (r.filas.length < PAGINA_EXPORTACION) break;
      }
    } catch (e) {
      setExportando(false);
      toast({
        title: "No pudimos exportar la matriz",
        description: (e as ErrorApi).message ?? "Inténtalo de nuevo en un momento.",
      });
      return;
    }
    setExportando(false);

    const cabecera = [
      "Apellidos",
      "Nombres",
      "Tipo de documento",
      "Documento",
      "Cargo",
      ...cursos.map((c) => c.titulo),
      "Cumple",
      "Cursos pedidos",
    ];
    const cuerpo = filas.map((f) => [
      f.apellidos ?? "",
      f.nombres ?? "",
      f.tipo_documento ?? "",
      f.numero_documento ?? "",
      f.cargo ?? "",
      ...cursos.map((c) => {
        const celda = f.celdas.find((x) => x.curso_id === c.curso_id);
        if (!celda) return "No aplica";
        const detalle = detalleCelda(celda);
        return `${ESTADO_CELDA[celda.estado].etiqueta}${detalle ? ` · ${detalle}` : ""}`;
      }),
      String(f.cumplidas),
      String(f.aplicables),
    ]);
    descargarCSV(`matriz-capacitacion-${new Date().toISOString().slice(0, 10)}.csv`, [
      cabecera,
      ...cuerpo,
    ]);
    if (total > filas.length) {
      toast({
        title: "La exportación va recortada",
        description: `El archivo trae ${filas.length} de ${total} personas. Filtra para llevarte el resto.`,
      });
    }
  }

  const datos = consulta.datos;
  const hayFiltro = Boolean(consultado) || estado !== "TODOS";

  const opcionesFiltro: OpcionFiltro<EstadoCelda | "TODOS">[] = [
    { valor: "TODOS", etiqueta: "Todos" },
    ...ORDEN_ESTADOS.map((e) => ({
      valor: e,
      etiqueta: ESTADO_CELDA[e].etiqueta,
      cuenta: datos?.resumen[e],
      tono:
        ESTADO_CELDA[e].tono === "info" || ESTADO_CELDA[e].tono === "marca"
          ? undefined
          : (ESTADO_CELDA[e].tono as OpcionFiltro<EstadoCelda>["tono"]),
    })),
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        antetitulo="Empresa"
        titulo="Matriz de capacitación"
        descripcion="Quién tiene vigente cada formación, a quién se le vence y a quién le falta."
        icono={Grid3x3}
        accion={
          <Button
            variant="outline"
            onClick={() => void exportar()}
            disabled={exportando || !datos || datos.total === 0}
          >
            <Download className="mr-2 h-4 w-4" aria-hidden="true" />
            {exportando ? "Preparando…" : "Exportar CSV"}
          </Button>
        }
      />

      <section className="space-y-4 rounded-rel-panel border border-rel-border bg-rel-surface p-4 shadow-sm sm:p-6">
        {/* --- buscar y filtrar --- */}
        <div className="space-y-3">
          <div className="relative w-full sm:max-w-md">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-rel-muted"
              aria-hidden="true"
            />
            <Input
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por nombre, documento o cargo"
              aria-label="Buscar colaborador"
              className="pl-9"
            />
          </div>
          <FiltroChips
            etiqueta="Mostrar personas con al menos un curso en estado"
            opciones={opcionesFiltro}
            valor={estado}
            alCambiar={(v) => {
              setEstado(v);
              setPagina(1);
            }}
          />
          {datos ? (
            <p className="text-xs text-rel-muted">
              Las cifras cuentan cursos en cada estado en toda la empresa. «Por vencer»:
              vence en {datos.dias_aviso} días o menos.
            </p>
          ) : null}
        </div>

        {/* --- la matriz --- */}
        {consulta.fase === "cargando" && !datos ? (
          <CargandoTabla filas={6} />
        ) : consulta.fase === "error" && consulta.error ? (
          <ErrorConsulta error={consulta.error as ErrorApi} reintentar={consulta.refrescar} />
        ) : datos && datos.total === 0 && !hayFiltro ? (
          <IllustratedEmptyState
            illustration="complianceMatrix"
            title="Todavía no hay a quién medir"
            description="La matriz se llena cuando asignas un curso e invitas a personas, o cuando alguien entra por un enlace de grupo."
          />
        ) : datos ? (
          <TablaMatriz
            datos={datos}
            limpiar={() => {
              setBusqueda("");
              setEstado("TODOS");
              setPagina(1);
            }}
          />
        ) : null}

        {datos && datos.total > 0 ? (
          <StandardPagination
            page={datos.pagina}
            pageSize={datos.por_pagina}
            total={datos.total}
            pageSizeOptions={[10, 25, 50]}
            itemLabel="colaboradores"
            onPageChange={setPagina}
            onPageSizeChange={(n) => {
              setPorPagina(n);
              setPagina(1);
            }}
            className="rounded-rel-card border border-rel-border"
          />
        ) : null}
      </section>
    </div>
  );
}

function TablaMatriz({ datos, limpiar }: { datos: MatrizCapacitacion; limpiar: () => void }) {
  if (datos.filas.length === 0) {
    return (
      <div className="rounded-rel-card border border-rel-border px-6 py-10 text-center">
        <p className="font-rel-heading font-bold text-rel-dark">Nadie coincide con el filtro</p>
        <p className="mt-1 text-sm text-rel-muted">
          Prueba con otro nombre o quita el filtro de estado.
        </p>
        <Button variant="outline" className="mt-4" onClick={limpiar}>
          Quitar filtros
        </Button>
      </div>
    );
  }

  return (
    <>
      <ListaMovil datos={datos} />
      <div className="hidden md:block">
        <TablaMatrizAncha datos={datos} />
      </div>
    </>
  );
}

/**
 * En el celular, una tarjeta por persona.
 *
 * Una matriz en 390 px deja la columna del nombre ocupando casi todo el ancho y
 * los estados asomando por el borde: se puede desplazar, pero no se puede leer.
 * La tarjeta dice lo mismo —cada curso pedido con su estado y su fecha— en el
 * orden en que se lee en vertical. Los cursos que no aplican no se listan: en
 * una tarjeta, una fila de «no aplica» es ruido.
 */
function ListaMovil({ datos }: { datos: MatrizCapacitacion }) {
  const titulo = new Map(datos.cursos.map((c) => [c.curso_id, c.titulo]));
  return (
    <ul className="space-y-3 md:hidden">
      {datos.filas.map((f) => (
        <li key={f.participante_id} className="rounded-rel-card border border-rel-border p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="break-words font-semibold text-rel-dark">{nombreDe(f)}</p>
              <p className="text-xs text-rel-muted">
                {[f.numero_documento ? `${f.tipo_documento ?? ""} ${f.numero_documento}`.trim() : null, f.cargo]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            </div>
            <p className="shrink-0 text-right font-rel-heading font-black tabular-nums text-rel-dark">
              {f.cumplidas}/{f.aplicables}
              <span className="block text-xs font-normal text-rel-muted">cumple</span>
            </p>
          </div>
          <ul className="mt-3 space-y-2 border-t border-rel-border pt-3">
            {f.celdas.map((c) => {
              const { etiqueta, tono } = ESTADO_CELDA[c.estado];
              const detalle = detalleCelda(c);
              return (
                <li key={c.curso_id} className="flex items-start justify-between gap-3 text-sm">
                  <span className="min-w-0 break-words text-rel-dark">{titulo.get(c.curso_id) ?? "Curso"}</span>
                  <span className="flex shrink-0 flex-col items-end">
                    <Pill tono={tono}>{etiqueta}</Pill>
                    {detalle && c.estado !== "VIGENTE" ? (
                      <span className="mt-0.5 text-[11px] text-rel-muted">{detalle}</span>
                    ) : null}
                  </span>
                </li>
              );
            })}
          </ul>
        </li>
      ))}
    </ul>
  );
}

function TablaMatrizAncha({ datos }: { datos: MatrizCapacitacion }) {
  return (
    <TablaPanel>
      <table className="w-full min-w-max border-separate border-spacing-0 text-sm">
        <caption className="sr-only">
          Estado de cada colaborador en cada curso asignado a la empresa
        </caption>
        <TablaHead>
          <tr>
            <th
              scope="col"
              className="sticky left-0 z-10 min-w-[14rem] bg-rel-surface-subtle px-4 py-3 text-left font-semibold"
            >
              Colaborador
            </th>
            {datos.cursos.map((c) => (
              <th
                key={c.curso_id}
                scope="col"
                title={c.titulo}
                className="min-w-[9rem] max-w-[12rem] px-3 py-3 text-center font-semibold normal-case tracking-normal"
              >
                <span className="line-clamp-2">{c.titulo}</span>
              </th>
            ))}
            <th scope="col" className="px-4 py-3 text-right font-semibold">
              Cumple
            </th>
          </tr>
        </TablaHead>
        <TablaBody>
          {datos.filas.map((f) => {
            const porCurso = new Map(f.celdas.map((c) => [c.curso_id, c]));
            const porcentaje = f.aplicables > 0 ? Math.round((f.cumplidas / f.aplicables) * 100) : 0;
            return (
              <tr key={f.participante_id} className="group">
                <th
                  scope="row"
                  className="sticky left-0 z-10 bg-rel-surface px-4 py-3 text-left font-normal group-hover:bg-rel-surface-subtle"
                >
                  <p className="font-semibold text-rel-dark">{nombreDe(f)}</p>
                  <p className="text-xs text-rel-muted">
                    {[
                      f.numero_documento ? `${f.tipo_documento ?? ""} ${f.numero_documento}`.trim() : null,
                      f.cargo,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </th>
                {datos.cursos.map((c) => {
                  const celda = porCurso.get(c.curso_id);
                  if (!celda) {
                    return (
                      <td key={c.curso_id} className="px-3 py-3 text-center text-rel-muted group-hover:bg-rel-surface-subtle">
                        <span aria-hidden="true">—</span>
                        <span className="sr-only">No aplica</span>
                      </td>
                    );
                  }
                  const { etiqueta, tono } = ESTADO_CELDA[celda.estado];
                  const detalle = detalleCelda(celda);
                  return (
                    <td key={c.curso_id} className="px-3 py-3 text-center group-hover:bg-rel-surface-subtle">
                      <Pill tono={tono} title={detalle ?? undefined}>
                        {etiqueta}
                      </Pill>
                      {detalle && celda.estado !== "VIGENTE" ? (
                        <p className="mt-1 text-[11px] text-rel-muted">{detalle}</p>
                      ) : null}
                    </td>
                  );
                })}
                <td className="px-4 py-3 text-right group-hover:bg-rel-surface-subtle">
                  <p className="font-rel-heading font-black tabular-nums text-rel-dark">
                    {f.cumplidas}/{f.aplicables}
                  </p>
                  <p className="text-xs tabular-nums text-rel-muted">{porcentaje} %</p>
                </td>
              </tr>
            );
          })}
        </TablaBody>
      </table>
    </TablaPanel>
  );
}
