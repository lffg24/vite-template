// src/pages/dev/DemoTablero.tsx
//
// La muestra viva del kit de tareas, con datos de EJEMPLO con la forma de
// Licitaciones (oportunidades que terminan en GO, GO con aliado, NO GO o
// descartada). Sirve de receta: así se adapta un dominio al kit.
//
//   1. Se define el FLUJO (`COLUMNAS`).
//   2. Se adapta el dominio a `TareaVista` una vez (`aTarea`).
//   3. `alSolicitarMovimiento` decide: algunos destinos mueven de inmediato,
//      los que cierran una decisión piden motivo y justificación primero.
//
// Los datos no son de nadie ni llaman a ningún servicio.

import { useState } from "react";

import { Campo } from "@/shared/ui/Campo";
import { Desplegable } from "@/shared/ui/Desplegable";
import { Textarea } from "@/components/ui/textarea";
import {
  DialogoTransicion,
  VistaTareas,
  type ColumnaTablero,
  type TareaVista,
} from "@/shared/ui/tablero";

interface Oportunidad {
  id: string;
  codigo: string;
  entidad: string;
  objeto: string;
  valor: string;
  estado: string;
  prioridad: "critica" | "alta" | "media" | "baja";
  cierre: string;
  responsables: string[];
  sector: string;
}

const COLUMNAS: ColumnaTablero[] = [
  { id: "NUEVA", titulo: "Nuevas", tono: "info", descripcion: "Detectadas, sin revisar." },
  { id: "EN_REVISION", titulo: "En revisión", tono: "marca", limite: 3, descripcion: "Alguien está verificando requisitos." },
  { id: "GO", titulo: "GO", tono: "exito", descripcion: "Decisión: se presenta la propuesta." },
  { id: "GO_CON_ALIADO", titulo: "GO con aliado", tono: "exito", descripcion: "Se presenta junto a un aliado." },
  { id: "NO_GO", titulo: "NO GO", tono: "atencion", descripcion: "Decisión: no se presenta." },
  { id: "DESCARTADA", titulo: "Descartada", tono: "neutro", descripcion: "No aplica; se archiva." },
];

/** Los estados que CIERRAN una decisión y por eso piden motivo. */
const CIERRAN = new Set(["GO", "GO_CON_ALIADO", "NO_GO", "DESCARTADA"]);

const MOTIVOS = [
  { codigo: "CUMPLE_REQUISITOS", texto: "Cumple los requisitos habilitantes" },
  { codigo: "EXPERIENCIA_INSUFICIENTE", texto: "Experiencia insuficiente" },
  { codigo: "VALOR_FUERA_DE_RANGO", texto: "Valor fuera de nuestro rango" },
  { codigo: "PLAZO_INVIABLE", texto: "Plazo inviable" },
];

const INICIALES: Oportunidad[] = [
  { id: "1", codigo: "LIC-101", entidad: "Alcaldía de Soacha", objeto: "Programa de seguridad y salud en el trabajo para contratistas", valor: "$ 480 millones", estado: "NUEVA", prioridad: "alta", cierre: "2026-12-04", responsables: ["Laura Gómez"], sector: "Municipal" },
  { id: "2", codigo: "LIC-102", entidad: "Ecopetrol", objeto: "Auditoría del sistema de gestión HSEQ en estaciones", valor: "$ 1.250 millones", estado: "NUEVA", prioridad: "critica", cierre: "2026-11-18", responsables: [], sector: "Energía" },
  { id: "3", codigo: "LIC-098", entidad: "Gobernación de Cundinamarca", objeto: "Capacitación en alturas para 300 funcionarios", valor: "$ 210 millones", estado: "EN_REVISION", prioridad: "media", cierre: "2026-12-12", responsables: ["Andrés Pardo", "Laura Gómez"], sector: "Departamental" },
  { id: "4", codigo: "LIC-095", entidad: "Transmilenio S.A.", objeto: "Evaluación psicosocial de conductores", valor: "$ 330 millones", estado: "EN_REVISION", prioridad: "alta", cierre: "2026-12-01", responsables: ["Camila Rojas"], sector: "Transporte" },
  { id: "5", codigo: "LIC-090", entidad: "Hospital San Rafael", objeto: "Plan estratégico de seguridad vial (PESV)", valor: "$ 150 millones", estado: "GO", prioridad: "media", cierre: "2026-11-27", responsables: ["Andrés Pardo"], sector: "Salud" },
  { id: "6", codigo: "LIC-087", entidad: "Universidad Nacional", objeto: "Inspecciones de seguridad en laboratorios", valor: "$ 95 millones", estado: "NO_GO", prioridad: "baja", cierre: "2026-11-10", responsables: ["Camila Rojas"], sector: "Educación" },
];

function aTarea(o: Oportunidad): TareaVista<Oportunidad> {
  return {
    id: o.id,
    clave: o.codigo,
    titulo: `${o.entidad}: ${o.objeto}`,
    columna: o.estado,
    prioridad: o.prioridad,
    etiquetas: [{ texto: o.sector }, { texto: o.valor, tono: "info" }],
    responsables: o.responsables.map((n) => ({ id: n, nombre: n })),
    vence: o.cierre,
    comentarios: o.id === "3" ? 4 : o.id === "4" ? 2 : undefined,
    adjuntos: o.id === "3" ? 3 : undefined,
    bloqueada: o.id === "4" ? "Falta el certificado de experiencia del aliado." : undefined,
    origen: o,
  };
}

const esperar = (ms: number) => new Promise((r) => setTimeout(r, ms));

export default function DemoTablero() {
  const [datos, setDatos] = useState(INICIALES);
  const [enVuelo, setEnVuelo] = useState<ReadonlySet<string>>(new Set());
  const [pendiente, setPendiente] = useState<{ tarea: TareaVista<Oportunidad>; destino: ColumnaTablero } | null>(null);
  const [motivo, setMotivo] = useState("");
  const [justificacion, setJustificacion] = useState("");

  async function mover(id: string, estado: string) {
    setEnVuelo((s) => new Set(s).add(id));
    await esperar(600); // el servidor
    setDatos((d) => d.map((o) => (o.id === id ? { ...o, estado } : o)));
    setEnVuelo((s) => {
      const n = new Set(s);
      n.delete(id);
      return n;
    });
  }

  function solicitar(tarea: TareaVista<Oportunidad>, destino: ColumnaTablero) {
    if (CIERRAN.has(destino.id)) {
      setMotivo("");
      setJustificacion("");
      setPendiente({ tarea, destino });
    } else {
      void mover(tarea.id, destino.id);
    }
  }

  return (
    <>
      <VistaTareas
        columnas={COLUMNAS}
        tareas={datos.map(aTarea)}
        alSolicitarMovimiento={solicitar}
        enVuelo={enVuelo}
        claveMemoria="demo-tablero-vista"
        nombreElemento="oportunidades"
        detalle={(t) => ({
          descripcion: t.origen?.objeto,
          campos: [
            { etiqueta: "Entidad", valor: t.origen?.entidad },
            { etiqueta: "Valor estimado", valor: t.origen?.valor },
            { etiqueta: "Sector", valor: t.origen?.sector },
          ],
          actividad: [
            { id: "a1", autor: "Laura Gómez", texto: "asignó la oportunidad a Andrés Pardo", cuando: "hace 2 días" },
            { id: "a2", autor: "Sistema", texto: "detectó la oportunidad en el portal de compras", cuando: "12 nov" },
          ],
        })}
      />

      <DialogoTransicion
        abierto={pendiente !== null}
        alCerrar={() => setPendiente(null)}
        titulo={pendiente ? `Mover a «${pendiente.destino.titulo}»` : "Mover"}
        descripcion="Cerrar una decisión exige un motivo y una justificación. Queda en el historial."
        textoConfirmar="Cerrar decisión"
        valido={motivo !== "" && justificacion.trim().length >= 5}
        alConfirmar={async () => {
          if (!pendiente) return;
          await mover(pendiente.tarea.id, pendiente.destino.id);
          setPendiente(null);
        }}
      >
        <Campo id="demo-motivo" etiqueta="Motivo" obligatorio>
          <Desplegable value={motivo} onChange={(e) => setMotivo(e.target.value)}>
            <option value="">Elige un motivo</option>
            {MOTIVOS.map((m) => (
              <option key={m.codigo} value={m.codigo}>
                {m.texto}
              </option>
            ))}
          </Desplegable>
        </Campo>
        <Campo id="demo-justificacion" etiqueta="Justificación" obligatorio ayuda="Mínimo 5 caracteres.">
          <Textarea rows={4} value={justificacion} onChange={(e) => setJustificacion(e.target.value)} />
        </Campo>
      </DialogoTransicion>
    </>
  );
}
