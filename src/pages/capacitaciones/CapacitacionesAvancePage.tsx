// src/pages/capacitaciones/CapacitacionesAvancePage.tsx
//
// Quién va por dónde en una asignación.
//
// ## El hueco que cierra
//
// El módulo sabía dos cosas de cada persona: si tenía invitación y si ya tenía
// constancia. Entre esas dos —que es donde la gente vive durante días— no había
// nada. «¿Quién va en la lección 3 de 5?» es la pregunta que más se hace quien
// gestiona una capacitación, y el producto no la respondía.
//
// ## Por qué la situación la calcula el servidor
//
// De ella cuelga una acción distinta para cada caso: al que no ha entrado se le
// recuerda; al que se le venció la invitación hay que volver a invitarlo. Una
// regla que viviera en esta pantalla acabaría distinta en la exportación, y dos
// números que no cuadran valen menos que ninguno.
//
// ## El denominador no siempre existe
//
// En modo autodeclarado no hay convocatoria: no se sabe a quién se esperaba, así
// que decir «faltan 12» sería inventárselo. La pantalla lo dice en vez de
// callarlo, porque un panel que omite su propia incertidumbre se lee como si no
// la tuviera.

import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { Download, Users } from "lucide-react";

import { PageHeader } from "@/shared/ui/PageHeader";
import { Panel } from "@/shared/ui/Panel";
import { TablaDatos, type ColumnaTabla } from "@/shared/ui/TablaDatos";
import { BotonVolver } from "@/shared/ui/BotonVolver";
import { Ayuda } from "@/shared/ui/Ayuda";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { obtenerAvance } from "@/services/capacitacionesService";
import type { AvanceParticipante, SituacionParticipante } from "@/types/capacitaciones";
import { useConsulta } from "@/features/capacitaciones/useConsulta";
import {
  CargandoTabla,
  ErrorConsulta,
  SinDatos,
  SinResultados,
} from "@/features/capacitaciones/components/EstadoPantalla";
import { formatearFecha } from "@/features/capacitaciones/formato";

/** Cómo se nombra y se pinta cada situación, en un solo sitio. */
const SITUACION: Record<
  SituacionParticipante,
  { etiqueta: string; variante: "secondary" | "outline" | "destructive" | "default"; ayuda: string }
> = {
  SIN_EMPEZAR: {
    etiqueta: "Sin empezar",
    variante: "outline",
    ayuda: "Tiene invitación y todavía sirve. Lo que falta es que entre.",
  },
  INVITACION_VENCIDA: {
    etiqueta: "Invitación vencida",
    variante: "destructive",
    ayuda:
      "Se le invitó, nunca entró y su invitación ya no sirve. Hay que emitirle una nueva.",
  },
  EN_CURSO: {
    etiqueta: "En curso",
    variante: "secondary",
    ayuda: "Entró y le faltan lecciones obligatorias.",
  },
  COMPLETADO: {
    etiqueta: "Completado",
    variante: "default",
    ayuda: "Terminó todo lo obligatorio de la versión que está cursando.",
  },
};

function Contador({
  etiqueta,
  valor,
  ayuda,
}: {
  etiqueta: string;
  valor: number;
  ayuda?: string;
}) {
  return (
    <div className="min-w-0 rounded-rel-control border border-rel-border bg-rel-surface p-4">
      <p className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-rel-muted">
        {etiqueta}
        {ayuda ? <Ayuda etiqueta={`Qué significa ${etiqueta}`}>{ayuda}</Ayuda> : null}
      </p>
      <p className="mt-1 font-rel-heading text-2xl font-black tabular-nums text-rel-dark">
        {valor}
      </p>
    </div>
  );
}

/**
 * La barra de avance.
 *
 * Con `obligatorias_totales` en cero no se pinta ninguna: una versión sin
 * lecciones obligatorias no tiene de qué llevar cuenta, y una barra al 0 % o al
 * 100 % afirmaría algo que nadie midió.
 */
function Avance({ hechas, totales }: { hechas: number; totales: number }) {
  if (totales === 0) return <span className="text-sm text-rel-muted">—</span>;
  const porcentaje = Math.floor((hechas * 100) / totales);
  return (
    <div className="flex min-w-0 items-center gap-2">
      <div
        className="h-2 w-20 shrink-0 overflow-hidden rounded-full bg-rel-surface-subtle"
        role="img"
        aria-label={`${hechas} de ${totales} lecciones obligatorias`}
      >
        <div
          className="h-full rounded-full bg-rel-primary"
          style={{ width: `${porcentaje}%` }}
        />
      </div>
      <span className="whitespace-nowrap text-sm tabular-nums text-rel-dark">
        {hechas}/{totales}
      </span>
    </div>
  );
}

/** Una fila por persona, con lo que hace falta para actuar sobre ella. */
function filaCSV(p: AvanceParticipante): string[] {
  return [
    p.tipo_documento,
    p.numero_documento,
    p.apellidos,
    p.nombres,
    p.cargo ?? "",
    SITUACION[p.situacion].etiqueta,
    String(p.obligatorias_completas),
    String(p.obligatorias_totales),
    p.ultima_actividad ?? "",
    p.constancia_codigo ?? "",
  ];
}

const CABECERA_CSV = [
  "Tipo documento",
  "Documento",
  "Apellidos",
  "Nombres",
  "Cargo",
  "Situación",
  "Lecciones hechas",
  "Lecciones obligatorias",
  "Última actividad",
  "Constancia",
];

/**
 * Escapa una celda de CSV.
 *
 * Entre comillas SIEMPRE, no solo cuando hace falta: los nombres traen comas y
 * los cargos traen punto y coma, y una exportación que se rompe en la fila 40 se
 * descubre cuando ya está en el correo de alguien.
 */
function celdaCSV(valor: string): string {
  return `"${valor.replace(/"/g, '""')}"`;
}

export default function CapacitacionesAvancePage() {
  const { asignacionId = "" } = useParams();
  const [busqueda, setBusqueda] = useState("");

  const consulta = useConsulta(() => obtenerAvance(asignacionId), [asignacionId]);

  const filtradas = useMemo(() => {
    const gente = consulta.datos?.participantes ?? [];
    const texto = busqueda.trim().toLowerCase();
    if (texto === "") return gente;
    return gente.filter((p) =>
      `${p.nombres} ${p.apellidos} ${p.numero_documento} ${p.cargo ?? ""}`
        .toLowerCase()
        .includes(texto)
    );
  }, [consulta.datos, busqueda]);

  function descargar() {
    const datos = consulta.datos;
    if (!datos) return;
    const lineas = [CABECERA_CSV, ...filtradas.map(filaCSV)].map((f) =>
      f.map(celdaCSV).join(",")
    );
    // El BOM es lo que hace que Excel en Windows abra las tildes bien. Sin él,
    // «Inducción» llega como «InducciÃ³n» y el archivo parece corrupto.
    const blob = new Blob(["﻿" + lineas.join("\r\n")], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const enlace = document.createElement("a");
    enlace.href = url;
    enlace.download = `avance-${datos.asignacion.curso_titulo
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")}.csv`;
    enlace.click();
    URL.revokeObjectURL(url);
  }

  const columnas: ColumnaTabla<AvanceParticipante>[] = [
    {
      clave: "persona",
      titulo: "Persona",
      valor: (p) => `${p.apellidos} ${p.nombres}`,
      celda: (p) => (
        <div className="min-w-0">
          <p className="break-words font-semibold text-rel-dark">
            {p.apellidos}, {p.nombres}
          </p>
          <p className="break-words text-xs text-rel-muted">
            {p.tipo_documento} {p.numero_documento}
            {p.cargo ? ` · ${p.cargo}` : ""}
          </p>
        </div>
      ),
    },
    {
      clave: "situacion",
      titulo: "Situación",
      valor: (p) => SITUACION[p.situacion].etiqueta,
      celda: (p) => (
        <Badge variant={SITUACION[p.situacion].variante}>
          {SITUACION[p.situacion].etiqueta}
        </Badge>
      ),
    },
    {
      clave: "avance",
      titulo: "Avance",
      valor: (p) =>
        p.obligatorias_totales === 0
          ? null
          : Math.floor((p.obligatorias_completas * 100) / p.obligatorias_totales),
      celda: (p) => (
        <Avance hechas={p.obligatorias_completas} totales={p.obligatorias_totales} />
      ),
    },
    {
      clave: "actividad",
      titulo: "Última actividad",
      valor: (p) => p.ultima_actividad,
      celda: (p) => (
        <span className="whitespace-nowrap text-sm text-rel-muted">
          {p.ultima_actividad ? formatearFecha(p.ultima_actividad) : "—"}
        </span>
      ),
    },
    {
      clave: "constancia",
      titulo: "Constancia",
      valor: (p) => p.constancia_codigo,
      celda: (p) =>
        p.constancia_codigo ? (
          <span className="whitespace-nowrap font-mono text-sm text-rel-dark">
            {p.constancia_codigo}
          </span>
        ) : (
          <span className="text-sm text-rel-muted">—</span>
        ),
    },
  ];

  return (
    <div className="space-y-6">
      <BotonVolver a="/capacitaciones/asignaciones">Volver a asignaciones</BotonVolver>

      <PageHeader
        titulo="Avance"
        icono={Users}
        descripcion={
          consulta.datos
            ? `${consulta.datos.asignacion.curso_titulo} · versión ${consulta.datos.asignacion.numero_version}`
            : "Quién entró, por dónde va y quién ya terminó."
        }
        accion={
          consulta.datos && filtradas.length > 0 ? (
            <Button variant="relOutline" onClick={descargar}>
              <Download aria-hidden="true" />
              Descargar CSV
            </Button>
          ) : null
        }
      />

      {consulta.fase === "cargando" ? <CargandoTabla /> : null}
      {consulta.fase === "error" && consulta.error ? (
        <ErrorConsulta error={consulta.error} reintentar={consulta.refrescar} />
      ) : null}

      {consulta.fase === "listo" && consulta.datos ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Contador
              etiqueta="Sin empezar"
              valor={consulta.datos.resumen.sin_empezar}
              ayuda={SITUACION.SIN_EMPEZAR.ayuda}
            />
            <Contador
              etiqueta="En curso"
              valor={consulta.datos.resumen.en_curso}
              ayuda={SITUACION.EN_CURSO.ayuda}
            />
            <Contador
              etiqueta="Completados"
              valor={consulta.datos.resumen.completados}
              ayuda={SITUACION.COMPLETADO.ayuda}
            />
            <Contador
              etiqueta="Invitación vencida"
              valor={consulta.datos.resumen.invitacion_vencida}
              ayuda={SITUACION.INVITACION_VENCIDA.ayuda}
            />
          </div>

          {!consulta.datos.hay_convocatoria ? (
            <Panel>
              <p className="font-rel-body text-sm text-rel-muted">
                Esta asignación se responde por el{" "}
                <strong className="text-rel-dark">enlace del grupo</strong>, así que
                no hay lista de convocados: aquí aparece quien entró, y no se puede
                decir cuántos faltan porque nadie declaró a quién se esperaba.
              </p>
            </Panel>
          ) : null}

          {consulta.datos.participantes.length === 0 ? (
            <SinDatos
              escena="capacitaciones"
              titulo="Todavía no hay nadie"
              descripcion={
                consulta.datos.hay_convocatoria
                  ? "Genera invitaciones para que la gente pueda entrar."
                  : "Reparte el enlace del grupo para que la gente se inscriba."
              }
            />
          ) : (
            <Panel className="space-y-4">
              <Input
                type="search"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar por nombre, documento o cargo"
                aria-label="Buscar una persona"
                className="max-w-md"
              />
              {filtradas.length === 0 ? (
                <SinResultados limpiar={() => setBusqueda("")} />
              ) : (
                <TablaDatos
                  filas={filtradas}
                  columnas={columnas}
                  claveFila={(p) => p.participante_id}
                  etiquetaElemento="personas"
                  etiquetaTabla="Avance por persona"
                />
              )}
            </Panel>
          )}
        </>
      ) : null}
    </div>
  );
}
