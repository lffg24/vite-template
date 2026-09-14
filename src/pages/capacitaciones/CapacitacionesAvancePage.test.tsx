import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";

import CapacitacionesAvancePage from "./CapacitacionesAvancePage";
import { obtenerAvance } from "@/services/capacitacionesService";
import type { AvanceAsignacion, AvanceParticipante } from "@/types/capacitaciones";

vi.mock("@/services/capacitacionesService", () => ({
  obtenerAvance: vi.fn(),
}));

function persona(over: Partial<AvanceParticipante> = {}): AvanceParticipante {
  return {
    participante_id: "p1",
    nombres: "Ana",
    apellidos: "Alvarez",
    tipo_documento: "CC",
    numero_documento: "1001",
    cargo: "Operaria",
    correo: null,
    situacion: "EN_CURSO",
    obligatorias_completas: 2,
    obligatorias_totales: 5,
    invitacion_estado: "CONSUMIDA",
    invitacion_utilizable: false,
    invitada_en: "2026-09-01T10:00:00Z",
    inscripcion_id: "i1",
    iniciada_en: "2026-09-02T10:00:00Z",
    completada_en: null,
    ultima_actividad: "2026-09-05T10:00:00Z",
    constancia_codigo: null,
    constancia_estado: null,
    constancia_vence_el: null,
    ...over,
  };
}

function avance(over: Partial<AvanceAsignacion> = {}): AvanceAsignacion {
  return {
    asignacion: {
      id: "a1",
      curso_titulo: "Inducción SST",
      numero_version: 2,
      estado: "ACTIVA",
      modo_identidad: "INVITACION_INDIVIDUAL",
      fecha_objetivo: "2026-10-01",
    },
    obligatorias_totales: 5,
    hay_convocatoria: true,
    resumen: {
      personas: 1,
      sin_empezar: 0,
      invitacion_vencida: 0,
      en_curso: 1,
      completados: 0,
      con_constancia: 0,
    },
    participantes: [persona()],
    ...over,
  };
}

function montar() {
  return render(
    <MemoryRouter initialEntries={["/capacitaciones/asignaciones/a1/avance"]}>
      <Routes>
        <Route
          path="/capacitaciones/asignaciones/:asignacionId/avance"
          element={<CapacitacionesAvancePage />}
        />
      </Routes>
    </MemoryRouter>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

/**
 * Esta pantalla cierra el hueco que el módulo tenía en medio: sabía si alguien
 * estaba invitado y sabía si ya tenía constancia, y entre esas dos cosas —que es
 * donde la gente vive durante días— no había nada.
 */
describe("Avance · quién va por dónde", () => {
  it("pinta la situación de cada persona con el nombre que se usa para actuar", async () => {
    vi.mocked(obtenerAvance).mockResolvedValue(
      avance({
        resumen: {
          personas: 4,
          sin_empezar: 1,
          invitacion_vencida: 1,
          en_curso: 1,
          completados: 1,
          con_constancia: 1,
        },
        participantes: [
          persona({ participante_id: "p1", apellidos: "Alvarez", situacion: "SIN_EMPEZAR" }),
          persona({
            participante_id: "p2",
            apellidos: "Bernal",
            numero_documento: "1002",
            situacion: "INVITACION_VENCIDA",
          }),
          persona({ participante_id: "p3", apellidos: "Castro", numero_documento: "1003" }),
          persona({
            participante_id: "p4",
            apellidos: "Duarte",
            numero_documento: "1004",
            situacion: "COMPLETADO",
            obligatorias_completas: 5,
            constancia_codigo: "ABCD-2345",
          }),
        ],
      })
    );
    montar();

    // El rotulo sale dos veces: en el contador de arriba y en la insignia de la
    // fila. Se comprueba que aparezca, no cuantas veces.
    expect(await screen.findAllByText("Sin empezar")).not.toHaveLength(0);
    // «Invitación vencida» y «sin empezar» parecen lo mismo y piden acciones
    // distintas: a uno se le recuerda, al otro hay que volver a invitarlo.
    expect(screen.getAllByText("Invitación vencida")).not.toHaveLength(0);
    expect(screen.getAllByText("En curso")).not.toHaveLength(0);
    expect(screen.getAllByText("Completado")).not.toHaveLength(0);
    expect(screen.getByText("ABCD-2345")).toBeInTheDocument();
  });

  it("el avance se lee como fracción de lo obligatorio de ESA versión", async () => {
    vi.mocked(obtenerAvance).mockResolvedValue(avance());
    montar();

    expect(await screen.findByText("2/5")).toBeInTheDocument();
    expect(
      screen.getByLabelText("2 de 5 lecciones obligatorias")
    ).toBeInTheDocument();
  });

  it("sin lecciones obligatorias NO inventa una barra", async () => {
    // Contraprueba. Una versión sin obligatorias no tiene de qué llevar cuenta,
    // y una barra al 0 % o al 100 % afirmaría algo que nadie midió.
    vi.mocked(obtenerAvance).mockResolvedValue(
      avance({
        obligatorias_totales: 0,
        participantes: [persona({ obligatorias_completas: 0, obligatorias_totales: 0 })],
      })
    );
    montar();

    await screen.findByText("Alvarez, Ana");
    expect(screen.queryByText("0/0")).not.toBeInTheDocument();
  });

  it("sin convocatoria lo dice en vez de prometer un denominador", async () => {
    // En modo autodeclarado no hay lista previa. Decir «faltan 12» sería
    // inventárselo, y un panel que se calla su incertidumbre se lee como si no
    // la tuviera.
    vi.mocked(obtenerAvance).mockResolvedValue(
      avance({
        hay_convocatoria: false,
        asignacion: { ...avance().asignacion, modo_identidad: "AUTODECLARADA" },
      })
    );
    montar();

    expect(
      await screen.findByText(/no hay lista de convocados/i)
    ).toBeInTheDocument();
  });

  it("con convocatoria NO aparece ese aviso", async () => {
    // Contraprueba del anterior: si el aviso se pintara siempre, dejaría de
    // significar algo.
    vi.mocked(obtenerAvance).mockResolvedValue(avance());
    montar();

    await screen.findByText("Alvarez, Ana");
    expect(screen.queryByText(/no hay lista de convocados/i)).not.toBeInTheDocument();
  });

  it("la búsqueda filtra por documento, no solo por nombre", async () => {
    // En una lista de nómina se busca por cédula: es el dato que llega en el
    // correo de quien pregunta.
    vi.mocked(obtenerAvance).mockResolvedValue(
      avance({
        participantes: [
          persona({ participante_id: "p1", apellidos: "Alvarez", numero_documento: "1001" }),
          persona({ participante_id: "p2", apellidos: "Bernal", numero_documento: "2002" }),
        ],
      })
    );
    montar();

    await screen.findByText("Alvarez, Ana");
    fireEvent.change(screen.getByLabelText("Buscar una persona"), {
      target: { value: "2002" },
    });

    expect(screen.getByText("Bernal, Ana")).toBeInTheDocument();
    expect(screen.queryByText("Alvarez, Ana")).not.toBeInTheDocument();
  });
});
